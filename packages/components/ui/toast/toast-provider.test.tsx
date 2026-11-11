import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ToastProvider, useToast } from "./toast-provider";
import { useRef } from "react";

function Harness() {
  const toast = useToast().toast;
  return (
    <div>
      <button onClick={() => toast({ title: "Saved", variant: "success" })} type="button">
        Show
      </button>
      <button onClick={() => toast({ title: "Loading", variant: "loading" })} type="button">
        Loading
      </button>
      <button onClick={() => toast({ title: "Info", variant: "info" })} type="button">
        Info
      </button>
      <button onClick={() => toast({ title: "Dup", variant: "error" })} type="button">
        Dup
      </button>
    </div>
  );
}

describe("ToastProvider", () => {
  it("shows a toast", () => {
    render(
      <ToastProvider>
        <Harness />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText("Show"));
    expect(screen.getByRole("status")).toHaveTextContent("Saved");
  });

  it("renders the info variant", () => {
    render(
      <ToastProvider>
        <Harness />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText("Info"));
    expect(screen.getByRole("status")).toHaveClass("app-toast--info");
  });

  it("auto-dismisses after the configured duration", async () => {
    render(
      <ToastProvider defaultDuration={50}>
        <Harness />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText("Show"));
    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument(), { timeout: 2000 });
  });

  it("keeps loading toasts visible", async () => {
    render(
      <ToastProvider>
        <Harness />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText("Loading"));
    expect(screen.getByRole("status")).toHaveTextContent("Loading");
    await new Promise((resolve) => window.setTimeout(resolve, 100));
    expect(screen.getByRole("status")).toHaveTextContent("Loading");
  });

  it("prevents duplicate notifications", () => {
    render(
      <ToastProvider>
        <Harness />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Dup" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Dup");
    fireEvent.click(screen.getByRole("button", { name: "Dup" }));
    expect(screen.getAllByRole("alert")).toHaveLength(1);
  });

  it("dismisses manually", () => {
    render(
      <ToastProvider>
        <Harness />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText("Show"));
    fireEvent.click(screen.getByRole("button", { name: "Close notification" }));
    expect(screen.queryByText("Saved")).not.toBeInTheDocument();
  });
});

function UpdateHarness() {
  const { toast, update } = useToast();
  const idRef = useRef<string>("");
  return (
    <div>
      <button
        onClick={() => {
          idRef.current = toast({ title: "Loading", variant: "loading" });
          window.setTimeout(() => update?.(idRef.current, { title: "Done", variant: "success" }), 10);
        }}
        type="button"
      >
        Run
      </button>
    </div>
  );
}

describe("ToastProvider update", () => {
  it("updates the same toast", async () => {
    render(
      <ToastProvider>
        <UpdateHarness />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText("Run"));
    await waitFor(() => expect(screen.getByText("Done")).toBeInTheDocument(), { timeout: 2000 });
  });
});
