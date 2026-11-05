import { createRef } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Toast } from "./toast";

describe("Toast", () => {
  it("renders a compact success notification", () => {
    render(
      <Toast
        description="Your update is ready."
        open
        title="Changes saved"
        variant="success"
      />,
    );

    const notification = screen.getByRole("status");
    expect(within(notification).getByText("Changes saved")).toBeInTheDocument();
    expect(
      within(notification).getByText("Your update is ready."),
    ).toBeInTheDocument();
    expect(notification).toHaveClass("app-toast--normal", "app-toast--success");
  });

  it("shows a spinner and busy state while loading", () => {
    render(<Toast open title="Saving changes" variant="loading" />);

    const notification = screen.getByRole("status");
    expect(notification).toHaveAttribute("aria-busy", "true");
    expect(notification.querySelector(".app-toast__icon")).toHaveClass(
      "is-spinning",
    );
  });

  it("renders step progress when using the steps mode", () => {
    render(
      <Toast
        mode="steps"
        open
        steps={[
          { label: "Preparing changes", status: "complete" },
          { label: "Saving update", status: "current" },
          { label: "Refreshing dashboard", status: "pending" },
        ]}
        title="Updating workspace"
        variant="loading"
      />,
    );

    const notification = screen.getByRole("status");
    expect(notification).toHaveClass("app-toast--steps");
    expect(within(notification).getByText("Preparing changes")).toBeInTheDocument();
    expect(within(notification).getByText("Saving update")).toBeInTheDocument();
    expect(within(notification).getByText("Refreshing dashboard")).toBeInTheDocument();
  });

  it("uses an alert role for errors and calls onClose", () => {
    const onClose = vi.fn();
    render(
      <Toast
        onClose={onClose}
        open
        title="Could not save"
        variant="error"
      />,
    );

    const notification = screen.getByRole("alert");
    fireEvent.click(
      within(notification).getByRole("button", {
        name: "Close notification",
      }),
    );
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("hides the notification while closed", () => {
    render(<Toast open={false} title="Changes saved" variant="success" />);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByText("Changes saved").closest("section")).toHaveClass(
      "is-closed",
    );
  });

  it("applies inert only while closed", () => {
    const { rerender } = render(
      <Toast open title="Changes saved" variant="success" />,
    );

    expect(screen.getByRole("status")).not.toHaveAttribute("inert");

    rerender(<Toast open={false} title="Changes saved" variant="success" />);

    expect(screen.getByText("Changes saved").closest("section")).toHaveAttribute(
      "inert",
    );
  });
});

describe("Toast accessibility and API", () => {
  it("applies a custom className", () => {
    render(<Toast className="custom-toast" open title="Saved" variant="success" />);
    expect(screen.getByRole("status")).toHaveClass("custom-toast");
  });

  it("forwards a ref to the notification", () => {
    const ref = createRef<HTMLElement>();
    render(<Toast open ref={ref} title="Saved" variant="success" />);
    expect(ref.current).toBe(screen.getByRole("status"));
  });

  it("uses a configurable close label", () => {
    const onClose = vi.fn();
    render(
      <Toast closeLabel="Fechar" onClose={onClose} open title="Saved" variant="success" />,
    );
    expect(screen.getByRole("button", { name: "Fechar" })).toBeInTheDocument();
  });

  it("calls onClose when Escape is pressed", () => {
    const onClose = vi.fn();
    render(<Toast onClose={onClose} open title="Saved" variant="success" />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("does not expose aria-live while closed", () => {
    render(<Toast open={false} title="Saved" variant="error" />);
    expect(screen.getByText("Saved").closest("section")).not.toHaveAttribute(
      "aria-live",
    );
  });

  it("forwards native props", () => {
    render(
      <Toast data-testid="toast" id="toast-1" open title="Saved" variant="success" />,
    );
    const toast = screen.getByTestId("toast");
    expect(toast).toHaveAttribute("id", "toast-1");
  });
});
