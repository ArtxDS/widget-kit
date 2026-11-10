import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { AssistantWidget } from "../../src";
import { MockTransport } from "../../src/transport";
import { createSimulatedTools } from "../../examples/simulated-tools";
import type { AssistantEvent } from "../../src/core";

function toolCallEvent(
  messageId: string,
  toolCallId: string,
  name: string,
  input?: unknown,
  access?: "read" | "write",
): AssistantEvent {
  return {
    type: "tool-call",
    toolCallId,
    name,
    input,
    access,
    messageId,
  };
}

function toolRunEvents(
  toolCallId: string,
  name: string,
  input?: unknown,
  access?: "read" | "write",
): readonly AssistantEvent[] {
  return [
    { type: "run-start", runId: "run-1" },
    { type: "message-start", messageId: "message-1", role: "assistant" },
    toolCallEvent("message-1", toolCallId, name, input, access),
    { type: "run-end", runId: "run-1", status: "completed" },
  ];
}

function resultCard(container: HTMLElement, toolCallId: string): HTMLElement {
  const cards = container.querySelectorAll(
    `[data-tool-call-id="${toolCallId}"]`,
  );
  return cards[cards.length - 1] as HTMLElement;
}

describe("assistant tool UI", () => {
  it("renders tool call and result cards by status", () => {
    const { container } = render(
      <AssistantWidget
        defaultDisplayState="open"
        transport={new MockTransport()}
        initialMessages={[
          {
            id: "message-1",
            role: "assistant",
            status: "complete",
            parts: [
              {
                type: "tool-call",
                id: "tool-call-1",
                toolCallId: "call-1",
                name: "read_note",
                access: "read",
                status: "running",
              },
              {
                type: "tool-result",
                id: "tool-result-1",
                toolCallId: "call-1",
                name: "read_note",
                output: { id: "note-1", text: "Bem-vindo" },
                status: "completed",
              },
              {
                type: "tool-call",
                id: "tool-call-2",
                toolCallId: "call-2",
                name: "write_note",
                access: "write",
                status: "failed",
              },
              {
                type: "tool-result",
                id: "tool-result-2",
                toolCallId: "call-2",
                name: "write_note",
                status: "cancelled",
              },
            ],
          },
        ]}
      />
    );

    const call1Cards = container.querySelectorAll(
      '[data-tool-call-id="call-1"]',
    );
    expect(call1Cards).toHaveLength(2);
    expect(within(call1Cards[0]! as HTMLElement).getByText("Running")).toBeInTheDocument();
    expect(within(call1Cards[0]! as HTMLElement).getByText("read_note")).toBeInTheDocument();
    expect(within(call1Cards[1]! as HTMLElement).getByText("Completed")).toBeInTheDocument();
    expect(within(call1Cards[1]! as HTMLElement).getByText(/Bem-vindo/)).toBeInTheDocument();

    const call2Cards = container.querySelectorAll(
      '[data-tool-call-id="call-2"]',
    );
    expect(call2Cards).toHaveLength(2);
    expect(within(call2Cards[0]! as HTMLElement).getByText("Failed")).toBeInTheDocument();

    const cancelledResult = call2Cards[1]!;
    expect(cancelledResult.classList.contains("wk-assistant__tool-result-card--cancelled")).toBe(true);
    expect(cancelledResult.querySelector(".wk-assistant__tool-result-cancelled")).not.toBeNull();
  });

  it("shows confirmation for write tools and completes after approve", async () => {
    const user = userEvent.setup();
    const { tools } = createSimulatedTools();
    const writeTool = tools.find((tool) => tool.name === "write_note");
    if (!writeTool) throw new Error("write_note tool missing");

    const { container } = render(
      <AssistantWidget
        defaultDisplayState="open"
        tools={[writeTool]}
        transport={new MockTransport({
          script: toolRunEvents("call-1", "write_note", {
            id: "note-2",
            text: "Olá",
          }),
        })}
      />,
    );

    await user.type(
      screen.getByRole("textbox", { name: "Write a message..." }),
      "Escrever{Enter}",
    );

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Approve" })).toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(screen.getByText("Approve this action?")).toBeInTheDocument(),
    );
    const confirmationSection = screen
      .getByText("Approve this action?")
      .closest("section");
    expect(within(confirmationSection!).queryByText("write_note")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Approve" }));

    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "Approve" }),
      ).not.toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(
        within(resultCard(container, "call-1")).getByText("Completed"),
      ).toBeInTheDocument(),
    );
    expect(within(resultCard(container, "call-1")).getByText(/Olá/)).toBeInTheDocument();
  });

  it("cancels confirmation for write tools", async () => {
    const user = userEvent.setup();
    const { tools } = createSimulatedTools();
    const writeTool = tools.find((tool) => tool.name === "write_note");
    if (!writeTool) throw new Error("write_note tool missing");

    render(
      <AssistantWidget
        defaultDisplayState="open"
        tools={[writeTool]}
        transport={new MockTransport({
          script: toolRunEvents("call-1", "write_note", {
            id: "note-2",
            text: "Olá",
          }),
        })}
      />,
    );

    await user.type(
      screen.getByRole("textbox", { name: "Write a message..." }),
      "Escrever{Enter}",
    );

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Reject" })).toBeInTheDocument(),
    );

    await user.click(screen.getByRole("button", { name: "Reject" }));

    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "Reject" }),
      ).not.toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(screen.getAllByText("Cancelled").length).toBeGreaterThan(0),
    );
  });

  it("does not show confirmation when write parameters are invalid", async () => {
    const { tools } = createSimulatedTools();
    const writeTool = tools.find((tool) => tool.name === "write_note");
    if (!writeTool) throw new Error("write_note tool missing");

    const { container } = render(
      <AssistantWidget
        defaultDisplayState="open"
        tools={[writeTool]}
        transport={new MockTransport({
          script: toolRunEvents("call-1", "write_note", { id: "note-2" }),
        })}
      />,
    );

    const user = userEvent.setup();
    await user.type(
      screen.getByRole("textbox", { name: "Write a message..." }),
      "Escrever{Enter}",
    );

    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "Approve" }),
      ).not.toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(within(resultCard(container, "call-1")).getByText("Failed")).toBeInTheDocument(),
    );
  });

  it("executes read tools without confirmation", async () => {
    const { tools } = createSimulatedTools();
    const readTool = tools.find((tool) => tool.name === "read_note");
    if (!readTool) throw new Error("read_note tool missing");

    const { container } = render(
      <AssistantWidget
        defaultDisplayState="open"
        tools={[readTool]}
        transport={new MockTransport({
          script: toolRunEvents("call-1", "read_note", { id: "note-1" }),
        })}
      />,
    );

    const user = userEvent.setup();
    await user.type(
      screen.getByRole("textbox", { name: "Write a message..." }),
      "Ler{Enter}",
    );

    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "Approve" }),
      ).not.toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(within(resultCard(container, "call-1")).getByText("Completed")).toBeInTheDocument(),
    );
    expect(within(resultCard(container, "call-1")).getByText(/Bem-vindo/)).toBeInTheDocument();
  });
});
