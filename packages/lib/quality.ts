export type TestRunSummary = {
  total: number;
  passed: number;
  failed: number;
  pending: number;
  passedPercentage: number | null;
  coverageLines: number | null;
  completedAt: string;
  durationMs: number;
};

export type QualityTestFailure = {
  file: string;
  name: string;
  messages: string[];
};

export type QualityTestEvent = TestRunSummary & {
  scope: "suite" | "component";
  componentSlug?: string;
  componentName?: string;
  failures?: QualityTestFailure[];
};

export type CoverageSummary = {
  lines: number;
  statements: number;
  functions: number;
  branches: number;
};

export type ComponentTestResult = {
  total: number;
  passed: number;
  failed: number;
  pending: number;
  assertions: ComponentTestCase[];
  scope?: "suite" | "component";
  completedAt?: string;
  durationMs?: number;
};

export type ComponentTestCase = {
  name: string;
  status: "passed" | "failed" | "pending";
};

export type QualitySnapshot = {
  testRun: TestRunSummary | null;
  latestTestEvent?: QualityTestEvent | null;
  testEventHistory?: QualityTestEvent[];
  suiteFailures?: QualityTestFailure[];
  history?: TestRunSummary[];
  componentTests?: Record<string, ComponentTestResult>;
  coverage: CoverageSummary | null;
  averageRenderTimeMs: number | null;
  error?: string;
};

export const emptyQualitySnapshot: QualitySnapshot = {
  testRun: null,
  latestTestEvent: null,
  testEventHistory: [],
  suiteFailures: [],
  history: [],
  coverage: null,
  averageRenderTimeMs: null,
};
