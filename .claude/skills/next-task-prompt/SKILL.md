---
name: next-task-prompt
description: Write the prompt the developer will hand to a fresh agent for the next task, carrying over this session's context. Use when the developer asks "what's next", "what's the next task" or for a prompt or handoff for the next agent.
---

# Next task prompt

Writes the prompt for the agent that picks up the next task. The developer reviews it, edits it if needed and sends it as their own message, so write it in their voice.

## 1. Find the next task

Read the tracker's issues in Linear (see `.claude/skills/sync-feature-tracker/SKILL.md` for how it's organized). Don't change any issues.

- If this session worked on a feature that still has unfinished task sub-issues, the next task is its first unfinished one. Skip tasks this session already finished, even if the tracker hasn't been synced yet.
- Otherwise, pick the next item as "Picking the next item" in the tracker skill describes.

If the work from this session isn't on `main` yet (an unmerged PR or uncommitted changes), say so to the developer above the prompt.

## 2. Write the prompt

Write in first person, as the developer ("I want to…", "We decided…"). Keep it short and include only what the next agent can't get from the repo, `AGENTS.md`, the tracker or git history:

- The task, named as it appears in the tracker, and what done looks like.
- Decisions from this session that affect it, with the reason when the reason isn't obvious.
- Pitfalls found in this session: failing approaches, environment quirks, surprising behavior.
- What was deliberately left for this task or for later, so it isn't redone or pulled in early.
- Pointers to the relevant files, docs or artifacts instead of copying their content.

Leave out anything the next agent does anyway: reading `AGENTS.md`, following repo rules, running checks, syncing the tracker. The prompt carries the developer's approval, so write requested actions as approved and never add "ask me first" for something the prompt asks for. Add a stop-and-ask only for a decision the prompt really leaves open.

## 3. Share it

Give the prompt in one fenced `text` block so it can be copied as-is. Don't save it to a file.
