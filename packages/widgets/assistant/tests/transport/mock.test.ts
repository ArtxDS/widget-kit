// @vitest-environment node

import { describe, expect, it } from "vitest";
import {
  createAssistantError,
  type AssistantEvent,
  type AssistantRequest,
} from "../../src/core";
import { MockTransport } from "../../src/transport";

function request(): AssistantRequest {
  return { protocolVersion: "1", messages: [] };
}

async function collect(
  iterable: AsyncIterable<AssistantEvent>,
): Promise<AssistantEvent[]> {
  const events: AssistantEvent[] = [];
  for await (const event of iterable) {
    events.push(event);
  }
  return events;
}

function textOf(events: readonly AssistantEvent[]): string {
  return events
    .map((event) => (event.type === "text-delta" ? event.delta : ""))
    .join("");
}

describe("MockTransport", () => {
  it("streams text in deterministic chunks", async () => {
    const transport = new MockTransport({ script: "Hello world", chunkSize: 4 });
    const events = await collect(transport.send(request()));

    expect(events[0]).toMatchObject({ type: "run-start" });
    expect(events.at(-1)).toMatchObject({
      type: "run-end",
      status: "completed",
    });
    expect(textOf(events)).toBe("Hello world");
    expect(
      events
        .filter(
          (event): event is Extract<AssistantEvent, { type: "text-delta" }> =>
            event.type === "text-delta",
        )
        .every((event) => Array.from(event.delta).length <= 4),
    ).toBe(true);
  });

  it("uses the default response when no script is provided", async () => {
    const transport = new MockTransport();
    const events = await collect(transport.send(request()));
    expect(textOf(events)).toBe("Mock assistant response.");
  });

  it("resolves function scripts with the request and call index", async () => {
    const requests: AssistantRequest[] = [];
    const transport = new MockTransport({
      script: (currentRequest, callIndex) => {
        requests.push(currentRequest);
        return callIndex === 0 ? "First response" : "Second response";
      },
    });

    const first = await collect(transport.send(request()));
    const second = await collect(transport.send(request()));

    expect(requests).toHaveLength(2);
    expect(textOf(first)).toBe("First response");
    expect(textOf(second)).toBe("Second response");
  });

  it("supports a sequence of scripts and repeats the last one", async () => {
    const transport = new MockTransport({ script: ["One", "Two"] });

    expect(textOf(await collect(transport.send(request())))).toBe("One");
    expect(textOf(await collect(transport.send(request())))).toBe("Two");
    expect(textOf(await collect(transport.send(request())))).toBe("Two");
  });

  it("forwards event scripts unchanged", async () => {
    const script: AssistantEvent[] = [
      { type: "run-start", runId: "run-1" },
      { type: "message-start", messageId: "message-1", role: "assistant" },
      {
        type: "part-start",
        messageId: "message-1",
        part: { type: "text", id: "part-1", text: "" },
      },
      {
        type: "tool-call",
        toolCallId: "call-1",
        name: "lookup",
        input: { id: 1 },
        risk: "low",
      },
      {
        type: "tool-result",
        toolCallId: "call-1",
        output: { name: "Item" },
      },
      { type: "message-end", messageId: "message-1" },
      { type: "run-end", runId: "run-1", status: "completed" },
    ];
    const transport = new MockTransport({ script });

    await expect(collect(transport.send(request()))).resolves.toEqual(script);
  });

  it("throws configured errors and preserves the original value", async () => {
    const failure = createAssistantError("transport", "Offline", {
      retryable: true,
    });
    const transport = new MockTransport({ error: failure });

    await expect(collect(transport.send(request()))).rejects.toBe(failure);
  });

  it("stops delayed streams when aborted", async () => {
    const transport = new MockTransport({
      script: "Delayed response",
      delayMs: 1000,
    });
    const controller = new AbortController();
    const iterator = transport
      .send(request(), { signal: controller.signal })
      [Symbol.asyncIterator]();

    const next = iterator.next();
    await new Promise((resolve) => setTimeout(resolve, 10));
    controller.abort();

    await expect(next).rejects.toMatchObject({ code: "aborted" });
  });

  it("rejects immediately when the signal is already aborted", async () => {
    const transport = new MockTransport();
    const controller = new AbortController();
    controller.abort();

    await expect(
      collect(transport.send(request(), { signal: controller.signal })),
    ).rejects.toMatchObject({ code: "aborted" });
  });
});
