import { useId, useState, type HTMLAttributes } from "react";
import { useAssistantContext } from "./context";
import { cx } from "./internal/classes";
import type { AssistantPendingConfirmation } from "../core";

export type ActionConfirmationProps = {
  className?: string;
  title?: string;
  description?: string;
  approveLabel?: string;
  cancelLabel?: string;
  onApprove?: (pending: AssistantPendingConfirmation) => void;
  onCancel?: (pending: AssistantPendingConfirmation) => void;
} & Omit<HTMLAttributes<HTMLDivElement>, "children">;

export function ActionConfirmation({
  className,
  title,
  description,
  approveLabel,
  cancelLabel,
  onApprove,
  onCancel,
  ...rest
}: ActionConfirmationProps) {
  const context = useAssistantContext();
  const titleId = useId();
  const [decided, setDecided] = useState(false);

  const pending = context.snapshot.pendingConfirmation;
  if (!pending) return null;

  const labels = context.labels;
  const classNames = context.classNames;
  const confirm = context.confirm;
  const cancelAction = context.cancelAction;

  const handleApprove = () => {
    if (decided) return;
    setDecided(true);
    if (onApprove) {
      onApprove(pending);
    } else {
      confirm(true);
    }
  };

  const handleCancel = () => {
    if (decided) return;
    setDecided(true);
    if (onCancel) {
      onCancel(pending);
    } else {
      cancelAction(pending.toolCallId);
    }
  };

  return (
    <section
      className={cx(
        "wk-assistant__action-confirmation",
        classNames.confirmation,
        className,
      )}
      data-confirmation=""
      role="group"
      aria-labelledby={titleId}
      {...rest}
    >
      <div className="wk-assistant__action-confirmation-content">
        <strong id={titleId}>{title ?? labels.confirmTitle}</strong>
        <p className="wk-assistant__action-confirmation-description">
          {description ?? labels.confirmDescription}
        </p>
      </div>
      <div className="wk-assistant__action-confirmation-actions">
        <button
          className={cx(
            "wk-assistant__action-confirmation-button",
            "wk-assistant__action-confirmation-button--cancel",
          )}
          disabled={decided}
          onClick={handleCancel}
          type="button"
        >
          {cancelLabel ?? labels.reject}
        </button>
        <button
          className={cx(
            "wk-assistant__action-confirmation-button",
            "wk-assistant__action-confirmation-button--approve",
          )}
          disabled={decided}
          onClick={handleApprove}
          type="button"
        >
          {approveLabel ?? labels.approve}
        </button>
      </div>
    </section>
  );
}
