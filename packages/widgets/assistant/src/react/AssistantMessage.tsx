import {
  forwardRef,
  Fragment,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import type {
  ButtonsMessagePart,
  ChatMessage,
  ComponentMessagePart,
  MessagePart,
  TextMessagePart,
  ToolCallMessagePart,
} from "../core";
import { useAssistantContextOptional } from "./context";
import { DEFAULT_CLASS_NAMES, DEFAULT_LABELS } from "./defaults";
import { cx } from "./internal/classes";
import { AssistantMark } from "./internal/icons";
import { Markdown } from "./internal/markdown";
import { MessageActions } from "./MessageActions";
import { ToolCallCard } from "./ToolCallCard";
import { ToolResultCard } from "./ToolResultCard";
import type {
  AssistantActionEvent,
  AssistantComponentRenderer,
} from "./types";

export type AssistantMessageProps = {
  message: ChatMessage;
  showAvatar?: boolean;
} & Omit<HTMLAttributes<HTMLElement>, "children">;

function TextPart({
  part,
  streaming,
  showCursor,
}: {
  part: TextMessagePart;
  streaming: boolean;
  showCursor: boolean;
}) {
  const cursor = streaming && showCursor ? (
    <span aria-hidden="true" className="wk-assistant__cursor" />
  ) : null;

  if (part.format === "markdown") {
    return (
      <div className="wk-assistant__markdown">
        <Markdown text={part.text} />
        {cursor}
      </div>
    );
  }

  return (
    <p className="wk-assistant__text">
      {part.text}
      {cursor}
    </p>
  );
}

function ButtonsPart({
  part,
  message,
  onAction,
}: {
  part: ButtonsMessagePart;
  message: ChatMessage;
  onAction?: (event: AssistantActionEvent) => void | Promise<void>;
}) {
  return (
    <div className="wk-assistant__message-actions">
      {part.buttons.map((button) => (
        <button
          className="wk-assistant__message-button"
          disabled={button.disabled || !onAction}
          key={button.id}
          onClick={() => {
            void onAction?.({
              action: button.action,
              payload: button.payload,
              button,
              message,
            });
          }}
          type="button"
        >
          {button.label}
        </button>
      ))}
    </div>
  );
}

function ComponentPart({
  part,
  message,
  components,
}: {
  part: ComponentMessagePart;
  message: ChatMessage;
  components: Record<string, AssistantComponentRenderer>;
}) {
  const renderer = components[part.component];
  if (!renderer) return null;
  return <>{renderer(part.props, { message, part })}</>;
}

function findToolCall(
  message: ChatMessage,
  toolCallId: string,
): ToolCallMessagePart | undefined {
  return message.parts.find(
    (part): part is ToolCallMessagePart =>
      part.type === "tool-call" && part.toolCallId === toolCallId,
  );
}

export const AssistantMessage = forwardRef<HTMLElement, AssistantMessageProps>(
  function AssistantMessage(
    {
      message,
      showAvatar = true,
      className,
      ...rest
    },
    ref,
  ) {
    const context = useAssistantContextOptional();
    const labels = context?.labels ?? DEFAULT_LABELS;
    const classNames = context?.classNames ?? DEFAULT_CLASS_NAMES;
    const components =
      context?.components ?? ({} as Record<string, AssistantComponentRenderer>);
    const onAction = context?.onAction;
    const assistantBubble = context?.assistantBubble ?? true;
    const userBubble = context?.userBubble ?? true;
    const userAvatar = context?.userAvatar;
    const assistantAvatar = context?.assistantAvatar;
    const streaming = message.status === "streaming";
    const roleLabel =
      message.role === "user"
        ? labels.you
        : message.role === "assistant"
          ? labels.assistant
          : message.role;

    const renderPart = (part: MessagePart, index: number): ReactNode => {
      const showCursor = index === message.parts.length - 1;
      switch (part.type) {
        case "text":
          return (
            <TextPart
              key={part.id}
              part={part}
              showCursor={showCursor}
              streaming={streaming}
            />
          );
        case "buttons":
          return (
            <ButtonsPart
              key={part.id}
              message={message}
              onAction={onAction}
              part={part}
            />
          );
        case "component":
          return (
            <Fragment key={part.id}>
              <ComponentPart
                components={components}
                message={message}
                part={part}
              />
            </Fragment>
          );
        case "tool-call":
          return (
            <ToolCallCard
              key={part.id}
              part={part}
              message={message}
            />
          );
        case "tool-result":
          return (
            <ToolResultCard
              key={part.id}
              call={findToolCall(message, part.toolCallId)}
              part={part}
            />
          );
        default:
          return null;
      }
    };

    return (
      <article
        aria-label={roleLabel}
        className={cx(
          "wk-assistant__message",
          `wk-assistant__message--${message.role}`,
          classNames.message,
          className,
        )}
        data-role={message.role}
        data-status={message.status}
        data-streaming={streaming || undefined}
        ref={ref}
        {...rest}
      >
        {showAvatar && message.role === "assistant" && (
          <span aria-hidden="true" className="wk-assistant__avatar">
            {assistantAvatar ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img alt="Assistant" src={assistantAvatar} />
            ) : (
              <AssistantMark />
            )}
          </span>
        )}
        {showAvatar && message.role === "user" && userAvatar && (
          <span aria-hidden="true" className="wk-assistant__avatar">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="You" src={userAvatar} />
          </span>
        )}
         <div
           className={cx(
             "wk-assistant__bubble",
             !assistantBubble && message.role === "assistant"
               ? "wk-assistant__bubble--plain"
               : undefined,
             !userBubble && message.role === "user"
               ? "wk-assistant__bubble--plain"
               : undefined,
           )}
         >
          {message.parts.map(renderPart)}
           {context?.slots.messageActions ? (
             context.slots.messageActions(message)
           ) : (
             (context?.messageActions ?? true) &&
             message.role === "assistant" &&
             !streaming && <MessageActions message={message} />
           )}
        </div>
      </article>
    );
  },
);
