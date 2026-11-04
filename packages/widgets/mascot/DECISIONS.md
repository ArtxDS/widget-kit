# Mascot decisions

- The widget lives in `packages/widgets/mascot` because this repo is a single package (`@artxds/widget-kit`), not a nested package named `mascot/`.
- Tokens stay namespaced as `--mascot-*` and are applied on the mascot root, alongside existing `--wk-*` dashboard tokens.
- Auto-sleep is off by default (`sleepAfterMs: false`) so the playground stays idle until configured.
- `off()` is generic instead of `Function`. Speech state for `<SpeechBubble />` is tracked in the React provider by wrapping `say()`.
- The custom element class is created inside `defineMascotElement()` so importing the module does not touch `HTMLElement` or `customElements`.
