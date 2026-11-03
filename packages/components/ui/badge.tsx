import { tw } from "@/lib/tailwind";
import type { HTMLAttributes } from "react";

export type BadgeTone = "purple" | "cyan" | "green" | "amber" | "muted";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
  dot?: boolean;
};

export function Badge({
  children,
  className = "",
  dot = false,
  tone = "muted",
  ...props
}: BadgeProps) {
  return (
    <span
      className={tw(`wk-badge wk-badge--${tone} ${className}`.trim())}
      {...props}
    >
      {dot && <span className={tw("wk-badge__dot")} aria-hidden="true" />}
      {children}
    </span>
  );
}
