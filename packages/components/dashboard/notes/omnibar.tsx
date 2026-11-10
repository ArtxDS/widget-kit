"use client";

import { useEffect, useRef } from "react";
import { Zap, X } from "lucide-react";

type OmnibarProps = {
  query: string;
  onQueryChange: (query: string) => void;
  onQuickCapture?: () => void;
  canCapture: boolean;
};

export function Omnibar({
  query,
  onQueryChange,
  onQuickCapture,
  canCapture,
}: OmnibarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // ⌘C hotkey for quick capture when not actively selecting text
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "c" &&
        canCapture &&
        onQuickCapture
      ) {
        // If text is highlighted, allow native copy
        const selection = window.getSelection();
        if (selection && selection.toString().trim().length > 0) {
          return;
        }
        event.preventDefault();
        onQuickCapture();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canCapture, onQuickCapture]);

  return (
    <div className="h-11 bg-[#161920] border border-[#232730] rounded-lg px-3.5 flex items-center justify-between gap-3 transition-colors focus-within:border-purple-600/70 focus-within:bg-[#191d26]">
      <div className="flex items-center gap-2.5 text-[#9CA3AF] text-xs flex-1 min-w-0">
        <Zap className="size-3.5 text-purple-400 shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Quick capture idea, bug, or decision..."
          aria-label="Filter notes or quick capture"
          className="bg-transparent border-0 outline-none text-[#E1E4EA] placeholder:text-[#9CA3AF] w-full text-xs font-normal"
        />
        {query && (
          <button
            type="button"
            onClick={() => onQueryChange("")}
            className="text-slate-400 hover:text-white p-0.5 rounded-sm"
            aria-label="Clear filter query"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {canCapture && onQuickCapture ? (
          <button
            type="button"
            onClick={onQuickCapture}
            title="Press ⌘C to quick capture"
            className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#1E222B] hover:bg-[#262c37] border border-[#2d323e] text-slate-300 hover:text-white text-[11px] transition-colors"
          >
            <span className="hidden sm:inline text-[10.5px] text-slate-400">Capture</span>
            <kbd className="font-mono text-[10px] text-purple-300 font-semibold">⌘C</kbd>
          </button>
        ) : (
          <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#1E222B] border border-[#232730] text-slate-400">
            ⌘C
          </kbd>
        )}
      </div>
    </div>
  );
}

