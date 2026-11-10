import type {
  AssistantClassNames,
  AssistantDisplayState,
  AssistantLabels,
  AssistantSlots,
} from "./types";

export const DEFAULT_DISPLAY_STATE: AssistantDisplayState = "launcher";

export const DEFAULT_CLASS_NAMES: AssistantClassNames = {};

export const DEFAULT_SLOTS: AssistantSlots = {};

export const DEFAULT_LABELS: AssistantLabels = {
  title: "Assistant",
  subtitle: "Ready when you are",
  online: "Online",
  ready: "Ready",
  launcher: "Assistant",
  open: "Open assistant",
  close: "Close assistant",
  minimize: "Minimize assistant",
  restore: "Restore assistant",
  send: "Send message",
  stop: "Stop generating",
  placeholder: "Write a message...",
  emptyTitle: "Start a conversation",
  emptyDescription:
    "Ask a question or choose one of the suggestions below.",
  thinking: "Thinking",
  streaming: "Assistant is responding",
  runningTool: "Running action",
  awaitingConfirmation: "Waiting for confirmation",
  errorTitle: "Something went wrong",
  retry: "Try again",
  scrollToLatest: "Scroll to latest message",
  suggestions: "Suggested questions",
  conversation: "Conversation",
  you: "You",
  assistant: "Assistant",
  confirmTitle: "Approve this action?",
  confirmDescription: "This action needs your approval before it runs.",
  approve: "Approve",
  reject: "Reject",
  cancelAction: "Cancel action",
  toolPending: "Waiting",
  toolRunning: "Running",
  toolCompleted: "Completed",
  toolFailed: "Failed",
  toolCancelled: "Cancelled",
  toolParameters: "Parameters",
  toolResult: "Result",
  unknownTool: "Unknown tool",
  copyCode: "Copy code",
  copiedCode: "Copied!",
  copyMessage: "Copy message",
  copiedMessage: "Copied!",
};
