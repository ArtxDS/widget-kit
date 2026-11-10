import type {
  MascotInstance,
  MascotOptions,
  MoodDef,
} from "../../../../index";
import type { AssistantStatus } from "../core";

export type AssistantMascotMood =
  | "idle"
  | "thinking"
  | "speaking"
  | "happy"
  | "confused"
  | "error";

export type AssistantMascotMoodMap = Record<AssistantStatus, AssistantMascotMood>;

export const ASSISTANT_MASCOT_MOOD_MAP: AssistantMascotMoodMap = {
  idle: "idle",
  submitting: "thinking",
  thinking: "thinking",
  streaming: "speaking",
  "executing-tool": "thinking",
  "awaiting-confirmation": "confused",
  error: "error",
};

export const ASSISTANT_MASCOT_MOODS: Record<string, MoodDef> = {
  thinking: {
    eyes: "dots",
    mouth: "flat",
    headTilt: -2,
    headDrop: -4,
    arms: "rest",
    fx: "question",
    priority: 80,
    durationMs: 30000,
  },
  speaking: {
    eyes: "happy",
    mouth: "omega-big",
    headTilt: 2,
    arms: "wave-right",
    fx: null,
    priority: 30,
    durationMs: null,
    base: true,
  },
};

export type MascotMoodInstanceLike = Pick<MascotInstance, "setMood"> & {
  say?: MascotInstance["say"];
  emit?: MascotInstance["emit"];
  wave?: MascotInstance["wave"];
};

export type MascotInstanceLike = MascotMoodInstanceLike;

export function assistantMascotMoodForStatus(
  status: AssistantStatus,
): AssistantMascotMood {
  return ASSISTANT_MASCOT_MOOD_MAP[status];
}

export function assistantMascotOptions(
  options: MascotOptions = {},
): MascotOptions {
  return {
    ...options,
    moods: {
      ...ASSISTANT_MASCOT_MOODS,
      ...(options.moods ?? {}),
    },
  };
}

export function applyAssistantStatusToMascot(
  instance: MascotInstanceLike,
  status: AssistantStatus,
): AssistantMascotMood {
  const mood = assistantMascotMoodForStatus(status);
  instance.setMood(mood);
  return mood;
}

export function applyAssistantHappyToMascot(
  instance: MascotInstanceLike,
): "happy" {
  instance.setMood("happy");
  return "happy";
}

export function applyAssistantSpeechToMascot(
  instance: MascotInstanceLike,
  text: string,
): "speaking" {
  instance.setMood("speaking");
  instance.say?.({ text });
  return "speaking";
}

export type AssistantMascotMoodSync = {
  sync: (status: AssistantStatus) => AssistantMascotMood;
  happy: () => "happy";
  speak: (text: string) => "speaking";
  reset: () => AssistantMascotMood;
  lastMood: () => AssistantMascotMood | null;
};

export function createAssistantMascotMoodSync(
  getInstance: () => MascotMoodInstanceLike | null | undefined,
): AssistantMascotMoodSync {
  let lastMood: AssistantMascotMood | null = null;

  const sync = (status: AssistantStatus): AssistantMascotMood => {
    const instance = getInstance();
    if (!instance) return assistantMascotMoodForStatus(status);
    const mood = applyAssistantStatusToMascot(instance, status);
    lastMood = mood;
    return mood;
  };

  return {
    sync,
    happy: (): "happy" => {
      const instance = getInstance();
      if (!instance) return "happy";
      const mood = applyAssistantHappyToMascot(instance);
      lastMood = mood;
      return mood;
    },
    speak: (text: string): "speaking" => {
      const instance = getInstance();
      if (!instance) return "speaking";
      const mood = applyAssistantSpeechToMascot(instance, text);
      lastMood = mood;
      return mood;
    },
    reset: (): AssistantMascotMood => {
      const instance = getInstance();
      if (!instance) return "idle";
      instance.setMood("idle");
      lastMood = "idle";
      return "idle";
    },
    lastMood: () => lastMood,
  };
}
