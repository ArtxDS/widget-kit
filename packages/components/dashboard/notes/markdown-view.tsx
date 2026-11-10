"use client";
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useId } from "react";
import {
  Image as ImageIcon,
  Maximize2,
  Trash2,
  X,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { MarkdownContent } from "@/widgets/assistant/src/react/MarkdownContent";

export type NoteMarkdownProps = {
  content?: string | null;
  attachmentUrls?: Record<string, string>;
  isAdmin?: boolean;
  onRemoveAttachment?: (storageUriOrPath: string) => void | Promise<void>;
  className?: string;
  fallbackText?: string | null;
};

function isSafeUrl(url: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("blob:")
  ) {
    return true;
  }
  return false;
}

export function NoteImage({
  src,
  alt,
  resolvedUrl,
  isAdmin,
  onRemove,
}: {
  src: string;
  alt: string;
  resolvedUrl?: string;
  isAdmin?: boolean;
  onRemove?: () => void;
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const effectiveUrl = resolvedUrl || (isSafeUrl(src) ? src : undefined);

  // Close lightbox on Escape
  useEffect(() => {
    if (!lightboxOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen]);

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onRemove || isDeleting) return;
    setIsDeleting(true);
    try {
      await onRemove();
    } finally {
      setIsDeleting(false);
    }
  };

  if (!effectiveUrl || loadError) {
    return (
      <div className="my-2.5 p-3 rounded-lg border border-[#2b2c32] bg-[#121316] flex items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2 min-w-0">
          <AlertCircle className="size-4 text-amber-400 shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="font-medium text-slate-300 truncate">
              {alt || "Image attachment"}
            </span>
            <span className="text-[11px] text-slate-500 font-mono truncate">
              {src.startsWith("storage:") ? src : "Image not available"}
            </span>
          </div>
        </div>
        {isAdmin && onRemove && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={isDeleting}
            title="Remove attachment"
            aria-label="Remove attachment"
            className="size-7 rounded-md border border-[#2b2c32] bg-[#18191d] hover:bg-red-950/40 hover:border-red-800/60 hover:text-red-300 text-slate-400 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            {isDeleting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Trash2 className="size-3.5" />
            )}
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <figure className="my-3 group relative inline-block max-w-full rounded-lg border border-[#2b2c32] bg-[#0d0f12] overflow-hidden shadow-sm">
        <div
          className="relative overflow-hidden cursor-zoom-in"
          onClick={() => setLightboxOpen(true)}
        >
          <img
            src={effectiveUrl}
            alt={alt || "Note attachment"}
            loading="lazy"
            onError={() => setLoadError(true)}
            className="max-h-[420px] w-auto max-w-full object-contain rounded-md transition-transform duration-200 group-hover:scale-[1.01]"
          />

          {/* Hover overlay with action buttons */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-start justify-end p-2 gap-1.5 pointer-events-none">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxOpen(true);
              }}
              title="Expand image"
              aria-label="Expand image"
              className="pointer-events-auto size-7 rounded-md bg-black/70 hover:bg-black text-slate-200 hover:text-white flex items-center justify-center transition-colors cursor-pointer shadow-md"
            >
              <Maximize2 className="size-3.5" />
            </button>

            {isAdmin && onRemove && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={isDeleting}
                title="Remove image from note"
                aria-label="Remove image from note"
                className="pointer-events-auto size-7 rounded-md bg-black/70 hover:bg-red-900/80 text-slate-200 hover:text-red-200 flex items-center justify-center transition-colors cursor-pointer shadow-md"
              >
                {isDeleting ? (
                  <Loader2 className="size-3.5 animate-spin text-red-300" />
                ) : (
                  <Trash2 className="size-3.5 text-red-400" />
                )}
              </button>
            )}
          </div>
        </div>

        {alt && alt.trim() && alt !== "Image description" && (
          <figcaption className="px-3 py-1.5 text-[11px] text-slate-400 bg-[#121316] border-t border-[#232730] flex items-center gap-1.5 truncate">
            <ImageIcon className="size-3 text-slate-500 shrink-0" />
            <span className="truncate">{alt}</span>
          </figcaption>
        )}
      </figure>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt || "Image preview"}
          onClick={() => setLightboxOpen(false)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 sm:p-6"
        >
          <div className="relative max-w-5xl max-h-[90vh] flex flex-col items-center">
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              title="Close full-screen preview"
              aria-label="Close"
              className="absolute -top-10 right-0 size-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white flex items-center justify-center cursor-pointer transition-colors shadow-lg"
            >
              <X className="size-4" />
            </button>
            <img
              src={effectiveUrl}
              alt={alt || "Enlarged preview"}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[82vh] w-auto max-w-full object-contain rounded-lg border border-[#2b2c32] shadow-2xl"
            />
            {alt && (
              <p
                onClick={(e) => e.stopPropagation()}
                className="mt-2 text-xs text-slate-300 text-center max-w-xl truncate"
              >
                {alt}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Parses markdown into text segments and image tokens.
 * Image syntax: ![alt text](url)
 */
function parseMarkdownImages(content: string): Array<
  | { type: "text"; text: string }
  | { type: "image"; alt: string; src: string; raw: string }
> {
  const parts: Array<
    | { type: "text"; text: string }
    | { type: "image"; alt: string; src: string; raw: string }
  > = [];

  const regex = /!\[([^\]]*)\]\(([^)\s]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    const start = match.index;
    if (start > lastIndex) {
      parts.push({
        type: "text",
        text: content.slice(lastIndex, start),
      });
    }

    parts.push({
      type: "image",
      alt: match[1],
      src: match[2],
      raw: match[0],
    });

    lastIndex = start + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({
      type: "text",
      text: content.slice(lastIndex),
    });
  }

  return parts;
}

export function NoteMarkdown({
  content,
  attachmentUrls = {},
  isAdmin = false,
  onRemoveAttachment,
  className = "",
  fallbackText = "No description provided.",
}: NoteMarkdownProps) {
  const instanceId = useId();

  if (!content || !content.trim()) {
    if (!fallbackText) return null;
    return <p className="text-slate-500 text-xs italic">{fallbackText}</p>;
  }

  const parts = parseMarkdownImages(content);

  // If there are no images, render normally with MarkdownContent
  if (parts.length === 1 && parts[0].type === "text") {
    return (
      <div
        className={`prose-notes text-slate-200 text-xs/relaxed sm:text-sm ${className}`.trim()}
      >
        <MarkdownContent content={content} />
      </div>
    );
  }

  return (
    <div
      className={`prose-notes text-slate-200 text-xs/relaxed sm:text-sm ${className}`.trim()}
    >
      {parts.map((part, index) => {
        const key = `${instanceId}-part-${index}`;
        if (part.type === "text") {
          if (!part.text.trim()) return null;
          return <MarkdownContent key={key} content={part.text} />;
        }

        // Image part
        const src = part.src;
        const normalized = src.replace(/^storage:/, "");
        const resolvedUrl =
          attachmentUrls[src] ||
          attachmentUrls[normalized] ||
          attachmentUrls[`storage:${normalized}`];

        return (
          <NoteImage
            key={key}
            src={src}
            alt={part.alt}
            resolvedUrl={resolvedUrl}
            isAdmin={isAdmin}
            onRemove={
              onRemoveAttachment ? () => onRemoveAttachment(src) : undefined
            }
          />
        );
      })}
    </div>
  );
}
