import {
  forwardRef,
  type HTMLAttributes,
} from "react";
import { useAssistantContextOptional } from "./context";
import { DEFAULT_CLASS_NAMES, DEFAULT_LABELS } from "./defaults";
import { cx } from "./internal/classes";
import { formatJson } from "./internal/format";
import type {
  ToolCallMessagePart,
  ToolResultMessagePart,
  ToolCallStatus,
} from "../core";
import { normalizeToolCallStatus } from "../core/messages";

export type ToolResultCardProps = {
  part: ToolResultMessagePart;
  call?: ToolCallMessagePart;
  className?: string;
} & Omit<HTMLAttributes<HTMLDivElement>, "children" | "part">;

export const ToolResultCard = forwardRef<HTMLDivElement, ToolResultCardProps>(
  function ToolResultCard({ part, call, className, ...rest }, ref) {
    const context = useAssistantContextOptional();
    const labels = context?.labels ?? DEFAULT_LABELS;
    const classNames = context?.classNames ?? DEFAULT_CLASS_NAMES;
    const status = normalizeToolCallStatus(
      part.status ?? (part.isError ? "failed" : "completed"),
    );
    const name = part.name ?? call?.name ?? labels.unknownTool;
    const cancelled = status === "cancelled";
    const statusLabels: Record<ToolCallStatus, string> = {
      completed: labels.toolCompleted,
      failed: labels.toolFailed,
      cancelled: labels.toolCancelled,
      complete: labels.toolCompleted,
      error: labels.toolFailed,
      pending: labels.toolPending,
      running: labels.toolRunning,
    };

    const output =
      part.output !== undefined && part.output !== null
        ? typeof part.output === "string"
          ? part.output.trim().length > 0
            ? part.output
            : undefined
          : formatJson(part.output)
        : undefined;

    return (
      <div
        className={cx(
          "wk-assistant__tool-result-card",
          `wk-assistant__tool-result-card--${status}`,
          classNames.toolResultCard,
          className,
        )}
        data-status={status}
        data-tool-call-id={part.toolCallId}
        ref={ref}
        {...rest}
      >
        <span aria-hidden={true} className="wk-assistant__tool-card-dot" />
        <div className="wk-assistant__tool-card-content">
          <div className="wk-assistant__tool-card-header">
            <span className="wk-assistant__tool-card-name">{name}</span>
            <span
              className={cx(
                "wk-assistant__tool-card-badge",
                `wk-assistant__tool-card-badge--${status}`,
              )}
            >
              {statusLabels[status]}
            </span>
          </div>
          {part.error && (
            <p className="wk-assistant__tool-result-error">
              {String(part.error.message)}
            </p>
          )}
          {cancelled && (
            <p className="wk-assistant__tool-result-cancelled">
              {labels.toolCancelled}
            </p>
          )}
          {output && (
            <span className="wk-assistant__tool-result-output">{output}</span>
          )}
        </div>
      </div>
    );
  },
);
