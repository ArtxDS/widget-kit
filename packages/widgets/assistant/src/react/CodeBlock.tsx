import {
  forwardRef,
  useState,
  type HTMLAttributes,
} from "react";
import { Check, Copy } from "lucide-react";
import { useAssistantContextOptional } from "./context";
import { DEFAULT_CLASS_NAMES, DEFAULT_LABELS } from "./defaults";
import { cx } from "./internal/classes";

export type CodeBlockProps = {
  code: string;
  language?: string;
  className?: string;
} & HTMLAttributes<HTMLDivElement>;

export const CodeBlock = forwardRef<HTMLDivElement, CodeBlockProps>(
  function CodeBlock({ code, language, className, ...rest }, ref) {
    const context = useAssistantContextOptional();
    const labels = context?.labels ?? DEFAULT_LABELS;
    const classNames = context?.classNames ?? DEFAULT_CLASS_NAMES;
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
      try {
        if (typeof navigator !== "undefined" && navigator.clipboard) {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      } catch {
        // Clipboard write failed or permissions denied
      }
    };

    const displayLang = language ? language.toUpperCase() : "CODE";

    return (
      <div
        className={cx(
          "wk-assistant__code-block",
          classNames.codeBlock,
          className,
        )}
        data-language={language || undefined}
        ref={ref}
        {...rest}
      >
        <div className="wk-assistant__code-header">
          <span className="wk-assistant__code-lang">{displayLang}</span>
          <button
            aria-label={copied ? labels.copiedCode : labels.copyCode}
            className="wk-assistant__code-copy"
            onClick={handleCopy}
            title={copied ? labels.copiedCode : labels.copyCode}
            type="button"
          >
            {copied ? (
              <>
                <Check
                  aria-hidden="true"
                  className="wk-assistant__code-copy-icon wk-assistant__code-copy-icon--check"
                  size={12}
                  strokeWidth={2}
                />
                <span className="wk-assistant__code-copy-text">
                  {labels.copiedCode}
                </span>
              </>
            ) : (
              <>
                <Copy
                  aria-hidden="true"
                  className="wk-assistant__code-copy-icon"
                  size={12}
                  strokeWidth={2}
                />
                <span className="wk-assistant__code-copy-text">
                  {labels.copyCode}
                </span>
              </>
            )}
          </button>
        </div>
        <pre className="wk-assistant__code-pre">
          <code>{code}</code>
        </pre>
      </div>
    );
  },
);

