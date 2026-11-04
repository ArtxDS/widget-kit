import type { EyeKey, MouthKey, MoodFx } from "./types";

export function id(prefix: string, name: string): string {
  return `${prefix}-${name}`;
}

export function ref(prefix: string, name: string): string {
  return `url(#${id(prefix, name)})`;
}

export const EYE_KEYS: EyeKey[] = [
  "led",
  "happy",
  "dots",
  "lines",
  "sad",
  "x",
  "wide",
  "half",
  "lookdown",
];

export const MOUTH_KEYS: MouthKey[] = [
  "omega",
  "omega-big",
  "flat",
  "down",
  "wavy",
  "o",
  "pout",
];

export const FX_KEYS: Exclude<MoodFx, null>[] = [
  "confetti",
  "zzz",
  "question",
  "exclaim",
];

function ledEye(
  prefix: string,
  variant: "led" | "happy" | "wide" | "half" | "lookdown",
): string {
  const lidY =
    variant === "happy" ? "18" : variant === "half" ? "28" : "48";
  const pupilY = variant === "lookdown" ? "4" : "-10";
  const scale = variant === "wide" ? "1.15" : "1";
  const mask = id(prefix, `mk-${variant}`);
  const lid = id(prefix, `lid-${variant}`);
  return `
    <mask id="${mask}" maskUnits="userSpaceOnUse" x="-50" y="-50" width="100" height="100">
      <rect x="-50" y="-50" width="100" height="100" fill="#fff"/>
      <ellipse id="${lid}" cx="0" cy="${lidY}" rx="34" ry="24" fill="#000"/>
    </mask>
    <ellipse rx="22" ry="26" fill="var(--mascot-eye-from, #14F195)" opacity=".55" filter="${ref(prefix, "b4")}" transform="scale(${scale})"/>
    <g mask="${ref(prefix, `mk-${variant}`)}" transform="scale(${scale})">
      <ellipse rx="18" ry="22" fill="${ref(prefix, "eg")}"/>
      <ellipse cx="-5" cy="${pupilY}" rx="6" ry="3.6" fill="#fff" opacity=".6"/>
    </g>`;
}

export function eyePairMarkup(prefix: string, key: EyeKey): string {
  if (key === "dots") {
    return `
      <g class="wk-mascot-dots" transform="translate(200 128)">
        <circle class="wk-mascot-dot" cx="-16" cy="0" r="5" fill="var(--mascot-eye-from, #14F195)"/>
        <circle class="wk-mascot-dot" cx="0" cy="0" r="5" fill="var(--mascot-eye-from, #14F195)"/>
        <circle class="wk-mascot-dot" cx="16" cy="0" r="5" fill="var(--mascot-eye-from, #14F195)"/>
      </g>`;
  }
  if (key === "lines") {
    return `
      <g fill="none" stroke="var(--mascot-eye-from, #14F195)" stroke-width="4" stroke-linecap="round">
        <line x1="152" y1="128" x2="184" y2="128"/>
        <line x1="216" y1="128" x2="248" y2="128"/>
      </g>`;
  }
  if (key === "sad") {
    return `
      <g fill="none" stroke="var(--mascot-eye-from, #14F195)" stroke-width="3.4" stroke-linecap="round">
        <path d="M152 136Q168 118 184 136"/>
        <path d="M216 136Q232 118 248 136"/>
      </g>`;
  }
  if (key === "x") {
    return `
      <g fill="none" stroke="var(--mascot-eye-from, #14F195)" stroke-width="3.4" stroke-linecap="round">
        <path d="M156 116L180 140M180 116L156 140"/>
        <path d="M220 116L244 140M244 116L220 140"/>
      </g>`;
  }

  const left = `<g class="wk-mascot-eye wk-mascot-eye--l" data-x="168" data-y="128">${ledEye(prefix, key)}</g>`;
  const right = `<g class="wk-mascot-eye wk-mascot-eye--r" data-x="232" data-y="128">${ledEye(prefix, key)}</g>`;
  return left + right;
}

export function mouthMarkup(key: MouthKey): string {
  const stroke = 'fill="none" stroke="var(--mascot-eye-from, #14F195)" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"';
  switch (key) {
    case "omega":
      return `<path ${stroke} d="M-14 0Q-7 11 0 2Q7 11 14 0"/>`;
    case "omega-big":
      return `<path ${stroke} d="M-18 0Q-9 16 0 3Q9 16 18 0"/>`;
    case "flat":
      return `<path ${stroke} d="M-12 0H12"/>`;
    case "down":
      return `<path ${stroke} d="M-14 8Q-7 -2 0 6Q7 -2 14 8"/>`;
    case "wavy":
      return `<path ${stroke} d="M-16 0Q-8 8 0 0Q8 -8 16 0"/>`;
    case "o":
      return `<ellipse cx="0" cy="2" rx="8" ry="9" fill="none" stroke="var(--mascot-eye-from, #14F195)" stroke-width="3.2"/>`;
    case "pout":
      return `<path ${stroke} d="M-8 2Q0 10 8 2"/>`;
  }
}

export function fxMarkup(_prefix: string, key: Exclude<MoodFx, null>): string {
  if (key === "confetti") {
    return `
      <g class="wk-mascot-fx-confetti">
        <circle cx="120" cy="48" r="4" fill="var(--mascot-accent-a, #9945FF)"/>
        <rect x="268" y="56" width="7" height="7" rx="1.5" fill="var(--mascot-accent-b, #14F195)" transform="rotate(18 271 59)"/>
        <circle cx="90" cy="90" r="3.2" fill="var(--mascot-accent-mid, #5E8DF2)"/>
        <rect x="300" y="92" width="6" height="6" rx="1" fill="var(--mascot-eye-to, #00C2FF)" transform="rotate(-22 303 95)"/>
        <circle cx="310" cy="40" r="3.5" fill="var(--mascot-accent-a, #9945FF)"/>
      </g>`;
  }
  if (key === "zzz") {
    return `<g fill="var(--mascot-accent-mid, #5E8DF2)" font-family="ui-rounded, system-ui, sans-serif" font-weight="700">
      <text x="268" y="64" font-size="16">z</text>
      <text x="286" y="46" font-size="20">z</text>
      <text x="308" y="28" font-size="24">z</text>
    </g>`;
  }
  if (key === "question") {
    return `<text x="300" y="58" font-size="28" font-weight="700" fill="var(--mascot-accent-a, #9945FF)">?</text>`;
  }
  return `<text x="300" y="58" font-size="28" font-weight="700" fill="var(--mascot-accent-b, #14F195)">!</text>`;
}

export function accessoryMarkup(
  prefix: string,
  kind: "glasses" | "cap" | "headphones" | { svg: string },
): string {
  if (typeof kind === "object") return kind.svg;
  if (kind === "glasses") {
    return `
      <g fill="none" stroke="var(--mascot-accent-a, #9945FF)" stroke-width="4">
        <rect x="132" y="108" width="52" height="36" rx="12"/>
        <rect x="216" y="108" width="52" height="36" rx="12"/>
        <path d="M184 126H216"/>
      </g>`;
  }
  if (kind === "cap") {
    return `
      <g>
        <ellipse cx="200" cy="48" rx="78" ry="16" fill="var(--mascot-accent-a, #9945FF)"/>
        <path d="M122 48Q200 8 278 48L262 62Q200 28 138 62Z" fill="var(--mascot-accent-mid, #5E8DF2)"/>
      </g>`;
  }
  return `
    <g>
      <rect x="78" y="96" width="22" height="52" rx="11" fill="var(--mascot-accent-a, #9945FF)"/>
      <rect x="300" y="96" width="22" height="52" rx="11" fill="var(--mascot-accent-b, #14F195)"/>
      <path d="M89 96Q200 48 311 96" fill="none" stroke="var(--mascot-shell-edge, #6d4fc0)" stroke-width="6"/>
    </g>`;
}
