import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMascot, resetMascotIdCounter } from "../src/core/createMascot";

function mockBrowser(reduced = false) {
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) =>
    window.setTimeout(() => cb(performance.now()), 16),
  );
  vi.stubGlobal("cancelAnimationFrame", (id: number) => window.clearTimeout(id));
  const listeners = new Set<(ev: MediaQueryListEvent) => void>();
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: reduced,
    media: query,
    addEventListener: (_type: string, fn: (ev: MediaQueryListEvent) => void) => {
      listeners.add(fn);
    },
    removeEventListener: (_type: string, fn: (ev: MediaQueryListEvent) => void) => {
      listeners.delete(fn);
    },
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
    onchange: null,
    emit(matches: boolean) {
      listeners.forEach((fn) => fn({ matches } as MediaQueryListEvent));
    },
  }));
  return listeners;
}

describe("createMascot", () => {
  beforeEach(() => {
    resetMascotIdCounter();
    mockBrowser();
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.unstubAllGlobals();
  });

  it("mounts prefixed SVG, stays out of tab order, and destroys cleanly", () => {
    const a = document.createElement("div");
    const b = document.createElement("div");
    document.body.append(a, b);
    const one = createMascot(a);
    const two = createMascot(b);
    const svgA = a.querySelector("svg");
    const svgB = b.querySelector("svg");
    expect(svgA).toBeTruthy();
    expect(svgB).toBeTruthy();
    expect(a.innerHTML).toContain("m1-");
    expect(b.innerHTML).toContain("m2-");
    expect(svgA?.getAttribute("tabindex")).toBe("-1");
    one.destroy();
    expect(a.querySelector("svg")).toBeNull();
    two.destroy();
  });

  it("creates an aria-live bubble from say()", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const mascot = createMascot(host, { a11y: { announce: true } });
    mascot.say("Hello there");
    const bubble = host.querySelector(".wk-mascot__bubble");
    expect(bubble).toBeTruthy();
    expect(bubble?.getAttribute("aria-live")).toBe("polite");
    expect(bubble?.textContent).toContain("Hello there");
    mascot.destroy();
  });

  it("changes mood under reduced motion and reacts to the media query", () => {
    resetMascotIdCounter();
    mockBrowser(true);
    const host = document.createElement("div");
    document.body.append(host);
    const mascot = createMascot(host, { behavior: { reducedMotion: "auto" } });
    const moods: string[] = [];
    mascot.on("moodchange", (event) => moods.push(event.mood));
    mascot.setMood("error");
    expect(moods).toContain("error");
    expect(host.querySelector('[data-eyes="sad"]:not([display="none"])')).toBeTruthy();
    mascot.destroy();
  });

  it("toggles parts, looks at a target, and maps generic ui events", () => {
    const host = document.createElement("div");
    const target = document.createElement("button");
    document.body.append(host, target);
    const mascot = createMascot(host, {
      parts: { ears: "pods", accessory: "none" },
      a11y: { announce: true },
      messages: { "ui:success": "Nice" },
    });
    expect(host.querySelector('[data-part="ears"]:not([display="none"])')).toBeTruthy();
    mascot.setOptions({ parts: { ears: "none", accessory: "glasses" } });
    expect(host.querySelector('[data-part="ears"][display="none"]')).toBeTruthy();
    expect(host.querySelector('[data-node="accessory"]:not([display="none"])')).toBeTruthy();
    mascot.lookAt(target);
    mascot.lookAt(null);
    mascot.emit("ui:success");
    expect(host.querySelector('[data-eyes="happy"]:not([display="none"])')).toBeTruthy();
    expect(host.querySelector(".wk-mascot__bubble")?.textContent).toContain("Nice");
    mascot.destroy();
  });
});

describe("createMascot sanitization", () => {
  beforeEach(() => {
    resetMascotIdCounter();
    mockBrowser();
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.unstubAllGlobals();
  });

  it("removes script tags from custom SVG slots", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const mascot = createMascot(host, {
      parts: { accessory: { svg: "<g><script>alert(1)</script><circle cx=\"1\"/></g>" } },
    });
    expect(host.innerHTML).not.toContain("<script");
    expect(host.innerHTML).toContain("<circle");
    mascot.destroy();
  });

  it("keeps the mascot body after sanitization", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const mascot = createMascot(host);
    expect(host.querySelector('[data-node="body"]')).toBeTruthy();
    expect(
      host.querySelector('[data-node="body"] path[fill*="-pe"]'),
    ).toBeTruthy();
    mascot.destroy();
  });
});
