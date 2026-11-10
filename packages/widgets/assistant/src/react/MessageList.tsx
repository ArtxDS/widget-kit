import {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { ArrowDown } from "lucide-react";
import { useAssistant, useAssistantContext } from "./context";
import { AssistantMessage } from "./AssistantMessage";
import { cx } from "./internal/classes";
import { EmptyState } from "./internal/EmptyState";
import { isAssistantBusy } from "./internal/status";
import { TypingIndicator } from "./internal/TypingIndicator";

export type MessageListProps = {
  className?: string;
};

export function MessageList({ className }: MessageListProps) {
  const { messages, status } = useAssistant();
  const { labels, classNames, slots } = useAssistantContext();
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const previousUserCount = useRef(0);
  const stickToBottom = useRef(true);
  const [atBottom, setAtBottom] = useState(true);
  const busy = isAssistantBusy(status);

  const scrollToLatest = useCallback(() => {
    const node = viewportRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
    stickToBottom.current = true;
    setAtBottom(true);
  }, []);

  useEffect(() => {
    const userCount = messages.filter(
      (message) => message.role === "user",
    ).length;
    if (userCount > previousUserCount.current) {
      stickToBottom.current = true;
    }
    previousUserCount.current = userCount;

    if (stickToBottom.current) {
      const node = viewportRef.current;
      if (node) node.scrollTop = node.scrollHeight;
    }
  }, [messages, status]);

  const handleScroll = () => {
    const node = viewportRef.current;
    if (!node) return;
    const distance = node.scrollHeight - node.scrollTop - node.clientHeight;
    const nearBottom = distance <= 48;
    stickToBottom.current = nearBottom;
    setAtBottom(nearBottom);
  };

  if (messages.length === 0) {
    return (
      <div className={cx("wk-assistant__message-viewport", className)}>
        <div
          className={cx(
            "wk-assistant__messages",
            "wk-assistant__messages--empty",
            classNames.messages,
          )}
        >
          <EmptyState />
          {(status === "thinking" || status === "submitting") && (
            <TypingIndicator />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cx("wk-assistant__message-viewport", className)}>
      <div
        aria-busy={busy}
        aria-label={labels.conversation}
        aria-live="polite"
        aria-relevant="additions text"
        className={cx("wk-assistant__messages", classNames.messages)}
        onScroll={handleScroll}
        ref={viewportRef}
        role="log"
      >
        {messages.map((message) =>
          slots.message ? (
            <Fragment key={message.id}>
              {slots.message(message)}
            </Fragment>
          ) : (
            <AssistantMessage key={message.id} message={message} />
          ),
        )}
        {(status === "thinking" || status === "submitting") && (
          <TypingIndicator />
        )}
      </div>
      {!atBottom && (
        <button
          aria-label={labels.scrollToLatest}
          className="wk-assistant__scroll-button"
          onClick={scrollToLatest}
          title={labels.scrollToLatest}
          type="button"
        >
          <ArrowDown aria-hidden="true" size={14} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
