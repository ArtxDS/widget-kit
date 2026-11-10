"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Pin,
  Pencil,
  CheckCircle2,
  ExternalLink,
  Code2,
  FileText,
  Settings,
  ListOrdered,
  AlertTriangle,
  Check,
  MoreHorizontal,
} from "lucide-react";
import type { NoteDto, NoteStatus } from "@/lib/notes";
import { noteTypeLabels } from "@/lib/notes";
import { NoteMarkdown } from "./markdown-view";
import {
  NoteTypeIcon,
  typeBadgeStyle,
  NoteStatusGlyph,
  formatComponentSlug,
  getTagBadgeStyle,
  relativeTime,
} from "./triage-stream";

type NoteInspectorProps = {
  note: NoteDto;
  isAdmin: boolean;
  isPinned: boolean;
  onTogglePin: (id: string) => void;
  onEdit: (note: NoteDto) => void;
  onUpdateStatus?: (noteId: string, nextStatus: NoteStatus) => Promise<void>;
  statusUpdating?: boolean;
  onRemoveAttachment?: (storageUriOrPath: string) => Promise<void> | void;
};

/** Flat section: coloured label above, content below — no card border */
function ContentSection({
  label,
  color = "text-slate-400",
  icon,
  children,
}: {
  label: string;
  color?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-1.5">
      <div className={`flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-semibold ${color}`}>
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-slate-200 text-sm/relaxed">{children}</div>
    </section>
  );
}

/** Thin divider between sections */
function SectionDivider() {
  return <div className="border-t border-[#232730]/60" />;
}

export function NoteInspector({
  note,
  isAdmin,
  isPinned,
  onTogglePin,
  onEdit,
  onUpdateStatus,
  statusUpdating,
  onRemoveAttachment,
}: NoteInspectorProps) {
  const compFile = formatComponentSlug(note.componentSlug);
  const typeData = (note.typeData ?? {}) as Record<string, unknown>;

  const componentHref = note.componentSlug
    ? note.componentSlug === "mascot" || note.componentSlug === "assistant"
      ? `/playground?item=${note.componentSlug}`
      : `/components/${note.componentSlug}`
    : null;

  // Dropdown state
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [menuOpen]);

  return (
    <div data-testid="note-inspector" className="flex flex-col h-full min-h-0">
      {/* Top Fixed Header */}
      <div className="shrink-0 flex flex-col gap-3 pb-3 border-b border-[#2b2c32]">
        {/* Top Metadata Bar */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-md border flex items-center gap-1.5 ${typeBadgeStyle(
                note.type,
              )}`}
            >
              <NoteTypeIcon type={note.type} className="size-3" />
              <span>{noteTypeLabels[note.type]} Note</span>
            </span>

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

            <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#161920] border border-[#232730] text-slate-300 flex items-center gap-1.5 font-medium">
              <NoteStatusGlyph status={note.status} />
              <span>
                {note.status === "OPEN"
                  ? "Open"
                  : note.status === "IN_PROGRESS"
                    ? "In Progress"
                    : "Done"}
              </span>
            </span>
          </div>

          {/* Three-dot menu */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              title="More options"
              aria-label="More options"
              aria-expanded={menuOpen}
              className="size-7 rounded-[6px] border border-[#232730] bg-[#161920] hover:bg-[#1E222B] hover:border-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
            >
              <MoreHorizontal className="size-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-44 rounded-lg border border-[#2b2c32] bg-[#131417] shadow-xl z-50 py-1 overflow-hidden">
                {/* Pin */}
                <button
                  type="button"
                  onClick={() => { onTogglePin(note.id); setMenuOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors cursor-pointer ${
                    isPinned
                      ? "text-purple-300 hover:bg-purple-950/40"
                      : "text-slate-300 hover:bg-[#1E222B] hover:text-white"
                  }`}
                >
                  <Pin
                    className={`size-3.5 shrink-0 ${isPinned ? "text-purple-400 fill-purple-400 rotate-45" : "text-slate-400"}`}
                  />
                  <span>{isPinned ? "Unpin Note" : "Pin Note"}</span>
                </button>

                {/* Edit — admin only */}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => { onEdit(note); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:bg-[#1E222B] hover:text-white transition-colors cursor-pointer"
                  >
                    <Pencil className="size-3.5 text-purple-400 shrink-0" />
                    <span>Edit Note</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Title, Component & Tags */}
        <div className="flex flex-col gap-2">
          <h1 className="text-lg md:text-xl font-bold text-white tracking-tight">
            {note.title}
          </h1>

          <div className="flex items-center gap-2 flex-wrap">
            {compFile && componentHref && (
              <Link
                href={componentHref}
                className="inline-flex items-center gap-1.5 text-xs font-mono text-purple-300 hover:text-purple-200 bg-purple-950/40 hover:bg-purple-900/40 border border-purple-800/40 px-2.5 py-0.5 rounded-full transition-colors group"
              >
                <Code2 className="size-3 text-purple-400" />
                <span>[{compFile}]</span>
                <ExternalLink className="size-3 text-purple-400 opacity-70 group-hover:opacity-100 transition-opacity" />
              </Link>
            )}

            {note.tags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {note.tags.map((tag) => (
                  <span
                    key={tag}
                    className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border shadow-2xs inline-flex items-center transition-colors ${getTagBadgeStyle(
                      tag,
                    )}`}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto py-4 pr-1 flex flex-col gap-5">
        {/* Description */}
        <ContentSection
          label="Description"
          color="text-slate-400"
          icon={<FileText className="size-3" />}
        >
          <NoteMarkdown
            content={note.content}
            attachmentUrls={note.attachmentUrls}
            isAdmin={isAdmin}
            onRemoveAttachment={onRemoveAttachment}
          />
        </ContentSection>

        {/* Dynamic Category Blocks */}
        {renderCategoryDynamicBlocks(note.type, typeData)}

        {/* Author & Timestamps */}
        <SectionDivider />
        <section className="text-xs text-slate-400 flex flex-col gap-2.5">
          <div className="flex items-center justify-between flex-wrap gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="size-6 rounded-full bg-purple-950/70 border border-purple-700/50 text-purple-300 text-[11px] font-semibold flex items-center justify-center shrink-0">
                {(note.author?.name || note.author?.email || "A").charAt(0).toUpperCase()}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Created by</span>
                <span className="text-slate-200 font-medium">
                  {note.author?.name || note.author?.email || "Unknown author"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-[11px] text-slate-400 font-mono">
              <span title={new Date(note.createdAt).toLocaleString()}>
                Created {relativeTime(note.createdAt)}
              </span>
              <span className="text-slate-600">•</span>
              <span title={new Date(note.updatedAt).toLocaleString()}>
                Updated {relativeTime(note.updatedAt)}
              </span>
            </div>
          </div>

          {note.lastEditedBy && (
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span className="text-slate-500">Last edited by</span>
              <span className="text-slate-300 font-medium">
                {note.lastEditedBy.name || note.lastEditedBy.email}
              </span>
            </div>
          )}
        </section>
      </div>

      {/* Docked Bottom Action Bar */}
      <div className="shrink-0 pt-3 border-t border-[#2b2c32] bg-[#151619] flex items-center justify-between gap-3 flex-wrap mt-auto">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
            Status:
          </span>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border shadow-2xs ${
              note.status === "DONE"
                ? "bg-emerald-950/60 text-emerald-300 border-emerald-700/50"
                : note.status === "IN_PROGRESS"
                  ? "bg-amber-950/60 text-amber-300 border-amber-700/50"
                  : "bg-sky-950/60 text-sky-300 border-sky-700/50"
            }`}
          >
            <NoteStatusGlyph status={note.status} />
            <span>
              {note.status === "OPEN"
                ? "Open"
                : note.status === "IN_PROGRESS"
                  ? "In Progress"
                  : "Done"}
            </span>
          </span>
        </div>

        {isAdmin ? (
          <div className="flex items-center gap-2">
            {note.status !== "DONE" ? (
              <button
                type="button"
                disabled={statusUpdating}
                onClick={() => onUpdateStatus?.(note.id, "DONE")}
                className="h-8 px-3.5 rounded-full bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-600/60 hover:border-emerald-500 text-emerald-300 hover:text-emerald-200 text-xs font-medium flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <Check className="size-3.5 text-emerald-400" />
                <span>Mark Done</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={statusUpdating}
                onClick={() => onUpdateStatus?.(note.id, "OPEN")}
                className="h-8 px-3.5 rounded-full bg-sky-950/60 hover:bg-sky-900/60 border border-sky-600/60 hover:border-sky-500 text-sky-300 hover:text-sky-200 text-xs font-medium flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="size-3.5 text-sky-400" />
                <span>Reopen Note</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onEdit(note)}
              className="h-8 px-3.5 rounded-full border border-[#2b2c32] bg-[#1a1c24] hover:bg-[#222530] hover:border-purple-600/50 text-slate-200 hover:text-white text-xs font-medium flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Pencil className="size-3 text-purple-400" />
              <span>Edit Note</span>
            </button>
          </div>
        ) : (
          <span className="text-xs text-slate-500 italic">Read-only view</span>
        )}
      </div>
    </div>
  );
}

function renderCategoryDynamicBlocks(type: NoteDto["type"], data: Record<string, unknown>) {
  switch (type) {
    case "BUG": {
      const steps = Array.isArray(data.steps) ? (data.steps as string[]) : [];
      const expected = typeof data.expectedBehavior === "string" ? data.expectedBehavior : "";
      const actual = typeof data.actualBehavior === "string" ? data.actualBehavior : "";

      if (!steps.length && !expected && !actual) return null;

      return (
        <>
          {steps.length > 0 && (
            <>
              <SectionDivider />
              <ContentSection
                label="Steps to Reproduce"
                color="text-purple-400"
                icon={<ListOrdered className="size-3.5" />}
              >
                <div className="flex flex-col gap-2.5 mt-0.5">
                  {steps.map((step, index) => (
                    <div key={index} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <span className="size-5 rounded-full bg-slate-800 text-purple-300 text-[11px] font-mono font-semibold flex items-center justify-center shrink-0 mt-0.5 border border-slate-700/60">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <NoteMarkdown content={step} fallbackText={null} />
                      </div>
                    </div>
                  ))}
                </div>
              </ContentSection>
            </>
          )}

          {expected && (
            <>
              <SectionDivider />
              <ContentSection label="Expected Behavior" color="text-emerald-400" icon={<Check className="size-3" />}>
                <NoteMarkdown content={expected} fallbackText={null} />
              </ContentSection>
            </>
          )}

          {actual && (
            <>
              <SectionDivider />
              <ContentSection label="Actual Behavior" color="text-red-400" icon={<AlertTriangle className="size-3" />}>
                <NoteMarkdown content={actual} fallbackText={null} />
              </ContentSection>
            </>
          )}
        </>
      );
    }

    case "IDEA": {
      const context = typeof data.context === "string" ? data.context : "";
      const desc = typeof data.description === "string" ? data.description : "";
      const benefit = typeof data.benefit === "string" ? data.benefit : "";

      if (!context && !desc && !benefit) return null;

      return (
        <>
          {context && (
            <>
              <SectionDivider />
              <ContentSection label="Context" color="text-amber-400">
                <NoteMarkdown content={context} fallbackText={null} />
              </ContentSection>
            </>
          )}
          {desc && (
            <>
              <SectionDivider />
              <ContentSection label="Detailed Description" color="text-amber-400">
                <NoteMarkdown content={desc} fallbackText={null} />
              </ContentSection>
            </>
          )}
          {benefit && (
            <>
              <SectionDivider />
              <ContentSection label="Expected Benefit" color="text-amber-400">
                <NoteMarkdown content={benefit} fallbackText={null} />
              </ContentSection>
            </>
          )}
        </>
      );
    }

    case "IMPROVEMENT": {
      const limitation = typeof data.currentLimitation === "string" ? data.currentLimitation : "";
      const proposal = typeof data.proposedImprovement === "string" ? data.proposedImprovement : "";
      const outcome = typeof data.expectedOutcome === "string" ? data.expectedOutcome : "";

      if (!limitation && !proposal && !outcome) return null;

      return (
        <>
          {limitation && (
            <>
              <SectionDivider />
              <ContentSection label="Current Limitation" color="text-blue-400">
                <NoteMarkdown content={limitation} fallbackText={null} />
              </ContentSection>
            </>
          )}
          {proposal && (
            <>
              <SectionDivider />
              <ContentSection label="Proposed Improvement" color="text-blue-400">
                <NoteMarkdown content={proposal} fallbackText={null} />
              </ContentSection>
            </>
          )}
          {outcome && (
            <>
              <SectionDivider />
              <ContentSection label="Expected Outcome" color="text-blue-400">
                <NoteMarkdown content={outcome} fallbackText={null} />
              </ContentSection>
            </>
          )}
        </>
      );
    }

    case "DECISION": {
      const techContext = typeof data.technicalContext === "string" ? data.technicalContext : "";
      const decision = typeof data.decision === "string" ? data.decision : "";
      const rationale = typeof data.rationale === "string" ? data.rationale : "";
      const consequences = typeof data.consequences === "string" ? data.consequences : "";

      if (!techContext && !decision && !rationale && !consequences) return null;

      return (
        <>
          {techContext && (
            <>
              <SectionDivider />
              <ContentSection label="Technical Context" color="text-purple-400" icon={<Settings className="size-3" />}>
                <NoteMarkdown content={techContext} fallbackText={null} />
              </ContentSection>
            </>
          )}
          {decision && (
            <>
              <SectionDivider />
              <ContentSection label="Decision" color="text-purple-400">
                <NoteMarkdown content={decision} fallbackText={null} />
              </ContentSection>
            </>
          )}
          {rationale && (
            <>
              <SectionDivider />
              <ContentSection label="Rationale" color="text-purple-400">
                <NoteMarkdown content={rationale} fallbackText={null} />
              </ContentSection>
            </>
          )}
          {consequences && (
            <>
              <SectionDivider />
              <ContentSection label="Consequences" color="text-purple-400">
                <NoteMarkdown content={consequences} fallbackText={null} />
              </ContentSection>
            </>
          )}
        </>
      );
    }

    case "CHANGELOG": {
      const desc = typeof data.changeDescription === "string" ? data.changeDescription : "";
      const context = typeof data.updateContext === "string" ? data.updateContext : "";

      if (!desc && !context) return null;

      return (
        <>
          {desc && (
            <>
              <SectionDivider />
              <ContentSection label="Change Description" color="text-emerald-400">
                <NoteMarkdown content={desc} fallbackText={null} />
              </ContentSection>
            </>
          )}
          {context && (
            <>
              <SectionDivider />
              <ContentSection label="Update Context" color="text-emerald-400">
                <NoteMarkdown content={context} fallbackText={null} />
              </ContentSection>
            </>
          )}
        </>
      );
    }
  }
}
