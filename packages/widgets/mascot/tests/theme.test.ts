import { describe, expect, it } from "vitest";
import {
  TOKEN_FALLBACKS,
  TOKEN_TO_CSS,
  applyThemeVars,
  resolveTheme,
} from "../src/core/theme";
import { aurora, mono, ocean, sunset } from "../src/presets";

describe("theme", () => {
  it("exposes fallbacks for every CSS token", () => {
    const keys = Object.keys(TOKEN_TO_CSS) as (keyof typeof TOKEN_TO_CSS)[];
    for (const key of keys) {
      expect(TOKEN_FALLBACKS[key]).toBeTruthy();
      expect(TOKEN_TO_CSS[key].startsWith("--mascot-")).toBe(true);
    }
  });

  it("has complete presets", () => {
    for (const preset of [aurora, ocean, sunset, mono]) {
      expect(Object.keys(preset).sort()).toEqual(Object.keys(aurora).sort());
    }
  });

  it("updates CSS variables on setTheme without replacing missing tokens", () => {
    const el = document.createElement("div");
    applyThemeVars(el, resolveTheme("aurora"));
    expect(el.style.getPropertyValue("--mascot-accent-a")).toBe(aurora.accentA);
    applyThemeVars(el, resolveTheme({ accentA: "#ff0000" }, aurora));
    expect(el.style.getPropertyValue("--mascot-accent-a")).toBe("#ff0000");
    expect(el.style.getPropertyValue("--mascot-accent-b")).toBe(aurora.accentB);
  });
});
