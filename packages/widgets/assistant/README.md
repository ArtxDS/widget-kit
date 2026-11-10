# Assistant (`@artxds/widget-kit/assistant`)

A modular, headless, domain-agnostic conversational assistant for React and Next.js applications.

Designed around a layered architecture:
- **Pure Core:** models, events, protocol, and validations with no React, DOM, or network dependencies.
- **Headless Runtime:** session orchestrator, streams, cancellation, and tool lifecycle.
- **Pluggable Transports:** I/O boundary (`HttpTransport` for SSE/NDJSON/JSON and `MockTransport` for network-free tests).
- **Thin React UI:** complete widgets (`AssistantWidget`), layout components (`AssistantPanel`, `AssistantLauncher`, `AssistantTrigger`), and hooks (`useAssistant`, `useAssistantChat`).

---

## 1. Installation and Subpaths

```bash
npm install @artxds/widget-kit
```

The Assistant is exposed through explicit subpaths to ensure isolation and compatibility with Server Components:

```tsx
// React UI (Client-only)
import {
  AssistantWidget,
  AssistantProvider,
  AssistantLauncher,
  AssistantPanel,
  AssistantTrigger,
  useAssistant,
  useAssistantChat,
} from "@artxds/widget-kit/assistant";

// Core and Headless Runtime (Node / Server / Browser)
import {
  createAssistantRuntime,
  defineAction,
  sanitizeTriggerContext,
} from "@artxds/widget-kit/assistant/core";

// Transports
import {
  HttpTransport,
  MockTransport,
} from "@artxds/widget-kit/assistant/transport";

// Optional styles
import "@artxds/widget-kit/styles/assistant.css";
```

---

## 2. Quick Start (`AssistantWidget`)

The simplest way to render the assistant is to use `AssistantWidget`, which includes the floating launcher, the chat panel, keyboard shortcuts (`⌘K` / `Ctrl+K`), and focus management:

```tsx
"use client";

import { AssistantWidget } from "@artxds/widget-kit/assistant";
import { HttpTransport } from "@artxds/widget-kit/assistant/transport";
import "@artxds/widget-kit/styles/assistant.css";

const transport = new HttpTransport({ endpoint: "/api/chat" });

export function App() {
  return (
    <AssistantWidget
      transport={transport}
      placement="floating"
      position="bottom-right"
      suggestions={[
        "How does the platform work?",
        "What is the status of my order?",
      ]}
    />
  );
}
```

---

## 3. Contextual Triggers & Programmatic Opening

The Assistant does not rely exclusively on the floating button (`AssistantLauncher`) to open. Client application elements (buttons, links, cards, table rows, icons) can open the panel, pass business context, and send initial questions.

### 3.1. Via the `useAssistant()` Hook (Imperative)

Any component below `<AssistantProvider>` or `<AssistantWidget>` can use `useAssistant()`:

```tsx
import { useAssistant } from "@artxds/widget-kit/assistant";

function TransactionCard({ transaction }) {
  const assistant = useAssistant();

  return (
    <div className="transaction-card">
      <h4>Transaction #{transaction.id}</h4>
      <p>Amount: {transaction.amount} SOL</p>

      {/* Contextual opening with an initial question */}
      <button
        onClick={() => {
          assistant.open({
            initialMessage: "Explain this transaction to me.",
            context: {
              type: "transaction",
              data: transaction,
            },
          });
        }}
      >
        Explain transaction
      </button>

      {/* Simple opening */}
      <button onClick={() => assistant.open()}>
        Need help?
      </button>

      {/* State control */}
      <button onClick={() => assistant.toggle()}>Toggle</button>
      <button onClick={() => assistant.minimize()}>Minimize</button>
      <button onClick={() => assistant.close()}>Close</button>
    </div>
  );
}
```

### 3.2. Opening with Context Without an Initial Message

When you want the assistant to load the context data but wait for the user to phrase their own question:

```tsx
function WalletOverview({ balance }) {
  const { open } = useAssistant();

  return (
    <button
      onClick={() => {
        open({
          context: {
            type: "wallet-balance",
            data: { balance: 2.5 },
          },
        });
      }}
    >
      Understand my balance
    </button>
  );
}
```

The provided context is kept in the session and automatically merged into the next message sent by the user.

### 3.3. Via the Declarative `<AssistantTrigger>` Component

To declare contextual triggers in the tree without writing manual click handlers:

```tsx
import { AssistantTrigger } from "@artxds/widget-kit/assistant";

// Rendering as the default button:
<AssistantTrigger
  context={{ type: "transaction", data: tx }}
  initialMessage="What does this status mean?"
>
  Explain transaction
</AssistantTrigger>

// Composing with an existing element or link (asChild):
<AssistantTrigger
  asChild
  context={{ type: "security-alert", level: "high" }}
  initialMessage="How can I protect my wallet?"
>
  <a href="#help" className="security-alert-link">
    Security Alert: Learn more
  </a>
</AssistantTrigger>
```

### 3.4. Via Imperative Ref (`AssistantImperativeHandle`)

If the direct parent component renders `<AssistantWidget>` and wants to control it through a ref:

```tsx
import { useRef } from "react";
import {
  AssistantWidget,
  type AssistantImperativeHandle,
} from "@artxds/widget-kit/assistant";

function Dashboard() {
  const assistantRef = useRef<AssistantImperativeHandle>(null);

  return (
    <div>
      <button
        onClick={() => {
          assistantRef.current?.open({
            context: { screen: "analytics" },
            initialMessage: "Explain the conversion metrics.",
          });
        }}
      >
        Screen help
      </button>

      <AssistantWidget ref={assistantRef} transport={transport} />
    </div>
  );
}
```

---

## 4. Open Options API (`AssistantOpenOptions`)

```ts
type AssistantOpenOptions = {
  /**
   * Optional, domain-agnostic contextual data for the session.
   * Merged into requests without automatic code execution.
   */
  context?: Record<string, unknown>;

  /**
   * Optional initial message to start the conversation.
   */
  initialMessage?: AssistantInput;

  /**
   * If true, dispatches the message immediately upon opening.
   * Default: true when initialMessage is provided.
   */
  autoSend?: boolean;
};
```

---

## 5. `useAssistant()` Hook Methods

| Property / Method | Type | Description |
| --- | --- | --- |
| `displayState` | `AssistantDisplayState` | Current state (`"closed" \| "launcher" \| "open" \| "minimized"`). |
| `isOpen` | `boolean` | `true` if the panel is open. |
| `isMinimized` | `boolean` | `true` if the panel is minimized. |
| `isLauncher` | `boolean` | `true` if only the launcher is visible. |
| `open(options?)` | `(options?: AssistantOpenOptions) => Promise<void>` | Opens the panel, applies context, and sends the initial message if provided. |
| `close()` | `() => void` | Returns the assistant to the launcher state. |
| `toggle(options?)` | `(options?: AssistantOpenOptions) => Promise<void>` | Toggles between launcher and open. |
| `minimize()` | `() => void` | Minimizes the panel while keeping history intact. |
| `restore()` | `() => void` | Restores the minimized panel to open. |
| `context` | `Record<string, unknown>` | Current dynamic session context. |
| `setContext(updater)` | `(context: Record<string, unknown> \| ((prev) => Record<string, unknown>)) => void` | Sets or merges context data into the session. |
| `clearContext()` | `() => void` | Clears the dynamic session context. |
| `send(input)` | `(input: AssistantInput) => Promise<void>` | Sends a message manually. |
| `cancel()` | `() => void` | Cancels the in-progress response or stream. |
| `retry()` | `() => Promise<void>` | Re-runs the last failed message. |
| `reset(messages?)` | `(messages?: readonly ChatMessage[]) => void` | Resets the conversation. |
| `confirm(approved)` | `(approved: boolean) => void` | Approves or rejects a write-tool confirmation. |
| `status` | `AssistantStatus` | Execution status (`idle`, `thinking`, `streaming`, `executing-tool`, `awaiting-confirmation`, `error`). |
| `messages` | `readonly ChatMessage[]` | Full immutable message history. |
| `isBusy` | `boolean` | `true` if the assistant is processing. |

---

## 6. Manual Composition

For custom layouts or multiple entry points, compose with `<AssistantProvider>`:

```tsx
import {
  AssistantProvider,
  AssistantLauncher,
  AssistantPanel,
  AssistantTrigger,
} from "@artxds/widget-kit/assistant";

export function CustomLayout() {
  return (
    <AssistantProvider transport={transport} defaultDisplayState="launcher">
      {/* Application header trigger */}
      <header>
        <AssistantTrigger initialMessage="How do I navigate here?">
          Help
        </AssistantTrigger>
      </header>

      {/* Main content */}
      <main>...</main>

      {/* Launcher and Panel */}
      <AssistantLauncher />
      <AssistantPanel />
    </AssistantProvider>
  );
}
```

---

## 7. Security and Data Protection

- **Prototype Pollution Protection:** All context input goes through [`sanitizeTriggerContext`](file:///Users/arthuralves/Documents/workspace/widget-kit/packages/widgets/assistant/src/core/validation.ts#L9-L37), which discards malicious keys (`__proto__`, `constructor`, `prototype`).
- **No Code Execution:** Functions passed in context objects are automatically removed.
- **Protected Actions:** Write tools (`access: "write"`) and high-risk tools (`risk: "high"`) are never executed until explicit user approval through the confirmation card (`ActionConfirmation`). Read tools may execute automatically after successful validation.
- **Business-Agnostic:** The framework does not store or know provider-specific LLM rules or domain rules.
- **Runtime Requirements:** `HttpTransport` requires `fetch`, `Headers`, `ReadableStream`, and `TextDecoder` (Node.js 18+ or a modern browser).

---

## 8. Tool Orchestration

The Runtime does not ship domain tools. It orchestrates tool handlers explicitly provided by the consumer through `AssistantRuntimeOptions.tools` or `AssistantProviderProps.tools`.

- **Read tools** (`access: "read"`) may execute automatically after successful validation.
- **Write tools** (`access: "write"`) and **high-risk tools** (`risk: "high"`) always require explicit confirmation before execution.
- **Unknown tools** and tools with invalid input are never executed.
- **Cancellation** propagates an `AbortSignal` to the running handler.
- **Results, failures and cancellations** are recorded in conversation history as `tool-result` parts.

Sensitive tools, credentials and business logic should remain in secure server environments and must not be exposed to the browser.

---

## 9. Streaming Protocol

The Assistant uses a normalized event protocol. Events may be delivered as a single JSON value, an array, an `{ events }` object, NDJSON lines, or SSE frames.

Supported events:

- `run-start`: `{ runId }`
- `message-start`: `{ messageId, role: "assistant" }`
- `part-start`: `{ messageId, part }`
- `text-delta`: `{ messageId, partId, delta }`
- `message-end`: `{ messageId, finishReason? }`
- `tool-call`: `{ toolCallId, name, input?, access?, description?, risk?, messageId? }`
- `tool-result`: `{ toolCallId, name?, output?, status?, isError?, error?, messageId? }`
- `error`: `{ error }`
- `run-end`: `{ runId, status: "completed" | "cancelled" | "error" }`

Rules:

- `messageId` identifies the assistant message.
- `partId` identifies a text part inside that message.
- `part-start` creates or updates a part.
- `text-delta` updates the part identified by `partId`.
- Multiple parts can coexist in the same message.
- Duplicate part IDs use upsert behavior.
- Unknown events are ignored.
- `error` ends the run with status `error`.
- A stream without `run-end` results in `invalid-response`.
- Old runs cannot update a newer run.
- Cancellation continues to use `AbortController`.
