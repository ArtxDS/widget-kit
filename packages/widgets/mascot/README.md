# Mascot

Animated egg-shaped robot mascot. The core is framework-agnostic (SVG + `requestAnimationFrame`). React and the `<mascot-bot>` custom element are thin wrappers.

The widget has **no business logic**. Host apps inject events, copy, and callbacks.

## Install / import

```tsx
import {
  Mascot,
  MascotProvider,
  useMascot,
  MascotAvatar,
  SpeechBubble,
  createMascot,
  defineMascotElement,
} from "@artxds/widget-kit";
import "@artxds/widget-kit/styles";
```

### React / Next.js (App Router)

```tsx
"use client";
import { Mascot } from "@artxds/widget-kit";

export function Guide() {
  return (
    <Mascot
      options={{ theme: "aurora", size: 220 }}
      onReady={(mascot) => mascot.say("Hi!")}
    />
  );
}
```

`createMascot` only runs in `useEffect`. `emit` is a no-op without a provider, when muted, or off the client.

### Vanilla JS

```ts
import { createMascot } from "@artxds/widget-kit";
const mascot = createMascot(document.querySelector("#bot")!, {
  theme: "ocean",
});
mascot.emit("ui:success");
```

### Web Component

```ts
import { defineMascotElement } from "@artxds/widget-kit";
defineMascotElement();
```

```html
<mascot-bot theme="aurora" mood="idle" size="220"></mascot-bot>
```

Output events are dispatched as `mascot:moodchange`, `mascot:poke`, and so on.

## Options

| Option | Notes |
| --- | --- |
| `theme` | `'aurora' \| 'ocean' \| 'sunset' \| 'mono'` or partial tokens |
| `parts` | `ears`, `topCap`, `chest`, `accessory`, `base`, `arms` — chest/accessory accept `{ svg }` |
| `size` | Width; height follows the SVG viewBox |
| `moods` | Merge/override serializable mood defs |
| `eventMap` | `'domain:action'` → `{ mood, wave, bubble, resolves }` |
| `messages` | Map or function from event name to bubble text |
| `behavior` | Pointer follow, idle look, blink/wave intervals, sleep, reduced motion |
| `bubble` | `false` or `{ position, durationMs }` |
| `a11y` | `decorative` (default), or `label` + `announce` |

Generic events work with no config: `ui:success`, `ui:error`, `ui:loading`, `ui:idle`, `ui:celebrate`. Unknown events are ignored.

## Tokens

`--mascot-accent-a`, `--mascot-accent-mid`, `--mascot-accent-b`, `--mascot-eye-from`, `--mascot-eye-to`, `--mascot-shell-1/2/3`, `--mascot-shell-edge`, `--mascot-screen-1/2`, `--mascot-neck-1/2/3`, `--mascot-base-1/2`, `--mascot-shadow`, `--mascot-bubble-bg/fg/border-a/border-b`.

## Custom moods

```ts
mascot.setOptions({
  moods: {
    thinking: {
      eyes: "half",
      mouth: "flat",
      fx: "question",
      priority: 45,
      durationMs: 2000,
    },
  },
});
```

## Accessibility and SSR

- Decorative by default (`aria-hidden`, `tabindex="-1"`).
- Set `a11y.label` for `role="img"` and `a11y.announce` for `aria-live` on the bubble.
- Respects `prefers-reduced-motion` (`behavior.reducedMotion: 'auto'`).
- Importing the module does not touch `window` / `document`.

## Recipes

**Async action:** `emit('ui:loading')` then `emit('ui:success')` or `emit('ui:error')`. Success/error resolve `loading`.

**Form focus:** `lookAt(input)` on focus, `lookAt(null)` on blur.

**Onboarding:** `onReady={(m) => m.say({ title: 'Hey', text: 'I am here if you need me.' })}`.

**Toggle off:** `mute(true)` or unmount `<Mascot />`.
