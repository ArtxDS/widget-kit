export { Badge, Toast, ToastProvider, useToast } from "./components/ui";
export type { BadgeProps, BadgeTone } from "./components/ui";

export type {
  ToastMode,
  ToastProps,
  ToastPlacement,
  ToastStep,
  ToastStepStatus,
  ToastVariant,
  ToastOptions,
  ToastContextValue,
} from "./components/ui";

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
  MascotAvatarProps,
  MascotInstance,
  MascotOptions,
  MascotOutEvent,
  MascotProps,
  MoodDef,
  ThemePreset,
  ThemeTokens,
  EventReaction,
} from "./widgets/mascot/src";
