# Kiwi Tracker agent guidance

## Role and ownership

- Work with staff-level engineering judgment: optimize for correctness, maintainability, and clear trade-offs, not only for completing the immediate change.
- Raise material architectural, data-integrity, security, or maintenance risks when they affect the requested work.
- Keep recommendations proportional to the product stage; this is a prototype evolving toward production, so avoid both throwaway shortcuts and unnecessary production-scale complexity.

## Project context

- This is a mobile-first pet health tracker built with Expo, React Native, TypeScript, and Expo Router.
- Keep the app local-first unless a task explicitly introduces accounts, sharing, or multi-device sync.
- Preserve strict TypeScript and the existing `@/` import alias.

## Engineering principles

- Prefer simple, explicit solutions and avoid premature abstractions.
- Follow existing project patterns before introducing new ones.
- Keep changes scoped to the requested task; do not modify unrelated files.
- Explain significant architectural decisions and their trade-offs.
- Prefer names that communicate responsibility or domain meaning without requiring project-specific knowledge.

## Modularity and code organization

- Treat maintainability and clear module boundaries as primary requirements.
- Give each module one cohesive responsibility and a clear reason to change. This does not require one function per file.
- Keep presentation, business logic, persistence, and external integrations separate. UI components should not contain storage or API implementation details.
- Treat screens primarily as composition roots: assemble feature components, coordinate screen-level UI state, and delegate business rules and integrations.
- Encapsulate device storage and future API calls behind typed modules with explicit inputs, outputs, and error behavior.
- Extract logic from screens when it represents business rules, reusable state transitions, data mapping, or side effects. Keep purely visual behavior close to the component that owns it.
- Prefer small, composable components and functions, but do not split code solely to reduce file length or create abstractions before a real boundary exists.
- When touching code that mixes responsibilities, improve the relevant boundary when it can be done safely within task scope; do not start unrelated refactors.

## Workflow

- Inspect the relevant code and configuration before making changes.
- After refactors, remove obsolete files, exports, imports, and empty directories.
- Use trunk-based development by default. When asked to commit and push without an explicit branch request, commit the scoped changes directly to `main` and push `main` upstream; create a separate branch only when explicitly requested.
- Before asking a developer to repeat setup or authentication, verify whether the failure is caused by sandbox, keychain, network, or permission restrictions in the agent's execution environment.
- For GitHub publishing, attempt the HTTPS push outside the sandbox with `GIT_TERMINAL_PROMPT=0` first so keychain prompts cannot hang it. Do not add a preflight authentication check to the successful path.
- Only if that noninteractive push returns an authentication or credential error, run `gh auth status` with keychain access outside the sandbox. Treat sandboxed invalid-token or credential errors as environment failures, and ask the developer to log in again only when the outside-sandbox check also fails.
- Use `npm`, which is the package manager established by `package-lock.json`; do not add another lockfile.
- Ask for confirmation before adding a new production dependency.
- After code changes, run `npm run typecheck` and the relevant Expo check or build. Validate each affected platform when behavior or configuration is cross-platform.
- Run lint and tests when corresponding project scripts exist. If a relevant check is unavailable, state that clearly instead of claiming it passed.
- Treat console errors and warnings as part of the current task: investigate and resolve them before finishing. Do not knowingly leave warnings to accumulate; if a warning cannot be fixed safely within scope, explain the cause and required follow-up.
- When phased delivery is requested, keep a visible checklist and complete implementation, automated validation, manual verification, and commit in that order for each phase.
- Keep developer documentation concise and current, covering prerequisites, installation, development, and validation. Add troubleshooting guidance only for recurring issues.
- The feature tracker artifact is the only roadmap and bug list; do not use GitHub Issues or GitHub Projects. Follow `.claude/skills/sync-feature-tracker/SKILL.md` to update it.
- After finishing a user-facing feature or fixing a bug, or after a change that adds, removes or replaces a placeholder, sync the feature tracker before committing. Skip it for refactors and tooling that don't change what the app can do. If the tracker can't be updated from your environment, tell the developer which records are out of date.
- Treat bugs as P0: log a bug in the tracker when it is found, and fix open bugs before starting new feature work unless the developer decides otherwise.

## Data and UX

- Keep persisted health data backward-compatible or provide an explicit migration.
- Do not silently discard user-entered data when storage operations fail.
- Keep behavior consistent across iOS and web unless a platform-specific difference is intentional and documented.
