import type { SpeechContent } from "./types";

export type BubbleOptions = {
  position: "top" | "left" | "right";
  durationMs: number;
  announce: boolean;
};

export function defaultBubbleOptions(
  bubble: boolean | { position?: "top" | "left" | "right"; durationMs?: number } | undefined,
  announce: boolean,
): BubbleOptions | null {
  if (bubble === false) return null;
  const config = typeof bubble === "object" ? bubble : {};
  return {
    position: config.position ?? "top",
    durationMs: config.durationMs ?? 3200,
    announce,
  };
}

export function createBubbleElement(options: BubbleOptions): HTMLDivElement {
  const root = document.createElement("div");
  root.className = `wk-mascot__bubble wk-mascot__bubble--${options.position}`;
  root.hidden = true;
  if (options.announce) {
    root.setAttribute("role", "status");
    root.setAttribute("aria-live", "polite");
  } else {
    root.setAttribute("aria-hidden", "true");
  }

  const inner = document.createElement("div");
  inner.className = "wk-mascot__bubble-inner";
  const title = document.createElement("strong");
  title.className = "wk-mascot__bubble-title";
  const text = document.createElement("span");
  text.className = "wk-mascot__bubble-text";
  const emoji = document.createElement("span");
  emoji.className = "wk-mascot__bubble-emoji";
  inner.append(emoji, title, text);
  root.append(inner);
  return root;
}

export function renderSpeech(root: HTMLDivElement, content: SpeechContent): void {
  const title = root.querySelector(".wk-mascot__bubble-title");
  const text = root.querySelector(".wk-mascot__bubble-text");
  const emoji = root.querySelector(".wk-mascot__bubble-emoji");
  if (title instanceof HTMLElement) {
    title.textContent = content.title ?? "";
    title.hidden = !content.title;
  }
  if (text instanceof HTMLElement) {
    text.textContent = content.text ?? "";
    text.hidden = !content.text;
  }
  if (emoji instanceof HTMLElement) {
    emoji.textContent = content.emoji ?? "";
    emoji.hidden = !content.emoji;
  }
}

export function parseSpeech(
  content: string | { title?: string; text?: string; emoji?: string },
): SpeechContent {
  if (typeof content === "string") return { text: content };
  return {
    title: content.title,
    text: content.text,
    emoji: content.emoji,
  };
}
