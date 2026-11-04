import type { ThemePreset, ThemeTokens } from "../core/types";
import { aurora } from "./aurora";
import { mono } from "./mono";
import { ocean } from "./ocean";
import { sunset } from "./sunset";

export { aurora } from "./aurora";
export { mono } from "./mono";
export { ocean } from "./ocean";
export { sunset } from "./sunset";

export const themePresets: Record<ThemePreset, ThemeTokens> = {
  aurora,
  ocean,
  sunset,
  mono,
};

export function isThemePreset(value: string): value is ThemePreset {
  return value === "aurora" || value === "ocean" || value === "sunset" || value === "mono";
}
