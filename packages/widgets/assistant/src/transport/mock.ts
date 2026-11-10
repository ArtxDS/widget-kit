import type { AssistantError } from "../core/errors";
import {
  isAssistantEvent,
  type AssistantEvent,
} from "../core/events";
import type {
  AssistantRequest,
  AssistantSendOptions,
  AssistantTransport,
} from "../core/transport";
import {
  abortableDelay,
  isAsyncIterable,
  throwIfAborted,
} from "./utils";

export type MockTransportScript =
  | string
  | readonly AssistantEvent[]
  | ((
      request: AssistantRequest,
      callIndex: number,
    ) => string | readonly AssistantEvent[] | AsyncIterable<AssistantEvent>);

export type MockTransportOptions = {
  script?:
    | MockTransportScript
    | readonly MockTransportScript[];
  delayMs?: number | ((event: AssistantEvent, index: number) => number);
  chunkSize?: number;
  error?:
    | AssistantError
    | ((
        request: AssistantRequest,
        callIndex: number,
      ) => AssistantError | undefined);
};

const DEFAULT_TEXT = "Mock assistant response.";
const DEFAULT_CHUNK_SIZE = 24;

function isEventList(
  value: readonly unknown[],
): value is readonly AssistantEvent[] {
  return value.every(isAssistantEvent);
}

function chunkText(text: string, chunkSize: number): readonly string[] {
  const size =
    Number.isFinite(chunkSize) && chunkSize > 0
      ? Math.floor(chunkSize)
      : DEFAULT_CHUNK_SIZE;
  const characters = Array.from(text);
  if (characters.length === 0) return [];

  const chunks: string[] = [];
  for (let index = 0; index < characters.length; index += size) {
    chunks.push(characters.slice(index, index + size).join(""));
  }
  return chunks;
}

function textEvents(
  text: string,
  callIndex: number,
  chunkSize: number,
): readonly AssistantEvent[] {
  const runId = `mock-run-${callIndex + 1}`;
  const messageId = `mock-message-${callIndex + 1}`;
  const partId = `mock-text-${callIndex + 1}`;

  return [
    { type: "run-start", runId },
    { type: "message-start", messageId, role: "assistant" },
    {
      type: "part-start",
      messageId,
      part: { type: "text", id: partId, text: "", format: "plain" },
    },
    ...chunkText(text, chunkSize).map(
      (delta): AssistantEvent => ({
        type: "text-delta",
        messageId,
        partId,
        delta,
      }),
    ),
    { type: "message-end", messageId },
    { type: "run-end", runId, status: "completed" },
  ];
}

type ScriptValue =
  | MockTransportScript
  | readonly MockTransportScript[]
  | AsyncIterable<AssistantEvent>
  | undefined;

async function resolveScriptValue(
  value: ScriptValue,
  request: AssistantRequest,
  callIndex: number,
  chunkSize: number,
): Promise<readonly AssistantEvent[] | AsyncIterable<AssistantEvent>> {
  if (value === undefined) {
    return textEvents(DEFAULT_TEXT, callIndex, chunkSize);
  }
  if (isAsyncIterable<AssistantEvent>(value)) return value;
  if (typeof value === "string") {
    return textEvents(value, callIndex, chunkSize);
  }
  if (typeof value === "function") {
    return resolveScriptValue(
      await value(request, callIndex),
      request,
      callIndex,
      chunkSize,
    );
  }
  if (!Array.isArray(value)) return [];

  if (isEventList(value)) return value;
  const scripts = value as readonly MockTransportScript[];
  if (scripts.length === 0) return [];
  const selected = scripts[Math.min(callIndex, scripts.length - 1)];
  return resolveScriptValue(selected, request, callIndex, chunkSize);
}

function resolveDelay(
  delayMs: MockTransportOptions["delayMs"],
  event: AssistantEvent,
  index: number,
): number {
  const value =
    typeof delayMs === "function" ? delayMs(event, index) : delayMs;
  return value !== undefined && Number.isFinite(value) && value > 0
    ? value
    : 0;
}

export class MockTransport implements AssistantTransport {
  private callIndex = 0;

  constructor(private readonly options: MockTransportOptions = {}) {}

  async *send(
    request: AssistantRequest,
    sendOptions: AssistantSendOptions = {},
  ): AsyncIterableIterator<AssistantEvent> {
    const signal = sendOptions.signal;
    throwIfAborted(signal);

    const callIndex = this.callIndex;
    this.callIndex += 1;

    const error =
      typeof this.options.error === "function"
        ? this.options.error(request, callIndex)
        : this.options.error;
    if (error) throw error;

    const chunkSize = this.options.chunkSize ?? DEFAULT_CHUNK_SIZE;
    const events = await resolveScriptValue(
      this.options.script,
      request,
      callIndex,
      chunkSize,
    );

    let index = 0;
    for await (const event of events) {
      throwIfAborted(signal);
      const delay = resolveDelay(this.options.delayMs, event, index);
      if (delay > 0) await abortableDelay(delay, signal);
      throwIfAborted(signal);
      yield event;
      index += 1;
    }
  }
}
