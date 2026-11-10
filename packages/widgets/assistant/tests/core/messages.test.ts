// @vitest-environment node

import { describe, expect, it } from "vitest";
import {
  TOOL_CALL_STATUSES,
  isChatMessage,
  isMessagePart,
  normalizeToolCallStatus,
  resolveTextFormat,
  type ChatMessage,
  type MessagePart,
} from "../../src/core";

const parts: MessagePart[] = [
  { type: "text", id: "text-1", text: "Hello", format: "plain" },
  {
    type: "text",
    id: "text-2",
    text: "**Hello**",
    format: "markdown",
  },
  {
    type: "buttons",
    id: "buttons-1",
    buttons: [
      {
        id: "button-1",
        label: "Open settings",
        action: "open-settings",
        payload: { tab: "profile" },
      },
    ],
  },
  {
    type: "component",
    id: "component-1",
    component: "BalanceCard",
    props: { currency: "USD" },
  },
  {
    type: "tool-call",
    id: "call-part-1",
    toolCallId: "call-1",
    name: "search",
    input: { query: "hello" },
    status: "running",
  },
  {
    type: "tool-result",
    id: "result-part-1",
    toolCallId: "call-1",
    name: "search",
    output: { count: 1 },
  },
];

describe("message contracts", () => {
  it.each(parts)("accepts $type message parts", (part) => {
    expect(isMessagePart(part)).toBe(true);
  });

  it("accepts a complete structured chat message", () => {
    const message: ChatMessage = {
      id: "message-1",
      role: "assistant",
      parts,
      createdAt: "2026-01-01T00:00:00.000Z",
      status: "complete",
      metadata: { source: "test" },
    };

    expect(isChatMessage(message)).toBe(true);
    expect(isChatMessage({ ...message, parts: [] })).toBe(true);
  });

  it("rejects malformed parts and messages", () => {
    expect(isMessagePart({ type: "text", id: "text-1", text: 1 })).toBe(false);
    expect(
      isMessagePart({
        type: "text",
        id: "text-1",
        text: "Hello",
        format: "html",
      }),
    ).toBe(false);
    expect(
      isMessagePart({
        type: "buttons",
        id: "buttons-1",
        buttons: [{ id: "button-1" }],
      }),
    ).toBe(false);
    expect(
      isMessagePart({
        type: "component",
        id: "component-1",
        component: "",
      }),
    ).toBe(false);
    expect(
      isMessagePart({
        type: "tool-call",
        id: "call-part-1",
        toolCallId: "call-1",
        name: "search",
        status: "unknown",
      }),
    ).toBe(false);
    expect(isMessagePart({ type: "unknown", id: "part-1" })).toBe(false);

    expect(
      isChatMessage({ id: "message-1", role: "robot", parts: [] }),
    ).toBe(false);
    expect(
      isChatMessage({
        id: "message-1",
        role: "assistant",
        parts: [],
        status: "unknown",
      }),
    ).toBe(false);
    expect(
      isChatMessage({
        id: "message-1",
        role: "assistant",
        parts: [],
        metadata: [],
      }),
    ).toBe(false);
  });

  it("normalizes tool call statuses cleanly and safely", () => {
    expect(TOOL_CALL_STATUSES).toEqual([
      "pending",
      "running",
      "completed",
      "failed",
      "cancelled",
    ]);

    expect(normalizeToolCallStatus("complete")).toBe("completed");
    expect(normalizeToolCallStatus("error")).toBe("failed");
    expect(normalizeToolCallStatus("completed")).toBe("completed");
    expect(normalizeToolCallStatus("running")).toBe("running");
    expect(normalizeToolCallStatus("cancelled")).toBe("cancelled");
    expect(normalizeToolCallStatus("unknown-state")).toBe("pending");
    expect(normalizeToolCallStatus(undefined)).toBe("pending");
  });

  it("resolves text format defaulting to markdown for assistant messages", () => {
    expect(resolveTextFormat("assistant")).toBe("markdown");
    expect(resolveTextFormat("assistant", "plain")).toBe("plain");
    expect(resolveTextFormat("assistant", "markdown")).toBe("markdown");

    expect(resolveTextFormat("user")).toBe("plain");
    expect(resolveTextFormat("user", "markdown")).toBe("markdown");
    expect(resolveTextFormat("system")).toBe("plain");
    expect(resolveTextFormat("tool")).toBe("plain");
  });
});
