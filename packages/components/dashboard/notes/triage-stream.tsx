"use client";

import { useState, useRef, useEffect } from "react";
import {
  Bug,
  Lightbulb,
  TrendingUp,
  GitBranch,
  FileText,
  Circle,
  Clock,
  CheckCircle2,
  ListFilter,
  Plus,
  ArrowUpDown,
  Check,
  ChevronDown,
} from "lucide-react";
import {
  noteTypeLabels,
  type NoteDto,
  type NoteType,
  type NoteStatus,
} from "@/lib/notes";

export type SortOption = "newest" | "oldest" | "priority" | "title";

type TriageStreamProps = {
  notes: NoteDto[];
  selectedId: string | null;
  onSelectNote: (id: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  categoryFilter: NoteType | "ALL";
  onCategoryChange: (category: NoteType | "ALL") => void;
  onNewNote?: () => void;
  canCreate?: boolean;
};

export function relativeTime(value: string): string {
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function NoteTypeIcon({ type, className }: { type: NoteType; className?: string }) {
  switch (type) {
    case "BUG":
      return <Bug className={className ?? "size-3.5 text-red-400"} />;
    case "IDEA":
      return <Lightbulb className={className ?? "size-3.5 text-amber-400"} />;
    case "IMPROVEMENT":
      return <TrendingUp className={className ?? "size-3.5 text-blue-400"} />;
    case "DECISION":
      return <GitBranch className={className ?? "size-3.5 text-purple-400"} />;
    case "CHANGELOG":
      return <FileText className={className ?? "size-3.5 text-emerald-400"} />;
  }
}

export function typeBadgeStyle(type: NoteType): string {
  switch (type) {
    case "BUG":
      return "bg-red-950/50 text-red-300 border-red-800/50";
    case "IDEA":
      return "bg-amber-950/50 text-amber-300 border-amber-800/50";
    case "IMPROVEMENT":
      return "bg-blue-950/50 text-blue-300 border-blue-800/50";
    case "DECISION":
      return "bg-purple-950/50 text-purple-300 border-purple-800/50";
    case "CHANGELOG":
      return "bg-emerald-950/50 text-emerald-300 border-emerald-800/50";
  }
}

export function NoteStatusGlyph({ status }: { status: NoteStatus }) {
  switch (status) {
    case "OPEN":
      return <Circle className="size-3 text-sky-400 shrink-0" />;
    case "IN_PROGRESS":
      return <Clock className="size-3 text-amber-400 shrink-0" />;
    case "DONE":
      return <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />;
  }
}

export function formatComponentSlug(slug: string | null): string | null {
  if (!slug) return null;
  return slug.endsWith(".tsx") || slug.endsWith(".ts") ? slug : `${slug}.tsx`;
}

export function getTagBadgeStyle(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = (hash * 31 + tag.charCodeAt(i)) >>> 0;
  }
  const palettes = [
    "bg-purple-950/60 text-purple-300 border-purple-600/50 hover:border-purple-400",
    "bg-sky-950/60 text-sky-300 border-sky-600/50 hover:border-sky-400",
    "bg-emerald-950/60 text-emerald-300 border-emerald-600/50 hover:border-emerald-400",
    "bg-amber-950/60 text-amber-300 border-amber-600/50 hover:border-amber-400",
    "bg-rose-950/60 text-rose-300 border-rose-600/50 hover:border-rose-400",
    "bg-teal-950/60 text-teal-300 border-teal-600/50 hover:border-teal-400",
    "bg-indigo-950/60 text-indigo-300 border-indigo-600/50 hover:border-indigo-400",
    "bg-fuchsia-950/60 text-fuchsia-300 border-fuchsia-600/50 hover:border-fuchsia-400",
  ];
  return palettes[hash % palettes.length];
}

const sortOptions: { label: string; value: SortOption }[] = [
  { label: "Newest first", value: "newest" },
  { label: "Oldest first", value: "oldest" },
  { label: "Priority (P1 → P3)", value: "priority" },
  { label: "Title (A → Z)", value: "title" },
];

const categoryOptions: { label: string; short: string; value: NoteType | "ALL"; icon?: React.ReactNode }[] = [
  { label: "All", short: "All", value: "ALL" },
  { label: "Bug", short: "Bug", value: "BUG", icon: <Bug className="size-3 text-red-400" /> },
  { label: "Idea", short: "Idea", value: "IDEA", icon: <Lightbulb className="size-3 text-amber-400" /> },
  { label: "Improvement", short: "Improvement", value: "IMPROVEMENT", icon: <TrendingUp className="size-3 text-blue-400" /> },
  { label: "Decision", short: "Decision", value: "DECISION", icon: <GitBranch className="size-3 text-purple-400" /> },
  { label: "Changelog", short: "Changelog", value: "CHANGELOG", icon: <FileText className="size-3 text-emerald-400" /> },
];

/** Reusable popover hook */
function usePopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function onDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);
  return { open, setOpen, ref };
}

/** Category filter dropover */
function CategoryPopover({
  value,
  onChange,
}: {
  value: NoteType | "ALL";
  onChange: (v: NoteType | "ALL") => void;
}) {
  const { open, setOpen, ref } = usePopover();
  const isSelected = value !== "ALL";
  const selectedOption = categoryOptions.find((o) => o.value === value);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Filter by category"
        aria-label={isSelected ? `Category: ${selectedOption?.label}` : "Category"}
        aria-expanded={open}
        className={`h-7 px-2.5 rounded-md border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
          isSelected || open
            ? "bg-[#1e2230] text-white border-purple-500/60 shadow-xs"
            : "bg-[#14161f]/60 border-[#232730] text-slate-400 hover:text-slate-200 hover:bg-[#181a24] hover:border-slate-700"
        }`}
      >
        <span>{isSelected ? selectedOption?.label : "Category"}</span>
        <ChevronDown
          className={`size-3 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <div
        className={`absolute left-0 top-full mt-1.5 w-44 rounded-lg border border-[#2b2c32] bg-[#131417] shadow-xl z-50 py-1 transition-all ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {categoryOptions
          .filter((opt) => opt.value !== "ALL")
          .map((opt) => {
            const active = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value as NoteType | "ALL");
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 text-xs transition-colors cursor-pointer ${
                  active
                    ? "text-purple-300 bg-purple-950/30 font-medium"
                    : "text-slate-300 hover:bg-[#1E222B] hover:text-white"
                }`}
              >
                <span>{opt.label}</span>
                {active && <Check className="size-3 text-purple-400 shrink-0" />}
              </button>
            );
          })}
      </div>
    </div>
  );
}

/** Sort popover */
function SortPopover({
  value,
  onChange,
}: {
  value: SortOption;
  onChange: (v: SortOption) => void;
}) {
  const { open, setOpen, ref } = usePopover();
  const current = sortOptions.find((o) => o.value === value);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Sort notes"
        aria-label="Sort notes"
        aria-expanded={open}
        className={`h-7 px-2.5 rounded-md border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
          open
            ? "bg-purple-950/40 border-purple-600/50 text-purple-300"
            : "bg-[#14161f] border-[#232730] text-slate-300 hover:text-white hover:border-slate-600"
        }`}
      >
        <ArrowUpDown className="size-3.5 shrink-0 text-slate-400" />
        <span className="hidden sm:inline">{current?.label ?? "Sort"}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-44 rounded-lg border border-[#2b2c32] bg-[#131417] shadow-xl z-50 py-1 overflow-hidden">
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 text-xs transition-colors cursor-pointer ${
                opt.value === value
                  ? "text-purple-300 bg-purple-950/30 font-medium"
                  : "text-slate-300 hover:bg-[#1E222B] hover:text-white"
              }`}
            >
              <span>{opt.label}</span>
              {opt.value === value && (
                <Check className="size-3 text-purple-400 shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function TriageStream({
  notes,
  selectedId,
  onSelectNote,
  sortBy,
  onSortChange,
  categoryFilter,
  onCategoryChange,
  onNewNote,
  canCreate,
}: TriageStreamProps) {
  return (
    <div data-testid="triage-stream" className="flex flex-col gap-3 min-w-0 h-full flex-1">
      {/* Stream header */}
      <div className="flex flex-col gap-2 pb-2.5 border-b border-[#232730]">
        {/* Title row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <ListFilter className="size-4 text-purple-400 shrink-0" />
            <h2 className="text-sm font-semibold text-white tracking-tight truncate">
              Triage Stream
            </h2>
            <span className="text-[10px] font-mono font-medium text-slate-400 bg-[#161920] px-1.5 py-0.2 rounded border border-[#232730]">
              {notes.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <SortPopover value={sortBy} onChange={onSortChange} />
            {canCreate && onNewNote && (
              <button
                type="button"
                onClick={onNewNote}
                title="New note"
                aria-label="New note"
                className="size-7 rounded-md border border-[#232730] bg-[#14161f] hover:bg-purple-950/40 hover:border-purple-600/60 text-slate-300 hover:text-purple-300 flex items-center justify-center transition-colors cursor-pointer"
              >
                <Plus className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter row: All button + Category Dropover */}
        <div className="flex items-center gap-1.5 pt-0.5">
          <button
            type="button"
            onClick={() => onCategoryChange("ALL")}
            aria-pressed={categoryFilter === "ALL"}
            className={`h-7 px-3 rounded-md text-xs font-medium transition-all cursor-pointer border ${
              categoryFilter === "ALL"
                ? "bg-[#1e2230] text-white border-purple-500/60 shadow-xs"
                : "bg-[#14161f]/60 border-[#232730] text-slate-400 hover:text-slate-200 hover:bg-[#181a24] hover:border-slate-700"
            }`}
          >
            All
          </button>

          <CategoryPopover
            value={categoryFilter}
            onChange={onCategoryChange}
          />
        </div>
      </div>

      {/* Stream list */}
      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2.5 min-h-0">
        {notes.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 rounded-lg border border-dashed border-[#232730] bg-[#161920]/40 text-center min-h-[260px]">
            <div className="size-10 rounded-full bg-purple-950/50 border border-purple-800/40 flex items-center justify-center text-purple-400 mb-3 shadow-inner">
              <FileText className="size-5" />
            </div>
            <h4 className="text-sm font-semibold text-slate-200">No notes yet</h4>
            <p className="text-xs/relaxed text-slate-400 mt-1 max-w-[260px]">
              Fill out the form on the right to publish your first technical note.
            </p>
          </div>
        ) : (
          notes.map((note) => {
            const isSelected = selectedId === note.id;
            const compLabel = formatComponentSlug(note.componentSlug);

            return (
              <button
                key={note.id}
                type="button"
                onClick={() => onSelectNote(note.id)}
                className={`text-left rounded-lg p-3 transition-all border relative flex flex-col gap-2 cursor-pointer ${
                  isSelected
                    ? "border-l-2 border-l-purple-500 bg-[#1E222B] border-[#383d4a] shadow-[0_4px_16px_rgba(0,0,0,0.35)]"
                    : "bg-[#161920]/70 hover:bg-[#1A1D25] border-[#232730] text-slate-300"
                }`}
              >
                {/* Top row */}
                <div className="flex items-center gap-2 justify-between flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <NoteTypeIcon type={note.type} className="size-3.5" />
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${typeBadgeStyle(
                        note.type,
                      )}`}
                    >
                      {noteTypeLabels[note.type]}
                    </span>
                    {compLabel && (
                      <span className="text-[10px] font-mono bg-slate-800/80 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700/40">
                        [{compLabel}]
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-[11px] text-slate-400 font-mono">
                      {relativeTime(note.updatedAt || note.createdAt)}
                    </span>
                    <NoteStatusGlyph status={note.status} />
                  </div>
                </div>

                {/* Middle row: Title & snippet */}
                <div>
                  <h3 className="font-semibold text-[13px] text-slate-100 line-clamp-1 leading-snug">
                    {note.title}
                  </h3>
                  <p className="text-xs/relaxed text-slate-400 line-clamp-2 mt-0.5">
                    {note.content ? note.content.slice(0, 150) : "No description provided."}
                  </p>
                </div>

                {/* Bottom row: Priority, tags, status label */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  {note.priority && (
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                        note.priority === "P1"
                          ? "bg-red-950/70 text-red-300 border-red-800/60"
                          : note.priority === "P2"
                            ? "bg-amber-950/70 text-amber-300 border-amber-800/60"
                            : "bg-slate-800 text-slate-300 border-slate-700/60"
                      }`}
                    >
                      {note.priority}
                    </span>
                  )}
                  {note.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full border shadow-2xs inline-flex items-center transition-colors ${getTagBadgeStyle(
                        tag,
                      )}`}
                    >
                      #{tag}
                    </span>
                  ))}
                  {note.tags.length > 3 && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-slate-800/90 text-slate-300 border border-slate-700/60">
                      +{note.tags.length - 3}
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
