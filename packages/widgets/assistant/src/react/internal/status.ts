import type { AssistantStatus } from "../../core";

export function isAssistantBusy(status: AssistantStatus): boolean {
  return status !== "idle" && status !== "error";
}
