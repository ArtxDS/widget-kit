import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  MascotPlaygroundControls,
  MascotPlaygroundStage,
  useMascotPlayground,
} from "./mascot-playground";

function stubMascotRuntime() {
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) =>
    window.setTimeout(() => cb(performance.now()), 16),
  );
  vi.stubGlobal("cancelAnimationFrame", (id: number) => window.clearTimeout(id));
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
    onchange: null,
  }));
}

function PlaygroundHarness() {
  const playground = useMascotPlayground();
  return (
    <>
      <MascotPlaygroundControls playground={playground} />
      <MascotPlaygroundStage playground={playground} />
    </>
  );
}

describe("mascot playground", () => {
  beforeEach(() => {
    stubMascotRuntime();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the live mascot and speaks from the say action", async () => {
    render(<PlaygroundHarness />);

    expect(await screen.findByRole("img", { name: "Playground mascot" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "say" }));

    await waitFor(() => {
      expect(screen.getByText("Eu sou o mascote.")).toBeInTheDocument();
    });
  });

  it("hides ears when the part toggle is off", async () => {
    const { container } = render(<PlaygroundHarness />);
    await screen.findByRole("img", { name: "Playground mascot" });

    fireEvent.click(screen.getByRole("switch", { name: "Ears" }));

    await waitFor(() => {
      expect(container.querySelector('[data-part="ears"][display="none"]')).toBeTruthy();
    });
  });
});
