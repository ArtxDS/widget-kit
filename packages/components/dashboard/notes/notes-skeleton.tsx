"use client";

export function NotesSkeleton() {
  return (
    <div
      data-testid="notes-skeleton"
      role="status"
      aria-label="Loading notes..."
      className="w-full flex-1 flex flex-col gap-2.5 h-full min-h-0"
    >
      <span className="sr-only">Loading...</span>

      {/* Telemetry HUD Skeleton */}
      <div className="shrink-0 bg-[#0b0c10]/95 backdrop-blur-md py-1.5 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="size-3.5 rounded bg-slate-800/80 animate-pulse" />
          <div className="h-3.5 w-24 rounded bg-slate-800/80 animate-pulse" />
          <div className="size-2 rounded-full bg-slate-800 animate-pulse" />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="h-7 w-14 rounded-full bg-slate-800/70 border border-[#232730] animate-pulse" />
          <div className="h-7 w-16 rounded-full bg-slate-800/70 border border-[#232730] animate-pulse" />
          <div className="h-7 w-24 rounded-full bg-slate-800/70 border border-[#232730] animate-pulse" />
          <div className="h-7 w-16 rounded-full bg-slate-800/70 border border-[#232730] animate-pulse" />
          <div className="h-7 w-20 rounded-full bg-slate-800/70 border border-[#232730] animate-pulse" />
        </div>
      </div>

      {/* 2-Pane Split Master-Detail Layout */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[40%_60%] gap-4 h-full items-stretch">
        {/* Left Pane Skeleton: Triage Stream (40%) */}
        <div className="border border-[#2b2c32] rounded-xl bg-[#151619] p-4 min-w-0 shadow-sm flex flex-col gap-3 h-full overflow-hidden">
          {/* Stream Header */}
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#232730] flex-wrap">
            <div className="flex items-center gap-2">
              <div className="size-4 rounded bg-slate-800 animate-pulse" />
              <div className="h-4 w-24 rounded bg-slate-800 animate-pulse" />
              <div className="h-4 w-6 rounded-full bg-slate-800 animate-pulse" />
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-7 w-24 rounded-[6px] bg-slate-800/80 border border-[#232730] animate-pulse" />
              <div className="h-7 w-24 rounded-[6px] bg-slate-800/80 border border-[#232730] animate-pulse" />
              <div className="size-7 rounded-[6px] bg-slate-800/80 border border-[#232730] animate-pulse" />
            </div>
          </div>

          {/* Stream Card Skeletons */}
          <div className="flex-1 flex flex-col gap-2.5 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-lg p-3 border border-[#232730] bg-[#161920]/70 flex flex-col gap-2.5"
              >
                {/* Top row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className="size-3.5 rounded bg-slate-800 animate-pulse" />
                    <div className="h-4 w-14 rounded-md bg-slate-800/90 animate-pulse" />
                    <div className="h-4 w-18 rounded-md bg-slate-800/60 animate-pulse" />
                  </div>
                  <div className="h-3 w-12 rounded bg-slate-800/60 animate-pulse" />
                </div>

                {/* Title & description */}
                <div className="flex flex-col gap-1.5">
                  <div
                    className={`h-4 rounded bg-slate-800/90 animate-pulse ${
                      i % 2 === 0 ? "w-4/5" : "w-3/5"
                    }`}
                  />
                  <div className="h-3 w-full rounded bg-slate-800/50 animate-pulse" />
                  <div className="h-3 w-3/4 rounded bg-slate-800/40 animate-pulse" />
                </div>

                {/* Bottom tags & priority */}
                <div className="flex items-center gap-1.5 pt-0.5">
                  <div className="h-4 w-7 rounded bg-slate-800/80 animate-pulse" />
                  <div className="h-4 w-14 rounded-full bg-slate-800/60 border border-slate-700/40 animate-pulse" />
                  <div className="h-4 w-16 rounded-full bg-slate-800/60 border border-slate-700/40 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Pane Skeleton: Inspector (60%) */}
        <div className="border border-[#2b2c32] rounded-xl bg-[#151619] p-5 min-w-0 shadow-sm flex flex-col gap-4 min-h-[calc(100vh-250px)]">
          {/* Top Metadata Bar */}
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#232730] flex-wrap">
            <div className="flex items-center gap-2">
              <div className="h-6 w-24 rounded-md bg-slate-800/90 animate-pulse" />
              <div className="h-5 w-8 rounded bg-slate-800/80 animate-pulse" />
              <div className="h-6 w-20 rounded-md bg-slate-800/70 animate-pulse" />
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-7 rounded-[6px] bg-slate-800/80 border border-[#232730] animate-pulse" />
              <div className="size-7 rounded-[6px] bg-slate-800/80 border border-[#232730] animate-pulse" />
            </div>
          </div>

          {/* Title, Component & Tags */}
          <div className="flex flex-col gap-2.5">
            <div className="h-7 w-2/3 rounded-md bg-slate-800 animate-pulse" />
            <div className="flex items-center gap-2 flex-wrap">
              <div className="h-5 w-24 rounded-full bg-slate-800/70 border border-[#232730] animate-pulse" />
              <div className="h-5 w-16 rounded-full bg-purple-950/40 border border-purple-800/40 animate-pulse" />
              <div className="h-5 w-14 rounded-full bg-sky-950/40 border border-sky-800/40 animate-pulse" />
              <div className="h-5 w-20 rounded-full bg-emerald-950/40 border border-emerald-800/40 animate-pulse" />
            </div>
          </div>

          {/* Description Block */}
          <div className="flex flex-col gap-2">
            <div className="h-3.5 w-20 rounded bg-slate-800 animate-pulse" />
            <div className="p-4 rounded-lg bg-[#0d0f14] border border-[#232730] flex flex-col gap-2.5">
              <div className="h-3.5 w-full rounded bg-slate-800/80 animate-pulse" />
              <div className="h-3.5 w-5/6 rounded bg-slate-800/70 animate-pulse" />
              <div className="h-3.5 w-4/6 rounded bg-slate-800/60 animate-pulse" />
              <div className="h-3.5 w-3/5 rounded bg-slate-800/50 animate-pulse" />
            </div>
          </div>

          {/* Structured Category Block */}
          <div className="flex flex-col gap-2">
            <div className="h-3.5 w-28 rounded bg-slate-800 animate-pulse" />
            <div className="p-4 rounded-lg bg-[#0d0f14] border border-[#232730] flex flex-col gap-2.5">
              <div className="h-3.5 w-full rounded bg-slate-800/70 animate-pulse" />
              <div className="h-3.5 w-4/5 rounded bg-slate-800/60 animate-pulse" />
              <div className="h-3.5 w-3/4 rounded bg-slate-800/50 animate-pulse" />
            </div>
          </div>

          {/* Bottom Author & Timestamp box */}
          <div className="mt-auto p-3 rounded-lg bg-[#161920]/60 border border-[#232730] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-full bg-slate-800 animate-pulse" />
              <div className="h-3.5 w-24 rounded bg-slate-800/80 animate-pulse" />
            </div>
            <div className="h-3 w-32 rounded bg-slate-800/60 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

