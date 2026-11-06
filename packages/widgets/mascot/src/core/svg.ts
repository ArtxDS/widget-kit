import {
  EYE_KEYS,
  FX_KEYS,
  MOUTH_KEYS,
  accessoryMarkup,
  eyePairMarkup,
  fxMarkup,
  id,
  mouthMarkup,
  ref,
} from "./eyes";
import type { MascotParts } from "./types";

export const DEFAULT_PARTS: Required<
  Omit<MascotParts, "chest" | "accessory">
> & {
  chest: NonNullable<MascotParts["chest"]>;
  accessory: NonNullable<MascotParts["accessory"]>;
} = {
  ears: "pods",
  topCap: "band",
  chest: "collar",
  accessory: "none",
  base: "platform",
  arms: "wings",
};

function stop(
  offset: string,
  cssVar: string,
  fallback: string,
  extra = "",
): string {
  return `<stop offset="${offset}" style="stop-color: var(${cssVar}, ${fallback})" ${extra}/>`;
}

function wing(prefix: string): string {
  return `
    <path d="M0 -10C20 -8 26 28 16 62C10 80 -8 80 -12 62C-18 30 -16 -8 0 -10Z" fill="${ref(prefix, "pH")}" stroke="var(--mascot-shell-edge, #6d4fc0)" stroke-opacity=".18"/>
    <path d="M-1 0C12 2 14 28 9 52C6 62 -4 62 -6 52C-9 28 -9 2 -1 0Z" transform="translate(-4 4)" fill="${ref(prefix, "sh")}"/>`;
}

function visibility(show: boolean): string {
  return show ? "" : ' display="none"';
}

export function buildMascotSvg(
  prefix: string,
  parts: MascotParts = {},
): string {
  const ears = parts.ears ?? DEFAULT_PARTS.ears;
  const topCap = parts.topCap ?? DEFAULT_PARTS.topCap;
  const chest = parts.chest ?? DEFAULT_PARTS.chest;
  const accessory = parts.accessory ?? DEFAULT_PARTS.accessory;
  const base = parts.base ?? DEFAULT_PARTS.base;
  const arms = parts.arms ?? DEFAULT_PARTS.arms;
  const chestSlot = typeof chest === "object" ? chest.svg : null;
  const accessorySlot =
    accessory === "none" ? "" : accessoryMarkup(prefix, accessory);

  const eyes = EYE_KEYS.map(
    (key) =>
      `<g data-eyes="${key}"${visibility(key === "led")}>${eyePairMarkup(prefix, key)}</g>`,
  ).join("");

  const mouths = MOUTH_KEYS.map(
    (key) =>
      `<g data-mouth="${key}" transform="translate(200 160)"${visibility(key === "omega")}>${mouthMarkup(key)}</g>`,
  ).join("");

  const fx = FX_KEYS.map(
    (key) => `<g data-fx="${key}" display="none">${fxMarkup(prefix, key)}</g>`,
  ).join("");

  const logo =
    chestSlot ??
    `<g transform="translate(222 322) scale(.5) translate(-160 -246)" fill="${ref(prefix, "bar")}"><path d="M143 232H181L176 239H138Z"/><path d="M138 243H176L181 250H143Z"/><path d="M143 254H181L176 261H138Z"/></g>`;

  return `
<svg class="wk-mascot__svg" viewBox="0 0 400 430" xmlns="http://www.w3.org/2000/svg" tabindex="-1" focusable="false">
  <defs>
    <radialGradient id="${id(prefix, "pe")}" cx=".36" cy=".26" r=".9">
      ${stop("0", "--mascot-shell-1", "#fff")}
      ${stop(".55", "--mascot-shell-2", "#f2effb")}
      ${stop("1", "--mascot-shell-3", "#c0b8e2")}
    </radialGradient>
    <linearGradient id="${id(prefix, "pH")}" x1="0" y1="0" x2="1" y2="0">
      ${stop("0", "--mascot-shell-3", "#c9c2e6")}
      ${stop(".4", "--mascot-shell-1", "#fff")}
      ${stop("1", "--mascot-shell-3", "#cfc8ea")}
    </linearGradient>
    <linearGradient id="${id(prefix, "shade")}" x1="0" y1="0" x2="0" y2="1">
      <stop offset=".5" style="stop-color: var(--mascot-shadow, #2a1668)" stop-opacity="0"/>
      <stop offset="1" style="stop-color: var(--mascot-shadow, #2a1668)" stop-opacity=".28"/>
    </linearGradient>
    <linearGradient id="${id(prefix, "sh")}" x1="0" y1="0" x2="1" y2="1">
      ${stop("0", "--mascot-accent-a", "#9945FF")}
      ${stop(".5", "--mascot-accent-mid", "#5E8DF2")}
      ${stop("1", "--mascot-accent-b", "#14F195")}
    </linearGradient>
    <linearGradient id="${id(prefix, "bar")}" x1="0" y1="0" x2="1" y2="0">
      ${stop("0", "--mascot-accent-a", "#9945FF")}
      ${stop("1", "--mascot-accent-b", "#14F195")}
    </linearGradient>
    <linearGradient id="${id(prefix, "base")}" x1="0" y1="0" x2="0" y2="1">
      ${stop("0", "--mascot-base-1", "#fff")}
      ${stop("1", "--mascot-base-2", "#d9d3ee")}
    </linearGradient>
    <radialGradient id="${id(prefix, "scr")}" cx=".5" cy=".4" r=".7">
      ${stop("0", "--mascot-screen-1", "#14102a")}
      ${stop("1", "--mascot-screen-2", "#020106")}
    </radialGradient>
    <linearGradient id="${id(prefix, "glare")}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".22"/>
      <stop offset=".36" stop-color="#fff" stop-opacity=".05"/>
      <stop offset=".37" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="${id(prefix, "eg")}" x1="0" y1="0" x2="0" y2="1">
      ${stop("0", "--mascot-eye-from", "#14F195")}
      ${stop("1", "--mascot-eye-to", "#00C2FF")}
    </linearGradient>
    <linearGradient id="${id(prefix, "neck")}" x1="0" y1="0" x2="1" y2="0">
      ${stop("0", "--mascot-neck-1", "#6a5fa0")}
      ${stop(".4", "--mascot-neck-2", "#a79fd0")}
      ${stop("1", "--mascot-neck-3", "#5a4f90")}
    </linearGradient>
    <filter id="${id(prefix, "b4")}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="5"/></filter>
    <filter id="${id(prefix, "b2")}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2.2"/></filter>
    <path id="${id(prefix, "bodyP")}" d="M200 224C250 224 276 262 280 312C284 360 252 392 200 392C148 392 116 360 120 312C124 262 150 224 200 224Z"/>
    <clipPath id="${id(prefix, "bodyC")}"><path d="M200 224C250 224 276 262 280 312C284 360 252 392 200 392C148 392 116 360 120 312C124 262 150 224 200 224Z"/></clipPath>
    <g id="${id(prefix, "logo")}"><path d="M143 232H181L176 239H138Z"/><path d="M138 243H176L181 250H143Z"/><path d="M143 254H181L176 261H138Z"/></g>
  </defs>

  <g data-part="base"${visibility(base === "platform")}>
    <ellipse cx="200" cy="406" rx="152" ry="26" fill="var(--mascot-shell-3, #bdb4dd)"/>
    <ellipse cx="200" cy="398" rx="152" ry="26" fill="${ref(prefix, "base")}"/>
    <ellipse cx="200" cy="398" rx="120" ry="19" fill="none" stroke="${ref(prefix, "bar")}" stroke-width="2.5" opacity=".55"/>
    <ellipse cx="200" cy="392" rx="84" ry="11" fill="var(--mascot-shadow, #3c1e78)" opacity=".35" filter="${ref(prefix, "b4")}"/>
  </g>

  <g data-node="body">
    <g data-part="arms"${visibility(arms === "wings")}>
      <g data-node="armLw" transform="translate(400 0) scale(-1 1)">
        <g data-node="armL" transform="translate(268 268) rotate(-18)">${wing(prefix)}</g>
      </g>
      <g data-node="armR" transform="translate(268 268) rotate(-18)">${wing(prefix)}</g>
    </g>
    <path d="M200 224C250 224 276 262 280 312C284 360 252 392 200 392C148 392 116 360 120 312C124 262 150 224 200 224Z" fill="${ref(prefix, "pe")}"/>
    <path d="M200 224C250 224 276 262 280 312C284 360 252 392 200 392C148 392 116 360 120 312C124 262 150 224 200 224Z" fill="${ref(prefix, "shade")}"/>
    <g data-part="chest"${visibility(chest !== "none")} clip-path="${ref(prefix, "bodyC")}">
      <path d="M110 210H290V252Q262 262 232 262Q214 262 208 276Q204 300 182 302Q160 302 160 278Q158 264 140 262Q124 258 110 252Z" fill="${ref(prefix, "sh")}"/>
      <path d="M110 250Q140 262 160 266Q190 252 225 268Q256 262 290 250V256Q256 268 228 272Q208 262 180 274Q150 270 110 256Z" fill="#fff" opacity=".28"/>
      <ellipse cx="152" cy="308" rx="11" ry="46" fill="#fff" opacity=".75" filter="${ref(prefix, "b2")}" transform="rotate(8 152 308)"/>
    </g>
    <path d="M200 224C250 224 276 262 280 312C284 360 252 392 200 392C148 392 116 360 120 312C124 262 150 224 200 224Z" fill="none" stroke="var(--mascot-shell-edge, #6d4fc0)" stroke-opacity=".16"/>
    <g data-node="chest-glyph"${visibility(chest !== "none")}>${logo}</g>
    <circle cx="178" cy="336" r="3" fill="#2a2347"/>
  </g>

  <g data-node="head">
    <rect x="168" y="204" width="64" height="28" rx="10" fill="${ref(prefix, "neck")}"/>
    <g data-part="ears"${visibility(ears === "pods")}>
      <rect x="86" y="104" width="38" height="72" rx="19" fill="${ref(prefix, "pH")}" stroke="var(--mascot-shell-edge, #6d4fc0)" stroke-opacity=".18"/>
      <rect x="96" y="116" width="18" height="48" rx="9" fill="var(--mascot-accent-a, #9945FF)" opacity=".85"/>
      <rect x="276" y="104" width="38" height="72" rx="19" fill="${ref(prefix, "pH")}" stroke="var(--mascot-shell-edge, #6d4fc0)" stroke-opacity=".18"/>
      <rect x="286" y="116" width="18" height="48" rx="9" fill="var(--mascot-accent-b, #14F195)" opacity=".85"/>
    </g>
    <rect x="102" y="40" width="196" height="176" rx="84" fill="${ref(prefix, "pe")}"/>
    <rect x="102" y="40" width="196" height="176" rx="84" fill="${ref(prefix, "shade")}"/>
    <path data-part="topCap"${visibility(topCap === "band")} d="M146 58Q200 30 254 58L246 70Q200 48 154 70Z" fill="${ref(prefix, "sh")}"/>
    <ellipse cx="150" cy="82" rx="30" ry="10" fill="#fff" opacity=".85" filter="${ref(prefix, "b2")}" transform="rotate(-28 150 82)"/>
    <rect x="102.5" y="40.5" width="195" height="175" rx="83.5" fill="none" stroke="var(--mascot-shell-edge, #6d4fc0)" stroke-opacity=".16"/>
    <g data-node="accessory"${visibility(accessory !== "none")}>${accessorySlot}</g>
    <rect x="120" y="70" width="160" height="124" rx="52" fill="${ref(prefix, "scr")}" stroke="#0c0918" stroke-width="3"/>
    <g data-node="face">${eyes}${mouths}</g>
    <rect x="120" y="70" width="160" height="124" rx="52" fill="${ref(prefix, "glare")}" pointer-events="none"/>
    ${fx}
  </g>
</svg>`.trim();
}

export function buildAvatarSvg(
  prefix: string,
  eyes: string,
  mouth: string,
): string {
  return `
<svg class="wk-mascot-avatar__svg" viewBox="90 28 220 210" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <defs>
    <radialGradient id="${id(prefix, "pe")}" cx=".36" cy=".26" r=".9">
      ${stop("0", "--mascot-shell-1", "#fff")}
      ${stop(".55", "--mascot-shell-2", "#f2effb")}
      ${stop("1", "--mascot-shell-3", "#c0b8e2")}
    </radialGradient>
    <linearGradient id="${id(prefix, "shade")}" x1="0" y1="0" x2="0" y2="1">
      <stop offset=".5" style="stop-color: var(--mascot-shadow, #2a1668)" stop-opacity="0"/>
      <stop offset="1" style="stop-color: var(--mascot-shadow, #2a1668)" stop-opacity=".28"/>
    </linearGradient>
    <linearGradient id="${id(prefix, "sh")}" x1="0" y1="0" x2="1" y2="1">
      ${stop("0", "--mascot-accent-a", "#9945FF")}
      ${stop(".5", "--mascot-accent-mid", "#5E8DF2")}
      ${stop("1", "--mascot-accent-b", "#14F195")}
    </linearGradient>
    <radialGradient id="${id(prefix, "scr")}" cx=".5" cy=".4" r=".7">
      ${stop("0", "--mascot-screen-1", "#14102a")}
      ${stop("1", "--mascot-screen-2", "#020106")}
    </radialGradient>
    <linearGradient id="${id(prefix, "glare")}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".22"/>
      <stop offset=".36" stop-color="#fff" stop-opacity=".05"/>
      <stop offset=".37" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="${id(prefix, "eg")}" x1="0" y1="0" x2="0" y2="1">
      ${stop("0", "--mascot-eye-from", "#14F195")}
      ${stop("1", "--mascot-eye-to", "#00C2FF")}
    </linearGradient>
    <linearGradient id="${id(prefix, "pH")}" x1="0" y1="0" x2="1" y2="0">
      ${stop("0", "--mascot-shell-3", "#c9c2e6")}
      ${stop(".4", "--mascot-shell-1", "#fff")}
      ${stop("1", "--mascot-shell-3", "#cfc8ea")}
    </linearGradient>
    <linearGradient id="${id(prefix, "neck")}" x1="0" y1="0" x2="1" y2="0">
      ${stop("0", "--mascot-neck-1", "#6a5fa0")}
      ${stop(".4", "--mascot-neck-2", "#a79fd0")}
      ${stop("1", "--mascot-neck-3", "#5a4f90")}
    </linearGradient>
    <filter id="${id(prefix, "b4")}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="5"/></filter>
    <filter id="${id(prefix, "b2")}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2.2"/></filter>
  </defs>
  <rect x="168" y="204" width="64" height="28" rx="10" fill="${ref(prefix, "neck")}"/>
  <rect x="86" y="104" width="38" height="72" rx="19" fill="${ref(prefix, "pH")}" stroke="var(--mascot-shell-edge, #6d4fc0)" stroke-opacity=".18"/>
  <rect x="96" y="116" width="18" height="48" rx="9" fill="var(--mascot-accent-a, #9945FF)" opacity=".85"/>
  <rect x="276" y="104" width="38" height="72" rx="19" fill="${ref(prefix, "pH")}" stroke="var(--mascot-shell-edge, #6d4fc0)" stroke-opacity=".18"/>
  <rect x="286" y="116" width="18" height="48" rx="9" fill="var(--mascot-accent-b, #14F195)" opacity=".85"/>
  <rect x="102" y="40" width="196" height="176" rx="84" fill="${ref(prefix, "pe")}"/>
  <rect x="102" y="40" width="196" height="176" rx="84" fill="${ref(prefix, "shade")}"/>
  <path d="M146 58Q200 30 254 58L246 70Q200 48 154 70Z" fill="${ref(prefix, "sh")}"/>
  <ellipse cx="150" cy="82" rx="30" ry="10" fill="#fff" opacity=".85" filter="${ref(prefix, "b2")}" transform="rotate(-28 150 82)"/>
  <rect x="102.5" y="40.5" width="195" height="175" rx="83.5" fill="none" stroke="var(--mascot-shell-edge, #6d4fc0)" stroke-opacity=".16"/>
  <rect x="120" y="70" width="160" height="124" rx="52" fill="${ref(prefix, "scr")}" stroke="#0c0918" stroke-width="3"/>
  <g class="wk-mascot-avatar__face" data-eyes="${eyes}" data-mouth="${mouth}">
    ${eyePairMarkup(prefix, (EYE_KEYS.includes(eyes as (typeof EYE_KEYS)[number]) ? eyes : "led") as (typeof EYE_KEYS)[number])}
    <g transform="translate(200 160)">${mouthMarkup((MOUTH_KEYS.includes(mouth as (typeof MOUTH_KEYS)[number]) ? mouth : "omega") as (typeof MOUTH_KEYS)[number])}</g>
  </g>
  <rect x="120" y="70" width="160" height="124" rx="52" fill="${ref(prefix, "glare")}"/>
</svg>`.trim();
}
