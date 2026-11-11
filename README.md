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
| `@artxds/widget-kit/components` | `Badge`, `Toast`, `ToastProvider`, and `useToast` |
| `@artxds/widget-kit/core` | Framework-agnostic mascot core, safe to import on the server |
| `@artxds/widget-kit/assistant` | Modular conversational assistant React widget, launcher, panel, triggers, and hooks |
| `@artxds/widget-kit/assistant/core` | Assistant headless core and runtime, safe to import on the server/Node |
| `@artxds/widget-kit/assistant/transport` | Assistant HTTP and Mock transport implementations |
| `@artxds/widget-kit/styles` | All component, token, and mascot CSS |
| `@artxds/widget-kit/styles/tokens.css` | Design tokens only |
| `@artxds/widget-kit/styles/components.css` | Badge and Toast CSS only |
| `@artxds/widget-kit/styles/mascot.css` | Mascot CSS only |
| `@artxds/widget-kit/styles/assistant.css` | Assistant widget CSS only |

The React entrypoints ship the `"use client"` directive. In the Next.js App Router they can be imported from Server Components; wrap the usage in your own client component when passing callbacks such as `onClose` or `onReady`. Import `@artxds/widget-kit/core` for server-safe core utilities.


## Toasts

Wrap your app in `ToastProvider` and trigger notifications with `useToast`:

```tsx
import { ToastProvider, useToast } from "@artxds/widget-kit";

export function App({ children }) {
  return <ToastProvider>{children}</ToastProvider>;
}

export function SaveButton() {
  const { success, loading, update, dismiss } = useToast();
  return (
    <button
      onClick={() => {
        const id = loading("Saving changes");
        window.setTimeout(() => update(id, { title: "Changes saved", variant: "success" }), 500);
      }}
    >
      Save
    </button>
  );
}
```

`useToast` exposes `toast`, `success`, `error`, `warning`, `info`, `loading`, `update`, `dismiss`, and `showToast`. Loading toasts are persistent by default; other variants dismiss automatically.

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

## Admin authentication

The public site never requires login. Only the provisioned owner can access
`/admin/*` after signing in with Google through Supabase Auth.

Add these values to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
ADMIN_USER_ID=<auth.users.id-uuid>
```

`ADMIN_USER_ID` is server-only and must never be prefixed with `NEXT_PUBLIC_`.
The owner ID is validated on the server on every admin request; no account is
promoted automatically and there is no user-management UI.

See [`docs/admin-auth.md`](docs/admin-auth.md) for the complete Supabase and
Google Cloud OAuth setup, redirect URLs, provisioning steps, and local tests.

