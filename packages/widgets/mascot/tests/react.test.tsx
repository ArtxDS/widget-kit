import { fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Mascot } from "../src/react/Mascot";
import { MascotAvatar } from "../src/react/MascotAvatar";
import { SpeechBubble } from "../src/react/SpeechBubble";
import { MascotProvider, useMascot } from "../src/react/MascotProvider";
import type { MascotInstance } from "../src/core/types";

describe("React and SSR", () => {
  it("mounts and unmounts Mascot without leaking the SVG", () => {
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
    const { container, unmount } = render(<Mascot options={{ size: 120 }} />);
    expect(container.querySelector("svg")).toBeTruthy();
    unmount();
    expect(document.querySelector(".wk-mascot")).toBeNull();
  });

  it("makes emit a safe no-op without a provider", () => {
    const { result } = renderHook(() => useMascot());
    expect(() => result.current.emit("ui:success")).not.toThrow();
  });

  it("can renderToString client components without touching window at import", () => {
    expect(() => renderToString(<MascotAvatar mood="happy" />)).not.toThrow();
    expect(() => renderToString(<Mascot />)).not.toThrow();
  });

  it("exposes the instance through onReady", async () => {
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
    const onReady = vi.fn();
    render(<Mascot options={{ size: 100 }} onReady={onReady} />);
    expect(onReady).toHaveBeenCalledTimes(1);
    onReady.mock.calls[0][0].setMood("celebrate");
    expect(document.querySelector('[data-eyes="happy"]:not([display="none"])')).toBeTruthy();
  });
});

describe("Mascot ref", () => {
  it("exposes the instance after mount instead of throwing", () => {
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

    const ref = createRef<MascotInstance | null>();
    render(<Mascot options={{ size: 100 }} ref={ref} />);
    expect(ref.current).not.toBeNull();
    expect(() => ref.current?.setMood("happy")).not.toThrow();
  });
});

describe("MascotProvider muted state", () => {
  it("updates context and host state when muted changes", async () => {
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

    function Consumer() {
      const { muted, setMuted } = useMascot();
      return (
        <button onClick={() => setMuted(true)} type="button">
          {String(muted)}
        </button>
      );
    }

    render(
      <MascotProvider>
        <Consumer />
      </MascotProvider>,
    );

    const button = screen.getByRole("button");
    const host = document.querySelector(".wk-mascot-host");
    expect(button).toHaveTextContent("false");
    expect(host).toHaveAttribute("data-muted", "false");

    fireEvent.click(button);

    await waitFor(() => expect(button).toHaveTextContent("true"));
    expect(host).toHaveAttribute("data-muted", "true");
  });
});

describe("SpeechBubble", () => {
  it("renders nothing without speech", () => {
    const { container } = render(<SpeechBubble />);
    expect(container.firstChild).toBeNull();
  });
});

describe("MascotProvider speech tracking", () => {
  it("tracks speech triggered by emit", async () => {
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

    function Consumer() {
      const { emit } = useMascot();
      return (
        <button onClick={() => emit("ui:success")} type="button">
          emit
        </button>
      );
    }

    render(
      <MascotProvider options={{ messages: { "ui:success": "Nice work" } }}>
        <SpeechBubble />
        <Consumer />
      </MascotProvider>,
    );

    await waitFor(() => expect(document.querySelector(".wk-mascot-host")).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "emit" }));
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.getByRole("status")).toHaveTextContent("Nice work");
  });
});
