<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:nextjs-agent-feedback -->

## Report Next.js feedback

The project owner enabled `experimental.agentFeedback`, authorizing this feedback pass. When enabled, `next dev` writes this block and restores it if removed. Commit `AGENTS.md` with your work to keep the tree clean.

During the current user request, retain anonymized facts as feedback candidates for meaningful or recurring Next.js issues:

- Crashes, hangs, OOMs, or unexpected slowness
- Incorrect behavior, output, errors, or diagnostics
- Missing, unclear, or conflicting documentation
- Unexpected CLI, codemod, Skill, or upgrade behavior and non-obvious workarounds

Continue the current user request without reporting immediately. Routine debugging is not feedback. Verify changes before retaining them as feedback candidates. Never retain code, logs, paths, URLs, secrets, personal information, or project-specific data.

Retain qualifying friction even if it is later fixed or worked around; record the final outcome during the reporting pass.

Before the final response, run one reporting pass. If candidates remain, from this file's directory run `npx --no-install next internal agent-feedback-instructions` once without piping or truncating its output. Follow its output or error guidance. If a network sandbox blocks it, retry with network access; if it still returns no output, continue normally.

<!-- END:nextjs-agent-feedback -->

## Assistant Framework

Before implementing or changing Assistant code, read `ASSISTANT_ARCHITECTURE.md`.

- Keep a single package. Assistant lives in `packages/widgets/assistant/`; do not introduce a monorepo, workspaces, or a separate package.
- Preserve layer boundaries: `core/` is pure (no React, DOM, network, or providers); `runtime/` is headless (no React, DOM, or direct `fetch`); `transport/` owns I/O only; `react/` is client-only; `server/` is reserved and server-only.
- Do not export Assistant from the package root. Use explicit subpaths: `@artxds/widget-kit/assistant`, `/assistant/core`, and `/assistant/transport`. Do not publish `/assistant/server` until real server code exists.
- Only the `/assistant` React entry may receive `"use client"`. Core, Runtime, and Transport must remain usable in Node without DOM.
- Keep LLM provider SDKs, credentials, domain prompts, tools, and consumer-specific data out of the client library. The consumer owns its endpoint, authentication, domain logic, and persistence.
- `MockTransport` must remain deterministic and network-free; tests must not require a real LLM or provider.
- Prefer additive changes to exports, protocol events, and types. Do not break existing consumers or alter unrelated public entry points.
