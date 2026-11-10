# Assistant Framework — Arquitetura

> **Status:** Core, Runtime, transportes headless, UI React, estilos, playground e catálogo implementados e validados. Adapter opcional do Mascot e camada server pendentes.
>
> **Escopo:** documentação arquitetural e fundação headless do Assistant Framework do `@artxds/widget-kit`.
>
> **Contexto:** o Widget Kit é uma biblioteca pessoal de frontend. Não é um SaaS, não possui infraestrutura própria e não deve assumir domínio de negócio. O Wallet Hub será apenas um dos consumidores.

## 1. Objetivo

O Assistant Framework deve fornecer uma base reutilizável para um Assistant Chat:

- frontend-first;
- agnóstico de domínio;
- agnóstico de provider de LLM;
- testável sem rede;
- integrável a qualquer aplicação React;
- preparado para receber streaming, ferramentas e integrações com LLMs sem exigir a reconstrução da arquitetura.

A biblioteca deve entregar a interface, o modelo de estado, o runtime e os contratos de transporte. A aplicação consumidora deve entregar domínio, prompts, definições e handlers de ferramentas, autenticação, endpoint, persistência e integrações com providers.

### Fora de escopo nesta fase

- Implementar chamadas a LLMs.
- Implementar backend, rotas de servidor ou banco de dados.
- Integrar OpenAI, Anthropic, Google, Groq ou qualquer provider.
- Fornecer ferramentas de domínio, credenciais, integrações específicas de providers ou lógica de negócio sensível no client.
- Criar autenticação, billing, analytics ou persistência.
- Criar monorepo, workspaces ou novos pacotes físicos.
- Adicionar dependências de runtime ao pacote.

## 2. Princípios arquiteturais

1. **Uma única biblioteca.** O Assistant continua dentro de `@artxds/widget-kit`, usando subpath exports. Não haverá pacote separado.
2. **UI fina.** Componentes React apenas renderizam estado e emitem intenções. Não fazem `fetch`, não conhecem providers e não executam regras de domínio.
3. **Core puro.** O modelo de mensagens, estados, eventos e reducers não conhece React, DOM, rede ou providers.
4. **Runtime headless.** O orquestrador de sessão controla o ciclo de vida, cancelamento, ordem dos eventos e estado observável. Não conhece React nem DOM.
5. **Transport como fronteira de I/O.** Todo acesso externo passa por um contrato de transporte. `MockTransport` e `HttpTransport` são implementações intercambiáveis.
6. **Domínio no consumidor.** System prompt, ferramentas, contexto de negócio, identidade, dados e renderizadores específicos pertencem à aplicação consumidora.
7. **Provider no servidor.** SDKs e credenciais de LLM não entram no pacote client. Quando existirem, adapters de provider ficarão em uma entrada server separada.
8. **Compatibilidade aditiva.** Novos subpaths e eventos devem ser adicionados sem quebrar exports, contratos ou consumidores existentes.
9. **Testabilidade por injeção.** Runtime, transporte, relógio e IDs devem permitir substituição em testes; nenhum teste de UI precisa de rede real.
10. **Sem infraestrutura própria.** A biblioteca não presume endpoint, banco, fila, cache ou serviço gerenciado.

## 3. Separação entre UI, Core, Runtime e Transport

Fluxo unidirecional:

```text
Intenção da UI
    ↓
Runtime
    ↓
Transport
    ↓
Eventos normalizados
    ↓
Runtime
    ↓
Core (reducer/selectors)
    ↓
Snapshot
    ↓
UI
```

### 3.1 Core

Responsabilidades:

- contratos de mensagens, eventos, erros e estado;
- estado inicial;
- reducer determinístico;
- selectors;
- normalização semântica do protocolo;
- versionamento do protocolo.

Proibições:

- importar React, ReactDOM, DOM, `window`, `document`;
- importar `fetch`, SDKs, Mascot, `dompurify`, ícones ou Next.js;
- importar Runtime, Transport ou React (camada puramente independente);
- gerar timers, aleatoriedade, IDs ou timestamps por conta própria;
- executar efeitos colaterais.

Pode rodar em browser, Node, edge runtime e testes sem DOM.

### 3.2 Runtime

Responsabilidades:

- manter o snapshot atual do Assistant;
- expor `subscribe`/`getSnapshot` para adapters de UI;
- transformar entradas do usuário em requisições;
- chamar o transporte;
- consumir o stream normalizado de eventos;
- aplicar eventos ao Core;
- controlar `AbortSignal`, cancelamento, descarte de eventos obsoletos e `dispose`;
- normalizar erros de transporte em estado de erro;
- garantir ordem e idempotência dos eventos;
- gerar IDs e timestamps via dependências injetáveis, quando necessário.

Proibições:

- importar React ou DOM;
- chamar `fetch` diretamente;
- renderizar qualquer coisa;
- conhecer o payload nativo de um provider;
- executar ferramentas de domínio sem um handler explícito do consumidor;
- executar ferramentas desconhecidas ou com input inválido.

O Runtime é o “headless engine”. Ele deve ser utilizável fora do React e ser compatível com `useSyncExternalStore` no adapter React.

### 3.3 Transport

Responsabilidades:

- serializar uma requisição genérica;
- traduzir a resposta da fonte para eventos normalizados;
- respeitar `AbortSignal`;
- converter falhas de rede/HTTP/formato em `AssistantError`;
- isolar o Runtime de detalhes de protocolo de rede.

Proibições:

- alterar estado diretamente;
- renderizar;
- conhecer React;
- importar o Runtime ou a UI;
- conter prompts, regras de domínio ou credenciais fixas.

### 3.4 UI

Responsabilidades:

- renderizar o painel, lista de mensagens, composer e estados visuais;
- assinar o Runtime;
- emitir intenções (`send`, `cancel`, `retry`, `reset`);
- oferecer slots e renderizadores para o consumidor;
- garantir acessibilidade e comportamento de teclado;
- integrar opcionalmente o Mascot como avatar/presença.

Proibições:

- chamar transporte diretamente;
- implementar regras de domínio;
- importar SDK de provider;
- manter estado de conversa paralelo ao Runtime;
- importar código server-only.

Implementação atual:

- `AssistantProvider` recebe um Runtime ou cria um a partir de um `AssistantTransport`; o Runtime é compartilhado por contexto e assinado com `useSyncExternalStore`.
- `AssistantWidget` compõe launcher, painel, estados de exibição, posicionamento e foco. `AssistantProvider`, `AssistantPanel`, `MessageList`, `AssistantMessage`, `AssistantComposer` e `AssistantSuggestions` também são exportados para composição manual.
- `useAssistant` expõe snapshot e intenções; `useAssistantChat` adiciona estado de exibição, sugestões, `panelId` e ações de abrir, fechar, minimizar e restaurar.
- Markdown é renderizado por um parser React próprio, sem `dangerouslySetInnerHTML` e com allowlist de links.
- `packages/styles/assistant.css` usa tokens `--wk-assistant-*` com fallback para `--wk-*`, classes BEM prefixadas por `wk-assistant` e suporte a `data-theme="light"` e `prefers-reduced-motion`.

### 3.5 Server futuro

A camada server é reservada, não implementada agora. Quando existir:

- pode importar Core;
- não pode importar UI ou React;
- concentra adapters de provider, segredos, streaming do LLM e persistência;
- será exposta por um subpath separado, nunca pelo root ou pela entrada client.

## 4. Estrutura de diretórios aprovada

```text
packages/widgets/assistant/
  src/
    index.ts                  # entrada pública da UI React ("use client")
    core/
      index.ts                # entrada headless: Core + Runtime
      actions.ts
      config.ts
      errors.ts
      events.ts
      messages.ts
      state.ts
      transport.ts
      validation.ts
    runtime/
      index.ts
      createAssistantRuntime.ts
      types.ts
    transport/
      index.ts                # entrada pública dos transportes
      mock.ts
      http.ts
      utils.ts
    react/
      index.ts
      AssistantWidget.tsx
      AssistantProvider.tsx
      AssistantLauncher.tsx
      AssistantPanel.tsx
      MessageList.tsx
      AssistantMessage.tsx
      AssistantComposer.tsx
      AssistantSuggestions.tsx
      context.tsx
      defaults.ts
      types.ts
      internal/
        AssistantHeader.tsx
        AssistantConfirmation.tsx
        TypingIndicator.tsx
        EmptyState.tsx
        ErrorMessage.tsx
        markdown.tsx
        classes.ts
        status.ts
        useControllableState.ts
        icons.tsx
    integrations/
      mascot.ts               # adapter opcional; não usado pelo Core
    server/
      README.md               # reservado; sem implementação nesta fase
  tests/
    core/
    runtime/
    transport/
    react/
packages/styles/assistant.css
packages/components/dashboard/experimental/assistant-playground/  # futuro
```

### Regras da estrutura

- `src/core/` e `src/runtime/` não contêm `"use client"`.
- `src/transport/` não contém `"use client"` e não depende de React.
- `src/react/` é client-only; a diretiva `"use client"` fica apenas em `src/index.ts`.
- `src/index.ts` exporta apenas a superfície React e tipos públicos.
- `src/core/index.ts` é a entrada headless e pode reexportar o Runtime.
- `src/transport/index.ts` exporta `MockTransport`, `HttpTransport` e tipos de transporte.
- `src/server/index.ts` não será criado como entrada pública até existir código server real.
- `src/integrations/mascot.ts` pode importar tipos do Mascot, mas o Core nunca importa Mascot.
- `packages/components/dashboard/experimental/assistant-playground/` é código de aplicação, excluído do build da biblioteca.

O local `packages/widgets/assistant/` é intencional: ele já é coberto pelos globs de `tsconfig.lib.json` e de coverage do Vitest, segue o padrão do Mascot e participa do catálogo de widgets.

## 5. Contratos e responsabilidades

Os tipos abaixo são contratos conceituais. Nomes podem evoluir durante a implementação; as fronteiras e semânticas descritas são vinculantes.

### 5.1 Modelo de domínio genérico

```ts
type AssistantRole = "system" | "user" | "assistant" | "tool";

type AssistantStatus =
  | "idle"
  | "submitting"
  | "thinking"
  | "streaming"
  | "executing-tool"
  | "awaiting-confirmation"
  | "error";

type AssistantMessage = {
  id: string;
  role: AssistantRole;
  parts: readonly MessagePart[];
  createdAt?: string;
  status?: "streaming" | "complete" | "error";
  metadata?: Record<string, unknown>;
};

type AssistantError = {
  code: string;
  message: string;
  retryable?: boolean;
  cause?: unknown;
};
```

`metadata` é uma válvula de escape genérica. O Core não interpreta nem renderiza metadata específica de domínio.

### 5.1.1 Configuração e ações

```ts
type AssistantConfig = {
  id: string;
  name: string;
  description?: string;
  actions?: readonly AnyActionDefinition[];
  metadata?: Record<string, unknown>;
};

type ActionDefinition = {
  name: string;
  description?: string;
  access?: "read" | "write";
  risk?: "low" | "medium" | "high";
  validate?: (input: unknown) => ActionValidationResult;
  execute: (input, context) => ActionResult | Promise<ActionResult>;
};
```

- `defineAssistant` e `defineAction`/`defineTool` validam configurações e definições em runtime.
- `access: "read"` permite execução automática após validação; `access: "write"` exige confirmação explícita.
- `risk: "high"` também exige confirmação explícita.
- Ações desconhecidas ou com input inválido nunca executam.

### 5.2 Protocolo normalizado

```ts
type AssistantEvent =
  | { type: "run-start"; runId: string }
  | { type: "message-start"; messageId: string; role: "assistant" }
  | { type: "part-start"; messageId: string; part: MessagePart }
  | { type: "text-delta"; messageId: string; partId: string; delta: string }
  | { type: "message-end"; messageId: string; finishReason?: string }
  | {
      type: "tool-call";
      toolCallId: string;
      name: string;
      input?: unknown;
      access?: ActionAccess;
      description?: string;
      risk?: ActionRisk;
      messageId?: string;
    }
  | {
      type: "tool-result";
      toolCallId: string;
      name?: string;
      output?: unknown;
      status?: ToolCallStatus;
      isError?: boolean;
      error?: AssistantError;
      messageId?: string;
    }
  | { type: "error"; error: AssistantError }
  | { type: "run-end"; runId: string; status: "completed" | "cancelled" | "error" };
```

Regras:

- Eventos são normalizados e independentes de provider.
- Eventos desconhecidos devem ser ignorados de forma segura pelo reducer, preservando compatibilidade aditiva.
- O protocolo deve ter uma versão explícita (`protocolVersion`) na requisição.
- Texto incremental usa `text-delta`; o Core não precisa conhecer tokens ou payloads nativos.
- Ferramentas são representadas genericamente; o Runtime orquestra a execução apenas de handlers explicitamente fornecidos pelo consumidor. O Framework não fornece ferramentas de domínio.
- Nenhum evento contém credenciais ou payloads internos de provider.

- `messageId` identifica a mensagem; `partId` identifica uma parte textual dentro dela.
- `part-start` cria ou atualiza uma parte; `text-delta` atualiza a parte correspondente ao `partId`.
- Partes diferentes podem coexistir na mesma mensagem; IDs de parte duplicados usam comportamento upsert.
- Eventos desconhecidos são ignorados de forma segura.
- `error` encerra o run com status `error`.
- A ausência de `run-end` resulta em `invalid-response` no Runtime.
- Runs antigos não podem alterar o estado de uma execução nova.
- Cancelamento continua usando `AbortController`.
- O protocolo não impõe validações de ordem além do comportamento implementado pelo Runtime/Core.

### 5.3 Requisição

```ts
type AssistantRequest = {
  protocolVersion: string;
  messages: AssistantMessage[];
  context?: Record<string, unknown>;
};
```

O consumidor decide o que colocar em `context`: dados de domínio, preferências, ferramentas, identificadores etc. O Framework não define system prompt.

### 5.4 Transport

```ts
interface AssistantTransport {
  send(
    request: AssistantRequest,
    options?: { signal?: AbortSignal },
  ): AsyncIterable<AssistantEvent>;
}
```

Contrato:

- `send` pode lançar erro antes de produzir eventos.
- O iterável deve respeitar `signal` e parar de produzir eventos após abort.
- Erros de transporte devem ser convertidos em `AssistantError` quando possível.
- O transporte nunca altera estado do Runtime.
- O transporte não decide retry; políticas de retry pertencem ao Runtime.

### 5.5 Runtime

```ts
type AssistantSnapshot = {
  status: AssistantStatus;
  messages: readonly AssistantMessage[];
  activeRunId: string | null;
  error: AssistantError | null;
  pendingConfirmation: AssistantPendingConfirmation | null;
  context: Readonly<Record<string, unknown>>;
};

interface AssistantRuntime {
  getSnapshot(): AssistantSnapshot;
  subscribe(listener: () => void): () => void;
  send(input: string | { text: string; metadata?: Record<string, unknown> }): Promise<void>;
  cancel(): void;
  retry(): Promise<void>;
  reset(messages?: readonly AssistantMessage[]): void;
  confirm(approved: boolean): void;
  cancelAction(toolCallId: string): void;
  dispose(): void;
  setContext(
    context:
      | Record<string, unknown>
      | ((prev: Record<string, unknown>) => Record<string, unknown>),
  ): void;
  getContext(): Record<string, unknown>;
  clearContext(): void;
}
```

Contrato:

- `getSnapshot` retorna um snapshot imutável e estável entre mudanças.
- `subscribe` notifica apenas quando o snapshot muda.
- `send` é serializado: não deve iniciar duas execuções concorrentes na mesma sessão sem política explícita.
- `cancel` aborta a execução ativa e produz estado `idle`, sem apagar mensagens já recebidas.
- `retry` reexecuta a última requisição com falha sem duplicar a mensagem do usuário.
- `confirm` resolve a confirmação pendente de uma ferramenta de alto risco; o Runtime não executa a ferramenta.
- `setContext` atualiza o contexto dinâmico da sessão com sanitização de prototype pollution e dados não confiáveis; o contexto é mesclado nas requisições sem execução automática de código.
- Eventos de uma execução antiga não podem contaminar uma execução nova.
- `dispose` aborta, limpa listeners e impede novos envios.
- Após `dispose()`, `reset()`, `confirm()`, `cancelAction()`, `setContext()` e novos envios são ignorados; listeners são removidos e execuções pendentes são abortadas. `getSnapshot()` continua retornando o último snapshot congelado.
- O Runtime orquestra ferramentas explicitamente injetadas pelo consumidor: valida o input, executa ferramentas `read` após validação, exige confirmação explícita para ferramentas `write` ou de `risk: "high"`, respeita `AbortSignal` e registra resultados, falhas e cancelamentos. Ferramentas desconhecidas nunca são executadas.

### 5.6 UI

Uso de conveniência:

```tsx
<AssistantWidget
  transport={transport}
  suggestions={["Track my order", "Show my balance"]}
  onAction={handleAction}
/>
```

Composição manual, com um único Runtime compartilhado via Provider:

```tsx
<AssistantProvider runtime={runtime} defaultDisplayState="open">
  <AssistantLauncher />
  <AssistantPanel />
</AssistantProvider>
```

Uso com triggers contextuais e abertura programática:

```tsx
function ExternalAction() {
  const { open } = useAssistant();
  return (
    <button
      onClick={() =>
        open({
          context: { type: "order", id: "123" },
          initialMessage: "Qual o status do pedido?",
        })
      }
    >
      Ver pedido
    </button>
  );
}
```

Regras:

- `AssistantProvider` cria ou recebe um Runtime; a UI nunca chama `transport.send`.
- `useAssistant` expõe snapshot, intenções, estado de exibição (`open`, `close`, `toggle`, `minimize`, `restore`, `displayState`, `isOpen`, etc.) e contexto contextual (`context`, `setContext`, `clearContext`). `useAssistantChat` adiciona `suggestions` e `panelId` para compatibilidade total.
- `AssistantTrigger` é exportado publicamente para permitir aberturas contextuais declarativas com suporte a `asChild`.
- `AssistantWidget` aceita `ref` imperativo (`AssistantImperativeHandle`) expondo `open`, `close`, `toggle`, `setContext`, etc.
- `AssistantWidget`, `AssistantLauncher`, `AssistantPanel`, `AssistantTrigger`, `MessageList`, `AssistantMessage`, `AssistantComposer` e `AssistantSuggestions` são exportados publicamente.
- Estados de exibição: `"closed"`, `"launcher"`, `"open"` e `"minimized"`. `close()` volta ao launcher; `minimize()` mantém o painel minimizado; `open()`/`restore()` reabrem.
- Slots: `launcher`, `header`, `empty`, `typing`, `footer`, `message` e `messageActions`. Classes customizadas são mescladas por `classNames`.
- A UI aceita `placement` (`floating`, `inline`, `docked`) e `position` (`bottom-right`, `bottom-left`, `top-right`, `top-left`, `right`, `left`, `bottom`).
- Acessibilidade: região `role="log"` com `aria-live`, status oculto para leitura, foco no composer ao abrir, retorno de foco ao launcher ao fechar, `Escape` fecha e confirmação de ferramenta expõe ações nomeadas.
- Markdown é renderizado como React, sem HTML bruto; links perigosos são rebaixados a texto.
- Nenhum HTML de LLM deve ser renderizado como HTML bruto por padrão.

### 5.7 Contextual Triggers e Abertura Programática

A abertura do assistente não depende exclusivamente do botão flutuante (`AssistantLauncher`). Elementos externos da aplicação consumidora (botões, links, cards, ícones) podem controlar o assistente e transmitir contexto de negócio agnóstico.

Contratos:
- `AssistantOpenOptions`: `{ context?: Record<string, unknown>; initialMessage?: AssistantInput; autoSend?: boolean }`.
- `useAssistant()`: retorna `open(options?)`, `close()`, `toggle(options?)`, `minimize()`, `restore()`, `displayState`, `context`, `setContext`, `clearContext`, além dos métodos e snapshot do Runtime.
- `<AssistantTrigger>`: componente declarativo com suporte a `asChild` para acionar a abertura a partir de qualquer elemento da UI cliente.
- `AssistantImperativeHandle`: handle imperativo opcional recebido via `ref` em `<AssistantWidget ref={ref} />`.

Garantias de isolamento e segurança:
- `sanitizeTriggerContext` neutraliza prototype pollution (`__proto__`, `constructor`, `prototype`) e remove funções recebidas de dados não confiáveis.
- Aberturas contextuais com `context` não executam ações ou requisições ao transporte automaticamente. O contexto é armazenado no Runtime e mesclado nas próximas requisições.
- Quando `initialMessage` é fornecida com `autoSend !== false`, a mensagem é despachada via `runtime.send()`. Caso o assistente responda sugerindo ações de escrita (`access: "write"`), o fluxo de confirmação (`ActionConfirmation`) continua estritamente exigindo aprovação manual do usuário.
- O Core permanece agnóstico de domínio e nunca assume entidades de carteiras, blockchains ou regras de negócio do consumidor.

## 6. Estratégia de exports

### 6.1 Superfície pública

| Subpath | Conteúdo | Ambiente | Status |
| --- | --- | --- | --- |
| `@artxds/widget-kit/assistant` | UI React: Widget, Provider, painel, lista, composer, sugestões, hooks | Client | Implementado |
| `@artxds/widget-kit/assistant/core` | Core + Runtime headless | Browser, Node, edge | Implementado |
| `@artxds/widget-kit/assistant/transport` | `MockTransport`, `HttpTransport`, tipos de transporte | Browser, Node | Implementado |
| `@artxds/widget-kit/styles/assistant.css` | Estilos opcionais | CSS | Implementado |
| `@artxds/widget-kit/assistant/server` | Adapters server-only | Node | Reservado; não publicar até existir código real |

Decisões:

- O root `@artxds/widget-kit` **não** exporta Assistant nesta fase. A API canônica é o subpath `/assistant`.
- Core, Runtime e Transport nunca são reexportados pelo root.
- O subpath `/assistant/core` reúne Core e Runtime porque ambos são headless e consumidos juntos. Internamente continuam em diretórios separados.
- Implementações de transporte ficam em `/assistant/transport` para não contaminar o Core com I/O.
- O subpath `/assistant/server` fica reservado. Não criar um entry vazio apenas para ocupar o nome.
- Novos transportes ou integrações devem ser aditivos: preferir um novo named export no subpath de transporte ou um novo subpath explícito, nunca alterar o contrato existente.

### 6.2 Matriz de build

| Entry público | Fonte | Entry Vite | Saída | Tipos esperados |
| --- | --- | --- | --- | --- |
| `/assistant` | `packages/widgets/assistant/src/index.ts` | `assistant` | `dist/assistant.js` | `dist/types/widgets/assistant/src/index.d.ts` |
| `/assistant/core` | `packages/widgets/assistant/src/core/index.ts` | `assistant-core` | `dist/assistant-core.js` | `dist/types/widgets/assistant/src/core/index.d.ts` |
| `/assistant/transport` | `packages/widgets/assistant/src/transport/index.ts` | `assistant-transport` | `dist/assistant-transport.js` | `dist/types/widgets/assistant/src/transport/index.d.ts` |
| `/assistant/server` | `packages/widgets/assistant/src/server/index.ts` | `assistant-server` | `dist/assistant-server.js` | Reservado |

Regras de implementação dos exports:

1. Adicionar apenas a entrada React (`assistant`) ao `clientEntries` do Vite.
2. Core, Runtime e Transport não recebem `"use client"`.
3. Manter `types` como primeira condição em cada subpath.
4. Manter os subpaths existentes de Badge, Toast, Mascot, core e styles intactos.
5. Não usar wildcard em `exports`; cada subpath é explícito.
6. Não alterar `main`, `module` ou `types` do root.
7. Se o playground importar os subpaths pelo nome do pacote, adicionar aliases correspondentes em `tsconfig.json`; caso contrário, usar `@/widgets/assistant/...`.
8. Validar o pacote com `npm pack` em um consumidor temporário, porque os aliases locais apontam para o código-fonte e não exercitam o `dist` publicado.

### 6.3 Estilos

- `packages/styles/assistant.css` usa classes BEM prefixadas por `wk-assistant` (por exemplo, `wk-assistant__panel`).
- Reutilizar tokens `--wk-*` e criar tokens específicos `--wk-assistant-*` quando necessário.
- Não depender de Tailwind no CSS publicado.
- Exportar o CSS individualmente e adicioná-lo a `packages/styles/index.css` se a conveniência de um bundle único for desejada.
- Não inserir CSS do Assistant em `components.css`; esse arquivo é de Badge/Toast.

## 7. Compatibilidade com a arquitetura atual

| Área atual | Como o Assistant se encaixa |
| --- | --- |
| Pacote único ESM | Mantido. Assistant é um subpath, não um novo pacote. |
| Widgets em `packages/widgets` | Assistant fica em `packages/widgets/assistant`, coberto por `tsconfig.lib.json` e coverage. |
| Dashboard em `packages/components/dashboard` | Playground do Assistant fica lá e continua fora do build da biblioteca. |
| Catálogo em `packages/lib/catalog.ts` | Assistant será registrado como widget para aparecer em sidebar, busca, widgets page e quality. |
| Entradas React com `"use client"` | A entrada `/assistant` será adicionada ao `clientEntries`; core/transport não. |
| CSS fonte em `packages/styles` | Assistant terá arquivo próprio, publicado junto com os demais. |
| `packages/core.ts` | Não será reutilizado como core genérico; é o core específico do Mascot. |
| `packages/index.ts` | Não será alterado nesta fase; Assistant não entra no root. |
| Testes em `packages/**` e `tests/**` | Testes do Assistant ficam em `packages/widgets/assistant/tests` e são cobertos pelo include atual. |
| Quality API | O caminho de testes do widget será registrado em `catalog.ts` para execução individual. |
| Aliases locais | O app importa fonte, não `dist`; por isso o smoke test do tarball é obrigatório. |
| Mascot | Integração opcional, sem dependência no Core. |

### Integração com o Mascot

O Mascot não faz parte do Core do Assistant. A integração deve ser por composição:

- `MascotAvatar` pode ser usado como avatar de mensagens.
- `MascotInstance` pode ser recebida via `onReady` e usada por um adapter opcional para mapear estados do Assistant em `setMood`, `emit` ou `say`.
- O mood `thinking` não existe em `DEFAULT_MOODS`; o adapter deve fornecer um mood customizado ou usar `loading`.
- `MascotAvatar` cai para `idle` em moods desconhecidos; não assumir que um mood novo aparecerá automaticamente no avatar.
- Não usar `MascotProvider` como fonte de estado do chat: ele mantém apenas `lastSpeech`, achata conteúdo estruturado e registra `console.log` em código de biblioteca.
- O adapter do Mascot deve ficar em `integrations/` e importar o Mascot apenas como tipo ou composição opcional.

## 8. Estratégia de MockTransport e HttpTransport

### 8.1 Contrato comum

Ambos implementam a mesma interface:

```ts
interface AssistantTransport {
  send(request: AssistantRequest, options?: { signal?: AbortSignal }): AsyncIterable<AssistantEvent>;
}
```

O Runtime não sabe qual implementação está usando.

### 8.2 MockTransport

Objetivo: permitir desenvolvimento, playground e testes sem rede.

Configuração conceitual:

```ts
type MockTransportOptions = {
  script?:
    | AssistantEvent[]
    | ((request: AssistantRequest) => AssistantEvent[] | AsyncIterable<AssistantEvent>);
  delayMs?: number | ((event: AssistantEvent) => number);
  error?: AssistantError;
  chunkSize?: number;
};
```

Comportamento:

- Produz eventos determinísticos.
- Pode simular `text-delta` em chunks configuráveis.
- Pode simular erro, cancelamento e stream vazio.
- Respeita `AbortSignal` entre eventos.
- Não usa `fetch`, não acessa rede e não deixa timers pendentes.
- Deve ser utilizável no playground sem chamar LLM real.
- Deve ser exportado por `/assistant/transport` para consumidores testarem suas integrações.

Casos de teste obrigatórios:

- resposta sem streaming;
- resposta em múltiplos chunks;
- erro antes do primeiro evento;
- erro no meio do stream;
- abort solicitado pelo consumidor;
- evento desconhecido ignorado sem quebrar o estado.

### 8.3 HttpTransport

Objetivo: conversar com um endpoint fornecido pela aplicação consumidora. A biblioteca não define backend nem provider.

Configuração conceitual:

```ts
type HttpTransportOptions = {
  endpoint: string;
  fetch?: typeof fetch;
  headers?: HeadersInit | (() => HeadersInit | Promise<HeadersInit>);
  credentials?: RequestCredentials;
  timeoutMs?: number;
  accept?: "application/json" | "application/x-ndjson" | "text/event-stream";
};
```

Comportamento:

- `POST` no `endpoint` com `Content-Type: application/json`.
- Corpo contém `protocolVersion`, `messages` e `context`.
- Resposta esperada: eventos normalizados, em JSON único, NDJSON ou SSE, conforme `accept`.
- A implementação atual suporta JSON único, NDJSON e SSE.
- Formatos realmente aceitos:
  - JSON: um evento único, um array de eventos ou um objeto `{ events }`.
  - NDJSON: uma ou várias linhas JSON, incluindo linhas que contêm arrays.
  - SSE: frames `data:`, comentários iniciados por `:`, payload `[DONE]` e frames fragmentados entre chunks.
- `AbortSignal` é repassado e combinado com timeout interno.
- `credentials` e headers são configurados pelo consumidor; a biblioteca não gerencia tokens nem segredos.
- Erros HTTP, rede, timeout, abort e formato inválido são convertidos em `AssistantError`.
- Retry e backoff não pertencem ao transporte; pertencem ao Runtime ou à configuração do consumidor.
- Deve ser testado com MSW nos testes de transporte.
- Deve ser browser-safe; nenhuma API Node é usada nessa implementação.
- Requer ambiente com `fetch`, `Headers`, `ReadableStream` e `TextDecoder` (Node.js 18+ ou browser moderno).

Exemplo de uso pelo consumidor:

```tsx
const transport = new HttpTransport({ endpoint: "/api/assistant" });

<AssistantProvider transport={transport}>
  <AssistantPanel />
</AssistantProvider>
```

O endpoint `/api/assistant` pertence ao consumidor. Ele pode chamar qualquer provider, aplicar autenticação, montar system prompt e traduzir o stream do provider para o protocolo normalizado.

## 9. Preparação para futuras integrações com LLM

A arquitetura deve permitir adicionar LLMs sem alterar UI, Core, Runtime ou o contrato de transporte.

### 9.1 Protocolo primeiro

- O protocolo normalizado é a fronteira estável.
- O client conhece apenas `AssistantEvent`, nunca payloads de OpenAI/Anthropic/etc.
- O servidor do consumidor traduz eventos nativos para o protocolo.
- O protocolo deve ter versão e evolução aditiva.

### 9.2 Provider no server

- SDKs de provider ficam no server do consumidor ou em um futuro adapter do subpath `/assistant/server`.
- Credenciais nunca entram no browser, no Core ou no Transport client.
- O client chama um endpoint do próprio consumidor.

### 9.3 Ferramentas e contexto

- Ferramentas são representadas genericamente (`tool-call`/`tool-result`).
- Ferramentas `read` podem executar automaticamente após validação; ferramentas `write` e de `risk: "high"` exigem confirmação explícita.
- O Framework não fornece ferramentas de domínio, credenciais ou integrações de provider; o Runtime orquestra apenas handlers explicitamente injetados pelo consumidor. Políticas de segurança e execução sensível pertencem ao consumidor e devem permanecer em ambientes seguros no servidor.
- O consumidor fornece contexto, tools, permissões e renderização.
- Tool calling e anexos devem ser adicionados como eventos/tipos opcionais, sem quebrar consumidores que só usam texto.

### 9.4 Persistência e sessão

- Persistência não faz parte desta fase.
- Quando necessária, deve ser um adapter do consumidor ou uma integração server separada.
- O Core não deve depender de localStorage, banco ou cookies.

### 9.5 Evolução do protocolo

- Adicionar novos eventos antes de adicionar novos campos obrigatórios.
- Campos novos devem ser opcionais.
- Consumidores devem ignorar eventos desconhecidos.
- Mudanças incompatíveis exigem nova versão de protocolo e decisão explícita de breaking change.

## 10. Separação entre biblioteca genérica e aplicações consumidoras

| A biblioteca fornece | O consumidor fornece |
| --- | --- |
| Componentes de UI genéricos | Layout, tema específico, copy e identidade |
| Core, reducer e protocolo | System prompt, definições e handlers de ferramentas e regras de negócio |
| Runtime headless | Endpoint, autenticação e autorização |
| MockTransport | Dados de teste e fixtures de domínio |
| HttpTransport | Rota server que fala com o provider |
| Contratos de eventos | Tradução do provider para o protocolo |
| Slots de renderização | Renderizadores de domínio, avatares e ações |
| Testes de contrato | Persistência, analytics e observabilidade |
| Documentação arquitetural | Configuração do Mascot e integração visual |

### Exemplo: Wallet Hub

O Wallet Hub deve conseguir:

- importar `AssistantProvider`, `AssistantPanel` e `useAssistant` de `@artxds/widget-kit/assistant`;
- importar `HttpTransport` de `@artxds/widget-kit/assistant/transport`;
- apontar o transporte para uma rota própria, por exemplo `/api/wallet-assistant`;
- injetar prompt, ferramentas, contexto Solana e dados de carteira apenas na aplicação;
- usar `MascotAvatar` ou uma instância do Mascot como presença, sem que a biblioteca conheça Solana;
- testar a UI com `MockTransport`, sem rede.

Nenhum conceito de Solana, carteira, transação ou domínio financeiro deve entrar em `packages/widgets/assistant/`.

## 11. Critérios de qualidade e testes

### 11.1 Guardas de arquitetura

- Core não importa React, DOM, rede, Mascot ou providers.
- Runtime não importa React, DOM ou `fetch`.
- Transport não importa React, Runtime ou UI.
- UI não importa server, SDK de provider ou transporte concreto.
- Server futuro não importa React ou UI.
- Nenhum segredo, token ou credencial em código client.
- Nenhum HTML de LLM renderizado sem sanitização explícita do consumidor.
- O Runtime executa apenas ferramentas explicitamente injetadas; ferramentas desconhecidas ou com input inválido não executam e falhas/cancelamentos são registrados no histórico.

### 11.2 Testes unitários

**Core**

- transições de estado para cada evento;
- mensagens incrementais;
- eventos desconhecidos;
- erro e recuperação;
- snapshots imutáveis;
- consistência de IDs e ordenação.

**Runtime**

- envio e consumo de stream;
- cancelamento;
- erro de transporte;
- descarte de eventos de runs antigos;
- `dispose` e limpeza de listeners;
- não vazamento de timers;
- compatibilidade com `getSnapshot`/`subscribe`.

**Transport**

- `MockTransport` determinístico;
- `HttpTransport` com MSW para sucesso, erro HTTP, erro de rede, timeout, abort e stream inválido;
- parsing de JSON/NDJSON/SSE quando implementado;
- respeito ao `AbortSignal`.

**React**

- renderização do launcher, painel, estados vazio/minimizado e slots;
- envio de mensagem por texto e por sugestão;
- streaming incremental e Markdown seguro;
- erro e retry;
- confirmação de ferramenta de alto risco;
- `onAction` para botões de mensagem;
- estado de exibição controlado e não controlado;
- teclado, foco, labels, `Escape` e `aria-live`;
- scroll inteligente;
- SSR sem APIs de browser;
- integração opcional com Mascot (futuro).

### 11.3 Testes de fronteira e empacotamento

- Importar `core`, `runtime` e `transport` em ambiente Node sem tocar `window`.
- Garantir que a UI seja client-only.
- Executar `npm run lib:typecheck`.
- Executar `npm run lib:build`.
- Verificar `dist/assistant.js`, `dist/assistant-core.js`, `dist/assistant-transport.js` e as declarações correspondentes.
- Verificar que `"use client"` aparece apenas nos entries client.
- Executar `npm pack` e importar o tarball em um consumidor temporário, incluindo `@artxds/widget-kit/styles/assistant.css`, SSR e o export map completo.
- Verificar o export map publicado, não apenas os aliases locais.

Validação atual: 137 testes passando (1 falha pré-existente não relacionada ao Assistant), `typecheck`, `lib:typecheck`, `lint`, `lib:build` e smoke test do tarball verificados.

### 11.4 Ambiente de testes

O Vitest usa `environment: "jsdom"` e um setup global condicional: `cleanup` e `window.localStorage.clear()` só rodam quando `document`/`window` existem. Com isso, testes de Core, Runtime e Transport podem usar `// @vitest-environment node` sem carregar DOM.

### 11.5 Metas iniciais

- Cobertura alta de Core e Runtime, com foco em branches de erro/cancelamento.
- Nenhum teste de UI dependente de rede.
- Nenhum teste dependente de provider real.
- Sem `any` nos contratos públicos.
- Sem imports proibidos nas camadas.
- Sem regressão nos exports existentes.

As metas de cobertura são critério de qualidade do projeto; não há threshold configurado nesta fase.

## 12. Decisões e pontos em aberto

Decisões já tomadas:

- uma única biblioteca, sem monorepo;
- Assistant como widget em `packages/widgets/assistant`;
- Core puro, Runtime headless, Transport injetável e UI React fina;
- `/assistant/core` como entrada headless;
- `/assistant/transport` para Mock/Http;
- `/assistant/server` reservado, sem implementação agora;
- root sem Assistant nesta fase;
- Mascot como integração opcional;
- nenhum SDK de LLM no client;
- `HttpTransport` aceita JSON, NDJSON e SSE, com SSE como padrão;
- tool calls usam `tool-call`/`tool-result` no protocolo e partes estruturadas nas mensagens, com risco opcional;
- o Runtime oferece retry manual, sem backoff automático;
- a UI usa `useSyncExternalStore`, um único Runtime por Provider e estado de exibição controlável;
- Markdown usa parser React próprio, sem HTML bruto e com allowlist de links;
- triggers contextuais e abertura programática suportados via `useAssistant()`, `<AssistantTrigger>` e ref imperativo em `AssistantWidget`, com sanitização estrita de prototype pollution e dados agnósticos de domínio;
- estilos são opcionais, publicados em `@artxds/widget-kit/styles/assistant.css`.

Pontos em aberto:

- suporte a anexos e conteúdo multimodal;
- persistência de sessão;
- adapter opcional do Mascot;
- versionamento e compatibilidade do protocolo;
- futura entrada server, seu runtime de execução e adapter opcional do Mascot.

## 13. Playground e catálogo (Widget Kit Studio)

O Assistant está registrado no catálogo de widgets (`packages/lib/catalog.ts`) com slug `assistant` e possui um playground interativo em `packages/components/dashboard/experimental/assistant-playground/`, acessível via `/playground?item=assistant&mode=playground`.

O playground demonstra:

- `AssistantWidget` com `MockTransport` (sem rede);
- estados de exibição (`launcher`, `open`, `minimized`, `closed`);
- `placement` (`floating`, `inline`, `docked`) e `position`;
- tema (`light`, `dark`, system);
- sugestões e envio de mensagem;
- confirmação de ação de escrita (`write`) com aprovação/rejeição;
- cancelamento de confirmação e de ação em execução;
- resultado da ferramenta retornado ao histórico.

O `WidgetKitStudio` reconhece o item `assistant` e renderiza o stage e os controles do playground, sem alterar o comportamento dos itens já existentes (`mascot`, `toast`, `badge`).

Decisões:

- O root do pacote (`@artxds/widget-kit`) continua sem exportar Assistant, respeitando a regra de subpath explícito.
- O dashboard importa o Assistant via caminho relativo `@/widgets/assistant/src`, pois o subpath público `/assistant` é exclusivo do build da biblioteca.
- O playground usa `MockTransport` e ferramentas simuladas locais; nenhum endpoint real é chamado.
- O status do widget no catálogo é `"Ready"` pois o core de ferramentas e confirmação foi validado na etapa anterior.

## 14. Referências da arquitetura atual

- `package.json` — exports, scripts e dependências.
- `vite.lib.config.ts` — entries, externals e banner `"use client"`.
- `tsconfig.lib.json` — include/exclude e geração de declarações.
- `tsconfig.json` — aliases locais do app.
- `packages/index.ts` — barrel raiz.
- `packages/core.ts` — core atual do Mascot.
- `packages/components/ui/index.ts` — barrel de UI.
- `packages/widgets/mascot/src/index.ts` — superfície pública do Mascot.
- `packages/lib/catalog.ts` — catálogo de componentes e widgets.
- `packages/styles/index.css` — agregação de estilos.
- `packages/components/dashboard/studio/studio-page.tsx` — playground atual.
- `packages/components/dashboard/pages/index.tsx` — páginas e previews do dashboard.
- `app/api/quality/route.ts` — execução individual de testes por item.
- `tests/setup.ts` e `vitest.config.ts` — configuração de testes.
