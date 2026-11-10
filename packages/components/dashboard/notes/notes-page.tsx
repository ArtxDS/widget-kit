"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useCurrentUser } from "../auth/use-current-user";
import type {
  CreateNoteInput,
  NoteDto,
  NoteStatus,
  NoteType,
  UpdateNoteInput,
} from "@/lib/notes";
import { createNote, deleteNoteAttachment, fetchNotes, updateNote } from "./api";
import { TelemetryBar, type StatusFilter } from "./telemetry-bar";
import { TriageStream, type SortOption } from "./triage-stream";
import { NoteInspector } from "./note-inspector";
import { NoteComposer } from "./note-composer";
import { NotesSkeleton } from "./notes-skeleton";

const PINNED_STORAGE_KEY = "wk_notes_pinned_ids";

export function NotesPage() {
  const { user: currentUser, loading: userLoading } = useCurrentUser();
  const isAdmin = currentUser?.role === "ADMIN";

  const [notes, setNotes] = useState<NoteDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<NoteType | "ALL">("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  const [mode, setMode] = useState<"view" | "compose">("view");
  const [editing, setEditing] = useState<NoteDto | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Client-side pinned note IDs
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = localStorage.getItem(PINNED_STORAGE_KEY);
      if (stored) {
        return new Set(JSON.parse(stored));
      }
    } catch {}
    return new Set();
  });

  function togglePin(id: string) {
    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        localStorage.setItem(
          PINNED_STORAGE_KEY,
          JSON.stringify(Array.from(next)),
        );
      } catch {}
      return next;
    });
  }

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchNotes();
      setNotes(data);
      if (data.length > 0) {
        setSelectedId((current) =>
          current && data.some((n) => n.id === current) ? current : data[0].id,
        );
      } else {
        setSelectedId(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  // Telemetry counts
  const telemetry = useMemo(() => {
    let openCount = 0;
    let inProgressCount = 0;
    let doneCount = 0;
    let pinnedCount = 0;

    for (const note of notes) {
      if (note.status === "OPEN") openCount++;
      else if (note.status === "IN_PROGRESS") inProgressCount++;
      else if (note.status === "DONE") doneCount++;

      if (pinnedIds.has(note.id)) pinnedCount++;
    }

    return {
      total: notes.length,
      openCount,
      inProgressCount,
      doneCount,
      pinnedCount,
    };
  }, [notes, pinnedIds]);

  // Filtered & sorted notes
  const displayedNotes = useMemo(() => {
    const filtered = notes.filter((note) => {
      // Telemetry status pill filter
      if (statusFilter === "OPEN" && note.status !== "OPEN") return false;
      if (statusFilter === "IN_PROGRESS" && note.status !== "IN_PROGRESS")
        return false;
      if (statusFilter === "DONE" && note.status !== "DONE") return false;
      if (statusFilter === "PINNED" && !pinnedIds.has(note.id)) return false;

      // Category filter dropdown
      if (categoryFilter !== "ALL" && note.type !== categoryFilter)
        return false;

      return true;
    });

    // Sorting
    return [...filtered].sort((a, b) => {
      if (sortBy === "newest") {
        return (
          new Date(b.updatedAt || b.createdAt).getTime() -
          new Date(a.updatedAt || a.createdAt).getTime()
        );
      }
      if (sortBy === "oldest") {
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      }
      if (sortBy === "priority") {
        const priorityOrder: Record<string, number> = { P1: 1, P2: 2, P3: 3 };
        const orderA = a.priority ? (priorityOrder[a.priority] ?? 4) : 5;
        const orderB = b.priority ? (priorityOrder[b.priority] ?? 4) : 5;
        return orderA - orderB;
      }
      if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [notes, statusFilter, categoryFilter, pinnedIds, sortBy]);

  // Selected note: find from notes list, fallback to first displayed note
  const selectedNote = useMemo(() => {
    if (selectedId) {
      const found = notes.find((note) => note.id === selectedId);
      if (found) return found;
    }
    return displayedNotes[0] ?? null;
  }, [notes, selectedId, displayedNotes]);

  function startCreate() {
    setEditing(null);
    setSaveError(null);
    setMode("compose");
  }

  function startEdit(note: NoteDto) {
    setEditing(note);
    setSaveError(null);
    setMode("compose");
  }

  function cancelCompose() {
    setEditing(null);
    setSaveError(null);
    setMode("view");
  }

  async function handleCreate(payload: CreateNoteInput | UpdateNoteInput) {
    setSaving(true);
    setSaveError(null);
    try {
      const created = await createNote(payload as CreateNoteInput);
      setNotes((current) => [created, ...current]);
      setSelectedId(created.id);
      setMode("view");
      setEditing(null);
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Failed to create note.",
      );
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(payload: CreateNoteInput | UpdateNoteInput) {
    if (!editing) return;
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await updateNote(editing.id, payload as UpdateNoteInput);
      setNotes((current) =>
        current.map((n) => (n.id === updated.id ? updated : n)),
      );
      setSelectedId(updated.id);
      setMode("view");
      setEditing(null);
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Failed to update note.",
      );
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(noteId: string, nextStatus: NoteStatus) {
    setStatusUpdating(true);
    try {
      const updated = await updateNote(noteId, { status: nextStatus });
      setNotes((current) =>
        current.map((n) => (n.id === updated.id ? updated : n)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status.");
    } finally {
      setStatusUpdating(false);
    }
  }

  async function handleRemoveAttachment(storageUriOrPath: string) {
    if (!selectedNote || !isAdmin) return;
    try {
      const updated = await deleteNoteAttachment(
        selectedNote.id,
        storageUriOrPath,
      );
      setNotes((current) =>
        current.map((n) => (n.id === updated.id ? updated : n)),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to remove image attachment.",
      );
    }
  }

  if (userLoading || loading) {
    return <NotesSkeleton />;
  }

  // When no note is created, or none selected, or when in compose mode: show the composer form!
  const shouldShowComposer =
    mode === "compose" ||
    editing !== null ||
    notes.length === 0 ||
    selectedNote === null;

  return (
    <div className="w-full flex-1 flex flex-col gap-2.5 h-full min-h-0">
      {/* Telemetry HUD Bar */}
      <TelemetryBar
        totalCount={telemetry.total}
        openCount={telemetry.openCount}
        inProgressCount={telemetry.inProgressCount}
        doneCount={telemetry.doneCount}
        pinnedCount={telemetry.pinnedCount}
        activeFilter={statusFilter}
        onSelectFilter={setStatusFilter}
      />

      {/* Main Content Area: 2-Pane Split Master-Detail Layout */}
      {error ? (
        <div className="p-6 rounded-xl border border-red-800/60 bg-red-950/30 flex flex-col items-center gap-3 text-center my-auto">
          <p className="text-red-300 text-sm font-medium">{error}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="h-8 px-4 rounded-md border border-[#232730] bg-[#161920] hover:bg-[#1E222B] text-slate-200 text-xs transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[40%_60%] gap-4 pb-3 h-full items-stretch">
          {/* Left Pane: Triage Stream (40%) */}
          <div className="border border-[#2b2c32] rounded-xl bg-[#151619] p-4 min-w-0 shadow-sm flex flex-col h-full overflow-hidden">
            <TriageStream
              notes={displayedNotes}
              selectedId={selectedNote?.id ?? null}
              onSelectNote={(id) => {
                setSelectedId(id);
                setMode("view");
                setEditing(null);
              }}
              sortBy={sortBy}
              onSortChange={setSortBy}
              categoryFilter={categoryFilter}
              onCategoryChange={setCategoryFilter}
              onNewNote={startCreate}
              canCreate={isAdmin}
            />
          </div>

          {/* Right Pane: Inspector or Composer (60%) */}
          <div className="border border-[#2b2c32] rounded-xl bg-[#151619] p-5 min-w-0 shadow-sm flex flex-col h-full overflow-hidden relative">
            {shouldShowComposer ? (
              !isAdmin && notes.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 text-xs text-center min-h-[300px]">
                  <span>
                    No technical notes available yet. Notes will appear here
                    once published by administrators.
                  </span>
                </div>
              ) : (
                <div className="flex flex-col h-full min-h-0">
                  {notes.length > 0 && selectedNote && mode === "compose" && (
                    <button
                      type="button"
                      onClick={cancelCompose}
                      className="mb-3 inline-flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-white transition-colors"
                    >
                      <ArrowLeft className="size-3.5" />
                      <span>Back to note view</span>
                    </button>
                  )}

                  <NoteComposer
                    key={editing?.id ?? "new"}
                    initial={editing}
                    saving={saving}
                    error={saveError}
                    onCancel={cancelCompose}
                    onSubmit={editing ? handleUpdate : handleCreate}
                    isAdmin={isAdmin}
                  />
                </div>
              )
            ) : selectedNote ? (
              <NoteInspector
                note={selectedNote}
                isAdmin={isAdmin}
                isPinned={pinnedIds.has(selectedNote.id)}
                onTogglePin={togglePin}
                onEdit={startEdit}
                onUpdateStatus={handleStatusChange}
                statusUpdating={statusUpdating}
                onRemoveAttachment={handleRemoveAttachment}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 text-xs text-center min-h-[300px]">
                <span>Select a note from the stream to inspect details.</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
