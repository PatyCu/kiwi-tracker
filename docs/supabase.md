# Supabase backend

Kiwi Tracker has a [Supabase](https://supabase.com) backend schema in which
each person keeps their own pets, events and pet photos. The app has a Supabase
client, but no screen uses it yet; data is still stored on the device.

The schema lives in `supabase/migrations/` and is the source of truth. You
develop against a local Supabase stack. The shared cloud project
(`kiwi-tracker`, EU West 3) changes only through a reviewed `supabase db push`.

## Data model

| Table / bucket | Holds                                                    |
| -------------- | -------------------------------------------------------- |
| `pets`         | Pets, each owned by one Supabase Auth user (`owner_id`). |
| `pet_events`   | Symptoms, diet changes and other events for a pet.       |
| `pet-photos`   | Private storage bucket, files under `<pet_id>/<file>`.   |

Each person can read their own pets, and read, add, edit and delete those pets'
events and photos. Only the owner can add, edit or delete a pet, and a pet can't
be moved to another owner. Signed-out users have no access.

Pet rules check `owner_id` directly. Event and photo rules go through
`private.accessible_pet_ids()`, which today returns the pets the signed-in user
owns. Sharing a pet with other people later changes those rules and that
function, not the stored rows or photo paths.

## Schema conventions

- Name each migration `<YYYYMMDDHHMMSS>_<description>.sql` (create it with
  `supabase migration new`). Never edit a migration that has already been
  applied; add a new one instead.
- Every table has a `uuid` `id`, which the database generates when the insert
  leaves it out.
- Add a column only when the app uses it. `pet_events.created_at` records when
  an event was logged, as opposed to `occurred_at`, when it happened.
- Every table has row-level security enabled, with access limited to the
  signed-in user's pets: `owner_id` on `pets`, `private.accessible_pet_ids()`
  everywhere else.
- After a migration reaches the shared project, check **Advisors → Security
  Advisor** in the dashboard for new warnings.

## Accounts

Anyone can sign up with their email; there are no invitations or memberships to
manage. A new account starts with no pets.

Locally, `supabase/seed.sql` creates two accounts with one pet each, so you can
check access from both sides. The accounts and their password are listed at the
top of that file.

## Local development

### Prerequisites

- [Homebrew](https://brew.sh).
- A Docker-compatible runtime. The project uses
  [Colima](https://github.com/abiosoft/colima):

  ```bash
  brew install colima docker
  ```

- The Supabase CLI:

  ```bash
  brew install supabase
  ```

### Run the stack

```bash
colima start --cpu 4 --memory 6
supabase start
```

The first start downloads the Supabase images. `supabase start` applies all
migrations and the seed, then prints the local URLs and keys. Studio runs at
<http://127.0.0.1:54323>.

Stop with `supabase stop` and `colima stop`.

### Connect the app

The app reads its Supabase connection from two Expo public env vars:

| Variable                               | Value                                  |
| -------------------------------------- | -------------------------------------- |
| `EXPO_PUBLIC_SUPABASE_URL`             | API URL from `supabase status`         |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key from `supabase status` |

`.env.example` holds the local stack's values. Copy it once and restart Expo:

```bash
cp .env.example .env.local
```

`.env.local` is git-ignored. Point it at the shared project only to test against
it on purpose, and never put a secret key in it: `EXPO_PUBLIC_*` values are
bundled into the app. If a variable is missing or invalid, the first Supabase
call throws an error that names it.

Only persistence modules (`src/modules/*/persistence`) may use the client in
`src/shared/supabase/supabaseClient.ts`; lint rejects imports from anywhere
else. The signed-in session is kept in AsyncStorage (localStorage on web).

### Change the schema

1. Create a migration file:

   ```bash
   supabase migration new <description>
   ```

2. Write the SQL, following the conventions above.
3. Rebuild the local database from scratch with all migrations and the seed:

   ```bash
   supabase db reset
   ```

4. Regenerate the app's database types from the local schema, and fix any
   type errors the change causes:

   ```bash
   npm run db:types
   ```

   This writes `src/shared/supabase/database.types.ts`. Rerun it after every
   migration.

5. Check the change: `supabase db lint` for schema errors, and Studio or the
   seeded accounts for access rules. Update `supabase/seed.sql` if the new
   schema needs local data.
6. Commit the migration with the regenerated types and get it reviewed.

### Apply to the shared project

Migrations are applied from `main` once they're pushed. An agent's wrap-up
([`.claude/skills/wrap-up/SKILL.md`](../.claude/skills/wrap-up/SKILL.md)) does
this automatically; to do it by hand, a maintainer runs the commands below.
`supabase login` opens a browser to sign in; linking then uses that login.

```bash
supabase login
supabase link --project-ref gxljpicuptmmdwxmclwk
supabase db push --remote --dry-run
supabase db push --remote
```

Without `--remote`, `db push` targets the local database. `--dry-run` lists the
migrations the push would apply. Never pass `--include-seed`: the seed is local
test data. Then check the Security Advisor.
