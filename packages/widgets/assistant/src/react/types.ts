import type { CSSProperties, ReactNode } from "react";
import type {
  AnyActionDefinition,
  ChatMessage,
  ComponentMessagePart,
  MessageButton,
} from "../core";
import type {
  AssistantContext,
  AssistantInput,
  AssistantOpenOptions,
  AssistantRuntime,
  AssistantTriggerContext,
} from "../runtime";
import type { AssistantTransport } from "../core/transport";

export type { AssistantOpenOptions, AssistantTriggerContext };

export type AssistantImperativeHandle = {
  open: (options?: AssistantOpenOptions) => Promise<void>;
  close: () => void;
  toggle: (options?: AssistantOpenOptions) => Promise<void>;
  minimize: () => void;
  restore: () => void;
  send: (input: AssistantInput) => Promise<void>;
  reset: (messages?: readonly ChatMessage[]) => void;
  setContext: (
    context:
      | AssistantTriggerContext
      | ((prev: AssistantTriggerContext) => AssistantTriggerContext),
  ) => void;
  getContext: () => AssistantTriggerContext;
  clearContext: () => void;
  getDisplayState: () => AssistantDisplayState;
};

export type AssistantDisplayState =
  | "closed"
  | "launcher"
  | "open"
  | "minimized";

export type AssistantPlacement = "floating" | "inline" | "docked";

export type AssistantPosition =
  | "bottom-right"
  | "bottom-left"
  | "top-right"
  | "top-left"
  | "right"
  | "left"
  | "bottom";

export type AssistantSuggestion =
  | string
  | {
      label: string;
      prompt?: string;
      description?: string;
    };

export type AssistantActionEvent = {
  action?: string;
  payload?: unknown;
  button: MessageButton;
  message: ChatMessage;
};

export type AssistantComponentRenderer = (
  props: Record<string, unknown> | undefined,
  context: {
    message: ChatMessage;
    part: ComponentMessagePart;
  },
) => ReactNode;

export type AssistantLabels = {
  title: string;
  subtitle: string;
  online: string;
  ready: string;
  launcher: string;
  open: string;
  close: string;
  minimize: string;
  restore: string;
  send: string;
  stop: string;
  placeholder: string;
  emptyTitle: string;
  emptyDescription: string;
  thinking: string;
  streaming: string;
  runningTool: string;
  awaitingConfirmation: string;
  errorTitle: string;
  retry: string;
  scrollToLatest: string;
  suggestions: string;
  conversation: string;
  you: string;
  assistant: string;
  confirmTitle: string;
  confirmDescription: string;
  approve: string;
  reject: string;
  cancelAction: string;
  toolPending: string;
  toolRunning: string;
  toolCompleted: string;
  toolFailed: string;
  toolCancelled: string;
  toolParameters: string;
  toolResult: string;
  unknownTool: string;
  copyCode: string;
  copiedCode: string;
  copyMessage: string;
  copiedMessage: string;
};

export type AssistantClassNames = {
  root?: string;
  launcher?: string;
  panel?: string;
  header?: string;
  messages?: string;
  message?: string;
  composer?: string;
  suggestions?: string;
  suggestion?: string;
  empty?: string;
  typing?: string;
  error?: string;
  footer?: string;
  confirmation?: string;
  toolCard?: string;
  toolResultCard?: string;
  codeBlock?: string;
  messageActions?: string;
};

export type AssistantSlots = {
  launcher?: ReactNode;
  header?: ReactNode;
  empty?: ReactNode;
  typing?: ReactNode;
  footer?: ReactNode;
  message?: (message: ChatMessage) => ReactNode;
  messageActions?: (message: ChatMessage) => ReactNode;
};

export type AssistantProviderProps = {
  children?: ReactNode;
  runtime?: AssistantRuntime;
  transport?: AssistantTransport;
  initialMessages?: readonly ChatMessage[];
  context?: AssistantContext;
  createId?: () => string;
  now?: () => string;
  displayState?: AssistantDisplayState;
  defaultDisplayState?: AssistantDisplayState;
  onDisplayStateChange?: (state: AssistantDisplayState) => void;
  suggestions?: readonly AssistantSuggestion[];
  onAction?: (event: AssistantActionEvent) => void | Promise<void>;
  components?: Record<string, AssistantComponentRenderer>;
  assistantBubble?: boolean;
  userBubble?: boolean;
  userAvatar?: string;
  assistantAvatar?: string;
  messageActions?: boolean;
  classNames?: AssistantClassNames;
  labels?: Partial<AssistantLabels>;
  slots?: AssistantSlots;
  tools?: readonly AnyActionDefinition[];
};

export type AssistantWidgetProps = Omit<AssistantProviderProps, "children"> & {
  placement?: AssistantPlacement;
  position?: AssistantPosition;
  theme?: string;
  className?: string;
  style?: CSSProperties;
};
