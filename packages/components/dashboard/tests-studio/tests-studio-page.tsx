"use client";

import { useQuality } from "@/components/dashboard/quality/quality-provider";
import { DonutChart } from "./donut-chart";
import { LatencyTimeline } from "./latency-timeline";
import { ComponentHealthBento } from "./component-health-bento";
import { Heatstrip } from "./heatstrip";
import { RotateCw, AlertTriangle, ShieldCheck, Cpu } from "lucide-react";

export function TestsStudioPage() {
  const { snapshot, runningItemKey, loading, refresh, runItemTests } =
    useQuality();

  const history = snapshot.history ?? [];
  const itemTests = snapshot.itemTests ?? {};

  // Aggregate assertions for global donut
  const recordedItems = Object.values(itemTests);
  let aggregatePassed = 0;
  let aggregateFailed = 0;
  let aggregatePending = 0;
  let aggregateTotal = 0;

  for (const item of recordedItems) {
    aggregatePassed += item.passed;
    aggregateFailed += item.failed;
    aggregatePending += item.pending;
    aggregateTotal += item.total;
  }

  // Fallback from history if itemTests is empty
  if (aggregateTotal === 0 && history.length > 0) {
    const latest = history[0];
    aggregatePassed = latest.passed;
    aggregateFailed = latest.failed;
    aggregatePending = latest.pending;
    aggregateTotal = latest.total;
  }

  const syncCount = Math.min(20, history.length);

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-12">
      {/* 1. Structural Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#20222b]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
              <span className="size-1.5  rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
            <span className="text-[11px] font-mono text-zinc-500 bg-[#121318] border border-[#20222b] px-2 py-0.5 rounded">
              /tests
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-100 tracking-tight">
            Tests & Performance Studio
          </h1>
          <p className="text-sm/relaxed text-zinc-400 mt-1 max-w-2xl ">
            Real-time telemetry for Vitest suites, assertion health, and runner latency analysis.
          </p>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-zinc-400 px-2.5 py-1.5 rounded-lg bg-[#121318] border border-[#20222b] hidden sm:inline-block">
            {syncCount} runs synced
          </span>

          <button
            type="button"
            onClick={() => void refresh()}
            disabled={loading}
            aria-label="Refresh test telemetry"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#181a22] hover:bg-[#202330] text-zinc-200 border border-[#292c38] hover:border-[#383c4d] transition-all cursor-pointer disabled:opacity-50"
          >
            <RotateCw
              size={13}
              className={`text-violet-400 ${loading ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </button>
        </div>
      </header>

      {/* Snapshot Error Banner */}
      {snapshot.error && (
        <div
          role="alert"
          className="flex items-center gap-3 p-3.5 rounded-xl border border-rose-800/60 bg-rose-950/40 text-rose-300 text-xs font-mono"
        >
          <AlertTriangle size={16} className="shrink-0 text-rose-400" />
          <span className="flex-1">{snapshot.error}</span>
          <button
            type="button"
            onClick={() => void refresh()}
            className="underline hover:text-white font-semibold cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* 2. Metrics Cockpit (Donut + Latency Timeline) */}
      <section
        aria-label="Metrics cockpit"
        className="w-full rounded-2xl border border-[#20222b] bg-[#121318] p-5 shadow-xl shadow-black/40"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Donut Chart (4 cols) */}
          <div className="lg:col-span-4 flex flex-col justify-between">
            <DonutChart
              passed={aggregatePassed}
              failed={aggregateFailed}
              pending={aggregatePending}
              total={aggregateTotal}
              loading={loading}
            />
          </div>

          {/* Vitest Latency Timeline (8 cols) */}
          <div className="lg:col-span-8 lg:border-l lg:border-[#1c1e26] lg:pl-6 flex flex-col justify-between">
            <LatencyTimeline
              history={history}
              averageDurationMs={snapshot.averageItemDurationMs}
              averageRenderTimeMs={snapshot.averageRenderTimeMs}
              loading={loading}
            />
          </div>
        </div>
      </section>

      {/* 3. Bento Grid: Component Health & Assertions */}
      <ComponentHealthBento
        itemTests={itemTests}
        runningItemKey={runningItemKey}
        onRunTest={runItemTests}
      />

      {/* 4. Execution Heatstrip */}
      <Heatstrip history={history} loading={loading} />

      {/* 5. Performance Contract & Telemetry Footer */}
      <footer className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-[#1c1e26] bg-[#0e1014] text-xs font-mono text-zinc-500">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-emerald-400" />
          <span>
            Actual telemetry via Vitest runner subprocess (<strong className="text-zinc-300">durationMs</strong>).
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Cpu size={15} className="text-violet-400" />
          <span>
            Average Render:{" "}
            <span className="text-zinc-400">
              {snapshot.averageRenderTimeMs !== null
                ? `${snapshot.averageRenderTimeMs.toFixed(2)}ms`
                : "Not measured (null)"}
            </span>
          </span>
        </div>
      </footer>
    </div>
  );
}
