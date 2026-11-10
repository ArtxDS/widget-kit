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
import { Pipette } from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { ChoiceControl } from "../../shared/choice-group";

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

const accentAPresets = [
  { label: "Aurora", color: themePresets.aurora.accentA },
  { label: "Ocean", color: themePresets.ocean.accentA },
  { label: "Sunset", color: themePresets.sunset.accentA },
];

const accentBPresets = [
  { label: "Aurora", color: themePresets.aurora.accentB },
  { label: "Ocean", color: themePresets.ocean.accentB },
  { label: "Sunset", color: themePresets.sunset.accentB },
];

function normalizeHexColor(value: string) {
  const digits = value.trim().replace(/^#/, "");
  if (/^[\da-f]{3}$/i.test(digits)) {
    return `#${digits
      .split("")
      .map((digit) => `${digit}${digit}`)
      .join("")}`.toUpperCase();
  }
  return /^[\da-f]{6}$/i.test(digits) ? `#${digits}`.toUpperCase() : null;
}

function hexToRgb(value: string): [number, number, number] {
  const hex = normalizeHexColor(value) ?? "#9945FF";
  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ];
}

function rgbToHsl([red, green, blue]: [number, number, number]) {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const maximum = Math.max(r, g, b);
  const minimum = Math.min(r, g, b);
  const difference = maximum - minimum;
  const lightness = (maximum + minimum) / 2;
  let hue = 0;
  let saturation = 0;

  if (difference) {
    saturation = difference / (1 - Math.abs(2 * lightness - 1));
    if (maximum === r) hue = ((g - b) / difference) % 6;
    else if (maximum === g) hue = (b - r) / difference + 2;
    else hue = (r - g) / difference + 4;
    hue = (hue * 60 + 360) % 360;
  }

  return { hue, saturation, lightness };
}

function hslToRgb(hue: number, saturation: number, lightness: number) {
  const normalizedHue = ((hue % 360) + 360) % 360;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const segment = normalizedHue / 60;
  const secondary = chroma * (1 - Math.abs((segment % 2) - 1));
  const match = lightness - chroma / 2;
  let rgb: [number, number, number];

  if (segment < 1) rgb = [chroma, secondary, 0];
  else if (segment < 2) rgb = [secondary, chroma, 0];
  else if (segment < 3) rgb = [0, chroma, secondary];
  else if (segment < 4) rgb = [0, secondary, chroma];
  else if (segment < 5) rgb = [secondary, 0, chroma];
  else rgb = [chroma, 0, secondary];

  return rgb.map((channel) => Math.round((channel + match) * 255)) as [
    number,
    number,
    number,
  ];
}

function rgbToHex([red, green, blue]: [number, number, number]) {
  return `#${[red, green, blue]
    .map((channel) => Math.round(channel).toString(16).padStart(2, "0"))
    .join("")}`.toUpperCase();
}

function colorFromWheel(hue: number, intensity: number) {
  const base = hslToRgb(hue, 1, 0.5);
  return rgbToHex(
    base.map((channel) => 255 + (channel - 255) * intensity) as [
      number,
      number,
      number,
    ],
  );
}

function wheelPositionFromColor(value: string) {
  const rgb = hexToRgb(value);
  const hsl = rgbToHsl(rgb);
  return {
    hue: hsl.hue,
    intensity: hsl.saturation < 0.04 ? 0 : 1 - Math.min(...rgb) / 255,
  };
}

function AccentColorControl({
  label,
  onChange,
  presets,
  value,
}: {
  label: string;
  onChange: (color: string) => void;
  presets: { label: string; color: string }[];
  value: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [hexDraft, setHexDraft] = useState(value.toUpperCase());
  const [previousValue, setPreviousValue] = useState(value);
  const rootRef = useRef<HTMLDivElement>(null);
  const hexColor = normalizeHexColor(value) ?? "#9945FF";
  const wheelPoint = wheelPositionFromColor(hexColor);
  const wheelAngle = ((wheelPoint.hue - 90) * Math.PI) / 180;
  const wheelLeft = 50 + Math.cos(wheelAngle) * wheelPoint.intensity * 42;
  const wheelTop = 50 + Math.sin(wheelAngle) * wheelPoint.intensity * 42;
  const pickerId =
    label === "Accent A" ? "accent-a-color-picker" : "accent-b-color-picker";

  if (value !== previousValue) {
    setPreviousValue(value);
    setHexDraft(value.toUpperCase());
  }

  useEffect(() => {
    if (!isOpen) return;

    function closeOnOutsidePointer(event: globalThis.PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  function selectWheelColor(event: ReactPointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const deltaX = event.clientX - (bounds.left + bounds.width / 2);
    const deltaY = event.clientY - (bounds.top + bounds.height / 2);
    const maxRadius = Math.max(
      1,
      Math.min(bounds.width, bounds.height) / 2 - 7,
    );
    const intensity = Math.min(Math.hypot(deltaX, deltaY) / maxRadius, 1);
    const hue = ((Math.atan2(deltaY, deltaX) * 180) / Math.PI + 90 + 360) % 360;
    onChange(colorFromWheel(hue, intensity));
  }

  function adjustWheelWithKeyboard(event: ReactKeyboardEvent<HTMLDivElement>) {
    const keyChanges: Record<string, [number, number]> = {
      ArrowUp: [0, 0.05],
      ArrowDown: [0, -0.05],
      ArrowRight: [5, 0],
      ArrowLeft: [-5, 0],
    };
    const change = keyChanges[event.key];
    if (!change) return;
    event.preventDefault();
    const nextHue = (wheelPoint.hue + change[0] + 360) % 360;
    const nextIntensity = Math.min(
      1,
      Math.max(0, wheelPoint.intensity + change[1]),
    );
    onChange(colorFromWheel(nextHue, nextIntensity));
  }

  return (
    <div
      className={`mascot-token-row accent-color-control flex items-center justify-between gap-2.5 mt-3 text-[11.5px] text-[#9596a7]${isOpen ? " has-open-picker" : ""}`}
      ref={rootRef}
    >
      <span>{label}</span>
      <div
        className="accent-color-swatches"
        role="group"
        aria-label={`${label} color presets`}
      >
        {presets.map((preset) => {
          const selected =
            hexColor.toLowerCase() === preset.color.toLowerCase();
          return (
            <button
              aria-label={`${label}: ${preset.label} (${preset.color})`}
              aria-pressed={selected}
              className={`accent-color-swatch${selected ? " is-active" : ""}`}
              key={preset.label}
              onClick={() => {
                onChange(preset.color);
                setIsOpen(false);
              }}
              style={{ backgroundColor: preset.color }}
              title={`${preset.label} ${preset.color}`}
              type="button"
            />
          );
        })}
        <button
          aria-controls={pickerId}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          aria-label={`Choose a custom color for ${label}`}
          className={`accent-picker-trigger${isOpen ? " is-open" : ""}`}
          onClick={() => setIsOpen((open) => !open)}
          title="Custom color"
          type="button"
        >
          <Pipette aria-hidden="true" size={13} strokeWidth={1.8} />
        </button>
      </div>
      {isOpen && (
        <div
          className="accent-picker-popover"
          id={pickerId}
          role="dialog"
          aria-label={`Custom ${label} color`}
        >
          <div className="accent-picker-heading">
            <span>Custom color</span>
            <button
              aria-label="Close color picker"
              className="accent-picker-close"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              ×
            </button>
          </div>
          <div
            aria-label={`${label} color wheel. Use arrow keys to adjust hue and intensity.`}
            aria-valuemax={360}
            aria-valuemin={0}
            aria-valuenow={Math.round(wheelPoint.hue)}
            aria-valuetext={hexColor}
            className="accent-picker-wheel"
            onKeyDown={adjustWheelWithKeyboard}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              selectWheelColor(event);
            }}
            onPointerMove={(event) => {
              if (event.buttons === 1) selectWheelColor(event);
            }}
            role="slider"
            tabIndex={0}
          >
            <span
              aria-hidden="true"
              className="accent-picker-wheel-dot"
              style={{ left: `${wheelLeft}%`, top: `${wheelTop}%` }}
            />
          </div>
          <label className="accent-picker-hex">
            <span>HEX</span>
            <input
              aria-label={`${label} hex color`}
              autoCapitalize="characters"
              maxLength={7}
              onBlur={() => setHexDraft(value.toUpperCase())}
              onChange={(event) => {
                const draft = event.target.value;
                setHexDraft(draft);
                const normalized = normalizeHexColor(draft);
                if (normalized) onChange(normalized);
              }}
              placeholder="#9945FF"
              spellCheck={false}
              value={hexDraft}
            />
          </label>
        </div>
      )}
    </div>
  );
}

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
    <div
      className={`control-toggle
        flex
        items-center
        justify-between
        gap-3
        mt-4
        p-[12px_14px]
        [border:1px_solid_#262736]
        rounded-[10px]
        [background:#151620]
        [&>span]:flex
        [&>span]:flex-col
        [&>span]:gap-0.5
        [&_strong]:text-[12.5px]
        [&_strong]:font-semibold
        [&_small]:text-[#8a8b9e]
        [&_small]:text-[11px]
      `}
    >
      <span>
        <strong>{label}</strong>
        <small>{detail}</small>
      </span>
      <button
        aria-checked={checked}
        aria-label={label}
        className={
          `dashboard-toggle${checked ? " is-checked" : ""}` +
          `
        relative
        w-9.5
        h-5.75
        flex-[0_0_auto]
        p-0.75
        [border:1px_solid_#4a4b5a]
        rounded-xl
        [background:#242532]
        cursor-pointer
        [transition:background_0.16s,border-color_0.16s]
        [&>span]:block
        [&>span]:size-3.75
        
        [&>span]:rounded-[50%]
        [&>span]:[background:#d9dae5]
        [&>span]:[transition:transform_0.16s,background_0.16s]
        [&.is-checked]:border-[#9258e4]
        [&.is-checked]:[background:#763bc2]
        [&.is-checked>span]:transform-[translateX(15px)]
        [&.is-checked>span]:[background:white]
      `
        }
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
  const [accessory, setAccessory] =
    useState<(typeof accessories)[number]>("none");
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

  function reset() {
    const defaults = themePresets.aurora;
    setTheme("aurora");
    setMood("idle");
    setEars(true);
    setTopCap(true);
    setChest(true);
    setArms(true);
    setBase(true);
    setAccessory("none");
    setReduced(false);
    setFollow(true);
    setAutoBlink(true);
    setAutoWave(false);
    setMuted(false);
    setBubblePosition("top");
    setSize(220);
    setAccentA(defaults.accentA);
    setAccentB(defaults.accentB);
    setEyeFrom(defaults.eyeFrom);
    setLog([]);
    instanceRef.current?.setTheme("aurora");
    instanceRef.current?.setMood("idle");
    instanceRef.current?.mute(false);
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
    reset,
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
      <div
        className={`control-label
        flex
        flex-col
        gap-2
        mt-4
        text-[#cfd0de]
        text-[12px]
        font-semibold
        [&_.dropdown]:w-full
        [&_textarea]:resize-y
        [&_textarea]:min-h-30
        [&_textarea]:max-h-60
        [&_textarea]:overflow-y-auto
        [&_textarea]:p-3
        [&_textarea]:[border:1px_solid_#343544]
        [&_textarea]:rounded-lg
        [&_textarea]:text-[#f2f1f8]
        [&_textarea]:[background:#111219]
        [&_textarea]:text-[12.5px]
        [&_textarea]:leading-[1.6]
        [&_textarea:focus-visible]:border-[#9865d2]
        [&_textarea::placeholder]:text-[#7b7d90]
      `}
      >
        <span>Theme preset</span>
        <ChoiceControl
          label="Theme preset"
          value={theme}
          onChange={(value) => applyPreset(value as ThemePreset)}
          options={["aurora", "ocean", "sunset", "mono"].map((value) => ({
            label: value,
            value,
          }))}
        />
      </div>
      <AccentColorControl
        label="Accent A"
        onChange={setAccentA}
        presets={accentAPresets}
        value={accentA}
      />
      <AccentColorControl
        label="Accent B"
        onChange={setAccentB}
        presets={accentBPresets}
        value={accentB}
      />
      <div
        className={`mascot-token-row
        flex
        items-center
        justify-between
        gap-2.5
        mt-3
        text-[11.5px]
        text-[#9596a7]
        [&_input]:w-8
        [&_input]:h-6
        [&_input]:p-0
        [&_input]:[border:0]
        [&_input]:[background:transparent]
      `}
      >
        <span>Eye color</span>
        <input
          aria-label="Eye color"
          type="color"
          value={eyeFrom}
          onChange={(event) => setEyeFrom(event.target.value)}
        />
      </div>
      <div
        className={`control-label
        flex
        flex-col
        gap-2
        mt-4
        text-[#cfd0de]
        text-[12px]
        font-semibold
        [&_.dropdown]:w-full
        [&_textarea]:resize-y
        [&_textarea]:min-h-30
        [&_textarea]:max-h-60
        [&_textarea]:overflow-y-auto
        [&_textarea]:p-3
        [&_textarea]:[border:1px_solid_#343544]
        [&_textarea]:rounded-lg
        [&_textarea]:text-[#f2f1f8]
        [&_textarea]:[background:#111219]
        [&_textarea]:text-[12.5px]
        [&_textarea]:leading-[1.6]
        [&_textarea:focus-visible]:border-[#9865d2]
        [&_textarea::placeholder]:text-[#7b7d90]
      `}
      >
        <span>Mood</span>
        <ChoiceControl
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
      <div
        className={`control-label
        flex
        flex-col
        gap-2
        mt-4
        text-[#cfd0de]
        text-[12px]
        font-semibold
        [&_.dropdown]:w-full
        [&_textarea]:resize-y
        [&_textarea]:min-h-30
        [&_textarea]:max-h-60
        [&_textarea]:overflow-y-auto
        [&_textarea]:p-3
        [&_textarea]:[border:1px_solid_#343544]
        [&_textarea]:rounded-lg
        [&_textarea]:text-[#f2f1f8]
        [&_textarea]:[background:#111219]
        [&_textarea]:text-[12.5px]
        [&_textarea]:leading-[1.6]
        [&_textarea:focus-visible]:border-[#9865d2]
        [&_textarea::placeholder]:text-[#7b7d90]
      `}
      >
        <span>Accessory</span>
        <ChoiceControl
          label="Accessory"
          value={accessory}
          onChange={(value) =>
            setAccessory(value as (typeof accessories)[number])
          }
          options={accessories.map((value) => ({ label: value, value }))}
        />
      </div>
      <div
        className={`control-label
        flex
        flex-col
        gap-2
        mt-4
        text-[#cfd0de]
        text-[12px]
        font-semibold
        [&_.dropdown]:w-full
        [&_textarea]:resize-y
        [&_textarea]:min-h-30
        [&_textarea]:max-h-60
        [&_textarea]:overflow-y-auto
        [&_textarea]:p-3
        [&_textarea]:[border:1px_solid_#343544]
        [&_textarea]:rounded-lg
        [&_textarea]:text-[#f2f1f8]
        [&_textarea]:[background:#111219]
        [&_textarea]:text-[12.5px]
        [&_textarea]:leading-[1.6]
        [&_textarea:focus-visible]:border-[#9865d2]
        [&_textarea::placeholder]:text-[#7b7d90]
      `}
      >
        <span>Bubble</span>
        <ChoiceControl
          label="Bubble"
          value={bubblePosition}
          onChange={(value) =>
            setBubblePosition(value as (typeof bubblePositions)[number])
          }
          options={bubblePositions.map((value) => ({ label: value, value }))}
        />
      </div>
      <div
        className={`control-label
        flex
        flex-col
        gap-2
        mt-4
        text-[#cfd0de]
        text-[12px]
        font-semibold
        [&_.dropdown]:w-full
        [&_textarea]:resize-y
        [&_textarea]:min-h-30
        [&_textarea]:max-h-60
        [&_textarea]:overflow-y-auto
        [&_textarea]:p-3
        [&_textarea]:[border:1px_solid_#343544]
        [&_textarea]:rounded-lg
        [&_textarea]:text-[#f2f1f8]
        [&_textarea]:[background:#111219]
        [&_textarea]:text-[12.5px]
        [&_textarea]:leading-[1.6]
        [&_textarea:focus-visible]:border-[#9865d2]
        [&_textarea::placeholder]:text-[#7b7d90]
      `}
      >
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
      <div
        className={`mascot-play-actions
        flex
        flex-wrap
        gap-2
        mt-2.5
        [&_button]:min-h-8.5
        [&_button]:p-[0_12px]
        [&_button]:[border:1px_solid_#2c2d3a]
        [&_button]:rounded-lg
        [&_button]:text-[#dad9e7]
        [&_button]:[background:#15161f]
        [&_button]:text-[11.5px]
        [&_button]:font-[550]
        [&_button]:cursor-pointer
        [&_button:hover]:border-[#53436a]
        [&_button:hover]:[background:#1c1d28]
      `}
      >
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
        <button onClick={() => instanceRef.current?.lookAt(null)} type="button">
          look pointer
        </button>
      </div>
      <ol
        aria-label="Mascot output events"
        className={`mascot-play-log
        max-h-40
        overflow-auto
        m-[10px_0_0]
        p-3
        [border:1px_solid_#292a37]
        rounded-[9px]
        [background:#0b0c11]
        text-[#c0c1d2]
        [font:11.5px/1.6_ui-monospace,SFMono-Regular,Menlo,monospace]
        [&_li]:m-0
      `}
      >
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
    <div
      className={
        "mascot-play-stage flex flex-col items-center justify-center p-[36px_16px_16px] min-h-90"
      }
    >
      <Mascot
        aria-label="Playground mascot"
        key={bubblePosition}
        onReady={attach}
        options={options}
      />
      <div
        className={
          "mascot-play-avatars flex gap-2.5 justify-center mt-3"
        }
        aria-label="Mascot avatars"
      >
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
      style={{ width: size }}
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
