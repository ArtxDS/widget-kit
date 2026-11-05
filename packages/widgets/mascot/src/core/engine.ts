import type { EngineMoodSnapshot, LookTarget, ResolvedBehavior } from "./types";

export type EngineRefs = {
  root: HTMLElement;
  svg: SVGSVGElement;
  head: SVGGElement;
  body: SVGGElement;
  armR: SVGGElement | null;
  armL: SVGGElement | null;
  face: SVGGElement;
};

type EyeNode = {
  g: SVGGElement;
  x: number;
  y: number;
  ox: number;
  oy: number;
};

const WAVE_MS = 2800;
const BLINK_MS = 170;
const IDLE_LOOK_MS = 6000;
const PET_MS = 1500;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function ease(t: number): number {
  return t * t * (3 - 2 * t);
}

function lerp(current: number, target: number, amount: number): number {
  return current + (target - current) * amount;
}

export function createEngine(
  refs: EngineRefs,
  behavior: () => ResolvedBehavior,
  mood: () => EngineMoodSnapshot,
  reduced: () => boolean,
  onWaveEnd: () => void,
) {
  const look = { nx: 0, ny: 0 };
  const pointer = { x: 0, y: 0, t: 0, has: false };
  let lookTarget: LookTarget = null;
  let blinkAt = -1;
  let waveAt = -1;
  let happy = 0;
  let raf = 0;
  let running = false;
  const eyes: EyeNode[] = [];
  const timers = new Set<number>();

  function collectEyes(): void {
    eyes.length = 0;
    const visible = refs.face.querySelectorAll<SVGGElement>(
      '[data-eyes]:not([display="none"]) .wk-mascot-eye',
    );
    visible.forEach((g) => {
      eyes.push({
        g,
        x: Number(g.dataset.x ?? "0"),
        y: Number(g.dataset.y ?? "0"),
        ox: 0,
        oy: 0,
      });
    });
  }

  function pointerPoint(event: PointerEvent): void {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.t = performance.now();
    pointer.has = true;
  }

  function blink(double = false): void {
    blinkAt = performance.now();
    if (double) {
      const id = window.setTimeout(() => {
        timers.delete(id);
        blinkAt = performance.now();
      }, BLINK_MS + 110);
      timers.add(id);
    }
  }

  function wave(): void {
    if (waveAt < 0) waveAt = performance.now();
  }

  function lookAt(target: LookTarget): void {
    lookTarget = target;
  }

  function headHovering(now: number): boolean {
    if (!pointer.has || now - pointer.t > 80) return false;
    const rect = refs.svg.getBoundingClientRect();
    const k = rect.width / 400;
    const x = pointer.x - rect.left;
    const y = pointer.y - rect.top;
    return x > 102 * k && x < 298 * k && y > 40 * k && y < 216 * k;
  }

  let petStarted = -1;
  function petProgress(now: number): boolean {
    if (!headHovering(now)) {
      petStarted = -1;
      return false;
    }
    if (petStarted < 0) petStarted = now;
    return now - petStarted >= PET_MS;
  }

  function resetPet(): void {
    petStarted = -1;
  }

  function frame(now: number): void {
    if (!running) return;
    const reduce = reduced();
    const snap = mood();
    const def = snap.def;
    const opts = behavior();
    const rect = refs.svg.getBoundingClientRect();
    const k = rect.width / 400;
    const vw = window.innerWidth || 1;
    const vh = window.innerHeight || 1;

    let mx = pointer.x;
    let my = pointer.y;
    if (lookTarget instanceof HTMLElement) {
      const box = lookTarget.getBoundingClientRect();
      mx = box.left + box.width / 2;
      my = box.top + box.height / 2;
    } else if (lookTarget && "x" in lookTarget) {
      mx = lookTarget.x;
      my = lookTarget.y;
    } else if (
      !opts.followPointer ||
      !pointer.has ||
      (opts.idleLook && now - pointer.t > IDLE_LOOK_MS)
    ) {
      if (opts.idleLook && !reduce) {
        mx = vw / 2 + Math.sin(now / 1700) * vw * 0.3;
        my = vh / 2 + Math.cos(now / 2300) * vh * 0.2;
      } else {
        mx = rect.left + 200 * k;
        my = rect.top + 130 * k;
      }
    }

    const cx = rect.left + 200 * k;
    const cy = rect.top + 130 * k;
    const dx = mx - cx;
    const dy = my - cy;
    const dist = Math.hypot(dx, dy) || 1;
    const m = Math.min(1, dist / 220);
    const tnx = clamp(dx / (vw * 0.35), -1, 1);
    look.nx = lerp(look.nx, reduce ? 0 : tnx, 0.08);

    const tilt = def.headTilt ?? 0;
    const drop = def.headDrop ?? 0;
    const dizzy = snap.id === "dizzy" && !reduce ? Math.sin(now / 70) * 8 : 0;
    const celebrateJump =
      snap.id === "celebrate" && !reduce ? Math.abs(Math.sin(now / 180)) * -10 : 0;
    const hr = look.nx * (reduce ? 0 : 5) + happy * 4 + tilt + dizzy;
    const tx = look.nx * (reduce ? 0 : 4);
    refs.head.setAttribute(
      "transform",
      `translate(${tx.toFixed(2)} ${drop + celebrateJump}) rotate(${hr.toFixed(2)} 200 214)`,
    );

    if (eyes.length === 0) collectEyes();
    let blinkScale = 1;
    if (blinkAt > 0) {
      const p = (now - blinkAt) / BLINK_MS;
      if (p >= 1) blinkAt = -1;
      else blinkScale = 1 - 0.92 * Math.sin(Math.PI * p);
    }
    const eyeScale = def.eyeScale ?? 1;
    const tX = reduce ? 0 : (dx / dist) * 14 * m;
    const tY = reduce ? 0 : (dy / dist) * 9 * m;
    let ox = 0;
    let oy = 0;
    eyes.forEach((eye) => {
      eye.ox = lerp(eye.ox, tX, 0.18);
      eye.oy = lerp(eye.oy, tY, 0.18);
      ox = eye.ox;
      oy = eye.oy;
      eye.g.setAttribute(
        "transform",
        `translate(${(eye.x + eye.ox).toFixed(2)} ${(eye.y + eye.oy).toFixed(2)}) scale(${eyeScale} ${(blinkScale * eyeScale).toFixed(3)})`,
      );
    });

    const mouthScale = def.mouth === "omega-big" || happy > 0.4 ? 1 + 0.3 * happy : 1;
    refs.face.querySelectorAll<SVGGElement>("[data-mouth]").forEach((node) => {
      if (node.getAttribute("display") === "none") return;
      node.setAttribute(
        "transform",
        `translate(${(200 + ox * 0.4).toFixed(2)} ${(160 + oy * 0.4).toFixed(2)}) scale(${mouthScale.toFixed(3)})`,
      );
    });

    const breath = reduce ? 1 : 1 + Math.sin(now / (snap.id === "sleeping" ? 1400 : 760)) * 0.009;
    refs.body.setAttribute(
      "transform",
      `translate(200 392) scale(1 ${breath.toFixed(4)}) translate(-200 -392)`,
    );

    let ang = -18;
    let leftAng = -18 + (reduce ? 0 : Math.sin(now / 900) * 2);
    let lift = 0;
    const pose = def.arms ?? "rest";
    if (pose === "raise-right" || pose === "both-up") {
      lift = 1;
      const sway = reduce ? 0 : Math.sin(now / 220) * 8;
      ang = -18 + -132 + sway;
      if (pose === "both-up") leftAng = ang;
    }
    if (waveAt > 0 || pose === "wave-right") {
      if (waveAt < 0) waveAt = now;
      const t = (now - waveAt) / WAVE_MS;
      if (t >= 1) {
        waveAt = -1;
        onWaveEnd();
      } else {
        lift = t < 0.15 ? ease(t / 0.15) : t > 0.85 ? ease((1 - t) / 0.15) : 1;
        ang = -18 + (-132 + Math.sin(((t * WAVE_MS) / 1000) * Math.PI * 2 * 2.4) * 14) * lift;
      }
    }
    happy = lerp(happy, lift, 0.12);
    refs.armR?.setAttribute("transform", `translate(268 268) rotate(${ang.toFixed(2)})`);
    refs.armL?.setAttribute("transform", `translate(268 268) rotate(${leftAng.toFixed(2)})`);

    const dots = refs.face.querySelectorAll<SVGCircleElement>(".wk-mascot-dot");
    if (dots.length && !reduce) {
      dots.forEach((dot, index) => {
        const pulse = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(now / 220 + index * 1.2));
        dot.setAttribute("opacity", pulse.toFixed(2));
      });
    }

    raf = requestAnimationFrame(frame);
  }

  function start(): void {
    if (running) return;
    running = true;
    collectEyes();
    pointer.x = window.innerWidth / 2;
    pointer.y = window.innerHeight / 2;
    pointer.t = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function stop(): void {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    for (const id of timers) window.clearTimeout(id);
    timers.clear();
  }

  return {
    start,
    stop,
    blink,
    wave,
    lookAt,
    pointerPoint,
    collectEyes,
    petProgress,
    resetPet,
    WAVE_MS,
  };
}
