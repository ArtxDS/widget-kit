"use client";

import {
  Mascot,
  MascotAvatar,
  themePresets,
  type MascotInstance,
  type MascotOptions,
  type MascotOutEvent,
  type ThemePreset,
} from "@artxds/widget-kit";
import { tw } from "@/lib/tailwind";
import { useMemo, useRef, useState } from "react";
import { Dropdown } from "../shared/dropdown";

const moods = [
  "idle",
  "greeting",
  "happy",
  "celebrate",
  "loading",
  "sleepy",
  "sleeping",
  "error",
  "confused",
  "serious",
  "surprised",
  "dizzy",
  "hungry",
  "thinking",
] as const;

const events = [
  "ui:success",
  "ui:error",
  "ui:loading",
  "ui:idle",
  "ui:celebrate",
  "checkout:paid",
] as const;

const accessories = ["none", "glasses", "cap", "headphones"] as const;
const bubblePositions = ["top", "left", "right"] as const;
const outEvents: MascotOutEvent[] = [
  "poke",
  "pet",
  "click",
  "wake",
  "sleep",
  "moodchange",
  "waveend",
];

function PlayToggle({
  checked,
  label,
  detail,
  onChange,
}: {
  checked: boolean;
  label: string;
  detail: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className={tw("control-toggle")}>
      <span>
        <strong>{label}</strong>
        <small>{detail}</small>
      </span>
      <button
        aria-checked={checked}
        aria-label={label}
        className={tw(`dashboard-toggle${checked ? " is-checked" : ""}`)}
        onClick={() => onChange(!checked)}
        role="switch"
        type="button"
      >
        <span />
      </button>
    </div>
  );
}

export function useMascotPlayground() {
  const instanceRef = useRef<MascotInstance | null>(null);
  const unsubsRef = useRef<Array<() => void>>([]);
  const lookRef = useRef<HTMLButtonElement>(null);
  const [theme, setTheme] = useState<ThemePreset>("aurora");
  const [mood, setMood] = useState<(typeof moods)[number]>("idle");
  const [ears, setEars] = useState(true);
  const [topCap, setTopCap] = useState(true);
  const [chest, setChest] = useState(true);
  const [arms, setArms] = useState(true);
  const [base, setBase] = useState(true);
  const [accessory, setAccessory] = useState<(typeof accessories)[number]>("none");
  const [reduced, setReduced] = useState(false);
  const [follow, setFollow] = useState(true);
  const [autoBlink, setAutoBlink] = useState(true);
  const [autoWave, setAutoWave] = useState(false);
  const [muted, setMuted] = useState(false);
  const [bubblePosition, setBubblePosition] =
    useState<(typeof bubblePositions)[number]>("top");
  const [size, setSize] = useState(220);
  const [accentA, setAccentA] = useState(themePresets.aurora.accentA);
  const [accentB, setAccentB] = useState(themePresets.aurora.accentB);
  const [eyeFrom, setEyeFrom] = useState(themePresets.aurora.eyeFrom);
  const [log, setLog] = useState<string[]>([]);

  const options = useMemo<MascotOptions>(
    () => ({
      theme: {
        ...themePresets[theme],
        accentA,
        accentB,
        eyeFrom,
      },
      parts: {
        ears: ears ? "pods" : "none",
        topCap: topCap ? "band" : "none",
        chest: chest ? "collar" : "none",
        arms: arms ? "wings" : "none",
        base: base ? "platform" : "none",
        accessory,
      },
      behavior: {
        followPointer: follow,
        idleLook: follow,
        autoBlink,
        autoWave: autoWave
          ? { minMs: 9000, maxMs: 16000, onMount: true }
          : false,
        reducedMotion: reduced ? "on" : "off",
      },
      bubble: { position: bubblePosition, durationMs: 3200 },
      a11y: { label: "Playground mascot", announce: true },
      size,
      moods: {
        thinking: {
          eyes: "half",
          mouth: "flat",
          fx: "question",
          priority: 45,
          durationMs: 2000,
        },
      },
      eventMap: {
        "checkout:paid": {
          mood: "celebrate",
          wave: true,
          bubble: "Pago!",
        },
      },
      messages: {
        "ui:success": "Deu certo!",
        "ui:error": "Algo falhou.",
        "ui:loading": "Trabalhando…",
        "ui:celebrate": "UHUL!",
      },
    }),
    [
      accessory,
      accentA,
      accentB,
      arms,
      autoBlink,
      autoWave,
      base,
      bubblePosition,
      chest,
      ears,
      eyeFrom,
      follow,
      reduced,
      size,
      theme,
      topCap,
    ],
  );

  const snippet = `<Mascot
  options={{
    theme: "${theme}",
    size: ${size},
    parts: {
      ears: "${ears ? "pods" : "none"}",
      topCap: "${topCap ? "band" : "none"}",
      chest: "${chest ? "collar" : "none"}",
      arms: "${arms ? "wings" : "none"}",
      base: "${base ? "platform" : "none"}",
      accessory: "${accessory}",
    },
    behavior: { reducedMotion: "${reduced ? "on" : "off"}" },
  }}
/>`;

  function applyPreset(next: ThemePreset) {
    const tokens = themePresets[next];
    setTheme(next);
    setAccentA(tokens.accentA);
    setAccentB(tokens.accentB);
    setEyeFrom(tokens.eyeFrom);
    instanceRef.current?.setTheme(next);
  }

  function attach(instance: MascotInstance) {
    instanceRef.current = instance;
    instance.mute(muted);
    for (const unsubscribe of unsubsRef.current) unsubscribe();
    unsubsRef.current = outEvents.map((type) =>
      instance.on(type, () => {
        setLog((current) => [type, ...current].slice(0, 12));
      }),
    );
  }

  function emit(name: string) {
    instanceRef.current?.emit(name);
  }

  return {
    accessory,
    accentA,
    accentB,
    applyPreset,
    arms,
    attach,
    autoBlink,
    autoWave,
    base,
    bubblePosition,
    chest,
    ears,
    emit,
    eyeFrom,
    follow,
    instanceRef,
    lookRef,
    log,
    mood,
    muted,
    options,
    reduced,
    setAccessory,
    setAccentA,
    setAccentB,
    setArms,
    setAutoBlink,
    setAutoWave,
    setBase,
    setBubblePosition,
    setChest,
    setEars,
    setEyeFrom,
    setFollow,
    setMood,
    setMuted,
    setReduced,
    setSize,
    setTopCap,
    size,
    snippet,
    theme,
    topCap,
  };
}

export type MascotPlaygroundState = ReturnType<typeof useMascotPlayground>;

export function MascotPlaygroundControls({
  playground,
}: {
  playground: MascotPlaygroundState;
}) {
  const {
    accessory,
    accentA,
    accentB,
    applyPreset,
    arms,
    autoBlink,
    autoWave,
    base,
    bubblePosition,
    chest,
    ears,
    emit,
    eyeFrom,
    follow,
    instanceRef,
    lookRef,
    log,
    mood,
    muted,
    reduced,
    setAccessory,
    setAccentA,
    setAccentB,
    setArms,
    setAutoBlink,
    setAutoWave,
    setBase,
    setBubblePosition,
    setChest,
    setEars,
    setEyeFrom,
    setFollow,
    setMood,
    setMuted,
    setReduced,
    setSize,
    setTopCap,
    size,
    theme,
    topCap,
  } = playground;

  return (
    <>
      <div className={tw("control-label")}>
        <span>Theme preset</span>
        <Dropdown
          label="Theme preset"
          value={theme}
          onChange={(value) => applyPreset(value as ThemePreset)}
          options={["aurora", "ocean", "sunset", "mono"].map((value) => ({
            label: value,
            value,
          }))}
        />
      </div>
      <div className={tw("mascot-token-row")}>
        <span>Accent A</span>
        <input
          aria-label="Accent A"
          type="color"
          value={accentA}
          onChange={(event) => setAccentA(event.target.value)}
        />
      </div>
      <div className={tw("mascot-token-row")}>
        <span>Accent B</span>
        <input
          aria-label="Accent B"
          type="color"
          value={accentB}
          onChange={(event) => setAccentB(event.target.value)}
        />
      </div>
      <div className={tw("mascot-token-row")}>
        <span>Eye color</span>
        <input
          aria-label="Eye color"
          type="color"
          value={eyeFrom}
          onChange={(event) => setEyeFrom(event.target.value)}
        />
      </div>
      <div className={tw("control-label")}>
        <span>Mood</span>
        <Dropdown
          label="Mood"
          value={mood}
          onChange={(value) => {
            const next = value as (typeof moods)[number];
            setMood(next);
            instanceRef.current?.setMood(next);
          }}
          options={moods.map((value) => ({ label: value, value }))}
        />
      </div>
      <div className={tw("control-label")}>
        <span>Accessory</span>
        <Dropdown
          label="Accessory"
          value={accessory}
          onChange={(value) =>
            setAccessory(value as (typeof accessories)[number])
          }
          options={accessories.map((value) => ({ label: value, value }))}
        />
      </div>
      <div className={tw("control-label")}>
        <span>Bubble</span>
        <Dropdown
          label="Bubble"
          value={bubblePosition}
          onChange={(value) =>
            setBubblePosition(value as (typeof bubblePositions)[number])
          }
          options={bubblePositions.map((value) => ({ label: value, value }))}
        />
      </div>
      <div className={tw("control-label")}>
        <span>Size ({size}px)</span>
        <input
          aria-label="Mascot size"
          max={280}
          min={120}
          onChange={(event) => setSize(Number(event.target.value))}
          type="range"
          value={size}
        />
      </div>
      <PlayToggle
        checked={ears}
        detail="Pods on the helmet"
        label="Ears"
        onChange={setEars}
      />
      <PlayToggle
        checked={topCap}
        detail="Band across the visor"
        label="Top cap"
        onChange={setTopCap}
      />
      <PlayToggle
        checked={chest}
        detail="Collar glyph"
        label="Chest"
        onChange={setChest}
      />
      <PlayToggle
        checked={arms}
        detail="Wing pieces"
        label="Wings"
        onChange={setArms}
      />
      <PlayToggle
        checked={base}
        detail="Platform ring"
        label="Base"
        onChange={setBase}
      />
      <PlayToggle
        checked={follow}
        detail="Eyes track the pointer"
        label="Follow pointer"
        onChange={setFollow}
      />
      <PlayToggle
        checked={autoBlink}
        detail="Periodic blink loop"
        label="Auto blink"
        onChange={setAutoBlink}
      />
      <PlayToggle
        checked={autoWave}
        detail="Idle wave on a timer"
        label="Auto wave"
        onChange={setAutoWave}
      />
      <PlayToggle
        checked={reduced}
        detail="Force the quiet pose"
        label="Reduced motion"
        onChange={setReduced}
      />
      <PlayToggle
        checked={muted}
        detail="Ignore say() and emit bubbles"
        label="Mute"
        onChange={(value) => {
          setMuted(value);
          instanceRef.current?.mute(value);
        }}
      />
      <div className={tw("mascot-play-actions")}>
        {events.map((name) => (
          <button key={name} onClick={() => emit(name)} type="button">
            {name}
          </button>
        ))}
        <button onClick={() => instanceRef.current?.wave()} type="button">
          wave
        </button>
        <button onClick={() => instanceRef.current?.blink(true)} type="button">
          blink
        </button>
        <button
          onClick={() =>
            instanceRef.current?.say({
              title: "Olá",
              text: "Eu sou o mascote.",
              emoji: "👋",
            })
          }
          type="button"
        >
          say
        </button>
        <button
          onClick={() => {
            const target = lookRef.current;
            if (target) instanceRef.current?.lookAt(target);
          }}
          ref={lookRef}
          type="button"
        >
          lookAt
        </button>
        <button
          onClick={() => instanceRef.current?.lookAt(null)}
          type="button"
        >
          look pointer
        </button>
      </div>
      <ol aria-label="Mascot output events" className={tw("mascot-play-log")}>
        {log.length ? (
          log.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)
        ) : (
          <li>No output yet</li>
        )}
      </ol>
    </>
  );
}

export function MascotPlaygroundStage({
  playground,
}: {
  playground: MascotPlaygroundState;
}) {
  const { attach, bubblePosition, options, theme } = playground;

  return (
    <div className={tw("mascot-play-stage")}>
      <Mascot
        aria-label="Playground mascot"
        key={bubblePosition}
        onReady={attach}
        options={options}
      />
      <div className={tw("mascot-play-avatars")} aria-label="Mascot avatars">
        <MascotAvatar mood="happy" size={36} theme={theme} />
        <MascotAvatar mood="loading" size={36} theme={theme} />
        <MascotAvatar mood="error" size={36} theme={theme} />
      </div>
    </div>
  );
}

export function WidgetMascotPreview({ size = 136 }: { size?: number }) {
  return (
    <Mascot
      aria-label="Mascot widget preview"
      options={{
        theme: "aurora",
        size,
        a11y: { label: "Mascot widget preview" },
        behavior: {
          autoWave: false,
          autoBlink: true,
          followPointer: false,
          idleLook: false,
          reducedMotion: "off",
        },
      }}
    />
  );
}
