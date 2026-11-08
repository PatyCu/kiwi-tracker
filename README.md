# Kiwi Tracker

A mobile-first pet care and health tracker for iOS and web. Log symptoms, diet
changes and other events per pet, and see an at-a-glance health status across
all your pets.

> Status: prototype (local-first).

## Tech stack

Expo, React Native, TypeScript and Expo Router, with strict TypeScript and the
`@/` import alias. People sign in with an email and password through Supabase
Auth; pets and events are still stored on the device, not per account.

## Project structure

- `src/app` — Expo Router routes and layouts only.
- `src/modules` — product capabilities, grouped by domain.
- `src/shared` — cross-module UI, theme, dates and platform adapters.
- `supabase` — backend schema and local stack configuration. The app signs in
  with Supabase but doesn't store data there yet; see
  [docs/supabase.md](docs/supabase.md).

Dependency direction is `app → modules → shared`. See
[docs/architecture.md](docs/architecture.md) for the full principles.

## Prerequisites

- Node.js 22 and npm 10 (`.nvmrc` pins the Node version; run `nvm use`).
- Xcode and an iOS Simulator for iOS development.

## Setup

```bash
git clone https://github.com/PatyCu/kiwi-tracker.git
cd kiwi-tracker
nvm use
npm ci
cp .env.example .env.local
```

`.env.local` points the app at the local Supabase stack. See
[Connect the app](docs/supabase.md#connect-the-app) to run that stack and for
the variables it sets.

## Develop

```bash
npm start
```

From the Expo terminal, press `w` to open the web app or `i` to open the iOS
Simulator. The app opens at sign-in; locally, use a seeded account (see
[Accounts](docs/supabase.md#accounts)). To use real accounts and data instead,
run `npm run web:shared` (see
[Test against the shared project](docs/supabase.md#test-against-the-shared-project)).

## Validate

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
```

## Contributing

- Read [AGENTS.md](AGENTS.md) for engineering principles and conventions.
- Trunk-based development: scoped changes go to `main` unless a branch is
  requested.
- Bugs are P0 — fix open bugs before new feature work.
- The roadmap and known issues live in
  [Linear](https://linear.app/patycu-projects/project/kiwi-tracker-76056a1b09ae),
  not in GitHub Issues or Projects.
