import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/users";
import { components, widgets } from "@/lib/catalog";
import { getDb } from "@/lib/db";
import {
  noteTypeDataSchemas,
  serializeNote,
  updateNoteSchema,
} from "@/lib/notes";
import { getSignedUrlsForNoteContent } from "@/lib/notes-storage";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
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

  const { id } = await params;
  const note = await db.note.findUnique({
    where: { id },
    include: { author: true, lastEditedBy: true },
  });

  if (!note) {
    return NextResponse.json({ error: "Note not found." }, { status: 404 });
  }

  const attachmentUrls = await getSignedUrlsForNoteContent(
    note.content,
    note.id,
  );
  const serialized = serializeNote(note, attachmentUrls);
  return NextResponse.json({
    note: serialized,
    data: serialized,
    item: serialized,
  });
}

export async function PATCH(request: Request, { params }: RouteParams) {
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
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { id } = await params;
  const existing = await db.note.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Note not found." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = updateNoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid note data.", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const input = parsed.data as Record<string, unknown>;

  // Validate typeData against the effective type.
  if (input.typeData !== undefined) {
    const effectiveType = (input.type as string | undefined) ?? existing.type;
    const schema =
      noteTypeDataSchemas[effectiveType as keyof typeof noteTypeDataSchemas];
    if (schema) {
      const result = schema.safeParse(input.typeData ?? {});
      if (!result.success) {
        return NextResponse.json(
          { error: "Invalid note data.", issues: result.error.issues },
          { status: 400 },
        );
      }
      input.typeData = result.data;
    }
  }

  if (input.componentSlug !== undefined && input.componentSlug !== null) {
    const exists =
      components.some((c) => c.slug === input.componentSlug) ||
      widgets.some((w) => w.slug === input.componentSlug);
    if (!exists) {
      return NextResponse.json(
        { error: "Unknown component." },
        { status: 400 },
      );
    }
  }

  const data: Record<string, unknown> = { lastEditedById: user.id };
  if (input.title !== undefined) data.title = input.title;
  if (input.type !== undefined) data.type = input.type;
  if (input.content !== undefined) data.content = input.content;
  if (input.typeData !== undefined) data.typeData = input.typeData;
  if (input.tags !== undefined) data.tags = input.tags;
  if (input.componentSlug !== undefined)
    data.componentSlug = input.componentSlug;
  if (input.priority !== undefined) data.priority = input.priority;
  if (input.status !== undefined) data.status = input.status;

  const note = await db.note.update({
    where: { id },
    data,
    include: { author: true, lastEditedBy: true },
  });

  const attachmentUrls = await getSignedUrlsForNoteContent(
    note.content,
    note.id,
  );
  const serialized = serializeNote(note, attachmentUrls);
  return NextResponse.json({
    note: serialized,
    data: serialized,
    item: serialized,
  });
}
