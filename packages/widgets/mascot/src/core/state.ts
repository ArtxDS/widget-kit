import { LOADING_SAFETY_MS } from "./moods";
import type { MoodDef } from "./types";

export type TransientMood = {
  id: string;
  priority: number;
  until: number | null;
};

export type MoodMachine = {
  base: string;
  transient: TransientMood | null;
};

export function createMoodMachine(base = "idle"): MoodMachine {
  return { base, transient: null };
}

export function activeMood(machine: MoodMachine, now: number): string {
  const next = expireTransient(machine, now);
  return next.transient?.id ?? next.base;
}

export function expireTransient(
  machine: MoodMachine,
  now: number,
): MoodMachine {
  if (!machine.transient) return machine;
  if (machine.transient.until !== null && now >= machine.transient.until) {
    return { ...machine, transient: null };
  }
  return machine;
}

export function applyMood(
  machine: MoodMachine,
  moodId: string,
  def: MoodDef | undefined,
  now: number,
  durationOverride?: number | null,
): MoodMachine {
  if (!def) return machine;
  const current = expireTransient(machine, now);
  const duration =
    durationOverride === undefined ? def.durationMs : durationOverride;

  if (def.base) {
    return { base: moodId, transient: null };
  }

  const currentPriority = current.transient?.priority ?? -1;
  if (current.transient && def.priority < currentPriority) {
    return current;
  }

  let until: number | null;
  if (duration === null) until = null;
  else if (typeof duration === "number") until = now + duration;
  else until = now + (def.durationMs ?? 0);

  if (moodId === "loading" && until === null) {
    until = now + LOADING_SAFETY_MS;
  }
  if (moodId === "loading" && typeof duration !== "number" && duration !== null) {
    until = now + LOADING_SAFETY_MS;
  }

  return {
    ...current,
    transient: { id: moodId, priority: def.priority, until },
  };
}

export function resolveNamed(
  machine: MoodMachine,
  names: string[],
  now: number,
): MoodMachine {
  const current = expireTransient(machine, now);
  if (!current.transient) return current;
  if (names.includes(current.transient.id)) {
    return { ...current, transient: null };
  }
  return current;
}

export function isSleepMood(id: string): boolean {
  return id === "sleepy" || id === "sleeping";
}
