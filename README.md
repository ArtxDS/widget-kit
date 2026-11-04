

A personal collection of reusable React components, widgets, and design tokens, built to accelerate development.

A space to build, experiment, test, and organize reusable UI solutions.

## Installation

Add `widget-kit` to your project and import the components you need.

## Quick Start

```tsx
import { Badge } from "widget-kit";

export function Status() {
  return <Badge tone="purple" dot>Online</Badge>;
}
```

## Architecture

- **`packages/`** — Reusable components, widgets, hooks, and utilities.
- **`app/`** — Dashboard, component showcase, and playground.

## Supabase quality history

The dashboard stores test runs and component test results in Supabase Postgres
through Prisma. Copy `.env.example` to `.env.local` and replace the placeholders
with the database URLs from your Supabase project. Use the transaction pooler
URL for `DATABASE_URL` and the direct connection or session pooler URL for
`DIRECT_URL`.

Run `npm run db:migrate` in development to create/update the tables, or
`npm run db:deploy` to apply committed migrations in a deployment. The Home
charts and Recent Activity use the saved quality history returned by
`/api/quality`.

---

