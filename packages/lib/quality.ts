export type TestTargetType = "component" | "widget";

export type TestRunSummary = {
  itemType: TestTargetType;
  itemSlug: string;
  itemName: string;
  total: number;
  passed: number;
  failed: number;
  pending: number;
  passedPercentage: number | null;
  completedAt: string;
  durationMs: number;
};

export type TestCase = {
  name: string;
  status: "passed" | "failed" | "pending";
};

export type ItemTestResult = TestRunSummary & {
  assertions: TestCase[];
};

export type QualitySnapshot = {
  history: TestRunSummary[];
  itemTests?: Record<string, ItemTestResult>;
  averageItemDurationMs: number | null;
  averageRenderTimeMs: number | null;
  error?: string;
};

export function itemTestKey(itemType: TestTargetType, itemSlug: string) {
  return `${itemType}:${itemSlug}`;
}

export const emptyQualitySnapshot: QualitySnapshot = {
  history: [],
  itemTests: {},
  averageItemDurationMs: null,
  averageRenderTimeMs: null,
};
