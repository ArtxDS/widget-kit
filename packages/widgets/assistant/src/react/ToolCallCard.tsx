import {
  forwardRef,
  useId,
  useState,
  type HTMLAttributes,
} from "react";
import { ChevronDown } from "lucide-react";
import { useAssistantContextOptional } from "./context";
import { DEFAULT_CLASS_NAMES, DEFAULT_LABELS } from "./defaults";
import { cx } from "./internal/classes";
import { formatJson } from "./internal/format";
import type { ChatMessage, ToolCallMessagePart, ToolCallStatus } from "../core";
import { normalizeToolCallStatus } from "../core/messages";

export type ToolCallCardProps = {
  part: ToolCallMessagePart;
  message?: ChatMessage;
  className?: string;
} & Omit<HTMLAttributes<HTMLDivElement>, "children" | "part">;

export const ToolCallCard = forwardRef<HTMLDivElement, ToolCallCardProps>(
  function ToolCallCard({ part, className, ...rest }, ref) {
    const context = useAssistantContextOptional();
    const labels = context?.labels ?? DEFAULT_LABELS;
    const classNames = context?.classNames ?? DEFAULT_CLASS_NAMES;
    const cancelAction = context?.cancelAction;
    const status = normalizeToolCallStatus(part.status);
    const running = status === "running";
    const [parametersExpanded, setParametersExpanded] = useState(false);
    const detailsId = useId();
    const statusLabels: Record<ToolCallStatus, string> = {
      pending: labels.toolPending,
      running: labels.toolRunning,
      completed: labels.toolCompleted,
      failed: labels.toolFailed,
      cancelled: labels.toolCancelled,
      complete: labels.toolCompleted,
      error: labels.toolFailed,
    };

    return (
      <div
        className={cx(
          "wk-assistant__tool-card",
          `wk-assistant__tool-card--${status}`,
          classNames.toolCard,
          className,
        )}
        data-status={status}
        data-tool-call-id={part.toolCallId}
        ref={ref}
        {...rest}
      >
        <span aria-hidden="true" className="wk-assistant__tool-card-dot" />
        <div className="wk-assistant__tool-card-content">
          <div className="wk-assistant__tool-card-header">
            <span className="wk-assistant__tool-card-name">{part.name}</span>
            <span
              className={cx(
                "wk-assistant__tool-card-badge",
                `wk-assistant__tool-card-badge--${status}`,
              )}
            >
              {statusLabels[status]}
            </span>
          </div>
          {part.description && (
            <p className="wk-assistant__tool-card-description">
              {part.description}
            </p>
          )}
          {part.input !== undefined && (
            <div className="wk-assistant__tool-card-details">
              <button
                aria-controls={detailsId}
                aria-expanded={parametersExpanded}
                className="wk-assistant__tool-card-details-toggle"
                onClick={() => setParametersExpanded((expanded) => !expanded)}
                type="button"
              >
                <span>{labels.toolParameters}</span>
                <ChevronDown
                  aria-hidden="true"
                  className="wk-assistant__tool-card-details-chevron"
                  size={14}
                  strokeWidth={2}
                />
              </button>
              <div
                aria-hidden={!parametersExpanded}
                className="wk-assistant__tool-card-details-panel"
                data-expanded={parametersExpanded ? "true" : "false"}
                id={detailsId}
              >
                <div className="wk-assistant__tool-card-details-inner">
                  <pre className="wk-assistant__tool-card-json">
                    {formatJson(part.input)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
        {running && cancelAction && (
          <button
            aria-label={`${labels.cancelAction} ${part.name}`}
            className="wk-assistant__tool-card-cancel"
            onClick={() => cancelAction(part.toolCallId)}
            type="button"
          >
            {labels.cancelAction}
          </button>
        )}
      </div>
    );
  },
);
