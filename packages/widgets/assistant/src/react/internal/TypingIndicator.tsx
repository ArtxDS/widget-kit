import { useAssistantContext } from "../context";
import { cx } from "./classes";

export function TypingIndicator() {
  const { labels, classNames, slots } = useAssistantContext();

  if (slots.typing) return <>{slots.typing}</>;

  return (
    <div
      aria-hidden="true"
      className={cx("wk-assistant__typing", classNames.typing)}
    >
      <span className="wk-assistant__typing-dots">
        <span />
        <span />
        <span />
      </span>
      <span className="wk-assistant__typing-label">{labels.thinking}</span>
    </div>
  );
}
