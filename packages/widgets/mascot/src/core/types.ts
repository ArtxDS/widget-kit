export type ThemePreset = "aurora" | "ocean" | "sunset" | "mono";

export type ThemeTokens = {
  accentA: string;
  accentMid: string;
  accentB: string;
  eyeFrom: string;
  eyeTo: string;
  shell1: string;
  shell2: string;
  shell3: string;
  shellEdge: string;
  screen1: string;
  screen2: string;
  neck1: string;
  neck2: string;
  neck3: string;
  base1: string;
  base2: string;
  shadow: string;
  bubbleBg: string;
  bubbleFg: string;
  bubbleBorderA: string;
  bubbleBorderB: string;
};

export type CssVarName =
  | "--mascot-accent-a"
  | "--mascot-accent-mid"
  | "--mascot-accent-b"
  | "--mascot-eye-from"
  | "--mascot-eye-to"
  | "--mascot-shell-1"
  | "--mascot-shell-2"
  | "--mascot-shell-3"
  | "--mascot-shell-edge"
  | "--mascot-screen-1"
  | "--mascot-screen-2"
  | "--mascot-neck-1"
  | "--mascot-neck-2"
  | "--mascot-neck-3"
  | "--mascot-base-1"
  | "--mascot-base-2"
  | "--mascot-shadow"
  | "--mascot-bubble-bg"
  | "--mascot-bubble-fg"
  | "--mascot-bubble-border-a"
  | "--mascot-bubble-border-b";

export type EyeKey =
  | "led"
  | "happy"
  | "dots"
  | "lines"
  | "sad"
  | "x"
  | "wide"
  | "half"
  | "lookdown";

export type MouthKey =
  | "omega"
  | "omega-big"
  | "flat"
  | "down"
  | "wavy"
  | "o"
  | "pout";

export type ArmPose = "rest" | "wave-right" | "raise-right" | "both-up";

export type MoodFx = "confetti" | "zzz" | "question" | "exclaim" | null;

export type MoodDef = {
  eyes: EyeKey;
  eyeScale?: number;
  mouth: MouthKey;
  headTilt?: number;
  headDrop?: number;
  arms?: ArmPose;
  fx?: MoodFx;
  priority: number;
  durationMs?: number | null;
  base?: boolean;
};

export type SvgSlot = { svg: string };

export type MascotParts = {
  ears?: "pods" | "none";
  topCap?: "band" | "none";
  chest?: "collar" | "none" | SvgSlot;
  accessory?: "none" | "glasses" | "cap" | "headphones" | SvgSlot;
  base?: "platform" | "none";
  arms?: "wings" | "none";
};

export type EventReaction = {
  mood?: string;
  durationMs?: number | null;
  wave?: boolean;
  look?: "keep" | "none";
  bubble?: string | ((payload?: unknown) => string);
  resolves?: string[];
};

export type SpeechContent = {
  title?: string;
  text?: string;
  emoji?: string;
};

export type MascotBehavior = {
  followPointer?: boolean;
  idleLook?: boolean;
  autoBlink?: boolean | { minMs: number; maxMs: number };
  autoWave?: false | { minMs: number; maxMs: number; onMount?: boolean };
  sleepAfterMs?: number | false;
  reducedMotion?: "auto" | "on" | "off";
};

export type MascotOptions = {
  theme?: ThemePreset | Partial<ThemeTokens>;
  parts?: MascotParts;
  size?: number | string;
  moods?: Record<string, MoodDef>;
  eventMap?: Record<string, EventReaction>;
  messages?:
    | Record<string, string>
    | ((eventName: string, payload?: unknown) => string | undefined);
  behavior?: MascotBehavior;
  bubble?:
    | boolean
    | { position?: "top" | "left" | "right"; durationMs?: number };
  a11y?: { label?: string; announce?: boolean; decorative?: boolean };
  idPrefix?: string;
};

export type MascotOutEvent =
  | "poke"
  | "pet"
  | "click"
  | "wake"
  | "sleep"
  | "moodchange"
  | "speech"
  | "waveend";

export type MascotOutPayload = {
  poke: { count: number };
  pet: Record<string, never>;
  click: { x: number; y: number };
  wake: { from: string };
  sleep: { mood: "sleepy" | "sleeping" };
  moodchange: { mood: string; previous: string };
  speech: SpeechContent;
  waveend: Record<string, never>;
};

export type LookTarget = HTMLElement | { x: number; y: number } | null;

export type MascotInstance = {
  emit(event: string, payload?: unknown): void;
  setMood(mood: string, opts?: { durationMs?: number | null }): void;
  lookAt(target: LookTarget): void;
  wave(): void;
  blink(double?: boolean): void;
  say(
    content: string | { title?: string; text?: string; emoji?: string },
    opts?: { durationMs?: number | null },
  ): void;
  on<K extends MascotOutEvent>(
    type: K,
    fn: (e: MascotOutPayload[K]) => void,
  ): () => void;
  off<K extends MascotOutEvent>(
    type: K,
    fn: (e: MascotOutPayload[K]) => void,
  ): void;
  setTheme(theme: ThemePreset | Partial<ThemeTokens>): void;
  setOptions(partial: Partial<MascotOptions>): void;
  mute(muted: boolean): void;
  destroy(): void;
};

export type ResolvedBehavior = {
  followPointer: boolean;
  idleLook: boolean;
  autoBlink: false | { minMs: number; maxMs: number };
  autoWave: false | { minMs: number; maxMs: number; onMount: boolean };
  sleepAfterMs: number | false;
  reducedMotion: "auto" | "on" | "off";
};

export type EngineMoodSnapshot = {
  id: string;
  def: MoodDef;
};
