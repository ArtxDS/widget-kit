import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/users";
import { getDb } from "@/lib/db";
import { serializeNote } from "@/lib/notes";
import {
  deleteAttachmentFromStorage,
  getSignedUrlsForNoteContent,
  isValidNoteAttachmentPath,
  MAX_ATTACHMENT_SIZE_BYTES,
  normalizeStoragePath,
  uploadAttachmentToStorage,
} from "@/lib/notes-storage";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Forbidden: only administrators can upload attachments." },
      { status: 403 },
    );
  }

  const { id } = await params;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid multipart form data." },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json(
      { error: "Missing image file in form data." },
      { status: 400 },
    );
  }

  if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    return NextResponse.json(
      { error: "File size exceeds 5 MB limit." },
      { status: 400 },
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const originalFilename =
    typeof (file as File).name === "string" ? (file as File).name : "image.png";

  try {
    const result = await uploadAttachmentToStorage({
      noteId: id,
      buffer,
      originalFilename,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to upload image attachment.",
      },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  let db;
  try {
    db = getDb();
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Database is not configured.",
      },
      { status: 503 },
    );
  }

  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Forbidden: only administrators can delete attachments." },
      { status: 403 },
    );
  }

  const { id } = await params;
  const existingNote = await db.note.findUnique({
    where: { id },
    include: { author: true, lastEditedBy: true },
  });

  if (!existingNote) {
    return NextResponse.json({ error: "Note not found." }, { status: 404 });
  }

  let body: { path?: string; storageUri?: string } = {};
  try {
    body = await request.json();
  } catch {
    const url = new URL(request.url);
    body = {
      path: url.searchParams.get("path") ?? undefined,
      storageUri: url.searchParams.get("storageUri") ?? undefined,
    };
  }

  const target = body.path || body.storageUri;
  if (!target) {
    return NextResponse.json(
      { error: "Missing path or storageUri to remove." },
      { status: 400 },
    );
  }

  const normalizedPath = normalizeStoragePath(target);
  if (!isValidNoteAttachmentPath(normalizedPath, id)) {
    return NextResponse.json(
      {
        error:
          "Invalid attachment path: file does not belong to this note or bucket.",
      },
      { status: 400 },
    );
  }

  // 1. Remove image markdown reference from content
  // Matches ![alt](storage:path) or ![alt](path)
  const escapedPath = normalizedPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const markdownRegex = new RegExp(
    `!\\[[^\\]]*\\]\\((?:storage:)?${escapedPath}\\)\\n?`,
    "g",
  );
  const updatedContent = (existingNote.content ?? "").replace(
    markdownRegex,
    "",
  );

  // 2. Remove the object from Supabase Storage
  try {
    await deleteAttachmentFromStorage(normalizedPath, id);
  } catch (storageError) {
    console.error("Storage deletion error:", storageError);
  }

  // 3. Update the Note in Prisma
  const updatedNote = await db.note.update({
    where: { id },
    data: {
      content: updatedContent,
      lastEditedById: user.id,
    },
    include: { author: true, lastEditedBy: true },
  });

  const attachmentUrls = await getSignedUrlsForNoteContent(
    updatedNote.content,
    id,
  );
  const serialized = serializeNote(updatedNote, attachmentUrls);

  return NextResponse.json({
    note: serialized,
    data: serialized,
    item: serialized,
  });
}

