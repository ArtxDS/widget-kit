import {
  createAssistantError,
  isAssistantError,
  type AssistantError,
} from "../core/errors";
import {
  isAssistantEvent,
  type AssistantEvent,
} from "../core/events";
import type {
  AssistantRequest,
  AssistantSendOptions,
  AssistantTransport,
} from "../core/transport";
import { isRecord } from "../core/validation";
import { throwIfAborted } from "./utils";

export type HttpTransportOptions = {
  endpoint: string;
  fetch?: typeof fetch;
  headers?: HeadersInit | (() => HeadersInit | Promise<HeadersInit>);
  credentials?: RequestCredentials;
  timeoutMs?: number;
  accept?: "application/json" | "application/x-ndjson" | "text/event-stream";
};

type ResponseMode = "json" | "ndjson" | "sse";

function parseEvent(value: unknown, source: string): AssistantEvent {
  if (!isAssistantEvent(value)) {
    throw createAssistantError(
      "invalid-response",
      `Invalid assistant event in ${source}.`,
    );
  }
  return value;
}

function parseJsonEvents(text: string): readonly AssistantEvent[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw createAssistantError(
      "invalid-response",
      "Assistant response is not valid JSON.",
      { cause: error },
    );
  }

  const candidates = Array.isArray(parsed)
    ? parsed
    : isRecord(parsed) && Array.isArray(parsed.events)
      ? parsed.events
      : [parsed];

  return candidates.map((candidate) => parseEvent(candidate, "JSON response"));
}

async function* readLines(
  body: ReadableStream<Uint8Array>,
  signal?: AbortSignal,
): AsyncIterableIterator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      throwIfAborted(signal);
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      let newline = buffer.indexOf("\n");
      while (newline !== -1) {
        const line = buffer.slice(0, newline).replace(/\r$/, "");
        buffer = buffer.slice(newline + 1);
        yield line;
        newline = buffer.indexOf("\n");
      }
    }

    buffer += decoder.decode();
    if (buffer.length > 0) yield buffer.replace(/\r$/, "");
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}

async function* parseNdjson(
  body: ReadableStream<Uint8Array>,
  signal?: AbortSignal,
): AsyncIterableIterator<AssistantEvent> {
  for await (const line of readLines(body, signal)) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;

    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch (error) {
      throw createAssistantError(
        "invalid-response",
        "Assistant NDJSON line is not valid JSON.",
        { cause: error },
      );
    }

    const candidates = Array.isArray(parsed) ? parsed : [parsed];
    for (const candidate of candidates) {
      yield parseEvent(candidate, "NDJSON response");
    }
  }
}

async function* parseSse(
  body: ReadableStream<Uint8Array>,
  signal?: AbortSignal,
): AsyncIterableIterator<AssistantEvent> {
  let data: string[] = [];

  for await (const line of readLines(body, signal)) {
    if (line.length === 0) {
      if (data.length > 0) {
        const payload = data.join("\n");
        data = [];
        if (payload !== "[DONE]") {
          yield* parseJsonEvents(payload);
        }
      }
      continue;
    }

    if (line.startsWith(":")) continue;

    const separator = line.indexOf(":");
    const field = separator === -1 ? line : line.slice(0, separator);
    let value = separator === -1 ? "" : line.slice(separator + 1);
    if (value.startsWith(" ")) value = value.slice(1);
    if (field === "data") data.push(value);
  }

  if (data.length > 0) {
    const payload = data.join("\n");
    if (payload !== "[DONE]") {
      yield* parseJsonEvents(payload);
    }
  }
}

function resolveMode(
  contentType: string | null,
  accept: NonNullable<HttpTransportOptions["accept"]>,
): ResponseMode {
  const type = contentType?.toLowerCase() ?? "";
  if (type.includes("text/event-stream")) return "sse";
  if (type.includes("ndjson") || type.includes("jsonl")) return "ndjson";
  if (type.includes("application/json") || type.includes("+json")) {
    return "json";
  }
  if (accept === "application/json") return "json";
  if (accept === "application/x-ndjson") return "ndjson";
  return "sse";
}

export class HttpTransport implements AssistantTransport {
  private readonly endpoint: string;
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly options: HttpTransportOptions) {
    if (options.endpoint.trim().length === 0) {
      throw new TypeError("HttpTransport requires a non-empty endpoint.");
    }

    const fetchImpl = options.fetch ?? globalThis.fetch;
    if (!fetchImpl) {
      throw new TypeError("HttpTransport requires a fetch implementation.");
    }

    this.endpoint = options.endpoint;
    this.fetchImpl = fetchImpl;
  }

  private async resolveHeaders(accept: string): Promise<Headers> {
    const base =
      typeof this.options.headers === "function"
        ? await this.options.headers()
        : this.options.headers;
    const headers = new Headers(base);

    if (!headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }
    if (!headers.has("accept")) {
      headers.set("accept", accept);
    }

    return headers;
  }

  private toError(
    error: unknown,
    timedOut: boolean,
    aborted: boolean,
  ): AssistantError {
    if (timedOut) {
      return createAssistantError(
        "timeout",
        `Assistant request timed out after ${this.options.timeoutMs}ms.`,
        { retryable: true, cause: error },
      );
    }

    if (
      aborted ||
      (error instanceof Error && error.name === "AbortError")
    ) {
      return createAssistantError("aborted", "Assistant request aborted.", {
        cause: error,
      });
    }

    if (isAssistantError(error)) return error;

    if (error instanceof TypeError) {
      return createAssistantError(
        "transport",
        "Assistant network request failed.",
        { retryable: true, cause: error },
      );
    }

    return createAssistantError(
      "transport",
      error instanceof Error
        ? error.message
        : "Assistant request failed.",
      { cause: error },
    );
  }

  async *send(
    request: AssistantRequest,
    sendOptions: AssistantSendOptions = {},
  ): AsyncIterableIterator<AssistantEvent> {
    const signal = sendOptions.signal;
    throwIfAborted(signal);

    const controller = new AbortController();
    const onAbort = () => controller.abort();
    signal?.addEventListener("abort", onAbort, { once: true });

    const timeoutMs = this.options.timeoutMs;
    let timedOut = false;
    const timeoutId =
      timeoutMs !== undefined && timeoutMs > 0
        ? setTimeout(() => {
            timedOut = true;
            controller.abort();
          }, timeoutMs)
        : undefined;

    const accept = this.options.accept ?? "text/event-stream";

    try {
      const headers = await this.resolveHeaders(accept);
      let body: string;
      try {
        body = JSON.stringify(request);
      } catch (error) {
        throw createAssistantError(
          "invalid-request",
          "Assistant request is not serializable.",
          { cause: error },
        );
      }

      let response: Response;
      try {
        response = await this.fetchImpl(this.endpoint, {
          method: "POST",
          headers,
          body,
          signal: controller.signal,
          ...(this.options.credentials
            ? { credentials: this.options.credentials }
            : {}),
        });
      } catch (error) {
        throw this.toError(error, timedOut, signal?.aborted ?? false);
      }

      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        throw createAssistantError(
          "transport",
          `Assistant request failed with HTTP ${response.status}.`,
          {
            retryable: response.status === 429 || response.status >= 500,
            details: {
              status: response.status,
              statusText: response.statusText,
              body: detail.slice(0, 500),
            },
          },
        );
      }

      const mode = resolveMode(response.headers.get("content-type"), accept);
      if (mode === "json") {
        const text = await response.text();
        for (const event of parseJsonEvents(text)) {
          throwIfAborted(signal);
          yield event;
        }
        return;
      }

      if (!response.body) {
        throw createAssistantError(
          "invalid-response",
          "Assistant response body is empty.",
        );
      }

      const events =
        mode === "sse"
          ? parseSse(response.body, controller.signal)
          : parseNdjson(response.body, controller.signal);

      for await (const event of events) {
        yield event;
      }
    } catch (error) {
      throw this.toError(error, timedOut, signal?.aborted ?? false);
    } finally {
      if (timeoutId !== undefined) clearTimeout(timeoutId);
      signal?.removeEventListener("abort", onAbort);
    }
  }
}
