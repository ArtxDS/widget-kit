import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { useRef } from "react";
import {
  AssistantProvider,
  AssistantPanel,
  AssistantTrigger,
  AssistantWidget,
  useAssistant,
  type AssistantImperativeHandle,
} from "../../src";
import {
  createAssistantRuntime,
  sanitizeTriggerContext,
  type AssistantRequest,
} from "../../src/core";
import { MockTransport } from "../../src/transport";

describe("contextual triggers & programmatic assistant opening", () => {
  it("opens and closes via Floating Launcher normally", async () => {
    const user = userEvent.setup();
    const transport = new MockTransport({ script: "Reply" });

    render(<AssistantWidget transport={transport} defaultDisplayState="launcher" />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    const launcher = screen.getByRole("button", { name: "Assistant" });
    await user.click(launcher);

    expect(screen.getByRole("dialog", { name: "Assistant" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close assistant" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("opens via external button using useAssistant()", async () => {
    const user = userEvent.setup();
    const transport = new MockTransport({ script: "Help response" });

    function TestApp() {
      const assistant = useAssistant();
      return (
        <div>
          <button onClick={() => void assistant.open()}>Precisa de ajuda?</button>
          <AssistantPanel />
        </div>
      );
    }

    render(
      <AssistantProvider transport={transport} defaultDisplayState="launcher">
        <TestApp />
      </AssistantProvider>,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Precisa de ajuda?" }));

    expect(screen.getByRole("dialog", { name: "Assistant" })).toBeInTheDocument();
  });

  it("opens with context and sends it to the transport on subsequent messages", async () => {
    const user = userEvent.setup();
    const captured = { request: null as AssistantRequest | null };

    const transport = new MockTransport({
      script: (request) => {
        captured.request = request;
        return "Transação analisada com sucesso.";
      },
    });

    function TransactionCard() {
      const { open } = useAssistant();
      return (
        <button
          onClick={() => {
            void open({
              context: {
                type: "transaction",
                data: { id: "tx-42", amount: 15.5 },
              },
            });
          }}
        >
          Explicar transação
        </button>
      );
    }

    render(
      <AssistantProvider transport={transport} defaultDisplayState="launcher">
        <TransactionCard />
        <AssistantPanel />
      </AssistantProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Explicar transação" }));
    const dialog = screen.getByRole("dialog", { name: "Assistant" });
    expect(dialog).toBeInTheDocument();

    const input = within(dialog).getByRole("textbox", { name: "Write a message..." });
    await user.type(input, "Qual o status da transação?");
    await user.click(within(dialog).getByRole("button", { name: "Send message" }));

    await waitFor(() => {
      expect(captured.request).not.toBeNull();
    });

    expect(captured.request?.context).toEqual({
      type: "transaction",
      data: { id: "tx-42", amount: 15.5 },
    });
  });

  it("opens with initialMessage and dispatches it immediately", async () => {
    const user = userEvent.setup();
    const captured = { request: null as AssistantRequest | null };

    const transport = new MockTransport({
      script: (request) => {
        captured.request = request;
        return "Esta transação moveu 2.5 SOL com sucesso.";
      },
    });

    function QuickHelp() {
      const { open } = useAssistant();
      return (
        <button
          onClick={() => {
            void open({
              initialMessage: "Explique esta transação para mim.",
              context: {
                type: "transaction",
                data: { id: "tx-99" },
              },
            });
          }}
        >
          Analisar
        </button>
      );
    }

    render(
      <AssistantProvider transport={transport} defaultDisplayState="launcher">
        <QuickHelp />
        <AssistantPanel />
      </AssistantProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Analisar" }));

    expect(screen.getByRole("dialog", { name: "Assistant" })).toBeInTheDocument();

    await waitFor(() => {
      expect(captured.request).not.toBeNull();
    });

    expect(captured.request?.messages[0]?.parts[0]).toMatchObject({
      type: "text",
      text: "Explique esta transação para mim.",
    });
    expect(captured.request?.context).toEqual({
      type: "transaction",
      data: { id: "tx-99" },
    });

    expect(await screen.findByText("Esta transação moveu 2.5 SOL com sucesso.")).toBeInTheDocument();
  });

  it("closes, minimizes, and restores programmatically", async () => {
    const user = userEvent.setup();
    const transport = new MockTransport({ script: "Ok" });

    function Controls() {
      const assistant = useAssistant();
      return (
        <div>
          <button onClick={() => void assistant.open()}>Abrir</button>
          <button onClick={() => assistant.close()}>Fechar</button>
          <button onClick={() => assistant.minimize()}>Minimizar</button>
          <button onClick={() => assistant.restore()}>Restaurar</button>
          <button onClick={() => void assistant.toggle()}>Alternar</button>
          <span data-testid="state">{assistant.displayState}</span>
        </div>
      );
    }

    render(
      <AssistantProvider transport={transport} defaultDisplayState="launcher">
        <Controls />
        <AssistantPanel />
      </AssistantProvider>,
    );

    expect(screen.getByTestId("state")).toHaveTextContent("launcher");

    await user.click(screen.getByRole("button", { name: "Abrir" }));
    expect(screen.getByTestId("state")).toHaveTextContent("open");
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Minimizar" }));
    expect(screen.getByTestId("state")).toHaveTextContent("minimized");

    await user.click(screen.getByRole("button", { name: "Restaurar" }));
    expect(screen.getByTestId("state")).toHaveTextContent("open");

    await user.click(screen.getByRole("button", { name: "Fechar" }));
    expect(screen.getByTestId("state")).toHaveTextContent("launcher");

    await user.click(screen.getByRole("button", { name: "Alternar" }));
    expect(screen.getByTestId("state")).toHaveTextContent("open");
  });

  it("preserves conversation history across open/close cycles", async () => {
    const user = userEvent.setup();
    const transport = new MockTransport({ script: "Histórico preservado." });

    render(
      <AssistantWidget
        transport={transport}
        defaultDisplayState="open"
      />
    );

    const dialog = screen.getByRole("dialog", { name: "Assistant" });
    const input = within(dialog).getByRole("textbox", { name: "Write a message..." });
    await user.type(input, "Mensagem inicial de teste");
    await user.click(within(dialog).getByRole("button", { name: "Send message" }));

    expect(await screen.findByText("Histórico preservado.")).toBeInTheDocument();

    // Fecha o painel
    await user.click(screen.getByRole("button", { name: "Close assistant" }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    // Reabre o painel pelo launcher
    await user.click(screen.getByRole("button", { name: "Assistant" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Mensagens continuam lá
    expect(screen.getByText("Mensagem inicial de teste")).toBeInTheDocument();
    expect(screen.getByText("Histórico preservado.")).toBeInTheDocument();
  });

  it("handles triggers from multiple independent components sharing the provider", async () => {
    const user = userEvent.setup();
    const requests: AssistantRequest[] = [];

    const transport = new MockTransport({
      script: (req) => {
        requests.push(req);
        return "Ok";
      },
    });

    function ComponentA() {
      const { open } = useAssistant();
      return (
        <button
          onClick={() =>
            void open({
              context: { source: "card-A" },
              initialMessage: "Dúvida do card A",
            })
          }
        >
          Card A
        </button>
      );
    }

    function ComponentB() {
      const { open } = useAssistant();
      return (
        <button
          onClick={() =>
            void open({
              context: { source: "card-B" },
              initialMessage: "Dúvida do card B",
            })
          }
        >
          Card B
        </button>
      );
    }

    render(
      <AssistantProvider transport={transport} defaultDisplayState="launcher">
        <ComponentA />
        <ComponentB />
        <AssistantPanel />
      </AssistantProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Card A" }));
    await waitFor(() => {
      expect(requests.length).toBe(1);
    });
    expect(requests[0].context).toEqual({ source: "card-A" });

    await user.click(screen.getByRole("button", { name: "Card B" }));
    await waitFor(() => {
      expect(requests.length).toBe(2);
    });
    expect(requests[1].context).toEqual({ source: "card-B" });
  });

  it("supports declarative <AssistantTrigger> with children and asChild", async () => {
    const user = userEvent.setup();
    const captured = { request: null as AssistantRequest | null };
    const transport = new MockTransport({
      script: (req) => {
        captured.request = req;
        return "Resposta via trigger declarativo";
      },
    });

    render(
      <AssistantProvider transport={transport} defaultDisplayState="launcher">
        <AssistantTrigger
          context={{ item: "wallet" }}
          initialMessage="Ajuda com carteira"
        >
          Abrir Carteira
        </AssistantTrigger>

        <AssistantTrigger
          asChild
          context={{ item: "tokens" }}
          initialMessage="Ajuda com tokens"
        >
          <a href="#tokens">Link Tokens</a>
        </AssistantTrigger>

        <AssistantPanel />
      </AssistantProvider>,
    );

    // Click no botão padrão do trigger
    await user.click(screen.getByRole("button", { name: "Abrir Carteira" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await waitFor(() => {
      expect(captured.request).not.toBeNull();
    });
    expect(captured.request?.context).toEqual({ item: "wallet" });

    // Click no trigger asChild
    await user.click(screen.getByRole("link", { name: "Link Tokens" }));
    await waitFor(() => {
      expect(captured.request?.context).toEqual({ item: "tokens" });
    });
  });

  it("allows controlling AssistantWidget via imperative handle ref", async () => {
    const user = userEvent.setup();
    const captured = { request: null as AssistantRequest | null };

    const transport = new MockTransport({
      script: (req) => {
        captured.request = req;
        return "Resposta handle";
      },
    });

    function ImperativeHost() {
      const assistantRef = useRef<AssistantImperativeHandle>(null);

      return (
        <div>
          <button
            onClick={() => {
              void assistantRef.current?.open({
                context: { imperative: true },
                initialMessage: "Aberto via ref",
              });
            }}
          >
            Disparar Ref
          </button>
          <button onClick={() => assistantRef.current?.close()}>Fechar Ref</button>
          <AssistantWidget
            ref={assistantRef}
            transport={transport}
            defaultDisplayState="launcher"
          />
        </div>
      );
    }

    render(<ImperativeHost />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Disparar Ref" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await waitFor(() => {
      expect(captured.request).not.toBeNull();
    });
    expect(captured.request?.context).toEqual({ imperative: true });

    await user.click(screen.getByRole("button", { name: "Fechar Ref" }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("sanitizes untrusted context against prototype pollution and removes functions", () => {
    const evilPayload = JSON.parse(
      '{"__proto__": {"polluted": true}, "normal": "valid", "nested": {"constructor": "bad", "score": 99}}',
    );
    // Adiciona função no objeto
    evilPayload.maliciousFn = () => alert("hack");

    const clean = sanitizeTriggerContext(evilPayload);

    expect(clean).toEqual({
      normal: "valid",
      nested: { score: 99 },
    });
    expect((clean as Record<string, unknown>).polluted).toBeUndefined();
    expect((clean as Record<string, unknown>).maliciousFn).toBeUndefined();
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it("isolates runtime context between separate runtime instances", () => {
    const transport = new MockTransport({ script: "Test" });
    const runtime1 = createAssistantRuntime({ transport, context: { app: "one" } });
    const runtime2 = createAssistantRuntime({ transport, context: { app: "two" } });

    runtime1.setContext({ user: "alice" });
    runtime2.setContext({ user: "bob" });

    expect(runtime1.getContext()).toEqual({ user: "alice" });
    expect(runtime2.getContext()).toEqual({ user: "bob" });

    runtime1.clearContext();
    expect(runtime1.getContext()).toEqual({});
    expect(runtime2.getContext()).toEqual({ user: "bob" });

    runtime1.dispose();
    runtime2.dispose();
  });

  it("supports opening with context and initial message from a custom consumer component", async () => {
    const user = userEvent.setup();
    const captured = { request: null as AssistantRequest | null };
    const transport = new MockTransport({
      script: (req) => {
        captured.request = req;
        return "Explicação da transação Solana.";
      },
    });

    function TransactionCard() {
      const { open } = useAssistant();
      return (
        <button
          onClick={() => {
            void open({
              initialMessage: "Explique esta transação para mim.",
              context: {
                type: "transaction",
                data: { id: "tx-sol-777", status: "confirmed", amount: 4.2 },
              },
            });
          }}
        >
          Explicar transação
        </button>
      );
    }

    render(
      <AssistantProvider transport={transport} defaultDisplayState="launcher">
        <TransactionCard />
        <AssistantPanel />
      </AssistantProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Explicar transação" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await waitFor(() => {
      expect(captured.request).not.toBeNull();
    });

    expect(captured.request?.context).toEqual({
      type: "transaction",
      data: { id: "tx-sol-777", status: "confirmed", amount: 4.2 },
    });
    expect(captured.request?.messages[0]?.parts[0]).toMatchObject({
      type: "text",
      text: "Explique esta transação para mim.",
    });
  });
});
