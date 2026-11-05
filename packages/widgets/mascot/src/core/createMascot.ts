import {
  createBubbleElement,
  defaultBubbleOptions,
  parseSpeech,
  renderSpeech,
} from "./bubble";
import { createEngine } from "./engine";
import { createEventBus, resolveMessage, resolveReaction } from "./eventBus";
import { mergeMoods } from "./moods";
import {
  activeMood,
  applyMood,
  createMoodMachine,
  isSleepMood,
  resolveNamed,
  type MoodMachine,
} from "./state";
import { buildMascotSvg, DEFAULT_PARTS } from "./svg";
import { sanitizeSvg } from "./sanitize";
import { applyThemeVars, resolveTheme } from "./theme";
import type {
  LookTarget,
  MascotInstance,
  MascotOptions,
  MascotParts,
  MoodDef,
  ResolvedBehavior,
  SpeechContent,
  ThemePreset,
  ThemeTokens,
} from "./types";

let instanceCount = 0;

function nextPrefix(explicit?: string): string {
  instanceCount += 1;
  if (explicit) return explicit.replace(/[^a-zA-Z0-9_-]/g, "");
  return `m${instanceCount}`;
}

function sizeToCss(size?: number | string): string {
  if (size === undefined) return "220px";
  return typeof size === "number" ? `${size}px` : size;
}

function resolveBehavior(
  behavior: MascotOptions["behavior"],
): ResolvedBehavior {
  const blink = behavior?.autoBlink;
  const wave = behavior?.autoWave;
  return {
    followPointer: behavior?.followPointer ?? true,
    idleLook: behavior?.idleLook ?? true,
    autoBlink:
      blink === false
        ? false
        : {
            minMs: typeof blink === "object" ? blink.minMs : 2000,
            maxMs: typeof blink === "object" ? blink.maxMs : 5800,
          },
    autoWave:
      wave === false
        ? false
        : {
            minMs: typeof wave === "object" ? wave.minMs : 9000,
            maxMs: typeof wave === "object" ? wave.maxMs : 16000,
            onMount: typeof wave === "object" ? (wave.onMount ?? true) : true,
          },
    sleepAfterMs: behavior?.sleepAfterMs ?? false,
    reducedMotion: behavior?.reducedMotion ?? "auto",
  };
}

function qs<T extends Element>(root: ParentNode, selector: string): T | null {
  return root.querySelector(selector);
}

function setDisplay(root: ParentNode, selector: string, show: boolean): void {
  root.querySelectorAll(selector).forEach((node) => {
    if (show) node.removeAttribute("display");
    else node.setAttribute("display", "none");
  });
}

function applyA11y(svg: SVGSVGElement, options: MascotOptions): void {
  const decorative = options.a11y?.decorative !== false && !options.a11y?.label;
  svg.setAttribute("tabindex", "-1");
  svg.setAttribute("focusable", "false");
  if (decorative) {
    svg.setAttribute("aria-hidden", "true");
    svg.removeAttribute("role");
    svg.removeAttribute("aria-label");
  } else {
    svg.removeAttribute("aria-hidden");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", options.a11y?.label ?? "Animated mascot");
  }
}

function applyParts(svg: SVGSVGElement, parts: MascotParts): void {
  const ears = parts.ears ?? DEFAULT_PARTS.ears;
  const topCap = parts.topCap ?? DEFAULT_PARTS.topCap;
  const chest = parts.chest ?? DEFAULT_PARTS.chest;
  const accessory = parts.accessory ?? DEFAULT_PARTS.accessory;
  const base = parts.base ?? DEFAULT_PARTS.base;
  const arms = parts.arms ?? DEFAULT_PARTS.arms;
  setDisplay(svg, '[data-part="ears"]', ears === "pods");
  setDisplay(svg, '[data-part="topCap"]', topCap === "band");
  setDisplay(svg, '[data-part="chest"]', chest !== "none");
  setDisplay(svg, '[data-node="chest-glyph"]', chest !== "none");
  setDisplay(svg, '[data-part="base"]', base === "platform");
  setDisplay(svg, '[data-part="arms"]', arms === "wings");
  setDisplay(svg, '[data-node="accessory"]', accessory !== "none");
}

function applyExpression(svg: SVGSVGElement, def: MoodDef): void {
  svg.querySelectorAll("[data-eyes]").forEach((node) => {
    node.setAttribute(
      "display",
      node.getAttribute("data-eyes") === def.eyes ? "" : "none",
    );
    if (node.getAttribute("data-eyes") === def.eyes)
      node.removeAttribute("display");
    else node.setAttribute("display", "none");
  });
  svg.querySelectorAll("[data-mouth]").forEach((node) => {
    if (node.getAttribute("data-mouth") === def.mouth)
      node.removeAttribute("display");
    else node.setAttribute("display", "none");
  });
  svg.querySelectorAll("[data-fx]").forEach((node) => {
    if (def.fx && node.getAttribute("data-fx") === def.fx)
      node.removeAttribute("display");
    else node.setAttribute("display", "none");
  });
}

export function createMascot(
  container: HTMLElement,
  options: MascotOptions = {},
): MascotInstance {
  if (typeof document === "undefined") {
    throw new Error("createMascot can only run in the browser.");
  }

  const prefix = nextPrefix(options.idPrefix);
  let opts: MascotOptions = { ...options };
  let tokens: ThemeTokens = resolveTheme(opts.theme);
  let moods = mergeMoods(opts.moods);
  let behavior = resolveBehavior(opts.behavior);
  let machine: MoodMachine = createMoodMachine("idle");
  let muted = false;
  let destroyed = false;
  const timers = new Set<number>();
  const clicks: number[] = [];
  const bus = createEventBus();
  let currentMood = "idle";

  const root = document.createElement("div");
  root.className = "wk-mascot";
  root.dataset.mascot = prefix;
  root.style.width = sizeToCss(opts.size);
  applyThemeVars(root, tokens);
  root.innerHTML = sanitizeSvg(buildMascotSvg(prefix, opts.parts));
  container.appendChild(root);

  const svg = qs<SVGSVGElement>(root, "svg");
  const head = qs<SVGGElement>(root, '[data-node="head"]');
  const body = qs<SVGGElement>(root, '[data-node="body"]');
  const face = qs<SVGGElement>(root, '[data-node="face"]');
  if (!svg || !head || !body || !face) {
    throw new Error("Mascot SVG failed to mount.");
  }
  applyA11y(svg, opts);
  applyParts(svg, opts.parts ?? {});
  applyExpression(svg, moods.idle);

  const bubbleOpts = defaultBubbleOptions(
    opts.bubble,
    Boolean(opts.a11y?.announce),
  );
  const bubble = bubbleOpts ? createBubbleElement(bubbleOpts) : null;
  if (bubble) root.appendChild(bubble);

  const reducedQuery =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : null;

  function reducedNow(): boolean {
    if (behavior.reducedMotion === "on") return true;
    if (behavior.reducedMotion === "off") return false;
    return Boolean(reducedQuery?.matches);
  }

  function moodSnapshot() {
    const id = activeMood(machine, performance.now());
    return { id, def: moods[id] ?? moods.idle };
  }

  function later(fn: () => void, ms: number): number {
    const id = window.setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
    return id;
  }

  function clearTimers(): void {
    for (const id of timers) window.clearTimeout(id);
    timers.clear();
  }

  function hideBubble(): void {
    if (bubble) bubble.hidden = true;
  }

  function showSpeech(
    content: SpeechContent,
    durationMs?: number | null,
  ): void {
    if (!bubble || muted) return;
    renderSpeech(bubble, content);
    bubble.hidden = false;
    bus.emitOut("speech", content);
    if (durationMs === null) return;
    const ms = durationMs ?? bubbleOpts?.durationMs ?? 3200;
    later(hideBubble, ms);
  }

  let sleepTimer = 0;

  function scheduleSleep(): void {
    if (sleepTimer) {
      window.clearTimeout(sleepTimer);
      timers.delete(sleepTimer);
      sleepTimer = 0;
    }
    if (!behavior.sleepAfterMs) return;
    sleepTimer = later(() => {
      setMoodInternal("sleepy");
      later(() => {
        if (activeMood(machine, performance.now()) === "sleepy") {
          setMoodInternal("sleeping");
        }
      }, 4000);
    }, behavior.sleepAfterMs);
  }

  const engine = createEngine(
    {
      root,
      svg,
      head,
      body,
      armR: qs<SVGGElement>(root, '[data-node="armR"]'),
      armL: qs<SVGGElement>(root, '[data-node="armL"]'),
      face,
    },
    () => behavior,
    moodSnapshot,
    reducedNow,
    () => bus.emitOut("waveend", {}),
  );

  function setMoodInternal(
    mood: string,
    duration?: number | null,
    emitChange = true,
  ): void {
    const def = moods[mood];
    if (!def) return;
    const previous = currentMood;
    const now = performance.now();
    machine = applyMood(machine, mood, def, now, duration);
    const next = activeMood(machine, now);
    if (next !== previous) {
      currentMood = next;
      applyExpression(svg!, moods[next] ?? def);
      engine.collectEyes();
      if (emitChange) bus.emitOut("moodchange", { mood: next, previous });
      if (next === "sleepy" || next === "sleeping") {
        bus.emitOut("sleep", { mood: next });
      }
      if (moods[next]?.arms === "wave-right") engine.wave();
    } else {
      currentMood = next;
      applyExpression(svg!, moods[next] ?? def);
      engine.collectEyes();
    }
  }

  function wakeIfSleeping(): void {
    const now = performance.now();
    const id = activeMood(machine, now);
    if (!isSleepMood(id)) return;
    machine = { base: "idle", transient: null };
    const previous = currentMood;
    currentMood = "idle";
    applyExpression(svg!, moods.idle);
    engine.collectEyes();
    engine.blink(true);
    bus.emitOut("wake", { from: id });
    bus.emitOut("moodchange", { mood: "idle", previous });
  }

  function onPointerMove(event: PointerEvent): void {
    engine.pointerPoint(event);
    wakeIfSleeping();
    scheduleSleep();
    if (engine.petProgress(performance.now())) {
      engine.resetPet();
      setMoodInternal("happy");
      bus.emitOut("pet", {});
    }
  }

  function onKey(): void {
    wakeIfSleeping();
    scheduleSleep();
  }

  function onClick(event: MouseEvent): void {
    const now = performance.now();
    clicks.push(now);
    while (clicks.length && now - clicks[0] > 900) clicks.shift();
    if (clicks.length >= 4) {
      setMoodInternal("dizzy");
      bus.emitOut("poke", { count: clicks.length });
      clicks.length = 0;
      return;
    }
    engine.wave();
    bus.emitOut("click", { x: event.clientX, y: event.clientY });
  }

  function onVisibility(): void {
    if (document.hidden) engine.stop();
    else engine.start();
  }

  function onReducedChange(): void {
    applyExpression(svg!, moods[currentMood] ?? moods.idle);
    if (reducedNow()) {
      root.querySelectorAll("[data-fx]").forEach((node) => {
        const fx = node.getAttribute("data-fx");
        if (fx === "confetti") node.setAttribute("display", "none");
      });
    }
  }

  function scheduleBlinkLoop(): void {
    if (!behavior.autoBlink) return;
    const span = behavior.autoBlink.maxMs - behavior.autoBlink.minMs;
    later(
      () => {
        engine.blink(Math.random() < 0.25);
        scheduleBlinkLoop();
      },
      behavior.autoBlink.minMs + Math.random() * span,
    );
  }

  function scheduleWaveLoop(): void {
    if (!behavior.autoWave) return;
    const span = behavior.autoWave.maxMs - behavior.autoWave.minMs;
    later(
      () => {
        engine.wave();
        scheduleWaveLoop();
      },
      behavior.autoWave.minMs + Math.random() * span,
    );
  }

  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("keydown", onKey);
  svg.addEventListener("click", onClick);
  document.addEventListener("visibilitychange", onVisibility);
  reducedQuery?.addEventListener("change", onReducedChange);

  engine.start();
  scheduleBlinkLoop();
  scheduleWaveLoop();
  scheduleSleep();
  if (behavior.autoWave && behavior.autoWave.onMount) {
    later(() => engine.wave(), 1200);
  }

  const instance: MascotInstance = {
    emit(event, payload) {
      if (destroyed || muted) return;
      const reaction = resolveReaction(event, opts.eventMap);
      if (!reaction) return;
      if (reaction.resolves?.length) {
        machine = resolveNamed(machine, reaction.resolves, performance.now());
      }
      if (reaction.mood) {
        setMoodInternal(reaction.mood, reaction.durationMs);
      }
      if (reaction.wave) engine.wave();
      const text = resolveMessage(event, payload, opts.messages, reaction);
      if (text) showSpeech({ text });
    },
    setMood(mood, moodOpts) {
      if (destroyed) return;
      setMoodInternal(mood, moodOpts?.durationMs);
    },
    lookAt(target: LookTarget) {
      if (destroyed) return;
      engine.lookAt(target);
    },
    wave() {
      if (destroyed) return;
      engine.wave();
    },
    blink(double) {
      if (destroyed) return;
      engine.blink(double);
    },
    say(content, sayOpts) {
      if (destroyed || muted) return;
      showSpeech(parseSpeech(content), sayOpts?.durationMs);
    },
    on: bus.on,
    off: bus.off,
    setTheme(theme: ThemePreset | Partial<ThemeTokens>) {
      if (destroyed) return;
      tokens = resolveTheme(theme, tokens);
      applyThemeVars(root, tokens);
    },
    setOptions(partial) {
      if (destroyed) return;
      opts = {
        ...opts,
        ...partial,
        parts: { ...opts.parts, ...partial.parts },
      };
      if (partial.theme) {
        tokens = resolveTheme(partial.theme, tokens);
        applyThemeVars(root, tokens);
      }
      if (partial.moods) moods = mergeMoods(partial.moods);
      if (partial.behavior) behavior = resolveBehavior({ ...opts.behavior });
      if (partial.size !== undefined)
        root.style.width = sizeToCss(partial.size);
      if (partial.parts) applyParts(svg, opts.parts ?? {});
      if (partial.a11y) applyA11y(svg, opts);
    },
    mute(value) {
      muted = value;
      if (muted) hideBubble();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      engine.stop();
      clearTimers();
      bus.clear();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("keydown", onKey);
      svg.removeEventListener("click", onClick);
      document.removeEventListener("visibilitychange", onVisibility);
      reducedQuery?.removeEventListener("change", onReducedChange);
      root.remove();
    },
  };

  return instance;
}

export function resetMascotIdCounter(): void {
  instanceCount = 0;
}
