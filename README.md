# Kiwi Tracker

A mobile-first pet care and health tracker for iOS and web. Log symptoms, diet
changes and other events per pet, and see an at-a-glance health status across a
household.

> Status: prototype (local-first).

## Tech stack

Expo, React Native, TypeScript and Expo Router, with strict TypeScript and the
`@/` import alias. Data is stored on the device.

## Project structure

- `src/app` — Expo Router routes and layouts only.
- `src/modules` — product capabilities, grouped by domain.
- `src/shared` — cross-module UI, theme, dates and platform adapters.

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
```

## Develop

```bash
npm start
```

From the Expo terminal, press `w` to open the web app or `i` to open the iOS
Simulator.

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
- The roadmap and known issues live in the project's feature tracker, not in
  GitHub Issues or Projects.
