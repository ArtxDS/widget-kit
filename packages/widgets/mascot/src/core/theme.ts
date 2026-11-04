import { aurora, isThemePreset, themePresets } from "../presets";
import type {
  CssVarName,
  ThemePreset,
  ThemeTokens,
} from "./types";

export const TOKEN_TO_CSS: Record<keyof ThemeTokens, CssVarName> = {
  accentA: "--mascot-accent-a",
  accentMid: "--mascot-accent-mid",
  accentB: "--mascot-accent-b",
  eyeFrom: "--mascot-eye-from",
  eyeTo: "--mascot-eye-to",
  shell1: "--mascot-shell-1",
  shell2: "--mascot-shell-2",
  shell3: "--mascot-shell-3",
  shellEdge: "--mascot-shell-edge",
  screen1: "--mascot-screen-1",
  screen2: "--mascot-screen-2",
  neck1: "--mascot-neck-1",
  neck2: "--mascot-neck-2",
  neck3: "--mascot-neck-3",
  base1: "--mascot-base-1",
  base2: "--mascot-base-2",
  shadow: "--mascot-shadow",
  bubbleBg: "--mascot-bubble-bg",
  bubbleFg: "--mascot-bubble-fg",
  bubbleBorderA: "--mascot-bubble-border-a",
  bubbleBorderB: "--mascot-bubble-border-b",
};

export const TOKEN_FALLBACKS: ThemeTokens = { ...aurora };

export function resolveTheme(
  theme?: ThemePreset | Partial<ThemeTokens>,
  current: ThemeTokens = aurora,
): ThemeTokens {
  if (!theme) return { ...current };
  if (typeof theme === "string") {
    return { ...(themePresets[theme] ?? aurora) };
  }
  return { ...current, ...theme };
}

export function applyThemeVars(el: HTMLElement, tokens: ThemeTokens): void {
  const keys = Object.keys(TOKEN_TO_CSS) as (keyof ThemeTokens)[];
  for (const key of keys) {
    el.style.setProperty(TOKEN_TO_CSS[key], tokens[key]);
  }
}

export function readThemeVars(el: HTMLElement): Partial<ThemeTokens> {
  const result: Partial<ThemeTokens> = {};
  const keys = Object.keys(TOKEN_TO_CSS) as (keyof ThemeTokens)[];
  for (const key of keys) {
    const value = el.style.getPropertyValue(TOKEN_TO_CSS[key]).trim();
    if (value) result[key] = value;
  }
  return result;
}

export { isThemePreset, themePresets };
