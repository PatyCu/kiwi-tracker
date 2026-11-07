---
name: sync-feature-tracker
description: Sync the Kiwi Tracker roadmap artifact (features by phase, plus bugs) with the current code. Use after finishing a feature or fixing a bug, before committing, when a bug is found, or when asked to "sync the feature tracker".
---

# Sync the feature tracker

The feature tracker is a claude.ai artifact and the project's only roadmap and bug list. GitHub Issues and GitHub Projects are not used.

https://claude.ai/artifact/RjuCdkFiaYjE28hAKyUR3Z

Its records live in the artifact's database. Update them with the `ArtifactData` tool. Do not republish the page to change records.

## Data shape

- Collection `features`, one document per feature:
  `{ area, areaOrder, order, status, phase, priority?, name, note? }`
  - `status`: `"done"`, `"partial"` (shown as "In progress": partly built, or a placeholder in the app) or `"missing"`.
  - `phase`: `"MVP"`, `"Premium v1"`, `"Premium v2"` or `"Unplanned"`.
  - `priority`: `"P0"`, `"P1"` or `"P2"`; left out for Unplanned rows.
  - Areas and their `areaOrder`: Pets 1, Event logging 2, Timeline 3, Health status 4, Care and scheduling 5, Insights and sharing 6, App and platform 7, Accounts and sharing 8. Add a new area with the next number only when no existing area fits.
  - Document ids are kebab-case with an area prefix, for example `care-reminders`.
- Collection `bugs`, one document per bug:
  `{ title, status, reportedAt, fixedAt?, fixedIn?, note? }`
  - `status`: `"open"` or `"fixed"`. Open bugs are always P0.
  - `fixedIn` is the short commit hash of the fix.
  - Document ids are kebab-case with a `bug-` prefix.
- Document `meta/sync`: `{ commit, syncedAt, nextUpTitle, nextUpBody }`.

## Who owns which fields

- **From the code** (the sync updates these): feature `status` and `note`, and bug `status`, `fixedAt` and `fixedIn`.
- **Set by the developer** (never changed by the sync unless the developer asks): `phase`, `priority`, and `nextUpTitle` / `nextUpBody`.

## Steps

1. Read the current records: `ArtifactData` `list` on `features` and `bugs` (use `query.limit: 1000`), and `get` on `meta/sync`. Keep each document's `version`.
2. Work out what the code supports now. Look at:
   - Routes in `src/app` and screens in `src/modules/*/ui`
   - Domain models (`PetEvent.ts`, `Pet.ts`) and the operations exposed by the providers in `src/modules/*/state`
   - Remaining placeholders: `PlaceholderScreen`, `PlaceholderCard`, and "Coming soon" text
   - `git log` since the commit in `meta/sync`
3. Compare the code with the records:
   - A feature that changed state gets a new `status`, and its `note` updated if needed.
   - A new capability that matches no row gets a new row with `phase: "Unplanned"`. Ask the developer which phase and priority it belongs to.
   - Never delete a row just because you didn't find its code. Delete it only when the feature was deliberately dropped, and say so.
   - A bug fixed in this work gets `status: "fixed"`, `fixedAt` and `fixedIn`.
4. Write every change in one `ArtifactData` `batch`. Pin each existing document with its `if_version`. Set `meta/sync` `commit` to `git rev-parse --short HEAD` and `syncedAt` to the current ISO time.
5. Tell the developer in a short list what changed (rows added, status changes, rows removed, bugs fixed) and give the tracker link.

## Logging a bug

When a bug is found, add it to `bugs` right away with `status: "open"` and `reportedAt` set to now, unless the fix lands in the same change (then add it as fixed). The developer can also log bugs and mark them fixed from the page.

## When the tracker can't be updated

If this environment has no `ArtifactData` tool, or the write fails, don't block the work. Tell the developer that the tracker is out of date and which records should change.
