import type { ActionAccess } from "./actions";
import { isActionAccess } from "./actions";
import type { AssistantError } from "./errors";
import { isAssistantError } from "./errors";
import { isNonEmptyString, isRecord } from "./validation";

export type AssistantRole = "system" | "user" | "assistant" | "tool";

export type TextPartFormat = "plain" | "markdown";

export type TextMessagePart = {
  type: "text";
  id: string;
  text: string;
  format?: TextPartFormat;
};

export type MessageButton = {
  id: string;
  label: string;
  action?: string;
  payload?: unknown;
  disabled?: boolean;
};

export type ButtonsMessagePart = {
  type: "buttons";
  id: string;
  buttons: readonly MessageButton[];
};

export type ComponentMessagePart = {
  type: "component";
  id: string;
  component: string;
  props?: Record<string, unknown>;
};

export const TOOL_CALL_STATUSES = [
  "pending",
  "running",
  "completed",
  "failed",
  "cancelled",
] as const;

export type CanonicalToolCallStatus = (typeof TOOL_CALL_STATUSES)[number];

export type ToolCallStatus = CanonicalToolCallStatus | "complete" | "error";

export type ToolResultStatus = Extract<
  CanonicalToolCallStatus,
  "completed" | "failed" | "cancelled"
>;

export type ToolCallMessagePart = {
  type: "tool-call";
  id: string;
  toolCallId: string;
  name: string;
  input?: unknown;
  /**
   * `read` tools may execute after validation. `write` tools always require
   * explicit confirmation. When omitted, the runtime treats the tool as write.
   */
  access?: ActionAccess;
  description?: string;
  status?: ToolCallStatus;
};

export type ToolResultMessagePart = {
  type: "tool-result";
  id: string;
  toolCallId: string;
  name?: string;
  output?: unknown;
  status?: ToolResultStatus;
  isError?: boolean;
  error?: AssistantError;
};

export type MessagePart =
  | TextMessagePart
  | ButtonsMessagePart
  | ComponentMessagePart
  | ToolCallMessagePart
  | ToolResultMessagePart;

export type ChatMessageStatus = "streaming" | "complete" | "error";

export type ChatMessage = {
  id: string;
  role: AssistantRole;
  parts: readonly MessagePart[];
  createdAt?: string;
  status?: ChatMessageStatus;
  metadata?: Record<string, unknown>;
};

export type AssistantMessage = ChatMessage;

export function isAssistantRole(value: unknown): value is AssistantRole {
  return (
    value === "system" ||
    value === "user" ||
    value === "assistant" ||
    value === "tool"
  );
}

export function isMessageButton(value: unknown): value is MessageButton {
  if (!isRecord(value)) return false;
  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.label) &&
    (value.action === undefined || isNonEmptyString(value.action)) &&
    (value.disabled === undefined || typeof value.disabled === "boolean")
  );
}

export function isTextMessagePart(value: unknown): value is TextMessagePart {
  if (!isRecord(value)) return false;
  return (
    value.type === "text" &&
    isNonEmptyString(value.id) &&
    typeof value.text === "string" &&
    (value.format === undefined ||
      value.format === "plain" ||
      value.format === "markdown")
  );
}

export function isButtonsMessagePart(
  value: unknown,
): value is ButtonsMessagePart {
  if (!isRecord(value) || value.type !== "buttons") return false;
  if (!isNonEmptyString(value.id) || !Array.isArray(value.buttons))
    return false;
  return value.buttons.every(isMessageButton);
}

export function isComponentMessagePart(
  value: unknown,
): value is ComponentMessagePart {
  if (!isRecord(value) || value.type !== "component") return false;
  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.component) &&
    (value.props === undefined || isRecord(value.props))
  );
}

export function isToolCallStatus(value: unknown): value is ToolCallStatus {
  return (
    value === "pending" ||
    value === "running" ||
    value === "completed" ||
    value === "failed" ||
    value === "cancelled" ||
    value === "complete" ||
    value === "error"
  );
}

export function isToolCallMessagePart(
  value: unknown,
): value is ToolCallMessagePart {
  if (!isRecord(value) || value.type !== "tool-call") return false;
  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.toolCallId) &&
    isNonEmptyString(value.name) &&
    (value.access === undefined || isActionAccess(value.access)) &&
    (value.description === undefined ||
      typeof value.description === "string") &&
    (value.status === undefined || isToolCallStatus(value.status))
  );
}

export function isToolResultMessagePart(
  value: unknown,
): value is ToolResultMessagePart {
  if (!isRecord(value) || value.type !== "tool-result") return false;
  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.toolCallId) &&
    (value.name === undefined || isNonEmptyString(value.name)) &&
    (value.status === undefined || isToolCallStatus(value.status)) &&
    (value.isError === undefined || typeof value.isError === "boolean") &&
    (value.error === undefined || isAssistantError(value.error))
  );
}

export function isMessagePart(value: unknown): value is MessagePart {
  return (
    isTextMessagePart(value) ||
    isButtonsMessagePart(value) ||
    isComponentMessagePart(value) ||
    isToolCallMessagePart(value) ||
    isToolResultMessagePart(value)
  );
}

export function normalizeToolCallStatus(
  status: unknown,
): CanonicalToolCallStatus {
  if (status === "complete") return "completed";
  if (status === "error") return "failed";
  if (
    status === "pending" ||
    status === "running" ||
    status === "completed" ||
    status === "failed" ||
    status === "cancelled"
  ) {
    return status;
  }
  return "pending";
}

export function resolveTextFormat(
  role: AssistantRole,
  explicitFormat?: TextPartFormat,
): TextPartFormat {
  if (explicitFormat === "plain" || explicitFormat === "markdown") {
    return explicitFormat;
  }
  return role === "assistant" ? "markdown" : "plain";
}

export function isChatMessageStatus(
  value: unknown,
): value is ChatMessageStatus {
  return value === "streaming" || value === "complete" || value === "error";
}

export function isChatMessage(value: unknown): value is ChatMessage {
  if (!isRecord(value)) return false;
  if (
    !isNonEmptyString(value.id) ||
    !isAssistantRole(value.role) ||
    !Array.isArray(value.parts)
  ) {
    return false;
  }
  if (value.createdAt !== undefined && typeof value.createdAt !== "string") {
    return false;
  }
  if (value.status !== undefined && !isChatMessageStatus(value.status)) {
    return false;
  }
  if (value.metadata !== undefined && !isRecord(value.metadata)) {
    return false;
  }
  return value.parts.every(isMessagePart);
}
