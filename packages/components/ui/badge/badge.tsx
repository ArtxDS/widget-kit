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
      className={`wk-badge wk-badge--${tone} ${className}`.trim()}
      {...props}
    >
      {dot && <span className={"wk-badge__dot [width:6px] [height:6px] [border-radius:50%] [background:currentColor]"} aria-hidden="true" />}
      {children}
    </span>
  );
}
