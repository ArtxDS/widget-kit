import {
  type ActionAccess,
  isActionAccess,
  type ActionRisk,
  isActionRisk,
} from "./actions";
import { type AssistantError, isAssistantError } from "./errors";
import {
  type MessagePart,
  isMessagePart,
  isToolCallStatus,
  type ToolCallStatus,
} from "./messages";
import { isNonEmptyString, isRecord } from "./validation";

export type AssistantRunStatus = "completed" | "cancelled" | "error";

export type AssistantEvent =
  | { type: "run-start"; runId: string }
  | { type: "message-start"; messageId: string; role: "assistant" }
  | { type: "part-start"; messageId: string; part: MessagePart }
  | {
      type: "text-delta";
      messageId: string;
      partId: string;
      delta: string;
    }
  | { type: "message-end"; messageId: string; finishReason?: string }
  | {
      type: "tool-call";
      toolCallId: string;
      name: string;
      input?: unknown;
      access?: ActionAccess;
      description?: string;
      risk?: ActionRisk;
      messageId?: string;
    }
  | {
      type: "tool-result";
      toolCallId: string;
      name?: string;
      output?: unknown;
      status?: ToolCallStatus;
      isError?: boolean;
      error?: AssistantError;
      messageId?: string;
    }
  | { type: "error"; error: AssistantError }
  | { type: "run-end"; runId: string; status: AssistantRunStatus };

export function isAssistantRunStatus(
  value: unknown,
): value is AssistantRunStatus {
  return (
    value === "completed" || value === "cancelled" || value === "error"
  );
}

export function isAssistantEvent(value: unknown): value is AssistantEvent {
  if (!isRecord(value) || typeof value.type !== "string") return false;

  switch (value.type) {
    case "run-start":
      return isNonEmptyString(value.runId);
    case "message-start":
      return (
        isNonEmptyString(value.messageId) && value.role === "assistant"
      );
    case "part-start":
      return (
        isNonEmptyString(value.messageId) && isMessagePart(value.part)
      );
    case "text-delta":
      return (
        isNonEmptyString(value.messageId) &&
        isNonEmptyString(value.partId) &&
        typeof value.delta === "string"
      );
    case "message-end":
      return (
        isNonEmptyString(value.messageId) &&
        (value.finishReason === undefined ||
          typeof value.finishReason === "string")
      );
    case "tool-call":
      return (
        isNonEmptyString(value.toolCallId) &&
        isNonEmptyString(value.name) &&
        (value.access === undefined || isActionAccess(value.access)) &&
        (value.description === undefined ||
          typeof value.description === "string") &&
        (value.risk === undefined || isActionRisk(value.risk)) &&
        (value.messageId === undefined || isNonEmptyString(value.messageId))
      );
    case "tool-result":
      return (
        isNonEmptyString(value.toolCallId) &&
        (value.name === undefined || isNonEmptyString(value.name)) &&
        (value.status === undefined || isToolCallStatus(value.status)) &&
        (value.isError === undefined || typeof value.isError === "boolean") &&
        (value.error === undefined || isAssistantError(value.error)) &&
        (value.messageId === undefined || isNonEmptyString(value.messageId))
      );
    case "error":
      return isAssistantError(value.error);
    case "run-end":
      return (
        isNonEmptyString(value.runId) &&
        isAssistantRunStatus(value.status)
      );
    default:
      return false;
  }
}
