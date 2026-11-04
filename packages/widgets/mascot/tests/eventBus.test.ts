import { describe, expect, it, vi } from "vitest";
import { createMascot } from "../src/core/createMascot";
import {
  createEventBus,
  resolveReaction,
} from "../src/core/eventBus";

function mockBrowser() {
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

describe("event bus and emit", () => {
  it("returns an unsubscribe function from on()", () => {
    const bus = createEventBus();
    const fn = vi.fn();
    const off = bus.on("click", fn);
    bus.emitOut("click", { x: 1, y: 2 });
    off();
    bus.emitOut("click", { x: 3, y: 4 });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("ignores unknown events and supports generic ui:* events", () => {
    expect(resolveReaction("not:a-thing")).toBeUndefined();
    expect(resolveReaction("ui:success")?.mood).toBe("happy");
    expect(resolveReaction("ui:loading")?.mood).toBe("loading");
  });

  it("reacts through eventMap, mutes emit, and ignores unknown names", () => {
    mockBrowser();
    const host = document.createElement("div");
    document.body.appendChild(host);
    const mascot = createMascot(host, {
      eventMap: {
        "checkout:paid": { mood: "celebrate", bubble: "Paid!" },
      },
      a11y: { announce: true },
    });
    const mood = vi.fn();
    mascot.on("moodchange", mood);
    mascot.emit("nope:unknown");
    expect(mood).not.toHaveBeenCalled();
    mascot.emit("checkout:paid");
    expect(mood).toHaveBeenCalled();
    mascot.mute(true);
    mascot.emit("ui:error");
    const afterMute = mood.mock.calls.length;
    expect(mood.mock.calls.length).toBe(afterMute);
    mascot.destroy();
    host.remove();
  });
});
