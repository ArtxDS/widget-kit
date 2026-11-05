import { z } from "zod";

export const testTargetTypeSchema = z.enum(["component", "widget"]);
export type TestTargetType = z.infer<typeof testTargetTypeSchema>;

export const testRunSummarySchema = z.object({
  itemType: testTargetTypeSchema,
  itemSlug: z.string(),
  itemName: z.string(),
  total: z.number().int().nonnegative(),
  passed: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  pending: z.number().int().nonnegative(),
  passedPercentage: z.number().nullable(),
  completedAt: z.string(),
  durationMs: z.number().nonnegative(),
});
export type TestRunSummary = z.infer<typeof testRunSummarySchema>;

export const testCaseSchema = z.object({
  name: z.string(),
  status: z.enum(["passed", "failed", "pending"]),
});
export type TestCase = z.infer<typeof testCaseSchema>;

export const itemTestResultSchema = testRunSummarySchema.extend({
  assertions: z.array(testCaseSchema),
});
export type ItemTestResult = z.infer<typeof itemTestResultSchema>;

export const qualitySnapshotSchema = z.object({
  history: z.array(testRunSummarySchema),
  itemTests: z.record(z.string(), itemTestResultSchema).optional(),
  averageItemDurationMs: z.number().nullable(),
  averageRenderTimeMs: z.number().nullable(),
  error: z.string().optional(),
});
export type QualitySnapshot = z.infer<typeof qualitySnapshotSchema>;

export function itemTestKey(itemType: TestTargetType, itemSlug: string) {
  return `${itemType}:${itemSlug}`;
}

export const emptyQualitySnapshot: QualitySnapshot = {
  history: [],
  itemTests: {},
  averageItemDurationMs: null,
  averageRenderTimeMs: null,
};
