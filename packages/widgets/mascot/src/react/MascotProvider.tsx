"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { LookTarget, MascotInstance, MascotOptions, SpeechContent } from "../core/types";
import { Mascot } from "./Mascot";

type MascotContextValue = {
  instance: MascotInstance | null;
  mood: string;
  muted: boolean;
  lastSpeech: string | null;
};

const MascotContext = createContext<MascotContextValue>({
  instance: null,
  mood: "idle",
  muted: false,
  lastSpeech: null,
});

export function MascotProvider({
  children,
  options,
}: {
  children?: ReactNode;
  options?: MascotOptions;
}) {
  const [instance, setInstance] = useState<MascotInstance | null>(null);
  const [mood, setMood] = useState("idle");
  const [muted, setMutedState] = useState(false);
  const [lastSpeech, setLastSpeech] = useState<string | null>(null);

  const onReady = useCallback((next: MascotInstance) => {
    setInstance(next);
    next.on("moodchange", (event) => setMood(event.mood));
    next.on("speech", (content: SpeechContent) => {
      console.log("PROVIDER_SPEECH", content);
      const text =
        typeof content === "string"
          ? content
          : [content.title, content.text].filter(Boolean).join(" ");
      setLastSpeech(text || null);
    });
    const originalMute = next.mute.bind(next);
    next.mute = (value) => {
      setMutedState(value);
      originalMute(value);
    };
  }, []);

  const value = useMemo(
    () => ({ instance, mood, muted, lastSpeech }),
    [instance, mood, muted, lastSpeech],
  );

  return (
    <MascotContext.Provider value={value}>
      <Mascot
        options={options}
        onReady={onReady}
        data-muted={muted ? "true" : "false"}
      />
      {children}
    </MascotContext.Provider>
  );
}

export function useMascot() {
  const ctx = useContext(MascotContext);
  const noop = useCallback(() => undefined, []);

  const emit = useCallback(
    (event: string, payload?: unknown) => {
      ctx.instance?.emit(event, payload);
    },
    [ctx.instance],
  );
  const setMood = useCallback(
    (mood: string, opts?: { durationMs?: number | null }) => {
      ctx.instance?.setMood(mood, opts);
    },
    [ctx.instance],
  );
  const lookAt = useCallback(
    (target: LookTarget) => ctx.instance?.lookAt(target),
    [ctx.instance],
  );
  const wave = ctx.instance?.wave ?? noop;
  const blink = ctx.instance?.blink ?? noop;
  const say = ctx.instance?.say ?? noop;
  const setMuted = useCallback(
    (next: boolean) => {
      ctx.instance?.mute(next);
    },
    [ctx.instance],
  );

  return {
    emit,
    setMood,
    lookAt,
    wave,
    blink,
    say,
    mood: ctx.mood,
    muted: ctx.muted,
    lastSpeech: ctx.lastSpeech,
    setMuted,
  };
}
