"use client";

import { useId, type HTMLAttributes } from "react";
import { DEFAULT_MOODS } from "../core/moods";
import { applyThemeVars, resolveTheme } from "../core/theme";
import { buildAvatarSvg } from "../core/svg";
import type { ThemePreset, ThemeTokens } from "../core/types";

export type MascotAvatarProps = {
  mood?: string;
  size?: number | string;
  theme?: ThemePreset | Partial<ThemeTokens>;
} & Omit<HTMLAttributes<HTMLSpanElement>, "children">;

export function MascotAvatar({
  mood = "idle",
  size = 36,
  theme = "aurora",
  className = "",
  style,
  ...rest
}: MascotAvatarProps) {
  const reactId = useId().replace(/:/g, "");
  const def = DEFAULT_MOODS[mood] ?? DEFAULT_MOODS.idle;
  const markup = buildAvatarSvg(reactId, def.eyes, def.mouth);
  const width = typeof size === "number" ? `${size}px` : size;
  const tokens = resolveTheme(theme);

  return (
    <span
      className={`wk-mascot-avatar ${className}`.trim()}
      style={{ width, ...style }}
      ref={(node) => {
        if (node) applyThemeVars(node, tokens);
      }}
      data-mood={mood}
      {...rest}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
