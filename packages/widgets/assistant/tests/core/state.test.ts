// @vitest-environment node

import { describe, expect, it } from "vitest";
import {
  createAssistantSnapshot,
  reduceAssistantState,
  sanitizeContext,
  sanitizeTriggerContext,
} from "../../src/core";

describe("core state & context immutability", () => {
  it("creates an immutable snapshot with deeply isolated context", () => {
    const mutableContext = { user: "alice", theme: "dark" };
    const snapshot = createAssistantSnapshot([], mutableContext);

    expect(snapshot.status).toBe("idle");
    expect(snapshot.messages).toEqual([]);
    expect(snapshot.context).toEqual({ user: "alice", theme: "dark" });
    expect(Object.isFrozen(snapshot.context)).toBe(true);

    // Mutating the original object does not mutate the snapshot
    mutableContext.user = "eve";
    expect(snapshot.context.user).toBe("alice");

    // Attempting to mutate snapshot.context directly throws in strict mode
    expect(() => {
      // @ts-expect-error mutating readonly property
      snapshot.context.user = "hacker";
    }).toThrow();
  });

  it("handles set-context and clear-context immutably", () => {
    let state = createAssistantSnapshot([], { initial: "value" });

    state = reduceAssistantState(state, {
      type: "set-context",
      context: { session: "123", dynamic: true },
    });

    expect(state.context).toEqual({
      initial: "value",
      session: "123",
      dynamic: true,
    });
    expect(Object.isFrozen(state.context)).toBe(true);

    state = reduceAssistantState(state, { type: "clear-context" });
    expect(state.context).toEqual({});
    expect(Object.isFrozen(state.context)).toBe(true);
  });

  it("resets state with optional custom context or preserves existing context", () => {
    const initial = createAssistantSnapshot(
      [{ id: "m1", role: "user", parts: [] }],
      { activeEnv: "prod" },
    );

    const resetPreserved = reduceAssistantState(initial, { type: "reset" });
    expect(resetPreserved.messages).toEqual([]);
    expect(resetPreserved.context).toEqual({ activeEnv: "prod" });

    const resetCustom = reduceAssistantState(initial, {
      type: "reset",
      messages: [],
      context: { activeEnv: "staging" },
    });
    expect(resetCustom.context).toEqual({ activeEnv: "staging" });
  });

  it("defaults assistant streamed text parts to markdown format", () => {
    let state = createAssistantSnapshot();

    // message-start
    state = reduceAssistantState(state, {
      type: "event",
      event: { type: "message-start", messageId: "msg-1", role: "assistant" },
    });

    // text-delta creates new part
    state = reduceAssistantState(state, {
      type: "event",
      event: {
        type: "text-delta",
        messageId: "msg-1",
        partId: "text-part-1",
        delta: "**Hello**",
      },
    });

    const part = state.messages[0].parts[0];
    expect(part.type).toBe("text");
    if (part.type === "text") {
      expect(part.format).toBe("markdown");
      expect(part.text).toBe("**Hello**");
    }

    // Explicit format in part-start is preserved if set
    state = reduceAssistantState(state, {
      type: "event",
      event: {
        type: "part-start",
        messageId: "msg-1",
        part: {
          type: "text",
          id: "plain-part",
          text: "plain text",
          format: "plain",
        },
      },
    });

    const plainPart = state.messages[0].parts.find((p) => p.id === "plain-part");
    expect(plainPart?.type).toBe("text");
    if (plainPart?.type === "text") {
      expect(plainPart.format).toBe("plain");
    }
  });

  it("normalizes tool-result status in the reducer", () => {
    let state = createAssistantSnapshot();
    state = reduceAssistantState(state, {
      type: "event",
      event: {
        type: "tool-call",
        toolCallId: "call-1",
        name: "test_tool",
        messageId: "msg-1",
      },
    });

    // tool-result event with legacy status "complete"
    state = reduceAssistantState(state, {
      type: "event",
      event: {
        type: "tool-result",
        toolCallId: "call-1",
        messageId: "msg-1",
        status: "complete",
        output: "ok",
      },
    });

    const resultPart = state.messages[0].parts.find((p) => p.type === "tool-result");
    expect(resultPart?.type).toBe("tool-result");
    if (resultPart?.type === "tool-result") {
      expect(resultPart.status).toBe("completed");
    }
  });
});

describe("sanitizeContext recursion & safety", () => {
  it("sanitizes nested objects and arrays recursively", () => {
    const maliciousInput = {
      user: "alice",
      scores: [10, 20, { rank: 1, __proto__: { admin: true } }],
      nested: {
        safeProp: "ok",
        constructor: "evil",
        prototype: "bad",
      },
      dangerFn: () => "evil",
      sym: Symbol("evil"),
    };

    const sanitized = sanitizeContext(maliciousInput);

    expect(sanitized).toEqual({
      user: "alice",
      scores: [10, 20, { rank: 1 }],
      nested: { safeProp: "ok" },
    });

    expect(Object.prototype.hasOwnProperty.call(sanitized, "__proto__")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(sanitized, "dangerFn")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(sanitized, "sym")).toBe(false);
  });

  it("respects max depth limits to prevent recursion bombs", () => {
    // Construct a deeply nested object
    const deep: Record<string, unknown> = { level: 0 };
    let current = deep;
    for (let i = 1; i <= 20; i++) {
      const next = { level: i };
      current.child = next;
      current = next;
    }

    const sanitized = sanitizeContext(deep, 5);
    // Depth limit 5 means beyond level 4 child becomes {}
    let depthCount = 0;
    let node: unknown = sanitized;
    while (node && typeof node === "object" && "child" in node) {
      depthCount++;
      node = (node as Record<string, unknown>).child;
    }
    expect(depthCount).toBeLessThanOrEqual(5);
  });

  it("exports sanitizeTriggerContext as backward-compatible alias", () => {
    expect(sanitizeTriggerContext).toBe(sanitizeContext);
  });
});
describe("assistant streaming protocol", () => {
  it("creates and updates multiple text parts", () => {
    let state = createAssistantSnapshot();
    state = reduceAssistantState(state, {
      type: "event",
      event: { type: "message-start", messageId: "m1", role: "assistant" },
    });
    state = reduceAssistantState(state, {
      type: "event",
      event: {
        type: "part-start",
        messageId: "m1",
        part: { type: "text", id: "p1", text: "", format: "plain" },
      },
    });
    state = reduceAssistantState(state, {
      type: "event",
      event: {
        type: "part-start",
        messageId: "m1",
        part: { type: "text", id: "p2", text: "", format: "markdown" },
      },
    });
    state = reduceAssistantState(state, {
      type: "event",
      event: { type: "text-delta", messageId: "m1", partId: "p1", delta: "Hello" },
    });
    state = reduceAssistantState(state, {
      type: "event",
      event: { type: "text-delta", messageId: "m1", partId: "p2", delta: "World" },
    });

    expect(state.messages[0].parts).toHaveLength(2);
    const p1 = state.messages[0].parts.find((part) => part.id === "p1");
    const p2 = state.messages[0].parts.find((part) => part.id === "p2");
    expect(p1?.type === "text" && p1.text === "Hello").toBe(true);
    expect(p2?.type === "text" && p2.text === "World").toBe(true);
  });

  it("upserts duplicate part ids", () => {
    let state = createAssistantSnapshot();
    state = reduceAssistantState(state, {
      type: "event",
      event: { type: "message-start", messageId: "m1", role: "assistant" },
    });
    state = reduceAssistantState(state, {
      type: "event",
      event: {
        type: "part-start",
        messageId: "m1",
        part: { type: "text", id: "p1", text: "first", format: "plain" },
      },
    });
    state = reduceAssistantState(state, {
      type: "event",
      event: {
        type: "part-start",
        messageId: "m1",
        part: { type: "text", id: "p1", text: "second", format: "plain" },
      },
    });

    const parts = state.messages[0].parts.filter((part) => part.id === "p1");
    expect(parts).toHaveLength(1);
    expect(parts[0].type === "text" && parts[0].text === "second").toBe(true);
  });

  it("creates a text part when text-delta arrives without part-start", () => {
    let state = createAssistantSnapshot();
    state = reduceAssistantState(state, {
      type: "event",
      event: { type: "message-start", messageId: "m1", role: "assistant" },
    });
    state = reduceAssistantState(state, {
      type: "event",
      event: { type: "text-delta", messageId: "m1", partId: "p1", delta: "Hi" },
    });

    expect(state.messages[0].parts).toHaveLength(1);
    const part = state.messages[0].parts[0];
    expect(part.id).toBe("p1");
    expect(part.type === "text" && part.text === "Hi").toBe(true);
  });

  it("ignores unknown event types", () => {
    const before = createAssistantSnapshot();
    const after = reduceAssistantState(before, {
      type: "event",
      event: { type: "not-a-real-event" } as never,
    });
    expect(after).toBe(before);
  });
});

describe("snapshot deep immutability", () => {
  it("freezes nested messages, parts, metadata and context", () => {
    const snapshot = createAssistantSnapshot(
      [
        {
          id: "m1",
          role: "user",
          parts: [{ type: "text", id: "p1", text: "hi" }],
          metadata: { nested: { value: 1 } },
        },
      ],
      { context: { nested: { value: 2 } } },
    );

    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.messages)).toBe(true);
    expect(Object.isFrozen(snapshot.messages[0])).toBe(true);
    expect(Object.isFrozen(snapshot.messages[0].parts)).toBe(true);
    expect(Object.isFrozen(snapshot.messages[0].parts[0])).toBe(true);
    expect(Object.isFrozen(snapshot.messages[0].metadata)).toBe(true);
    expect(Object.isFrozen(snapshot.messages[0].metadata?.nested)).toBe(true);
    expect(Object.isFrozen(snapshot.context)).toBe(true);
    expect(Object.isFrozen(snapshot.context.context as object)).toBe(true);
    expect(Object.isFrozen((snapshot.context.context as { nested: unknown }).nested as object)).toBe(true);
  });

  it("returns a frozen updated snapshot", () => {
    const state = reduceAssistantState(createAssistantSnapshot(), {
      type: "append-message",
      message: { id: "m1", role: "user", parts: [] },
    });
    expect(Object.isFrozen(state)).toBe(true);
    expect(Object.isFrozen(state.messages)).toBe(true);
  });
});
