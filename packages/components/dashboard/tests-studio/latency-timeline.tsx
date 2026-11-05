"use client";

import type { TestRunSummary } from "@/lib/quality";
import { type CSSProperties, useState } from "react";

interface LatencyTimelineProps {
  history: TestRunSummary[];
  averageDurationMs: number | null;
  averageRenderTimeMs: number | null;
  loading?: boolean;
}

export function LatencyTimeline({
  history,
  averageDurationMs,
  averageRenderTimeMs,
  loading = false,
}: LatencyTimelineProps) {
  const [hoveredRun, setHoveredRun] = useState<{
    run: TestRunSummary;
    index: number;
  } | null>(null);

  // Chronological order: oldest #1 to newest #20
  const runs = [...history.slice(0, 20)].reverse();
  const latestRun = history[0] ?? null;

  const rawMax = Math.max(
    250,
    ...runs.map((r) =>
      typeof r?.durationMs === "number" && !isNaN(r.durationMs)
        ? r.durationMs
        : 0,
    ),
    typeof averageDurationMs === "number" && !isNaN(averageDurationMs)
      ? averageDurationMs
      : 0,
  );
  const maxDuration = Math.ceil(rawMax / 50) * 50;
  const midDuration = Math.round(maxDuration / 2);

  const avgBottomPercent =
    typeof averageDurationMs === "number" &&
    !isNaN(averageDurationMs) &&
    maxDuration > 0
      ? Math.min(100, Math.max(0, (averageDurationMs / maxDuration) * 100))
      : null;

  return (
    <div className="flex flex-col justify-between size-full ">
      <div className="flex items-center justify-between pb-3 border-b border-[#1c1e26]">
        <div className="flex items-center gap-2">
          <span className="size-2  rounded-full bg-violet-400 shadow-[0_0_8px_rgba(124,58,237,0.5)]" />
          <span className="text-xs font-semibold tracking-wider uppercase text-zinc-400">
            Latency Timeline Vitest
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-400">
          <span className="flex items-center gap-1.5">
            <span className="size-2  rounded-sm bg-emerald-500 inline-block" />
            OK
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2  rounded-sm bg-rose-500 inline-block" />
            Falha
          </span>
          {averageDurationMs !== null && (
            <span className="text-violet-400 border border-violet-500/30 bg-violet-950/20 px-1.5 py-0.5 rounded">
              Média BD: {Math.round(averageDurationMs)}ms
            </span>
          )}
        </div>
      </div>

      <div className="relative my-4 flex-1 min-h-[170px] flex">
        <div className="flex flex-col justify-between items-end pr-3 pb-6 text-[10px] font-mono text-zinc-500 select-none border-r border-[#1c1e26]">
          <span>{maxDuration}ms</span>
          <span>{midDuration}ms</span>
          <span>0ms</span>
        </div>

        <div className="relative flex-1 flex flex-col justify-end pl-3">
          {avgBottomPercent !== null && (
            <div
              className="absolute inset-x-0  z-10 flex items-center pointer-events-none"
              style={{ bottom: `${avgBottomPercent}%` }}
            >
              <div className="w-full border-b border-dashed border-violet-500/60" />
              <span className="absolute right-2 -top-2.5 text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded bg-[#181a22] text-violet-300 border border-violet-700/50">
                Média: {Math.round(averageDurationMs!)}ms
              </span>
            </div>
          )}

          <div className="absolute inset-0 pb-6 flex flex-col justify-between pointer-events-none">
            <div className="w-full border-b border-[#1c1e26]/60" />
            <div className="w-full border-b border-[#1c1e26]/40 border-dashed" />
            <div className="w-full border-b border-[#20222b]" />
          </div>

          <div className="relative z-20 flex-1 flex items-end gap-1.5 pb-6">
            {runs.length === 0 ? (
              <div className="size-full  flex items-center justify-center text-xs text-zinc-500 font-mono">
                {loading
                  ? "Carregando histórico do runner..."
                  : "Nenhuma execução registrada no banco de dados"}
              </div>
            ) : (
              runs.map((run, index) => {
                const duration =
                  typeof run.durationMs === "number" && !isNaN(run.durationMs)
                    ? run.durationMs
                    : 0;
                const heightPercent =
                  maxDuration > 0
                    ? Math.min(100, Math.max(6, (duration / maxDuration) * 100))
                    : 6;
                const isFailed = run.failed > 0;
                const isHovered = hoveredRun?.index === index;
                const isLatest = index === runs.length - 1;

                return (
                  <div
                    key={`${run.itemType}-${run.itemSlug}-${run.completedAt}-${index}`}
                    className="flex-1 flex flex-col items-center justify-end h-full relative group"
                    onMouseEnter={() => setHoveredRun({ run, index })}
                    onMouseLeave={() => setHoveredRun(null)}
                  >
                    {/* Tooltip */}
                    {isHovered && (
                      <div className="absolute bottom-[calc(100%+8px)] z-30 pointer-events-none flex flex-col items-center whitespace-nowrap">
                        <div className="bg-[#181a22] border border-[#2d303d] shadow-xl rounded-md px-2.5 py-1.5 text-[11px] font-mono text-zinc-200">
                          <div className="font-semibold text-white flex items-center gap-1.5">
                            <span>
                              #{index + 1}: {run.itemName}
                            </span>
                            <span
                              className={`text-[9px] px-1 rounded ${
                                isFailed
                                  ? "bg-rose-950 text-rose-300"
                                  : "bg-emerald-950 text-emerald-300"
                              }`}
                            >
                              {isFailed ? "Falha" : "Passed"}
                            </span>
                          </div>
                          <div className="text-zinc-400 text-[10px] mt-0.5">
                            Latência:{" "}
                            <strong className="text-violet-300">
                              {run.durationMs}ms
                            </strong>{" "}
                            • {run.passed}/{run.total} asserts
                          </div>
                          <div className="text-[9px] text-zinc-500">
                            {new Date(run.completedAt).toLocaleTimeString()}
                          </div>
                        </div>
                        <div className="size-2  bg-[#181a22] border-r border-b border-[#2d303d] rotate-45 -mt-1" />
                      </div>
                    )}

                    {/* Bar */}
                    <div
                      className={`w-full latency-bar rounded-t-sm transition-all duration-200 cursor-pointer ${
                        isFailed
                          ? "bg-rose-500 hover:bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.4)]"
                          : isLatest
                            ? "bg-purple-400 hover:bg-purple-300 shadow-[0_0_8px_rgba(16,185,129,0.5)] ring-1 ring-purple-300/60"
                            : "bg-purple-500/85 hover:bg-purple-400"
                      } ${isHovered ? "brightness-125 scale-y-[1.03]" : ""}`}
                      style={
                        {
                          "--bar-index": index,
                          height: `${heightPercent}%`,
                        } as CSSProperties
                      }
                    />

                    <span
                      className={`absolute -bottom-5 text-[9px] font-mono ${
                        isFailed
                          ? "text-rose-400 font-semibold"
                          : isLatest
                            ? "text-violet-400 font-semibold"
                            : "text-zinc-500"
                      }`}
                    >
                      #{index + 1}
                      {isFailed ? "(F)" : isLatest ? "(Hoje)" : ""}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="w-full pt-3 border-t border-[#1c1e26] flex items-center justify-between text-[11px] font-mono text-zinc-400">
        <div className="flex items-center gap-2 truncate">
          <span className="text-zinc-500">Último:</span>
          {latestRun ? (
            <span className="text-zinc-200">
              <strong className="text-violet-300">{latestRun.itemName}</strong>{" "}
              ({latestRun.durationMs}ms)
            </span>
          ) : (
            <span className="text-zinc-500">—</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-zinc-500">
          <span>•</span>
          <span>Render:</span>
          {averageRenderTimeMs !== null ? (
            <span className="text-emerald-400 font-semibold">
              {averageRenderTimeMs.toFixed(1)}ms
            </span>
          ) : (
            <span className="text-zinc-500 italic">Não medido (null)</span>
          )}
        </div>
      </div>
    </div>
  );
}
