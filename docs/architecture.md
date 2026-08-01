# Architecture principles

## Structure

- `src/app`: Expo Router routes and layouts only.
- `src/modules`: implemented product capabilities, grouped by domain.
- `src/shared`: cross-module UI, theme, dates, platform adapters, and generic state types.
- Dependency direction: `app → modules → shared`.
- No generic `lib`, `utils`, or `helpers` folders.
- No empty or speculative folders. Add a module when its implementation starts.

## Responsibilities

- Each file has one cohesive responsibility and one main reason to change.
- Screens compose UI and coordinate screen-level state.
- Domain rules, validation, persistence, forms, state, and presentation stay separate.
- UI does not read or write storage directly.
- Device APIs are isolated behind typed modules.
- Cross-cutting interaction patterns, such as modal sheets, live in shared UI.

## Dependencies

- Required context is explicit: pet operations receive `petId`.
- No ambient active-pet dependency.
- Time-dependent rules receive the current time as input.
- Shared code does not import product modules.

## Data

- The app remains local-first.
- Persisted schemas and storage keys remain backward-compatible.
- Storage modules expose typed inputs, outputs, and failures.
- Storage failures must not silently discard user data.

## Navigation and product scope

- Global tabs cover cross-pet views: Today, Pets, Timeline, and Settings.
- Pet routes use `petId`; event routes also use `recordId`.
- Today is a cross-pet overview; pet pages provide drill-down.
- The green, amber, and red status rules and copy have one source of truth.
- Unimplemented MVP items remain truthful placeholders, not simulated features.
