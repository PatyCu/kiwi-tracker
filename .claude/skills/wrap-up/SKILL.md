---
name: wrap-up
description: Finish the current piece of work, from final checks to a clean worktree. Validates, syncs the feature tracker, commits, pushes to main or opens a PR, applies new Supabase migrations to the shared project, and cleans up the branch. Use when the developer says "wrap up", "wrap it up" or "let's wrap up".
---

# Wrap up

Takes finished work from the working tree to published and cleaned up. Follow the rules in `AGENTS.md`; this skill only orders the steps and doesn't restate those rules.

Stop and report to the developer whenever a step fails. Don't skip ahead.

## 1. Check the work is done

- Related bugs are part of done. If a bug caused by or tied to this change is still open, fix it first, or stop and ask the developer.
- Match the checks to what changed. Any failure or console warning stops the wrap-up.
  - **Code or config** (`.ts`/`.tsx`/`.js`, `package.json`, `app.json`, other build or tool config): run `npm run typecheck`, `npm run lint`, `npm run format:check` and `npm test`, plus the relevant Expo check from `AGENTS.md`.
  - **Only docs or skills** (`.md` files): run `npm run format:check`. The other checks can't catch anything in these files.
- Review `git status` and `git diff`. Commit only files that belong to this task. Point out unrelated or unexpected changes and leave them out unless the developer says to include them.

## 2. Sync the feature tracker

When `AGENTS.md` calls for a tracker sync, follow `.claude/skills/sync-feature-tracker/SKILL.md`. This step is the exception to stopping on failure: if the tracker can't be updated, say which records are out of date and carry on.

## 3. Commit

One commit, one line, in the repo's style: `type: what changed, in plain words` (for example `feat: edit an event's details from the event detail screen`). Types used here: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`. Make the line specific enough that the log alone says what changed. End the message with the attribution lines the environment asks for.

## 4. Publish

Check the branch with `git branch --show-current`.

- **On `main`:** push `main` following the GitHub publishing rules in `AGENTS.md`.
- **On another branch:** push the branch the same way, then open a PR against `main` with `gh pr create`. Give it a short summary of what changed and how it was validated. Don't merge it yourself; the developer reviews and merges.

## 5. Apply migrations to the shared project

Only when the published work adds files under `supabase/migrations/`, and only from `main`: right after pushing `main` in step 4, or, for a PR, once it's merged and pulled in step 6.

1. Run `supabase db push --remote --dry-run`. It must list exactly this work's new migrations. If it lists anything else, or nothing, stop and show the developer.
2. Run `supabase db push --remote`. If the CLI asks for a login or database password, stop and ask the developer to run it.
3. Check the security advisor (the Supabase MCP `get_advisors` tool, or **Advisors → Security Advisor** in the dashboard). Report new warnings.
4. If the schema artifact says a migration isn't on the shared project yet, update it to say it's live.

## 6. Clean up

Files left out of the commit in step 1 because they don't belong to this task aren't a failure. List them and ask the developer whether to commit them separately, gitignore them or leave them. Anything else left in `git status` is.

- **On `main`:** confirm `git status` is clean, apart from those left-out files, and `main` is level with `origin/main`. Done.
- **On a branch, PR not merged yet:** stop here. Give the developer the PR link and tell them to say "wrap up" again once it's merged.
- **On a branch, PR merged** (check with `gh pr view --json state,mergedAt`):
  1. Confirm `git status` is clean. If it isn't, stop and show what's left.
  2. `git switch main` and `git pull --ff-only`, then step 5 if the PR added migrations.
  3. Delete the local branch with `git branch -d <branch>`. If git refuses because the PR was squash-merged, confirm the PR is merged and then use `-D`.
  4. If the session runs in a worktree the app created, don't delete its branch or worktree by hand; the app cleans them up when the session is archived.

## 7. Report

Finish with a short summary: the commit hash and message, where it went (pushed to `main`, or the PR link), migrations applied to the shared project, tracker changes, and anything left out or still open.
