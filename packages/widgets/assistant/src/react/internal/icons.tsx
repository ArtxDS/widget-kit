import type { SVGProps } from "react";

export function AssistantMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="M12 3L19 7.5V16.5L12 21L5 16.5V7.5L12 3Z" />
      <path
        className="wk-assistant__mark-core"
        d="M12 8L16 10.5V13.5L12 16L8 13.5V10.5L12 8Z"
        opacity="0.6"
      />
    </svg>
  );
}
