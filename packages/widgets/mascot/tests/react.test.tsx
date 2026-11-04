import { render, renderHook } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Mascot } from "../src/react/Mascot";
import { MascotAvatar } from "../src/react/MascotAvatar";
import { useMascot } from "../src/react/MascotProvider";

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
