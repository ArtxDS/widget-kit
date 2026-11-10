import type { AnyActionDefinition } from "../core/actions";
import type { ChatMessage } from "../core/messages";
import type { AssistantSnapshot } from "../core/state";
import type { AssistantTransport } from "../core/transport";

export type AssistantInput =
  | string
  | { text: string; metadata?: Record<string, unknown> };

export type AssistantContext =
  | Record<string, unknown>
  | (() => Record<string, unknown>);

export type AssistantTriggerContext = Record<string, unknown>;

export type AssistantOpenOptions = {
  /**
   * Dados contextuais opcionais e agnósticos de domínio para esta sessão ou trigger.
   */
  context?: AssistantTriggerContext;
  /**
   * Mensagem inicial opcional para iniciar a conversa.
   */
  initialMessage?: AssistantInput;
  /**
   * Se true, despacha a mensagem imediatamente ao abrir.
   * Padrão: true (quando initialMessage é informada).
   */
  autoSend?: boolean;
};

export type AssistantRuntimeOptions = {
  transport: AssistantTransport;
  initialMessages?: readonly ChatMessage[];
  context?: AssistantContext;
  createId?: () => string;
  now?: () => string;
  tools?: readonly AnyActionDefinition[];
};

export interface AssistantRuntime {
  getSnapshot(): AssistantSnapshot;
  subscribe(listener: () => void): () => void;
  send(input: AssistantInput): Promise<void>;
  cancel(): void;
  retry(): Promise<void>;
  reset(messages?: readonly ChatMessage[]): void;
  confirm(approved: boolean): void;
  cancelAction(toolCallId: string): void;
  dispose(): void;
  setContext(
    context:
      | AssistantTriggerContext
      | ((prev: AssistantTriggerContext) => AssistantTriggerContext),
  ): void;
  getContext(): AssistantTriggerContext;
  clearContext(): void;
}
