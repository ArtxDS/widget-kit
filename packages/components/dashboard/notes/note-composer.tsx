"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Code,
  Link2,
  Image as ImageIcon,
  Loader2,
  List,
  ListOrdered,
  Quote,
  Plus,
  X,
  Code2,
  Eye,
  PenLine,
} from "lucide-react";
import {
  notePriorities,
  noteTypes,
  noteTypeLabels,
  type CreateNoteInput,
  type NoteDto,
  type NotePriority,
  type NoteStatus,
  type NoteType,
  type UpdateNoteInput,
} from "@/lib/notes";
import { components, widgets } from "@/lib/catalog";
import { NoteMarkdown } from "./markdown-view";
import { uploadNoteAttachment } from "./api";
import { Dropdown } from "../shared/dropdown";
import { getTagBadgeStyle } from "./triage-stream";

type TypeData = Record<string, unknown>;

const initialDefaultTypeData: Record<NoteType, TypeData> = {
  BUG: {
    steps: [""],
    expectedBehavior: "",
    actualBehavior: "",
  },
  IDEA: {
    context: "",
    description: "",
    benefit: "",
  },
  IMPROVEMENT: {
    currentLimitation: "",
    proposedImprovement: "",
    expectedOutcome: "",
  },
  DECISION: {
    technicalContext: "",
    decision: "",
    rationale: "",
    consequences: "",
  },
  CHANGELOG: {
    changeDescription: "",
    updateContext: "",
  },
};

export type ComposerSubmit = (
  payload: CreateNoteInput | UpdateNoteInput,
) => Promise<void>;

type NoteComposerProps = {
  initial?: NoteDto | null;
  saving: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: ComposerSubmit;
  isAdmin?: boolean;
};

const SUGGESTED_TAGS = [
  "frontend",
  "safari",
  "performance",
  "ui",
  "dx",
  "mobile",
  "state",
  "accessibility",
];

export function NoteComposer({
  initial,
  saving,
  error,
  onCancel,
  onSubmit,
  isAdmin = true,
}: NoteComposerProps) {
  const [fallbackId] = useState(() =>
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : "draft-note-1",
  );
  const noteId = initial?.id || fallbackId;

  const [attachmentUrls, setAttachmentUrls] = useState<Record<string, string>>(
    () => initial?.attachmentUrls ?? {},
  );
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [type, setType] = useState<NoteType>(initial?.type ?? "BUG");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [componentSlug, setComponentSlug] = useState<string | null>(
    initial?.componentSlug ?? null,
  );
  const [content, setContent] = useState(initial?.content ?? "");
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [priority, setPriority] = useState<NotePriority | "">(
    initial?.priority ?? "P1",
  );
  const [status, setStatus] = useState<NoteStatus>(initial?.status ?? "OPEN");

  // Keep a map of data for each type so switching types NEVER loses entered data
  const [allTypeData, setAllTypeData] = useState<Record<NoteType, TypeData>>(() => {
    const base = { ...initialDefaultTypeData };
    if (initial?.type && initial.typeData) {
      base[initial.type] = {
        ...base[initial.type],
        ...initial.typeData,
      };
    }
    return base;
  });

  const [validationError, setValidationError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const currentTypeData = allTypeData[type] ?? initialDefaultTypeData[type];

  function updateTypeDataField(field: string, value: unknown) {
    setAllTypeData((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value,
      },
    }));
  }

  function addStep() {
    const currentSteps = Array.isArray(currentTypeData.steps)
      ? (currentTypeData.steps as string[])
      : [];
    updateTypeDataField("steps", [...currentSteps, ""]);
  }

  function updateStep(index: number, value: string) {
    const currentSteps = Array.isArray(currentTypeData.steps)
      ? [...(currentTypeData.steps as string[])]
      : [];
    currentSteps[index] = value;
    updateTypeDataField("steps", currentSteps);
  }

  function removeStep(index: number) {
    const currentSteps = Array.isArray(currentTypeData.steps)
      ? [...(currentTypeData.steps as string[])]
      : [];
    currentSteps.splice(index, 1);
    updateTypeDataField("steps", currentSteps);
  }

  function addTag() {
    const normalized = tagInput.trim().toLowerCase().replace(/^#/, "");
    if (!normalized) return;
    if (tags.includes(normalized)) {
      setTagInput("");
      return;
    }
    setTags((current) => [...current, normalized]);
    setTagInput("");
  }

  function removeTag(tag: string) {
    setTags((current) => current.filter((item) => item !== tag));
  }

  function insertMarkdown(wrap: string, placeholder = "") {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const selected = content.slice(start, end) || placeholder;
    const next =
      content.slice(0, start) + wrap.replace("{}", selected) + content.slice(end);
    setContent(next);
    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + wrap.replace("{}", selected).length;
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  async function handleFileUpload(file: File) {
    if (!isAdmin) {
      setUploadError("Only administrators can upload images.");
      return;
    }

    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    const allowedExts = [".png", ".jpg", ".jpeg"];
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];

    if (!allowedExts.includes(ext) && !allowedTypes.includes(file.type)) {
      setUploadError(
        "Invalid file format: only PNG and JPG/JPEG images are allowed.",
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File size exceeds 5 MB limit.");
      return;
    }

    setUploadingImage(true);
    setUploadError(null);

    try {
      const result = await uploadNoteAttachment(noteId, file);
      setAttachmentUrls((prev) => ({
        ...prev,
        [result.storageUri]: result.signedUrl,
        [result.path]: result.signedUrl,
      }));

      const cleanAlt = file.name.replace(/\.[^/.]+$/, "").trim() || "Image";
      const imageMarkdown = `![${cleanAlt}](${result.storageUri})\n\n`;

      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart ?? content.length;
        const end = textarea.selectionEnd ?? content.length;
        const next =
          content.slice(0, start) + imageMarkdown + content.slice(end);
        setContent(next);
        requestAnimationFrame(() => {
          textarea.focus();
          const nextCursor = start + imageMarkdown.length;
          textarea.setSelectionRange(nextCursor, nextCursor);
        });
      } else {
        setContent((prev) => (prev ? `${prev}\n\n${imageMarkdown}` : imageMarkdown));
      }
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Failed to upload image.",
      );
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  // Keyboard shortcut ⌘ + Enter
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        formRef.current?.requestSubmit();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setValidationError(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setValidationError("Title is required.");
      return;
    }

    // Clean up empty steps for BUG
    const effectiveTypeData = { ...currentTypeData };
    if (type === "BUG" && Array.isArray(effectiveTypeData.steps)) {
      effectiveTypeData.steps = (effectiveTypeData.steps as string[])
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    }

    const payload: CreateNoteInput | UpdateNoteInput = {
      ...(initial ? {} : { id: noteId }),
      title: trimmedTitle,
      type,
      content,
      typeData: effectiveTypeData,
      tags,
      componentSlug: componentSlug || null,
      priority: priority || null,
      status,
    };

    try {
      await onSubmit(payload);
    } catch (submitError) {
      setValidationError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to save note.",
      );
    }
  }

  // Component options from catalog
  const catalogOptions = [
    { label: "None (General)", value: "" },
    ...components.map((c) => ({
      label: `${c.name}.tsx`,
      value: c.slug,
    })),
    ...widgets.map((w) => ({
      label: `${w.name}.tsx`,
      value: w.slug,
    })),
  ];

  return (
    <form
      ref={formRef}
      id="note-composer-form"
      onSubmit={handleSubmit}
      className="flex flex-col h-full min-h-0"
    >
      {/* Clean minimal header */}
      <div className="shrink-0 flex items-center justify-between gap-3 flex-wrap pb-2.5 border-b border-[#2b2c32]">
        <div>
          <h2 className="text-[15px] font-bold text-white tracking-tight">
            {initial ? "Edit note" : "New note"}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Capture a bug, idea, or feedback for the team.
          </p>
        </div>
      </div>

      {/* Scrollable form body */}
      <div className="flex-1 min-h-0 overflow-y-auto py-3 pr-1 flex flex-col gap-4">
        {/* Category clickable pill badges (matching Telemetry bar pattern) */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">
          Category
        </label>
        <div className="flex items-center gap-2 flex-wrap">
          {noteTypes.map((t) => {
            const isSelected = type === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                aria-pressed={isSelected}
                className={`h-7 px-3 rounded-full text-[11px] font-medium border transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? t === "BUG"
                      ? "bg-rose-950/60 text-rose-300 border-rose-600/70 shadow-sm"
                      : t === "IDEA"
                        ? "bg-amber-950/60 text-amber-300 border-amber-600/70 shadow-sm"
                        : t === "IMPROVEMENT"
                          ? "bg-sky-950/60 text-sky-300 border-sky-600/70 shadow-sm"
                          : t === "DECISION"
                            ? "bg-purple-950/60 text-purple-300 border-purple-600/70 shadow-sm"
                            : "bg-emerald-950/60 text-emerald-300 border-emerald-600/70 shadow-sm"
                    : "bg-[#161920]/60 text-slate-400 border-[#232730] hover:text-white hover:border-slate-700"
                }`}
              >
                <span
                  className={`size-1.5 rounded-full ${
                    t === "BUG"
                      ? "bg-rose-400"
                      : t === "IDEA"
                        ? "bg-amber-400"
                        : t === "IMPROVEMENT"
                          ? "bg-sky-400"
                          : t === "DECISION"
                            ? "bg-purple-400"
                            : "bg-emerald-400"
                  }`}
                />
                <span>{noteTypeLabels[t]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="note-title-input" className="text-[11px] font-semibold text-slate-300">
          Title
        </label>
        <input
          id="note-title-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Button onClick not firing in Safari 17"
          className="h-9 px-3 rounded-lg border border-[#232730] bg-[#141620]/60 text-xs text-slate-100 placeholder:text-[#64687a] outline-none focus:border-purple-500/70 focus:bg-[#161824] transition-all"
        />
      </div>

      {/* Context row: Component, Priority, Status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Component */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-slate-300">
            Component
          </label>
          <Dropdown
            label="Select related component"
            value={componentSlug ?? ""}
            options={catalogOptions}
            onChange={(val) => setComponentSlug(val || null)}
            className="w-full [&_.dropdown-trigger]:min-h-[32px] [&_.dropdown-trigger]:h-[32px] [&_.dropdown-trigger]:px-3 [&_.dropdown-trigger]:text-xs [&_.dropdown-trigger]:rounded-lg [&_.dropdown-trigger]:border-[#232730] [&_.dropdown-trigger]:bg-[#141620]/60"
          />
        </div>

        {/* Priority pill badges */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-slate-300">
            Priority
          </label>
          <div className="flex items-center gap-1.5 h-8">
            {notePriorities.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(priority === p ? "" : p)}
                aria-pressed={priority === p}
                className={`h-7 px-2.5 rounded-full text-[11px] font-mono font-semibold border transition-all flex items-center gap-1 cursor-pointer ${
                  priority === p
                    ? p === "P1"
                      ? "bg-rose-950/60 text-rose-300 border-rose-600/70 shadow-sm"
                      : p === "P2"
                        ? "bg-amber-950/60 text-amber-300 border-amber-600/70 shadow-sm"
                        : "bg-slate-800 text-slate-200 border-slate-600 shadow-sm"
                    : "bg-[#161920]/60 text-slate-500 border-[#232730] hover:text-slate-300 hover:border-slate-700"
                }`}
              >
                <span
                  className={`size-1.5 rounded-full ${
                    p === "P1"
                      ? "bg-rose-400"
                      : p === "P2"
                        ? "bg-amber-400"
                        : "bg-slate-400"
                  }`}
                />
                <span>{p}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-slate-300">
            Status
          </label>
          <Dropdown
            label="Note status"
            value={status}
            options={[
              { label: "Open", value: "OPEN" },
              { label: "In Progress", value: "IN_PROGRESS" },
              { label: "Done", value: "DONE" },
            ]}
            onChange={(val) => setStatus(val as NoteStatus)}
            className="w-full [&_.dropdown-trigger]:min-h-[32px] [&_.dropdown-trigger]:h-[32px] [&_.dropdown-trigger]:px-3 [&_.dropdown-trigger]:text-xs [&_.dropdown-trigger]:rounded-lg [&_.dropdown-trigger]:border-[#232730] [&_.dropdown-trigger]:bg-[#141620]/60"
          />
        </div>
      </div>

      {/* Description / Markdown Editor */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-semibold text-slate-300">
            Description
          </label>
          {/* Modern Segmented Write/Preview Switch (fixed borders to avoid size shifts) */}
          <div className="inline-flex items-center p-0.5 bg-[#141620]/60 border border-[#232730] rounded-lg">
            <button
              type="button"
              onClick={() => setShowPreview(false)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-[6px] text-xs font-medium transition-all cursor-pointer border ${
                !showPreview
                  ? "bg-[#222536] text-white shadow-xs border-[#33374d]"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <PenLine className="size-3" />
              <span>Write</span>
            </button>
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-[6px] text-xs font-medium transition-all cursor-pointer border ${
                showPreview
                  ? "bg-[#222536] text-white shadow-xs border-[#33374d]"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Eye className="size-3" />
              <span>Preview</span>
            </button>
          </div>
        </div>

        {/* Unified Editor Container — fixed header height prevents layout jump */}
        <div
          onDragOver={(e) => {
            if (isAdmin && e.dataTransfer.types.includes("Files")) {
              e.preventDefault();
              setIsDragging(true);
            }
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            if (isAdmin) {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) void handleFileUpload(file);
            }
          }}
          className={`rounded-lg border ${
            isDragging
              ? "border-purple-500 bg-purple-950/20"
              : "border-[#232730] bg-[#141620]/60"
          } overflow-hidden flex flex-col focus-within:border-purple-500/70 focus-within:bg-[#161824] transition-all`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFileUpload(file);
            }}
            className="hidden"
          />

          <div className="h-9 px-2 flex items-center justify-between border-b border-[#232730] bg-[#161920]/80 shrink-0">
            {!showPreview ? (
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => insertMarkdown("**{}**", "bold text")}
                  title="Bold"
                  className="size-7 rounded-md hover:bg-[#202436] hover:text-white text-slate-300 transition-colors flex items-center justify-center cursor-pointer"
                >
                  <Bold className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown("*{}*", "italic text")}
                  title="Italic"
                  className="size-7 rounded-md hover:bg-[#202436] hover:text-white text-slate-300 transition-colors flex items-center justify-center cursor-pointer"
                >
                  <Italic className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown("`{}`", "code")}
                  title="Inline Code"
                  className="size-7 rounded-md hover:bg-[#202436] hover:text-white text-slate-300 transition-colors flex items-center justify-center cursor-pointer"
                >
                  <Code className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown("[{}](https://...)", "link text")}
                  title="Link"
                  className="size-7 rounded-md hover:bg-[#202436] hover:text-white text-slate-300 transition-colors flex items-center justify-center cursor-pointer"
                >
                  <Link2 className="size-3.5" />
                </button>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    title="Attach image (PNG, JPG, max 5MB)"
                    aria-label="Attach image"
                    className="size-7 rounded-md hover:bg-[#202436] hover:text-white text-slate-300 disabled:opacity-50 transition-colors flex items-center justify-center cursor-pointer"
                  >
                    {uploadingImage ? (
                      <Loader2 className="size-3.5 animate-spin text-purple-400" />
                    ) : (
                      <ImageIcon className="size-3.5" />
                    )}
                  </button>
                )}

                <span className="w-px h-3.5 bg-[#2d323e] mx-1" />
                <button
                  type="button"
                  onClick={() => insertMarkdown("- {}", "list item")}
                  title="Bullet list"
                  className="size-7 rounded-md hover:bg-[#202436] hover:text-white text-slate-300 transition-colors flex items-center justify-center cursor-pointer"
                >
                  <List className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown("1. {}", "list item")}
                  title="Numbered list"
                  className="size-7 rounded-md hover:bg-[#202436] hover:text-white text-slate-300 transition-colors flex items-center justify-center cursor-pointer"
                >
                  <ListOrdered className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown("> {}", "quote")}
                  title="Blockquote"
                  className="size-7 rounded-md hover:bg-[#202436] hover:text-white text-slate-300 transition-colors flex items-center justify-center cursor-pointer"
                >
                  <Quote className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown("```tsx\n{}\n```", "// code here")}
                  title="Code block"
                  className="px-2.5 h-7 rounded-md text-xs font-mono hover:bg-[#202436] hover:text-white text-slate-300 transition-colors flex items-center gap-1.5 border border-transparent hover:border-[#2f354b] cursor-pointer"
                >
                  <Code2 className="size-3.5" />
                  <span>tsx</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <Eye className="size-3.5 text-purple-400" />
                <span className="font-medium text-slate-300">Markdown Preview</span>
                <span className="text-slate-500">• Formatted output</span>
              </div>
            )}
          </div>

          {showPreview ? (
            <div className="h-[150px] p-3 text-slate-200 text-xs overflow-y-auto">
              <NoteMarkdown
                content={content}
                attachmentUrls={attachmentUrls}
                isAdmin={isAdmin}
              />
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write markdown description with details, code snippets, or context..."
              className="w-full h-[150px] p-3 text-xs/relaxed font-mono text-slate-200 placeholder:text-[#64687a] outline-none bg-transparent resize-y"
            />
          )}
        </div>

        {uploadError && (
          <p className="text-[11px] text-red-400 mt-1">{uploadError}</p>
        )}
      </div>

      {/* Dynamic Fields per Category — Flat, minimalist and integrated */}
      {type === "BUG" && (
        <div className="flex flex-col gap-3.5">
          {/* Steps to Reproduce */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-300">
                Steps to Reproduce
              </label>
              <button
                type="button"
                onClick={addStep}
                className="text-[11px] font-medium text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="size-3" />
                <span>Add step</span>
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              {((currentTypeData.steps as string[]) ?? []).map((step, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="size-6 rounded-md bg-[#161920] border border-[#232730] text-[11px] font-mono text-slate-400 flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <input
                    value={step}
                    onChange={(e) => updateStep(idx, e.target.value)}
                    placeholder={`Step ${idx + 1}...`}
                    className="flex-1 h-8 px-3 rounded-lg border border-[#232730] bg-[#141620]/60 text-xs text-slate-200 placeholder:text-[#64687a] outline-none focus:border-purple-500/70 focus:bg-[#161824] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => removeStep(idx)}
                    title="Remove step"
                    className="size-7 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Expected & Actual Behavior — Clean flat design with color dots */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-300">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                <span>Expected Behavior</span>
              </div>
              <textarea
                value={(currentTypeData.expectedBehavior as string) ?? ""}
                onChange={(e) => updateTypeDataField("expectedBehavior", e.target.value)}
                rows={2}
                placeholder="What was expected to happen..."
                className="w-full px-3 py-2 rounded-lg border border-[#232730] bg-[#141620]/60 text-xs text-slate-200 placeholder:text-[#64687a] outline-none focus:border-purple-500/70 focus:bg-[#161824] transition-all resize-y"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-300">
                <span className="size-1.5 rounded-full bg-rose-400" />
                <span>Actual Behavior</span>
              </div>
              <textarea
                value={(currentTypeData.actualBehavior as string) ?? ""}
                onChange={(e) => updateTypeDataField("actualBehavior", e.target.value)}
                rows={2}
                placeholder="What actually occurred..."
                className="w-full px-3 py-2 rounded-lg border border-[#232730] bg-[#141620]/60 text-xs text-slate-200 placeholder:text-[#64687a] outline-none focus:border-purple-500/70 focus:bg-[#161824] transition-all resize-y"
              />
            </div>
          </div>
        </div>
      )}

      {type === "IDEA" && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-slate-300">Context</label>
            <textarea
              value={(currentTypeData.context as string) ?? ""}
              onChange={(e) => updateTypeDataField("context", e.target.value)}
              rows={2}
              placeholder="Background or reason behind this idea..."
              className="w-full px-3 py-2 rounded-lg border border-[#232730] bg-[#141620]/60 text-xs text-slate-200 placeholder:text-[#64687a] outline-none focus:border-purple-500/70 focus:bg-[#161824] transition-all resize-y"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-slate-300">Description</label>
            <textarea
              value={(currentTypeData.description as string) ?? ""}
              onChange={(e) => updateTypeDataField("description", e.target.value)}
              rows={2}
              placeholder="Detailed idea description..."
              className="w-full px-3 py-2 rounded-lg border border-[#232730] bg-[#141620]/60 text-xs text-slate-200 placeholder:text-[#64687a] outline-none focus:border-purple-500/70 focus:bg-[#161824] transition-all resize-y"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-slate-300">Expected Benefit</label>
            <textarea
              value={(currentTypeData.benefit as string) ?? ""}
              onChange={(e) => updateTypeDataField("benefit", e.target.value)}
              rows={2}
              placeholder="How does this improve developer experience, performance, or users?"
              className="w-full px-3 py-2 rounded-lg border border-[#232730] bg-[#141620]/60 text-xs text-slate-200 placeholder:text-[#64687a] outline-none focus:border-purple-500/70 focus:bg-[#161824] transition-all resize-y"
            />
          </div>
        </div>
      )}

      {type === "IMPROVEMENT" && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-slate-300">
              Current Problem / Limitation
            </label>
            <textarea
              value={(currentTypeData.currentLimitation as string) ?? ""}
              onChange={(e) => updateTypeDataField("currentLimitation", e.target.value)}
              rows={2}
              placeholder="What is the bottleneck or limitation today?"
              className="w-full px-3 py-2 rounded-lg border border-[#232730] bg-[#141620]/60 text-xs text-slate-200 placeholder:text-[#64687a] outline-none focus:border-purple-500/70 focus:bg-[#161824] transition-all resize-y"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-slate-300">
              Proposed Improvement
            </label>
            <textarea
              value={(currentTypeData.proposedImprovement as string) ?? ""}
              onChange={(e) => updateTypeDataField("proposedImprovement", e.target.value)}
              rows={2}
              placeholder="What changes or optimizations are proposed?"
              className="w-full px-3 py-2 rounded-lg border border-[#232730] bg-[#141620]/60 text-xs text-slate-200 placeholder:text-[#64687a] outline-none focus:border-purple-500/70 focus:bg-[#161824] transition-all resize-y"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-slate-300">
              Expected Outcome
            </label>
            <textarea
              value={(currentTypeData.expectedOutcome as string) ?? ""}
              onChange={(e) => updateTypeDataField("expectedOutcome", e.target.value)}
              rows={2}
              placeholder="Expected metrics, benchmark, or UX outcome..."
              className="w-full px-3 py-2 rounded-lg border border-[#232730] bg-[#141620]/60 text-xs text-slate-200 placeholder:text-[#64687a] outline-none focus:border-purple-500/70 focus:bg-[#161824] transition-all resize-y"
            />
          </div>
        </div>
      )}

      {type === "DECISION" && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-slate-300">
              Technical Context
            </label>
            <textarea
              value={(currentTypeData.technicalContext as string) ?? ""}
              onChange={(e) => updateTypeDataField("technicalContext", e.target.value)}
              rows={2}
              placeholder="Technical context, constraints, dependencies..."
              className="w-full px-3 py-2 rounded-lg border border-[#232730] bg-[#141620]/60 text-xs text-slate-200 placeholder:text-[#64687a] outline-none focus:border-purple-500/70 focus:bg-[#161824] transition-all resize-y"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-slate-300">Decision</label>
            <textarea
              value={(currentTypeData.decision as string) ?? ""}
              onChange={(e) => updateTypeDataField("decision", e.target.value)}
              rows={2}
              placeholder="What decision was reached?"
              className="w-full px-3 py-2 rounded-lg border border-[#232730] bg-[#141620]/60 text-xs text-slate-200 placeholder:text-[#64687a] outline-none focus:border-purple-500/70 focus:bg-[#161824] transition-all resize-y"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-slate-300">Rationale</label>
            <textarea
              value={(currentTypeData.rationale as string) ?? ""}
              onChange={(e) => updateTypeDataField("rationale", e.target.value)}
              rows={2}
              placeholder="Why was this chosen over alternatives?"
              className="w-full px-3 py-2 rounded-lg border border-[#232730] bg-[#141620]/60 text-xs text-slate-200 placeholder:text-[#64687a] outline-none focus:border-purple-500/70 focus:bg-[#161824] transition-all resize-y"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-slate-300">
              Consequences
            </label>
            <textarea
              value={(currentTypeData.consequences as string) ?? ""}
              onChange={(e) => updateTypeDataField("consequences", e.target.value)}
              rows={2}
              placeholder="Trade-offs, future impact, or migration required..."
              className="w-full px-3 py-2 rounded-lg border border-[#232730] bg-[#141620]/60 text-xs text-slate-200 placeholder:text-[#64687a] outline-none focus:border-purple-500/70 focus:bg-[#161824] transition-all resize-y"
            />
          </div>
        </div>
      )}

      {type === "CHANGELOG" && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-slate-300">
              Change Description
            </label>
            <textarea
              value={(currentTypeData.changeDescription as string) ?? ""}
              onChange={(e) => updateTypeDataField("changeDescription", e.target.value)}
              rows={2}
              placeholder="Summary of changes included in this release..."
              className="w-full px-3 py-2 rounded-lg border border-[#232730] bg-[#141620]/60 text-xs text-slate-200 placeholder:text-[#64687a] outline-none focus:border-purple-500/70 focus:bg-[#161824] transition-all resize-y"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-slate-300">
              Update Context
            </label>
            <textarea
              value={(currentTypeData.updateContext as string) ?? ""}
              onChange={(e) => updateTypeDataField("updateContext", e.target.value)}
              rows={2}
              placeholder="Version tag, related pull requests, or notes..."
              className="w-full px-3 py-2 rounded-lg border border-[#232730] bg-[#141620]/60 text-xs text-slate-200 placeholder:text-[#64687a] outline-none focus:border-purple-500/70 focus:bg-[#161824] transition-all resize-y"
            />
          </div>
        </div>
      )}

      {/* Tags: Compact input bar + Suggestion tags pills */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-semibold text-slate-300">Tags</label>
        <div className="flex items-center gap-1.5 flex-wrap min-h-[34px] px-2.5 py-1 rounded-lg border border-[#232730] bg-[#141620]/60">
          {tags.map((tag) => (
            <span
              key={tag}
              className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full border font-medium shadow-2xs transition-colors ${getTagBadgeStyle(
                tag,
              )}`}
            >
              <span>#{tag}</span>
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="opacity-70 hover:opacity-100 hover:text-white transition-opacity cursor-pointer"
                aria-label={`Remove tag ${tag}`}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}

          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addTag();
              }
            }}
            onBlur={addTag}
            placeholder={tags.length === 0 ? "Add tags (press Enter)..." : "Add more..."}
            className="flex-1 min-w-[100px] h-6 bg-transparent border-0 outline-none text-xs text-slate-100 placeholder:text-[#64687a]"
          />
        </div>

        {/* Clickable suggested tags */}
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          <span className="text-[10px] text-slate-500 font-medium">Suggestions:</span>
          {SUGGESTED_TAGS.filter((st) => !tags.includes(st))
            .slice(0, 6)
            .map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setTags((prev) => [...prev, st])}
                className="text-[10px] px-2 py-0.5 rounded-full border border-[#232730] bg-[#161920]/40 text-slate-400 hover:text-purple-300 hover:border-purple-600/50 hover:bg-purple-950/30 transition-all cursor-pointer flex items-center gap-0.5"
              >
                <span>+{st}</span>
              </button>
            ))}
        </div>
      </div>

      {/* Error state */}
      {(validationError || error) && (
        <div className="p-3 rounded-lg bg-red-950/50 border border-red-800/60 text-xs text-red-300">
          {validationError ?? error}
        </div>
      )}

      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-[#2b2c32] pt-3.5 bg-[#151619] mt-auto flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[11px] text-slate-500 hidden sm:inline-flex items-center gap-1.5">
          Press <kbd className="px-1.5 py-0.5 rounded bg-[#161824] border border-[#282c3f] text-slate-400 font-mono text-[10px]">⌘</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-[#161824] border border-[#282c3f] text-slate-400 font-mono text-[10px]">Enter</kbd> to save
        </span>

        <div className="flex items-center gap-2.5 ml-auto">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="h-9 px-4 rounded-lg border border-[#2a2e40] bg-[#141622] hover:bg-[#1c1f30] hover:border-slate-500/60 text-slate-300 hover:text-white text-xs font-medium transition-all cursor-pointer"
          >
            Discard
          </button>

          <button
            type="submit"
            disabled={saving}
            className="h-9 px-4 rounded-lg bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-purple-950/60 hover:shadow-purple-900/80 active:scale-[0.99] transition-all cursor-pointer"
          >
            <span>{saving ? "Saving..." : initial ? "Save Changes" : "Create Note"}</span>
            <kbd className="font-mono text-[10px] bg-black/30 border border-white/20 text-white/90 px-1.5 py-0.5 rounded-md">
              ⌘↵
            </kbd>
          </button>
        </div>
      </div>
    </form>
  );
}
