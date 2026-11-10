import {
  createContext,
  useContext,
} from "react";
import type {
  AssistantInput,
  AssistantRuntime,
  AssistantSnapshot,
} from "../core";
import { isAssistantBusy } from "./internal/status";
import type {
  AssistantActionEvent,
  AssistantClassNames,
  AssistantComponentRenderer,
  AssistantDisplayState,
  AssistantLabels,
  AssistantOpenOptions,
  AssistantSlots,
  AssistantSuggestion,
  AssistantTriggerContext,
} from "./types";

export type AssistantContextValue = {
  runtime: AssistantRuntime;
  snapshot: AssistantSnapshot;
  displayState: AssistantDisplayState;
  setDisplayState: (state: AssistantDisplayState) => void;
  open: (options?: AssistantOpenOptions) => Promise<void>;
  close: () => void;
  minimize: () => void;
  restore: () => void;
  toggle: (options?: AssistantOpenOptions) => Promise<void>;
  triggerContext: AssistantTriggerContext;
  setContext: (
    context:
      | AssistantTriggerContext
      | ((prev: AssistantTriggerContext) => AssistantTriggerContext),
  ) => void;
  clearContext: () => void;
  panelId: string;
  labels: AssistantLabels;
  classNames: AssistantClassNames;
  slots: AssistantSlots;
  suggestions: readonly AssistantSuggestion[];
  components: Record<string, AssistantComponentRenderer>;
  assistantBubble: boolean;
  userBubble: boolean;
  userAvatar?: string;
  assistantAvatar?: string;
  messageActions: boolean;
  onAction?: (event: AssistantActionEvent) => void | Promise<void>;
  send: (input: AssistantInput) => Promise<void>;
  cancel: () => void;
  retry: () => Promise<void>;
  reset: () => void;
  confirm: (approved: boolean) => void;
  cancelAction: (toolCallId: string) => void;
};

export const AssistantContext =
  createContext<AssistantContextValue | null>(null);

export function useAssistantContext(): AssistantContextValue {
  const context = useContext(AssistantContext);
  if (!context) {
    throw new Error(
      "Assistant components must be rendered inside AssistantProvider.",
    );
  }
  return context;
}

export function useAssistantContextOptional(): AssistantContextValue | null {
  return useContext(AssistantContext);
}

export function useAssistant() {
  const context = useAssistantContext();
  return {
    runtime: context.runtime,
    snapshot: context.snapshot,
    status: context.snapshot.status,
    messages: context.snapshot.messages,
    error: context.snapshot.error,
    pendingConfirmation: context.snapshot.pendingConfirmation,
    isBusy: isAssistantBusy(context.snapshot.status),
    send: context.send,
    cancel: context.cancel,
    retry: context.retry,
    reset: context.reset,
    confirm: context.confirm,
    cancelAction: context.cancelAction,
    displayState: context.displayState,
    isOpen: context.displayState === "open",
    isMinimized: context.displayState === "minimized",
    isLauncher: context.displayState === "launcher",
    isClosed: context.displayState === "closed",
    open: context.open,
    close: context.close,
    minimize: context.minimize,
    restore: context.restore,
    toggle: context.toggle,
    context: context.triggerContext,
    setContext: context.setContext,
    clearContext: context.clearContext,
  };
}

export function useAssistantChat() {
  const context = useAssistantContext();
  return {
    ...useAssistant(),
    setDisplayState: context.setDisplayState,
    suggestions: context.suggestions,
    panelId: context.panelId,
  };
}
