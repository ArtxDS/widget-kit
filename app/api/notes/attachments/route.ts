import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/users";
import {
  deleteAttachmentFromStorage,
  MAX_ATTACHMENT_SIZE_BYTES,
  uploadAttachmentToStorage,
} from "@/lib/notes-storage";

export async function POST(request: Request) {
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
  const noteId = formData.get("noteId");

  if (!noteId || typeof noteId !== "string" || !/^[a-zA-Z0-9_-]+$/.test(noteId)) {
    return NextResponse.json(
      { error: "Invalid or missing noteId identifier." },
      { status: 400 },
    );
  }

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
      noteId,
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

export async function DELETE(request: Request) {
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

  let body: { path?: string; storageUri?: string; noteId?: string } = {};
  try {
    body = await request.json();
  } catch {
    const url = new URL(request.url);
    body = {
      path: url.searchParams.get("path") ?? undefined,
      storageUri: url.searchParams.get("storageUri") ?? undefined,
      noteId: url.searchParams.get("noteId") ?? undefined,
    };
  }

  const target = body.path || body.storageUri;
  if (!target) {
    return NextResponse.json(
      { error: "Missing path or storageUri to remove." },
      { status: 400 },
    );
  }

  try {
    const result = await deleteAttachmentFromStorage(target, body.noteId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete attachment.",
      },
      { status: 400 },
    );
  }
}

