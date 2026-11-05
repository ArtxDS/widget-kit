# widget-kit

A personal collection of reusable React components, widgets, and design tokens,
built to accelerate development. A space to build, experiment, test, and
organize reusable UI solutions.

**Stack:** Next.js · React · TypeScript · Prisma + Supabase · Vitest

## Install

```bash
npm install @artxds/widget-kit
```

The package is **ESM-only** and requires React 18 or newer. There is no CommonJS build.

## Usage

```tsx
import { Badge } from "@artxds/widget-kit";
import "@artxds/widget-kit/styles";

export function Status() {
  return (
    <Badge tone="purple" dot>
      Online
    </Badge>
  );
}
```

## Entrypoints

| Import | Contents |
| --- | --- |
| `@artxds/widget-kit` | React components and widgets |
| `@artxds/widget-kit/components` | `Badge` and `Toast` |
| `@artxds/widget-kit/core` | Framework-agnostic mascot core, safe to import on the server |
| `@artxds/widget-kit/styles` | All component, token, and mascot CSS |
| `@artxds/widget-kit/styles/tokens.css` | Design tokens only |
| `@artxds/widget-kit/styles/components.css` | Badge and Toast CSS only |
| `@artxds/widget-kit/styles/mascot.css` | Mascot CSS only |

The React entrypoints ship the `"use client"` directive. In the Next.js App Router they can be imported from Server Components; wrap the usage in your own client component when passing callbacks such as `onClose` or `onReady`. Import `@artxds/widget-kit/core` for server-safe core utilities.

## Development

```bash
npm install
npm run db:generate          # generate the Prisma client for the dashboard
cp .env.example .env.local   # fill in the database URLs (see below)
npm run dev                  # dashboard at http://localhost:3000
npm test                     # run the test suite
```

## Architecture

- **`packages/`**: components, widgets, hooks, and utilities.
- **`app/`**: dashboard, component showcase, and playground.
- **`tests/`**: shared setup, fixtures, MSW mocks, and per-page dashboard tests.

## Quality history

The dashboard saves test runs and per-component results in Supabase Postgres
through Prisma, and shows them on the Home charts via `/api/quality`.
Set `DATABASE_URL` (transaction pooler) and `DIRECT_URL` (direct or session
pooler) in `.env.local`, then run `npm run db:migrate` in development or
`npm run db:deploy` in a deployment.

