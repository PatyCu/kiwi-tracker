---
name: sync-feature-tracker
description: Sync the Kiwi Tracker roadmap artifact (features by phase, plus bugs) with the current code. Use when AGENTS.md calls for a tracker sync or a bug to be logged, or when asked to "sync the feature tracker".
---

# Sync the feature tracker

The feature tracker is a claude.ai artifact and the project's only roadmap and bug list. GitHub Issues and GitHub Projects are not used.

https://claude.ai/artifact/RjuCdkFiaYjE28hAKyUR3Z

Its records live in the artifact's database. Update them with the `ArtifactData` tool. Do not republish the page to change records.

## Data shape

- Collection `features`, one document per feature:
  `{ area, areaOrder, order, status, phase, priority?, name, note? }`
  - `status`, in sort order within each phase (the page folds `done` rows into a collapsible "N done" group at the top of the phase):
    - `"done"`: Done.
    - `"in-progress"`: In progress. Work on it has started and isn't finished.
    - `"partial"`: Ready for development. A placeholder or a partial version is already in the app.
    - `"missing"`: To-do. Nothing in the app yet.
  - `phase`: `"MVP"`, `"Premium v1"`, `"Premium v2"` or `"Unplanned"`.
  - `priority`: `"P0"`, `"P1"` or `"P2"`; left out for Unplanned rows.
  - Areas and their `areaOrder`: Pets 1, Event logging 2, Timeline 3, Health status 4, Care and scheduling 5, Insights and sharing 6, App and platform 7, Accounts and sharing 8. Add a new area with the next number only when no existing area fits.
  - Document ids are kebab-case with an area prefix, for example `care-reminders`.
- Collection `bugs`, one document per bug:
  `{ title, status, reportedAt, fixedAt?, fixedIn?, note? }`
  - `status`: `"open"` or `"fixed"`. Open bugs are always P0.
  - `fixedIn` is the short commit hash of the fix.
  - Document ids are kebab-case with a `bug-` prefix.
- Document `meta/sync`: `{ commit, syncedAt }`.

## Page colors

Colors on the page carry meaning. Keep them consistent when changing the page or adding a new status, label or record type.

| Color            | Meaning                    | Used for               |
| ---------------- | -------------------------- | ---------------------- |
| Green            | Finished, healthy          | Done; "No open bugs"   |
| Dark solid (ink) | Active work                | In progress            |
| Blue             | Neutral, ready to pick up  | Ready for development  |
| Purple           | Neutral, not started       | To-do                  |
| Red              | Critical, needs action now | Open bugs only         |
| Orange-yellow    | Urgent or a warning        | Reserved; not used yet |

- Red and orange-yellow are only for bugs and urgent or critical items. Never use them for normal roadmap statuses.
- When something urgent is added later (for example an "urgent" priority, a blocker or a regression), use red if it needs action now and orange-yellow if it is a warning or needs attention soon.
- Any other new state gets a color that isn't in this table, and a new row here.

The page source isn't in this repo. To change the page, read the artifact with the `Artifact` tool (`action: "read"`), edit that version, and republish it to the same URL.

## Who owns which fields

- **From the code** (the sync updates these): feature `status` and `note`, and bug `status`, `fixedAt` and `fixedIn`.
- **Set by the developer** (never changed by the sync unless the developer asks): `phase` and `priority`.

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

## Picking the next item

The order the page shows rows in is the priority order. Open bugs come first. After that, the next item is the first unfinished row in the earliest phase (MVP, Premium v1, Premium v2), where rows are sorted by:

1. `priority` (P0 before P1 before P2)
2. `status` in page order: `in-progress`, `partial`, `missing`
3. `areaOrder`
4. `order`

Don't suggest Unplanned rows unless the developer asks. When the developer names a different item, do that one.

## Starting work on a feature

When you start building a feature, set its row to `"in-progress"`. When the work is finished, the sync sets it to `"done"`, or back to `"partial"` if only part of it landed.

## Logging a bug

When a bug is found, add it to `bugs` right away with `status: "open"` and `reportedAt` set to now, unless the fix lands in the same change (then add it as fixed). The developer can also log bugs and mark them fixed from the page.

## When the tracker can't be updated

If this environment has no `ArtifactData` tool, or the write fails, don't block the work. Tell the developer that the tracker is out of date and which records should change.
