export { createMascot } from "./widgets/mascot/src/core/createMascot";
export {
  createMoodMachine,
  applyMood,
  activeMood,
  resolveNamed,
} from "./widgets/mascot/src/core/state";
export { GENERIC_EVENTS, resolveReaction } from "./widgets/mascot/src/core/eventBus";
export {
  applyThemeVars,
  resolveTheme,
  TOKEN_TO_CSS,
  TOKEN_FALLBACKS,
} from "./widgets/mascot/src/core/theme";
export { DEFAULT_MOODS } from "./widgets/mascot/src/core/moods";
export {
  aurora,
  ocean,
  sunset,
  mono,
  themePresets,
} from "./widgets/mascot/src/presets";
export { defineMascotElement } from "./widgets/mascot/src/element/defineMascotElement";

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
} from "./widgets/mascot/src/core/types";
