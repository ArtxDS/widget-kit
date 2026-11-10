import { RotateCcw, TriangleAlert } from "lucide-react";
import { useAssistant, useAssistantContext } from "../context";
import { cx } from "./classes";

export function ErrorMessage() {
  const { error, retry } = useAssistant();
  const { labels, classNames } = useAssistantContext();

  if (!error) return null;

  return (
    <div
      className={cx("wk-assistant__error", classNames.error)}
      role="alert"
    >
      <TriangleAlert
        aria-hidden="true"
        className="wk-assistant__error-icon"
        size={17}
        strokeWidth={1.9}
      />
      <div className="wk-assistant__error-content">
        <strong className="wk-assistant__error-title">
          {labels.errorTitle}
        </strong>
        <p className="wk-assistant__error-message">{error.message}</p>
      </div>
      <button
        className="wk-assistant__error-retry"
        onClick={() => void retry()}
        type="button"
      >
        <RotateCcw aria-hidden="true" size={13} strokeWidth={2} />
        {labels.retry}
      </button>
    </div>
  );
}
