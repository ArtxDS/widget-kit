import type { AssistantEvent } from "./events";
import { type ChatMessage, isChatMessage } from "./messages";
import { isNonEmptyString, isRecord } from "./validation";

export const ASSISTANT_PROTOCOL_VERSION = "1" as const;

export type AssistantProtocolVersion = typeof ASSISTANT_PROTOCOL_VERSION;

export type AssistantRequest = {
  protocolVersion: string;
  messages: readonly ChatMessage[];
  context?: Record<string, unknown>;
};

export type AssistantSendOptions = {
  signal?: AbortSignal;
};

export interface AssistantTransport {
  send(
    request: AssistantRequest,
    options?: AssistantSendOptions,
  ): AsyncIterable<AssistantEvent>;
}

export function isAssistantRequest(value: unknown): value is AssistantRequest {
  if (!isRecord(value)) return false;
  if (
    !isNonEmptyString(value.protocolVersion) ||
    !Array.isArray(value.messages) ||
    (value.context !== undefined && !isRecord(value.context))
  ) {
    return false;
  }
  return value.messages.every(isChatMessage);
}

export function isAssistantTransport(
  value: unknown,
): value is AssistantTransport {
  return isRecord(value) && typeof value.send === "function";
}
