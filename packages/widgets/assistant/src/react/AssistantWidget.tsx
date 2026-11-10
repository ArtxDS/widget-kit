import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
  type Ref,
} from "react";
import { AssistantProvider } from "./AssistantProvider";
import { AssistantLauncher } from "./AssistantLauncher";
import { AssistantPanel } from "./AssistantPanel";
import { useAssistant, useAssistantChat, useAssistantContext } from "./context";
import { cx } from "./internal/classes";
import type {
  AssistantDisplayState,
  AssistantImperativeHandle,
  AssistantPlacement,
  AssistantPosition,
  AssistantWidgetProps,
} from "./types";

type AssistantWidgetFrameProps = {
  placement: AssistantPlacement;
  position: AssistantPosition;
  theme?: string;
  className?: string;
  style?: CSSProperties;
};

function AssistantWidgetFrame({
  placement,
  position,
  theme,
  className,
  style,
}: AssistantWidgetFrameProps) {
  const { displayState, open, close } = useAssistantChat();
  const { classNames } = useAssistantContext();
  const launcherRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const previousState = useRef<AssistantDisplayState>(displayState);

  const isTest =
    typeof process !== "undefined" && process.env.NODE_ENV === "test";
  const [isClosing, setIsClosing] = useState(false);
  const [isMinimizing, setIsMinimizing] = useState(false);
  const closing = isClosing && displayState !== "open";
  const minimizing = isMinimizing && displayState !== "open";
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const minimizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Duration must match the collapse animation in CSS (--assistant-duration-panel-close)
  const CLOSE_DURATION_MS = 680;
  const MINIMIZE_DURATION_MS = 420;

  const closePanel = useCallback(() => {
    if (displayState !== "open") return;
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    if (!isTest) {
      setIsClosing(true);
      closeTimerRef.current = setTimeout(() => {
        setIsClosing(false);
        closeTimerRef.current = null;
      }, CLOSE_DURATION_MS);
    }
    close();
  }, [close, displayState, isTest]);

  const minimizePanel = useCallback(() => {
    if (displayState !== "open") return;
    if (minimizeTimerRef.current) {
      clearTimeout(minimizeTimerRef.current);
      minimizeTimerRef.current = null;
    }
    if (!isTest) {
      setIsMinimizing(true);
      minimizeTimerRef.current = setTimeout(() => {
        setIsMinimizing(false);
        minimizeTimerRef.current = null;
      }, MINIMIZE_DURATION_MS);
    }
  }, [displayState, isTest]);

  useEffect(() => {
    const previous: AssistantDisplayState = previousState.current;
    previousState.current = displayState;

    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    if (displayState === "open") {
      const input = panelRef.current?.querySelector<HTMLElement>(
        "[data-assistant-composer-input]",
      );
      (input ?? panelRef.current)?.focus();
      return;
    }

    if (previous === "open") {
      launcherRef.current?.focus();
    }
  }, [displayState, isTest]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
      if (minimizeTimerRef.current) {
        clearTimeout(minimizeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleGlobalKeyDown = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        if (!event.defaultPrevented) {
          event.preventDefault();
          if (displayState === "open") {
            const input = panelRef.current?.querySelector<HTMLElement>(
              "[data-assistant-composer-input]",
            );
            if (document.activeElement === input) {
              closePanel();
            } else {
              input?.focus();
            }
          } else {
            open();
          }
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [displayState, open, closePanel]);

  return (
    <div
      className={cx(
        "wk-assistant",
        `wk-assistant--${placement}`,
        classNames.root,
        className,
      )}
      data-placement={placement}
      data-position={position}
      data-state={displayState}
      data-theme={theme}
      data-transitioning={closing || minimizing ? "" : undefined}
      style={style}
    >
      {((displayState === "launcher" || displayState === "minimized") && !closing && !minimizing) && (
        <AssistantLauncher ref={launcherRef} />
      )}
      {(displayState === "open" || isClosing || isMinimizing) && (
        <AssistantPanel
          isClosing={closing}
          isMinimizing={minimizing}
          onAnimationEnd={() => {
            if (isMinimizing) {
              setIsMinimizing(false);
            } else if (isClosing) {
              setIsClosing(false);
            }
          }}
          onCloseStart={closePanel}
          onMinimizeStart={minimizePanel}
          ref={panelRef}
        />
      )}
    </div>
  );
}

function AssistantWidgetImperativeBridge({
  imperativeRef,
}: {
  imperativeRef?: Ref<AssistantImperativeHandle>;
}) {
  const assistant = useAssistant();
  useImperativeHandle(
    imperativeRef,
    () => ({
      open: assistant.open,
      close: assistant.close,
      toggle: assistant.toggle,
      minimize: assistant.minimize,
      restore: assistant.restore,
      send: assistant.send,
      reset: assistant.reset,
      setContext: assistant.setContext,
      getContext: () => assistant.context,
      clearContext: assistant.clearContext,
      getDisplayState: () => assistant.displayState,
    }),
    [assistant],
  );
  return null;
}

export const AssistantWidget = forwardRef<
  AssistantImperativeHandle,
  AssistantWidgetProps
>(function AssistantWidget(
  {
    placement = "floating",
    position,
    theme,
    className,
    style,
    ...providerProps
  },
  ref,
) {
  const resolvedPosition =
    position ?? (placement === "docked" ? "right" : "bottom-right");

  return (
    <AssistantProvider {...providerProps}>
      {ref ? <AssistantWidgetImperativeBridge imperativeRef={ref} /> : null}
      <AssistantWidgetFrame
        className={className}
        placement={placement}
        position={resolvedPosition}
        style={style}
        theme={theme}
      />
    </AssistantProvider>
  );
});
