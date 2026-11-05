# widget-kit

A personal collection of reusable React components, widgets, and design tokens,
built to accelerate development. A space to build, experiment, test, and
organize reusable UI solutions.

**Stack:** Next.js · React · TypeScript · Prisma + Supabase · Vitest

## Quick Start

```tsx
import { Badge } from "widget-kit";

export function Status() {
  return <Badge tone="purple" dot>Online</Badge>;
}
```

## Development

```bash
npm install
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

