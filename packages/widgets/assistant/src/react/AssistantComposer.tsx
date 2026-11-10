import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Send, Square } from "lucide-react";
import { useAssistant, useAssistantContext } from "./context";
import { cx } from "./internal/classes";
import { isAssistantBusy } from "./internal/status";

export type AssistantComposerProps = {
  className?: string;
  placeholder?: string;
};

export const AssistantComposer = forwardRef<
  HTMLTextAreaElement,
  AssistantComposerProps
>(function AssistantComposer({ className, placeholder }, ref) {
  const { send, cancel, status } = useAssistant();
  const { labels, classNames } = useAssistantContext();
  const [value, setValue] = useState("");
  const hintId = useId();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const busy = isAssistantBusy(status);

  const setTextareaRef = (node: HTMLTextAreaElement | null) => {
    textareaRef.current = node;
    if (typeof ref === "function") {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  };

  useEffect(() => {
    const node = textareaRef.current;
    if (!node) return;
    node.style.height = "auto";
    if (node.clientWidth <= 160) return;
    if (node.scrollHeight > 0) {
      node.style.height = `${Math.min(node.scrollHeight, 144)}px`;
    }
  }, [value]);

  const submit = () => {
    const trimmed = value.trim();
    if (trimmed.length === 0 || busy) return;
    setValue("");
    void send(trimmed).catch(() => {
      setValue((current) => current || trimmed);
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <form
      className={cx("wk-assistant__composer", classNames.composer, className)}
      onSubmit={handleSubmit}
    >
      <div className="wk-assistant__composer-field">
        <textarea
          aria-describedby={hintId}
          aria-label={placeholder ?? labels.placeholder}
          className="wk-assistant__textarea"
          data-assistant-composer-input=""
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? labels.placeholder}
          ref={setTextareaRef}
          rows={1}
          value={value}
        />
        <span className="wk-assistant__sr-only" id={hintId}>
          Press Enter to send. Press Shift and Enter for a new line.
        </span>
        {busy ? (
          <button
            aria-label={labels.stop}
            className="wk-assistant__send wk-assistant__send--stop"
            onClick={cancel}
            title={labels.stop}
            type="button"
          >
            <Square aria-hidden="true" fill="currentColor" size={12} />
          </button>
        ) : (
          <button
            aria-label={labels.send}
            className="wk-assistant__send"
            disabled={value.trim().length === 0}
            title={labels.send}
            type="submit"
          >
            <Send aria-hidden="true" size={15} strokeWidth={1.9} />
          </button>
        )}
      </div>
    </form>
  );
});
