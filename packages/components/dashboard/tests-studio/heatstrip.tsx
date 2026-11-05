"use client";

import type { TestRunSummary } from "@/lib/quality";
import { Check, X, Clock } from "lucide-react";

interface HeatstripProps {
  history: TestRunSummary[];
  loading?: boolean;
}

export function Heatstrip({ history, loading = false }: HeatstripProps) {
  // Chronological order: oldest #1 to newest #20
  const runs = [...history.slice(0, 20)].reverse();

  return (
    <section className="w-full flex flex-col gap-3 rounded-xl border border-[#20222b] bg-[#121318] p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1c1e26]">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-violet-400" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">
            Execution Heatstrip
          </h2>
        </div>
        <span className="text-xs font-mono text-zinc-500">
          Chronological sequence of the 20 most recent synced runs
        </span>
      </div>

      <div className="w-full overflow-x-auto tp-scroll pb-2 pt-1">
        <div className="flex items-center gap-2 min-w-max">
          {runs.length === 0 ? (
            <div className="w-full py-4 text-center text-xs font-mono text-zinc-500">
              {loading
                ? "Loading heatstrip sequence..."
                : "No test runs recorded in database yet."}
            </div>
          ) : (
            runs.map((run, index) => {
              const isFailed = run.failed > 0;
              const isLatest = index === runs.length - 1;

              return (
                <div
                  key={`${run.itemType}-${run.itemSlug}-${run.completedAt}-${index}`}
                  title={`${run.itemName} (${run.itemType}): ${run.durationMs}ms • ${run.passed}/${run.total} pass • ${new Date(run.completedAt).toLocaleString()}`}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all select-none ${
                    isLatest
                      ? isFailed
                        ? "bg-rose-950/60 border-rose-500 ring-2 ring-rose-500/40 text-rose-200 heatstrip-active-glow"
                        : "bg-violet-950/60 border-violet-500 ring-2 ring-violet-500/40 text-violet-200 heatstrip-active-glow"
                      : isFailed
                        ? "bg-rose-950/30 border-rose-900/50 hover:border-rose-700 text-rose-300"
                        : "bg-[#181a22] border-[#222432] hover:border-[#2f3346] text-zinc-300"
                  }`}
                >
                  <span className="text-[10px] text-zinc-500 font-semibold">
                    #{index + 1}
                  </span>
                  <span className="font-semibold text-zinc-200 max-w-[80px] truncate">
                    {run.itemName}
                  </span>
                  <span className="text-violet-300 font-bold">
                    {run.durationMs}ms
                  </span>
                  <span
                    className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold ${
                      isFailed
                        ? "bg-rose-900 text-rose-200"
                        : "bg-violet-900 text-violet-200"
                    }`}
                  >
                    {isFailed ? <X size={10} /> : <Check size={10} />}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
