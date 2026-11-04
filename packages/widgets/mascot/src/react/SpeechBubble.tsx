"use client";

import { useMascot } from "./MascotProvider";

export function SpeechBubble({ className = "" }: { className?: string }) {
  const { lastSpeech } = useMascot();
  if (!lastSpeech) return null;
  return (
    <div
      className={`wk-mascot__bubble wk-mascot__bubble--top ${className}`.trim()}
      role="status"
      aria-live="polite"
    >
      <div className="wk-mascot__bubble-inner">
        <span className="wk-mascot__bubble-text">{lastSpeech}</span>
      </div>
    </div>
  );
}
