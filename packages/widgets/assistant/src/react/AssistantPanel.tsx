import {
  forwardRef,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { useAssistantChat, useAssistantContext } from "./context";
import { AssistantComposer } from "./AssistantComposer";
import { AssistantSuggestions } from "./AssistantSuggestions";
import { MessageList } from "./MessageList";
import { ActionConfirmation } from "./ActionConfirmation";
import { AssistantHeader } from "./internal/AssistantHeader";
import { cx } from "./internal/classes";
import { ErrorMessage } from "./internal/ErrorMessage";
import { isAssistantBusy } from "./internal/status";
import type { AssistantStatus } from "../core";

export type AssistantPanelProps = {
  className?: string;
  style?: CSSProperties;
  showHeader?: boolean;
  isClosing?: boolean;
  isMinimizing?: boolean;
  onAnimationEnd?: () => void;
  onCloseStart?: () => void;
  onMinimizeStart?: () => void;
  children?: ReactNode;
};

function statusAnnouncement(
  status: AssistantStatus,
  labels: ReturnType<typeof useAssistantContext>["labels"],
): string {
  switch (status) {
    case "submitting":
    case "thinking":
      return labels.thinking;
    case "streaming":
      return labels.streaming;
    case "executing-tool":
      return labels.runningTool;
    case "awaiting-confirmation":
      return labels.awaitingConfirmation;
    case "error":
      return labels.errorTitle;
    default:
      return "";
  }
}

export const AssistantPanel = forwardRef<HTMLDivElement, AssistantPanelProps>(
  function AssistantPanel(
    {
      className,
      style,
      showHeader = true,
      isClosing = false,
      isMinimizing = false,
      onAnimationEnd,
      onCloseStart,
      onMinimizeStart,
      children,
    },
    ref,
  ) {
    const {
      status,
      error,
      pendingConfirmation,
      displayState,
      close,
      minimize,
      panelId,
    } = useAssistantChat();
    const { labels, classNames, slots } = useAssistantContext();
    const titleId = `${panelId}-title`;
    const busy = isAssistantBusy(status);

    const requestMinimize = () => {
      onMinimizeStart?.();
      minimize();
    };

    const requestClose = () => {
      onCloseStart?.();
      close();
    };

    if (displayState === "closed") {
      return null;
    }

    if (displayState !== "open" && !isClosing && !isMinimizing) {
      return null;
    }

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Escape" && !event.defaultPrevented) {
        event.preventDefault();
        requestClose();
      }
    };

    const isVisible = displayState === "open" && !isClosing && !isMinimizing;

    return (
      <div
        aria-busy={busy}
        aria-hidden={!isVisible ? true : undefined}
        aria-label={showHeader ? undefined : labels.title}
        aria-labelledby={showHeader ? titleId : undefined}
        className={cx(
          "wk-assistant__panel",
          isMinimizing
            ? "wk-assistant__panel--minimizing"
            : isClosing
              ? "wk-assistant__panel--closing"
              : "wk-assistant__panel--open",
          classNames.panel,
          className,
        )}
        data-assistant-panel=""
        data-state={isMinimizing ? "minimizing" : isClosing ? "closing" : "open"}
        id={panelId}
        onAnimationEnd={(event) => {
          if (event.target === event.currentTarget) {
            onAnimationEnd?.();
          }
        }}
        onKeyDown={handleKeyDown}
        ref={ref}
        role={isVisible ? "dialog" : undefined}
        style={style}
        tabIndex={-1}
      >
        <div aria-hidden="true" className="wk-assistant__drag-handle" />
        {showHeader && (
          <AssistantHeader
            minimized={isMinimizing}
            onClose={requestClose}
            onMinimize={requestMinimize}
            status={status}
            titleId={titleId}
          />
        )}
        <div className="wk-assistant__body">
          {children ?? (
              <>
              <MessageList />
              <span
                aria-atomic="true"
                aria-live="polite"
                className="wk-assistant__sr-only"
                role="status"
              >
                {statusAnnouncement(status, labels)}
              </span>
              {pendingConfirmation && <ActionConfirmation />}
              {error && <ErrorMessage />}
              <AssistantSuggestions />
              <AssistantComposer />
            </>
          )}
          {slots.footer && (
            <div
              className={cx("wk-assistant__footer", classNames.footer)}
            >
              {slots.footer}
            </div>
          )}
        </div>
      </div>
    );
  },
);
