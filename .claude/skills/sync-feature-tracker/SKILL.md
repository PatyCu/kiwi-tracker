---
name: sync-feature-tracker
description: Sync the Kiwi Tracker feature status artifact (done / in progress / missing) with the current code. Use after finishing a feature, before committing it, or when asked to "sync the feature tracker".
---

# Sync the feature tracker

The feature tracker is a claude.ai artifact: https://claude.ai/artifact/RjuCdkFiaYjE28hAKyUR3Z

Its rows live in the artifact's database. Update them with the `ArtifactData` tool. Do not republish the page to change rows.

## Data shape

- Collection `features`, one document per feature:
  `{ area, areaOrder, order, status, name, note? }`
  - `status` is `"done"`, `"partial"` (shown as "In progress": partly built, or a placeholder in the app) or `"missing"`.
  - Areas and their `areaOrder`: Pets 1, Event logging 2, Timeline 3, Health status 4, Care and scheduling 5, Insights and sharing 6, Data and platform 7. Add a new area with the next number only when no existing area fits.
  - Document ids are kebab-case with an area prefix, for example `care-reminders`.
- Document `meta/sync`: `{ commit, syncedAt, nextUpTitle, nextUpBody }`.

## Steps

1. Read the current rows: `ArtifactData` `list` on `features` (use `query.limit: 1000`) and `get` on `meta/sync`. Keep each document's `version`.
2. Work out what the code supports now. Look at:
   - Routes in `src/app` and screens in `src/modules/*/ui`
   - Domain models (`PetEvent.ts`, `Pet.ts`) and the operations exposed by the providers in `src/modules/*/state`
   - Remaining placeholders: `PlaceholderScreen`, `PlaceholderCard`, and "Coming soon" text
   - `git log` since the commit in `meta/sync`
3. Compare the code with the rows:
   - A feature that changed state gets a new `status`, and its `note` updated if needed.
   - A new capability gets a new row. Keep `order` consistent within its area.
   - Never delete a row just because you didn't find its code. Delete it only when the feature was deliberately dropped, and say so.
4. Write every change in one `ArtifactData` `batch`. Pin each existing document with its `if_version`. Set `meta/sync` to `git rev-parse --short HEAD`, the current ISO time, and an updated "Next up" when the priority changed.
5. Tell the developer in a short list which rows changed (added, status changes, removed) and give the tracker link.

## When the tracker can't be updated

If this environment has no `ArtifactData` tool, or the write fails, don't block the feature work. Tell the developer that the tracker is out of date and which rows should change.
