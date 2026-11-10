import {
  forwardRef,
  useState,
  type HTMLAttributes,
} from "react";
import { Check, Copy } from "lucide-react";
import type { ChatMessage, TextMessagePart } from "../core";
import { useAssistantContextOptional } from "./context";
import { DEFAULT_CLASS_NAMES, DEFAULT_LABELS } from "./defaults";
import { cx } from "./internal/classes";

export type MessageActionsProps = {
  message: ChatMessage;
  className?: string;
} & HTMLAttributes<HTMLDivElement>;

export const MessageActions = forwardRef<HTMLDivElement, MessageActionsProps>(
  function MessageActions({ message, className, children, ...rest }, ref) {
    const context = useAssistantContextOptional();
    const labels = context?.labels ?? DEFAULT_LABELS;
    const classNames = context?.classNames ?? DEFAULT_CLASS_NAMES;
    const [copied, setCopied] = useState(false);

    const textContent = message.parts
      .filter((part): part is TextMessagePart => part.type === "text")
      .map((part) => part.text)
      .join("\n\n");

    const handleCopy = async () => {
      if (!textContent) return;
      try {
        if (typeof navigator !== "undefined" && navigator.clipboard) {
          await navigator.clipboard.writeText(textContent);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      } catch {
        // Clipboard write failed or permissions denied
      }
    };

    if (!textContent && !children) {
      return null;
    }

    return (
      <div
        aria-label="Message actions"
        className={cx(
          "wk-assistant__message-actions-bar",
          classNames.messageActions,
          className,
        )}
        ref={ref}
        role="toolbar"
        {...rest}
      >
        {textContent && (
          <button
            aria-label={copied ? labels.copiedMessage : labels.copyMessage}
            className="wk-assistant__action-btn"
            onClick={handleCopy}
            title={copied ? labels.copiedMessage : labels.copyMessage}
            type="button"
          >
             {copied ? (
               <>
                 <Check
                   aria-hidden="true"
                   className="wk-assistant__action-icon wk-assistant__action-icon--check"
                   size={10}
                   strokeWidth={2}
                 />
                 <span className="wk-assistant__action-text">{labels.copiedMessage}</span>
               </>
             ) : (
               <>
                 <Copy
                   aria-hidden="true"
                   className="wk-assistant__action-icon"
                   size={10}
                   strokeWidth={2}
                 />
                 <span className="wk-assistant__action-text">{labels.copyMessage}</span>
               </>
             )}
          </button>
        )}
        {children}
      </div>
    );
  },
);

