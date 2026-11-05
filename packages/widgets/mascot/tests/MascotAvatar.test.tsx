import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MascotAvatar } from "../src/react/MascotAvatar";

describe("MascotAvatar", () => {
  it("renders a static SVG and never starts an animation loop", () => {
    const raf = vi.spyOn(window, "requestAnimationFrame");
    const { container, rerender } = render(<MascotAvatar mood="idle" />);
    expect(container.querySelector("svg")).toBeTruthy();
    expect(container.querySelector("[data-eyes]")).toBeTruthy();
    expect(raf).not.toHaveBeenCalled();
    rerender(<MascotAvatar mood="error" />);
    expect(container.querySelector('[data-mood="error"]')).toBeTruthy();
    raf.mockRestore();
  });

  it("swaps eye and mouth groups when mood changes", () => {
    const { container, rerender } = render(<MascotAvatar mood="idle" />);
    const idle = container.innerHTML;
    rerender(<MascotAvatar mood="error" />);
    expect(container.innerHTML).not.toBe(idle);
    expect(container.querySelector("[data-mouth]")).toBeTruthy();
  });
});

describe("MascotAvatar theme", () => {
  it("applies and updates theme variables", () => {
    const { container, rerender } = render(<MascotAvatar mood="idle" theme="aurora" />);
    const node = container.firstChild as HTMLElement;
    expect(node.style.getPropertyValue("--mascot-accent-a")).toBe("#9945FF");

    rerender(<MascotAvatar mood="idle" theme="ocean" />);
    expect(node.style.getPropertyValue("--mascot-accent-a")).toBe("#0EA5E9");
  });
});
