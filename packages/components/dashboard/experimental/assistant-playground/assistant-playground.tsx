"use client";

import {
  AssistantWidget,
  type AssistantWidgetProps,
  type AssistantLabels,
  type AssistantSlots,
  type AssistantComponentRenderer,
} from "@/widgets/assistant/src";
import { MockTransport } from "@/widgets/assistant/src/transport";
import { defineAction } from "@/widgets/assistant/src/core/actions";
import { type AssistantEvent } from "@/widgets/assistant/src/core";
import { ChoiceControl } from "../../shared/choice-group";
import { useCurrentUser } from "../../auth/use-current-user";
import { RotateCcw, Send } from "lucide-react";
import {
  useCallback,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

const placements: { value: AssistantWidgetProps["placement"]; label: string }[] = [
  { value: "floating", label: "Floating" },
  { value: "inline", label: "Inline" },
  { value: "docked", label: "Docked" },
];

const positions: { value: AssistantWidgetProps["position"]; label: string }[] = [
  { value: "bottom-right", label: "Bottom right" },
  { value: "bottom-left", label: "Bottom left" },
  { value: "top-right", label: "Top right" },
  { value: "top-left", label: "Top left" },
  { value: "right", label: "Right" },
  { value: "left", label: "Left" },
  { value: "bottom", label: "Bottom" },
];

const themes: { value: string | undefined; label: string }[] = [
  { value: undefined, label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const displayStates: { value: "launcher" | "open" | "minimized" | "closed"; label: string }[] = [
  { value: "launcher", label: "Launcher" },
  { value: "open", label: "Open" },
  { value: "minimized", label: "Minimized" },
  { value: "closed", label: "Closed" },
];

function scriptFor(input: { id: string; text: string }): readonly AssistantEvent[] {
  return [
    { type: "run-start", runId: "play-run-1" },
    { type: "message-start", messageId: "play-message-1", role: "assistant" },
    {
      type: "part-start",
      messageId: "play-message-1",
      part: { type: "text", id: "play-text-1", text: "", format: "plain" },
    },
    {
      type: "text-delta",
      messageId: "play-message-1",
      partId: "play-text-1",
      delta: "Vou processar sua solicitação de escrita. ",
    },
    {
      type: "tool-call",
      toolCallId: "play-call-1",
      name: "write_note",
      input,
      access: "write",
      risk: "high",
      messageId: "play-message-1",
    },
    {
      type: "tool-result",
      toolCallId: "play-call-1",
      output: { ok: true, value: input },
      messageId: "play-message-1",
      status: "completed",
    },
    { type: "message-end", messageId: "play-message-1" },
    { type: "run-end", runId: "play-run-1", status: "completed" },
  ];
}

const agentAvatarUrl = "https://i.pravatar.cc/128?img=32";
const userAvatarUrl = "https://i.pravatar.cc/128?img=12";

function chunkText(text: string, size = 26): string[] {
  const chars = Array.from(text);
  const chunks: string[] = [];
  for (let index = 0; index < chars.length; index += size) {
    chunks.push(chars.slice(index, index + size).join(""));
  }
  return chunks.length ? chunks : [text];
}

function lastUserText(request: { messages: readonly { role: string; parts: readonly { type: string; text?: string }[] }[] }): string {
  for (let index = request.messages.length - 1; index >= 0; index -= 1) {
    const message = request.messages[index];
    if (message.role !== "user") continue;
    const textPart = message.parts.find((part) => part.type === "text");
    if (textPart && typeof textPart.text === "string") return textPart.text;
  }
  return "";
}

function SaasCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div
      style={{
        marginTop: 10,
        border: "1px solid #2f3142",
        borderRadius: 12,
        background: "linear-gradient(160deg,#181925,#11121a)",
        padding: 12,
        color: "#e7e7f0",
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", color: "#b9b9cb", marginBottom: 8 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function MrrCard({ mrr, growth }: { mrr: string; growth: string }) {
  const bars = [32, 48, 41, 56, 62, 58, 74, 81];
  return (
    <SaasCard title="MONTHLY RECURRING REVENUE">
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 10 }}>
        <strong style={{ fontSize: 26, letterSpacing: "-0.03em" }}>{mrr}</strong>
        <span style={{ color: "#6fe6b1", fontWeight: 600, fontSize: 13 }}>{growth}</span>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 44 }}>
        {bars.map((value, index) => (
          <span
            key={index}
            style={{
              flex: 1,
              height: `${value}%`,
              borderRadius: 4,
              background: index === bars.length - 1 ? "#9d5cff" : "#3a3b4d",
            }}
          />
        ))}
      </div>
    </SaasCard>
  );
}

function InvoicesCard({ invoices }: { invoices: { id: string; customer: string; amount: string; status: string }[] }) {
  return (
    <SaasCard title="RECENT INVOICES">
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {invoices.map((invoice) => (
          <div
            key={invoice.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              fontSize: 12,
              padding: "6px 0",
              borderBottom: "1px solid #262736",
            }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>{invoice.id}</div>
              <div style={{ color: "#9a9bb0" }}>{invoice.customer}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div>{invoice.amount}</div>
              <div style={{ color: invoice.status === "Paid" ? "#6fe6b1" : "#ffb45f", fontSize: 11 }}>
                {invoice.status}
              </div>
            </div>
          </div>
        ))}
      </div>
    </SaasCard>
  );
}

function PlanCard({ name, price, features }: { name: string; price: string; features: string[] }) {
  return (
    <SaasCard title="CURRENT PLAN">
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
        <strong style={{ fontSize: 18 }}>{name}</strong>
        <span style={{ color: "#9a9bb0", fontSize: 12 }}>{price}</span>
      </div>
      <ul style={{ margin: 0, paddingLeft: 16, color: "#cfd0de", fontSize: 12, lineHeight: 1.6 }}>
        {features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
    </SaasCard>
  );
}

function CustomerCard({ name, email, plan, mrr }: { name: string; email: string; plan: string; mrr: string }) {
  return (
    <SaasCard title="TOP CUSTOMER">
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <img
          alt={name}
          src={agentAvatarUrl}
          style={{ width: 40, height: 40, borderRadius: 999, objectFit: "cover" }}
        />
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{name}</div>
          <div style={{ color: "#9a9bb0", fontSize: 11 }}>{email}</div>
          <div style={{ color: "#cfd0de", fontSize: 11, marginTop: 2 }}>
            {plan} · {mrr}
          </div>
        </div>
      </div>
    </SaasCard>
  );
}

const saasComponents: Record<string, AssistantComponentRenderer> = {
  MrrCard: (props) => <MrrCard mrr={String(props?.mrr ?? "")} growth={String(props?.growth ?? "")} />,
  InvoicesCard: (props) => (
    <InvoicesCard invoices={(props?.invoices as { id: string; customer: string; amount: string; status: string }[]) ?? []} />
  ),
  PlanCard: (props) => (
    <PlanCard
      name={String(props?.name ?? "")}
      price={String(props?.price ?? "")}
      features={(props?.features as string[]) ?? []}
    />
  ),
  CustomerCard: (props) => (
    <CustomerCard
      name={String(props?.name ?? "")}
      email={String(props?.email ?? "")}
      plan={String(props?.plan ?? "")}
      mrr={String(props?.mrr ?? "")}
    />
  ),
};

const saasSuggestions = [
  "Show MRR",
  "List invoices",
  "Show my plan",
  "Top customer",
];

function saasScript(request: { messages: readonly { role: string; parts: readonly { type: string; text?: string }[] }[] }, callIndex: number) {
  const userText = lastUserText(request);
  const lower = userText.toLowerCase();
  const runId = `saas-run-${callIndex + 1}`;
  const messageId = `saas-message-${callIndex + 1}`;
  const textId = `saas-text-${callIndex + 1}`;

  let text = "I can help with revenue, invoices, plans, and customers. Try one of the suggestions.";
  let componentPart: { type: "component"; id: string; component: string; props: Record<string, unknown> } | null = null;
  let buttons: { id: string; label: string; action?: string; payload?: unknown }[] | null = null;

  if (lower.includes("mrr") || lower.includes("revenue") || lower.includes("metric")) {
    text = "Here is your current MRR snapshot. Growth is up 12.4% month over month.";
    componentPart = {
      type: "component",
      id: `saas-mrr-${callIndex + 1}`,
      component: "MrrCard",
      props: { mrr: "$48,290", growth: "+12.4%" },
    };
  } else if (lower.includes("invoice")) {
    text = "Latest invoices from your workspace:";
    componentPart = {
      type: "component",
      id: `saas-invoices-${callIndex + 1}`,
      component: "InvoicesCard",
      props: {
        invoices: [
          { id: "INV-1042", customer: "Acme Corp", amount: "$1,200.00", status: "Paid" },
          { id: "INV-1043", customer: "Globex", amount: "$890.00", status: "Pending" },
          { id: "INV-1044", customer: "Initech", amount: "$2,450.00", status: "Paid" },
        ],
      },
    };
  } else if (lower.includes("plan") || lower.includes("upgrade")) {
    text = "Your current plan and upgrade options:";
    componentPart = {
      type: "component",
      id: `saas-plan-${callIndex + 1}`,
      component: "PlanCard",
      props: {
        name: "Starter",
        price: "$29/mo",
        features: ["5 seats", "10k events", "Email support"],
      },
    };
    buttons = [{ id: "upgrade", label: "Upgrade to Pro", action: "upgrade", payload: { plan: "pro" } }];
  } else if (lower.includes("customer") || lower.includes("account")) {
    text = "Top customer this month:";
    componentPart = {
      type: "component",
      id: `saas-customer-${callIndex + 1}`,
      component: "CustomerCard",
      props: {
        name: "Acme Corp",
        email: "billing@acme.com",
        plan: "Pro",
        mrr: "$1,200 MRR",
      },
    };
  } else {
    buttons = saasSuggestions.map((label, index) => ({
      id: `suggest-${index}`,
      label,
      action: "suggest",
      payload: { prompt: label },
    }));
  }

  const events: {
    type: string;
    runId?: string;
    messageId?: string;
    role?: "assistant";
    part?: Record<string, unknown>;
    partId?: string;
    delta?: string;
    status?: string;
  }[] = [
    { type: "run-start", runId },
    { type: "message-start", messageId, role: "assistant" },
    { type: "part-start", messageId, part: { type: "text", id: textId, text: "", format: "markdown" } },
    ...chunkText(text, 10).map((delta) => ({ type: "text-delta", messageId, partId: textId, delta })),
  ];

  if (componentPart) {
    events.push({ type: "part-start", messageId, part: componentPart });
  }
  if (buttons) {
    events.push({
      type: "part-start",
      messageId,
      part: { type: "buttons", id: `saas-buttons-${callIndex + 1}`, buttons },
    });
  }

  events.push({ type: "message-end", messageId });
  events.push({ type: "run-end", runId, status: "completed" });

  return events as never;
}

function createSaasTransport() {
  return new MockTransport({ script: saasScript, delayMs: 260, chunkSize: 10 });
}

const saasSlots: AssistantSlots = {
  launcher: (
    <img
      alt="Nova"
      src={agentAvatarUrl}
      style={{ width: 32, height: 32, borderRadius: 999, objectFit: "cover" }}
    />
  ),
  empty: (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "12px 0" }}>
      <img
        alt="Nova"
        src={agentAvatarUrl}
        style={{ width: 48, height: 48, borderRadius: 999, objectFit: "cover" }}
      />
      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#f2f1f8" }}>Hi, I&apos;m Nova</h3>
      <p style={{ margin: 0, fontSize: 12, color: "#9a9bb0", textAlign: "center" }}>Ask me about revenue, invoices, plans, or customers.</p>
    </div>
  ),
  header: (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <img
        alt="Nova"
        src={agentAvatarUrl}
        style={{ width: 20, height: 20, borderRadius: 999, objectFit: "cover" }}
      />
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#f2f1f8", lineHeight: 1.1 }}>Nova</div>
        <div style={{ fontSize: 9, color: "#9a9bb0", lineHeight: 1.1 }}>SaaS Copilot</div>
      </div>
    </div>
  ),
};

const saasLabels: AssistantLabels = {
  title: "Nova",
  subtitle: "SaaS Copilot",
  online: "Online",
  ready: "Ready to help",
  launcher: "Open Nova",
  open: "Open",
  close: "Close",
  minimize: "Minimize",
  restore: "Restore",
  send: "Send",
  stop: "Stop",
  placeholder: "Ask about MRR, invoices, plans...",
  emptyTitle: "Hi, I'm Nova",
  emptyDescription: "Ask me about revenue, invoices, plans, or customers.",
  thinking: "Thinking...",
  streaming: "Streaming...",
  runningTool: "Running...",
  awaitingConfirmation: "Awaiting confirmation",
  errorTitle: "Error",
  retry: "Retry",
  scrollToLatest: "Scroll to latest",
  suggestions: "Suggestions",
  conversation: "Conversation",
  you: "You",
  assistant: "Nova",
  confirmTitle: "Confirm action",
  confirmDescription: "Please confirm this action.",
  approve: "Approve",
  reject: "Reject",
  cancelAction: "Cancel",
  toolPending: "Pending",
  toolRunning: "Running",
  toolCompleted: "Completed",
  toolFailed: "Failed",
  toolCancelled: "Cancelled",
  toolParameters: "Parameters",
  toolResult: "Result",
  unknownTool: "Unknown tool",
  copyCode: "Copy code",
  copiedCode: "Copied",
  copyMessage: "Copy message",
  copiedMessage: "Copied",
};

const examples: { value: "saas"; label: string }[] = [
  { value: "saas", label: "SaaS Support" },
];

export function useAssistantPlayground() {
  const { user } = useCurrentUser();
  const [example, setExample] = useState<"saas">("saas");
  const [placement, setPlacement] = useState<AssistantWidgetProps["placement"]>("inline");
  const [position, setPosition] = useState<AssistantWidgetProps["position"]>("bottom-right");
  const [theme, setTheme] = useState<string | undefined>(undefined);
  const [assistantBubble, setAssistantBubble] = useState(true);
  const [userBubble, setUserBubble] = useState(true);
  const [showUserAvatar, setShowUserAvatar] = useState(true);
  const [messageActions, setMessageActions] = useState(true);
  const [displayState, setDisplayState] = useState<"launcher" | "open" | "minimized" | "closed">("open");
  const [suggestions, setSuggestions] = useState<string[]>(saasSuggestions);
  const [labels, setLabels] = useState<AssistantLabels | undefined>(saasLabels);
  const [components, setComponents] = useState<Record<string, AssistantComponentRenderer> | undefined>(saasComponents);
  const [slots, setSlots] = useState<AssistantSlots | undefined>(saasSlots);
  const [transport, setTransport] = useState<MockTransport>(() => createSaasTransport());
  const [transportKey, setTransportKey] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [lastSend, setLastSend] = useState<string | null>(null);

  const getDisplayState = useCallback(
    (state: "launcher" | "open" | "minimized" | "closed") => {
      setDisplayState(state);
    },
    [setDisplayState]
  );

  const sendPrepared = useCallback(() => {
    const payload = { id: `note-${Date.now()}`, text: inputValue.trim() || "Nota enviada pelo playground." };
    setLastSend(JSON.stringify(payload, null, 2));
    setTransport(new MockTransport({ script: scriptFor(payload) }));
    setTransportKey((value) => value + 1);
  }, [inputValue]);

  const applyExample = useCallback((next: "saas") => {
    setExample(next);
    setTransportKey((value) => value + 1);
    setTransport(createSaasTransport());
    setSuggestions(saasSuggestions);
    setLabels(saasLabels);
    setComponents(saasComponents);
    setSlots(saasSlots);
    setLastSend(null);
    setInputValue("");
  }, []);

  const resetTransport = useCallback(() => {
    applyExample(example);
  }, [applyExample, example]);

  const selectExample = useCallback((next: "saas") => {
    applyExample(next);
  }, [applyExample]);

  return {
    example,
    setExample: selectExample,
    placement,
    setPlacement,
    position,
    setPosition,
    theme,
    setTheme,
    displayState,
    setDisplayState,
    suggestions,
    setSuggestions,
    labels,
    assistantBubble,
    setAssistantBubble,
    userBubble,
    setUserBubble,
    showUserAvatar,
    setShowUserAvatar,
    resolvedUserAvatar: user?.avatarUrl ?? userAvatarUrl,
    messageActions,
    setMessageActions,
    components,
    slots,
    inputValue,
    setInputValue,
    lastSend,
    setLastSend,
    sendPrepared,
    resetTransport,
    transport,
    transportKey,
    tools: [],
    getDisplayState,
  };
}

export type AssistantPlaygroundState = ReturnType<typeof useAssistantPlayground>;

export function AssistantPlaygroundControls({ playground }: { playground: AssistantPlaygroundState }) {
  const {
    example,
    setExample,
    placement,
    position,
    theme,
    displayState,
    suggestions,
    assistantBubble,
    setAssistantBubble,
    userBubble,
    setUserBubble,
    showUserAvatar,
    setShowUserAvatar,
    messageActions,
    setMessageActions,
    inputValue,
    lastSend,
    sendPrepared,
    resetTransport,
    setPlacement,
    setPosition,
    setTheme,
    setDisplayState,
    setSuggestions,
    setInputValue,
  } = playground;

  return (
    <>
      <div
        className={`control-label flex flex-col gap-2 mt-4 text-[#cfd0de] text-[12px] font-semibold`}
      >
        <span>Example</span>
        <ChoiceControl
          label="Example"
          value={example}
          onChange={(value) => setExample(value as "saas")}
          options={examples.map((item) => ({ label: item.label, value: item.value }))}
        />
      </div>
      <div
        className={`control-label flex flex-col gap-2 mt-4 text-[#cfd0de] text-[12px] font-semibold`}
      >
        <span>Placement</span>
        <ChoiceControl
          label="Placement"
          value={placement ?? "floating"}
          onChange={(value) => setPlacement(value as AssistantWidgetProps["placement"])}
          options={placements.map((item) => ({ label: item.label, value: item.value ?? "floating" }))}
        />
      </div>
      <div
        className={`control-label flex flex-col gap-2 mt-4 text-[#cfd0de] text-[12px] font-semibold`}
      >
        <span>Position</span>
        <ChoiceControl
          label="Position"
          value={position ?? "bottom-right"}
          onChange={(value) => setPosition(value as AssistantWidgetProps["position"])}
          options={positions.map((item) => ({ label: item.label, value: item.value ?? "bottom-right" }))}
        />
      </div>
      <div
        className={`control-label flex flex-col gap-2 mt-4 text-[#cfd0de] text-[12px] font-semibold`}
      >
        <span>Theme</span>
        <ChoiceControl
          label="Theme"
          value={theme ?? "system"}
          onChange={(value) => setTheme(value === "system" ? undefined : value)}
          options={themes.map((item) => ({ label: item.label, value: item.value ?? "system" }))}
        />
      </div>
      <div
        className={`control-label flex flex-col gap-2 mt-4 text-[#cfd0de] text-[12px] font-semibold`}
      >
        <span>Display state</span>
        <ChoiceControl
          label="Display state"
          value={displayState}
          onChange={(value) => setDisplayState(value as "launcher" | "open" | "minimized" | "closed")}
          options={displayStates.map((item) => ({ label: item.label, value: item.value }))}
        />
      </div>
      <div
        className={`control-label flex flex-col gap-2 mt-4 text-[#cfd0de] text-[12px] font-semibold`}
      >
        <span>Suggestions</span>
        <textarea
          aria-label="Suggestions (comma separated)"
          className="w-full min-h-[60px] p-3 [border:1px_solid_#343544] rounded-lg text-[#f2f1f8] [background:#111219] text-[12.5px] leading-[1.6] resize-y"
          onChange={(event) => setSuggestions(event.target.value.split(",").map((item) => item.trim()).filter(Boolean))}
          placeholder="Escrever uma nota, Ler nota 1"
          value={suggestions.join(", ")}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div
        className={`control-label flex flex-col gap-2 mt-4 text-[#cfd0de] text-[12px] font-semibold`}
      >
        <span>Assistant bubble</span>
        <button
          onClick={() => setAssistantBubble((value) => !value)}
          type="button"
          style={{
            padding: "6px 10px",
            borderRadius: 8,
            border: "1px solid #343544",
            background: assistantBubble ? "#7b4dff" : "#1a1b23",
            color: "#f2f1f8",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {assistantBubble ? "On" : "Off"}
        </button>
      </div>
      <div
        className={`control-label flex flex-col gap-2 mt-4 text-[#cfd0de] text-[12px] font-semibold`}
      >
        <span>User bubble</span>
        <button
          onClick={() => setUserBubble((value) => !value)}
          type="button"
          style={{
            padding: "6px 10px",
            borderRadius: 8,
            border: "1px solid #343544",
            background: userBubble ? "#7b4dff" : "#1a1b23",
            color: "#f2f1f8",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {userBubble ? "On" : "Off"}
        </button>
      </div>
      <div
        className={`control-label flex flex-col gap-2 mt-4 text-[#cfd0de] text-[12px] font-semibold`}
      >
        <span>User avatar</span>
        <button
          onClick={() => setShowUserAvatar((value) => !value)}
          type="button"
          style={{
            padding: "6px 10px",
            borderRadius: 8,
            border: "1px solid #343544",
            background: showUserAvatar ? "#7b4dff" : "#1a1b23",
            color: "#f2f1f8",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {showUserAvatar ? "On" : "Off"}
        </button>
      </div>
      <div
        className={`control-label flex flex-col gap-2 mt-4 text-[#cfd0de] text-[12px] font-semibold`}
      >
        <span>Copy message</span>
        <button
          onClick={() => setMessageActions((value) => !value)}
          type="button"
          style={{
            padding: "6px 10px",
            borderRadius: 8,
            border: "1px solid #343544",
            background: messageActions ? "#7b4dff" : "#1a1b23",
            color: "#f2f1f8",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {messageActions ? "On" : "Off"}
        </button>
      </div>
      </div>
      <div
        className={`control-label flex flex-col gap-2 mt-4 text-[#cfd0de] text-[12px] font-semibold`}
      >
        <span>Message to send</span>
        <textarea
          aria-label="Message"
          className="w-full min-h-[60px] p-3 [border:1px_solid_#343544] rounded-lg text-[#f2f1f8] [background:#111219] text-[12.5px] leading-[1.6] resize-y"
          onChange={(event) => setInputValue(event.target.value)}
          placeholder="Digite o texto da nota..."
          value={inputValue}
        />
      </div>
      <div className="assistant-play-actions mt-3 flex flex-col gap-2">
        <button
          aria-label="Send prepared message"
          className="inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-lg border border-[#7b4dff] bg-[#7b4dff] px-3 text-[11.5px] font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_10px_24px_-14px_rgb(123_77_255/0.9)] transition-colors hover:border-[#8e64ff] hover:bg-[#8e64ff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7b4dff] active:bg-[#6c3fe8] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          disabled={!inputValue.trim()}
          onClick={sendPrepared}
          type="button"
        >
          <Send aria-hidden="true" size={14} />
          Send message
        </button>
        <button
          aria-label="Reset transport"
          className="inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-lg border border-[#343544] bg-[#1a1b23] px-3 text-[11.5px] font-medium text-[#e2e2e5] transition-colors hover:border-[#5b5c6b] hover:bg-[#22232d] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7b4dff] active:bg-[#15161d]"
          onClick={resetTransport}
          type="button"
        >
          <RotateCcw aria-hidden="true" size={14} />
          Reset transport
        </button>
      </div>
      {lastSend && (
        <div className="assistant-play-log mt-3 max-h-40 overflow-auto p-3 [border:1px_solid_#292a37] rounded-[9px] [background:#0b0c11] text-[#c0c1d2] [font:11.5px/1.6_ui-monospace,SFMono-Regular,Menlo,monospace]">
          <strong>Last sent payload:</strong>
          <pre className="m-0 mt-1 text-[11px] overflow-x-auto">{lastSend}</pre>
        </div>
      )}
    </>
  );
}

export function AssistantPlaygroundStage({ playground }: { playground: AssistantPlaygroundState }) {
  const {
    placement,
    position,
    theme,
    displayState,
    suggestions,
    transport,
    transportKey,
    tools,
    labels,
    assistantBubble,
    userBubble,
    showUserAvatar,
    resolvedUserAvatar,
    messageActions,
    components,
    slots,
  } = playground;

  const anchorHorizontal =
    position === "bottom-left" || position === "top-left" || position === "left"
      ? "flex-start"
      : position === "bottom"
        ? "center"
        : "flex-end";
  const anchorVertical =
    position?.startsWith("top")
      ? "flex-start"
      : position === "right" || position === "left"
        ? "center"
        : "flex-end";

  return (
    <div
      data-assistant-anchor={position ?? "bottom-right"}
      className="assistant-play-stage relative flex size-full min-h-[640px] flex-col"
      style={{ alignItems: anchorHorizontal, justifyContent: anchorVertical }}
    >
        <AssistantWidget
        key={transportKey}
        assistantBubble={assistantBubble}
        userBubble={userBubble}
        userAvatar={showUserAvatar ? resolvedUserAvatar : undefined}
        assistantAvatar={agentAvatarUrl}
        messageActions={messageActions}
        components={components}
        displayState={displayState}
        labels={labels}
        onAction={(event) => {
          playground.setLastSend(JSON.stringify(event.payload ?? event.action ?? event.button.label, null, 2));
        }}
        onDisplayStateChange={playground.getDisplayState}
        placement={placement}
        position={position ?? "bottom-right"}
        slots={slots}
        suggestions={suggestions}
        theme={theme}
        tools={tools}
        transport={transport}
        style={
          placement === "floating"
            ? ({
                position: "absolute",
                width: "auto",
                maxWidth: "100%",
                zIndex: 1,
                "--wk-assistant-panel-height":
                  "min(680px, calc(100dvh - 120px), 520px)",
              } as CSSProperties)
            : { width: "auto", maxWidth: "100%" }
        }
      />
    </div>
  );
}

const assistantPreviewFrame = 340;

export function WidgetAssistantPreview({ size = 136 }: { size?: number }) {
  const scale = size / assistantPreviewFrame;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none relative shrink-0"
      style={{ width: size, height: size }}
      inert
    >
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{
          width: assistantPreviewFrame,
          height: assistantPreviewFrame,
          transform: `scale(${scale})`,
        }}
      >
        <AssistantWidget
          aria-label="Assistant widget preview"
          defaultDisplayState="open"
          placement="inline"
          style={{
            width: assistantPreviewFrame,
            height: assistantPreviewFrame,
            pointerEvents: "none",
            "--wk-assistant-panel-height": `${assistantPreviewFrame}px`,
            "--wk-assistant-inline-height": `${assistantPreviewFrame}px`,
          } as CSSProperties}
          suggestions={["Escrever uma nota", "Ler nota 1"]}
          transport={new MockTransport({ script: "Olá, sou o assistente do Widget Kit." })}
          tools={[]}
        />
      </div>
    </div>
  );
}

function AssistantPlaygroundHarness() {
  const playground = useAssistantPlayground();
  return (
    <>
      <AssistantPlaygroundControls playground={playground} />
      <AssistantPlaygroundStage playground={playground} />
    </>
  );
}

export { AssistantPlaygroundHarness };
