import { createMascot } from "../core/createMascot";
import { isThemePreset } from "../presets";
import type {
  LookTarget,
  MascotInstance,
  MascotOptions,
  ThemePreset,
} from "../core/types";

const TAG = "mascot-bot";

export function defineMascotElement(tag = TAG): CustomElementConstructor {
  if (typeof customElements === "undefined") {
    throw new Error("Custom Elements are not available in this environment.");
  }
  const existing = customElements.get(tag);
  if (existing) return existing;

  class MascotBotElement extends HTMLElement {
    #instance: MascotInstance | null = null;
    #options: MascotOptions = {};
    #unsubs: Array<() => void> = [];

    static get observedAttributes(): string[] {
      return ["theme", "mood", "size", "muted"];
    }

    get options(): MascotOptions {
      return this.#options;
    }

    set options(value: MascotOptions) {
      this.#options = { ...this.#options, ...value };
      this.#instance?.setOptions(this.#options);
    }

    connectedCallback(): void {
      if (this.#instance) return;
      this.#instance = createMascot(this, this.#mergedOptions());
      this.#bindOutput();
      const mood = this.getAttribute("mood");
      if (mood) this.#instance.setMood(mood);
      if (this.hasAttribute("muted")) this.#instance.mute(true);
    }

    disconnectedCallback(): void {
      this.#unsubs.forEach((off) => off());
      this.#unsubs = [];
      this.#instance?.destroy();
      this.#instance = null;
    }

    attributeChangedCallback(
      name: string,
      _prev: string | null,
      next: string | null,
    ): void {
      if (!this.#instance) return;
      if (name === "theme" && next && isThemePreset(next)) {
        this.#instance.setTheme(next);
      }
      if (name === "mood" && next) this.#instance.setMood(next);
      if (name === "size" && next) this.#instance.setOptions({ size: next });
      if (name === "muted") this.#instance.mute(this.hasAttribute("muted"));
    }

    emit(event: string, payload?: unknown): void {
      this.#instance?.emit(event, payload);
    }

    lookAt(target: LookTarget): void {
      this.#instance?.lookAt(target);
    }

    say(
      content: string | { title?: string; text?: string },
      opts?: { durationMs?: number | null },
    ): void {
      this.#instance?.say(content, opts);
    }

    #mergedOptions(): MascotOptions {
      const themeAttr = this.getAttribute("theme");
      const sizeAttr = this.getAttribute("size");
      return {
        ...this.#options,
        theme:
          themeAttr && isThemePreset(themeAttr)
            ? (themeAttr as ThemePreset)
            : this.#options.theme,
        size: sizeAttr ?? this.#options.size,
      };
    }

    #bindOutput(): void {
      if (!this.#instance) return;
      const events = [
        "poke",
        "pet",
        "click",
        "wake",
        "sleep",
        "moodchange",
        "speech",
        "waveend",
      ] as const;
      for (const type of events) {
        this.#unsubs.push(
          this.#instance.on(type, (detail) => {
            this.dispatchEvent(
              new CustomEvent(`mascot:${type}`, { detail, bubbles: true }),
            );
          }),
        );
      }
    }
  }

  customElements.define(tag, MascotBotElement);
  return MascotBotElement;
}
