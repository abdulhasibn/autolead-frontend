# Workflow and release guardrails

The rules below are enforced, not just written down. Where a rule can be
skipped, the next layer still catches it.

## The rules

1. Every task starts on a **new branch cut from an up-to-date `dev`**, named
   `<type>/<kebab-slug>` (`feat/`, `fix/`, `chore/`, `docs/`, `refactor/`,
   `test/`, `perf/`, `ci/`, `hotfix/`).
2. Nobody commits on or pushes to `main` or `dev`. Changes land only
   through a **PR into `dev`**. Releases are a PR from `dev` into `main`.
   Hotfixes are `hotfix/*` branches cut from `main`, with a PR into `main`.
3. Once a PR is merged, **its branch is finished**: switch to `dev`, pull,
   and start the next task on a new branch. Branch names are never reused.

## Skills (`.claude/skills/`)

| Skill | When |
|---|---|
| `start-task` | Start of every task |
| `open-pr` | Work is done: checks, push, PR into `dev` |
| `after-merge` | PR merged: back to `dev`, pull, delete the branch |

## Enforcement layers

| Layer | Where | Applies to | Can it be skipped? |
|---|---|---|---|
| GitHub ruleset on `main`/`dev` | GitHub settings | Everyone, admins included | No |
| `branch-guard` required check | `.github/workflows/branch-guard.yml` | Every PR | No |
| Claude Code hooks | `.claude/settings.json` → `scripts/guard/guard.mjs` | Claude agents | No (changing them needs approval) |
| Husky git hooks | `.husky/pre-commit`, `pre-merge-commit`, `pre-push` | Local `git` | Yes, with `--no-verify`, but GitHub still rejects it |

### What the ruleset does

- Changes to `main`/`dev` only through a PR, and the `branch-guard` check must pass.
- No force pushes and no deleting `main`/`dev`.
- Merged branches are deleted from GitHub automatically.

### What `branch-guard` checks

- The branch name follows the pattern.
- The PR targets `dev`, or targets `main` only from `dev` or `hotfix/*`.
- The branch name was never used by an earlier merged PR.

### What the Claude hook blocks

- Commits on `main`/`dev`, or on a branch whose PR is merged.
- Pushes to `main`/`dev`, force pushes, `--no-verify`, `HUSKY=0`, and
  changing `core.hooksPath`.
- Non-fast-forward `git pull`, merges and rebases on `main`/`dev`.
- Creating a branch with a bad or reused name, or checking out a merged
  branch.
- It **asks the user** before:
  - `gh pr merge`;
  - edits to the guardrail files themselves.
- Agents may not change rulesets, branch protection or environments through
  `gh api`.

## Not covered (yet)

- Cursor agents: only the husky and GitHub layers apply to them.
- There's no CI build/test workflow yet. Only `branch-guard` runs on PRs.
