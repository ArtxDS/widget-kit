// @vitest-environment node

import { describe, expect, it, vi } from "vitest";
import {
  createAssistantError,
  defineAction,
  type AssistantError,
  type AssistantEvent,
  type ChatMessage,
  type ToolCallMessagePart,
  type ToolResultMessagePart,
} from "../../src/core";
import { createAssistantRuntime } from "../../src/runtime";

import { createSimulatedTools } from "../../examples/simulated-tools";
import { MockTransport } from "../../src/transport";

function toolCallEvent(
  messageId: string | undefined,
  toolCallId: string,
  name: string,
  input?: unknown,
  access?: "read" | "write",
  risk?: "low" | "medium" | "high",
  description?: string,
): AssistantEvent {
  return {
    type: "tool-call",
    toolCallId,
    name,
    input,
    access,
    risk,
    messageId,
    description,
  };
}

function toolPart(
  messages: readonly ChatMessage[],
  toolCallId: string,
): ToolCallMessagePart | undefined {
  return messages
    .find((message) =>
      message.parts.some(
        (part) => part.type === "tool-call" && part.toolCallId === toolCallId,
      ),
    )
    ?.parts.find(
      (part): part is ToolCallMessagePart =>
        part.type === "tool-call" && part.toolCallId === toolCallId,
    );
}

function toolResult(
  messages: readonly ChatMessage[],
  toolCallId: string,
): ToolResultMessagePart | undefined {
  return messages
    .find((message) =>
      message.parts.some(
        (part) => part.type === "tool-result" && part.toolCallId === toolCallId,
      ),
    )
    ?.parts.find(
      (part): part is ToolResultMessagePart =>
        part.type === "tool-result" && part.toolCallId === toolCallId,
    );
}

describe("assistant runtime tools", () => {
  it("executes read tools automatically and stores the result in history", async () => {
    const { tools, calls } = createSimulatedTools();
    const events: readonly AssistantEvent[] = [
      { type: "run-start", runId: "run-1" },
      { type: "message-start", messageId: "message-1", role: "assistant" },
      toolCallEvent("message-1", "call-1", "read_note", { id: "note-1" }),
      { type: "run-end", runId: "run-1", status: "completed" },
    ];
    const transport = new MockTransport({ script: events });
    const runtime = createAssistantRuntime({ transport, tools });

    await runtime.send("Read note 1");

    const snapshot = runtime.getSnapshot();
    expect(snapshot.status).toBe("idle");
    expect(snapshot.error).toBeNull();
    expect(calls.read).toBe(1);
    const call = toolPart(snapshot.messages, "call-1");
    const result = toolResult(snapshot.messages, "call-1");
    expect(call?.status).toBe("completed");
    expect(result?.status).toBe("completed");
    expect(result?.output).toEqual({ id: "note-1", text: "Bem-vindo" });
  });

  it("fails read tool validation without executing the handler", async () => {
    const { tools, calls } = createSimulatedTools();
    const events: readonly AssistantEvent[] = [
      { type: "run-start", runId: "run-1" },
      { type: "message-start", messageId: "message-1", role: "assistant" },
      toolCallEvent("message-1", "call-1", "read_note", {}),
      { type: "run-end", runId: "run-1", status: "completed" },
    ];
    const transport = new MockTransport({ script: events });
    const runtime = createAssistantRuntime({ transport, tools });

    await runtime.send("Read invalid");

    const snapshot = runtime.getSnapshot();
    expect(snapshot.status).toBe("idle");
    expect(calls.read).toBe(0);
    const call = toolPart(snapshot.messages, "call-1");
    const result = toolResult(snapshot.messages, "call-1");
    expect(call?.status).toBe("failed");
    expect(result?.status).toBe("failed");
    expect(result?.error?.code).toBe("action");
  });

  it("returns read handler failures to history", async () => {
    const { tools, calls } = createSimulatedTools();
    const events: readonly AssistantEvent[] = [
      { type: "run-start", runId: "run-1" },
      { type: "message-start", messageId: "message-1", role: "assistant" },
      toolCallEvent("message-1", "call-1", "read_note", { id: "missing" }),
      { type: "run-end", runId: "run-1", status: "completed" },
    ];
    const transport = new MockTransport({ script: events });
    const runtime = createAssistantRuntime({ transport, tools });

    await runtime.send("Read missing");

    const snapshot = runtime.getSnapshot();
    expect(snapshot.status).toBe("idle");
    expect(calls.read).toBe(1);
    const result = toolResult(snapshot.messages, "call-1");
    expect(result?.status).toBe("failed");
    expect(result?.error?.code).toBe("action");
  });

  it("waits for explicit confirmation before executing write tools", async () => {
    const { tools, calls } = createSimulatedTools();
    const events: readonly AssistantEvent[] = [
      { type: "run-start", runId: "run-1" },
      { type: "message-start", messageId: "message-1", role: "assistant" },
      toolCallEvent("message-1", "call-1", "write_note", {
        id: "note-2",
        text: "Olá",
      }),
      { type: "run-end", runId: "run-1", status: "completed" },
    ];
    const transport = new MockTransport({ script: events });
    const runtime = createAssistantRuntime({ transport, tools });

    const send = runtime.send("Write note 2");
    await vi.waitFor(() =>
      expect(runtime.getSnapshot().status).toBe("awaiting-confirmation"),
    );
    expect(runtime.getSnapshot().pendingConfirmation?.toolCallId).toBe(
      "call-1",
    );
    expect(calls.write).toBe(0);

    runtime.confirm(true);
    await send;

    const snapshot = runtime.getSnapshot();
    expect(snapshot.status).toBe("idle");
    expect(snapshot.pendingConfirmation).toBeNull();
    expect(calls.write).toBe(1);
    const call = toolPart(snapshot.messages, "call-1");
    const result = toolResult(snapshot.messages, "call-1");
    expect(call?.status).toBe("completed");
    expect(result?.status).toBe("completed");
    expect(result?.output).toEqual({ id: "note-2", text: "Olá" });
  });

  it("does not execute a write tool when confirmation is rejected", async () => {
    const { tools, calls } = createSimulatedTools();
    const events: readonly AssistantEvent[] = [
      { type: "run-start", runId: "run-1" },
      { type: "message-start", messageId: "message-1", role: "assistant" },
      toolCallEvent("message-1", "call-1", "write_note", {
        id: "note-2",
        text: "Olá",
      }),
      { type: "run-end", runId: "run-1", status: "completed" },
    ];
    const transport = new MockTransport({ script: events });
    const runtime = createAssistantRuntime({ transport, tools });

    const send = runtime.send("Write note 2");
    await vi.waitFor(() =>
      expect(runtime.getSnapshot().status).toBe("awaiting-confirmation"),
    );
    runtime.confirm(false);
    await send;

    const snapshot = runtime.getSnapshot();
    expect(snapshot.status).toBe("idle");
    expect(snapshot.pendingConfirmation).toBeNull();
    expect(calls.write).toBe(0);
    const call = toolPart(snapshot.messages, "call-1");
    const result = toolResult(snapshot.messages, "call-1");
    expect(call?.status).toBe("cancelled");
    expect(result?.status).toBe("cancelled");
  });

  it("cancels a pending confirmation with cancelAction", async () => {
    const { tools, calls } = createSimulatedTools();
    const events: readonly AssistantEvent[] = [
      { type: "run-start", runId: "run-1" },
      { type: "message-start", messageId: "message-1", role: "assistant" },
      toolCallEvent("message-1", "call-1", "write_note", {
        id: "note-2",
        text: "Olá",
      }),
      { type: "run-end", runId: "run-1", status: "completed" },
    ];
    const transport = new MockTransport({ script: events });
    const runtime = createAssistantRuntime({ transport, tools });

    const send = runtime.send("Write note 2");
    await vi.waitFor(() =>
      expect(runtime.getSnapshot().status).toBe("awaiting-confirmation"),
    );
    runtime.cancelAction("call-1");
    await send;

    const snapshot = runtime.getSnapshot();
    expect(snapshot.status).toBe("idle");
    expect(snapshot.pendingConfirmation).toBeNull();
    expect(calls.write).toBe(0);
    const result = toolResult(snapshot.messages, "call-1");
    expect(result?.status).toBe("cancelled");
  });

  it("cancels a running write tool", async () => {
    const events: readonly AssistantEvent[] = [
      { type: "run-start", runId: "run-1" },
      { type: "message-start", messageId: "message-1", role: "assistant" },
      toolCallEvent("message-1", "call-1", "write_note", {
        id: "note-2",
        text: "Olá",
      }),
      { type: "run-end", runId: "run-1", status: "completed" },
    ];
    const transport = new MockTransport({ script: events });
    const runtime = createAssistantRuntime({
      transport,
      tools: [
        defineAction({
          name: "write_note",
          access: "write",
          risk: "high",
          execute: async () => {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return { ok: true, value: { id: "note-2", text: "Olá" } };
          },
        }),
      ],
    });

    const send = runtime.send("Write note 2");
    await vi.waitFor(() =>
      expect(runtime.getSnapshot().status).toBe("awaiting-confirmation"),
    );
    runtime.confirm(true);
    await vi.waitFor(() =>
      expect(runtime.getSnapshot().status).toBe("executing-tool"),
    );
    runtime.cancelAction("call-1");
    await send;

    const snapshot = runtime.getSnapshot();
    expect(snapshot.status).toBe("idle");
    const call = toolPart(snapshot.messages, "call-1");
    const result = toolResult(snapshot.messages, "call-1");
    expect(call?.status).toBe("cancelled");
    expect(result?.status).toBe("cancelled");
  });

  it("fails write tool validation without confirmation or execution", async () => {
    const { tools, calls } = createSimulatedTools();
    const events: readonly AssistantEvent[] = [
      { type: "run-start", runId: "run-1" },
      { type: "message-start", messageId: "message-1", role: "assistant" },
      toolCallEvent("message-1", "call-1", "write_note", { id: "note-2" }),
      { type: "run-end", runId: "run-1", status: "completed" },
    ];
    const transport = new MockTransport({ script: events });
    const runtime = createAssistantRuntime({ transport, tools });

    await runtime.send("Write invalid");

    const snapshot = runtime.getSnapshot();
    expect(snapshot.status).toBe("idle");
    expect(snapshot.pendingConfirmation).toBeNull();
    expect(calls.write).toBe(0);
    const result = toolResult(snapshot.messages, "call-1");
    expect(result?.status).toBe("failed");
    expect(result?.error?.code).toBe("action");
  });

  it("executes a duplicated tool call only once", async () => {
    const { tools, calls } = createSimulatedTools();
    const events: readonly AssistantEvent[] = [
      { type: "run-start", runId: "run-1" },
      { type: "message-start", messageId: "message-1", role: "assistant" },
      toolCallEvent("message-1", "call-1", "read_note", { id: "note-1" }),
      toolCallEvent("message-1", "call-1", "read_note", { id: "note-1" }),
      { type: "run-end", runId: "run-1", status: "completed" },
    ];
    const transport = new MockTransport({ script: events });
    const runtime = createAssistantRuntime({ transport, tools });

    await runtime.send("Read duplicate");

    const snapshot = runtime.getSnapshot();
    expect(snapshot.status).toBe("idle");
    expect(calls.read).toBe(1);
    const results = snapshot.messages.flatMap((message) =>
      message.parts.filter(
        (part): part is ToolResultMessagePart =>
          part.type === "tool-result" && part.toolCallId === "call-1",
      ),
    );
    expect(results).toHaveLength(1);
    expect(results[0]?.status).toBe("completed");
  });

  it("marks tool results and clears pending confirmation on failure", async () => {
    const error = createAssistantError("action", "Boom.", { retryable: false });
    const tools = [defineFailingTool(error)];
    const events: readonly AssistantEvent[] = [
      { type: "run-start", runId: "run-1" },
      { type: "message-start", messageId: "message-1", role: "assistant" },
      toolCallEvent("message-1", "call-1", "fail_note", { id: "note-1" }),
      { type: "run-end", runId: "run-1", status: "completed" },
    ];
    const transport = new MockTransport({ script: events });
    const runtime = createAssistantRuntime({ transport, tools });

    await runtime.send("Fail");

    const snapshot = runtime.getSnapshot();
    expect(snapshot.status).toBe("idle");
    expect(snapshot.pendingConfirmation).toBeNull();
    const call = toolPart(snapshot.messages, "call-1");
    const result = toolResult(snapshot.messages, "call-1");
    expect(call?.status).toBe("failed");
    expect(result?.status).toBe("failed");
    expect(result?.error?.code).toBe("action");
    expect(result?.error?.message).toBe("Boom.");
  });
});

function defineFailingTool(error: AssistantError) {
  return defineAction({
    name: "fail_note",
    access: "read",
    risk: "low",
    execute: async () => ({ ok: false, error }),
  });
}
