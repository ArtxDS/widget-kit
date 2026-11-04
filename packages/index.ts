export { Badge } from "./components/ui/badge";
export type { BadgeTone } from "./components/ui/badge";

export { Toast } from "./components/ui/toast";
export type {
  ToastMode,
  ToastProps,
  ToastPlacement,
  ToastStep,
  ToastStepStatus,
  ToastVariant,
} from "./components/ui/toast";

export {
  Mascot,
  MascotProvider,
  useMascot,
  MascotAvatar,
  SpeechBubble,
  createMascot,
  defineMascotElement,
  DEFAULT_MOODS,
  themePresets,
  aurora,
  ocean,
  sunset,
  mono,
} from "./widgets/mascot/src";
export type {
  MascotInstance,
  MascotOptions,
  MascotOutEvent,
  MoodDef,
  ThemePreset,
  ThemeTokens,
  EventReaction,
} from "./widgets/mascot/src";
