import { components, widgets } from "@/lib/catalog";
import { getDb } from "@/lib/db";
import {
  emptyQualitySnapshot,
  itemTestKey,
  type ItemTestResult,
  type QualitySnapshot,
  type TestCase,
  type TestRunSummary,
  type TestTargetType,
} from "@/lib/quality";
import { NextResponse } from "next/server";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

type VitestAssertion = {
  status?: string;
  title?: string;
  ancestorTitles?: string[];
};

type VitestFile = {
  assertionResults?: VitestAssertion[];
};

type VitestJson = {
  numTotalTests?: number;
  numPassedTests?: number;
  numFailedTests?: number;
  numPendingTests?: number;
  testResults?: VitestFile[];
};

function toSummary(run: {
  itemType: string;
  itemSlug: string;
  itemName: string;
  total: number;
  passed: number;
  failed: number;
  pending: number;
  durationMs: number;
  completedAt: Date;
}): TestRunSummary {
  return {
    itemType: run.itemType as TestTargetType,
    itemSlug: run.itemSlug,
    itemName: run.itemName,
    total: run.total,
    passed: run.passed,
    failed: run.failed,
    pending: run.pending,
    passedPercentage:
      run.total > 0 ? Math.round((run.passed / run.total) * 1000) / 10 : null,
    completedAt: run.completedAt.toISOString(),
    durationMs: run.durationMs,
  };
}

export async function GET(request: Request) {
  void request.url;

  let db: ReturnType<typeof getDb>;
  try {
    db = getDb();
  } catch (error) {
    return NextResponse.json(
      {
        ...emptyQualitySnapshot,
        error:
          error instanceof Error ? error.message : "Database is not configured.",
      },
      { status: 503 },
    );
  }

  const [runs, durationAggregate] = await Promise.all([
    db.itemTestRun.findMany({
      orderBy: { completedAt: "desc" },
      take: 20,
      include: { assertions: true },
    }),
    db.itemTestRun.aggregate({ _avg: { durationMs: true } }),
  ]);

  const history = runs.map(toSummary);
  const itemTests: Record<string, ItemTestResult> = {};
  for (const run of runs) {
    const key = itemTestKey(run.itemType as TestTargetType, run.itemSlug);
    if (!itemTests[key]) {
      itemTests[key] = {
        ...toSummary(run),
        assertions: run.assertions.map((assertion) => ({
          name: assertion.name,
          status: assertion.status as TestCase["status"],
        })),
      };
    }
  }

  const snapshot: QualitySnapshot = {
    history,
    itemTests,
    averageItemDurationMs: durationAggregate._avg.durationMs,
    averageRenderTimeMs: null,
  };

  return NextResponse.json(snapshot);
}

export async function POST(request: Request) {
  let db: ReturnType<typeof getDb>;
  try {
    db = getDb();
  } catch (error) {
    return NextResponse.json(
      {
        ...emptyQualitySnapshot,
        error:
          error instanceof Error ? error.message : "Database is not configured.",
      },
      { status: 503 },
    );
  }

  let body: { itemType?: unknown; itemSlug?: unknown };
  try {
    body = (await request.json()) as { itemType?: unknown; itemSlug?: unknown };
  } catch {
    return NextResponse.json(
      { error: "Choose one component or widget to test." },
      { status: 400 },
    );
  }

  if (
    (body.itemType !== "component" && body.itemType !== "widget") ||
    typeof body.itemSlug !== "string"
  ) {
    return NextResponse.json(
      { error: "itemType and itemSlug are required." },
      { status: 400 },
    );
  }

  const itemType = body.itemType as TestTargetType;
  const item =
    itemType === "component"
      ? components.find(({ slug }) => slug === body.itemSlug)
      : widgets.find(({ slug }) => slug === body.itemSlug);

  if (!item) {
    return NextResponse.json(
      { error: `This ${itemType} is not registered.` },
      { status: 404 },
    );
  }
  const testPath = item.test;
  if (!testPath) {
    return NextResponse.json(
      { error: `No individual test file is registered for ${item.name}.` },
      { status: 400 },
    );
  }

  const reportDirectory = await mkdtemp(
    path.join(os.tmpdir(), `widget-kit-vitest-${randomUUID()}-`),
  );
  const reportPath = path.join(reportDirectory, "tests.json");
  const executable = path.join(
    process.cwd(),
    "node_modules",
    "vitest",
    "vitest.mjs",
  );
  const startedAt = Date.now();
  const result = await new Promise<{ code: number | null; error: string | null }>(
    (resolve) => {
      const child = spawn(
        process.execPath,
        [executable, "run", "--reporter=json", `--outputFile=${reportPath}`, testPath],
        {
          cwd: process.cwd(),
          stdio: "ignore",
          env: process.env,
        },
      );
      let settled = false;
      const finish = (value: { code: number | null; error: string | null }) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };
      child.once("error", (error) => finish({ code: null, error: error.message }));
      child.once("close", (code) => finish({ code, error: null }));
    },
  );
  const durationMs = Date.now() - startedAt;

  let report: VitestJson | null = null;
  try {
    report = JSON.parse(await readFile(reportPath, "utf8")) as VitestJson;
  } catch {
    report = null;
  } finally {
    await rm(reportDirectory, { recursive: true, force: true }).catch(
      () => undefined,
    );
  }

  if (!report || result.code === null) {
    const snapshot: QualitySnapshot = {
      ...emptyQualitySnapshot,
      error: result.error ?? `Vitest did not produce a report for ${item.name}.`,
    };
    return NextResponse.json(snapshot, { status: 500 });
  }

  const testCases: TestCase[] = (report.testResults ?? []).flatMap((file) =>
    (file.assertionResults ?? []).map((assertion) => ({
      name: [
        ...(assertion.ancestorTitles ?? []),
        assertion.title ?? "Untitled test",
      ].join(" › "),
      status:
        assertion.status === "passed"
          ? ("passed" as const)
          : assertion.status === "failed"
            ? ("failed" as const)
            : ("pending" as const),
    })),
  );
  const passed = report.numPassedTests ?? testCases.filter((test) => test.status === "passed").length;
  const failed = report.numFailedTests ?? testCases.filter((test) => test.status === "failed").length;
  const pending = report.numPendingTests ?? testCases.filter((test) => test.status === "pending").length;
  const total = report.numTotalTests ?? passed + failed + pending;

  await db.itemTestRun.create({
    data: {
      itemType,
      itemSlug: item.slug,
      itemName: item.name,
      total,
      passed,
      failed,
      pending,
      durationMs,
      completedAt: new Date(),
      assertions: {
        create: testCases.map((testCase) => ({
          name: testCase.name,
          status: testCase.status,
        })),
      },
    },
  });

  const freshResponse = await GET(request);
  const snapshot = (await freshResponse.json()) as QualitySnapshot;
  if (result.code !== 0) {
    snapshot.error = `${failed} test${failed === 1 ? "" : "s"} failed in ${item.name}.`;
  }

  return NextResponse.json(snapshot, {
    status: result.code === 0 ? 200 : 422,
  });
}
