import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth/users";
import { createNoteSchema, serializeNote } from "@/lib/notes";
import { components, widgets } from "@/lib/catalog";
import {
  extractStoragePathsFromMarkdown,
  generateSignedUrlsForPaths,
  getSignedUrlsForNoteContent,
} from "@/lib/notes-storage";

export async function GET(request: Request) {
  let db;
  try {
    db = getDb();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Database is not configured." },
      { status: 503 },
    );
  }

  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const status = url.searchParams.get("status");
  const tag = url.searchParams.get("tag");
  const component = url.searchParams.get("component");
  const q = url.searchParams.get("q");
  const limitParam = Number.parseInt(url.searchParams.get("limit") ?? "", 10);
  const take =
    Number.isFinite(limitParam) && limitParam > 0
      ? Math.min(limitParam, 100)
      : 100;

  const where: Record<string, unknown> = {};
  if (type) where.type = type;
  if (status) where.status = status;
  if (component) where.componentSlug = component;
  if (tag) where.tags = { has: tag.toLowerCase() };
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { content: { contains: q, mode: "insensitive" } },
    ];
  }

  const notes = await db.note.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take,
    include: {
      author: true,
      lastEditedBy: true,
    },
  });

  const allPaths = new Set<string>();
  for (const note of notes) {
    const paths = extractStoragePathsFromMarkdown(note.content, note.id);
    for (const p of paths) {
      allPaths.add(p);
    }
  }

  const signedUrlsMap = await generateSignedUrlsForPaths(Array.from(allPaths));

  const serialized = notes.map((note) => {
    const notePaths = extractStoragePathsFromMarkdown(note.content, note.id);
    const noteUrls: Record<string, string> = {};
    for (const p of notePaths) {
      if (signedUrlsMap[p]) {
        noteUrls[p] = signedUrlsMap[p];
        noteUrls[`storage:${p}`] = signedUrlsMap[p];
      }
    }
    return serializeNote(note, noteUrls);
  });
  return NextResponse.json({
    notes: serialized,
    data: serialized,
    items: serialized,
    total: serialized.length,
  });
}

export async function POST(request: Request) {
  let db;
  try {
    db = getDb();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Database is not configured." },
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = createNoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid note data.", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const input = parsed.data;

  if (input.componentSlug) {
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

  const note = await db.note.create({
    data: {
      ...(input.id ? { id: input.id } : {}),
      title: input.title,
      type: input.type,
      content: input.content,
      typeData: input.typeData ?? undefined,
      tags: input.tags,
      componentSlug: input.componentSlug ?? null,
      priority: input.priority ?? null,
      status: input.status ?? "OPEN",
      authorId: user.id,
    },
    include: { author: true, lastEditedBy: true },
  });

  const attachmentUrls = await getSignedUrlsForNoteContent(
    note.content,
    note.id,
  );
  const serialized = serializeNote(note, attachmentUrls);
  return NextResponse.json(
    { note: serialized, data: serialized, item: serialized },
    { status: 201 },
  );
}

