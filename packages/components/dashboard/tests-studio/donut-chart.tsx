"use client";

import type { CSSProperties } from "react";

interface DonutChartProps {
  passed: number;
  failed: number;
  pending: number;
  total: number;
  loading?: boolean;
}

export function DonutChart({
  passed,
  failed,
  pending,
  total,
  loading = false,
}: DonutChartProps) {
  const radius = 40;
  const circumference = 251.2; // 2 * Math.PI * 40 ≈ 251.327
  const passedRatio = total > 0 ? passed / total : 0;
  const failedRatio = total > 0 ? failed / total : 0;

  const passedStrokeLength = passedRatio * circumference;
  const passedDashoffset = circumference - passedStrokeLength;

  const failedStrokeLength = failedRatio * circumference;

  const passPercentage =
    total > 0 ? (passedRatio * 100).toFixed(1) : null;

  return (
    <div className="flex flex-col items-center justify-between h-full w-full">
      <div className="w-full flex items-center justify-between pb-3 border-b border-[#1c1e26]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
          <span className="text-xs font-semibold tracking-wider uppercase text-zinc-400">
            Vitest Pass Rate
          </span>
        </div>
        <span className="text-[11px] font-mono text-zinc-500">
          {total} assertions
        </span>
      </div>

      <div className="relative my-5 flex items-center justify-center">
        <svg
          className="w-40 h-40 overflow-visible"
          viewBox="0 0 100 100"
          aria-hidden="true"
        >
          {/* Background subtle ring */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke="#1c1e26"
            strokeWidth="8"
          />

          {/* Failed slice if any */}
          {failed > 0 && (
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="#f43f5e"
              strokeWidth="8"
              strokeDasharray={`${failedStrokeLength} ${circumference}`}
              strokeDashoffset={-passedStrokeLength}
              className="transition-all duration-700"
              transform="rotate(-90 50 50)"
            />
          )}

          {/* Passed arc (animated on load) */}
          {total > 0 && passed > 0 && (
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="#8b5cf6"
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={passedDashoffset}
              strokeLinecap={failed === 0 ? "round" : "butt"}
              className="donut-arc"
              style={
                {
                  "--target-dashoffset": `${passedDashoffset}`,
                } as CSSProperties
              }
            />
          )}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-bold font-mono tracking-tight text-zinc-100">
            {loading ? "…" : passPercentage !== null ? `${passPercentage}%` : "—"}
          </span>
          <span className="text-xs font-mono text-zinc-400 mt-0.5">
            {loading ? "loading..." : total > 0 ? `${passed}/${total}` : "0 runs"}
          </span>
        </div>
      </div>

      {/* Status Badges */}
      <div className="w-full grid grid-cols-3 gap-2 pt-2 border-t border-[#1c1e26]">
        <div className="flex flex-col items-center justify-center py-1.5 px-1 rounded-md bg-violet-950/30 border border-violet-900/40">
          <span className="text-xs font-bold font-mono text-violet-400">
            {passed}
          </span>
          <span className="text-[10px] uppercase font-semibold text-violet-400/80 tracking-wider">
            Passed
          </span>
        </div>

        <div className="flex flex-col items-center justify-center py-1.5 px-1 rounded-md bg-rose-950/30 border border-rose-900/40">
          <span className="text-xs font-bold font-mono text-rose-400">
            {failed}
          </span>
          <span className="text-[10px] uppercase font-semibold text-rose-500/80 tracking-wider">
            Failed
          </span>
        </div>

        <div className="flex flex-col items-center justify-center py-1.5 px-1 rounded-md bg-zinc-900/80 border border-zinc-800">
          <span className="text-xs font-bold font-mono text-zinc-400">
            {pending}
          </span>
          <span className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider">
            Pending
          </span>
        </div>
      </div>
    </div>
  );
}
