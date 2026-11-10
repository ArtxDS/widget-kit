import type { ActionAccess, ActionRisk } from "./actions";
import { createAssistantError, type AssistantError } from "./errors";
import type { AssistantEvent } from "./events";
import {
  normalizeToolCallStatus,
  resolveTextFormat,
  type ChatMessage,
  type MessagePart,
  type ToolCallMessagePart,
  type ToolResultMessagePart,
  type ToolResultStatus,
} from "./messages";
import { sanitizeContext } from "./validation";

export type AssistantStatus =
  | "idle"
  | "submitting"
  | "thinking"
  | "streaming"
  | "executing-tool"
  | "awaiting-confirmation"
  | "error";

export type AssistantPendingConfirmation = {
  toolCallId: string;
  name: string;
  input?: unknown;
  access?: ActionAccess;
  description?: string;
  risk: ActionRisk;
};

export type AssistantSnapshot = {
  readonly status: AssistantStatus;
  readonly messages: readonly ChatMessage[];
  readonly activeRunId: string | null;
  readonly error: AssistantError | null;
  readonly pendingConfirmation: AssistantPendingConfirmation | null;
  readonly context: Readonly<Record<string, unknown>>;
};

export type AssistantStateAction =
  | { type: "begin-run" }
  | { type: "mark-thinking" }
  | { type: "append-message"; message: ChatMessage }
  | { type: "remove-messages"; ids: readonly string[] }
  | { type: "event"; event: AssistantEvent }
  | { type: "fail"; error: AssistantError }
  | { type: "cancel" }
  | { type: "cancel-tool" }
  | { type: "resolve-confirmation"; approved: boolean }
  | {
      type: "reset";
      messages?: readonly ChatMessage[];
      context?: Record<string, unknown>;
    }
  | { type: "set-context"; context: Record<string, unknown> }
  | { type: "clear-context" };


function freezeValue(value: unknown, seen: WeakSet<object> = new WeakSet()): unknown {
  if (value === null || typeof value !== "object") return value;
  const objectValue = value as object;
  if (seen.has(objectValue)) return value;
  seen.add(objectValue);

  if (Array.isArray(value)) {
    for (const item of value) freezeValue(item, seen);
  } else {
    for (const key of Object.keys(value as Record<string, unknown>)) {
      freezeValue((value as Record<string, unknown>)[key], seen);
    }
  }

  Object.freeze(value);
  return value;
}

export function freezeAssistantSnapshot(
  snapshot: AssistantSnapshot,
): AssistantSnapshot {
  return freezeValue(snapshot) as AssistantSnapshot;
}

export function createAssistantSnapshot(
  messages: readonly ChatMessage[] = [],
  context: Record<string, unknown> = {},
): AssistantSnapshot {
  return freezeAssistantSnapshot({
    status: "idle",
    messages: [...messages],
    activeRunId: null,
    error: null,
    pendingConfirmation: null,
    context: sanitizeContext(context),
  } as AssistantSnapshot);
}

function updateMessage(
  state: AssistantSnapshot,
  messageId: string,
  update: (message: ChatMessage | undefined) => ChatMessage | undefined,
): AssistantSnapshot {
  const index = state.messages.findIndex((message) => message.id === messageId);
  if (index === -1) {
    const next = update(undefined);
    return next ? { ...state, messages: [...state.messages, next] } : state;
  }

  const current = state.messages[index];
  const next = update(current);
  if (!next || next === current) return state;

  const messages = state.messages.slice();
  messages[index] = next;
  return { ...state, messages };
}

function lastAssistantMessage(
  state: AssistantSnapshot,
): ChatMessage | undefined {
  for (let index = state.messages.length - 1; index >= 0; index -= 1) {
    if (state.messages[index].role === "assistant") {
      return state.messages[index];
    }
  }
  return undefined;
}

function upsertPart(
  parts: readonly MessagePart[],
  next: MessagePart,
): readonly MessagePart[] {
  const index = parts.findIndex((part) => part.id === next.id);
  if (index === -1) return [...parts, next];
  const updated = parts.slice();
  updated[index] = next;
  return updated;
}

function completeStreamingMessages(
  state: AssistantSnapshot,
  status: "complete" | "error",
): AssistantSnapshot {
  let changed = false;
  const messages = state.messages.map((message) => {
    if (message.status !== "streaming") return message;
    changed = true;
    return { ...message, status };
  });
  return changed ? { ...state, messages } : state;
}

function statusAfterToolResult(state: AssistantSnapshot): AssistantStatus {
  if (
    state.status === "executing-tool" ||
    state.status === "awaiting-confirmation"
  ) {
    return "thinking";
  }
  return state.status;
}

function stateAfterEvent(
  state: AssistantSnapshot,
  event: AssistantEvent,
): AssistantSnapshot {
  switch (event.type) {
    case "run-start":
      return {
        ...state,
        status: state.status === "submitting" ? "thinking" : state.status,
        activeRunId: event.runId,
      };

    case "message-start": {
      const next = updateMessage(state, event.messageId, (message) => {
        if (message) {
          return message.status === "streaming"
            ? message
            : { ...message, status: "streaming" };
        }
        return {
          id: event.messageId,
          role: "assistant",
          parts: [],
          status: "streaming",
        };
      });
      return {
        ...next,
        status:
          next.status === "idle" || next.status === "submitting"
            ? "thinking"
            : next.status,
      };
    }

    case "part-start": {
      const next = updateMessage(state, event.messageId, (message) => {
        const base = message ?? {
          id: event.messageId,
          role: "assistant" as const,
          parts: [],
          status: "streaming" as const,
        };
        const part: MessagePart =
          event.part.type === "text"
            ? {
                ...event.part,
                format: resolveTextFormat(base.role, event.part.format),
              }
            : event.part;
        return {
          ...base,
          status: base.status === "complete" ? "complete" : "streaming",
          parts: upsertPart(base.parts, part),
        };
      });
      if (event.part.type === "tool-call") {
        return { ...next, status: "executing-tool" };
      }
      return {
        ...next,
        status:
          event.part.type === "text" && event.part.text.length > 0
            ? "streaming"
            : next.status === "streaming"
              ? "streaming"
              : "thinking",
      };
    }

    case "text-delta":
      return {
        ...updateMessage(state, event.messageId, (message) => {
          const base = message ?? {
            id: event.messageId,
            role: "assistant" as const,
            parts: [],
            status: "streaming" as const,
          };
          const index = base.parts.findIndex(
            (part) => part.id === event.partId,
          );
          if (index === -1) {
            return {
              ...base,
              status: "streaming",
              parts: [
                ...base.parts,
                {
                  type: "text",
                  id: event.partId,
                  text: event.delta,
                  format: resolveTextFormat(base.role),
                },
              ],
            };
          }

          const part = base.parts[index];
          if (part.type !== "text") return base;

          const parts = base.parts.slice();
          parts[index] = {
            ...part,
            text: part.text + event.delta,
            format: part.format ?? resolveTextFormat(base.role),
          };
          return { ...base, status: "streaming", parts };
        }),
        status: "streaming",
      };

    case "message-end":
      return {
        ...updateMessage(state, event.messageId, (message) => {
          if (!message || message.status === "complete") return undefined;
          return { ...message, status: "complete" };
        }),
        status: state.status === "streaming" ? "thinking" : state.status,
      };

    case "tool-call": {
      const needsConfirmation =
        event.access === "write" || event.risk === "high";
      const messageId =
        event.messageId ??
        lastAssistantMessage(state)?.id ??
        `tool-${event.toolCallId}`;
      const next = updateMessage(state, messageId, (message) => {
        const base = message ?? {
          id: messageId,
          role: "assistant" as const,
          parts: [],
          status: "streaming" as const,
        };
        const part: ToolCallMessagePart = {
          type: "tool-call",
          id: `tool-call-${event.toolCallId}`,
          toolCallId: event.toolCallId,
          name: event.name,
          input: event.input,
          access: event.access,
          description: event.description,
          status: needsConfirmation ? "pending" : "running",
        };
        return {
          ...base,
          status: base.status === "complete" ? "complete" : "streaming",
          parts: upsertPart(base.parts, part),
        };
      });

      if (needsConfirmation) {
        return {
          ...next,
          status: "awaiting-confirmation",
          pendingConfirmation: {
            toolCallId: event.toolCallId,
            name: event.name,
            input: event.input,
            access: event.access,
            description: event.description,
            risk: event.risk ?? "high",
          },
        };
      }

      return {
        ...next,
        status: "executing-tool",
        pendingConfirmation: null,
      };
    }

    case "tool-result": {
      const targetId =
        event.messageId ??
        state.messages.find((message) =>
          message.parts.some(
            (part) =>
              part.type === "tool-call" && part.toolCallId === event.toolCallId,
          ),
        )?.id;
      const resultStatus: ToolResultStatus = normalizeToolCallStatus(
        event.status ?? (event.isError ? "failed" : "completed"),
      ) as ToolResultStatus;
      const resultPart: ToolResultMessagePart = {
        type: "tool-result",
        id: `tool-result-${event.toolCallId}`,
        toolCallId: event.toolCallId,
        name: event.name,
        output: event.output,
        status: resultStatus,
        isError: resultStatus === "failed",
        error: event.error,
      };

      if (!targetId) {
        const messageId = `tool-result-${event.toolCallId}`;
        const next = updateMessage(state, messageId, () => ({
          id: messageId,
          role: "tool",
          parts: [resultPart],
          status: "complete",
        }));
        return {
          ...next,
          status: statusAfterToolResult(next),
          pendingConfirmation:
            next.pendingConfirmation?.toolCallId === event.toolCallId
              ? null
              : next.pendingConfirmation,
        };
      }

      const next = updateMessage(state, targetId, (message) => {
        if (!message) return undefined;
        const parts = message.parts.map((part) =>
          part.type === "tool-call" && part.toolCallId === event.toolCallId
            ? {
                ...part,
                status: resultStatus,
              }
            : part,
        );
        return {
          ...message,
          parts: upsertPart(parts, resultPart),
        };
      });

      return {
        ...next,
        status: statusAfterToolResult(next),
        pendingConfirmation:
          next.pendingConfirmation?.toolCallId === event.toolCallId
            ? null
            : next.pendingConfirmation,
      };
    }

    case "error":
      return completeStreamingMessages(
        {
          ...state,
          status: "error",
          error: event.error,
          pendingConfirmation: null,
        },
        "error",
      );

    case "run-end": {
      if (event.status === "error") {
        const next = completeStreamingMessages(state, "error");
        return {
          ...next,
          status: "error",
          activeRunId: null,
          pendingConfirmation: null,
          error:
            state.error ??
            createAssistantError(
              "transport",
              "Assistant run ended with an error.",
              { retryable: true },
            ),
        };
      }

      return {
        ...completeStreamingMessages(state, "complete"),
        status: "idle",
        activeRunId: null,
        error: null,
        pendingConfirmation: null,
      };
    }

    default:
      return state;
  }
}

export function reduceAssistantState(
  state: AssistantSnapshot,
  action: AssistantStateAction,
): AssistantSnapshot {
  const result = (() => {
    switch (action.type) {
    case "begin-run":
      return {
        ...state,
        status: "submitting",
        activeRunId: null,
        error: null,
        pendingConfirmation: null,
      };

    case "mark-thinking":
      return { ...state, status: "thinking" };

    case "append-message":
      return { ...state, messages: [...state.messages, action.message] };

    case "remove-messages": {
      if (action.ids.length === 0) return state;
      const ids = new Set(action.ids);
      const messages = state.messages.filter((message) => !ids.has(message.id));
      return messages.length === state.messages.length
        ? state
        : { ...state, messages };
    }

    case "event":
      return stateAfterEvent(state, action.event);

    case "fail":
      return completeStreamingMessages(
        {
          ...state,
          status: "error",
          error: action.error,
          activeRunId: null,
          pendingConfirmation: null,
        },
        "error",
      );

    case "cancel":
      return completeStreamingMessages(
        {
          ...state,
          status: "idle",
          error: null,
          activeRunId: null,
          pendingConfirmation: null,
        },
        "complete",
      );

    case "cancel-tool": {
      const pending = state.pendingConfirmation;
      const targetId = pending
        ? state.messages.findIndex((message) =>
            message.parts.some(
              (part) =>
                part.type === "tool-call" &&
                part.toolCallId === pending.toolCallId,
            ),
          )
        : -1;
      let next = state;
      if (targetId !== -1) {
        next = updateMessage(state, state.messages[targetId].id, (message) => {
          if (!message) return undefined;
          return {
            ...message,
            parts: message.parts.map((part) =>
              part.type === "tool-call" &&
              part.toolCallId === pending?.toolCallId
                ? { ...part, status: "cancelled" }
                : part,
            ),
          };
        });
      }
      return {
        ...next,
        status: "thinking",
        pendingConfirmation: null,
      };
    }

    case "resolve-confirmation": {
      const pending = state.pendingConfirmation;
      if (!pending) return state;

      const target = state.messages.find((message) =>
        message.parts.some(
          (part) =>
            part.type === "tool-call" && part.toolCallId === pending.toolCallId,
        ),
      );
      const next = target
        ? updateMessage(state, target.id, (message) => {
            if (!message) return undefined;
            return {
              ...message,
              parts: message.parts.map((part) =>
                part.type === "tool-call" &&
                part.toolCallId === pending.toolCallId
                  ? {
                      ...part,
                      status: action.approved
                        ? ("running" as const)
                        : ("cancelled" as const),
                    }
                  : part,
              ),
            };
          })
        : state;

      return {
        ...next,
        status: action.approved ? "executing-tool" : "thinking",
        pendingConfirmation: null,
      };
    }

    case "set-context": {
      const sanitized = sanitizeContext(action.context);
      const merged = Object.freeze({ ...state.context, ...sanitized });
      return { ...state, context: merged };
    }

    case "clear-context": {
      return { ...state, context: Object.freeze({}) };
    }

    case "reset": {
      const nextMessages = action.messages ?? [];
      const nextContext =
        action.context !== undefined
          ? sanitizeContext(action.context)
          : state.context;
      return createAssistantSnapshot(nextMessages, nextContext);
    }

    default:
      return state;
    }
  })();
  return freezeAssistantSnapshot(result as AssistantSnapshot);
}
