export { createMascot } from "./core/createMascot";
export { createMoodMachine, applyMood, activeMood, resolveNamed } from "./core/state";
export { GENERIC_EVENTS, resolveReaction } from "./core/eventBus";
export { applyThemeVars, resolveTheme, TOKEN_TO_CSS, TOKEN_FALLBACKS } from "./core/theme";
export { DEFAULT_MOODS } from "./core/moods";
export { aurora, ocean, sunset, mono, themePresets } from "./presets";
export { defineMascotElement } from "./element/defineMascotElement";
export { Mascot } from "./react/Mascot";
export { MascotProvider, useMascot } from "./react/MascotProvider";
export { MascotAvatar } from "./react/MascotAvatar";
export { SpeechBubble } from "./react/SpeechBubble";

export type {
  ArmPose,
  EventReaction,
  EyeKey,
  LookTarget,
  MascotBehavior,
  MascotInstance,
  MascotOptions,
  MascotOutEvent,
  MascotOutPayload,
  MascotParts,
  MoodDef,
  MoodFx,
  MouthKey,
  SpeechContent,
  ThemePreset,
  ThemeTokens,
} from "./core/types";
export type { MascotProps } from "./react/Mascot";
export type { MascotAvatarProps } from "./react/MascotAvatar";
