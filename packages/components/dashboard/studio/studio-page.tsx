"use client";

import { Badge, Toast, type BadgeTone } from "@artxds/widget-kit";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ChevronDown,
  Copy,
  Maximize2,
  Minimize2,
  FileCode2,
  RotateCcw,
} from "lucide-react";
import { getComponent, getWidget, components, widgets } from "@/lib/catalog";
import { itemTestKey } from "@/lib/quality";
import { useQuality } from "../quality/quality-provider";
import { Icon } from "../shared/icon";
import { Dropdown } from "../shared/dropdown";
import {
  MascotPlaygroundControls,
  MascotPlaygroundStage,
  useMascotPlayground,
} from "../mascot-playground";
import {
  StudioProvider,
  useStudio,
  type InspectorTab,
  type OutputTab,
  type StudioMode,
  type StudioViewport,
  type ToastMode,
  type ToastVariant,
} from "./studio-context";
import { StageFloor } from "./stage-floor";

const viewports: { value: StudioViewport; label: string; icon: "phone" | "tablet" | "monitor" }[] = [
  { value: "mobile", label: "Mobile", icon: "phone" },
  { value: "tablet", label: "Tablet", icon: "tablet" },
  { value: "desktop", label: "Desktop", icon: "monitor" },
];

const inspectorTabs: { value: InspectorTab; label: string }[] = [
  { value: "props", label: "Props" },
  { value: "docs", label: "Docs" },
  { value: "examples", label: "Examples" },
];

const outputTabs: { value: OutputTab; label: string }[] = [
  { value: "react", label: "React Code (TSX)" },
  { value: "tokens", label: "Design Tokens" },
  { value: "install", label: "CLI / Install" },
  { value: "tests", label: "Tests" },
];

const badgeTones: BadgeTone[] = ["purple", "cyan", "green", "amber", "muted"];
const toastVariants: ToastVariant[] = ["loading", "success", "warning", "error"];
const toastModes: ToastMode[] = ["normal", "steps"];

function formatName(slug: string) {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function useStudioItem() {
  const { state } = useStudio();
  return {
    component: getComponent(state.item),
    widget: getWidget(state.item),
    itemName: getComponent(state.item)?.name ?? getWidget(state.item)?.name ?? formatName(state.item),
  };
}

export function WidgetKitStudio({
  initialItem,
  initialMode,
}: {
  initialItem?: string;
  initialMode: StudioMode;
}) {
  const validInitial = initialItem && (getComponent(initialItem) || getWidget(initialItem))
    ? initialItem
    : (components[0]?.slug ?? widgets[0]?.slug ?? "badge");

  return (
    <StudioProvider initialItem={validInitial} initialMode={initialMode}>
      <StudioWorkspace />
    </StudioProvider>
  );
}

function StudioWorkspace() {
  const { state, dispatch } = useStudio();
  const { component, widget, itemName } = useStudioItem();
  const mascotPlayground = useMascotPlayground();
  const { snapshot, loading, runningItemKey, runItemTests } = useQuality();
  const [copyNotice, setCopyNotice] = useState("");
  const [sourceExpanded, setSourceExpanded] = useState(false);
  const [source, setSource] = useState<string | null>(null);
  const [sourceStatus, setSourceStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const sourceRequestedFor = useRef<string | null>(null);
  const sourceLoadedFor = useRef<string | null>(null);
  const sourceSlug = component?.slug;

  useEffect(() => {
    if (
      state.inspectorTab !== "docs" ||
      !sourceSlug ||
      sourceRequestedFor.current === sourceSlug ||
      sourceLoadedFor.current === sourceSlug
    ) return;
    const requestedSlug = sourceSlug;
    const controller = new AbortController();
    sourceRequestedFor.current = requestedSlug;
    setSourceStatus("loading");
    void fetch(`/api/components/${requestedSlug}/source`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Source unavailable");
        return (await response.json()) as { source: string };
      })
      .then((files) => {
        sourceLoadedFor.current = requestedSlug;
        sourceRequestedFor.current = null;
        setSource(files.source);
        setSourceStatus("ready");
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          sourceRequestedFor.current = null;
          setSourceStatus("error");
        }
      });
    return () => {
      controller.abort();
      if (sourceRequestedFor.current === requestedSlug) sourceRequestedFor.current = null;
    };
  }, [sourceSlug, state.inspectorTab]);

  const isMascot = state.item === "mascot";
  const isToast = state.item === "toast";
  const isDocsExpanded = state.inspectorTab === "docs" && sourceExpanded;
  const itemType = widget ? "widget" : "component";
  const testKey = itemTestKey(itemType, state.item);
  const testResult = snapshot.itemTests?.[testKey];
  const testRegistered = Boolean(widget?.test || component?.test);
  const testRunning = runningItemKey === testKey;
  const code = useMemo(() => {
    if (isMascot) return `import { Mascot } from "@artxds/widget-kit";\n\n${mascotPlayground.snippet}`;
    if (isToast) {
      return `import { Toast } from "@artxds/widget-kit";\n\n<Toast\n  open={${state.toastOpen}}\n  variant="${state.toastVariant}"\n  mode="${state.toastMode}"\n  placement="inline"\n  title="${state.toastVariant === "loading" ? "Saving changes" : "Changes saved"}"\n/>`;
    }
    return `import { Badge } from "@artxds/widget-kit";\n\n<Badge tone="${state.badgeTone}"${state.badgeDot ? " dot" : ""}>${state.badgeLabel}</Badge>`;
  }, [isMascot, isToast, mascotPlayground.snippet, state.badgeDot, state.badgeLabel, state.badgeTone, state.toastMode, state.toastOpen, state.toastVariant]);

  const output = useMemo(() => {
    if (state.outputTab === "tokens") {
      return tokenOutput(state.item, state.badgeTone, {
        accentA: mascotPlayground.accentA,
        accentB: mascotPlayground.accentB,
        eye: mascotPlayground.eyeFrom,
      });
    }
    if (state.outputTab === "install") {
      return `npm install @artxds/widget-kit\n\n# import the item you need\nimport { ${itemName} } from "@artxds/widget-kit";`;
    }
    return code;
  }, [code, itemName, mascotPlayground.accentA, mascotPlayground.accentB, mascotPlayground.eyeFrom, state.badgeTone, state.item, state.outputTab]);

  function resetProps() {
    dispatch({ type: "reset-props" });
    if (isMascot) mascotPlayground.reset();
  }

  async function copyOutput(value = output, successMessage = "Copied to clipboard") {
    try {
      await navigator.clipboard.writeText(value);
      setCopyNotice(successMessage);
    } catch {
      setCopyNotice("Could not copy. Select and copy the code manually.");
    }
    window.setTimeout(() => setCopyNotice(""), 2200);
  }

  const handleRunTests = () => {
    if (testRegistered && !testRunning) void runItemTests(itemType, state.item);
  };

  return (
    <div className={`studio-workspace${isDocsExpanded ? " studio-workspace--docs-expanded" : ""}`}>
      <main className="studio-main" aria-label={`${itemName} component workspace`}>
        <div className="studio-toolbar">
          <div className="studio-mode-tabs" role="tablist" aria-label="Workspace mode">
            {(["preview", "playground"] as const).map((mode) => (
              <button
                aria-selected={state.mode === mode}
                className={state.mode === mode ? "is-active" : ""}
                key={mode}
                onClick={() => dispatch({ type: "set-mode", mode })}
                role="tab"
                type="button"
              >
                {mode === "preview" ? "Preview" : "Playground"}
              </button>
            ))}
          </div>
          <div className="studio-toolbar-actions">
            <div className="studio-viewport" aria-label="Preview viewport">
              {viewports.map((viewport) => (
                <button
                  aria-label={`${viewport.label} viewport`}
                  aria-pressed={state.viewport === viewport.value}
                  className={state.viewport === viewport.value ? "is-active" : ""}
                  key={viewport.value}
                  onClick={() => dispatch({ type: "set-viewport", viewport: viewport.value })}
                  title={viewport.label}
                  type="button"
                >
                  <Icon name={viewport.icon} size={15} />
                  <span>{viewport.label}</span>
                </button>
              ))}
            </div>
            <button className="studio-reset" onClick={resetProps} type="button">
              <RotateCcw aria-hidden="true" size={15} /> Reset
            </button>
          </div>
        </div>

        <section className={`studio-stage studio-stage--${state.viewport} studio-stage--${state.mode}`} aria-label={`${itemName} live preview`}>
          <StageFloor tone={widget ? "experimental" : "core"} />
          <div className={`studio-canvas studio-canvas--${state.viewport}${isMascot ? " studio-canvas--mascot" : ""}`}>
            {isMascot ? (
              <MascotPlaygroundStage playground={mascotPlayground} />
            ) : isToast ? (
              <Toast
                description={state.toastVariant === "loading" ? "Working on your changes…" : "Your update is ready."}
                mode={state.toastMode}
                open={state.toastOpen}
                placement="inline"
                steps={state.toastMode === "steps" ? [
                  { label: "Preparing changes", status: "complete" },
                  { label: "Saving update", status: state.toastVariant === "loading" ? "current" : "complete" },
                ] : undefined}
                title={state.toastVariant === "loading" ? "Saving changes" : "Changes saved"}
                variant={state.toastVariant}
              />
            ) : (
              <Badge dot={state.badgeDot} tone={state.badgeTone}>{state.badgeLabel}</Badge>
            )}
          </div>
          <span className="studio-live-label"><span /> {state.mode === "preview" ? "Live component preview" : "Interactive playground"}</span>
        </section>

        <section className="studio-output" aria-label="Component output">
          <div className="studio-output-heading">
            <div className="studio-output-tabs" role="tablist" aria-label="Code and test panels">
              {outputTabs.map((tab) => (
                <button
                  aria-selected={state.outputTab === tab.value}
                  className={state.outputTab === tab.value ? "is-active" : ""}
                  key={tab.value}
                  onClick={() => dispatch({ type: "set-output-tab", tab: tab.value })}
                  role="tab"
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {state.outputTab !== "tests" && (
              <div className="studio-output-actions">
                {state.outputTab === "react" ? (
                  <>
                    <button onClick={() => copyOutput(output.split("\n\n")[0], "Import copied")} type="button"><Copy size={14} /> Copy Import</button>
                    <button onClick={() => copyOutput(output, "Code copied")} type="button"><Copy size={14} /> Copy Code</button>
                  </>
                ) : (
                  <button onClick={() => copyOutput(output, "Content copied")} type="button"><Copy size={14} /> Copy Content</button>
                )}
              </div>
            )}
          </div>
          {state.outputTab === "tests" ? (
            <div className="studio-tests-panel">
              <div className="studio-test-summary">
                <span className={`studio-test-indicator${testResult ? (testResult.failed ? " is-failed" : " is-passed") : ""}`} />
                <div>
                  <strong>{loading ? "Loading test results…" : testResult ? `${testResult.passed} of ${testResult.total} checks passed` : "Tests not run yet"}</strong>
                  <p>{testResult ? `${testResult.itemName} · ${testResult.durationMs} ms` : testRegistered ? "Run the registered checks for this item." : "No test file is registered for this item yet."}</p>
                </div>
              </div>
              <button className="studio-run-tests" disabled={!testRegistered || runningItemKey !== null} onClick={handleRunTests} type="button">
                <Icon name="play" size={14} /> {testRunning ? "Running tests…" : "Run tests"}
              </button>
            </div>
          ) : (
            <OutputContent output={output} tab={state.outputTab} />
          )}
          <div aria-live="polite" className="studio-copy-notice">{copyNotice}</div>
        </section>
      </main>

      <aside className={`studio-inspector${state.inspectorTab === "docs" ? " studio-inspector--docs" : ""}`} aria-label={`${itemName} inspector`}>
        <div className="studio-inspector-title">
          <h1>{itemName}</h1>
          <p>{component?.description ?? widget?.description ?? "Inspect this item in the widget kit catalog."}</p>
        </div>
        <div className="studio-inspector-tabs" role="tablist" aria-label="Inspector sections">
          {inspectorTabs.map((tab) => (
            <button
              aria-selected={state.inspectorTab === tab.value}
              className={state.inspectorTab === tab.value ? "is-active" : ""}
              key={tab.value}
              onClick={() => dispatch({ type: "set-inspector-tab", tab: tab.value })}
              role="tab"
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className={`studio-inspector-content${state.inspectorTab === "docs" ? " studio-inspector-content--docs" : ""}`}>
          {state.inspectorTab === "props" && (
            <PropsInspector
              badgeDot={state.badgeDot}
              badgeLabel={state.badgeLabel}
              badgeTone={state.badgeTone}
              isMascot={isMascot}
              isToast={isToast}
              mascotPlayground={mascotPlayground}
              onBadgeDot={(enabled) => dispatch({ type: "set-badge-dot", enabled })}
              onBadgeLabel={(label) => dispatch({ type: "set-badge-label", label })}
              onBadgeTone={(tone) => dispatch({ type: "set-badge-tone", tone })}
              onToastMode={(mode) => dispatch({ type: "set-toast-mode", mode })}
              onToastOpen={(open) => dispatch({ type: "set-toast-open", open })}
              onToastVariant={(variant) => dispatch({ type: "set-toast-variant", variant })}
              toastMode={state.toastMode}
              toastOpen={state.toastOpen}
              toastVariant={state.toastVariant}
            />
          )}
          {state.inspectorTab === "docs" && (
            <DocsInspector
              category={component?.category ?? widget?.category ?? "Widget"}
              description={component?.description ?? widget?.description ?? ""}
              itemSource={component?.source ?? widget?.source ?? ""}
              source={source}
              sourceStatus={sourceStatus}
              widget={Boolean(widget)}
              sourceExpanded={sourceExpanded}
              onToggleSourceExpanded={() => setSourceExpanded((expanded) => !expanded)}
            />
          )}
          {state.inspectorTab === "examples" && <ExamplesInspector code={code} itemName={itemName} />}
        </div>
      </aside>
    </div>
  );
}

function PropsInspector({
  badgeDot,
  badgeLabel,
  badgeTone,
  isMascot,
  isToast,
  mascotPlayground,
  onBadgeDot,
  onBadgeLabel,
  onBadgeTone,
  onToastMode,
  onToastOpen,
  onToastVariant,
  toastMode,
  toastOpen,
  toastVariant,
}: {
  badgeDot: boolean;
  badgeLabel: string;
  badgeTone: BadgeTone;
  isMascot: boolean;
  isToast: boolean;
  mascotPlayground: ReturnType<typeof useMascotPlayground>;
  onBadgeDot: (enabled: boolean) => void;
  onBadgeLabel: (label: string) => void;
  onBadgeTone: (tone: BadgeTone) => void;
  onToastMode: (mode: ToastMode) => void;
  onToastOpen: (open: boolean) => void;
  onToastVariant: (variant: ToastVariant) => void;
  toastMode: ToastMode;
  toastOpen: boolean;
  toastVariant: ToastVariant;
}) {
  return (
    <div className="studio-props">
      {isMascot ? (
        <>
          <InspectorGroup title="Appearance & Tokens"><MascotPlaygroundControls playground={mascotPlayground} /></InspectorGroup>
          <InspectorGroup title="Behavior"><div className="studio-prop-note">The live widget responds to pointer movement and the selected behavior props.</div></InspectorGroup>
        </>
      ) : isToast ? (
        <>
          <InspectorGroup title="Variants">
            <ControlLabel label="Variant"><ChoiceGroup items={toastVariants} value={toastVariant} onChange={(value) => onToastVariant(value as ToastVariant)} /></ControlLabel>
            <ControlLabel label="Display"><ChoiceGroup items={toastModes} value={toastMode} onChange={(value) => onToastMode(value as ToastMode)} /></ControlLabel>
          </InspectorGroup>
          <InspectorGroup title="States & Flags"><SwitchRow label="Open" detail="Show the notification in the preview" checked={toastOpen} onChange={onToastOpen} /></InspectorGroup>
          <InspectorGroup title="Slots"><div className="studio-prop-note">Title and description are shown in the live notification.</div></InspectorGroup>
        </>
      ) : (
        <>
          <InspectorGroup title="Variants">
            <ControlLabel label="Color tone">
              <Dropdown
                label="Color tone"
                options={badgeTones.map((tone) => ({ label: formatName(tone), value: tone }))}
                value={badgeTone}
                onChange={(tone) => onBadgeTone(tone as BadgeTone)}
              />
            </ControlLabel>
          </InspectorGroup>
          <InspectorGroup title="Appearance & Tokens">
            <div className="studio-token-pair">
              <span className={`studio-swatch studio-swatch--${badgeTone}`} aria-hidden="true" />
              <code>--wk-badge-{badgeTone}-color</code>
            </div>
          </InspectorGroup>
          <InspectorGroup title="States & Flags"><SwitchRow ariaLabel="Show status dot" checked={badgeDot} detail="Display the status indicator" label="Dot" onChange={onBadgeDot} /></InspectorGroup>
          <InspectorGroup title="Slots"><ControlLabel label="Children"><input aria-label="Badge children" className="studio-text-input" onChange={(event) => onBadgeLabel(event.target.value)} value={badgeLabel} /></ControlLabel></InspectorGroup>
        </>
      )}
    </div>
  );
}

function InspectorGroup({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <section className="studio-inspector-group">
      <button aria-expanded={open} className="studio-group-heading" onClick={() => setOpen((value) => !value)} type="button"><strong>{title}</strong><ChevronDown className={open ? "" : "is-collapsed"} size={15} /></button>
      {open && <div className="studio-group-body">{children}</div>}
    </section>
  );
}

function ControlLabel({ label, children }: { label: string; children: ReactNode }) {
  return <div className="studio-control-label"><span>{label}</span>{children}</div>;
}

function ChoiceGroup({ items, value, onChange }: { items: string[]; value: string; onChange: (value: string) => void }) {
  return <div className="studio-choice-group">{items.map((item) => <button aria-pressed={value === item} className={value === item ? "is-active" : ""} key={item} onClick={() => onChange(item)} type="button">{formatName(item)}</button>)}</div>;
}

function SwitchRow({
  checked,
  detail,
  label,
  ariaLabel = label,
  onChange,
}: {
  checked: boolean;
  detail: string;
  label: string;
  ariaLabel?: string;
  onChange: (checked: boolean) => void;
}) {
  return <div className="studio-switch-row"><div><strong>{label}</strong><small>{detail}</small></div><button aria-checked={checked} aria-label={ariaLabel} className={checked ? "is-checked" : ""} onClick={() => onChange(!checked)} role="switch" type="button"><span /></button></div>;
}

function OutputContent({ output, tab }: { output: string; tab: OutputTab }) {
  if (tab === "react") {
    const sections = output.split("\n\n");
    if (sections.length > 1) {
      return (
        <div className="studio-code-sections">
          <div className="studio-code-section"><span>{sections[0].startsWith("import ") ? "Import" : "Setup"}</span><pre className="studio-code"><HighlightedCode value={sections[0]} /></pre></div>
          <div className="studio-code-section"><span>Component</span><pre className="studio-code"><HighlightedCode value={sections.slice(1).join("\n\n")} /></pre></div>
        </div>
      );
    }
  }
  return <pre className="studio-code"><HighlightedCode value={output} /></pre>;
}

function HighlightedCode({ value }: { value: string }) {
  const pattern = /\/\*[\s\S]*?\*\/|\/\/[^\n]*|`(?:\\.|[^`\\])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|<\/?[A-Za-z][\w.:-]*|\/?>(?!\w)|--[\w-]+|#[\da-fA-F]{3,8}\b|\b(?:import|from|const|let|var|export|default|return|new|as|type|interface|extends|function|async|await|true|false|null|undefined|npm|install)\b|\b\d+(?:\.\d+)?(?:px|rem|em|%)?\b|\b[A-Z][\w$]*\b|\b[a-z_$][\w$]*(?=\s*[=:])/g;
  const nodes: ReactNode[] = [];
  let cursor = 0;
  let match = pattern.exec(value);

  while (match) {
    const token = match[0];
    if (match.index > cursor) nodes.push(value.slice(cursor, match.index));

    const className = getCodeTokenClass(token, value.slice(pattern.lastIndex), value.slice(0, match.index));
    if (token.startsWith("<")) {
      const prefix = token.startsWith("</") ? "</" : "<";
      nodes.push(<span className="studio-code-token--punctuation" key={match.index}>{prefix}</span>);
      nodes.push(<span className={className} key={`${match.index}-name`}>{token.slice(prefix.length)}</span>);
    } else {
      nodes.push(<span className={className} key={match.index}>{token}</span>);
    }

    cursor = pattern.lastIndex;
    match = pattern.exec(value);
  }

  if (cursor < value.length) nodes.push(value.slice(cursor));
  return <code>{nodes}</code>;
}

function getCodeTokenClass(token: string, rest: string, before: string) {
  if (token.startsWith("//") || token.startsWith("/*")) return "studio-code-token--comment";
  if (/^[`"']/.test(token)) return "studio-code-token--string";
  if (token.startsWith("--")) return "studio-code-token--variable";
  if (token.startsWith("#")) return "studio-code-token--color";
  if (token.startsWith("<")) return "studio-code-token--component";
  if (/^\/?>(?!\w)/.test(token)) return "studio-code-token--punctuation";
  if (/^(?:import|from|const|let|var|export|default|return|new|as|type|interface|extends|function|async|await|true|false|null|undefined|npm|install)$/.test(token)) return "studio-code-token--keyword";
  if (/^\d/.test(token)) return "studio-code-token--number";
  if (/^[A-Z]/.test(token)) {
    return /\bimport\s*\{[^}]*$|\b(?:const|let|var|type|interface|class|new)\s+$/.test(before)
      ? "studio-code-token--component"
      : "studio-code-token--plain";
  }
  if (/^[a-z_$]/.test(token) && /^\s*[=:]/.test(rest)) return "studio-code-token--property";
  return "studio-code-token--plain";
}

function DocsInspector({
  category,
  description,
  itemSource,
  source,
  sourceStatus,
  widget,
  sourceExpanded,
  onToggleSourceExpanded,
}: {
  category: string;
  description: string;
  itemSource: string;
  source: string | null;
  sourceStatus: "idle" | "loading" | "ready" | "error";
  widget: boolean;
  sourceExpanded: boolean;
  onToggleSourceExpanded: () => void;
}) {
  const sourceCodeRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    sourceCodeRef.current?.scrollTo({ top: 0, left: 0 });
  }, [source, sourceExpanded]);

  return (
    <div className="studio-docs">
      <span className="studio-docs-category">{category}</span>
      <h2>About this {widget ? "widget" : "component"}</h2>
      <p>{description}</p>
      <div className="studio-docs-source"><span>Source</span><code>{itemSource}</code></div>
      {widget ? (
        <p className="studio-prop-note">Widget source is maintained in its package directory.</p>
      ) : sourceStatus === "loading" ? (
        <p className="studio-prop-note">Loading source…</p>
      ) : sourceStatus === "error" ? (
        <p className="studio-prop-note">Source is unavailable right now.</p>
      ) : source ? (
        <div className="studio-source-code-panel">
          <div className="studio-source-code-toolbar">
            <button
              aria-controls="studio-component-source"
              aria-expanded={sourceExpanded}
              aria-label={sourceExpanded ? "Collapse source code panel" : "Expand source code panel"}
              onClick={onToggleSourceExpanded}
              title={sourceExpanded ? "Collapse code panel" : "Expand code panel"}
              type="button"
            >
              {sourceExpanded ? <Minimize2 aria-hidden="true" size={14} /> : <Maximize2 aria-hidden="true" size={14} />}
            </button>
          </div>
          <pre className="studio-source-code studio-source-code--docs" id="studio-component-source" ref={sourceCodeRef}><HighlightedCode value={source} /></pre>
        </div>
      ) : null}
    </div>
  );
}

function ExamplesInspector({ code, itemName }: { code: string; itemName: string }) {
  return (
    <div className="studio-examples">
      <h2>{itemName} example</h2>
      <p>This example uses the props currently selected in the inspector.</p>
      <pre className="studio-source-code"><HighlightedCode value={code} /></pre>
      <Link href="/docs" className="studio-doc-link"><FileCode2 size={15} /> Browse documentation <Icon name="arrow-right" size={14} /></Link>
    </div>
  );
}

function tokenOutput(
  item: string,
  tone: BadgeTone,
  mascotTokens: { accentA: string; accentB: string; eye: string },
) {
  if (item === "badge") {
    const tokens: Record<BadgeTone, { background: string; color: string; border: string }> = {
      purple: { background: "#7b3fd51a", color: "#c195ff", border: "#7248a655" },
      cyan: { background: "#25b8b21a", color: "#5de6df", border: "#2a9b9555" },
      green: { background: "#33b9781a", color: "#62dda6", border: "#2a8a5e55" },
      amber: { background: "#c48a001a", color: "#f5c66d", border: "#9a6a0055" },
      muted: { background: "#1b1c27", color: "#9293a7", border: "#2e2f3c" },
    };
    const selected = tokens[tone];
    return `/* Widget kit badge: ${tone} */\n--wk-badge-${tone}-bg: ${selected.background};\n--wk-badge-${tone}-color: ${selected.color};\n--wk-badge-${tone}-border: ${selected.border};\n--wk-radius-sm: 5px;`;
  }
  if (item === "mascot") {
    return `/* Mascot theme tokens */\n--mascot-accent-a: ${mascotTokens.accentA};\n--mascot-accent-b: ${mascotTokens.accentB};\n--mascot-eye-color: ${mascotTokens.eye};`;
  }
  return `/* Shared widget kit design tokens */\n--wk-purple: #9d5cff;\n--wk-cyan: #31d9d2;\n--wk-green: #57e0ac;\n--wk-background: #090a0e;\n--wk-surface: #101117;\n--wk-foreground: #f2f1f8;\n--wk-radius-md: 8px;`;
}
