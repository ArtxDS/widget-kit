// @vitest-environment node

import { describe, expect, it } from "vitest";
import {
  ASSISTANT_PROTOCOL_VERSION,
  createAssistantError,
  isAssistantError,
  isAssistantEvent,
  isAssistantRequest,
  isAssistantTransport,
  type AssistantEvent,
  type AssistantTransport,
} from "../../src/core";

const events: AssistantEvent[] = [
  { type: "run-start", runId: "run-1" },
  { type: "message-start", messageId: "message-1", role: "assistant" },
  {
    type: "part-start",
    messageId: "message-1",
    part: { type: "text", id: "text-1", text: "", format: "plain" },
  },
  {
    type: "text-delta",
    messageId: "message-1",
    partId: "text-1",
    delta: "Hello",
  },
  {
    type: "message-end",
    messageId: "message-1",
    finishReason: "stop",
  },
  {
    type: "tool-call",
    toolCallId: "call-1",
    name: "search",
    input: { query: "hello" },
  },
  {
    type: "tool-result",
    toolCallId: "call-1",
    output: { count: 1 },
  },
  {
    type: "error",
    error: createAssistantError("transport", "Connection failed", {
      retryable: true,
    }),
  },
  { type: "run-end", runId: "run-1", status: "completed" },
];

describe("assistant events", () => {
  it.each(events)("accepts $type events", (event) => {
    expect(isAssistantEvent(event)).toBe(true);
  });

  it("rejects malformed and unknown events", () => {
    expect(isAssistantEvent({ type: "unknown" })).toBe(false);
    expect(isAssistantEvent({ type: "run-start" })).toBe(false);
    expect(
      isAssistantEvent({
        type: "text-delta",
        messageId: "message-1",
        partId: "text-1",
      }),
    ).toBe(false);
    expect(
      isAssistantEvent({
        type: "error",
        error: { code: "transport" },
      }),
    ).toBe(false);
    expect(
      isAssistantEvent({
        type: "run-end",
        runId: "run-1",
        status: "unknown",
      }),
    ).toBe(false);
  });
});

describe("assistant protocol", () => {
  it("creates and validates assistant errors", () => {
    const error = createAssistantError("timeout", "Request timed out", {
      retryable: true,
      details: { timeoutMs: 1000 },
    });

    expect(isAssistantError(error)).toBe(true);
    expect(isAssistantError({ code: "timeout" })).toBe(false);
    expect(
      isAssistantError({ code: "timeout", message: "Timed out", details: [] }),
    ).toBe(false);
  });

  it("validates requests without depending on DOM or Node APIs", () => {
    const request = {
      protocolVersion: ASSISTANT_PROTOCOL_VERSION,
      messages: [
        {
          id: "message-1",
          role: "user" as const,
          parts: [{ type: "text" as const, id: "text-1", text: "Hello" }],
        },
      ],
      context: { locale: "en" },
    };

    expect(isAssistantRequest(request)).toBe(true);
    expect(
      isAssistantRequest({ protocolVersion: "", messages: [] }),
    ).toBe(false);
    expect(
      isAssistantRequest({ protocolVersion: "1", messages: [{}] }),
    ).toBe(false);
  });

  it("supports deterministic in-memory transports", async () => {
    const transport: AssistantTransport = {
      async *send() {
        yield { type: "run-start", runId: "run-1" };
        yield { type: "run-end", runId: "run-1", status: "completed" };
      },
    };

    expect(isAssistantTransport(transport)).toBe(true);
    expect(isAssistantTransport({ send: "nope" })).toBe(false);

    const received: AssistantEvent[] = [];
    for await (const event of transport.send({
      protocolVersion: ASSISTANT_PROTOCOL_VERSION,
      messages: [],
    })) {
      received.push(event);
    }

    expect(received).toEqual([
      { type: "run-start", runId: "run-1" },
      { type: "run-end", runId: "run-1", status: "completed" },
    ]);
  });
});
