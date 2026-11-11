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

- The app is online-only: pets, events, and pet photos live in Supabase, shared per household. Data from the earlier on-device version was not imported.
- The device keeps only the Supabase session (AsyncStorage, localStorage on web) and, on iOS, a cache of pet photos for the signed-in account that sign-out clears.
- Schema changes go through migrations and keep existing rows readable.
- Persistence modules expose typed inputs, outputs, and failures.
- Storage failures must not silently discard user data.
- Only persistence modules use the Supabase client (`src/shared/supabase`); lint enforces this.

## Loading data

- The root layout (`src/app/_layout.tsx`) waits for the household: it shows a loading screen while the household loads, and an error with Retry if that fails. That Retry also reloads any pets or events that failed with it.
- Screens with household data show `LoadState` (`src/shared/ui/LoadState.tsx`) until their data is ready.
- Screens that show both pets and events use `usePetsAndEventsLoad` (`src/modules/pet-events/state/usePetsAndEventsLoad.ts`); its Retry reloads only what failed.

## Navigation and product scope

- Global tabs cover cross-pet views: Today, Pets, Timeline, and Settings.
- The Pets tab keeps its selected pet explicit in the `petId` route parameter.
- Pet routes use `petId`; event routes also use `recordId`.
- Today is a cross-pet overview; pet pages provide drill-down.
- The green, amber, and red status rules and copy have one source of truth.
- Unimplemented MVP items remain truthful placeholders, not simulated features.
