import {
  itemTestKey,
  type ItemTestResult,
  type QualitySnapshot,
  type TestRunSummary,
} from "@/lib/quality";

export const emptyQualityFixture: QualitySnapshot = {
  history: [],
  itemTests: {},
  averageItemDurationMs: null,
  averageRenderTimeMs: null,
};

export const badgeSummaryFixture: TestRunSummary = {
  itemType: "component",
  itemSlug: "badge",
  itemName: "Badge",
  total: 2,
  passed: 2,
  failed: 0,
  pending: 0,
  passedPercentage: 100,
  completedAt: "2026-11-03T12:00:00.000Z",
  durationMs: 300,
};

export const badgeItemTestFixture: ItemTestResult = {
  ...badgeSummaryFixture,
  assertions: [
    { name: "Badge › renders its status and an optional dot", status: "passed" },
    { name: "Badge › applies the selected tone", status: "passed" },
  ],
};

export const badgeQualityFixture: QualitySnapshot = {
  history: [badgeSummaryFixture],
  itemTests: {
    [itemTestKey("component", "badge")]: badgeItemTestFixture,
  },
  averageItemDurationMs: badgeSummaryFixture.durationMs,
  averageRenderTimeMs: null,
};

export const badgeRunItemTestFixture: ItemTestResult = {
  itemType: "component",
  itemSlug: "badge",
  itemName: "Badge",
  total: 1,
  passed: 1,
  failed: 0,
  pending: 0,
  passedPercentage: 100,
  completedAt: "2026-11-03T12:05:00.000Z",
  durationMs: 120,
  assertions: [{ name: "Badge › applies the selected tone", status: "passed" }],
};

export const badgeRunQualityFixture: QualitySnapshot = {
  history: [badgeRunItemTestFixture],
  itemTests: {
    [itemTestKey("component", "badge")]: badgeRunItemTestFixture,
  },
  averageItemDurationMs: badgeRunItemTestFixture.durationMs,
  averageRenderTimeMs: null,
};
