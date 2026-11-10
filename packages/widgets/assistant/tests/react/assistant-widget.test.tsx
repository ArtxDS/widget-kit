import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  AssistantMessage,
  AssistantWidget,
} from "../../src";
import {
  createAssistantError,
  type AssistantEvent,
  type ChatMessage,
} from "../../src/core";
import { MockTransport } from "../../src/transport";

function buttonMessage(): ChatMessage {
  return {
    id: "message-actions",
    role: "assistant",
    status: "complete",
    parts: [
      {
        type: "text",
        id: "text-actions",
        text: "Your refund is ready.",
      },
      {
        type: "buttons",
        id: "buttons-refund",
        buttons: [
          {
            id: "refund",
            label: "Refund now",
            action: "refund",
            payload: { orderId: "order-1" },
          },
        ],
      },
    ],
  };
}

describe("assistant widget", () => {
  it("opens from the launcher, focuses the composer, and streams a reply", async () => {
    const user = userEvent.setup();
    const transport = new MockTransport({
      script: "Hello from the mock transport.",
      chunkSize: 7,
    });

    render(<AssistantWidget transport={transport} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Assistant" }));

    const dialog = screen.getByRole("dialog", { name: "Assistant" });
    const input = within(dialog).getByRole("textbox", {
      name: "Write a message...",
    });
    expect(input).toHaveFocus();

    await user.type(input, "Hi there{Enter}");

    expect(await within(dialog).findByText("Hi there")).toBeInTheDocument();
    await waitFor(() =>
      expect(
        within(dialog).getByText("Hello from the mock transport."),
      ).toBeInTheDocument(),
    );
    expect(within(dialog).getByRole("log")).toHaveAttribute(
      "aria-live",
      "polite",
    );
    expect(input).toHaveValue("");
  });

  it("sends a suggestion prompt", async () => {
    const user = userEvent.setup();
    const transport = new MockTransport({ script: "Order is on the way." });

    render(
      <AssistantWidget
        defaultDisplayState="open"
        suggestions={[
          { label: "Track order", prompt: "Where is order 123?" },
        ]}
        transport={transport}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Track order" }));

    expect(
      await screen.findByText("Where is order 123?"),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Order is on the way."),
    ).toBeInTheDocument();
  });

  it("honors controlled display state and reports minimize and restore", async () => {
    const user = userEvent.setup();
    const onDisplayStateChange = vi.fn();
    const transport = new MockTransport();
    const { rerender } = render(
      <AssistantWidget
        displayState="open"
        onDisplayStateChange={onDisplayStateChange}
        transport={transport}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Minimize assistant" }),
    );
    expect(onDisplayStateChange).toHaveBeenLastCalledWith("minimized");
    expect(screen.getByRole("dialog", { name: "Assistant" })).toBeVisible();

    rerender(
      <AssistantWidget
        displayState="minimized"
        onDisplayStateChange={onDisplayStateChange}
        transport={transport}
      />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Restore assistant" }),
    );
    expect(onDisplayStateChange).toHaveBeenLastCalledWith("open");
  });

  it("closes with Escape and returns focus to the launcher", async () => {
    const user = userEvent.setup();
    const transport = new MockTransport();

    render(<AssistantWidget defaultDisplayState="open" transport={transport} />);

    await user.click(
      screen.getByRole("textbox", { name: "Write a message..." }),
    );
    await user.keyboard("{Escape}");

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: "Assistant" })).toHaveFocus();
  });

  it("cancels an in-flight response", async () => {
    const user = userEvent.setup();
    const transport = new MockTransport({
      script: "This response should be cancelled.",
      delayMs: 500,
    });

    render(<AssistantWidget defaultDisplayState="open" transport={transport} />);

    await user.type(
      screen.getByRole("textbox", { name: "Write a message..." }),
      "Wait for it{Enter}",
    );
    await user.click(
      await screen.findByRole("button", { name: "Stop generating" }),
    );

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Send message" }),
      ).toBeInTheDocument(),
    );
    expect(
      screen.queryByText("This response should be cancelled."),
    ).not.toBeInTheDocument();
  });

  it("shows an error and retries the failed run", async () => {
    const user = userEvent.setup();
    const transport = new MockTransport({
      error: (_request, callIndex) =>
        callIndex === 0
          ? createAssistantError("transport", "Network is unavailable.", {
              retryable: true,
            })
          : undefined,
      script: "Recovered response.",
    });

    render(<AssistantWidget defaultDisplayState="open" transport={transport} />);

    await user.type(
      screen.getByRole("textbox", { name: "Write a message..." }),
      "Try this{Enter}",
    );

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Network is unavailable.");

    await user.click(screen.getByRole("button", { name: "Try again" }));

    await waitFor(() =>
      expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
    );
    expect(
      await screen.findByText("Recovered response."),
    ).toBeInTheDocument();
  });

  it("asks for confirmation before a high-risk tool call", async () => {
    const user = userEvent.setup();
    const events: readonly AssistantEvent[] = [
      { type: "run-start", runId: "run-1" },
      {
        type: "message-start",
        messageId: "message-1",
        role: "assistant",
      },
      {
        type: "part-start",
        messageId: "message-1",
        part: { type: "text", id: "text-1", text: "" },
      },
      {
        type: "text-delta",
        messageId: "message-1",
        partId: "text-1",
        delta: "Preparing transfer",
      },
      {
        type: "tool-call",
        toolCallId: "call-1",
        name: "transfer",
        input: { amount: 10 },
        risk: "high",
      },
      {
        type: "tool-result",
        toolCallId: "call-1",
        output: { ok: true },
      },
      { type: "message-end", messageId: "message-1" },
      { type: "run-end", runId: "run-1", status: "completed" },
    ];
    const transport = new MockTransport({
      script: events,
      delayMs: (_event, index) => (index === 5 ? 300 : 0),
    });

    render(<AssistantWidget defaultDisplayState="open" transport={transport} />);

    await user.type(
      screen.getByRole("textbox", { name: "Write a message..." }),
      "Transfer{Enter}",
    );

    expect(
      await screen.findByText("Approve this action?"),
    ).toBeInTheDocument();
    expect(
      within(
        screen.getByRole("group", { name: "Approve this action?" }),
      ).queryByText("transfer"),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Approve" }));

    await waitFor(() =>
      expect(screen.queryByText("Approve this action?")).not.toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(screen.getAllByText("Completed").length).toBeGreaterThan(0),
    );
  });

  it("invokes onAction for message buttons", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const transport = new MockTransport();

    render(
      <AssistantWidget
        defaultDisplayState="open"
        initialMessages={[buttonMessage()]}
        onAction={onAction}
        transport={transport}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Refund now" }));

    expect(onAction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "refund",
        payload: { orderId: "order-1" },
        message: expect.objectContaining({ id: "message-actions" }),
      }),
    );
  });

  it("applies labels, class names, and footer slots", () => {
    const transport = new MockTransport();

    render(
      <AssistantWidget
        classNames={{ panel: "custom-panel" }}
        defaultDisplayState="open"
        labels={{ title: "Copilot", emptyTitle: "How can I help?" }}
        slots={{ footer: <span>Custom footer</span> }}
        transport={transport}
      />,
    );

    expect(screen.getByRole("dialog", { name: "Copilot" })).toHaveClass(
      "custom-panel",
    );
    expect(screen.getByText("How can I help?")).toBeInTheDocument();
    expect(screen.getByText("Custom footer")).toBeInTheDocument();
  });

  it("renders markdown without allowing raw HTML or unsafe links", () => {
    const message: ChatMessage = {
      id: "markdown-message",
      role: "assistant",
      status: "complete",
      parts: [
        {
          type: "text",
          id: "markdown-text",
          format: "markdown",
          text: [
            "# Hello",
            "",
            "[Safe](https://example.com)",
            "",
            "[Bad](javascript:alert(1))",
            "",
            "<img src=x onerror=alert(1)>",
          ].join("\n"),
        },
      ],
    };

    const { container } = render(<AssistantMessage message={message} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Hello" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Safe" })).toHaveAttribute(
      "href",
      "https://example.com",
    );
    expect(screen.getByRole("link", { name: "Safe" })).toHaveAttribute(
      "rel",
      "noreferrer noopener",
    );
    expect(screen.queryByRole("link", { name: "Bad" })).not.toBeInTheDocument();
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector('a[href^="javascript:"]')).toBeNull();
  });

  it("reveals a scroll-to-latest control when the conversation is scrolled up", async () => {
    vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(
      1000,
    );
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(
      400,
    );
    const user = userEvent.setup();
    const transport = new MockTransport();

    render(
      <AssistantWidget
        defaultDisplayState="open"
        initialMessages={[buttonMessage()]}
        transport={transport}
      />,
    );

    const log = screen.getByRole("log");
    log.scrollTop = 0;
    fireEvent.scroll(log);

    const button = await screen.findByRole("button", {
      name: "Scroll to latest message",
    });
    await user.click(button);

    expect(log.scrollTop).toBe(1000);
    expect(
      screen.queryByRole("button", { name: "Scroll to latest message" }),
    ).not.toBeInTheDocument();
  });
});
