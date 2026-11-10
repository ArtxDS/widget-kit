import {
  useCallback,
  useId,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import {
  createAssistantRuntime,
  type AssistantRuntime,
} from "../runtime";
import {
  DEFAULT_CLASS_NAMES,
  DEFAULT_DISPLAY_STATE,
  DEFAULT_LABELS,
  DEFAULT_SLOTS,
} from "./defaults";
import {
  AssistantContext,
  type AssistantContextValue,
} from "./context";
import { useControllableState } from "./internal/useControllableState";
import { isAssistantBusy } from "./internal/status";
import type {
  AssistantComponentRenderer,
  AssistantOpenOptions,
  AssistantProviderProps,
  AssistantSuggestion,
  AssistantTriggerContext,
} from "./types";

const EMPTY_COMPONENTS: Record<string, AssistantComponentRenderer> = {};
const EMPTY_SUGGESTIONS: readonly AssistantSuggestion[] = [];

export function AssistantProvider({
  children,
  runtime,
  transport,
  initialMessages,
  context,
  createId,
  now,
  displayState: controlledDisplayState,
  defaultDisplayState = DEFAULT_DISPLAY_STATE,
  onDisplayStateChange,
  suggestions = EMPTY_SUGGESTIONS,
  onAction,
  components = EMPTY_COMPONENTS,
  assistantBubble = true,
  userBubble = true,
  userAvatar,
  assistantAvatar,
  messageActions = true,
  classNames = DEFAULT_CLASS_NAMES,
  labels: labelOverrides,
  slots = DEFAULT_SLOTS,
  tools,
}: AssistantProviderProps) {
  const [createdRuntime] = useState<AssistantRuntime | null>(() => {
    if (runtime) return null;
    if (!transport) {
      throw new Error(
        "AssistantProvider requires either a runtime or a transport.",
      );
    }
    return createAssistantRuntime({
      transport,
      initialMessages,
      context,
      createId,
      now,
      tools,
    });
  });

  const activeRuntime = runtime ?? createdRuntime;
  if (!activeRuntime) {
    throw new Error(
      "AssistantProvider requires either a runtime or a transport.",
    );
  }

  const snapshot = useSyncExternalStore(
    activeRuntime.subscribe,
    activeRuntime.getSnapshot,
    activeRuntime.getSnapshot,
  );

  const [displayState, setDisplayState] = useControllableState({
    value: controlledDisplayState,
    defaultValue: defaultDisplayState,
    onChange: onDisplayStateChange,
  });

  const [triggerContext, setTriggerContextState] =
    useState<AssistantTriggerContext>(() => {
      return activeRuntime.getContext?.() ?? {};
    });

  const setContext = useCallback(
    (
      updater:
        | AssistantTriggerContext
        | ((prev: AssistantTriggerContext) => AssistantTriggerContext),
    ) => {
      activeRuntime.setContext?.(updater);
      setTriggerContextState(activeRuntime.getContext?.() ?? {});
    },
    [activeRuntime],
  );

  const clearContext = useCallback(() => {
    activeRuntime.clearContext?.();
    setTriggerContextState({});
  }, [activeRuntime]);

  const open = useCallback(
    async (options?: AssistantOpenOptions) => {
      if (options?.context) {
        setContext((prev) => ({ ...prev, ...options.context }));
      }
      setDisplayState("open");
      if (options?.initialMessage) {
        const isBusy = isAssistantBusy(activeRuntime.getSnapshot().status);
        if (!isBusy && options.autoSend !== false) {
          await activeRuntime.send(options.initialMessage);
        }
      }
    },
    [activeRuntime, setContext, setDisplayState],
  );

  const close = useCallback(
    () => setDisplayState("launcher"),
    [setDisplayState],
  );

  const minimize = useCallback(
    () => setDisplayState("minimized"),
    [setDisplayState],
  );

  const restore = useCallback(
    () => setDisplayState("open"),
    [setDisplayState],
  );

  const toggle = useCallback(
    async (options?: AssistantOpenOptions) => {
      if (displayState === "open") {
        setDisplayState("launcher");
      } else {
        await open(options);
      }
    },
    [displayState, open, setDisplayState],
  );

  const labels = useMemo(
    () =>
      labelOverrides
        ? { ...DEFAULT_LABELS, ...labelOverrides }
        : DEFAULT_LABELS,
    [labelOverrides],
  );

  const panelId = useId();

  const value = useMemo<AssistantContextValue>(
    () => ({
      runtime: activeRuntime,
      snapshot,
      displayState,
      setDisplayState,
      open,
      close,
      minimize,
      restore,
      toggle,
      triggerContext,
      setContext,
      clearContext,
      panelId,
      labels,
      classNames,
      slots,
      suggestions,
       components,
       assistantBubble,
       userBubble,
       userAvatar,
       assistantAvatar,
       messageActions,
       onAction,
       send: activeRuntime.send,
      cancel: activeRuntime.cancel,
      retry: activeRuntime.retry,
      reset: activeRuntime.reset,
      confirm: activeRuntime.confirm,
      cancelAction: activeRuntime.cancelAction,
    }),
    [
      activeRuntime,
      snapshot,
      displayState,
      setDisplayState,
      open,
      close,
      minimize,
      restore,
      toggle,
      triggerContext,
      setContext,
      clearContext,
      panelId,
      labels,
      classNames,
      slots,
      suggestions,
       components,
       assistantBubble,
       userBubble,
       userAvatar,
       assistantAvatar,
       messageActions,
       onAction,
     ],
   );

  return (
    <AssistantContext.Provider value={value}>
      {children}
    </AssistantContext.Provider>
  );
}
