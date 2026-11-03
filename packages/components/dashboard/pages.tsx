"use client";

import { Badge, type BadgeTone } from "@artxds/widget-kit";
import type { ComponentDefinition } from "@/lib/catalog";
import { components, getComponent, widgets } from "@/lib/catalog";
import type {
  ComponentTestResult,
  QualityTestEvent,
  QualityTestFailure,
} from "@/lib/quality";
import { tw } from "@/lib/tailwind";
import Image from "next/image";
import Link from "next/link";
import {
  Profiler,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Dropdown } from "./dropdown";
import type { IconName } from "./icon";
import { Icon } from "./icon";
import { useQuality } from "./quality-provider";

const badgeTones = [
  { label: "Purple", value: "purple" },
  { label: "Cyan", value: "cyan" },
  { label: "Green", value: "green" },
  { label: "Amber", value: "amber" },
  { label: "Muted", value: "muted" },
];

function PageTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className={tw("page-title-row")}>
      <div>
        <p className={tw("eyebrow")}>{eyebrow}</p>
        <h1>{title}</h1>
        <p className={tw("page-description")}>{description}</p>
      </div>
      {action && <div className={tw("page-title-action")}>{action}</div>}
    </div>
  );
}

function SectionTitle({
  title,
  detail,
  href,
  icon,
}: {
  title: string;
  detail?: string;
  href?: string;
  icon?: IconName;
}) {
  return (
    <div className={tw("section-title-row")}>
      <div className={tw(`section-title-copy${icon ? " has-icon" : ""}`)}>
        {icon && (
          <span
            className={tw(`section-title-icon section-title-icon--${icon}`)}
          >
            <Icon name={icon} size={24} />
          </span>
        )}
        <div>
          <h2>{title}</h2>
          {detail && <p>{detail}</p>}
        </div>
      </div>
      {href && (
        <Link className={tw("text-link")} href={href}>
          View all <Icon name="arrow-right" size={17} />
        </Link>
      )}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: "activity" | "tests" | "widgets" | "notes";
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className={tw("empty-state")}>
      <span className={tw("empty-state-icon")}>
        <Icon name={icon} size={20} />
      </span>
      <strong>{title}</strong>
      <p>{description}</p>
      {action}
    </div>
  );
}

function DashboardToggle({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      aria-checked={checked}
      aria-label={label}
      className={tw(`dashboard-toggle${checked ? " is-checked" : ""}`)}
      onClick={() => onChange(!checked)}
      role="switch"
      type="button"
    >
      <span />
    </button>
  );
}

function ComponentPreview({
  tone = "green",
  dot = true,
}: {
  tone?: BadgeTone;
  dot?: boolean;
}) {
  return (
    <div className={tw("badge-preview")}>
      <Badge tone={tone} dot={dot}>
        Ready
      </Badge>
    </div>
  );
}

function TestStatus({
  slug,
  compact = false,
}: {
  slug: string;
  compact?: boolean;
}) {
  const { snapshot } = useQuality();
  const result = snapshot.componentTests?.[slug];
  if (!result?.total)
    return (
      <Badge tone="muted" dot>
        {compact ? "Not tested" : "No component tests yet"}
      </Badge>
    );
  if (result.failed > 0)
    return (
      <Badge tone="amber" dot>
        {compact
          ? `${result.failed} failing`
          : `${result.failed} component tests failing`}
      </Badge>
    );
  return (
    <Badge tone="green" dot>
      {compact
        ? `${result.passed}/${result.total} passed`
        : `${result.passed} of ${result.total} component tests passed`}
    </Badge>
  );
}

function TestCaseList({
  assertions,
}: {
  assertions: ComponentTestResult["assertions"];
}) {
  return (
    <ul className={tw("component-test-cases")}>
      {assertions.map((testCase, index) => (
        <li key={`${testCase.name}-${index}`}>
          <span
            className={tw(`test-case-icon test-case-icon--${testCase.status}`)}
          >
            <Icon
              name={testCase.status === "passed" ? "check" : "activity"}
              size={14}
            />
          </span>
          <span className={tw("test-case-copy")}>
            <strong>{testCase.name}</strong>
            <small>{testCase.status}</small>
          </span>
          <Badge
            tone={
              testCase.status === "passed"
                ? "green"
                : testCase.status === "failed"
                  ? "amber"
                  : "muted"
            }
          >
            {testCase.status}
          </Badge>
        </li>
      ))}
    </ul>
  );
}

function SuiteFailurePanel({
  failures,
  completedAt,
}: {
  failures: QualityTestFailure[];
  completedAt?: string;
}) {
  if (!failures.length) return null;
  return (
    <section
      className={tw("suite-failure-panel")}
      aria-label="Latest full-suite failures"
    >
      <div className={tw("suite-failure-heading")}>
        <Icon name="activity" size={17} />
        <div>
          <strong>
            {failures.length} full-suite{" "}
            {failures.length === 1 ? "failure" : "failures"}
          </strong>
          <span>
            {completedAt
              ? `Latest suite · ${new Date(completedAt).toLocaleString()}`
              : "Latest full-suite report"}
          </span>
        </div>
      </div>
      <ul>
        {failures.map((failure, index) => (
          <li key={`${failure.file}-${failure.name}-${index}`}>
            <strong>{failure.name}</strong>
            <code>{failure.file}</code>
            {failure.messages[0] && (
              <pre>
                {failure.messages[0].trim().split("\n").slice(0, 4).join("\n")}
              </pre>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function ComponentCard({ component }: { component: ComponentDefinition }) {
  return (
    <article className={tw("component-card")}>
      <Link
        className={tw("component-card__preview")}
        href={`/components/${component.slug}`}
        aria-label={`Open ${component.name} details`}
      >
        <ComponentPreview />
      </Link>
      <div className={tw("component-card__body")}>
        <div className={tw("component-card__heading")}>
          <div>
            <h3>{component.name}</h3>
            <span>{component.category}</span>
          </div>
          <TestStatus slug={component.slug} compact />
        </div>
        <p>{component.description}</p>
        <Link
          className={tw("component-open")}
          href={`/components/${component.slug}`}
        >
          Inspect component <Icon name="arrow-right" size={15} />
        </Link>
      </div>
    </article>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
  chartValues,
  chartLabel,
  emptyLabel = "No data yet",
}: {
  label: string;
  value: string;
  icon: "components" | "widgets" | "tests" | "clock";
  color: "purple" | "cyan" | "green" | "blue";
  chartValues: number[];
  chartLabel: string;
  emptyLabel?: string;
}) {
  const points = chartValues.map((item, index) => {
    const x =
      chartValues.length === 1
        ? 70
        : 5 + (index * 127) / (chartValues.length - 1);
    const min = Math.min(...chartValues);
    const max = Math.max(...chartValues);
    const y = max === min ? 25 : 34 - ((item - min) / (max - min)) * 25;
    return `${x},${y}`;
  });
  const areaPath =
    points.length > 1
      ? `M ${points[0]} L ${points.slice(1).join(" L ")} L 132,40 L 5,40 Z`
      : "";

  return (
    <article className={tw("stat-card")}>
      <div className={tw(`stat-icon stat-icon--${color}`)}>
        <Icon name={icon} size={26} />
      </div>
      <div className={tw("stat-card__copy")}>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
      <svg
        className={tw(
          `stat-sparkline stat-sparkline--${color}${points.length ? "" : " is-empty"}`,
        )}
        role="img"
        aria-label={chartLabel}
        viewBox="0 0 140 44"
        preserveAspectRatio="none"
      >
        <line
          className={tw("stat-sparkline-baseline")}
          x1="0"
          x2="140"
          y1="40"
          y2="40"
        />
        {areaPath && (
          <path className={tw("stat-sparkline-area")} d={areaPath} />
        )}
        {points.length > 1 && (
          <polyline
            className={tw("stat-sparkline-line")}
            pathLength={1}
            points={points.join(" ")}
          />
        )}
        {points.length === 1 && (
          <circle
            className={tw("stat-sparkline-point")}
            cx={points[0].split(",")[0]}
            cy={points[0].split(",")[1]}
            r="4.5"
          >
            <title>{`${chartValues[0]} recorded value`}</title>
          </circle>
        )}
        {!points.length && (
          <text
            className={tw("stat-sparkline-empty-label")}
            x="134"
            y="30"
            textAnchor="end"
          >
            {emptyLabel}
          </text>
        )}
      </svg>
    </article>
  );
}

type OverviewTestRun = {
  total: number;
  passed: number;
  failed: number;
  pending: number;
  passedPercentage: number | null;
  coverageLines: number | null;
  completedAt: string;
  durationMs: number;
  name: string;
  kind: "suite" | "component";
  failures?: QualityTestFailure[];
};

function TestHistoryGraph({ history }: { history: OverviewTestRun[] }) {
  const runs = history.slice(0, 8).reverse();
  const x = (index: number) =>
    34 + (index * 532) / Math.max(1, runs.length - 1);
  const y = (percentage: number) => 15 + (100 - percentage) * 1.02;
  const passingPoints = runs
    .map((item, index) =>
      item.passedPercentage === null
        ? null
        : `${x(index)},${y(item.passedPercentage)}`,
    )
    .filter((point): point is string => point !== null)
    .join(" ");
  const coveragePoints = runs
    .map((item, index) =>
      item.coverageLines == null
        ? null
        : `${x(index)},${y(item.coverageLines)}`,
    )
    .filter((point): point is string => point !== null)
    .join(" ");
  const hasCoverage = runs.some((item) => item.coverageLines != null);

  return (
    <div className={tw("history-chart")}>
      <svg
        role="img"
        aria-label={`Test pass rate across ${runs.length} recent runs${hasCoverage ? " with line coverage" : ""}`}
        viewBox="0 0 600 150"
        preserveAspectRatio="none"
      >
        {[0, 25, 50, 75, 100].map((percentage) => (
          <g key={percentage}>
            <line x1="28" x2="578" y1={y(percentage)} y2={y(percentage)} />
            <text x="1" y={y(percentage) + 3}>
              {percentage}
            </text>
          </g>
        ))}
        {passingPoints && (
          <polyline
            className={tw("history-line history-line--passing")}
            pathLength={1}
            points={passingPoints}
          />
        )}
        {coveragePoints && (
          <polyline
            className={tw("history-line history-line--coverage")}
            pathLength={1}
            points={coveragePoints}
          />
        )}
        {runs.map((item, index) => (
          <g key={`${item.kind}-${item.name}-${item.completedAt}`}>
            {item.passedPercentage !== null && (
              <circle
                className={tw("history-point history-point--passing")}
                style={{ animationDelay: `${index * 75}ms` }}
                cx={x(index)}
                cy={y(item.passedPercentage)}
                r="3.5"
              >
                <title>{`Run ${index + 1}: ${item.passedPercentage}% tests passing`}</title>
              </circle>
            )}
            {item.coverageLines != null && (
              <circle
                className={tw("history-point history-point--coverage")}
                style={{ animationDelay: `${index * 75}ms` }}
                cx={x(index)}
                cy={y(item.coverageLines)}
                r="3"
              >
                <title>{`Run ${index + 1}: ${item.coverageLines}% line coverage`}</title>
              </circle>
            )}
            <text
              className={tw("history-run-label")}
              x={x(index)}
              y="142"
              textAnchor="middle"
            >
              {index + 1}
            </text>
          </g>
        ))}
      </svg>
      <div className={tw("history-chart-caption")}>
        <span>Older</span>
        <span>Recent runs</span>
        <span>Latest</span>
      </div>
    </div>
  );
}

type OverviewActivity = {
  key: string;
  completedAt: string;
  durationMs: number;
  total: number;
  passed: number;
  failed: number;
  name: string;
  kind: "suite" | "component";
};

function activityTime(date: string) {
  return `${new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(new Date(date))} UTC`;
}

export function OverviewPage() {
  const { snapshot, running, runTests, renderTimeHistory } = useQuality();
  const run = snapshot.testRun;
  const suiteHistory: OverviewTestRun[] = (
    snapshot.history?.length ? snapshot.history : run ? [run] : []
  ).map((item) => ({
    ...item,
    name: "Test suite",
    kind: "suite" as const,
  }));
  const suiteTimestamps = new Set(suiteHistory.map((item) => item.completedAt));
  const storedComponentEvents = (snapshot.testEventHistory ?? []).filter(
    (item) => item.scope === "component",
  );
  const storedComponentKeys = new Set(
    storedComponentEvents.map(
      (item) => `${item.componentSlug}-${item.completedAt}`,
    ),
  );
  const componentHistory: OverviewTestRun[] = [
    ...storedComponentEvents.map((item) => ({
      total: item.total,
      passed: item.passed,
      failed: item.failed,
      pending: item.pending,
      passedPercentage: item.passedPercentage,
      coverageLines: null,
      completedAt: item.completedAt,
      durationMs: item.durationMs,
      name: item.componentName ?? item.componentSlug ?? "Component",
      kind: "component" as const,
    })),
    ...components.flatMap((component) => {
      const result = snapshot.componentTests?.[component.slug];
      if (
        !result?.completedAt ||
        suiteTimestamps.has(result.completedAt) ||
        storedComponentKeys.has(`${component.slug}-${result.completedAt}`)
      )
        return [];
      return [
        {
          completedAt: result.completedAt,
          durationMs: result.durationMs ?? 0,
          total: result.total,
          passed: result.passed,
          failed: result.failed,
          pending: result.pending,
          passedPercentage:
            result.total > 0
              ? Math.round((result.passed / result.total) * 1000) / 10
              : null,
          coverageLines: null,
          name: component.name,
          kind: "component" as const,
        },
      ];
    }),
  ];
  const chartHistory = [...suiteHistory, ...componentHistory]
    .sort(
      (first, second) =>
        Date.parse(second.completedAt) - Date.parse(first.completedAt),
    )
    .slice(0, 10);
  const latestEvent = snapshot.latestTestEvent;
  const latestTestRun: OverviewTestRun | undefined = latestEvent
    ? {
        total: latestEvent.total,
        passed: latestEvent.passed,
        failed: latestEvent.failed,
        pending: latestEvent.pending,
        passedPercentage: latestEvent.passedPercentage,
        coverageLines: latestEvent.coverageLines,
        completedAt: latestEvent.completedAt,
        durationMs: latestEvent.durationMs,
        name:
          latestEvent.componentName ??
          latestEvent.componentSlug ??
          "Test suite",
        kind: latestEvent.scope,
        failures: latestEvent.failures,
      }
    : chartHistory[0];
  const activityItems: OverviewActivity[] = chartHistory
    .slice(0, 4)
    .map((item) => ({
      key: `${item.kind}-${item.completedAt}-${item.name}`,
      completedAt: item.completedAt,
      durationMs: item.durationMs,
      total: item.total,
      passed: item.passed,
      failed: item.failed,
      name: item.name,
      kind: item.kind,
    }));
  const componentCategories = ["Controls", "Forms", "Feedback"];
  const componentChartValues = componentCategories.map(
    (category) =>
      components.filter((item) => item.category === category).length,
  );
  const testChartValues = chartHistory
    .slice(0, 8)
    .reverse()
    .flatMap((item) =>
      item.passedPercentage === null ? [] : [item.passedPercentage],
    );
  return (
    <div className={tw("page-stack overview-page")}>
      <section className={tw("overview-hero")}>
        <div className={tw("hero-panel")}>
          <div className={tw("hero-glow")} aria-hidden="true" />
          <div className={tw("hero-copy")}>
            <span className={tw("hero-kicker")}>
              <Icon name="sparkles" size={15} /> WELCOME BACK!
            </span>
            <h1>
              Build better interfaces, <span>faster.</span>
            </h1>
            <p>
              A personal collection of reusable components, widgets, and
              utilities.
            </p>
          </div>
          <div className={tw("hero-art")}>
            <Image
              src="/neon_robot_banner.png"
              alt="Neon robot mascot holding a code panel"
              width={1672}
              height={942}
              priority
              sizes="(max-width: 720px) 80vw, 620px"
            />
          </div>
        </div>

        <section aria-label="Library summary" className={tw("stats-grid")}>
          <StatCard
            label="Components"
            value={String(components.length)}
            icon="components"
            color="purple"
            chartValues={componentChartValues}
            chartLabel={`Component counts by category: ${componentCategories.map((category, index) => `${category} ${componentChartValues[index]}`).join(", ")}`}
          />
          <StatCard
            label="Widgets"
            value={String(widgets.length)}
            icon="widgets"
            color="cyan"
            chartValues={[]}
            chartLabel="No widget data has been recorded"
          />
          <StatCard
            label="Tests passing"
            value={
              latestTestRun?.passedPercentage == null
                ? "—"
                : `${latestTestRun.passedPercentage}%`
            }
            icon="tests"
            color="green"
            chartValues={testChartValues}
            chartLabel={
              testChartValues.length
                ? `Pass percentage across ${testChartValues.length} actual suite and component test runs`
                : "No test run history yet"
            }
          />
          <StatCard
            label="Avg Render Time"
            value={
              snapshot.averageRenderTimeMs == null
                ? "—"
                : `${snapshot.averageRenderTimeMs.toFixed(2)} ms`
            }
            icon="clock"
            color="blue"
            chartValues={renderTimeHistory}
            chartLabel={
              renderTimeHistory.length
                ? `${renderTimeHistory.length} actual React Profiler samples this session`
                : "No render measurements yet"
            }
            emptyLabel="Profile a component"
          />
        </section>
      </section>

      <div className={tw("dashboard-grid dashboard-grid--primary")}>
        <section className={tw("panel test-performance-panel")}>
          <SectionTitle title="Test performance" href="/tests" icon="tests" />
          {chartHistory.length > 1 && (
            <div className={tw("chart-legend")}>
              <span>
                <i className={tw("legend-dot legend-dot--cyan")} /> Passing
                tests
              </span>
              {chartHistory.some((item) => item.coverageLines !== null) && (
                <span>
                  <i className={tw("legend-dot legend-dot--purple")} /> Line
                  coverage
                </span>
              )}
            </div>
          )}
          {chartHistory.length > 1 ? (
            <TestHistoryGraph history={chartHistory} />
          ) : latestTestRun ? (
            <div
              className={tw("result-chart")}
              aria-label={`${latestTestRun.passed} tests passed, ${latestTestRun.failed} failed, ${latestTestRun.pending} pending`}
            >
              <div className={tw("result-chart__bar")}>
                <span
                  style={{
                    width: `${latestTestRun.total ? (latestTestRun.passed / latestTestRun.total) * 100 : 0}%`,
                  }}
                />
              </div>
              <div className={tw("chart-values")}>
                <strong>{latestTestRun.passed} passed</strong>
                <span>{latestTestRun.failed} failed</span>
                <span>{latestTestRun.pending} pending</span>
              </div>
              <p>
                {latestTestRun.kind === "component"
                  ? `${latestTestRun.name} component tests`
                  : "Latest suite run"}{" "}
                · {new Date(latestTestRun.completedAt).toLocaleString()}
              </p>
            </div>
          ) : (
            <div className={tw("chart-empty")}>
              <div className={tw("chart-placeholder")}>
                <Icon name="activity" size={20} />
                <span>
                  Run component or suite tests to record a quality history.
                </span>
              </div>
            </div>
          )}
          {snapshot.coverage ? (
            <div className={tw("coverage-line")}>
              <span>Line coverage</span>
              <strong>{snapshot.coverage.lines}%</strong>
            </div>
          ) : (
            <div className={tw("coverage-line")}>
              <span>Coverage</span>
              <Badge tone="muted">Not collected</Badge>
            </div>
          )}
        </section>

        <section className={tw("panel activity-panel")}>
          <div className={tw("activity-heading")}>
            <span className={tw("activity-heading-icon")}>
              <Icon name="activity" size={20} />
            </span>
            <div>
              <h2>Recent Activity</h2>
            </div>
            <Link className={tw("text-link")} href="/tests">
              View all <Icon name="arrow-right" size={14} />
            </Link>
          </div>
          {activityItems.length ? (
            <ol className={tw("activity-list")}>
              {activityItems.map((item) => (
                <li
                  className={tw(
                    `activity-item activity-item--${item.kind}${item.failed ? " has-failures" : ""}`,
                  )}
                  key={item.key}
                >
                  <span className={tw("activity-timeline-dot")} />
                  <time dateTime={item.completedAt}>
                    {activityTime(item.completedAt)}
                  </time>
                  <span className={tw("activity-marker")}>
                    <Icon
                      name={
                        item.failed
                          ? "activity"
                          : item.kind === "component"
                            ? "components"
                            : "check"
                      }
                      size={16}
                    />
                  </span>
                  <div>
                    <strong>
                      {item.kind === "component"
                        ? `${item.name} component tests ${item.failed ? "failed" : "passed"}`
                        : `Test suite ${item.failed ? "reported failures" : "passed"}`}
                    </strong>
                    <span>
                      {item.passed}/{item.total} passed · {item.failed} failed ·{" "}
                      {item.durationMs} ms
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <div className={tw("activity-empty")}>
              <div className={tw("activity-empty-icons")}>
                <span className={tw("activity-marker activity-marker--passed")}>
                  <Icon name="check" size={14} />
                </span>
                <span
                  className={tw("activity-marker activity-marker--component")}
                >
                  <Icon name="components" size={14} />
                </span>
                <span className={tw("activity-marker activity-marker--failed")}>
                  <Icon name="activity" size={14} />
                </span>
              </div>
              <strong>No activity recorded yet</strong>
            </div>
          )}
        </section>
      </div>

      <div className={tw("dashboard-grid dashboard-grid--secondary")}>
        <section className={tw("panel component-overview-panel")}>
          <SectionTitle
            title="Components overview"
            href="/components"
            icon="components"
          />
          <div className={tw("overview-component-list")}>
            {components.slice(0, 4).map((component) => (
              <Link
                className={tw("overview-component")}
                href={`/components/${component.slug}`}
                key={component.slug}
              >
                <span
                  className={tw(
                    `overview-component__icon icon-${component.slug}`,
                  )}
                >
                  <Icon name="sparkles" size={22} />
                </span>
                <span>
                  <strong>{component.name}</strong>
                  <small>{component.category}</small>
                </span>
                <TestStatus slug={component.slug} compact />
              </Link>
            ))}
          </div>
        </section>

        <section className={tw("panel quick-actions-panel")}>
          <SectionTitle title="Quick actions" icon="play" />
          <div className={tw("quick-actions")}>
            <Link href="/playground">
              <Icon name="play" size={17} />
              <span>Open Playground</span>
              <Icon
                className={tw("quick-arrow")}
                name="arrow-right"
                size={15}
              />
            </Link>
            <button onClick={() => void runTests()} disabled={running}>
              <Icon name="tests" size={17} />
              <span>{running ? "Running tests…" : "Run Tests"}</span>
              <Icon
                className={tw("quick-arrow")}
                name="arrow-right"
                size={15}
              />
            </button>
            <Link href="/components">
              <Icon name="components" size={17} />
              <span>Browse Components</span>
              <Icon
                className={tw("quick-arrow")}
                name="arrow-right"
                size={15}
              />
            </Link>
            <Link href="/docs">
              <Icon name="book" size={17} />
              <span>View Documentation</span>
              <Icon
                className={tw("quick-arrow")}
                name="arrow-right"
                size={15}
              />
            </Link>
          </div>
          {snapshot.error && (
            <p className={tw("inline-error")} role="status">
              {snapshot.error}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

export function ComponentsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All categories");
  const categories = [
    "All categories",
    ...new Set(components.map((component) => component.category)),
  ];
  const filtered = useMemo(
    () =>
      components.filter(
        (component) =>
          component.name.toLowerCase().includes(query.toLowerCase()) &&
          (category === "All categories" || component.category === category),
      ),
    [category, query],
  );
  const grouped = useMemo(
    () =>
      filtered.reduce<Record<string, ComponentDefinition[]>>(
        (groups, component) => {
          (groups[component.category] ??= []).push(component);
          return groups;
        },
        {},
      ),
    [filtered],
  );

  return (
    <div className={tw("page-stack")}>
      <PageTitle
        eyebrow="LIBRARY / COMPONENTS"
        title="Components"
        description="Reusable interface building blocks, organized for quick inspection and experimentation."
        action={
          <Link className={tw("button button-primary")} href="/playground">
            <Icon name="play" size={15} /> Open playground
          </Link>
        }
      />
      <div className={tw("catalog-toolbar")}>
        <label className={tw("catalog-search")}>
          <Icon name="search" size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search components..."
            aria-label="Search components"
          />
          <kbd>⌘ K</kbd>
        </label>
        <div className={tw("category-select")}>
          <Icon name="filter" size={17} />
          <Dropdown
            label="Filter by category"
            value={category}
            onChange={setCategory}
            options={categories.map((item) => ({ label: item, value: item }))}
          />
        </div>
        <span className={tw("catalog-count")}>
          {filtered.length} {filtered.length === 1 ? "component" : "components"}
        </span>
      </div>
      {Object.keys(grouped).length ? (
        Object.entries(grouped).map(([group, items]) => (
          <section className={tw("catalog-group")} key={group}>
            <div className={tw("catalog-group-heading")}>
              <h2>{group}</h2>
              <span>{String(items.length).padStart(2, "0")}</span>
            </div>
            <div className={tw("component-grid")}>
              {items.map((component) => (
                <ComponentCard component={component} key={component.slug} />
              ))}
            </div>
          </section>
        ))
      ) : (
        <section className={tw("panel")}>
          <EmptyState
            icon="widgets"
            title="No matching components"
            description="Try a different name or category."
            action={
              <button
                className={tw("button button-quiet")}
                type="button"
                onClick={() => {
                  setQuery("");
                  setCategory("All categories");
                }}
              >
                Clear filters
              </button>
            }
          />
        </section>
      )}
    </div>
  );
}

function DetailPreview({
  slug,
  onMeasure,
}: {
  slug: string;
  onMeasure: (durationMs: number) => void;
}) {
  const { recordRenderTime } = useQuality();
  const [badgeTone, setBadgeTone] = useState<BadgeTone>("green");
  const [dot, setDot] = useState(true);
  const [duration, setDuration] = useState<number | null>(null);
  const [viewport, setViewport] = useState("Desktop");
  const hasMeasured = useRef(false);
  const hasReported = useRef(false);

  useEffect(() => {
    if (duration !== null && !hasReported.current) {
      hasReported.current = true;
      recordRenderTime(duration);
      onMeasure(duration);
    }
  }, [duration, onMeasure, recordRenderTime]);

  return (
    <div className={tw("detail-preview-area")}>
      <div className={tw("preview-toolbar")}>
        <span>
          <span className={tw("preview-live-dot")} /> Interactive preview
        </span>
        <div>
          {(["Desktop", "Tablet", "Mobile"] as const).map((item) => (
            <button
              type="button"
              aria-pressed={viewport === item}
              className={tw(viewport === item ? "is-selected" : "")}
              title={`${item} viewport`}
              key={item}
              onClick={() => setViewport(item)}
            >
              <Icon
                name={
                  item === "Desktop"
                    ? "monitor"
                    : item === "Tablet"
                      ? "tablet"
                      : "phone"
                }
                size={15}
              />
            </button>
          ))}
        </div>
      </div>
      <div
        className={tw(
          `component-stage component-stage--${viewport.toLowerCase()}`,
        )}
      >
        <div className={tw("component-stage__canvas")}>
          <Profiler
            id={`component-${slug}`}
            onRender={(_id, _phase, actualDuration) => {
              if (!hasMeasured.current) {
                hasMeasured.current = true;
                setDuration(actualDuration);
              }
            }}
          >
            <div className={tw("component-stage__center")}>
              <ComponentPreview tone={badgeTone} dot={dot} />
            </div>
          </Profiler>
        </div>
      </div>
      <div className={tw("preview-properties")}>
        <div className={tw("property-control")}>
          <span>Color tone</span>
          <Dropdown
            label="Color tone"
            value={badgeTone}
            onChange={(value) => setBadgeTone(value as BadgeTone)}
            options={badgeTones}
          />
        </div>
        <div className={tw("property-control property-switch")}>
          <span>Status dot</span>
          <DashboardToggle
            checked={dot}
            onChange={setDot}
            label="Show status dot"
          />
        </div>
        <span className={tw("render-measure")}>
          <Icon name="clock" size={14} />{" "}
          {duration === null
            ? "Measuring render…"
            : `${duration.toFixed(2)} ms actual render`}
        </span>
      </div>
    </div>
  );
}

export function ComponentDetailPage({ slug }: { slug: string }) {
  const component = getComponent(slug);
  const componentSlug = component?.slug;
  const { snapshot, running, runningComponentSlug, runComponentTests } =
    useQuality();
  const componentTest = snapshot.componentTests?.[slug];
  const [tab, setTab] = useState("Preview");
  const [copied, setCopied] = useState(false);
  const [componentRenderTimeMs, setComponentRenderTimeMs] = useState<
    number | null
  >(null);
  const [sourceFiles, setSourceFiles] = useState<{
    source: string;
    testSource: string;
  } | null>(null);
  const [sourceStatus, setSourceStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");

  useEffect(() => {
    if (tab !== "Source" || !componentSlug) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setSourceStatus("loading");
      void fetch(`/api/components/${componentSlug}/source`, {
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok) throw new Error("Source files are unavailable.");
          return (await response.json()) as {
            source: string;
            testSource: string;
          };
        })
        .then((files) => {
          setSourceFiles(files);
          setSourceStatus("ready");
        })
        .catch(() => {
          if (!controller.signal.aborted) setSourceStatus("error");
        });
    }, 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [componentSlug, tab]);

  if (!component) return <NotFoundPage />;
  const usage = '<Badge tone="green" dot>Ready</Badge>';
  const componentTestRunning = runningComponentSlug === slug;
  const componentTestsBusy = running || runningComponentSlug !== null;

  async function copyUsage() {
    await navigator.clipboard.writeText(usage);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className={tw("page-stack")}>
      <div className={tw("breadcrumb")}>
        <Link href="/components">Components</Link>
        <span>/</span>
        <span>{component.name}</span>
      </div>
      <PageTitle
        eyebrow={`COMPONENT / ${component.category.toUpperCase()}`}
        title={component.name}
        description={component.description}
        action={
          <div className={tw("component-detail-actions")}>
            <TestStatus slug={slug} />
            <button
              className={tw("button button-primary")}
              type="button"
              disabled={componentTestsBusy}
              onClick={() => void runComponentTests(slug)}
            >
              <Icon name="play" size={14} />
              {componentTestRunning
                ? "Running tests…"
                : `Run ${component.name} tests`}
            </button>
          </div>
        }
      />
      <div className={tw("detail-meta")}>
        <span>
          <Icon name="code" size={15} /> {component.source}
        </span>
        <Badge tone="cyan">{component.category}</Badge>
      </div>
      <div
        className={tw("detail-tabs")}
        role="tablist"
        aria-label="Component sections"
      >
        {["Preview", "Variants", "Tests", "Performance", "Source"].map(
          (item) => (
            <button
              role="tab"
              aria-selected={tab === item}
              className={tw(tab === item ? "is-selected" : "")}
              key={item}
              onClick={() => setTab(item)}
            >
              {item}
            </button>
          ),
        )}
      </div>
      {tab === "Preview" && (
        <section className={tw("panel detail-preview-panel")}>
          <DetailPreview
            slug={component.slug}
            onMeasure={setComponentRenderTimeMs}
          />
        </section>
      )}
      {tab === "Variants" && (
        <section className={tw("panel variants-panel")}>
          <SectionTitle
            title="Available variants"
            detail="Rendered with the library component itself"
          />
          <div className={tw("variant-samples")}>
            {badgeTones.map(({ label, value }) => (
              <div key={value}>
                <ComponentPreview tone={value as BadgeTone} />
                <span>{label}</span>
              </div>
            ))}
            <div>
              <ComponentPreview dot={false} />
              <span>Without status dot</span>
            </div>
          </div>
        </section>
      )}
      {tab === "Tests" && (
        <section className={tw("panel quality-detail-panel")}>
          <SectionTitle
            title="Test results"
            detail="Latest results for this component, plus full-suite failures"
          />
          {componentTest && componentTest.total > 0 ? (
            <>
              <div className={tw("quality-kpis")}>
                <div>
                  <strong>{componentTest.total}</strong>
                  <span>Test cases</span>
                </div>
                <div>
                  <strong className={tw("positive-text")}>
                    {componentTest.passed}
                  </strong>
                  <span>Passed</span>
                </div>
                <div>
                  <strong className={tw("negative-text")}>
                    {componentTest.failed}
                  </strong>
                  <span>Failed</span>
                </div>
                <div>
                  <strong>{componentTest.pending}</strong>
                  <span>Pending</span>
                </div>
              </div>
              <div className={tw("component-test-result-meta")}>
                Latest{" "}
                {componentTest.scope === "component"
                  ? "component run"
                  : "suite run"}
                {componentTest.completedAt
                  ? ` · ${new Date(componentTest.completedAt).toLocaleString()}`
                  : ""}
              </div>
              <TestCaseList assertions={componentTest.assertions} />
              <div className={tw("detail-test-source")}>
                <Icon name="code" size={14} /> {component.test}
                <span>
                  Suite coverage:{" "}
                  {snapshot.coverage
                    ? `${snapshot.coverage.lines}% lines`
                    : "not available"}
                </span>
              </div>
            </>
          ) : snapshot.testRun ? (
            <EmptyState
              icon="tests"
              title="No tests mapped to this component"
              description={`The latest Vitest report did not include test cases from ${component.test}.`}
            />
          ) : (
            <EmptyState
              icon="tests"
              title="No test results yet"
              description={`Run the Vitest suite to collect results for ${component.test}.`}
            />
          )}
          <SuiteFailurePanel
            failures={snapshot.suiteFailures ?? []}
            completedAt={snapshot.testRun?.completedAt}
          />
        </section>
      )}
      {tab === "Performance" && (
        <section className={tw("panel quality-detail-panel")}>
          <SectionTitle
            title="Render performance"
            detail="Measured in this browser session"
          />
          {componentRenderTimeMs == null ? (
            <EmptyState
              icon="activity"
              title="No render measurement yet"
              description="Open the Preview tab to collect an actual React Profiler duration for this component."
            />
          ) : (
            <>
              <div className={tw("quality-kpis")}>
                <div>
                  <strong>{componentRenderTimeMs.toFixed(2)} ms</strong>
                  <span>Initial render duration</span>
                </div>
                <div>
                  <strong>1</strong>
                  <span>Profiler sample</span>
                </div>
              </div>
              {/* <p className={tw("performance-observation")}>
                This is a single React Profiler measurement for the current
                preview. Re-render counts, unnecessary-render analysis, and
                benchmark comparisons need a dedicated benchmark run.
              </p> */}
            </>
          )}
        </section>
      )}
      {tab === "Source" && (
        <section className={tw("panel source-panel")}>
          <div className={tw("source-heading")}>
            <div>
              <SectionTitle
                title="Usage example"
                detail="Live example for the selected component"
              />
            </div>
            <button
              type="button"
              className={tw("copy-button")}
              onClick={() => void copyUsage()}
            >
              <Icon name="copy" size={15} /> {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <pre>
            <code>{usage}</code>
          </pre>
          <div className={tw("source-files")}>
            <section>
              <div className={tw("source-file-heading")}>
                <span>Implementation</span>
                <code>{component.source}</code>
              </div>
              <pre>
                <code>
                  {sourceStatus === "error"
                    ? "Source file unavailable."
                    : sourceStatus === "ready"
                      ? sourceFiles?.source
                      : "Loading implementation…"}
                </code>
              </pre>
            </section>
            <section>
              <div className={tw("source-file-heading")}>
                <span>Tests</span>
                <code>{component.test}</code>
              </div>
              <pre>
                <code>
                  {sourceStatus === "error"
                    ? "Test file unavailable."
                    : sourceStatus === "ready"
                      ? sourceFiles?.testSource
                      : "Loading tests…"}
                </code>
              </pre>
            </section>
          </div>
        </section>
      )}
      {snapshot.error && (
        <p className={tw("inline-error")} role="status">
          {snapshot.error}
        </p>
      )}
    </div>
  );
}

export function WidgetsPage() {
  return (
    <div className={tw("page-stack")}>
      <PageTitle
        eyebrow="LIBRARY / WIDGETS"
        title="Widgets"
        description="Larger, composed experiences built from the component library."
        action={
          <Link className={tw("button button-quiet")} href="/notes">
            <Icon name="plus" size={16} /> Propose a widget
          </Link>
        }
      />
      {widgets.length ? (
        <div className={tw("widget-catalog-grid")}>
          {widgets.map((widget) => (
            <article className={tw("panel widget-card")} key={widget.slug}>
              <div className={tw("widget-card__preview")}>
                <Icon name="widgets" size={25} />
              </div>
              <div className={tw("widget-card__body")}>
                <div>
                  <h2>{widget.name}</h2>
                  <Badge
                    tone={widget.status === "Ready" ? "green" : "amber"}
                    dot
                  >
                    {widget.status}
                  </Badge>
                </div>
                <span>{widget.category}</span>
                <p>{widget.description}</p>
                <code>{widget.source}</code>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className={tw("panel widget-empty-panel")}>
          <div className={tw("widget-orbit")} aria-hidden="true">
            <span />
            <span />
            <Icon name="widgets" size={28} />
          </div>
          <EmptyState
            icon="widgets"
            title="No widgets registered"
            description="Widgets are kept separate from UI primitives. Add a composed widget when one is ready to document and test."
            action={
              <Link href="/notes" className={tw("button button-primary")}>
                Capture an idea <Icon name="arrow-right" size={15} />
              </Link>
            }
          />
        </section>
      )}
      <div className={tw("widget-notes")}>
        <span>
          <Icon name="sparkles" size={16} />
        </span>
        <p>
          <strong>What belongs here?</strong> Charts, composed panels, date
          pickers, or other focused tools that combine several primitives.
        </p>
      </div>
    </div>
  );
}

export function PlaygroundPage() {
  const [slug, setSlug] = useState(components[0]?.slug ?? "badge");
  const [badgeTone, setBadgeTone] = useState<BadgeTone>("green");
  const [dot, setDot] = useState(true);
  const [viewport, setViewport] = useState("Desktop");
  const selected = getComponent(slug);
  const snippet = `<Badge tone="${badgeTone}"${dot ? " dot" : ""}>Ready</Badge>`;

  return (
    <div className={tw("page-stack")}>
      <PageTitle
        eyebrow="EXPERIMENT / PLAYGROUND"
        title="Playground"
        description="Explore component props and states in a safe, live preview."
      />
      <div className={tw("playground-layout")}>
        <aside className={tw("panel playground-controls")}>
          <div className={tw("control-heading")}>
            <span className={tw("control-heading-icon")}>
              <Icon name="filter" size={17} />
            </span>
            <div>
              <strong>Controls</strong>
              <small>Changes stay in this session</small>
            </div>
          </div>
          <div className={tw("control-label")}>
            <span>Component</span>
            <Dropdown
              label="Component"
              value={slug}
              onChange={setSlug}
              options={components.map((component) => ({
                label: component.name,
                value: component.slug,
              }))}
            />
          </div>
          <div className={tw("control-label")}>
            <span>Color tone</span>
            <Dropdown
              label="Color tone"
              value={badgeTone}
              onChange={(value) => setBadgeTone(value as BadgeTone)}
              options={badgeTones}
            />
          </div>
          <div className={tw("control-toggle")}>
            <span>
              <strong>Status dot</strong>
              <small>Show the badge indicator</small>
            </span>
            <DashboardToggle
              checked={dot}
              onChange={setDot}
              label="Show status dot"
            />
          </div>
          <div className={tw("control-divider")} />
          <div className={tw("viewport-picker")}>
            <strong>Viewport</strong>
            <div>
              {(["Desktop", "Tablet", "Mobile"] as const).map((item) => (
                <button
                  aria-pressed={viewport === item}
                  className={tw(viewport === item ? "is-selected" : "")}
                  key={item}
                  onClick={() => setViewport(item)}
                  title={item}
                >
                  <Icon
                    name={
                      item === "Desktop"
                        ? "monitor"
                        : item === "Tablet"
                          ? "tablet"
                          : "phone"
                    }
                    size={16}
                  />
                  <span>{item}</span>
                </button>
              ))}
            </div>
          </div>
          <Link
            className={tw("control-detail-link")}
            href={selected ? `/components/${selected.slug}` : "/components"}
          >
            Open component details <Icon name="arrow-right" size={14} />
          </Link>
        </aside>

        <section className={tw("panel playground-preview-panel")}>
          <div className={tw("playground-panel-heading")}>
            <div>
              <strong>Live preview</strong>
              <span>Changes update instantly</span>
            </div>
            <Badge tone="green" dot>
              Local
            </Badge>
          </div>
          <div
            className={tw(
              `playground-stage playground-stage--${viewport.toLowerCase()}`,
            )}
          >
            <div className={tw("playground-canvas")}>
              <ComponentPreview tone={badgeTone} dot={dot} />
            </div>
          </div>
          <div className={tw("code-preview-heading")}>
            <span>
              <Icon name="code" size={15} /> Example
            </span>
            <Link
              href={selected ? `/components/${selected.slug}` : "/components"}
            >
              View source <Icon name="arrow-right" size={14} />
            </Link>
          </div>
          <pre className={tw("code-preview")}>
            <code>{snippet}</code>
          </pre>
        </section>
      </div>
    </div>
  );
}

export function TestsPage() {
  const {
    snapshot,
    running,
    runningComponentSlug,
    loading,
    runTests,
    runComponentTests,
    refresh,
  } = useQuality();
  const latestEvent = snapshot.latestTestEvent;
  const run = latestEvent ?? snapshot.testRun;
  const runScope = latestEvent?.scope ?? "suite";
  const runName =
    latestEvent?.componentName ?? latestEvent?.componentSlug ?? "Component";
  const runHistory: QualityTestEvent[] = snapshot.testEventHistory?.length
    ? snapshot.testEventHistory
    : snapshot.history?.length
      ? snapshot.history.map((item) => ({ ...item, scope: "suite" as const }))
      : latestEvent
        ? [latestEvent]
        : run
          ? [{ ...run, scope: "suite" as const }]
          : [];
  const testsBusy = running || runningComponentSlug !== null;
  return (
    <div className={tw("page-stack")}>
      <PageTitle
        eyebrow="QUALITY / VITEST"
        title="Tests & Performance"
        description="Real suite results and browser measurements for the component library."
        action={
          <button
            className={tw("button button-primary")}
            type="button"
            onClick={() => void runTests()}
            disabled={testsBusy}
          >
            <Icon name="play" size={15} />{" "}
            {running
              ? "Running test suite…"
              : runningComponentSlug
                ? `Running ${runningComponentSlug} tests…`
                : "Run test suite"}
          </button>
        }
      />
      {snapshot.error && (
        <div className={tw("error-banner")} role="alert">
          <Icon name="activity" size={17} />
          <span>{snapshot.error}</span>
          <button onClick={() => void refresh()}>Retry</button>
        </div>
      )}
      <div className={tw("quality-kpis quality-kpis--wide")}>
        <div>
          <span>
            {runScope === "component" ? `${runName} tests` : "Total tests"}
          </span>
          <strong>{loading ? "…" : (run?.total ?? "—")}</strong>
          <small>
            {run
              ? `${runScope === "component" ? "Latest component run" : "Latest suite run"} · ${new Date(run.completedAt).toLocaleString()}`
              : "No test results yet"}
          </small>
        </div>
        <div>
          <span>Passed</span>
          <strong className={tw("positive-text")}>
            {loading ? "…" : (run?.passed ?? "—")}
          </strong>
          <small>
            {run
              ? `${run.passedPercentage ?? "—"}% pass rate`
              : "Run the suite to collect results"}
          </small>
        </div>
        <div>
          <span>Failed</span>
          <strong className={tw(run?.failed ? "negative-text" : "")}>
            {loading ? "…" : (run?.failed ?? "—")}
          </strong>
          <small>{run ? "Reported by Vitest" : "No test results yet"}</small>
        </div>
        <div>
          <span>Pending</span>
          <strong>{loading ? "…" : (run?.pending ?? "—")}</strong>
          <small>{run ? "Reported by Vitest" : "No test results yet"}</small>
        </div>
      </div>
      <SuiteFailurePanel
        failures={snapshot.suiteFailures ?? []}
        completedAt={snapshot.testRun?.completedAt}
      />
      <section className={tw("panel component-test-overview")}>
        <SectionTitle
          title="What each component tests"
          detail="Individual test cases from the latest component or suite run"
        />
        <div className={tw("component-test-groups")}>
          {components.map((component) => {
            const result = snapshot.componentTests?.[component.slug];
            return (
              <div className={tw("component-test-group")} key={component.slug}>
                <details open={components.length === 1}>
                  <summary>
                    <span className={tw("component-test-group-name")}>
                      {component.name}
                    </span>
                    <Badge
                      tone={
                        result?.failed
                          ? "amber"
                          : result?.total
                            ? "green"
                            : "muted"
                      }
                    >
                      {result?.total
                        ? `${result.passed}/${result.total} passed`
                        : "Not tested"}
                    </Badge>
                    <Icon name="chevron-down" size={15} />
                  </summary>
                  {result?.completedAt && (
                    <div className={tw("component-test-result-meta")}>
                      Latest{" "}
                      {result.scope === "component"
                        ? "component run"
                        : "suite run"}{" "}
                      · {new Date(result.completedAt).toLocaleString()}
                    </div>
                  )}
                  {result?.assertions.length ? (
                    <TestCaseList assertions={result.assertions} />
                  ) : (
                    <p className={tw("component-test-unavailable")}>
                      {run
                        ? "No test cases were found for this component in its latest run."
                        : "Run the suite to collect test cases for this component."}
                    </p>
                  )}
                </details>
                <button
                  className={tw("button button-quiet component-test-run")}
                  type="button"
                  onClick={() => void runComponentTests(component.slug)}
                  disabled={testsBusy}
                >
                  <Icon name="play" size={13} />
                  {runningComponentSlug === component.slug
                    ? "Running tests…"
                    : `Run ${component.name} tests`}
                </button>
              </div>
            );
          })}
        </div>
      </section>
      <div className={tw("dashboard-grid dashboard-grid--primary")}>
        <section className={tw("panel quality-panel")}>
          <SectionTitle
            title="Test runs"
            detail="Latest suite and component runs"
          />
          {runHistory.length ? (
            <ol className={tw("run-history")}>
              {runHistory.map((item) => (
                <li
                  className={tw("run-row")}
                  key={`${item.scope}-${item.completedAt}-${item.componentSlug ?? ""}`}
                >
                  <span
                    className={tw(
                      item.failed
                        ? "run-status run-status--failed"
                        : "run-status",
                    )}
                  >
                    <Icon name={item.failed ? "activity" : "check"} size={15} />
                  </span>
                  <div>
                    <strong>
                      {item.scope === "component"
                        ? `${item.componentName ?? "Component"} tests`
                        : "Vitest suite"}
                    </strong>
                    <small>
                      {item.total} tests · {item.passed} passed · {item.failed}{" "}
                      failed · {item.pending} pending
                    </small>
                  </div>
                  <span className={tw("run-duration")}>
                    {(item.durationMs / 1000).toFixed(1)}s
                  </span>
                  <span className={tw("run-time")}>
                    {new Date(item.completedAt).toLocaleTimeString()}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState
              icon="tests"
              title="No test runs yet"
              description="Run the Vitest suite to record pass, fail, and pending counts."
              action={
                <button
                  className={tw("button button-primary")}
                  type="button"
                  onClick={() => void runTests()}
                  disabled={testsBusy}
                >
                  Run tests
                </button>
              }
            />
          )}
        </section>
        <section className={tw("panel quality-panel")}>
          <SectionTitle
            title="Coverage"
            detail="Read from the latest Vitest coverage report"
          />
          {snapshot.coverage ? (
            <div className={tw("coverage-grid")}>
              {Object.entries(snapshot.coverage).map(([key, value]) => (
                <div key={key}>
                  <span>{key}</span>
                  <strong>{value}%</strong>
                  <div className={tw("coverage-track")}>
                    <span style={{ width: `${value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="activity"
              title="Coverage not collected"
              description="Run a coverage-enabled Vitest pass to produce line, statement, function, and branch metrics."
            />
          )}
        </section>
      </div>
      <section className={tw("panel performance-panel")}>
        <SectionTitle
          title="Performance"
          detail="Only actual browser measurements are shown"
        />
        <div className={tw("performance-empty-row")}>
          <span className={tw("performance-icon")}>
            <Icon name="clock" size={19} />
          </span>
          <div>
            <strong>
              {snapshot.averageRenderTimeMs == null
                ? "No aggregate render measurements"
                : `${snapshot.averageRenderTimeMs.toFixed(2)} ms average`}
            </strong>
            <p>
              Component previews can report actual render duration. There is no
              benchmark history or cross run comparison yet.
            </p>
          </div>
          <Badge tone="muted">
            {snapshot.averageRenderTimeMs == null ? "Not measured" : "Measured"}
          </Badge>
        </div>
      </section>
      <p className={tw("quality-footnote")}>
        <Icon name="sparkles" size={15} /> Suite and component test counts come
        from Vitest JSON output. Coverage comes from its generated coverage
        summary.
      </p>
    </div>
  );
}

type Note = { id: string; text: string; createdAt: string; kind: string };

export function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState("");
  const [kind, setKind] = useState("Improvement");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem("widget-kit-notes");
        if (saved) setNotes(JSON.parse(saved) as Note[]);
      } catch {
        setNotes([]);
      } finally {
        setReady(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (ready)
      window.localStorage.setItem("widget-kit-notes", JSON.stringify(notes));
  }, [notes, ready]);

  function addNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    setNotes((current) => [
      {
        id: crypto.randomUUID(),
        text: trimmed,
        createdAt: new Date().toISOString(),
        kind,
      },
      ...current,
    ]);
    setText("");
  }

  return (
    <div className={tw("page-stack")}>
      <PageTitle
        eyebrow="WORKSPACE / NOTES"
        title="Notes"
        description="A lightweight local scratchpad for implementation decisions, known issues, and ideas."
      />
      <div className={tw("notes-layout")}>
        <form className={tw("panel note-editor")} onSubmit={addNote}>
          <div className={tw("note-editor-heading")}>
            <span className={tw("note-editor-icon")}>
              <Icon name="notes" size={17} />
            </span>
            <div>
              <strong>Capture a thought</strong>
              <small>Stored in this browser only</small>
            </div>
          </div>
          <div className={tw("control-label")}>
            <span>Type</span>
            <Dropdown
              label="Type"
              value={kind}
              onChange={setKind}
              options={[
                "Improvement",
                "Known issue",
                "Component idea",
                "Decision",
              ].map((item) => ({ label: item, value: item }))}
            />
          </div>
          <label className={tw("control-label")}>
            Note
            <textarea
              aria-label="Note text"
              placeholder="What should you remember?"
              rows={5}
              value={text}
              onChange={(event) => setText(event.target.value)}
            />
          </label>
          <div className={tw("note-submit-row")}>
            <span>{notes.length} saved locally</span>
            <button
              className={tw("button button-primary")}
              type="submit"
              disabled={!text.trim()}
            >
              <Icon name="plus" size={15} /> Add note
            </button>
          </div>
        </form>
        <section className={tw("panel notes-list-panel")}>
          <div className={tw("notes-list-heading")}>
            <SectionTitle
              title="Your notes"
              detail="Saved in local browser storage"
            />
          </div>
          {notes.length ? (
            <ul className={tw("notes-list")}>
              {notes.map((note) => (
                <li key={note.id}>
                  <div>
                    <Badge
                      tone={
                        note.kind === "Known issue"
                          ? "amber"
                          : note.kind === "Component idea"
                            ? "purple"
                            : "cyan"
                      }
                    >
                      {note.kind}
                    </Badge>
                    <time>{new Date(note.createdAt).toLocaleString()}</time>
                  </div>
                  <p>{note.text}</p>
                  <button
                    type="button"
                    className={tw("note-delete")}
                    onClick={() =>
                      setNotes((current) =>
                        current.filter((item) => item.id !== note.id),
                      )
                    }
                    aria-label={`Delete note: ${note.text}`}
                  >
                    <Icon name="close" size={15} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon="notes"
              title="Your scratchpad is empty"
              description="Capture a small improvement, known issue, or component idea. Notes stay in this browser."
            />
          )}
        </section>
      </div>
    </div>
  );
}

export function DocumentationPage() {
  return (
    <div className={tw("page-stack")}>
      <PageTitle
        eyebrow="LIBRARY / DOCUMENTATION"
        title="Library docs"
        description="How this workspace organizes, previews, and measures reusable UI pieces."
      />
      <div className={tw("docs-grid")}>
        <section className={tw("panel docs-panel")}>
          <span className={tw("docs-icon")}>
            <Icon name="components" size={18} />
          </span>
          <h2>Component library</h2>
          <p>
            UI primitives live in <code>packages/components/ui</code>.
            Dashboard-only layout and catalogs live separately under{" "}
            <code>packages/components/dashboard</code>.
          </p>
          <Link className={tw("text-link")} href="/components">
            Browse components <Icon name="arrow-right" size={14} />
          </Link>
        </section>
        <section className={tw("panel docs-panel")}>
          <span className={tw("docs-icon docs-icon--cyan")}>
            <Icon name="play" size={18} />
          </span>
          <h2>Experiment safely</h2>
          <p>
            The playground changes only local view state. It does not edit
            component source files or persist prop changes.
          </p>
          <Link className={tw("text-link")} href="/playground">
            Open playground <Icon name="arrow-right" size={14} />
          </Link>
        </section>
        <section className={tw("panel docs-panel")}>
          <span className={tw("docs-icon docs-icon--green")}>
            <Icon name="tests" size={18} />
          </span>
          <h2>Quality reports</h2>
          <p>
            Run Tests calls Vitest with JSON and coverage reporters. Counts and
            coverage are read from the new run output.
          </p>
          <Link className={tw("text-link")} href="/tests">
            View quality <Icon name="arrow-right" size={14} />
          </Link>
        </section>
      </div>
      <section className={tw("panel docs-components")}>
        <SectionTitle
          title="Registered components"
          detail="The catalog is defined in packages/lib/catalog.ts"
        />
        <div className={tw("docs-component-list")}>
          {components.map((component) => (
            <Link key={component.slug} href={`/components/${component.slug}`}>
              <span>
                <strong>{component.name}</strong>
                <small>{component.description}</small>
              </span>
              <code>{component.source}</code>
              <Icon name="arrow-right" size={15} />
            </Link>
          ))}
        </div>
      </section>
      <section className={tw("panel docs-usage")}>
        <SectionTitle
          title="Import and use"
          detail="Public exports from the UI package entry point"
        />
        <pre>
          <code>
            {
              'import { Badge } from "@artxds/widget-kit";\n\n<Badge tone="green" dot>Ready</Badge>'
            }
          </code>
        </pre>
      </section>
    </div>
  );
}

export function NotFoundPage() {
  return (
    <div className={tw("page-stack")}>
      <PageTitle
        eyebrow="LIBRARY / NOT FOUND"
        title="Nothing here yet"
        description="This item is not registered in the current component catalog."
      />
      <section className={tw("panel")}>
        <EmptyState
          icon="widgets"
          title="No matching library item"
          description="Browse the registered components or return to the overview."
          action={
            <Link className={tw("button button-primary")} href="/components">
              Browse components
            </Link>
          }
        />
      </section>
    </div>
  );
}
