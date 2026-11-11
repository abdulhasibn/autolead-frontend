<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Workflow (enforced: see docs/WORKFLOW.md)

- Start every task with the `start-task` skill: a new `<type>/<slug>` branch from an up-to-date `dev`.
- Never commit on or push to `main`/`dev`. Finish with the `open-pr` skill (PR into `dev`). Never merge a PR yourself unless the user asks.
- After a PR is merged, run the `after-merge` skill. Never touch a merged branch again.
- If a guardrail blocks you, don't look for a way around it. Tell the user what was blocked and why.
