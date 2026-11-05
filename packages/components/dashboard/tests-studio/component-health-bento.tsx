"use client";

import { useState } from "react";
import type { ItemTestResult, TestTargetType } from "@/lib/quality";
import { itemTestKey } from "@/lib/quality";
import { components, widgets } from "@/lib/catalog";
import {
  Play,
  Loader2,
  Lock,
  Ban,
  Check,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export type TestTarget = {
  itemType: TestTargetType;
  slug: string;
  name: string;
  description: string;
  test?: string;
};

interface ComponentHealthBentoProps {
  itemTests: Record<string, ItemTestResult>;
  runningItemKey: string | null;
  onRunTest: (itemType: TestTargetType, slug: string) => Promise<void>;
}

export function ComponentHealthBento({
  itemTests,
  runningItemKey,
  onRunTest,
}: ComponentHealthBentoProps) {
  const [filter, setFilter] = useState<"all" | "component" | "widget">("all");
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({
    "component:badge": true,
  });

  const targets: TestTarget[] = [
    ...components.map((item) => ({
      itemType: "component" as const,
      slug: item.slug,
      name: item.name,
      description: item.description,
      test: item.test,
    })),
    ...widgets.map((item) => ({
      itemType: "widget" as const,
      slug: item.slug,
      name: item.name,
      description: item.description,
      test: item.test,
    })),
  ];

  const filteredTargets = targets.filter((target) => {
    if (filter === "component") return target.itemType === "component";
    if (filter === "widget") return target.itemType === "widget";
    return true;
  });

  const componentsCount = targets.filter(
    (t) => t.itemType === "component",
  ).length;
  const widgetsCount = targets.filter((t) => t.itemType === "widget").length;

  function toggleExpand(key: string) {
    setExpandedKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <section className="w-full flex flex-col gap-4">
      {/* Filter and Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-zinc-100 tracking-tight">
            Component Health & Assertions
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Bento telemetry for unit suites, segmented assertions, and isolated test execution
          </p>
        </div>

        {/* Segmented Filter Control */}
        <div className="inline-flex items-center p-1 rounded-lg bg-[#121318] border border-[#20222b]">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              filter === "all"
                ? "bg-violet-600/25 text-violet-300 border border-violet-500/40 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200 border border-transparent"
            }`}
          >
            All ({targets.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("component")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              filter === "component"
                ? "bg-violet-600/25 text-violet-300 border border-violet-500/40 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200 border border-transparent"
            }`}
          >
            Components ({componentsCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("widget")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              filter === "widget"
                ? "bg-violet-600/25 text-violet-300 border border-violet-500/40 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200 border border-transparent"
            }`}
          >
            Widgets ({widgetsCount})
          </button>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTargets.map((target) => {
          const key = itemTestKey(target.itemType, target.slug);
          const result = itemTests[key];
          const hasTest = Boolean(target.test);
          const isRunning = runningItemKey === key;
          const isLocked = runningItemKey !== null && !isRunning;
          const isNoTest = !hasTest;
          const isExpanded = Boolean(expandedKeys[key]);

          // Status Badge Calculation
          let statusBadgeText = "No Tests";
          let statusBadgeTone = "muted";

          if (hasTest) {
            if (result) {
              if (result.failed > 0) {
                statusBadgeText = `${result.failed} Failed`;
                statusBadgeTone = "rose";
              } else if (result.total > 0 && result.passed === result.total) {
                statusBadgeText = "100% Passed";
                statusBadgeTone = "violet";
              } else {
                statusBadgeText = `${result.passed}/${result.total} Passed`;
                statusBadgeTone = "violet";
              }
            } else {
              statusBadgeText = "Not Run";
              statusBadgeTone = "amber";
            }
          }

          return (
            <article
              key={key}
              className={`flex flex-col justify-between rounded-xl border p-4 transition-all duration-200 ${
                isRunning
                  ? "bg-[#14151e] border-violet-600 card-running-pulse shadow-lg shadow-violet-950/40"
                  : isLocked
                    ? "bg-[#101116] border-[#1c1e26] opacity-85"
                    : isNoTest
                      ? "bg-[#101116] border-[#1c1e26]"
                      : "bg-[#121318] border-[#20222b] hover:border-[#2d303d] hover:bg-[#151720]"
              }`}
            >
              <div>
                {/* Card Header */}
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#1c1e26]">
                  <span
                    className={`text-[10px] uppercase font-mono font-semibold px-2 py-0.5 rounded ${
                      target.itemType === "component"
                        ? "bg-violet-950/50 text-violet-300 border border-violet-800/40"
                        : "bg-cyan-950/50 text-cyan-300 border border-cyan-800/40"
                    }`}
                  >
                    {target.itemType}
                  </span>

                  <span
                    className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded ${
                      statusBadgeTone === "violet"
                        ? "bg-violet-950/50 text-violet-300 border border-violet-800/40"
                        : statusBadgeTone === "rose"
                          ? "bg-rose-950/50 text-rose-300 border border-rose-800/40"
                          : statusBadgeTone === "amber"
                            ? "bg-amber-950/40 text-amber-300 border border-amber-800/40"
                            : "bg-zinc-800/60 text-zinc-500 border border-zinc-700/30"
                    }`}
                  >
                    {statusBadgeText}
                  </span>
                </div>

                {/* Target Name & Latency */}
                <div className="flex items-center justify-between gap-2 pt-3">
                  <h3 className="text-base font-bold text-zinc-100 tracking-tight">
                    {target.name}
                  </h3>
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-[#181a22] border border-[#232634] text-zinc-300">
                    {result ? `${result.durationMs}ms` : "—"}
                  </span>
                </div>

                {/* Target Description */}
                <p className="text-xs text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed">
                  {target.description}
                </p>

                {/* Segmented Assertion Bar */}
                <div className="mt-4 pt-3 border-t border-[#1c1e26]">
                  <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                    <span className="text-zinc-400 text-[11px]">
                      {hasTest && result
                        ? `${result.passed}/${result.total} Assertions`
                        : "0 Assertions"}
                    </span>
                    {hasTest && result && result.durationMs > 0 && (
                      <span className="text-zinc-500 text-[10px]">
                        Vitest Runner
                      </span>
                    )}
                  </div>

                  {/* Segmented blocks */}
                  <div className="w-full flex items-center gap-1 h-2">
                    {hasTest && result && result.assertions.length > 0 ? (
                      result.assertions.map((assertion, idx) => {
                        const isPass = assertion.status === "passed";
                        const isFail = assertion.status === "failed";
                        return (
                          <div
                            key={`${key}-seg-${idx}`}
                            title={`${assertion.name}: ${assertion.status}`}
                            className={`flex-1 h-full rounded-xs transition-all ${
                              isPass
                                ? "bg-violet-500 shadow-[0_0_6px_rgba(139,92,246,0.35)]"
                                : isFail
                                  ? "bg-rose-500 segment-failed-pulse"
                                  : "bg-zinc-700"
                            }`}
                          />
                        );
                      })
                    ) : (
                      // Placeholder segments
                      Array.from({ length: 6 }).map((_, idx) => (
                        <div
                          key={`empty-seg-${idx}`}
                          className="flex-1 h-full rounded-xs bg-zinc-800/80"
                        />
                      ))
                    )}
                  </div>
                </div>

                {/* Mini Assertions List (Collapsible) */}
                {hasTest && result?.assertions && result.assertions.length > 0 && (
                  <div className="mt-3.5">
                    <button
                      type="button"
                      onClick={() => toggleExpand(key)}
                      className="w-full flex items-center justify-between text-[11px] font-mono text-zinc-400 hover:text-zinc-200 py-1"
                    >
                      <span>
                        {isExpanded ? "Hide assertions" : "View assertions"} (
                        {result.assertions.length})
                      </span>
                      {isExpanded ? (
                        <ChevronUp size={14} />
                      ) : (
                        <ChevronDown size={14} />
                      )}
                    </button>

                    {isExpanded && (
                      <ul className="tp-scroll mt-2 max-h-36 overflow-y-auto space-y-1.5 pr-1">
                        {result.assertions.map((assertion, idx) => {
                          const isPass = assertion.status === "passed";
                          return (
                            <li
                              key={`${key}-assert-${idx}`}
                              className="flex items-center gap-2 p-1.5 rounded-md bg-[#181a22] border border-[#20222b] text-[11px]"
                            >
                              <span
                                className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                                  isPass
                                    ? "bg-violet-950/80 text-violet-400"
                                    : "bg-rose-950/80 text-rose-400"
                                }`}
                              >
                                {isPass ? <Check size={11} /> : <X size={11} />}
                              </span>
                              <span className="truncate text-zinc-300 font-mono text-[10.5px]">
                                {assertion.name}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {/* MutEx Action Button (4 States) */}
              <div className="mt-5 pt-3 border-t border-[#1c1e26]">
                {isNoTest ? (
                  // State 4: No Registered Test
                  <button
                    type="button"
                    disabled
                    aria-label={`No test registered for ${target.name}`}
                    className="w-full h-9 flex items-center justify-center gap-2 rounded-lg bg-zinc-800/40 text-zinc-500 border border-zinc-800/60 text-xs font-semibold cursor-not-allowed select-none"
                  >
                    <Ban size={14} />
                    <span>No Registered Test</span>
                  </button>
                ) : isRunning ? (
                  // State 2: Running (Item Active)
                  <button
                    type="button"
                    disabled
                    aria-label={`Running tests for ${target.name}`}
                    className="w-full h-9 flex items-center justify-center gap-2 rounded-lg bg-violet-900/60 text-violet-200 border border-violet-700 text-xs font-semibold cursor-wait"
                  >
                    <Loader2 size={14} className="animate-spin text-violet-400" />
                    <span>Running...</span>
                  </button>
                ) : isLocked ? (
                  // State 3: Locked (Concurrency MutEx)
                  <button
                    type="button"
                    disabled
                    title="Wait for the active test run to finish"
                    aria-label={`Locked: wait for current test to finish before running ${target.name}`}
                    className="w-full h-9 flex items-center justify-center gap-2 rounded-lg bg-zinc-800 text-zinc-500 border border-zinc-700/40 text-xs font-semibold cursor-not-allowed"
                  >
                    <Lock size={14} />
                    <span>Run Test (Vitest)</span>
                  </button>
                ) : (
                  // State 1: Idle (Ready)
                  <button
                    type="button"
                    onClick={() => void onRunTest(target.itemType, target.slug)}
                    aria-label={`Run ${target.name} tests`}
                    title={`Run tests for ${target.name}`}
                    className="w-full h-9 flex items-center justify-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white text-xs font-semibold shadow-md shadow-violet-900/30 transition-all cursor-pointer"
                  >
                    <Play size={14} className="fill-white" />
                    <span>Run Test (Vitest)</span>
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
