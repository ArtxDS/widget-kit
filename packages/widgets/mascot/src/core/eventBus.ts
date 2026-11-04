import type { EventReaction, MascotOutEvent, MascotOutPayload } from "./types";

type Handler<K extends MascotOutEvent> = (payload: MascotOutPayload[K]) => void;

export const GENERIC_EVENTS: Record<string, EventReaction> = {
  "ui:success": {
    mood: "happy",
    durationMs: 2500,
    wave: true,
    resolves: ["loading"],
  },
  "ui:error": {
    mood: "error",
    durationMs: 3000,
    resolves: ["loading"],
  },
  "ui:loading": {
    mood: "loading",
    durationMs: 30000,
  },
  "ui:idle": {
    mood: "idle",
  },
  "ui:celebrate": {
    mood: "celebrate",
    durationMs: 3000,
    wave: true,
    resolves: ["loading"],
  },
};

export function createEventBus() {
  const listeners = new Map<MascotOutEvent, Set<Handler<MascotOutEvent>>>();

  function on<K extends MascotOutEvent>(type: K, fn: Handler<K>): () => void {
    let set = listeners.get(type);
    if (!set) {
      set = new Set();
      listeners.set(type, set);
    }
    set.add(fn as Handler<MascotOutEvent>);
    return () => off(type, fn);
  }

  function off<K extends MascotOutEvent>(type: K, fn: Handler<K>): void {
    listeners.get(type)?.delete(fn as Handler<MascotOutEvent>);
  }

  function emitOut<K extends MascotOutEvent>(
    type: K,
    payload: MascotOutPayload[K],
  ): void {
    const set = listeners.get(type);
    if (!set) return;
    for (const fn of set) {
      (fn as Handler<K>)(payload);
    }
  }

  function clear(): void {
    listeners.clear();
  }

  return { on, off, emitOut, clear };
}

export function resolveReaction(
  eventName: string,
  eventMap?: Record<string, EventReaction>,
): EventReaction | undefined {
  return eventMap?.[eventName] ?? GENERIC_EVENTS[eventName];
}

export function resolveMessage(
  eventName: string,
  payload: unknown,
  messages:
    | Record<string, string>
    | ((eventName: string, payload?: unknown) => string | undefined)
    | undefined,
  reaction?: EventReaction,
): string | undefined {
  if (reaction?.bubble) {
    return typeof reaction.bubble === "function"
      ? reaction.bubble(payload)
      : reaction.bubble;
  }
  if (!messages) return undefined;
  if (typeof messages === "function") return messages(eventName, payload);
  return messages[eventName];
}
