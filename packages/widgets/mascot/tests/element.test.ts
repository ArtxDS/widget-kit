import { afterEach, describe, expect, it, vi } from "vitest";
import { defineMascotElement } from "../src/element/defineMascotElement";

describe("mascot-bot custom element", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("is idempotent and reflects attributes into custom events", () => {
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

    const first = defineMascotElement();
    const second = defineMascotElement();
    expect(first).toBe(second);

    const el = document.createElement("mascot-bot") as HTMLElement & {
      emit: (event: string) => void;
    };
    el.setAttribute("theme", "aurora");
    el.setAttribute("size", "180");
    const events: Event[] = [];
    el.addEventListener("mascot:moodchange", (event) => events.push(event));
    document.body.append(el);
    expect(el.querySelector("svg")).toBeTruthy();
    el.setAttribute("mood", "happy");
    expect(events.some((event) => event instanceof CustomEvent)).toBe(true);
    el.remove();
  });
});
