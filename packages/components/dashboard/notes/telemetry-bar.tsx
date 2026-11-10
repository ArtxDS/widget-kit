"use client";

import { Activity, Pin } from "lucide-react";

export type StatusFilter = "ALL" | "OPEN" | "IN_PROGRESS" | "DONE" | "PINNED";

type TelemetryBarProps = {
  totalCount: number;
  openCount: number;
  inProgressCount: number;
  doneCount: number;
  pinnedCount: number;
  activeFilter: StatusFilter;
  onSelectFilter: (filter: StatusFilter) => void;
};

export function TelemetryBar({
  totalCount,
  openCount,
  inProgressCount,
  doneCount,
  pinnedCount,
  activeFilter,
  onSelectFilter,
}: TelemetryBarProps) {
  return (
    <div
      data-testid="telemetry-bar"
      className="sticky top-[58px] md:top-[64px] z-20 bg-[#0b0c10]/95 backdrop-blur-md py-2 flex items-center justify-between gap-3 text-xs flex-wrap"
    >
      {/* Left indicator */}
      <div className="flex items-center gap-2 text-slate-300 font-medium">
        <Activity className="size-3.5 text-slate-400" />
        <span>Telemetry • Live</span>
        <span
          className="size-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.7)]"
          aria-hidden="true"
        />
      </div>

      {/* Right filter pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={() => onSelectFilter("ALL")}
          aria-pressed={activeFilter === "ALL"}
          className={`h-7 px-2.5 rounded-full text-[11px] font-medium border transition-colors flex items-center gap-1.5 ${
            activeFilter === "ALL"
              ? "bg-purple-900/40 text-purple-300 border-purple-600/60 shadow-sm"
              : "bg-[#161920]/60 text-slate-400 border-[#232730] hover:text-white hover:border-slate-700"
          }`}
        >
          <span className="size-1.5 rounded-full bg-purple-400" />
          <span>All</span>
          <span className="text-slate-400 font-mono text-[10px] ml-0.5">{totalCount}</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectFilter("OPEN")}
          aria-pressed={activeFilter === "OPEN"}
          className={`h-7 px-2.5 rounded-full text-[11px] font-medium border transition-colors flex items-center gap-1.5 ${
            activeFilter === "OPEN"
              ? "bg-purple-900/40 text-purple-300 border-purple-600/60 shadow-sm"
              : "bg-[#161920]/60 text-slate-400 border-[#232730] hover:text-white hover:border-slate-700"
          }`}
        >
          <span className="size-1.5 rounded-full bg-sky-400" />
          <span>Open</span>
          <span className="text-slate-400 font-mono text-[10px] ml-0.5">{openCount}</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectFilter("IN_PROGRESS")}
          aria-pressed={activeFilter === "IN_PROGRESS"}
          className={`h-7 px-2.5 rounded-full text-[11px] font-medium border transition-colors flex items-center gap-1.5 ${
            activeFilter === "IN_PROGRESS"
              ? "bg-purple-900/40 text-purple-300 border-purple-600/60 shadow-sm"
              : "bg-[#161920]/60 text-slate-400 border-[#232730] hover:text-white hover:border-slate-700"
          }`}
        >
          <span className="size-1.5 rounded-full bg-amber-400" />
          <span>In Progress</span>
          <span className="text-slate-400 font-mono text-[10px] ml-0.5">{inProgressCount}</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectFilter("DONE")}
          aria-pressed={activeFilter === "DONE"}
          className={`h-7 px-2.5 rounded-full text-[11px] font-medium border transition-colors flex items-center gap-1.5 ${
            activeFilter === "DONE"
              ? "bg-purple-900/40 text-purple-300 border-purple-600/60 shadow-sm"
              : "bg-[#161920]/60 text-slate-400 border-[#232730] hover:text-white hover:border-slate-700"
          }`}
        >
          <span className="size-1.5 rounded-full bg-emerald-400" />
          <span>Done</span>
          <span className="text-slate-400 font-mono text-[10px] ml-0.5">{doneCount}</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectFilter("PINNED")}
          aria-pressed={activeFilter === "PINNED"}
          className={`h-7 px-2.5 rounded-full text-[11px] font-medium border transition-colors flex items-center gap-1.5 ${
            activeFilter === "PINNED"
              ? "bg-purple-900/40 text-purple-300 border-purple-600/60 shadow-sm"
              : "bg-[#161920]/60 text-slate-400 border-[#232730] hover:text-white hover:border-slate-700"
          }`}
        >
          <Pin className="size-3 text-purple-400 fill-purple-400/40 rotate-45" />
          <span>Pinned</span>
          <span className="text-slate-400 font-mono text-[10px] ml-0.5">{pinnedCount}</span>
        </button>
      </div>
    </div>
  );
}