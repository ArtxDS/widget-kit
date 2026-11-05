"use client";

import type { ComponentDefinition } from "@/lib/catalog";
import { components, getComponent, widgets } from "@/lib/catalog";
import type { TestRunSummary, TestTargetType } from "@/lib/quality";
import { itemTestKey } from "@/lib/quality";
import { Badge, type BadgeTone } from "@artxds/widget-kit";
import { Toast } from "@/components/ui";
import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  WidgetMascotPreview,
} from "../mascot-playground";
import { useQuality } from "../quality/quality-provider";
import { Dropdown } from "../shared/dropdown";
import type { IconName } from "../shared/icon";
import { Icon } from "../shared/icon";
import { WidgetKitStudio } from "../studio";
import { TestsStudioPage } from "../tests-studio";

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
    <div className={`page-title-row
        flex
        items-end
        justify-between
        gap-[24px]
        [&_h1]:m-0
        [&_h1]:text-[clamp(28px,2.5vw,36px)]
        [&_h1]:font-bold
        [&_h1]:tracking-[-0.04em]
        [&_h1]:leading-[1.18]
        [@media(max-width:580px)]:items-start
        [@media(max-width:580px)]:flex-col
        [@media(max-width:580px)]:gap-[12px]
        [@media(max-width:580px)]:[&_h1]:text-[26px]
      `}>
      <div>
        <p className={"eyebrow m-[0_0_8px] text-[#c084fc] text-[11.5px] font-[740] tracking-[0.12em]"}>{eyebrow}</p>
        <h1>{title}</h1>
        <p className={`page-description
        max-w-[760px]
        m-[8px_0_0]
        text-[#9da0b3]
        text-[13.5px]
        leading-[1.65]
        [@media(max-width:580px)]:text-[12px]
      `}>{description}</p>
      </div>
      {action && <div className={"page-title-action flex-[0_0_auto] [@media(max-width:580px)]:self-start"}>{action}</div>}
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
    <div className={`section-title-row
        flex
        items-center
        justify-between
        gap-[16px]
        [&_h2]:m-0
        [&_h2]:text-[16.5px]
        [&_h2]:font-[650]
        [&_h2]:tracking-[-0.015em]
        [&_p]:m-[3px_0_0]
        [&_p]:text-[#8d8f9f]
        [&_p]:text-[12px]
      `}>
      <div className={(`section-title-copy${icon ? " has-icon" : ""}`) + " min-w-0 flex items-center gap-[14px]"}>
        {icon && (
          <span
            className={(`section-title-icon section-title-icon--${icon}`) + `
        size-[40px]
        
        flex-[0_0_auto]
        grid
        place-items-center
        [border:1px_solid_#7545a955]
        rounded-[11px]
        text-[#bb85ff]
        [background:linear-gradient(145deg,#9146df2b,#46227124)]
        [&.section-title-icon--tests]:border-[#3a8d8b66]
        [&.section-title-icon--tests]:text-[#48d8d0]
        [&.section-title-icon--tests]:[background:linear-gradient(145deg,#23b9b126,#17464324)]
        [&.section-title-icon--play]:border-[#3b70a366]
        [&.section-title-icon--play]:text-[#79baff]
        [&.section-title-icon--play]:[background:linear-gradient(145deg,#398ed526,#263e6924)]
      `}
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
        <Link className={`text-link
        inline-flex
        items-center
        gap-[6px]
        mt-px
        text-[#c084fc]
        text-[12px]
        font-semibold
        whitespace-nowrap
        [&:hover]:text-[#d9b8ff]
      `} href={href}>
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
    <div className={`empty-state
        min-h-[180px]
        flex
        flex-col
        items-center
        justify-center
        p-[28px_20px]
        text-center
        [&>strong]:text-[14px]
        [&>strong]:font-[650]
        [&>strong]:text-[#e6e5f2]
        [&>p]:max-w-[380px]
        [&>p]:m-[6px_0_0]
        [&>p]:text-[#8e90a2]
        [&>p]:text-[12.5px]
        [&>p]:leading-[1.6]
        [&>.button]:mt-[16px]
      `}>
      <span className={`empty-state-icon
        size-[44px]
        
        grid
        place-items-center
        mb-[12px]
        [border:1px_solid_#3b3648]
        rounded-[12px]
        text-[#b57eff]
        [background:#8c45dd1a]
      `}>
        <Icon name={icon} size={20} />
      </span>
      <strong>{title}</strong>
      <p>{description}</p>
      {action}
    </div>
  );
}

function ComponentPreview({
  slug = "badge",
  tone = "green",
  dot = true,
}: {
  slug?: string;
  tone?: BadgeTone;
  dot?: boolean;
}) {
  if (slug === "toast") {
    return <ToastPreview />;
  }

  return (
    <div className={"badge-preview flex flex-wrap justify-center items-center gap-[10px]"}>
      <Badge tone={tone} dot={dot}>
        Ready
      </Badge>
    </div>
  );
}

function ComponentLibraryMiniPreview() {
  return (
    <div className={"component-library-mini-preview"}>
      <ComponentPreview />
      <div className={"component-library-mini-preview__toast"}>
        <ToastPreview compact />
      </div>
    </div>
  );
}

function ToastPreview({
  variant = "success",
  mode = "normal",
  compact = false,
}: {
  variant?: "loading" | "success" | "warning" | "error";
  mode?: "normal" | "steps";
  compact?: boolean;
}) {
  return (
    <div aria-hidden="true" className={`toast-preview-frame${compact ? " toast-preview-frame--compact" : ""}`}>
      <Toast
        description={compact ? undefined : variant === "loading" ? "Working on your changes…" : "Your update is ready."}
        mode={mode}
        open
        placement="inline"
        steps={mode === "steps" ? [
          { label: "Preparing changes", status: "complete" },
          { label: "Saving update", status: variant === "loading" ? "current" : "complete" },
        ] : undefined}
        title={compact ? "Toast" : variant === "loading" ? "Saving changes" : "Changes saved"}
        variant={variant}
      />
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
  const { snapshot, loading } = useQuality();
  const result = snapshot.itemTests?.[itemTestKey("component", slug)];
  const hasTest = getComponent(slug)?.test !== undefined;
  if (loading)
    return (
      <span
        aria-label="Loading test status"
        className={`dashboard-skeleton
        dashboard-skeleton--test-status
        block
        [border-radius:6px]
        [background:linear-gradient(90deg,#1a1b25_25%,#2a2b37_50%,#1a1b25_75%)]
        bg-size-[200%_100%]
        animate-[dashboard-skeleton-shimmer_1.35s_ease-in-out_infinite]
        w-[76px]
        h-[21px]
        rounded-[99px]
      `}
        role="status"
      />
    );
  if (!result?.total)
    return (
      <Badge tone="muted" dot>
        {!hasTest ? "No tests registered" : compact ? "Not tested" : "No component tests yet"}
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


function ComponentCard({ component }: { component: ComponentDefinition }) {
  return (
    <article className={`component-card
        overflow-hidden
        [border:1px_solid_#282938]
        rounded-[14px]
        [background:linear-gradient(160deg,#151620,#101117_80%)]
        [box-shadow:0_10px_28px_#0004]
        [transition:all_0.2s_cubic-bezier(0.2,0.8,0.2,1)]
        [&:hover]:transform-[translateY(-3px)]
        [&:hover]:border-[#7848c4]
        [&:hover]:[box-shadow:0_16px_36px_#0006,0_0_20px_#9d5cff15]
      `}>
      <Link
        className={`component-card__preview
        min-h-[190px]
        grid
        place-items-center
        p-[24px]
        [border-bottom:1px_solid_#232431]
        [background:radial-gradient(ellipse_at_50%_120%,#46287933,transparent_65%),repeating-linear-gradient(0deg,transparent_0,transparent_23px,#ffffff05_24px),repeating-linear-gradient(90deg,transparent_0,transparent_23px,#ffffff05_24px),#111218]
        [@media(max-width:580px)]:min-h-[150px]
      `}
        href={`/components/${component.slug}`}
        aria-label={`Open ${component.name} details`}
      >
        <ComponentPreview slug={component.slug} />
      </Link>
      <div className={`component-card__body
        p-[18px_20px_20px]
        [&>p]:min-h-[42px]
        [&>p]:m-[10px_0_16px]
        [&>p]:text-[#9da0b3]
        [&>p]:text-[13px]
        [&>p]:leading-[1.6]
      `}>
        <div className={`component-card__heading
        flex
        justify-between
        items-start
        gap-[8px]
        [&_h3]:m-0
        [&_h3]:text-[16px]
        [&_h3]:font-[650]
        [&_h3]:tracking-[-0.01em]
        [&>div>span]:block
        [&>div>span]:mt-[3px]
        [&>div>span]:text-[#8e90a2]
        [&>div>span]:text-[11px]
        [&>div>span]:font-semibold
        [&>div>span]:uppercase
        [&>div>span]:tracking-[0.08em]
      `}>
          <div>
            <h3>{component.name}</h3>
            <span>{component.category}</span>
          </div>
          <TestStatus slug={component.slug} compact />
        </div>
        <p>{component.description}</p>
        <Link
          className={`component-open
        inline-flex
        items-center
        gap-[7px]
        text-[#c084fc]
        text-[12px]
        font-semibold
        [transition:gap_0.15s,color_0.15s]
        [&:hover]:text-[#e1c9ff]
        [&:hover]:gap-[9px]
      `}
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
  visual,
  visualType,
  chartValues,
  chartLabel,
  chartType = "line",
  emptyLabel = "No data yet",
  loading = false,
  href,
}: {
  label: string;
  value: string;
  icon: "components" | "widgets" | "tests" | "clock";
  color: "purple" | "cyan" | "green" | "blue";
  visual?: ReactNode;
  visualType?: "component" | "widget";
  chartValues?: number[];
  chartLabel?: string;
  chartType?: "line" | "bars";
  emptyLabel?: string;
  loading?: boolean;
  href?: string;
}) {
  chartValues ??= [];
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
  const maxBarValue = Math.max(...chartValues, 0);
  const barWidth = 8;
  const barGap = 5;
  const barGroupWidth =
    chartValues.length * barWidth +
    Math.max(0, chartValues.length - 1) * barGap;
  const firstBarX = (140 - barGroupWidth) / 2;

  return (
    <article
      aria-busy={loading}
      className={(`stat-card${href ? " is-link" : ""}`) + `
        relative
        min-w-0
        min-h-[140px]
        flex
        items-start
        gap-[12px]
        overflow-hidden
        p-[17px_16px_56px]
        [border:1px_solid_#302944]
        rounded-[12px]
        [background:linear-gradient(145deg,#1b1c20,#111216_76%)]
        [box-shadow:0_12px_30px_#0005]
        [transition:border-color_0.18s,transform_0.18s,box-shadow_0.18s]
        [&.is-link:hover]:border-[#7a4fb8]
        [&.is-link:hover]:transform-[translateY(-2px)]
        [&.is-link:hover]:[box-shadow:0_16px_36px_#0007,0_0_18px_#9d5cff12]
        [&::after]:[content:""]
        [&::after]:absolute
        [&::after]:inset-[0_0_auto]
        [&::after]:h-[2px]
        [&::after]:opacity-[0.78]
        [&::after]:[background:linear-gradient(90deg,transparent,#9d5cff55,transparent)]
        [@media(max-width:580px)]:min-h-[120px]
        [@media(max-width:580px)]:gap-[8px]
        [@media(max-width:580px)]:p-[13px_10px_49px]
      `}
    >
      {href && (
        <Link
          className={"stat-card__link absolute inset-0 z-1 rounded-[inherit]"}
          href={href}
          aria-label={label}
        />
      )}
      <div className={(`stat-icon stat-icon--${color}`) + `
        size-[46px]
        
        flex-[0_0_auto]
        grid
        place-items-center
        rounded-[12px]
        [background:#8144cf17]
        [&.stat-icon--purple]:text-[#ac68ff]
        [&.stat-icon--purple]:[background:#8d4add19]
        [&.stat-icon--cyan]:text-[#37d4ce]
        [&.stat-icon--cyan]:[background:#23b9b11a]
        [&.stat-icon--green]:text-[#6fe6b1]
        [&.stat-icon--green]:[background:#45d99b16]
        [&.stat-icon--blue]:text-[#68b7fc]
        [&.stat-icon--blue]:[background:#468de918]
        [@media(max-width:580px)]:size-[38px]
        
      `}>
        <Icon name={icon} size={26} />
      </div>
      <div className={`stat-card__copy
        min-w-0
        flex
        flex-col
        gap-[2px]
        pt-px
        [&_span]:order-0
        [&_span]:text-[#9a9bad]
        [&_span]:text-[12px]
        [&_strong]:text-[clamp(25px,2.2vw,32px)]
        [&_strong]:leading-[1.2]
        [&_strong]:tracking-[-0.045em]
        [&_strong]:font-[690]
        [&_small]:truncate
        [&_small]:text-[#747588]
        [&_small]:text-[9px]
        
        
        [@media(max-width:580px)]:[&_strong]:text-[22px]
        [@media(max-width:580px)]:[&_span]:text-[10px]
      `}>
        {loading ? (
          <span
            aria-hidden="true"
            className={`dashboard-skeleton
        dashboard-skeleton--stat-value
        block
        [border-radius:6px]
        [background:linear-gradient(90deg,#1a1b25_25%,#2a2b37_50%,#1a1b25_75%)]
        bg-size-[200%_100%]
        animate-[dashboard-skeleton-shimmer_1.35s_ease-in-out_infinite]
        w-[68px]
        h-[31px]
        m-[1px_0_2px]
        rounded-[7px]
      `}
          />
        ) : (
          <strong>{value}</strong>
        )}
        <span>{label}</span>
      </div>
      {loading ? (
        <span
          aria-hidden="true"
          className={`dashboard-skeleton
        dashboard-skeleton--stat-chart
        block
        rounded-[6px]
        [background:linear-gradient(90deg,#1a1b25_25%,#2a2b37_50%,#1a1b25_75%)]
        bg-size-[200%_100%]
        animate-[dashboard-skeleton-shimmer_1.35s_ease-in-out_infinite]
        absolute
        inset-x-[13px]
        bottom-[8px]
        
        h-[43px]
        [border-radius:5px]
      `}
        />
      ) : visual ? (
        <div
          aria-hidden="true"
          className={(`stat-card-preview stat-card-preview--${visualType ?? "component"}`) + `
        absolute
        inset-x-[13px]
        bottom-[8px]
        
        h-[43px]
        flex
        items-center
        justify-center
        overflow-hidden
        [border-top:1px_solid_#ffffff10]
        pointer-events-none
        [&_.wk-mascot-host]:flex
        [&_.wk-mascot-host]:items-center
        [&_.wk-mascot-host]:justify-center
        [@media(max-width:580px)]:inset-x-[9px]
        [@media(max-width:580px)]:bottom-[7px]
        
        [@media(max-width:580px)]:h-[36px]
        [background:radial-gradient(ellipse_at_center,#bd80ff12,transparent_70%)]
        [&_.badge-preview]:transform-[scale(0.88)]
        [background:radial-gradient(ellipse_at_center,_#38d9d218,_transparent_70%)]
      `}
        >
          {visual}
        </div>
      ) : (
        <svg
          className={(`stat-sparkline stat-sparkline--${color}${points.length ? "" : " is-empty"}`) + `
        absolute
        right-[13px]
        bottom-[9px]
        w-[calc(100%-26px)]
        h-[43px]
        overflow-visible
        [&.stat-sparkline--purple]:text-[#bd80ff]
        [&.stat-sparkline--purple_.stat-sparkline-line]:stroke-[#bd80ff]
        [&.stat-sparkline--purple_.stat-sparkline-area]:fill-[#bd80ff]
        [&.stat-sparkline--purple_.stat-sparkline-point]:fill-[#d3a7ff]
        [&.stat-sparkline--cyan]:text-[#38d9d2]
        [&.stat-sparkline--cyan_.stat-sparkline-line]:stroke-[#38d9d2]
        [&.stat-sparkline--cyan_.stat-sparkline-area]:fill-[#38d9d2]
        [&.stat-sparkline--cyan_.stat-sparkline-point]:fill-[#84fff8]
        [&.stat-sparkline--green]:text-[#66e4ad]
        [&.stat-sparkline--green_.stat-sparkline-line]:stroke-[#66e4ad]
        [&.stat-sparkline--green_.stat-sparkline-area]:fill-[#66e4ad]
        [&.stat-sparkline--green_.stat-sparkline-point]:fill-[#a5ffd0]
        [&.stat-sparkline--blue]:text-[#66b7ff]
        [&.stat-sparkline--blue_.stat-sparkline-line]:stroke-[#66b7ff]
        [&.stat-sparkline--blue_.stat-sparkline-area]:fill-[#66b7ff]
        [&.stat-sparkline--blue_.stat-sparkline-point]:fill-[#a2d5ff]
        [@media(max-width:580px)]:right-[9px]
        [@media(max-width:580px)]:bottom-[7px]
        [@media(max-width:580px)]:w-[calc(100%-18px)]
        [@media(max-width:580px)]:h-[36px]
      `}
          role="img"
          aria-label={chartLabel}
          viewBox="0 0 140 44"
          preserveAspectRatio="none"
        >
          <line
            className={"stat-sparkline-baseline stroke-[#ffffff10] stroke-1"}
            x1="0"
            x2="140"
            y1="40"
            y2="40"
          />
          {chartType === "line" && areaPath && (
            <path className={"stat-sparkline-area opacity-[0.13] transform-fill origin-[center_bottom]"} d={areaPath} />
          )}
          {chartType === "bars" && maxBarValue > 0
            ? chartValues.map((value, index) => {
                const barHeight = Math.max(2, (value / maxBarValue) * 27);
                return (
                  <rect
                    key={`${index}-${value}`}
                    x={firstBarX + index * (barWidth + barGap)}
                    y={40 - barHeight}
                    width={barWidth}
                    height={barHeight}
                    rx="2"
                    fill="currentColor"
                    opacity={0.45 + (value / maxBarValue) * 0.55}
                  >
                    <title>{`Run ${index + 1}: ${value.toFixed(2)} seconds`}</title>
                  </rect>
                );
              })
            : null}
          {chartType === "line" && points.length > 1 && (
            <polyline
              className={`stat-sparkline-line
        fill-none
        stroke-[2.2]
        [stroke-linecap:round]
        [stroke-linejoin:round]
        [stroke-dasharray:1]
        [stroke-dashoffset:1]
        filter-[drop-shadow(0_0_4px_currentColor)]
      `}
              pathLength={1}
              points={points.join(" ")}
            />
          )}
          {chartType === "line" && points.length === 1 && (
            <circle
              className={"stat-sparkline-point stroke-[#111219] stroke-2 transform-fill origin-center"}
              cx={points[0].split(",")[0]}
              cy={points[0].split(",")[1]}
              r="4.5"
            >
              <title>{`${chartValues[0]} recorded value`}</title>
            </circle>
          )}
          {!points.length && (
            <text
              className={"stat-sparkline-empty-label fill-[#6f7081] [font:8px_ui-sans-serif,system-ui,sans-serif]"}
              x="134"
              y="30"
              textAnchor="end"
            >
              {emptyLabel}
            </text>
          )}
        </svg>
      )}
    </article>
  );
}

type OverviewTestRun = TestRunSummary;

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
  return (
    <div className={`history-chart
        mt-[10px]
        [&_svg]:block
        [&_svg]:w-full
        [&_svg]:h-[133px]
        [&_svg]:overflow-visible
        [&_svg_line]:stroke-[#30313d]
        [&_svg_line]:stroke-[0.7]
        [&_svg_text]:fill-[#77798b]
        [&_svg_text]:[font:8px_ui-sans-serif,system-ui,sans-serif]
        [&_svg_.history-run-label]:fill-[#898b9c]
        [&_svg_.history-run-label]:text-[8px]
      `}>
      <svg
        role="img"
        aria-label={`Test pass rate across ${runs.length} recent individual runs`}
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
            className={`history-line
        history-line--passing
        fill-none
        stroke-[2.3]
        [stroke-linecap:round]
        [stroke-linejoin:round]
        [stroke-dasharray:1]
        [stroke-dashoffset:1]
        [&.history-line--passing]:stroke-[#9d5cff]
        [&.history-line--coverage]:stroke-[#a45af5]
      `}
            pathLength={1}
            points={passingPoints}
          />
        )}
        {runs.map((item, index) => (
          <g key={`${item.itemType}-${item.itemSlug}-${item.completedAt}`}>
            {item.passedPercentage !== null && (
              <circle
                className={`history-point
        history-point--passing
        stroke-[#14151c]
        stroke-2
        transform-fill
        origin-center
        [&.history-point--passing]:fill-[#9d5cff]
        [&.history-point--coverage]:fill-[#a45af5]
      `}
                style={{ animationDelay: `${index * 75}ms` }}
                cx={x(index)}
                cy={y(item.passedPercentage)}
                r="3.5"
              >
                <title>{`Run ${index + 1}: ${item.passedPercentage}% tests passing`}</title>
              </circle>
            )}
            <text
              className={"history-run-label"}
              x={x(index)}
              y="142"
              textAnchor="middle"
            >
              {index + 1}
            </text>
          </g>
        ))}
      </svg>
      <div className={"history-chart-caption flex justify-between m-[-2px_0_0_27px] text-[#737586] text-[8px]"}>
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
  itemName: string;
  itemType: TestTargetType;
};

function activityTime(date: string) {
  return `${new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(new Date(date))} UTC`;
}

export function OverviewPage() {
  const { snapshot, loading } = useQuality();
  const chartHistory: OverviewTestRun[] = snapshot.history ?? [];
  const latestTestRun = chartHistory[0];
  const activityItems: OverviewActivity[] = chartHistory
    .slice(0, 4)
    .map((item) => ({
      key: `${item.itemType}-${item.itemSlug}-${item.completedAt}`,
      completedAt: item.completedAt,
      durationMs: item.durationMs,
      total: item.total,
      passed: item.passed,
      failed: item.failed,
      itemName: item.itemName,
      itemType: item.itemType,
    }));
  const averageItemDurationMs = snapshot.averageItemDurationMs;
  const itemDurationHistory = chartHistory
    .slice(0, 8)
    .reverse()
    .map((item) => item.durationMs / 1000);
  const testChartValues = chartHistory
    .slice(0, 8)
    .reverse()
    .flatMap((item) =>
      item.passedPercentage === null ? [] : [item.passedPercentage],
    );
  return (
    <div className={`page-stack
        overview-page
        flex
        flex-col
        gap-[28px]
        [@media(max-width:580px)]:gap-[20px]
        [&_.section-title-row_h2]:text-[16.5px]
        [&_.text-link]:gap-[7px]
        [&_.text-link]:text-[12px]
      `}>
      <section className={`overview-hero
        relative
        [--hero-height:348px]
        [&::after]:[content:""]
        [&::after]:absolute
        [&::after]:z-2
        [&::after]:inset-[calc(var(--hero-height)-150px)_0_0]
        [&::after]:[background:linear-gradient(180deg,transparent_0,color-mix(in_srgb,var(--background)_76%,transparent)_80px,var(--background)_145px)]
        [&::after]:pointer-events-none
        [@media(max-width:820px)]:[--hero-height:310px]
        [@media(max-width:580px)]:[--hero-height:305px]
      `}>
        <div className={`hero-panel
        relative
        min-h-[348px]
        flex
        items-center
        overflow-hidden
        [border:1px_solid_#282538]
        [border-bottom:0]
        rounded-[15px]
        [background:radial-gradient(ellipse_at_82%_45%,#1b1c20_0,#111216_35%,#111216_70%)]
        [&::before]:[content:""]
        [&::before]:absolute
        [&::before]:inset-0
        [&::before]:opacity-[0.35]
        [&::before]:[background:radial-gradient(ellipse_at_88%_35%,#1d7c7a2d,transparent_34%),linear-gradient(115deg,transparent_58%,#542b9c14)]
        [&::before]:pointer-events-none
        [@media(max-width:820px)]:min-h-[310px]
        [@media(max-width:580px)]:min-h-[305px]
        [@media(max-width:580px)]:items-start
      `}>
          <div className={"hero-glow absolute right-[25%] bottom-[-115px] w-[360px] h-[200px] rounded-[50%] [background:#5425a344] filter-[blur(75px)]"} aria-hidden="true" />
          <div className={`hero-copy
        relative
        z-4
        w-[62%]
        p-[27px_12px_85px_30px]
        [&_h1]:max-w-[635px]
        [&_h1]:m-[2px_0_8px]
        [&_h1]:text-[clamp(28px,3vw,39px)]
        [&_h1]:leading-[1.13]
        [&_h1]:tracking-[-0.055em]
        [&_h1]:font-[690]
        [&_h1_span]:text-[#b16cff]
        [&_h1_span]:[text-shadow:0_0_26px_#974aff45]
        [&>p]:max-w-[580px]
        [&>p]:m-0
        [&>p]:text-[#a5a5b8]
        [&>p]:text-[13px]
        [&>p]:leading-[1.7]
        [@media(max-width:1120px)]:w-[66%]
        [@media(max-width:820px)]:w-[70%]
        [@media(max-width:820px)]:pl-[22px]
        [@media(max-width:820px)]:[&_h1]:text-[30px]
        [@media(max-width:580px)]:w-full
        [@media(max-width:580px)]:p-[22px_17px]
        [@media(max-width:580px)]:[&_h1]:max-w-[300px]
        [@media(max-width:580px)]:[&_h1]:text-[28px]
        [@media(max-width:580px)]:[&>p]:max-w-[300px]
        [@media(max-width:580px)]:[&>p]:text-[11px]
      `}>
            <span className={"hero-kicker inline-flex items-center gap-[7px] text-[#c49aff] text-[12px] font-[740] tracking-[0.11em]"}>
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
          <div className={`hero-art
        absolute
        inset-[0_0_0_auto]
        w-[48%]
        h-full
        [&_img]:absolute
        [&_img]:w-full
        [&_img]:h-[143%]
        [&_img]:right-[-2%]
        [&_img]:top-[-20%]
        [&_img]:object-contain
        [&_img]:object-center
        [&_img]:mix-blend-screen
        [&_img]:opacity-[0.9]
        [@media(max-width:1120px)]:w-[43%]
        [@media(max-width:1120px)]:opacity-[0.82]
        [@media(max-width:820px)]:w-[47%]
        [@media(max-width:820px)]:right-[-6%]
        [@media(max-width:820px)]:opacity-[0.72]
        [@media(max-width:580px)]:w-[60%]
        [@media(max-width:580px)]:h-[54%]
        [@media(max-width:580px)]:inset-[auto_0_0_auto]
        [@media(max-width:580px)]:opacity-[0.67]
        [@media(max-width:580px)]:[&_img]:h-[140%]
        [@media(max-width:580px)]:[&_img]:top-[-12%]
        [@media(max-width:580px)]:[&_img]:right-[-15%]
      `}>
            <Image
              src="/assets/img/neon_robot_banner.png"
              alt="Neon robot mascot holding a code panel"
              width={1672}
              height={942}
              priority
              sizes="(max-width: 720px) 80vw, 620px"
            />
          </div>
        </div>

        <section aria-label="Library summary" className={`stats-grid
        relative
        z-3
        grid
        grid-cols-4
        gap-[14px]
        m-[-126px_22px_0]
        [@media(max-width:820px)]:grid-cols-2
        [@media(max-width:820px)]:mt-[-108px]
        [@media(max-width:580px)]:gap-[8px]
        [@media(max-width:580px)]:m-[-82px_8px_0]
      `}>
          <StatCard
            label="Components"
            value={String(components.length)}
            icon="components"
            color="purple"
            href="/components"
            visual={<ComponentLibraryMiniPreview />}
            visualType="component"
          />
          <StatCard
            label="Widgets"
            value={String(widgets.length)}
            icon="widgets"
            color="cyan"
            href="/widgets"
            visual={<WidgetMascotPreview size={36} />}
            visualType="widget"
          />
          <StatCard
            label="Latest test pass rate"
            value={
              latestTestRun?.passedPercentage == null
                ? "—"
                : `${latestTestRun.passedPercentage}%`
            }
            icon="tests"
            color="purple"
            href="/tests"
            loading={loading}
            chartValues={testChartValues}
            chartLabel={
              testChartValues.length
                ? `Pass percentage across ${testChartValues.length} recent individual runs`
                : "No individual test runs yet"
            }
          />
          <StatCard
            label="Avg Individual Test Duration"
            value={
              averageItemDurationMs == null
                ? "—"
                : averageItemDurationMs >= 1000
                  ? `${(averageItemDurationMs / 1000).toFixed(1)} s`
                  : `${Math.round(averageItemDurationMs)} ms`
            }
            icon="clock"
            color="purple"
            href="/tests"
            loading={loading}
            chartValues={itemDurationHistory}
            chartType="bars"
            chartLabel={
              itemDurationHistory.length
                ? `Duration of the ${itemDurationHistory.length} most recent saved individual runs, in seconds`
                : "No saved individual test durations yet"
            }
            emptyLabel="Run an individual test"
          />
        </section>
      </section>

      <div className={`dashboard-grid
        dashboard-grid--primary
        grid
        gap-[18px]
        [&.dashboard-grid--primary]:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]
        [&.dashboard-grid--secondary]:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]
        [&_.panel]:p-[20px]
        [&_.activity-panel]:p-[20px_24px]
        [@media(max-width:1120px)]:[&.dashboard-grid--primary]:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]
        [@media(max-width:1120px)]:[&.dashboard-grid--secondary]:grid-cols-[1.15fr_0.85fr]
        [@media(max-width:1120px)]:[&_.activity-panel]:p-[18px]
        [@media(max-width:820px)]:[&.dashboard-grid--primary]:grid-cols-[1fr]
        [@media(max-width:820px)]:[&.dashboard-grid--secondary]:grid-cols-[1fr]
        [@media(max-width:580px)]:gap-[12px]
        [@media(max-width:580px)]:[&_.panel]:p-[16px]
        [@media(max-width:580px)]:[&_.activity-panel]:p-[16px]
      `}>
        <section
          aria-busy={loading}
          className={`panel
        test-performance-panel
        min-w-0
        [border:1px_solid_#262735]
        rounded-[14px]
        [background:linear-gradient(145deg,#1b1c20,#111216)]
        [box-shadow:0_8px_24px_#0004]
      `}
        >
          <SectionTitle title="Test performance" href="/tests" icon="tests" />
          {loading ? (
            <div aria-hidden="true" className={"chart-loading-skeleton min-h-[150px] flex items-center pt-[8px]"}>
              <span
                className={`dashboard-skeleton
        dashboard-skeleton--chart
        block
        [border-radius:6px]
        [background:linear-gradient(90deg,#1a1b25_25%,#2a2b37_50%,#1a1b25_75%)]
        bg-size-[200%_100%]
        animate-[dashboard-skeleton-shimmer_1.35s_ease-in-out_infinite]
        w-full
        h-[132px]
        rounded-[8px]
      `}
              />
            </div>
          ) : chartHistory.length > 1 ? (
            <div className={`chart-legend
        flex
        items-center
        justify-end
        gap-[16px]
        mt-[14px]
        text-[#a5a6b8]
        text-[12px]
        [&>span]:inline-flex
        [&>span]:items-center
        [&>span]:gap-[7px]
      `}>
              <span>
                <i className={`legend-dot
        legend-dot--purple
        size-[7px]
        
        rounded-[50%]
        [&.legend-dot--purple]:[background:#a458ff]
        [&.legend-dot--purple]:[box-shadow:0_0_8px_#a458ff77]
        [&.legend-dot--cyan]:[background:#31d9d2]
        [&.legend-dot--cyan]:[box-shadow:0_0_8px_#31d9d277]
      `} /> Passing
                tests
              </span>
            </div>
          ) : null}
          {!loading && chartHistory.length > 1 ? (
            <TestHistoryGraph history={chartHistory} />
          ) : !loading && latestTestRun ? (
            <div
              className={`result-chart
        relative
        min-h-[120px]
        flex
        flex-col
        justify-center
        gap-[12px]
        p-[18px_6px_10px]
        [&>p]:m-0
        [&>p]:text-[#808295]
        [&>p]:text-[12px]
      `}
              aria-label={`${latestTestRun.passed} tests passed, ${latestTestRun.failed} failed, ${latestTestRun.pending} pending`}
            >
              <div className={`result-chart__bar
        h-[9px]
        overflow-hidden
        rounded-[10px]
        [background:#2a2b36]
        [&_span]:block
        [&_span]:h-full
        [&_span]:rounded-[inherit]
        [&_span]:[background:linear-gradient(90deg,#944bfa,#39d0c3)]
        [&_span]:transform-[scaleX(0)]
        [&_span]:origin-[left_center]
      `}>
                <span
                  style={{
                    width: `${latestTestRun.total ? (latestTestRun.passed / latestTestRun.total) * 100 : 0}%`,
                  }}
                />
              </div>
              <div className={"chart-values flex gap-[16px] text-[#a8a9bc] text-[12px] [&_strong]:text-[#69dcaa] [&_strong]:font-semibold"}>
                <strong>{latestTestRun.passed} passed</strong>
                <span>{latestTestRun.failed} failed</span>
                <span>{latestTestRun.pending} pending</span>
              </div>
              <p>
                {latestTestRun.itemName} {latestTestRun.itemType} tests ·{" "}
                {new Date(latestTestRun.completedAt).toLocaleString()}
              </p>
            </div>
          ) : !loading ? (
            <div className={`chart-empty
        min-h-[130px]
        flex
        flex-col
        justify-center
        [&>p]:m-[4px_0_0]
        [&>p]:text-[#838497]
        [&>p]:text-center
        [&>p]:text-[12px]
      `}>
              <div className={`chart-placeholder
        min-h-[110px]
        flex
        flex-col
        items-center
        justify-center
        gap-[9px]
        [border:1px_dashed_#30313f]
        rounded-[10px]
        text-[#898a9d]
        [background:repeating-linear-gradient(to_bottom,transparent_0,transparent_24px,#292a3618_25px,transparent_26px)]
        text-center
        [&_svg]:text-[#9a72c7]
        [&_span]:text-[12px]
      `}>
                <Icon name="activity" size={20} />
                <span>
                  Run an individual component or widget test to record quality
                  history.
                </span>
              </div>
            </div>
          ) : null}
          <div className={`coverage-line
        flex
        justify-between
        items-center
        mt-[14px]
        pt-[12px]
        [border-top:1px_solid_#242531]
        text-[#9293a5]
        text-[12px]
      `}>
            <span>Test durations</span>
            <Badge tone="muted">Individual runs only</Badge>
          </div>
        </section>

        <section aria-busy={loading} className={`panel
        activity-panel
        min-w-0
        [border:1px_solid_#262735]
        rounded-[14px]
        [background:linear-gradient(145deg,#1b1c20,#111216)]
        [box-shadow:0_8px_24px_#0004]
      `}>
          <div className={`activity-heading
        flex
        items-center
        gap-[12px]
        ml-[2px]
        [&>div]:min-w-0
        [&>div]:flex-1
        [&_h2]:m-0
        [&_h2]:text-[17px]
        [&_h2]:leading-[1.2]
        [&_h2]:font-[650]
        [@media(max-width:1120px)]:gap-[10px]
        [@media(max-width:1120px)]:[&_h2]:text-[16px]
        [@media(max-width:580px)]:gap-[8px]
        [@media(max-width:580px)]:[&_h2]:text-[15px]
      `}>
            <span className={`activity-heading-icon
        size-[40px]
        
        flex-[0_0_auto]
        grid
        place-items-center
        [border:1px_solid_#75421e66]
        rounded-[11px]
        text-[#ffb45f]
        [background:linear-gradient(145deg,#c76c241f,#742d261b)]
        [box-shadow:inset_0_0_15px_#ff9e2410]
        [@media(max-width:1120px)]:size-[36px]
        
        [@media(max-width:1120px)]:rounded-[10px]
        [@media(max-width:1120px)]:[&_svg]:size-[20px]
        
        [@media(max-width:580px)]:size-[34px]
        
        [@media(max-width:580px)]:rounded-[9px]
        [@media(max-width:580px)]:[&_svg]:size-[19px]
        
      `}>
              <Icon name="activity" size={20} />
            </span>
            <div>
              <h2>Recent Activity</h2>
            </div>
            <Link className={`text-link
        inline-flex
        items-center
        gap-[6px]
        mt-px
        text-[#c084fc]
        text-[12px]
        font-semibold
        whitespace-nowrap
        [&:hover]:text-[#d9b8ff]
      `} href="/tests">
              View all <Icon name="arrow-right" size={14} />
            </Link>
          </div>
          {loading ? (
            <ol
              aria-hidden="true"
              className={`activity-list
        activity-skeleton-list
        relative
        flex
        flex-col
        gap-0
        m-[24px_0_0_2px]
        p-0
        [list-style:none]
        [&::before]:[content:""]
        [&::before]:absolute
        [&::before]:z-0
        [&::before]:inset-y-[8px]
        
        [&::before]:left-[4px]
        [&::before]:w-px
        [&::before]:[background:linear-gradient(#4acb9a77,#9d5cff66,#ff6f8277)]
        [&_li]:relative
        [&_li]:min-h-[66px]
        [&_li]:grid
        [&_li]:grid-cols-[8px_78px_34px_minmax(0,1fr)]
        [&_li]:items-center
        [&_li]:gap-[14px]
        [&_li]:[border-bottom:1px_solid_#22232d]
        [&_li:last-child]:[border-bottom:0]
        [&_time]:text-[#9293a5]
        [&_time]:text-[12px]
        [&_time]:whitespace-nowrap
        [&_li_div]:flex
        [&_li_div]:flex-col
        [&_li_div]:gap-[3px]
        [&_li_strong]:truncate
        [&_li_strong]:text-[13px]
        [&_li_strong]:font-semibold
        
        
        [&_li_div_span]:text-[#808295]
        [&_li_div_span]:text-[11.5px]
        [@media(max-width:1120px)]:mt-[20px]
        [@media(max-width:1120px)]:[&_li]:min-h-[62px]
        [@media(max-width:1120px)]:[&_li]:grid-cols-[8px_72px_32px_minmax(0,1fr)]
        [@media(max-width:1120px)]:[&_li]:gap-[12px]
        [@media(max-width:580px)]:mt-[18px]
        [@media(max-width:580px)]:[&_li]:min-h-[58px]
        [@media(max-width:580px)]:[&_li]:grid-cols-[8px_56px_28px_minmax(0,1fr)]
        [@media(max-width:580px)]:[&_li]:gap-[9px]
        [@media(max-width:580px)]:[&_time]:text-[10px]
        [@media(max-width:580px)]:[&_li_strong]:text-[11.5px]
        [@media(max-width:580px)]:[&_li_div_span]:text-[10px]
      `}
            >
              {[0, 1, 2].map((item) => (
                <li className={"activity-skeleton-row"} key={item}>
                  <span
                    className={`dashboard-skeleton
        dashboard-skeleton--timeline
        block
        [border-radius:6px]
        [background:linear-gradient(90deg,#1a1b25_25%,#2a2b37_50%,#1a1b25_75%)]
        bg-size-[200%_100%]
        animate-[dashboard-skeleton-shimmer_1.35s_ease-in-out_infinite]
        size-[8px]
        
        rounded-[50%]
      `}
                  />
                  <span
                    className={`dashboard-skeleton
        dashboard-skeleton--activity-time
        block
        rounded-[6px]
        [background:linear-gradient(90deg,#1a1b25_25%,#2a2b37_50%,#1a1b25_75%)]
        bg-size-[200%_100%]
        animate-[dashboard-skeleton-shimmer_1.35s_ease-in-out_infinite]
        w-[48px]
        h-[9px]
      `}
                  />
                  <span
                    className={`dashboard-skeleton
        dashboard-skeleton--activity-icon
        block
        [border-radius:6px]
        [background:linear-gradient(90deg,#1a1b25_25%,#2a2b37_50%,#1a1b25_75%)]
        bg-size-[200%_100%]
        animate-[dashboard-skeleton-shimmer_1.35s_ease-in-out_infinite]
        size-[34px]
        
        rounded-[10px]
      `}
                  />
                  <span className={"activity-skeleton-copy min-w-0 flex flex-col gap-[7px]"}>
                    <span
                      className={`dashboard-skeleton
        dashboard-skeleton--activity-title
        block
        rounded-[6px]
        [background:linear-gradient(90deg,#1a1b25_25%,#2a2b37_50%,#1a1b25_75%)]
        bg-size-[200%_100%]
        animate-[dashboard-skeleton-shimmer_1.35s_ease-in-out_infinite]
        w-[78%]
        h-[11px]
      `}
                    />
                    <span
                      className={`dashboard-skeleton
        dashboard-skeleton--activity-meta
        block
        rounded-[6px]
        [background:linear-gradient(90deg,#1a1b25_25%,#2a2b37_50%,#1a1b25_75%)]
        bg-size-[200%_100%]
        animate-[dashboard-skeleton-shimmer_1.35s_ease-in-out_infinite]
        w-[58%]
        h-[9px]
      `}
                    />
                  </span>
                </li>
              ))}
            </ol>
          ) : activityItems.length ? (
            <ol className={`activity-list
        relative
        flex
        flex-col
        gap-0
        m-[24px_0_0_2px]
        p-0
        [list-style:none]
        [&::before]:[content:""]
        [&::before]:absolute
        [&::before]:z-0
        [&::before]:inset-y-[8px]
        
        [&::before]:left-[4px]
        [&::before]:w-px
        [&::before]:[background:linear-gradient(#4acb9a77,#9d5cff66,#ff6f8277)]
        [&_li]:relative
        [&_li]:min-h-[66px]
        [&_li]:grid
        [&_li]:grid-cols-[8px_78px_34px_minmax(0,1fr)]
        [&_li]:items-center
        [&_li]:gap-[14px]
        [&_li]:[border-bottom:1px_solid_#22232d]
        [&_li:last-child]:[border-bottom:0]
        [&_time]:text-[#9293a5]
        [&_time]:text-[12px]
        [&_time]:whitespace-nowrap
        [&_li_div]:flex
        [&_li_div]:flex-col
        [&_li_div]:gap-[3px]
        [&_li_strong]:truncate
        [&_li_strong]:text-[13px]
        [&_li_strong]:font-semibold
        
        
        [&_li_div_span]:text-[#808295]
        [&_li_div_span]:text-[11.5px]
        [@media(max-width:1120px)]:mt-[20px]
        [@media(max-width:1120px)]:[&_li]:min-h-[62px]
        [@media(max-width:1120px)]:[&_li]:grid-cols-[8px_72px_32px_minmax(0,1fr)]
        [@media(max-width:1120px)]:[&_li]:gap-[12px]
        [@media(max-width:580px)]:mt-[18px]
        [@media(max-width:580px)]:[&_li]:min-h-[58px]
        [@media(max-width:580px)]:[&_li]:grid-cols-[8px_56px_28px_minmax(0,1fr)]
        [@media(max-width:580px)]:[&_li]:gap-[9px]
        [@media(max-width:580px)]:[&_time]:text-[10px]
        [@media(max-width:580px)]:[&_li_strong]:text-[11.5px]
        [@media(max-width:580px)]:[&_li_div_span]:text-[10px]
      `}>
              {activityItems.map((item) => (
                <li
                  className={(`activity-item activity-item--${item.itemType}${item.failed ? " has-failures" : ""}`) + `
        [&.activity-item--component_.activity-timeline-dot]:border-[#d4b2ff]
        [&.activity-item--component_.activity-timeline-dot]:[background:#9e63ee]
        [&.activity-item--component_.activity-timeline-dot]:[box-shadow:0_0_9px_#a15bff99]
        [&.activity-item--widget_.activity-timeline-dot]:border-[#a7efff]
        [&.activity-item--widget_.activity-timeline-dot]:[background:#45c7e8]
        [&.activity-item--widget_.activity-timeline-dot]:[box-shadow:0_0_9px_#45c7e899]
        [&.has-failures_.activity-timeline-dot]:border-[#ffc0c7]
        [&.has-failures_.activity-timeline-dot]:[background:#ed6176]
        [&.has-failures_.activity-timeline-dot]:[box-shadow:0_0_9px_#ed617699]
        [&.activity-item--component_.activity-marker]:border-[#7248a655]
        [&.activity-item--component_.activity-marker]:text-[#c195ff]
        [&.activity-item--component_.activity-marker]:[background:linear-gradient(145deg,#a45af52c,#7136c21c)]
        [&.activity-item--widget_.activity-marker]:border-[#45c7e855]
        [&.activity-item--widget_.activity-marker]:text-[#83e7fb]
        [&.activity-item--widget_.activity-marker]:[background:linear-gradient(145deg,#45c7e82c,#2284a51c)]
        [&.has-failures_.activity-marker]:border-[#9c405055]
        [&.has-failures_.activity-marker]:text-[#ff899a]
        [&.has-failures_.activity-marker]:[background:linear-gradient(145deg,#d64d6937,#81233324)]
      `}
                  key={item.key}
                >
                  <span className={`activity-timeline-dot
        relative
        z-1
        size-[8px]
        
        [border:1px_solid_#a6ffd4]
        rounded-[50%]
        [background:#3dc990]
        [box-shadow:0_0_9px_#37d99599]
      `} />
                  <time dateTime={item.completedAt}>
                    {activityTime(item.completedAt)}
                  </time>
                  <span className={`activity-marker
        size-[34px]
        
        grid
        place-items-center
        [border:1px_solid_#31845e55]
        rounded-[10px]
        text-[#65e2ad]
        [background:linear-gradient(145deg,#49d89c29,#2483581c)]
        [&.activity-marker--failed]:border-[#9c405055]
        [&.activity-marker--failed]:text-[#ff899a]
        [&.activity-marker--failed]:[background:linear-gradient(145deg,#d64d6937,#81233324)]
        [@media(max-width:1120px)]:size-[30px]
        
        [@media(max-width:580px)]:size-[28px]
        
      `}>
                    <Icon
                      name={
                        item.failed
                          ? "activity"
                          : item.itemType === "component"
                            ? "components"
                            : "widgets"
                      }
                      size={16}
                    />
                  </span>
                  <div>
                    <strong>
                      {item.itemName} {item.itemType} tests{" "}
                      {item.failed ? "failed" : "passed"}
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
            <div className={`activity-empty
        min-h-[200px]
        flex
        flex-col
        items-center
        justify-center
        p-[20px]
        text-center
        [&_.activity-marker]:size-[36px]
        
        [&>strong]:text-[13px]
        [&>strong]:font-[640]
        [&>p]:max-w-[280px]
        [&>p]:m-[6px_0_0]
        [&>p]:text-[#8e90a2]
        [&>p]:text-[12px]
        [&>p]:leading-[1.55]
      `}>
              <div className={"activity-empty-icons flex gap-[10px] mb-[14px]"}>
                <span className={`activity-marker
        activity-marker--passed
        size-[34px]
        
        grid
        place-items-center
        [border:1px_solid_#31845e55]
        rounded-[10px]
        text-[#65e2ad]
        [background:linear-gradient(145deg,#49d89c29,#2483581c)]
        [&.activity-marker--failed]:border-[#9c405055]
        [&.activity-marker--failed]:text-[#ff899a]
        [&.activity-marker--failed]:[background:linear-gradient(145deg,#d64d6937,#81233324)]
        [@media(max-width:1120px)]:size-[30px]
        
        [@media(max-width:580px)]:size-[28px]
        
      `}>
                  <Icon name="check" size={14} />
                </span>
                <span
                  className={`activity-marker
        activity-marker--component
        size-[34px]
        
        grid
        place-items-center
        [border:1px_solid_#31845e55]
        rounded-[10px]
        text-[#65e2ad]
        [background:linear-gradient(145deg,#49d89c29,#2483581c)]
        [&.activity-marker--failed]:border-[#9c405055]
        [&.activity-marker--failed]:text-[#ff899a]
        [&.activity-marker--failed]:[background:linear-gradient(145deg,#d64d6937,#81233324)]
        [@media(max-width:1120px)]:size-[30px]
        
        [@media(max-width:580px)]:size-[28px]
        
      `}
                >
                  <Icon name="components" size={14} />
                </span>
                <span className={`activity-marker
        activity-marker--failed
        size-[34px]
        
        grid
        place-items-center
        [border:1px_solid_#31845e55]
        rounded-[10px]
        text-[#65e2ad]
        [background:linear-gradient(145deg,#49d89c29,#2483581c)]
        [&.activity-marker--failed]:border-[#9c405055]
        [&.activity-marker--failed]:text-[#ff899a]
        [&.activity-marker--failed]:[background:linear-gradient(145deg,#d64d6937,#81233324)]
        [@media(max-width:1120px)]:size-[30px]
        
        [@media(max-width:580px)]:size-[28px]
        
      `}>
                  <Icon name="activity" size={14} />
                </span>
              </div>
              <strong>No activity recorded yet</strong>
            </div>
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
    <div className={"component-library-page page-stack flex flex-col gap-[28px] [@media(max-width:580px)]:gap-[20px]"}>
      <PageTitle
        eyebrow="LIBRARY / COMPONENTS"
        title="Components"
        description="Reusable interface building blocks, organized for quick inspection and experimentation."
        action={
          <Link className={`button
        button-primary
        min-h-[38px]
        inline-flex
        items-center
        justify-center
        gap-[8px]
        p-[0_16px]
        [border:1px_solid_transparent]
        rounded-[9px]
        text-[12.5px]
        font-semibold
        leading-none
        whitespace-nowrap
        cursor-pointer
        [transition:filter_0.16s,transform_0.16s,background_0.16s,border-color_0.16s,box-shadow_0.16s]
        [&:hover:not(:disabled)]:filter-[brightness(1.1)]
        [&:hover:not(:disabled)]:transform-[translateY(-1px)]
        disabled:cursor-not-allowed
        disabled:opacity-[0.52]
        [&.button-primary]:border-[#8747d8]
        [&.button-primary]:text-[white]
        [&.button-primary]:[background:linear-gradient(115deg,#7938cf,#5731a1)]
        [&.button-primary]:[box-shadow:0_4px_18px_#662ab544]
        [&.button-quiet]:border-[#30313f]
        [&.button-quiet]:text-[#dad9e7]
        [&.button-quiet]:[background:#171821cc]
        [&.button-quiet:hover]:border-[#5a4773]
        [&.button-quiet:hover]:[background:#20202e]
      `} href="/playground">
            <Icon name="play" size={15} /> Open playground
          </Link>
        }
      />
      <div className={"catalog-toolbar flex items-center gap-[12px] [@media(max-width:580px)]:flex-wrap"}>
        <label className={`catalog-search
        h-[42px]
        flex
        items-center
        gap-[10px]
        p-[0_14px]
        [border:1px_solid_#292a38]
        rounded-[10px]
        text-[#9da0b5]
        [background:#111219]
        w-[min(440px,55%)]
        [transition:border-color_0.15s,box-shadow_0.15s]
        [&_input]:w-full
        [&_input]:[border:0]
        [&_input]:[outline:0]
        [&_input]:text-(--foreground)
        [&_input]:[background:transparent]
        [&_input]:text-[12.5px]
        [&_input::placeholder]:text-[#7b7d90]
        focus-within:border-[#8e56de]
        focus-within:[box-shadow:0_0_0_3px_#9d5cff15]
        [@media(max-width:580px)]:w-full
      `}>
          <Icon name="search" size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search components..."
            aria-label="Search components"
          />
          <kbd>⌘ K</kbd>
        </label>
        <div className={`category-select
        h-[42px]
        flex
        items-center
        gap-[8px]
        p-[0_10px]
        [border:1px_solid_#2f303f]
        rounded-[10px]
        text-[#9fa0b4]
        [background:#12131b]
        min-w-[190px]
        [&>svg]:flex-[0_0_auto]
        [&_.dropdown]:flex-1
        [&_.dropdown]:w-auto
        [&_.dropdown-trigger]:min-h-[38px]
        [&_.dropdown-trigger]:px-[4px]
        [&_.dropdown-trigger]:[border:0]
        [&_.dropdown-trigger]:[background:transparent]
        [@media(max-width:580px)]:min-w-0
        [@media(max-width:580px)]:flex-1
      `}>
          <Icon name="filter" size={17} />
          <Dropdown
            label="Filter by category"
            value={category}
            onChange={setCategory}
            options={categories.map((item) => ({ label: item, value: item }))}
          />
        </div>
        <span className={"catalog-count ml-auto text-[#9293a5] text-[12px] font-[550] [@media(max-width:580px)]:ml-auto"}>
          {filtered.length} {filtered.length === 1 ? "component" : "components"}
        </span>
      </div>
      {Object.keys(grouped).length ? (
        Object.entries(grouped).map(([group, items]) => (
          <section className={"catalog-group flex flex-col gap-[16px]"} key={group}>
            <div className={`catalog-group-heading
        flex
        items-center
        gap-[10px]
        pb-[12px]
        [border-bottom:1px_solid_#232431]
        [&_h2]:m-0
        [&_h2]:text-[16px]
        [&_h2]:font-[650]
        [&_h2]:tracking-[-0.01em]
        [&_span]:inline-flex
        [&_span]:items-center
        [&_span]:p-[2px_8px]
        [&_span]:rounded-[6px]
        [&_span]:[background:#181924]
        [&_span]:[border:1px_solid_#262736]
        [&_span]:text-[#a5a6b8]
        [&_span]:[font:11px_ui-monospace,SFMono-Regular,Menlo,monospace]
        [&_span]:font-semibold
      `}>
              <h2>{group}</h2>
              <span>{String(items.length).padStart(2, "0")}</span>
            </div>
            <div className={`component-grid
        grid
        grid-cols-[repeat(auto-fill,minmax(360px,1fr))]
        gap-[20px]
        [@media(max-width:1120px)]:grid-cols-2
        [@media(max-width:580px)]:grid-cols-[1fr]
      `}>
              {items.map((component) => (
                <ComponentCard component={component} key={component.slug} />
              ))}
            </div>
          </section>
        ))
      ) : (
        <section className={`panel
        min-w-0
        [border:1px_solid_#262735]
        rounded-[14px]
        [background:linear-gradient(145deg,#151620,#101117)]
        [box-shadow:0_8px_24px_#0004]
      `}>
          <EmptyState
            icon="widgets"
            title="No matching components"
            description="Try a different name or category."
            action={
              <button
                className={`button
        button-quiet
        min-h-[38px]
        inline-flex
        items-center
        justify-center
        gap-[8px]
        p-[0_16px]
        [border:1px_solid_transparent]
        rounded-[9px]
        text-[12.5px]
        font-semibold
        leading-none
        whitespace-nowrap
        cursor-pointer
        [transition:filter_0.16s,transform_0.16s,background_0.16s,border-color_0.16s,box-shadow_0.16s]
        [&:hover:not(:disabled)]:filter-[brightness(1.1)]
        [&:hover:not(:disabled)]:transform-[translateY(-1px)]
        disabled:cursor-not-allowed
        disabled:opacity-[0.52]
        [&.button-primary]:border-[#8747d8]
        [&.button-primary]:text-[white]
        [&.button-primary]:[background:linear-gradient(115deg,#7938cf,#5731a1)]
        [&.button-primary]:[box-shadow:0_4px_18px_#662ab544]
        [&.button-quiet]:border-[#30313f]
        [&.button-quiet]:text-[#dad9e7]
        [&.button-quiet]:[background:#171821cc]
        [&.button-quiet:hover]:border-[#5a4773]
        [&.button-quiet:hover]:[background:#20202e]
      `}
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

export function ComponentDetailPage({ slug }: { slug: string }) {
  if (!getComponent(slug)) return <NotFoundPage />;
  return (
    <WidgetKitStudio
      key={slug}
      initialItem={slug}
      initialMode="preview"
    />
  );
}

export function WidgetsPage() {
  return (
    <div className={"widget-library-page page-stack flex flex-col gap-[28px] [@media(max-width:580px)]:gap-[20px]"}>
      <PageTitle
        eyebrow="LIBRARY / WIDGETS"
        title="Widgets"
        description="Larger, composed experiences built from the component library."
        action={
          <Link className={`button
        button-quiet
        min-h-[38px]
        inline-flex
        items-center
        justify-center
        gap-[8px]
        p-[0_16px]
        [border:1px_solid_transparent]
        rounded-[9px]
        text-[12.5px]
        font-semibold
        leading-none
        whitespace-nowrap
        cursor-pointer
        [transition:filter_0.16s,transform_0.16s,background_0.16s,border-color_0.16s,box-shadow_0.16s]
        [&:hover:not(:disabled)]:filter-[brightness(1.1)]
        [&:hover:not(:disabled)]:transform-[translateY(-1px)]
        disabled:cursor-not-allowed
        disabled:opacity-[0.52]
        [&.button-primary]:border-[#8747d8]
        [&.button-primary]:text-[white]
        [&.button-primary]:[background:linear-gradient(115deg,#7938cf,#5731a1)]
        [&.button-primary]:[box-shadow:0_4px_18px_#662ab544]
        [&.button-quiet]:border-[#30313f]
        [&.button-quiet]:text-[#dad9e7]
        [&.button-quiet]:[background:#171821cc]
        [&.button-quiet:hover]:border-[#5a4773]
        [&.button-quiet:hover]:[background:#20202e]
      `} href="/notes">
            <Icon name="plus" size={16} /> Propose a widget
          </Link>
        }
      />
      {widgets.length ? (
        <div className={`widget-catalog-grid
        grid
        grid-cols-[repeat(auto-fill,minmax(440px,1fr))]
        gap-[24px]
        [@media(max-width:580px)]:grid-cols-[1fr]
      `}>
          {widgets.map((widget) => (
            <Link
              className={`panel
        widget-card
        min-w-0
        [border:1px_solid_#262735]
        rounded-[14px]
        [background:linear-gradient(145deg,_#151620,_#101117)]
        [box-shadow:0_8px_24px_#0004]
        overflow-hidden
        [border:1px_solid_#2b283b]
        [background:linear-gradient(160deg,#161722,#101117_80%)]
        [box-shadow:0_12px_30px_#0004]
        [transition:all_0.2s_cubic-bezier(0.2,0.8,0.2,1)]
        [&:hover]:transform-[translateY(-3px)]
        [&:hover]:border-[#8b55d8]
        [&:hover]:[box-shadow:0_18px_40px_#0006,0_0_24px_#9d5cff18]
      `}
              href={`/playground?item=${widget.slug}`}
              key={widget.slug}
            >
              <div className={`widget-card__preview
        min-h-[260px]
        grid
        place-items-center
        p-[24px]
        [border-bottom:1px_solid_#232431]
        text-[#c084fc]
        [background:radial-gradient(ellipse_at_center,#6b35b822,transparent_65%),repeating-linear-gradient(0deg,transparent_0,transparent_27px,#ffffff05_28px),repeating-linear-gradient(90deg,transparent_0,transparent_27px,#ffffff05_28px),#111218]
      `}>
                {widget.slug === "mascot" ? (
                  <WidgetMascotPreview />
                ) : (
                  <Icon name="widgets" size={25} />
                )}
              </div>
              <div className={`widget-card__body
        p-[22px_24px_24px]
        [&>div]:flex
        [&>div]:items-center
        [&>div]:justify-between
        [&>div]:gap-[10px]
        [&_h2]:m-0
        [&_h2]:text-[18px]
        [&_h2]:font-bold
        [&_h2]:tracking-[-0.015em]
        [&>span]:block
        [&>span]:mt-[4px]
        [&>span]:text-[#9293a5]
        [&>span]:text-[11px]
        [&>span]:font-semibold
        [&>span]:uppercase
        [&>span]:tracking-[0.08em]
        [&_p]:min-h-[44px]
        [&_p]:m-[12px_0_18px]
        [&_p]:text-[#9da0b3]
        [&_p]:text-[13.5px]
        [&_p]:leading-[1.6]
        [&_code]:inline-flex
        [&_code]:items-center
        [&_code]:gap-[6px]
        [&_code]:p-[5px_10px]
        [&_code]:rounded-[7px]
        [&_code]:[background:#0c0d13]
        [&_code]:[border:1px_solid_#242533]
        [&_code]:text-[#c49aff]
        [&_code]:[font:11px/1.4_ui-monospace,SFMono-Regular,Menlo,monospace]
      `}>
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
            </Link>
          ))}
        </div>
      ) : (
        <section className={`panel
        widget-empty-panel
        min-w-0
        [border:1px_solid_#262735]
        rounded-[14px]
        [background:linear-gradient(145deg,#151620,#101117)]
        [box-shadow:0_8px_24px_#0004]
        relative
        min-h-[360px]
        grid
        place-items-center
        overflow-hidden
        [&_.empty-state]:relative
        [&_.empty-state]:z-1
        [&_.empty-state>p]:max-w-[440px]
        [@media(max-width:580px)]:min-h-[300px]
      `}>
          <div className={`widget-orbit
        absolute
        inset-0
        grid
        place-items-center
        text-[#8142d2]
        opacity-[0.14]
        [&::before]:[content:""]
        [&::before]:absolute
        [&::before]:w-[250px]
        [&::before]:h-[120px]
        [&::before]:[border:1px_solid_#934df9]
        [&::before]:rounded-[50%]
        [&::before]:transform-[rotate(-25deg)]
        [&::after]:[content:""]
        [&::after]:absolute
        [&::after]:w-[340px]
        [&::after]:h-[175px]
        [&::after]:[border:1px_solid_#934df9]
        [&::after]:rounded-[50%]
        [&::after]:transform-[rotate(32deg)]
        [&>span]:absolute
        [&>span]:size-[6px]
        
        [&>span]:rounded-[50%]
        [&>span]:[background:#38d7d0]
        [&>span]:[box-shadow:0_0_12px_#38d7d0]
        [&>span:first-child]:transform-[translate(135px,-48px)]
        [&>span:nth-child(2)]:transform-[translate(-105px,64px)]
      `} aria-hidden="true">
            <span />
            <span />
            <Icon name="widgets" size={28} />
          </div>
          <EmptyState
            icon="widgets"
            title="No widgets registered"
            description="Widgets are kept separate from UI primitives. Add a composed widget when one is ready to document and test."
            action={
              <Link href="/notes" className={`button
        button-primary
        min-h-[38px]
        inline-flex
        items-center
        justify-center
        gap-[8px]
        p-[0_16px]
        [border:1px_solid_transparent]
        rounded-[9px]
        text-[12.5px]
        font-semibold
        leading-none
        whitespace-nowrap
        cursor-pointer
        [transition:filter_0.16s,transform_0.16s,background_0.16s,border-color_0.16s,box-shadow_0.16s]
        [&:hover:not(:disabled)]:filter-[brightness(1.1)]
        [&:hover:not(:disabled)]:transform-[translateY(-1px)]
        disabled:cursor-not-allowed
        disabled:opacity-[0.52]
        [&.button-primary]:border-[#8747d8]
        [&.button-primary]:text-[white]
        [&.button-primary]:[background:linear-gradient(115deg,#7938cf,#5731a1)]
        [&.button-primary]:[box-shadow:0_4px_18px_#662ab544]
        [&.button-quiet]:border-[#30313f]
        [&.button-quiet]:text-[#dad9e7]
        [&.button-quiet]:[background:#171821cc]
        [&.button-quiet:hover]:border-[#5a4773]
        [&.button-quiet:hover]:[background:#20202e]
      `}>
                Capture an idea <Icon name="arrow-right" size={15} />
              </Link>
            }
          />
        </section>
      )}
      <div className={`widget-notes
        flex
        items-center
        gap-[14px]
        p-[18px_22px]
        [border:1px_solid_#262736]
        rounded-[12px]
        [background:linear-gradient(145deg,#14151e,#111217)]
        [&>span]:size-[38px]
        
        [&>span]:flex-[0_0_auto]
        [&>span]:grid
        [&>span]:place-items-center
        [&>span]:rounded-[10px]
        [&>span]:[background:#9d5cff18]
        [&>span]:[border:1px_solid_#7545a944]
        [&>span]:text-[#c084fc]
        [&_p]:m-0
        [&_p]:text-[#9da0b3]
        [&_p]:text-[13px]
        [&_p]:leading-[1.6]
        [&_strong]:text-[#edeaf5]
        [&_strong]:font-semibold
        [&_strong]:mr-[4px]
      `}>
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

export function PlaygroundPage({
  initialItem,
  initialMode = "playground",
}: {
  initialItem?: string;
  initialMode?: "preview" | "playground";
} = {}) {
  return (
    <WidgetKitStudio
      key={initialItem ?? "default"}
      initialItem={initialItem}
      initialMode={initialMode}
    />
  );
}

export function TestsPage() {
  return <TestsStudioPage />;
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
    <div className={"page-stack flex flex-col gap-[28px] [@media(max-width:580px)]:gap-[20px]"}>
      <PageTitle
        eyebrow="WORKSPACE / NOTES"
        title="Notes"
        description="A lightweight local scratchpad for implementation decisions, known issues, and ideas."
      />
      <div className={`notes-layout
        grid
        grid-cols-[minmax(340px,400px)_minmax(0,1fr)]
        [align-items:start]
        gap-[24px]
        [@media(max-width:820px)]:grid-cols-[1fr]
      `}>
        <form className={`panel
        note-editor
        min-w-0
        [border:1px_solid_#262735]
        rounded-[14px]
        [background:linear-gradient(145deg,_#1b1c20,_#111216)]
        [box-shadow:0_8px_24px_#0004]
        p-[22px_24px]
        [border:1px_solid_#272837]
        [background:linear-gradient(150deg,#1b1c20,#111216)]
      `} onSubmit={addNote}>
          <div className={`note-editor-heading
        flex
        items-center
        gap-[12px]
        pb-[16px]
        [border-bottom:1px_solid_#262736]
        mb-[8px]
        [&>div]:flex
        [&>div]:flex-col
        [&>div]:gap-[2px]
        [&_strong]:text-[14px]
        [&_strong]:font-[650]
        [&_small]:text-[#8a8b9e]
        [&_small]:text-[11.5px]
      `}>
            <span className={`note-editor-icon
        size-[36px]
        
        grid
        place-items-center
        [border:1px_solid_#6f42a6]
        rounded-[9px]
        text-[#c084fc]
        [background:#8e4bd520]
      `}>
              <Icon name="notes" size={17} />
            </span>
            <div>
              <strong>Capture a thought</strong>
              <small>Stored in this browser only</small>
            </div>
          </div>
          <div className={`control-label
        flex
        flex-col
        gap-[8px]
        mt-[16px]
        text-[#cfd0de]
        text-[12px]
        font-semibold
        [&_.dropdown]:w-full
        [&_textarea]:resize-y
        [&_textarea]:min-h-[120px]
        [&_textarea]:max-h-[240px]
        [&_textarea]:overflow-y-auto
        [&_textarea]:p-[12px]
        [&_textarea]:[border:1px_solid_#343544]
        [&_textarea]:rounded-[8px]
        [&_textarea]:text-[#f2f1f8]
        [&_textarea]:[background:#111219]
        [&_textarea]:text-[12.5px]
        [&_textarea]:leading-[1.6]
        [&_textarea:focus-visible]:border-[#9865d2]
        [&_textarea::placeholder]:text-[#7b7d90]
      `}>
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
          <label className={`control-label
        flex
        flex-col
        gap-[8px]
        mt-[16px]
        text-[#cfd0de]
        text-[12px]
        font-semibold
        [&_.dropdown]:w-full
        [&_textarea]:resize-y
        [&_textarea]:min-h-[120px]
        [&_textarea]:max-h-[240px]
        [&_textarea]:overflow-y-auto
        [&_textarea]:p-[12px]
        [&_textarea]:[border:1px_solid_#343544]
        [&_textarea]:rounded-[8px]
        [&_textarea]:text-[#f2f1f8]
        [&_textarea]:[background:#111219]
        [&_textarea]:text-[12.5px]
        [&_textarea]:leading-[1.6]
        [&_textarea:focus-visible]:border-[#9865d2]
        [&_textarea::placeholder]:text-[#7b7d90]
      `}>
            Note
            <textarea
              aria-label="Note text"
              placeholder="What should you remember?"
              rows={5}
              value={text}
              onChange={(event) => setText(event.target.value)}
            />
          </label>
          <div className={"note-submit-row flex items-center justify-between gap-[10px] mt-[18px] [&>span]:text-[#8e90a2] [&>span]:text-[12px]"}>
            <span>{notes.length} saved locally</span>
            <button
              className={`button
        button-primary
        min-h-[38px]
        inline-flex
        items-center
        justify-center
        gap-[8px]
        p-[0_16px]
        [border:1px_solid_transparent]
        rounded-[9px]
        text-[12.5px]
        font-semibold
        leading-none
        whitespace-nowrap
        cursor-pointer
        [transition:filter_0.16s,transform_0.16s,background_0.16s,border-color_0.16s,box-shadow_0.16s]
        [&:hover:not(:disabled)]:filter-[brightness(1.1)]
        [&:hover:not(:disabled)]:transform-[translateY(-1px)]
        disabled:cursor-not-allowed
        disabled:opacity-[0.52]
        [&.button-primary]:border-[#8747d8]
        [&.button-primary]:text-[white]
        [&.button-primary]:[background:linear-gradient(115deg,#7938cf,#5731a1)]
        [&.button-primary]:[box-shadow:0_4px_18px_#662ab544]
        [&.button-quiet]:border-[#30313f]
        [&.button-quiet]:text-[#dad9e7]
        [&.button-quiet]:[background:#171821cc]
        [&.button-quiet:hover]:border-[#5a4773]
        [&.button-quiet:hover]:[background:#20202e]
      `}
              type="submit"
              disabled={!text.trim()}
            >
              <Icon name="plus" size={15} /> Add note
            </button>
          </div>
        </form>
        <section className={`panel
        notes-list-panel
        min-w-0
        [border:1px_solid_#262735]
        rounded-[14px]
        [background:linear-gradient(145deg,_#1b1c20,_#111216)]
        [box-shadow:0_8px_24px_#0004]
        p-[22px]
        [border:1px_solid_#272837]
        [background:linear-gradient(150deg,#1b1c20,#111216)]
      `}>
          <div className={"notes-list-heading mb-0"}>
            <SectionTitle
              title="Your notes"
              detail="Saved in local browser storage"
            />
          </div>
          {notes.length ? (
            <ul className={`notes-list
        flex
        flex-col
        gap-[14px]
        m-[16px_0_0]
        p-0
        [list-style:none]
        [&_li]:relative
        [&_li]:p-[16px_46px_16px_18px]
        [&_li]:[border:1px_solid_#272837]
        [&_li]:rounded-[12px]
        [&_li]:[background:linear-gradient(145deg,#1b1c20,#111216)]
        [&_li]:[box-shadow:0_6px_18px_#0003]
        [&_li]:[transition:border-color_0.16s,transform_0.16s]
        [&_li:hover]:border-[#6d42a8]
        [&_li:hover]:transform-[translateY(-2px)]
        [&_li>div]:flex
        [&_li>div]:items-center
        [&_li>div]:justify-between
        [&_li>div]:gap-[10px]
        [&_time]:text-[#808295]
        [&_time]:text-[11.5px]
        [&_p]:m-[10px_0_0]
        [&_p]:text-[#edeaf5]
        [&_p]:text-[13.5px]
        [&_p]:leading-[1.65]
        [&_p]:whitespace-pre-wrap
        [&_p]:wrap-anywhere
      `}>
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
                    className={`note-delete
        absolute
        top-[12px]
        right-[12px]
        size-[28px]
        
        grid
        place-items-center
        [border:1px_solid_transparent]
        rounded-[7px]
        text-[#8e90a2]
        [background:transparent]
        cursor-pointer
        [transition:all_0.15s]
        [&:hover]:border-[#713647]
        [&:hover]:text-[#ff8192]
        [&:hover]:[background:#551c2c]
      `}
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
    <div className={"page-stack flex flex-col gap-[28px] [@media(max-width:580px)]:gap-[20px]"}>
      <PageTitle
        eyebrow="LIBRARY / DOCUMENTATION"
        title="Library docs"
        description="How this workspace organizes, previews, and measures reusable UI pieces."
      />
      <div className={"docs-grid grid grid-cols-3 gap-[16px] [@media(max-width:820px)]:grid-cols-[1fr]"}>
        <section className={`panel
        docs-panel
        min-w-0
        [border:1px_solid_#262735]
        rounded-[14px]
        [background:linear-gradient(145deg,#1b1c20,#111216)]
        [box-shadow:0_8px_24px_#0004]
        min-h-[190px]
        p-[20px]
        [&_h2]:m-[14px_0_6px]
        [&_h2]:text-[15px]
        [&>p]:min-h-[48px]
        [&>p]:m-[0_0_12px]
        [&>p]:text-[#9da0b3]
        [&>p]:text-[12.5px]
        [&>p]:leading-[1.6]
        [&_code]:text-[#d3b2ff]
        [&_code]:[font:11.5px_ui-monospace,SFMono-Regular,Menlo,monospace]
        [@media(max-width:580px)]:min-h-0
        [@media(max-width:580px)]:[&>p]:min-h-0
      `}>
          <span className={`docs-icon
        size-[36px]
        
        grid
        place-items-center
        rounded-[10px]
        text-[#b883fb]
        [background:#8748d51e]
        [&.docs-icon--cyan]:text-[#47d8d0]
        [&.docs-icon--cyan]:[background:#27b8b01a]
        [&.docs-icon--green]:text-[#62dda6]
        [&.docs-icon--green]:[background:#33b9781a]
      `}>
            <Icon name="components" size={18} />
          </span>
          <h2>Component library</h2>
          <p>
            UI primitives live in <code>packages/components/ui</code>.
            Dashboard-only layout and catalogs live separately under{" "}
            <code>packages/components/dashboard</code>.
          </p>
          <Link className={`text-link
        inline-flex
        items-center
        gap-[6px]
        mt-px
        text-[#c084fc]
        text-[12px]
        font-semibold
        whitespace-nowrap
        [&:hover]:text-[#d9b8ff]
      `} href="/components">
            Browse components <Icon name="arrow-right" size={14} />
          </Link>
        </section>
        <section className={`panel
        docs-panel
        min-w-0
        [border:1px_solid_#262735]
        rounded-[14px]
        [background:linear-gradient(145deg,#1b1c20,#111216)]
        [box-shadow:0_8px_24px_#0004]
        min-h-[190px]
        p-[20px]
        [&_h2]:m-[14px_0_6px]
        [&_h2]:text-[15px]
        [&>p]:min-h-[48px]
        [&>p]:m-[0_0_12px]
        [&>p]:text-[#9da0b3]
        [&>p]:text-[12.5px]
        [&>p]:leading-[1.6]
        [&_code]:text-[#d3b2ff]
        [&_code]:[font:11.5px_ui-monospace,SFMono-Regular,Menlo,monospace]
        [@media(max-width:580px)]:min-h-0
        [@media(max-width:580px)]:[&>p]:min-h-0
      `}>
          <span className={`docs-icon
        docs-icon--cyan
        size-[36px]
        
        grid
        place-items-center
        rounded-[10px]
        text-[#b883fb]
        [background:#8748d51e]
        [&.docs-icon--cyan]:text-[#47d8d0]
        [&.docs-icon--cyan]:[background:#27b8b01a]
        [&.docs-icon--green]:text-[#62dda6]
        [&.docs-icon--green]:[background:#33b9781a]
      `}>
            <Icon name="play" size={18} />
          </span>
          <h2>Experiment safely</h2>
          <p>
            The playground changes only local view state. It does not edit
            component source files or persist prop changes.
          </p>
          <Link className={`text-link
        inline-flex
        items-center
        gap-[6px]
        mt-px
        text-[#c084fc]
        text-[12px]
        font-semibold
        whitespace-nowrap
        [&:hover]:text-[#d9b8ff]
      `} href="/playground">
            Open playground <Icon name="arrow-right" size={14} />
          </Link>
        </section>
        <section className={`panel
        docs-panel
        min-w-0
        [border:1px_solid_#262735]
        rounded-[14px]
        [background:linear-gradient(145deg,#1b1c20,#111216)]
        [box-shadow:0_8px_24px_#0004]
        min-h-[190px]
        p-[20px]
        [&_h2]:m-[14px_0_6px]
        [&_h2]:text-[15px]
        [&>p]:min-h-[48px]
        [&>p]:m-[0_0_12px]
        [&>p]:text-[#9da0b3]
        [&>p]:text-[12.5px]
        [&>p]:leading-[1.6]
        [&_code]:text-[#d3b2ff]
        [&_code]:[font:11.5px_ui-monospace,SFMono-Regular,Menlo,monospace]
        [@media(max-width:580px)]:min-h-0
        [@media(max-width:580px)]:[&>p]:min-h-0
      `}>
          <span className={`docs-icon
        docs-icon--green
        size-[36px]
        
        grid
        place-items-center
        rounded-[10px]
        text-[#b883fb]
        [background:#8748d51e]
        [&.docs-icon--cyan]:text-[#47d8d0]
        [&.docs-icon--cyan]:[background:#27b8b01a]
        [&.docs-icon--green]:text-[#62dda6]
        [&.docs-icon--green]:[background:#33b9781a]
      `}>
            <Icon name="tests" size={18} />
          </span>
          <h2>Quality reports</h2>
          <p>
            Run a component or widget test individually. Saved results include
            its cases and duration, and feed the Home activity and average.
          </p>
          <Link className={`text-link
        inline-flex
        items-center
        gap-[6px]
        mt-px
        text-[#c084fc]
        text-[12px]
        font-semibold
        whitespace-nowrap
        [&:hover]:text-[#d9b8ff]
      `} href="/tests">
            View quality <Icon name="arrow-right" size={14} />
          </Link>
        </section>
      </div>
      <section className={`panel
        docs-components
        min-w-0
        [border:1px_solid_#262735]
        rounded-[14px]
        [background:linear-gradient(145deg,#1b1c20,#111216)]
        [box-shadow:0_8px_24px_#0004]
        p-[20px]
      `}>
        <SectionTitle
          title="Registered components"
          detail="The catalog is defined in packages/lib/catalog.ts"
        />
        <div className={`docs-component-list
        flex
        flex-col
        mt-[12px]
        [&>a]:min-h-[56px]
        [&>a]:flex
        [&>a]:items-center
        [&>a]:gap-[14px]
        [&>a]:p-[10px_6px]
        [&>a]:[border-bottom:1px_solid_#252632]
        [&>a:last-child]:[border-bottom:0]
        [&>a>span]:min-w-0
        [&>a>span]:flex-1
        [&>a>span]:flex
        [&>a>span]:flex-col
        [&>a>span]:gap-[4px]
        [&_strong]:text-[13px]
        [&_small]:truncate
        [&_small]:text-[#8e90a2]
        [&_small]:text-[11.5px]
        
        
        [&_code]:text-[#c49aff]
        [&_code]:[font:11px_ui-monospace,SFMono-Regular,Menlo,monospace]
        [&>a>svg]:text-[#9293a5]
      `}>
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
      <section className={`panel
        docs-usage
        min-w-0
        [border:1px_solid_#262735]
        rounded-[14px]
        [background:linear-gradient(145deg,#1b1c20,#111216)]
        [box-shadow:0_8px_24px_#0004]
        p-[20px]
        [&_pre]:overflow-x-auto
        [&_pre]:m-[14px_0_0]
        [&_pre]:p-[16px]
        [&_pre]:[border:1px_solid_#2a2b38]
        [&_pre]:rounded-[10px]
        [&_pre]:text-[#ceabff]
        [&_pre]:[background:#0b0c11]
        [&_pre]:[font:12px/1.7_ui-monospace,SFMono-Regular,Menlo,monospace]
      `}>
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
    <div className={"page-stack flex flex-col gap-[28px] [@media(max-width:580px)]:gap-[20px]"}>
      <PageTitle
        eyebrow="LIBRARY / NOT FOUND"
        title="Nothing here yet"
        description="This item is not registered in the current component catalog."
      />
      <section className={`panel
        min-w-0
        [border:1px_solid_#262735]
        rounded-[14px]
        [background:linear-gradient(145deg,#151620,#101117)]
        [box-shadow:0_8px_24px_#0004]
      `}>
        <EmptyState
          icon="widgets"
          title="No matching library item"
          description="Browse the registered components or return to the overview."
          action={
            <Link className={`button
        button-primary
        min-h-[38px]
        inline-flex
        items-center
        justify-center
        gap-[8px]
        p-[0_16px]
        [border:1px_solid_transparent]
        rounded-[9px]
        text-[12.5px]
        font-semibold
        leading-none
        whitespace-nowrap
        cursor-pointer
        [transition:filter_0.16s,transform_0.16s,background_0.16s,border-color_0.16s,box-shadow_0.16s]
        [&:hover:not(:disabled)]:filter-[brightness(1.1)]
        [&:hover:not(:disabled)]:transform-[translateY(-1px)]
        disabled:cursor-not-allowed
        disabled:opacity-[0.52]
        [&.button-primary]:border-[#8747d8]
        [&.button-primary]:text-[white]
        [&.button-primary]:[background:linear-gradient(115deg,#7938cf,#5731a1)]
        [&.button-primary]:[box-shadow:0_4px_18px_#662ab544]
        [&.button-quiet]:border-[#30313f]
        [&.button-quiet]:text-[#dad9e7]
        [&.button-quiet]:[background:#171821cc]
        [&.button-quiet:hover]:border-[#5a4773]
        [&.button-quiet:hover]:[background:#20202e]
      `} href="/components">
              Browse components
            </Link>
          }
        />
      </section>
    </div>
  );
}
