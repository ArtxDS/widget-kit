import { useAssistantContext } from "../context";
import { cx } from "./classes";
import { AssistantMark } from "./icons";

export function EmptyState() {
  const { labels, classNames, slots } = useAssistantContext();

  if (slots.empty) return <>{slots.empty}</>;

  return (
    <div className={cx("wk-assistant__empty", classNames.empty)}>
      <span aria-hidden="true" className="wk-assistant__empty-mark">
        <AssistantMark />
      </span>
      <h3 className="wk-assistant__empty-title">{labels.emptyTitle}</h3>
      <p className="wk-assistant__empty-description">
        {labels.emptyDescription}
      </p>
    </div>
  );
}
