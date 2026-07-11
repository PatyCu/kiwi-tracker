# Kiwi Tracker prototype

A mobile-first Expo prototype for pet care, health events, habits, reminders, and vet-friendly timelines.

## Run

```bash
npm install
npm run ios
# or
npm run web
```

## Proposed architecture

- Expo + React Native + TypeScript + Expo Router for one iOS/web codebase.
- Start local-first with SQLite; add Supabase only when accounts, sharing, or multi-device sync are required.
- Keep health-event records append-oriented. Generate exports from the same event model.
- Use local notifications first; add server push only for shared-care workflows.

## Decisions before production

1. Is caregiver sharing required at launch?
2. Must data sync across devices, or is private on-device storage enough for v1?
3. Should exports be PDF, email body, or both?
4. Which countries/languages determine privacy copy and medical disclaimers?

`assets/kiwi-logo-source.png` is an AI-generated brand exploration. The UI uses a code-native compact mark for reliable rendering while the final identity is refined.
