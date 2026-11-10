import type { CreateNoteInput, NoteDto, UpdateNoteInput } from "@/lib/notes";

function pickNote(payload: unknown): NoteDto | null {
  if (!payload) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = payload as Record<string, any>;
  if (data.note) return data.note as NoteDto;
  if (data.item) return data.item as NoteDto;
  if (data.data && data.data.id) return data.data as NoteDto;
  if (data.id) return data as NoteDto;
  return null;
}

function pickNotes(payload: unknown): NoteDto[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as NoteDto[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = payload as Record<string, any>;
  if (Array.isArray(data.notes)) return data.notes as NoteDto[];
  if (Array.isArray(data.items)) return data.items as NoteDto[];
  if (Array.isArray(data.data)) return data.data as NoteDto[];
  return [];
}

export async function fetchNotes(options?: { limit?: number }): Promise<NoteDto[]> {
  const params = new URLSearchParams();
  if (options?.limit && options.limit > 0) {
    params.set("limit", String(options.limit));
  }
  const query = params.toString();
  const response = await fetch(`/api/notes${query ? `?${query}` : ""}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.error ?? "Failed to load notes.");
  }
  const payload = await response.json();
  return pickNotes(payload);
}

export async function fetchNote(id: string): Promise<NoteDto> {
  const response = await fetch(`/api/notes/${id}`, { cache: "no-store" });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.error ?? "Failed to load note.");
  }
  const payload = await response.json();
  const note = pickNote(payload);
  if (!note) throw new Error("Failed to load note.");
  return note;
}

export async function createNote(input: CreateNoteInput): Promise<NoteDto> {
  const response = await fetch("/api/notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.error ?? "Failed to create note.");
  }
  const payload = await response.json();
  const note = pickNote(payload);
  if (!note) throw new Error("Failed to create note.");
  return note;
}

export async function updateNote(
  id: string,
  input: UpdateNoteInput,
): Promise<NoteDto> {
  const response = await fetch(`/api/notes/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.error ?? "Failed to update note.");
  }
  const payload = await response.json();
  const note = pickNote(payload);
  if (!note) throw new Error("Failed to update note.");
  return note;
}

export type UploadAttachmentResponse = {
  path: string;
  storageUri: string;
  signedUrl: string;
  filename: string;
  mimeType: string;
  size: number;
};

export async function uploadNoteAttachment(
  noteId: string,
  file: File,
): Promise<UploadAttachmentResponse> {
  const formData = new FormData();
  formData.append("noteId", noteId);
  formData.append("file", file);

  const response = await fetch("/api/notes/attachments", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.error ?? "Failed to upload image.");
  }

  return response.json();
}

export async function deleteNoteAttachment(
  noteId: string,
  storageUriOrPath: string,
): Promise<NoteDto> {
  const response = await fetch(`/api/notes/${noteId}/attachments`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: storageUriOrPath }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.error ?? "Failed to delete attachment.");
  }

  const payload = await response.json();
  const note = pickNote(payload);
  if (!note) throw new Error("Failed to update note after deleting attachment.");
  return note;
}

