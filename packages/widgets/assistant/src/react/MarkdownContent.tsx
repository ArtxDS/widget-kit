import {
  forwardRef,
  type HTMLAttributes,
} from "react";
import { Markdown } from "./internal/markdown";
import { cx } from "./internal/classes";

export type MarkdownContentProps = {
  content?: string;
  text?: string;
  className?: string;
} & HTMLAttributes<HTMLDivElement>;

export const MarkdownContent = forwardRef<HTMLDivElement, MarkdownContentProps>(
  function MarkdownContent({ content, text, className, ...rest }, ref) {
    const raw = content ?? text ?? "";
    return (
      <div
        className={cx("wk-assistant__markdown", className)}
        ref={ref}
        {...rest}
      >
        <Markdown text={raw} />
      </div>
    );
  },
);

