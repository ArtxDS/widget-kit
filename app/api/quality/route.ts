import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { NextResponse } from "next/server";
import type { ComponentTestResult, CoverageSummary, QualitySnapshot, QualityTestEvent, QualityTestFailure, TestRunSummary } from "@/lib/quality";
import { components } from "@/lib/catalog";

type VitestAssertion = {
  status?: string;
  title?: string;
  ancestorTitles?: string[];
  failureMessages?: string[];
};

type VitestFile = {
  assertionResults?: VitestAssertion[];
  status?: string;
  name?: string;
};

type VitestJson = {
  numTotalTests?: number;
  numPassedTests?: number;
  numFailedTests?: number;
  numPendingTests?: number;
  startTime?: number;
  testResults?: VitestFile[];
};

let lastRun: TestRunSummary | null = null;
let lastCoverage: CoverageSummary | null = null;
let lastComponentTests: QualitySnapshot["componentTests"] = {};
let runHistory: TestRunSummary[] = [];
let latestTestEvent: QualityTestEvent | null = null;
let testEventHistory: QualityTestEvent[] = [];
let lastSuiteFailures: QualityTestFailure[] = [];

export async function GET(request: Request) {
  // Reading a request value keeps this quality snapshot request-time under Cache Components.
  void request.url;
  const snapshot: QualitySnapshot = {
    testRun: lastRun,
    latestTestEvent,
    testEventHistory,
    suiteFailures: lastSuiteFailures,
    history: runHistory,
    componentTests: lastComponentTests,
    coverage: lastCoverage,
    averageRenderTimeMs: null,
  };
  return NextResponse.json(snapshot);
}

export async function POST(request: Request) {
  let requestedSlug: string | undefined;
  try {
    const body = await request.json() as { componentSlug?: unknown };
    if (typeof body.componentSlug === "string") requestedSlug = body.componentSlug;
    else if (body.componentSlug !== undefined) {
      return NextResponse.json({ error: "componentSlug must be a string." }, { status: 400 });
    }
  } catch {
    // An empty POST runs the complete test suite for backwards compatibility.
  }
  const component = requestedSlug === undefined ? undefined : components.find(({ slug }) => slug === requestedSlug);
  if (requestedSlug !== undefined && !component) {
    return NextResponse.json({ error: "This component is not registered." }, { status: 404 });
  }

  const reportDirectory = await mkdtemp(path.join(os.tmpdir(), `widget-kit-vitest-${randomUUID()}-`));
  const reportPath = path.join(reportDirectory, "tests.json");
  const coverageDirectory = path.join(reportDirectory, "coverage");
  const executable = path.join(process.cwd(), "node_modules", "vitest", "vitest.mjs");
  const startedAt = Date.now();
  const vitestArgs = ["run", "--reporter=json", `--outputFile=${reportPath}`];
  if (component) {
    vitestArgs.push(component.test);
  } else {
    vitestArgs.push("--coverage", "--coverage.reporter=json-summary", `--coverage.reportsDirectory=${coverageDirectory}`);
  }

  const result = await new Promise<{ code: number | null; error: string | null }>((resolve) => {
    const child = spawn(
      process.execPath,
      [executable, ...vitestArgs],
      { cwd: process.cwd(), stdio: "ignore", env: process.env },
    );
    let settled = false;
    const finish = (value: { code: number | null; error: string | null }) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    child.once("error", (error) => finish({ code: null, error: error.message }));
    child.once("close", (code) => finish({ code, error: null }));
  });

  let report: VitestJson | null = null;
  let coverageReport: { total?: Record<string, { pct?: number }> } | null = null;
  try {
    report = JSON.parse(await readFile(reportPath, "utf8")) as VitestJson;
    coverageReport = JSON.parse(
      await readFile(path.join(coverageDirectory, "coverage-summary.json"), "utf8"),
    ) as { total?: Record<string, { pct?: number }> };
  } catch {
    if (!report) report = null;
  } finally {
    await rm(reportDirectory, { recursive: true, force: true }).catch(() => undefined);
  }

  const passed = report?.numPassedTests ?? 0;
  const failed = report?.numFailedTests ?? 0;
  const pending = report?.numPendingTests ?? 0;
  const total = report?.numTotalTests ?? passed + failed + pending;
  const suiteFailures: QualityTestFailure[] = (report?.testResults ?? []).flatMap((file) => {
    const reportedName = (file.name ?? "Unknown test file").replaceAll("\\", "/");
    const filePath = path.isAbsolute(reportedName)
      ? path.relative(process.cwd(), reportedName).replaceAll("\\", "/")
      : reportedName;
    return (file.assertionResults ?? [])
      .filter((assertion) => assertion.status === "failed")
      .map((assertion) => ({
        file: filePath,
        name: [...(assertion.ancestorTitles ?? []), assertion.title ?? "Untitled test"].join(" › "),
        messages: assertion.failureMessages ?? [],
      }));
  });
  const reportedComponentTests = report?.testResults
    ? Object.fromEntries(
        components.map((component) => {
          const testPath = component.test.replaceAll("\\", "/");
          const testFile = report.testResults?.find((file) =>
            (file.name ?? "").replaceAll("\\", "/").endsWith(`/${testPath}`),
          );
          const assertions = testFile?.assertionResults ?? [];
          const testCases = assertions.map((assertion) => ({
            name: [...(assertion.ancestorTitles ?? []), assertion.title ?? "Untitled test"].join(" › "),
            status: assertion.status === "passed"
              ? "passed" as const
              : assertion.status === "failed"
                ? "failed" as const
                : "pending" as const,
          }));
          const result: ComponentTestResult = {
            total: assertions.length,
            passed: testCases.filter((testCase) => testCase.status === "passed").length,
            failed: testCases.filter((testCase) => testCase.status === "failed").length,
            pending: testCases.filter((testCase) => testCase.status === "pending").length,
            assertions: testCases,
            scope: "suite",
          };
          return [component.slug, result];
        }),
      )
    : {};

  if (!report || result.code === null) {
    const snapshot: QualitySnapshot = {
      testRun: null,
      coverage: null,
      averageRenderTimeMs: null,
      error: result.error ?? "Vitest did not produce a readable JSON report.",
    };
    return NextResponse.json(snapshot, { status: 500 });
  }

  const completedAt = new Date().toISOString();
  const durationMs = Date.now() - startedAt;
  const reportedResults = reportedComponentTests as Record<string, ComponentTestResult>;
  let testRun = lastRun;
  let testEvent: QualityTestEvent;

  if (component) {
    const componentResult = reportedResults[component.slug] ?? {
      total: 0,
      passed: 0,
      failed: 0,
      pending: 0,
      assertions: [],
    };
    lastComponentTests = {
      ...(lastComponentTests ?? {}),
      [component.slug]: { ...componentResult, scope: "component", completedAt, durationMs },
    };
    testEvent = {
      total: componentResult.total,
      passed: componentResult.passed,
      failed: componentResult.failed,
      pending: componentResult.pending,
      passedPercentage: componentResult.total > 0 ? Math.round((componentResult.passed / componentResult.total) * 1000) / 10 : null,
      coverageLines: null,
      completedAt,
      durationMs,
      scope: "component",
      componentSlug: component.slug,
      componentName: component.name,
      failures: suiteFailures,
    };
  } else {
    const totalCoverage = coverageReport?.total;
    lastCoverage = totalCoverage
      ? {
          lines: totalCoverage.lines?.pct ?? 0,
          statements: totalCoverage.statements?.pct ?? 0,
          functions: totalCoverage.functions?.pct ?? 0,
          branches: totalCoverage.branches?.pct ?? 0,
        }
      : null;
    lastComponentTests = Object.fromEntries(
      components.map(({ slug }) => [slug, {
        ...(reportedResults[slug] ?? { total: 0, passed: 0, failed: 0, pending: 0, assertions: [] }),
        scope: "suite",
        completedAt,
        durationMs,
      }]),
    );
    testRun = {
      total,
      passed,
      failed,
      pending,
      passedPercentage: total > 0 ? Math.round((passed / total) * 1000) / 10 : null,
      coverageLines: lastCoverage?.lines ?? null,
      completedAt,
      durationMs,
    };
    lastRun = testRun;
    runHistory = [testRun, ...runHistory].slice(0, 10);
    lastSuiteFailures = suiteFailures;
    testEvent = { ...testRun, scope: "suite", failures: suiteFailures };
  }

  latestTestEvent = testEvent;
  testEventHistory = [testEvent, ...testEventHistory].slice(0, 10);

  const snapshot: QualitySnapshot = {
    testRun,
    latestTestEvent,
    testEventHistory,
    suiteFailures: lastSuiteFailures,
    history: runHistory,
    componentTests: lastComponentTests,
    coverage: lastCoverage,
    averageRenderTimeMs: null,
    ...(result.code !== 0 ? { error: `${failed} test${failed === 1 ? "" : "s"} failed${component ? ` in ${component.name}` : ""}.` } : {}),
  };
  return NextResponse.json(snapshot, { status: result.code === 0 ? 200 : 422 });
}
