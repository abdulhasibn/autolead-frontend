---
name: open-pr
description: >-
  Push the current task branch and open a pull request into dev, after the
  local checks pass. Use when the work on a task is done, or when the user
  says "ship it", "open a PR", "push this" or similar. This is the only way
  changes leave this machine.
---

# Open PR

## Steps

1. **Right branch.** `git branch --show-current` must not be `main` or `dev`,
   and must match `<type>/<kebab-slug>`. Check that
   `gh pr list --head <branch> --state merged` is empty. If the branch was
   already merged, stop: the work belongs on a new branch (`start-task`).

2. **Commit.** Commit everything that belongs to the task, as conventional
   commits (`type(scope): subject`, max 72
   characters, imperative). Never use `--no-verify`.

3. **Checks.** Run them and fix any failures before pushing:

   ```bash
   pnpm lint && pnpm type-check && pnpm test
   ```

4. **Push and open.**

   ```bash
   git push -u origin HEAD
   gh pr create --base dev --title "<type(scope): subject>" --body "<body>"
   ```

   Body sections: **Summary** (what and why), **Test plan** (what was run and checked).

5. **Do not merge.** Merging is the user's call. Give them the PR URL and
   say that once it's merged, the `after-merge` skill moves you back to
   `dev`.
