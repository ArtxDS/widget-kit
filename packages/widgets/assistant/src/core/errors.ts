import { isNonEmptyString, isRecord } from "./validation";

export const ASSISTANT_ERROR_CODES = [
  "invalid-config",
  "invalid-message",
  "invalid-event",
  "invalid-request",
  "transport",
  "aborted",
  "timeout",
  "invalid-response",
  "action",
  "unknown",
] as const;

export type AssistantErrorCode =
  | (typeof ASSISTANT_ERROR_CODES)[number]
  | (string & {});

export type AssistantError = {
  code: AssistantErrorCode;
  message: string;
  retryable?: boolean;
  cause?: unknown;
  details?: Record<string, unknown>;
};

export type AssistantResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: AssistantError };

export type AssistantErrorOptions = Omit<AssistantError, "code" | "message">;

export function createAssistantError(
  code: AssistantErrorCode,
  message: string,
  options: AssistantErrorOptions = {},
): AssistantError {
  return { code, message, ...options };
}

export function isAssistantError(value: unknown): value is AssistantError {
  if (!isRecord(value)) return false;
  return (
    isNonEmptyString(value.code) &&
    isNonEmptyString(value.message) &&
    (value.retryable === undefined || typeof value.retryable === "boolean") &&
    (value.details === undefined || isRecord(value.details))
  );
}
