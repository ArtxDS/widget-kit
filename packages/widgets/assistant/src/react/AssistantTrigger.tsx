import {
  cloneElement,
  forwardRef,
  isValidElement,
  type ButtonHTMLAttributes,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { useAssistant } from "./context";
import type { AssistantInput } from "../core";
import type { AssistantTriggerContext } from "./types";
import { cx } from "./internal/classes";

export type AssistantTriggerProps = {
  children?: ReactNode;
  context?: AssistantTriggerContext;
  initialMessage?: AssistantInput;
  autoSend?: boolean;
  asChild?: boolean;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">;

export const AssistantTrigger = forwardRef<
  HTMLElement,
  AssistantTriggerProps
>(function AssistantTrigger(
  {
    children,
    context,
    initialMessage,
    autoSend = true,
    asChild = false,
    className,
    onClick,
    ...rest
  },
  ref,
) {
  const { open } = useAssistant();

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    onClick?.(event as MouseEvent<HTMLButtonElement>);
    if (event.defaultPrevented) return;
    void open({ context, initialMessage, autoSend });
  };

  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{
      className?: string;
      onClick?: (e: MouseEvent<HTMLElement>) => void;
      ref?: unknown;
    }>;
    return cloneElement(child, {
      ...rest,
      className: cx(child.props.className, className),
      onClick: (e: MouseEvent<HTMLElement>) => {
        child.props.onClick?.(e);
        handleClick(e);
      },
    });
  }

  return (
    <button
      className={cx("wk-assistant__trigger", className)}
      onClick={handleClick}
      ref={ref as React.Ref<HTMLButtonElement>}
      type="button"
      {...rest}
    >
      {children}
    </button>
  );
});

