"use client";

import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";

export type StudioMode = "preview" | "playground";
export type StudioViewport = "desktop" | "tablet" | "mobile";
export type InspectorTab = "props" | "docs" | "examples";
export type OutputTab = "react" | "tokens" | "install" | "tests";
export type BadgeTone = "purple" | "cyan" | "green" | "amber" | "red" | "muted";
export type ToastVariant = "loading" | "success" | "warning" | "error";
export type ToastMode = "normal" | "steps";

export type StudioState = {
  item: string;
  mode: StudioMode;
  viewport: StudioViewport;
  inspectorTab: InspectorTab;
  outputTab: OutputTab;
  badgeTone: BadgeTone;
  badgeDot: boolean;
  badgeLabel: string;
  toastVariant: ToastVariant;
  toastMode: ToastMode;
  toastOpen: boolean;
};

export type StudioAction =
  | { type: "select-item"; item: string }
  | { type: "set-mode"; mode: StudioMode }
  | { type: "set-viewport"; viewport: StudioViewport }
  | { type: "set-inspector-tab"; tab: InspectorTab }
  | { type: "set-output-tab"; tab: OutputTab }
  | { type: "set-badge-tone"; tone: BadgeTone }
  | { type: "set-badge-dot"; enabled: boolean }
  | { type: "set-badge-label"; label: string }
  | { type: "set-toast-variant"; variant: ToastVariant }
  | { type: "set-toast-mode"; mode: ToastMode }
  | { type: "set-toast-open"; open: boolean }
  | { type: "reset-props" };

const StudioContext = createContext<
  { state: StudioState; dispatch: Dispatch<StudioAction> } | null
>(null);

function createInitialState(item: string, mode: StudioMode): StudioState {
  return {
    item,
    mode,
    viewport: "desktop",
    inspectorTab: "props",
    outputTab: "react",
    badgeTone: "green",
    badgeDot: true,
    badgeLabel: "Ready",
    toastVariant: "loading",
    toastMode: "normal",
    toastOpen: true,
  };
}

function studioReducer(state: StudioState, action: StudioAction): StudioState {
  switch (action.type) {
    case "select-item":
      return { ...createInitialState(action.item, state.mode), mode: state.mode };
    case "set-mode":
      return { ...state, mode: action.mode };
    case "set-viewport":
      return { ...state, viewport: action.viewport };
    case "set-inspector-tab":
      return { ...state, inspectorTab: action.tab };
    case "set-output-tab":
      return { ...state, outputTab: action.tab };
    case "set-badge-tone":
      return { ...state, badgeTone: action.tone };
    case "set-badge-dot":
      return { ...state, badgeDot: action.enabled };
    case "set-badge-label":
      return { ...state, badgeLabel: action.label };
    case "set-toast-variant":
      return { ...state, toastVariant: action.variant };
    case "set-toast-mode":
      return { ...state, toastMode: action.mode };
    case "set-toast-open":
      return { ...state, toastOpen: action.open };
    case "reset-props":
      return {
        ...state,
        badgeTone: "green",
        badgeDot: true,
        badgeLabel: "Ready",
        toastVariant: "loading",
        toastMode: "normal",
        toastOpen: true,
      };
    default:
      return state;
  }
}

export function StudioProvider({
  children,
  initialItem,
  initialMode,
}: {
  children: ReactNode;
  initialItem: string;
  initialMode: StudioMode;
}) {
  const [state, dispatch] = useReducer(
    studioReducer,
    { item: initialItem, mode: initialMode },
    ({ item, mode }) => createInitialState(item, mode),
  );
  const value = useMemo(() => ({ state, dispatch }), [state]);

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

export function useStudio() {
  const context = useContext(StudioContext);
  if (!context) {
    throw new Error("useStudio must be used inside StudioProvider.");
  }
  return context;
}
