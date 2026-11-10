import { z } from "zod";

export const noteTypes = [
  "BUG",
  "IDEA",
  "IMPROVEMENT",
  "DECISION",
  "CHANGELOG",
] as const;
export type NoteType = (typeof noteTypes)[number];

export const noteTypeLabels: Record<NoteType, string> = {
  BUG: "Bug",
  IDEA: "Idea",
  IMPROVEMENT: "Improvement",
  DECISION: "Decision",
  CHANGELOG: "Changelog",
};

export const noteStatuses = ["OPEN", "IN_PROGRESS", "DONE"] as const;
export type NoteStatus = (typeof noteStatuses)[number];

export const noteStatusLabels: Record<NoteStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  DONE: "Done",
};

export const notePriorities = ["P1", "P2", "P3"] as const;
export type NotePriority = (typeof notePriorities)[number];

export const bugDataSchema = z.object({
  steps: z.array(z.string().trim().min(1)).default([]),
  expectedBehavior: z.string().trim().optional().default(""),
  actualBehavior: z.string().trim().optional().default(""),
});

export const ideaDataSchema = z.object({
  context: z.string().trim().optional().default(""),
  description: z.string().trim().optional().default(""),
  benefit: z.string().trim().optional().default(""),
});

export const improvementDataSchema = z.object({
  currentLimitation: z.string().trim().optional().default(""),
  proposedImprovement: z.string().trim().optional().default(""),
  expectedOutcome: z.string().trim().optional().default(""),
});

export const decisionDataSchema = z.object({
  technicalContext: z.string().trim().optional().default(""),
  decision: z.string().trim().optional().default(""),
  rationale: z.string().trim().optional().default(""),
  consequences: z.string().trim().optional().default(""),
});

export const changelogDataSchema = z.object({
  changeDescription: z.string().trim().optional().default(""),
  updateContext: z.string().trim().optional().default(""),
});

export const noteTypeDataSchemas = {
  BUG: bugDataSchema,
  IDEA: ideaDataSchema,
  IMPROVEMENT: improvementDataSchema,
  DECISION: decisionDataSchema,
  CHANGELOG: changelogDataSchema,
} as const;

export type NoteTypeData = {
  [K in NoteType]: z.infer<(typeof noteTypeDataSchemas)[K]>;
}[NoteType];

export function normalizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  const result = new Set<string>();
  for (const tag of tags) {
    if (typeof tag !== "string") continue;
    const normalized = tag.trim().toLowerCase();
    if (normalized) result.add(normalized);
  }
  return Array.from(result).slice(0, 30);
}

export const createNoteSchema = z
  .object({
    id: z.string().trim().min(1).optional(),
    title: z.string().trim().min(1, "Title is required.").max(200),
    type: z.enum(noteTypes),
    content: z.string().default(""),
    typeData: z.unknown().optional(),
    tags: z.array(z.string()).default([]),
    componentSlug: z
      .string()
      .trim()
      .min(1)
      .max(120)
      .nullable()
      .optional()
      .transform((value) => value ?? null),
    priority: z.enum(notePriorities).nullable().optional().default(null),
    status: z.enum(noteStatuses).optional().default("OPEN"),
  })
  .transform((value, ctx) => {
    const schema = noteTypeDataSchemas[value.type];
    const parsed = schema.safeParse(value.typeData ?? {});
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: issue.message,
          path: ["typeData", ...issue.path],
        });
      }
      return z.NEVER;
    }
    return {
      ...value,
      content: value.content ?? "",
      tags: normalizeTags(value.tags),
      typeData: parsed.data,
    };
  });

export type CreateNoteInput = z.infer<typeof createNoteSchema>;

export const updateNoteSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    type: z.enum(noteTypes).optional(),
    content: z.string().optional(),
    typeData: z.unknown().optional(),
    tags: z.array(z.string()).optional(),
    componentSlug: z
      .string()
      .trim()
      .min(1)
      .max(120)
      .nullable()
      .optional(),
    priority: z.enum(notePriorities).nullable().optional(),
    status: z.enum(noteStatuses).optional(),
  })
  .transform((value, ctx) => {
    if (value.type && value.typeData !== undefined) {
      const schema = noteTypeDataSchemas[value.type];
      const parsed = schema.safeParse(value.typeData ?? {});
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: issue.message,
            path: ["typeData", ...issue.path],
          });
        }
        return z.NEVER;
      }
      value = { ...value, typeData: parsed.data };
    } else if (value.typeData !== undefined && value.type === undefined) {
    }
    if (value.tags !== undefined) {
      value = { ...value, tags: normalizeTags(value.tags) };
    }
    return value;
  });

export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;

export type NoteAuthorDto = {
  id: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
};

export type NoteDto = {
  id: string;
  title: string;
  type: NoteType;
  content: string;
  typeData: Record<string, unknown> | null;
  tags: string[];
  componentSlug: string | null;
  priority: NotePriority | null;
  status: NoteStatus;
  author: NoteAuthorDto | null;
  authorId: string;
  lastEditedBy: NoteAuthorDto | null;
  createdAt: string;
  updatedAt: string;
  attachmentUrls?: Record<string, string>;
};

export function noteTypeColor(type: NoteType): string {
  switch (type) {
    case "BUG":
      return "red";
    case "IDEA":
      return "amber";
    case "IMPROVEMENT":
      return "blue";
    case "DECISION":
      return "purple";
    case "CHANGELOG":
      return "green";
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serializeNote(note: any, attachmentUrls?: Record<string, string>): NoteDto {
  return {
    id: note.id,
    title: note.title,
    type: note.type,
    content: note.content ?? "",
    typeData: (note.typeData ?? null) as Record<string, unknown> | null,
    tags: Array.isArray(note.tags) ? note.tags : [],
    componentSlug: note.componentSlug ?? null,
    priority: note.priority ?? null,
    status: note.status ?? "OPEN",
    author: note.author
      ? {
          id: note.author.id,
          name: note.author.name ?? null,
          email: note.author.email ?? null,
          avatarUrl: note.author.avatarUrl ?? null,
        }
      : null,
    authorId: note.authorId,
    lastEditedBy: note.lastEditedBy
      ? {
          id: note.lastEditedBy.id,
          name: note.lastEditedBy.name ?? null,
          email: note.lastEditedBy.email ?? null,
          avatarUrl: note.lastEditedBy.avatarUrl ?? null,
        }
      : null,
    createdAt:
      note.createdAt instanceof Date
        ? note.createdAt.toISOString()
        : String(note.createdAt),
    updatedAt:
      note.updatedAt instanceof Date
        ? note.updatedAt.toISOString()
        : String(note.updatedAt),
    attachmentUrls: attachmentUrls ?? note.attachmentUrls ?? undefined,
  };
}
