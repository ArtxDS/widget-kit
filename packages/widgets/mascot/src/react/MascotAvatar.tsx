"use client";

import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  type HTMLAttributes,
} from "react";
import { DEFAULT_MOODS } from "../core/moods";
import { applyThemeVars, resolveTheme } from "../core/theme";
import { buildAvatarSvg } from "../core/svg";
import { sanitizeSvg } from "../core/sanitize";
import type { ThemePreset, ThemeTokens } from "../core/types";

export type MascotAvatarProps = {
  mood?: string;
  size?: number | string;
  theme?: ThemePreset | Partial<ThemeTokens>;
} & Omit<HTMLAttributes<HTMLSpanElement>, "children">;

export const MascotAvatar = forwardRef<HTMLSpanElement, MascotAvatarProps>(
  function MascotAvatar(
    {
      mood = "idle",
      size = 36,
      theme = "aurora",
      className = "",
      style,
      ...rest
    },
    forwardedRef,
  ) {
    const reactId = useId().replace(/:/g, "");
    const def = DEFAULT_MOODS[mood] ?? DEFAULT_MOODS.idle;
    const markup = sanitizeSvg(buildAvatarSvg(reactId, def.eyes, def.mouth));
    const width = typeof size === "number" ? `${size}px` : size;
    const tokens = resolveTheme(theme);
    const nodeRef = useRef<HTMLSpanElement | null>(null);

    const setRef = (node: HTMLSpanElement | null) => {
      nodeRef.current = node;
      if (typeof forwardedRef === "function") {
        forwardedRef(node);
      } else if (forwardedRef) {
        forwardedRef.current = node;
      }
    };

    useEffect(() => {
      if (nodeRef.current) applyThemeVars(nodeRef.current, tokens);
    }, [tokens]);

    return (
      <span
        ref={setRef}
        className={`wk-mascot-avatar ${className}`.trim()}
        style={{ width, ...style }}
        data-mood={mood}
        {...rest}
        dangerouslySetInnerHTML={{ __html: markup }}
      />
    );
  },
);
