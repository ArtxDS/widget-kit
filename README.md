# @artxds/widget-kit

Biblioteca pessoal de componentes React, widgets, hooks e utilitários reutilizáveis, acompanhada por um dashboard/showcase Next.js para experimentação, visualização e acompanhamento de qualidade.

**Build once. Reuse everywhere.**

---

## 1. Visão Geral da Arquitetura

O projeto divide-se em duas camadas estritamente isoladas:

- **Biblioteca reutilizável (`packages/`)**: código-fonte agnóstico de componentes, estilos, tokens e tipos distribuíveis via pacote npm `@artxds/widget-kit`.
- **Dashboard / Showcase (`app/` e `packages/components/dashboard/`)**: aplicação Next.js para experimentação visual, catálogo, playground e relatórios de testes. O dashboard consome a biblioteca através de seus exports públicos e **nunca** é incluído no pacote distribuído.

```text
widget-kit/
├── app/                           # Aplicação Next.js (Dashboard & Showcase)
│   ├── api/                       # Rotas da API interna do dashboard
│   ├── components/                # Páginas do catálogo
│   ├── docs/                      # Documentação interna
│   ├── notes/                     # Bloco de notas do workspace
│   ├── playground/                # Playground de testes de propriedades
│   ├── tests/                     # Painel de execução e métricas de testes
│   ├── widgets/                   # Showcase de widgets
│   ├── globals.css                # Estilos globais da aplicação
│   └── layout.tsx                 # Shell do dashboard
│
├── packages/                      # Core da Biblioteca Reutilizável
│   ├── components/
│   │   ├── ui/                    # Componentes públicos (Badge, etc.)
│   │   │   ├── badge.tsx
│   │   │   ├── badge.test.tsx
│   │   │   └── index.ts
│   │   └── dashboard/             # Componentes EXCLUSIVOS do dashboard (não exportados)
│   ├── lib/                       # Utilitários e helpers
│   │   ├── catalog.ts
│   │   ├── quality.ts
│   │   └── tailwind.ts
│   ├── styles/                    # Tokens e estilos CSS distribuíveis
│   │   ├── tokens.css             # Variáveis de design tokens (--wk-*)
│   │   ├── components.css         # Classes utilitárias dos componentes
│   │   └── index.css              # Ponto de entrada de estilos
│   ├── types/                     # Tipos TypeScript públicos
│   │   └── index.ts
│   ├── test/                      # Setup e testes de integração
│   │   ├── setup.ts
│   │   └── dashboard.test.tsx
│   └── index.ts                   # Ponto de entrada público da biblioteca (@artxds/widget-kit)
│
├── dist/                          # Artefatos compilados da biblioteca (gerados por lib:build)
├── public/                        # Assets estáticos exclusivos do dashboard
├── tsconfig.json                  # TypeScript do workspace (com paths para @artxds/widget-kit)
├── tsconfig.lib.json              # TypeScript dedicado para emitir declarações (.d.ts)
├── vite.lib.config.ts             # Configuração Vite para build ESM da biblioteca
├── vitest.config.ts               # Configuração Vitest para testes unitários e cobertura
└── next.config.ts                 # Configuração Next.js (transpilePackages, Turbopack)
```

---

## 2. Consumo em Projetos Externos

### Instalação

```bash
npm install @artxds/widget-kit
```

### Importando Componentes

Importação centralizada (ponto de entrada raiz):

```tsx
import { Badge } from "@artxds/widget-kit";

export function StatusIndicator() {
  return (
    <Badge tone="purple" dot>
      Online
    </Badge>
  );
}
```

Importação por subpath específico:

```tsx
import { Badge, type BadgeTone } from "@artxds/widget-kit/components";
```

### Importando Estilos

Para que os estilos e variáveis de cores/tokens funcionem sem depender do Tailwind da aplicação consumidora:

```tsx
// No layout raiz ou ponto de entrada da sua aplicação
import "@artxds/widget-kit/styles";

// Ou importar arquivos individuais se preferir:
import "@artxds/widget-kit/styles/tokens.css";
import "@artxds/widget-kit/styles/components.css";
```

---

## 3. Isolamento Arquitetural

Regras de isolamento automatizadas via ESLint (`no-restricted-imports`):

1. **Biblioteca independente**: nenhum arquivo em `packages/components/ui/`, `packages/widgets/`, `packages/lib/` ou `packages/types/` pode importar de `app/` ou de `packages/components/dashboard/`.
2. **Dashboard consumidor**: o dashboard importa os componentes da biblioteca via `@artxds/widget-kit`.
3. **Peer Dependencies**: `react` e `react-dom` são configurados como `peerDependencies` no `package.json` para evitar instâncias duplicadas do React em aplicações consumidoras.

---

## 4. Scripts e Comandos

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o dashboard Next.js localmente em modo desenvolvimento |
| `npm run build` | Gera a compilação de produção do dashboard Next.js |
| `npm run lib:build` | Compila a biblioteca para distribuição ESM e gera tipos TypeScript (`dist/`) |
| `npm run lib:build:watch` | Compila a biblioteca continuamente em modo watch |
| `npm run lib:typecheck` | Validação de tipos TypeScript restrita à biblioteca (`tsconfig.lib.json`) |
| `npm run typecheck` | Validação de tipos completa do workspace |
| `npm test` | Executa a suíte de testes com Vitest |
| `npm run test:watch` | Executa testes em modo interativo/watch |
| `npm run test:coverage` | Executa os testes e gera relatório de cobertura v8 para `packages/` |
| `npm run lint` | Executa o ESLint verificando regras de código e isolamento arquitetural |
