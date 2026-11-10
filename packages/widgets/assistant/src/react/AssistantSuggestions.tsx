import type { CSSProperties } from "react";
import { ArrowUpRight } from "lucide-react";
import { useAssistant, useAssistantContext } from "./context";
import { cx } from "./internal/classes";
import { isAssistantBusy } from "./internal/status";
import type { AssistantSuggestion } from "./types";

export type AssistantSuggestionsProps = {
  suggestions?: readonly AssistantSuggestion[];
  className?: string;
  style?: CSSProperties;
  onSelect?: (suggestion: AssistantSuggestion) => void;
};

function suggestionLabel(suggestion: AssistantSuggestion): string {
  return typeof suggestion === "string" ? suggestion : suggestion.label;
}

function suggestionPrompt(suggestion: AssistantSuggestion): string {
  if (typeof suggestion === "string") return suggestion;
  return suggestion.prompt ?? suggestion.label;
}

function suggestionDescription(
  suggestion: AssistantSuggestion,
): string | undefined {
  if (typeof suggestion === "string") return undefined;
  return suggestion.description;
}

export function AssistantSuggestions({
  suggestions,
  className,
  style,
  onSelect,
}: AssistantSuggestionsProps) {
  const { send, status } = useAssistant();
  const context = useAssistantContext();
  const items = suggestions ?? context.suggestions;
  const busy = isAssistantBusy(status);

  if (items.length === 0) return null;

  return (
    <div
      aria-label={context.labels.suggestions}
      className={cx(
        "wk-assistant__suggestions",
        context.classNames.suggestions,
        className,
      )}
      role="group"
      style={style}
    >
      <span className="wk-assistant__suggestions-label">
        {context.labels.suggestions}
      </span>
      <div className="wk-assistant__suggestions-list">
      {items.map((suggestion, index) => {
        const label = suggestionLabel(suggestion);
        const description = suggestionDescription(suggestion);
        return (
          <button
            className={cx(
              "wk-assistant__suggestion",
              context.classNames.suggestion,
            )}
            disabled={busy}
            key={`${label}-${index}`}
            onClick={() => {
              if (onSelect) {
                onSelect(suggestion);
                return;
              }
              void send(suggestionPrompt(suggestion)).catch(() => undefined);
            }}
            type="button"
          >
            <div className="wk-assistant__suggestion-content">
              <span className="wk-assistant__suggestion-title">{label}</span>
              {description && (
                <span className="wk-assistant__suggestion-desc">
                  {description}
                </span>
              )}
            </div>
            <ArrowUpRight
              aria-hidden="true"
              className="wk-assistant__suggestion-icon"
              size={14}
              strokeWidth={1.9}
            />
          </button>
        );
      })}
      </div>
    </div>
  );
}
