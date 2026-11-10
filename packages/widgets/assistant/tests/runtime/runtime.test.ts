// @vitest-environment node

import { describe, expect, it, vi } from "vitest";
import {
  createAssistantError,
  type AssistantTransport,
  type ChatMessage,
} from "../../src/core";
import { createAssistantRuntime } from "../../src/runtime";
import { MockTransport } from "../../src/transport";

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function ids() {
  let value = 0;
  return () => `id-${(value += 1)}`;
}

function textOf(message: ChatMessage | undefined): string {
  return (message?.parts ?? [])
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("");
}

function assistantText(messages: readonly ChatMessage[]): string {
  return textOf(messages.findLast((message) => message.role === "assistant"));
}

describe("assistant runtime", () => {
  it("streams incremental text and reports status transitions", async () => {
    const gate = deferred();
    const transport: AssistantTransport = {
      async *send() {
        yield { type: "run-start", runId: "run-1" };
        yield {
          type: "message-start",
          messageId: "message-1",
          role: "assistant",
        };
        yield {
          type: "part-start",
          messageId: "message-1",
          part: { type: "text", id: "part-1", text: "" },
        };
        yield {
          type: "text-delta",
          messageId: "message-1",
          partId: "part-1",
          delta: "Hello",
        };
        await gate.promise;
        yield {
          type: "text-delta",
          messageId: "message-1",
          partId: "part-1",
          delta: " world",
        };
        yield { type: "message-end", messageId: "message-1" };
        yield { type: "run-end", runId: "run-1", status: "completed" };
      },
    };

    const runtime = createAssistantRuntime({
      transport,
      createId: ids(),
      now: () => "2026-01-01T00:00:00.000Z",
    });
    const statuses: string[] = [];
    runtime.subscribe(() => statuses.push(runtime.getSnapshot().status));

    const pending = runtime.send("Hi");
    await vi.waitFor(() => {
      const snapshot = runtime.getSnapshot();
      expect(snapshot.status).toBe("streaming");
      expect(assistantText(snapshot.messages)).toBe("Hello");
    });

    gate.resolve();
    await pending;

    const snapshot = runtime.getSnapshot();
    expect(snapshot.status).toBe("idle");
    expect(snapshot.error).toBeNull();
    expect(snapshot.messages.map((message) => message.role)).toEqual([
      "user",
      "assistant",
    ]);
    expect(assistantText(snapshot.messages)).toBe("Hello world");
    expect(snapshot.messages[1]?.status).toBe("complete");
    expect(statuses).toContain("submitting");
    expect(statuses).toContain("thinking");
    expect(statuses).toContain("streaming");
  });

  it("rejects concurrent sends and keeps history consistent", async () => {
    const gate = deferred();
    let calls = 0;
    const transport: AssistantTransport = {
      async *send() {
        calls += 1;
        yield { type: "run-start", runId: "run-1" };
        yield {
          type: "message-start",
          messageId: "message-1",
          role: "assistant",
        };
        yield {
          type: "part-start",
          messageId: "message-1",
          part: { type: "text", id: "part-1", text: "" },
        };
        await gate.promise;
        yield {
          type: "text-delta",
          messageId: "message-1",
          partId: "part-1",
          delta: "First",
        };
        yield { type: "message-end", messageId: "message-1" };
        yield { type: "run-end", runId: "run-1", status: "completed" };
      },
    };

    const runtime = createAssistantRuntime({ transport, createId: ids() });
    const first = runtime.send("first");
    await vi.waitFor(() => expect(calls).toBe(1));

    await expect(runtime.send("second")).rejects.toThrow("already processing");
    expect(runtime.getSnapshot().messages).toHaveLength(2);

    gate.resolve();
    await first;

    const snapshot = runtime.getSnapshot();
    expect(snapshot.status).toBe("idle");
    expect(snapshot.messages).toHaveLength(2);
    expect(snapshot.messages[0]?.role).toBe("user");
    expect(assistantText(snapshot.messages)).toBe("First");
  });

  it("cancels an active run and preserves partial content", async () => {
    const transport = new MockTransport({
      script: [
        { type: "run-start", runId: "run-1" },
        {
          type: "message-start",
          messageId: "message-1",
          role: "assistant",
        },
        {
          type: "part-start",
          messageId: "message-1",
          part: { type: "text", id: "part-1", text: "" },
        },
        {
          type: "text-delta",
          messageId: "message-1",
          partId: "part-1",
          delta: "Partial",
        },
        {
          type: "text-delta",
          messageId: "message-1",
          partId: "part-1",
          delta: " content",
        },
        { type: "message-end", messageId: "message-1" },
        { type: "run-end", runId: "run-1", status: "completed" },
      ],
      delayMs: (_event, index) => (index === 4 ? 1000 : 0),
    });
    const runtime = createAssistantRuntime({ transport, createId: ids() });

    const pending = runtime.send("Hi");
    await vi.waitFor(() =>
      expect(assistantText(runtime.getSnapshot().messages)).toBe("Partial"),
    );

    runtime.cancel();
    await pending;

    const snapshot = runtime.getSnapshot();
    expect(snapshot.status).toBe("idle");
    expect(snapshot.error).toBeNull();
    expect(assistantText(snapshot.messages)).toBe("Partial");
    expect(snapshot.messages[1]?.status).toBe("complete");
  });

  it("retries a failed run without duplicating user messages", async () => {
    let calls = 0;
    const transport: AssistantTransport = {
      async *send() {
        calls += 1;
        yield { type: "run-start", runId: "run-1" };
        yield {
          type: "message-start",
          messageId: "message-1",
          role: "assistant",
        };
        yield {
          type: "part-start",
          messageId: "message-1",
          part: { type: "text", id: "part-1", text: "" },
        };
        yield {
          type: "text-delta",
          messageId: "message-1",
          partId: "part-1",
          delta: "Partial",
        };
        if (calls === 1) {
          throw createAssistantError("transport", "Connection lost", {
            retryable: true,
          });
        }
        yield {
          type: "text-delta",
          messageId: "message-1",
          partId: "part-1",
          delta: " complete",
        };
        yield { type: "message-end", messageId: "message-1" };
        yield { type: "run-end", runId: "run-1", status: "completed" };
      },
    };
    const runtime = createAssistantRuntime({ transport, createId: ids() });

    await runtime.send("Hi");
    let snapshot = runtime.getSnapshot();
    expect(snapshot.status).toBe("error");
    expect(snapshot.error?.code).toBe("transport");
    expect(snapshot.messages).toHaveLength(2);
    expect(snapshot.messages[1]?.status).toBe("error");
    expect(assistantText(snapshot.messages)).toBe("Partial");

    await runtime.retry();
    snapshot = runtime.getSnapshot();
    expect(snapshot.status).toBe("idle");
    expect(snapshot.error).toBeNull();
    expect(snapshot.messages.map((message) => message.role)).toEqual([
      "user",
      "assistant",
    ]);
    expect(assistantText(snapshot.messages)).toBe("Partial complete");
  });

  it("marks streams that end without run-end as incomplete", async () => {
    const transport: AssistantTransport = {
      async *send() {
        yield { type: "run-start", runId: "run-1" };
        yield {
          type: "message-start",
          messageId: "message-1",
          role: "assistant",
        };
        yield {
          type: "part-start",
          messageId: "message-1",
          part: { type: "text", id: "part-1", text: "" },
        };
        yield {
          type: "text-delta",
          messageId: "message-1",
          partId: "part-1",
          delta: "Incomplete",
        };
      },
    };
    const runtime = createAssistantRuntime({ transport, createId: ids() });

    await runtime.send("Hi");
    const snapshot = runtime.getSnapshot();
    expect(snapshot.status).toBe("error");
    expect(snapshot.error?.code).toBe("invalid-response");
    expect(snapshot.messages[1]?.status).toBe("error");
    expect(assistantText(snapshot.messages)).toBe("Incomplete");
  });

  it("tracks tool execution and confirmation", async () => {
    const gate = deferred();
    const transport: AssistantTransport = {
      async *send() {
        yield { type: "run-start", runId: "run-1" };
        yield {
          type: "message-start",
          messageId: "message-1",
          role: "assistant",
        };
        yield {
          type: "part-start",
          messageId: "message-1",
          part: { type: "text", id: "part-1", text: "" },
        };
        yield {
          type: "text-delta",
          messageId: "message-1",
          partId: "part-1",
          delta: "Checking",
        };
        yield {
          type: "tool-call",
          toolCallId: "call-1",
          name: "transfer",
          input: { amount: 10 },
          risk: "high",
        };
        await gate.promise;
        yield {
          type: "tool-result",
          toolCallId: "call-1",
          output: { ok: true },
        };
        yield { type: "message-end", messageId: "message-1" };
        yield { type: "run-end", runId: "run-1", status: "completed" };
      },
    };
    const runtime = createAssistantRuntime({ transport, createId: ids() });

    const pending = runtime.send("Transfer");
    await vi.waitFor(() =>
      expect(runtime.getSnapshot().status).toBe("awaiting-confirmation"),
    );
    expect(runtime.getSnapshot().pendingConfirmation).toEqual({
      toolCallId: "call-1",
      name: "transfer",
      input: { amount: 10 },
      risk: "high",
    });

    runtime.confirm(true);
    expect(runtime.getSnapshot().status).toBe("executing-tool");

    gate.resolve();
    await pending;

    const snapshot = runtime.getSnapshot();
    expect(snapshot.status).toBe("idle");
    expect(snapshot.pendingConfirmation).toBeNull();
    const toolCall = snapshot.messages[1]?.parts.find(
      (part) => part.type === "tool-call",
    );
    const toolResult = snapshot.messages[1]?.parts.find(
      (part) => part.type === "tool-result",
    );
    expect(toolCall).toMatchObject({ status: "completed" });
    expect(toolResult).toMatchObject({
      status: "completed",
      output: { ok: true },
    });
  });

  it("resets history and aborts the active run", async () => {
    const transport = new MockTransport({
      script: "Never finishes",
      delayMs: (_event, index) => (index >= 2 ? 1000 : 0),
    });
    const runtime = createAssistantRuntime({ transport, createId: ids() });

    const pending = runtime.send("Hi");
    await vi.waitFor(() =>
      expect(runtime.getSnapshot().messages).toHaveLength(2),
    );

    runtime.reset();
    await pending;

    const snapshot = runtime.getSnapshot();
    expect(snapshot.status).toBe("idle");
    expect(snapshot.messages).toEqual([]);
    expect(snapshot.error).toBeNull();
  });
});

describe("assistant streaming protocol", () => {
  it("ignores unknown events and completes the run", async () => {
    const transport: AssistantTransport = {
      async *send() {
        yield { type: "run-start", runId: "run-1" };
        yield { type: "message-start", messageId: "message-1", role: "assistant" };
        yield { type: "not-a-real-event" } as never;
        yield { type: "run-end", runId: "run-1", status: "completed" };
      },
    };
    const runtime = createAssistantRuntime({ transport, createId: ids() });

    await runtime.send("Hi");
    expect(runtime.getSnapshot().status).toBe("idle");
    expect(runtime.getSnapshot().error).toBeNull();
  });

  it("records an error event as terminal", async () => {
    const transport: AssistantTransport = {
      async *send() {
        yield { type: "run-start", runId: "run-1" };
        yield { type: "message-start", messageId: "message-1", role: "assistant" };
        yield {
          type: "error",
          error: createAssistantError("transport", "boom", { retryable: true }),
        };
        yield { type: "run-end", runId: "run-1", status: "error" };
      },
    };
    const runtime = createAssistantRuntime({ transport, createId: ids() });

    await runtime.send("Hi");
    const snapshot = runtime.getSnapshot();
    expect(snapshot.status).toBe("error");
    expect(snapshot.error?.code).toBe("transport");
    expect(snapshot.messages[1]?.status).toBe("error");
  });
});

describe("assistant runtime lifecycle", () => {
  it("prevents reset after dispose", () => {
    const transport = new MockTransport({ script: "Hello" });
    const runtime = createAssistantRuntime({ transport, createId: ids() });

    runtime.dispose();
    runtime.reset([{ id: "m1", role: "user", parts: [] }]);

    expect(runtime.getSnapshot().messages).toEqual([]);
  });

  it("does not notify listeners after dispose", () => {
    const transport = new MockTransport({ script: "Hello" });
    const runtime = createAssistantRuntime({ transport, createId: ids() });
    const listener = vi.fn();
    const unsubscribe = runtime.subscribe(listener);

    runtime.dispose();
    runtime.cancel();
    runtime.setContext({ value: 1 });

    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });

  it("supports repeated dispose and unsubscribe", () => {
    const transport = new MockTransport({ script: "Hello" });
    const runtime = createAssistantRuntime({ transport, createId: ids() });
    const listener = vi.fn();
    const unsubscribe = runtime.subscribe(listener);

    unsubscribe();
    unsubscribe();
    runtime.dispose();
    runtime.dispose();

    expect(runtime.getSnapshot().status).toBe("idle");
  });

  it("keeps snapshot identity stable without real changes", () => {
    const transport = new MockTransport({ script: "Hello" });
    const runtime = createAssistantRuntime({ transport, createId: ids() });
    const first = runtime.getSnapshot();
    const second = runtime.getSnapshot();

    expect(first).toBe(second);
  });
});
