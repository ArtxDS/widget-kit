import {
  ASSISTANT_PROTOCOL_VERSION,
  type AssistantRequest,
} from "../core/transport";
import {
  createAssistantError,
  isAssistantError,
  type AssistantError,
} from "../core/errors";
import {
  isAssistantEvent,
  type AssistantEvent,
} from "../core/events";
import {
  type ChatMessage,
  type TextMessagePart,
} from "../core/messages";
import {
  createAssistantSnapshot,
  reduceAssistantState,
  type AssistantStateAction,
} from "../core/state";
import { isRecord, sanitizeTriggerContext } from "../core/validation";
import {
  type AnyActionDefinition,
  isActionDefinition,
} from "../core/actions";
import type {
  AssistantInput,
  AssistantRuntime,
  AssistantRuntimeOptions,
  AssistantTriggerContext,
} from "./types";

type ActiveRun = {
  generation: number;
  controller: AbortController;
  request: AssistantRequest;
  assistantMessageIds: Set<string>;
};

type FailedRun = {
  request: AssistantRequest;
  assistantMessageIds: readonly string[];
};

type PendingToolConfirmation = {
  toolCallId: string;
  token: number;
  resolved: boolean;
  resolve: (approved: boolean) => void;
};

type ActiveToolExecution = {
  toolCallId: string;
  token: number;
  cancelled: boolean;
  controller: AbortController;
};

const KNOWN_EVENT_TYPES = new Set<AssistantEvent["type"]>([
  "run-start",
  "message-start",
  "part-start",
  "text-delta",
  "message-end",
  "tool-call",
  "tool-result",
  "error",
  "run-end",
]);

type ToolTerminalStatus = "completed" | "failed" | "cancelled";

function toAssistantError(error: unknown): AssistantError {
  if (isAssistantError(error)) return error;

  if (error instanceof Error) {
    if (error.name === "AbortError") {
      return createAssistantError("aborted", "Assistant request aborted.", {
        cause: error,
      });
    }
    return createAssistantError("transport", error.message, {
      retryable: true,
      cause: error,
    });
  }

  return createAssistantError("unknown", "Unknown assistant transport error.", {
    cause: error,
  });
}

function hasRunEnded(event: AssistantEvent): boolean {
  return event.type === "run-end";
}

function validateToolInput(
  tool: AnyActionDefinition,
  input: unknown,
): { ok: true; value: unknown } | { ok: false; message?: string; details?: Record<string, unknown> } {
  if (!tool.validate) {
    return { ok: true, value: input };
  }

  const result = tool.validate(input);
  if (!result.ok) {
    return { ok: false, message: result.message, details: result.details };
  }
  return { ok: true, value: result.value };
}

export function createAssistantRuntime({
  transport,
  initialMessages = [],
  context,
  createId,
  now,
  tools = [],
}: AssistantRuntimeOptions): AssistantRuntime {
  let state = createAssistantSnapshot(initialMessages);
  let activeRun: ActiveRun | null = null;
  let failedRun: FailedRun | null = null;
  let generation = 0;
  let disposed = false;
  let localId = 0;
  const listeners = new Set<() => void>();
  const toolsByName = new Map<string, AnyActionDefinition>();
  let pendingToolConfirmation: PendingToolConfirmation | null = null;
  let activeToolExecution: ActiveToolExecution | null = null;
  let handledToolCalls = new Set<string>();
  let dynamicContext: AssistantTriggerContext = {};

  for (const tool of tools) {
    if (!isActionDefinition(tool)) {
      throw new TypeError("Runtime tools must be valid action definitions.");
    }
    if (toolsByName.has(tool.name)) {
      throw new TypeError(`Duplicate tool definition: ${tool.name}.`);
    }
    toolsByName.set(tool.name, tool);
  }

  const makeId = createId ?? (() => `assistant-local-${(localId += 1)}`);
  const getNow = now ?? (() => new Date().toISOString());

  function emit(): void {
    if (disposed) return;
    for (const listener of [...listeners]) listener();
  }

  function update(action: AssistantStateAction): void {
    if (disposed) return;
    const next = reduceAssistantState(state, action);
    if (next === state) return;
    state = next;
    emit();
  }

  function isStale(run: ActiveRun): boolean {
    return disposed || run.generation !== generation;
  }

  function resolveContext(): Record<string, unknown> | undefined {
    const base = typeof context === "function" ? context() : context;
    const sanitizedBase = base ? sanitizeTriggerContext(base) : {};
    const merged = { ...sanitizedBase, ...dynamicContext };
    return Object.keys(merged).length > 0 ? merged : undefined;
  }

  function setContext(
    updater:
      | AssistantTriggerContext
      | ((prev: AssistantTriggerContext) => AssistantTriggerContext),
  ): void {
    if (disposed) return;
    const next =
      typeof updater === "function" ? updater(dynamicContext) : updater;
    dynamicContext = sanitizeTriggerContext(next);
    emit();
  }

  function getContext(): AssistantTriggerContext {
    return { ...dynamicContext };
  }

  function clearContext(): void {
    if (disposed) return;
    dynamicContext = {};
    emit();
  }

  function makeRequest(messages: readonly ChatMessage[]): AssistantRequest {
    const resolved = resolveContext();
    return {
      protocolVersion: ASSISTANT_PROTOCOL_VERSION,
      messages,
      ...(resolved ? { context: resolved } : {}),
    };
  }

  function createUserMessage(input: AssistantInput): ChatMessage {
    const text = typeof input === "string" ? input : input.text;
    const metadata = typeof input === "string" ? undefined : input.metadata;
    if (text.trim().length === 0) {
      throw new Error("Assistant message text cannot be empty.");
    }

    const messageId = makeId();
    const part: TextMessagePart = {
      type: "text",
      id: makeId(),
      text,
      format: "plain",
    };

    return {
      id: messageId,
      role: "user",
      parts: [part],
      createdAt: getNow(),
      ...(metadata ? { metadata } : {}),
    };
  }

  function trackNewMessages(run: ActiveRun, beforeIds: Set<string>): void {
    for (const message of state.messages) {
      if (!beforeIds.has(message.id)) {
        run.assistantMessageIds.add(message.id);
      }
    }
  }

  function findToolCallMessageId(toolCallId: string): string | undefined {
    return (
      state.messages.find((message) =>
        message.parts.some(
          (part) =>
            part.type === "tool-call" && part.toolCallId === toolCallId,
        ),
      )?.id
    );
  }

  function dispatchToolResult({
    toolCallId,
    messageId,
    status,
    output,
    error,
    name,
    generation: dispatchGeneration,
  }: {
    toolCallId: string;
    messageId: string;
    status: ToolTerminalStatus;
    output?: unknown;
    error?: AssistantError;
    name?: string;
    generation?: number;
  }): void {
    if (disposed) return;
    if (
      dispatchGeneration !== undefined &&
      dispatchGeneration !== generation
    ) {
      return;
    }
    const targetId = messageId ?? findToolCallMessageId(toolCallId);
    if (!targetId) return;
    update({
      type: "event",
      event: {
        type: "tool-result",
        toolCallId,
        messageId: targetId,
        name,
        output,
        status,
        isError: status === "failed",
        error,
      },
    });
  }

  function failRun(run: ActiveRun, error: AssistantError): void {
    update({ type: "fail", error });
    failedRun = {
      request: run.request,
      assistantMessageIds: [...run.assistantMessageIds],
    };
  }

  function startRun(
    request: AssistantRequest,
    options: {
      userMessage?: ChatMessage;
      removeMessageIds?: readonly string[];
    } = {},
  ): ActiveRun {
    const run: ActiveRun = {
      generation: (generation += 1),
      controller: new AbortController(),
      request,
      assistantMessageIds: new Set(),
    };
    activeRun = run;
    handledToolCalls = new Set();

    if (options.removeMessageIds && options.removeMessageIds.length > 0) {
      update({
        type: "remove-messages",
        ids: options.removeMessageIds,
      });
    }
    if (options.userMessage) {
      update({ type: "append-message", message: options.userMessage });
    }
    update({ type: "begin-run" });

    return run;
  }

  function requestConfirmation(toolCallId: string): Promise<boolean> {
    const token = generation;
    return new Promise<boolean>((resolve) => {
      pendingToolConfirmation = {
        toolCallId,
        token,
        resolved: false,
        resolve,
      };
    });
  }

  async function executeToolCall(
    run: ActiveRun,
    event: Extract<AssistantEvent, { type: "tool-call" }>,
    tool: AnyActionDefinition,
  ): Promise<void> {
    const toolCallId = event.toolCallId;
    const messageId = event.messageId ?? findToolCallMessageId(toolCallId);
    if (!messageId) return;

    const validation = validateToolInput(tool, event.input);
    if (!validation.ok) {
      dispatchToolResult({
        toolCallId,
        messageId,
        status: "failed",
        error: createAssistantError(
          "action",
          validation.message ?? `Invalid parameters for tool ${tool.name}.`,
          { details: validation.details },
        ),
        name: tool.name,
        generation: run.generation,
      });
      return;
    }

    const access: "read" | "write" = tool.access ?? "write";
    if (access === "write") {
      const approved = await requestConfirmation(toolCallId);
      if (!approved) {
        dispatchToolResult({
          toolCallId,
          messageId,
          status: "cancelled",
          name: tool.name,
        });
        return;
      }
    }

    const token = generation;
    const controller = new AbortController();
    let cancelled = false;
    const onRunAbort = () => {
      cancelled = true;
      controller.abort();
    };
    run.controller.signal.addEventListener("abort", onRunAbort, {
      once: true,
    });
    activeToolExecution = { toolCallId, token, cancelled: false, controller };

    try {
      const outcome = await tool.execute(validation.value as never, {
        signal: controller.signal,
        toolCallId,
        runId: state.activeRunId ?? undefined,
      });

      if (
        cancelled ||
        controller.signal.aborted ||
        isStale(run) ||
        !findToolCallMessageId(toolCallId)
      ) {
        dispatchToolResult({
          toolCallId,
          messageId,
          status: "cancelled",
          name: tool.name,
        });
        return;
      }

      if (outcome.ok) {
        dispatchToolResult({
          toolCallId,
          messageId,
          status: "completed",
          output: outcome.value,
          name: tool.name,
        });
      } else {
        dispatchToolResult({
          toolCallId,
          messageId,
          status: "failed",
          error: outcome.error,
          name: tool.name,
        });
      }
    } catch (error) {
      if (
        cancelled ||
        controller.signal.aborted ||
        isStale(run) ||
        !findToolCallMessageId(toolCallId)
      ) {
        dispatchToolResult({
          toolCallId,
          messageId,
          status: "cancelled",
          name: tool.name,
        });
        return;
      }
      dispatchToolResult({
        toolCallId,
        messageId,
        status: "failed",
        error: toAssistantError(error),
        name: tool.name,
        generation: run.generation,
      });
    } finally {
      run.controller.signal.removeEventListener("abort", onRunAbort);
      if (
        activeToolExecution?.toolCallId === toolCallId &&
        activeToolExecution?.token === token
      ) {
        activeToolExecution = null;
      }
    }
  }

  async function executeRun(run: ActiveRun): Promise<void> {
    try {
      await Promise.resolve();
      if (isStale(run)) return;

      update({ type: "mark-thinking" });
      const stream = transport.send(run.request, {
        signal: run.controller.signal,
      });

      for await (const rawEvent of stream) {
        if (isStale(run)) return;
        if (!isRecord(rawEvent) || typeof rawEvent.type !== "string") {
          failRun(
            run,
            createAssistantError(
              "invalid-event",
              "Transport emitted a malformed assistant event.",
            ),
          );
          return;
        }

        const eventType = rawEvent.type;
        if (!KNOWN_EVENT_TYPES.has(eventType as AssistantEvent["type"])) {
          continue;
        }

        if (!isAssistantEvent(rawEvent)) {
          failRun(
            run,
            createAssistantError(
              "invalid-event",
              `Transport emitted an invalid ${eventType} event.`,
            ),
          );
          return;
        }

        let event = rawEvent;
        if (event.type === "tool-call") {
          const tool = toolsByName.get(event.name);
          event = tool
            ? {
                ...event,
                access: tool.access ?? "write",
                description: tool.description,
                risk: event.risk ?? tool.risk,
              }
            : event;
        }

        if (event.type === "tool-result" && handledToolCalls.has(event.toolCallId)) {
          continue;
        }

        const beforeIds = new Set(state.messages.map((message) => message.id));
        update({ type: "event", event });
        trackNewMessages(run, beforeIds);

        if (event.type === "tool-call") {
          if (handledToolCalls.has(event.toolCallId)) {
            continue;
          }
          const tool = toolsByName.get(event.name);
          if (tool) {
            handledToolCalls.add(event.toolCallId);
            await executeToolCall(run, event, tool);
            continue;
          }
        }

        if (hasRunEnded(rawEvent)) {
          if (state.status === "error") {
            failedRun = {
              request: run.request,
              assistantMessageIds: [...run.assistantMessageIds],
            };
          }
          return;
        }
      }

      if (isStale(run)) return;
      if (state.status === "error") {
        failedRun = {
          request: run.request,
          assistantMessageIds: [...run.assistantMessageIds],
        };
        return;
      }

      failRun(
        run,
        createAssistantError(
          "invalid-response",
          "Transport stream ended before run-end.",
          { retryable: true },
        ),
      );
    } catch (error) {
      if (isStale(run) || run.controller.signal.aborted) return;
      failRun(run, toAssistantError(error));
    } finally {
      if (activeRun === run) activeRun = null;
    }
  }

  async function send(input: AssistantInput): Promise<void> {
    if (disposed) {
      throw new Error("Assistant runtime is disposed.");
    }
    if (activeRun) {
      throw new Error("Assistant runtime is already processing a message.");
    }

    const message = createUserMessage(input);
    const request = makeRequest([...state.messages, message]);
    failedRun = null;

    const run = startRun(request, { userMessage: message });
    await executeRun(run);
  }

  function cancel(): void {
    const run = activeRun;
    if (!run) return;

    if (
      pendingToolConfirmation &&
      !pendingToolConfirmation.resolved
    ) {
      pendingToolConfirmation.resolved = true;
      pendingToolConfirmation.resolve(false);
      pendingToolConfirmation = null;
    }

    const execution = activeToolExecution;
    if (execution && !execution.cancelled) {
      execution.cancelled = true;
      execution.controller.abort();
      const messageId = findToolCallMessageId(execution.toolCallId);
      if (messageId) {
        dispatchToolResult({
          toolCallId: execution.toolCallId,
          messageId,
          status: "cancelled",
          generation: run.generation,
        });
      }
    }

    generation += 1;
    run.controller.abort();
    activeRun = null;
    failedRun = null;
    update({ type: "cancel" });
  }

  async function retry(): Promise<void> {
    if (disposed) {
      throw new Error("Assistant runtime is disposed.");
    }
    if (activeRun) {
      throw new Error("Assistant runtime is already processing a message.");
    }
    if (!failedRun) {
      throw new Error("Assistant runtime has no failed run to retry.");
    }

    const failed = failedRun;
    failedRun = null;
    const run = startRun(failed.request, {
      removeMessageIds: failed.assistantMessageIds,
    });
    await executeRun(run);
  }

  function reset(messages: readonly ChatMessage[] = []): void {
    if (disposed) return;
    if (pendingToolConfirmation) {
      pendingToolConfirmation = null;
    }
    if (activeToolExecution) {
      activeToolExecution.cancelled = true;
      activeToolExecution.controller.abort();
      activeToolExecution = null;
    }
    generation += 1;
    activeRun?.controller.abort();
    activeRun = null;
    failedRun = null;
    handledToolCalls = new Set();
    update({ type: "reset", messages });
  }

  function confirm(approved: boolean): void {
    if (disposed) return;
    const pending = pendingToolConfirmation;
    if (pending) {
      if (pending.resolved) return;
      pending.resolved = true;
      pendingToolConfirmation = null;
      update({ type: "resolve-confirmation", approved });
      pending.resolve(approved);
      return;
    }
    update({ type: "resolve-confirmation", approved });
  }

  function cancelAction(toolCallId: string): void {
    if (disposed) return;
    const pending = pendingToolConfirmation;
    if (pending && pending.toolCallId === toolCallId && !pending.resolved) {
      pending.resolved = true;
      pendingToolConfirmation = null;
      pending.resolve(false);
      return;
    }

    const execution = activeToolExecution;
    if (execution && execution.toolCallId === toolCallId && !execution.cancelled) {
      execution.cancelled = true;
      execution.controller.abort();
      const messageId = findToolCallMessageId(toolCallId);
      if (messageId) {
        dispatchToolResult({
          toolCallId,
          messageId,
          status: "cancelled",
        });
      }
    }
  }

  function subscribe(listener: () => void): () => void {
    if (disposed) return () => undefined;
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  function dispose(): void {
    if (disposed) return;
    disposed = true;
    generation += 1;

    if (pendingToolConfirmation && !pendingToolConfirmation.resolved) {
      pendingToolConfirmation.resolved = true;
      pendingToolConfirmation.resolve(false);
      pendingToolConfirmation = null;
    }

    if (activeToolExecution && !activeToolExecution.cancelled) {
      activeToolExecution.cancelled = true;
      activeToolExecution.controller.abort();
      activeToolExecution = null;
    }

    activeRun?.controller.abort();
    activeRun = null;
    failedRun = null;
    dynamicContext = {};
    handledToolCalls = new Set();
    listeners.clear();
  }

  return {
    getSnapshot() {
      return state;
    },
    subscribe,
    send,
    cancel,
    retry,
    reset,
    confirm,
    cancelAction,
    dispose,
    setContext,
    getContext,
    clearContext,
  };
}
