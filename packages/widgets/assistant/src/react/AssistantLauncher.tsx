import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { useAssistantChat, useAssistantContext } from "./context";
import { cx } from "./internal/classes";
import { AssistantMark } from "./internal/icons";

export type AssistantLauncherProps = {
  label?: string;
  icon?: ReactNode;
  variant?: "circular" | "pill";
  size?: "default" | "compact";
  children?: ReactNode;
} & Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "onClick" | "type"
>;

export const AssistantLauncher = forwardRef<
  HTMLButtonElement,
  AssistantLauncherProps
>(function AssistantLauncher(
  {
    label,
    icon,
    variant = "circular",
    size = "default",
    children,
    className,
    ...rest
  },
  ref,
) {
  const { displayState, open, restore, panelId, status, messages } =
    useAssistantChat();
  const { labels, classNames, slots } = useAssistantContext();

  if (displayState !== "launcher" && displayState !== "minimized") return null;

  const isMinimized = displayState === "minimized";
  const accessibleLabel = isMinimized
    ? labels.restore
    : (label ?? labels.launcher);
  const isPill = variant === "pill";
  const hasActiveNotification =
    (displayState === "launcher" || isMinimized) &&
    status === "idle" &&
    messages.length > 0 &&
    messages[messages.length - 1].role === "assistant";

  const handleClick = () => {
    if (isMinimized) {
      restore();
    } else {
      void open();
    }
  };

  return (
    <button
      aria-controls={panelId}
      aria-expanded={false}
      aria-haspopup="dialog"
      aria-label={accessibleLabel}
      className={cx(
        "wk-assistant__launcher",
        `wk-assistant__launcher--${variant}`,
        size === "compact" && "wk-assistant__launcher--compact",
        hasActiveNotification && "wk-assistant__launcher--notified",
        isMinimized && "wk-assistant__launcher--minimized",
        classNames.launcher,
        className,
      )}
      data-size={size}
      data-state={displayState}
      data-variant={variant}
      onClick={handleClick}
      ref={ref}
      title={`${accessibleLabel} (⌘K)`}
      type="button"
      {...rest}
    >
      {children ?? slots.launcher ?? (
        <>
          <span aria-hidden="true" className="wk-assistant__mark">
            {icon ?? <AssistantMark />}
          </span>
          {isPill ? (
            <span className="wk-assistant__launcher-label">
              {accessibleLabel}
            </span>
          ) : (
            <span className="wk-assistant__sr-only">{accessibleLabel}</span>
          )}
          {hasActiveNotification && (
            <span
              aria-hidden="true"
              className="wk-assistant__launcher-badge"
            />
          )}
        </>
      )}
    </button>
  );
});
