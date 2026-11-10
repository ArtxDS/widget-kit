import { Maximize2, Minus, X } from "lucide-react";
import { useAssistantContext } from "../context";
import { cx } from "./classes";
import { AssistantMark } from "./icons";
import type { AssistantStatus } from "../../core";

type AssistantHeaderProps = {
  titleId: string;
  minimized: boolean;
  status?: AssistantStatus;
  onMinimize?: () => void;
  onRestore?: () => void;
  onClose: () => void;
};

export function AssistantHeader({
  titleId,
  minimized,
  status,
  onMinimize,
  onRestore,
  onClose,
}: AssistantHeaderProps) {
  const { labels, classNames, slots, snapshot } = useAssistantContext();
  const currentStatus = status ?? snapshot.status;
  const hasError = currentStatus === "error" || snapshot.error !== null;
  const isThinking =
    currentStatus === "thinking" ||
    currentStatus === "submitting" ||
    currentStatus === "executing-tool";
  const isStreaming = currentStatus === "streaming";
  const isIdle = currentStatus === "idle";

  let statusType: "online" | "ready" | "thinking" | "streaming" | "error" =
    "online";
  let statusText = labels.online;

  if (hasError) {
    statusType = "error";
    statusText = labels.errorTitle;
  } else if (isThinking) {
    statusType = "thinking";
    statusText = labels.thinking;
  } else if (isStreaming) {
    statusType = "streaming";
    statusText = labels.streaming;
  } else if (isIdle && snapshot.messages.length === 0) {
    statusType = "ready";
    statusText = labels.ready;
  }

  return (
    <header
      className={cx("wk-assistant__header", classNames.header)}
      data-minimized={minimized || undefined}
      data-status={statusType}
    >
      {slots.header ? (
        <div className="wk-assistant__header-slot">
          <span className="wk-assistant__sr-only" id={titleId}>
            {labels.title}
          </span>
          {slots.header}
        </div>
      ) : (
        <div className="wk-assistant__brand">
          <span aria-hidden="true" className="wk-assistant__mark">
            <AssistantMark />
          </span>
          <div className="wk-assistant__heading">
            <div className="wk-assistant__title-group">
              <h2 className="wk-assistant__title" id={titleId}>
                {labels.title}
              </h2>
              <div
                aria-label={statusText}
                className={cx(
                  "wk-assistant__status-badge",
                  `wk-assistant__status-badge--${statusType}`,
                )}
              >
                <span aria-hidden="true" className="wk-assistant__status-dot" />
                <span className="wk-assistant__status-text">{statusText}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="wk-assistant__actions">
        {minimized ? (
          <button
            aria-label={labels.restore}
            className="wk-assistant__icon-button"
            onClick={onRestore}
            title={labels.restore}
            type="button"
          >
            <Maximize2 aria-hidden="true" size={15} strokeWidth={1.9} />
          </button>
        ) : (
          <button
            aria-label={labels.minimize}
            className="wk-assistant__icon-button"
            onClick={onMinimize}
            title={labels.minimize}
            type="button"
          >
            <Minus aria-hidden="true" size={16} strokeWidth={1.9} />
          </button>
        )}
        <button
          aria-label={labels.close}
          className="wk-assistant__icon-button"
          onClick={onClose}
          title={labels.close}
          type="button"
        >
          <X aria-hidden="true" size={16} strokeWidth={1.9} />
        </button>
      </div>
    </header>
  );
}
