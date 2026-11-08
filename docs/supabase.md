# Supabase backend

Kiwi Tracker has a [Supabase](https://supabase.com) backend schema in which
each household shares its pets, events and pet photos. The app uses Supabase
Auth to sign in and shows the signed-in user's household alias on Today, Pets
and Settings, plus its members by name in Settings, but pets and events are
still stored on the device.

The schema lives in `supabase/migrations/` and is the source of truth. You
develop against a local Supabase stack. The shared cloud project
(`kiwi-tracker`, EU West 3) changes only through a reviewed `supabase db push`.

## Data model

| Table / bucket      | Holds                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------- |
| `households`        | Households, each with an `alias` the app shows.                                                         |
| `household_members` | Which household each Supabase Auth user belongs to (one each), and the `display_name` they go by in it. |
| `pets`              | Pets, each in one household (`household_id`).                                                           |
| `pet_events`        | Symptoms, diet changes and other events for a pet.                                                      |
| `pet-photos`        | Private storage bucket, files under `<pet_id>/<file>`.                                                  |

Every member of a household can read, add, edit and delete its pets, and those
pets' events and photos. A pet can't be moved to a household the user isn't in.
People outside the household see none of it, and signed-out users have no
access. Members can read their household and everyone's membership in it, but
only the dashboard can create households or change memberships.

Pet rules check `household_id` with `private.is_household_member()`. Event and
photo rules go through `private.accessible_pet_ids()`, which returns the pets in
the signed-in user's household, so changing who can reach a pet changes that
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
  signed-in user's household: `private.is_household_member()` on `pets`,
  `private.accessible_pet_ids()` for events and photos.
- After a migration reaches the shared project, check **Advisors → Security
  Advisor** in the dashboard for new warnings.

## Accounts

The app signs in with an email and password and keeps the session on the device
until the user signs out from Settings. Nobody can create an account from the
app: public sign-up is off (`enable_signup = false` in `supabase/config.toml`
for the local stack, and **Authentication → Sign In / Providers → Allow new
users to sign up** turned off on the shared project).

To add an account on the shared project, open **Authentication → Users → Add
user → Create new user**, enter the email and a password, and keep **Auto
Confirm User** ticked. Then add the account to a household right away: every
account must have one, and until it does the app shows "This account isn't in
a household yet" instead of opening. In **Table Editor**, insert a row in
`households` with an `alias` if the household is new, then a row in
`household_members` with the account's user ID, the household's ID and a
`display_name`, the name the app shows for them instead of their email.

Locally, `supabase/seed.sql` mirrors the shared project: two accounts share a
household and a third has its own, each household with one pet, so you can check
what members share and what outsiders can't see. The accounts and their password
are listed at the top of that file. Accounts on the shared project don't exist
locally, and `supabase db reset` removes any account added to the local stack by
hand.

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

`.env.local` is git-ignored and always points at the local stack. Never put a
secret key in an env file: `EXPO_PUBLIC_*` values are bundled into the app. If a
variable is missing or invalid, the first Supabase call throws an error that
names it.

### Test against the shared project

To check a change with real accounts and data, put the shared project's values
(**Project Settings → API**: the project URL and the publishable key) in a
git-ignored `shared-project.env`, using the same two variables, then run:

```bash
npm run web:shared
```

`npm run start:shared` does the same for the iOS Simulator. Everything you add
there is real data.

The shared scripts copy `shared-project.env` to `.env.development.local`, which
Expo applies over `.env.local`. `npm run web`, `npm run start` and `npm run ios`
delete that copy and clear Metro's cache, so they always use the local stack.
Don't name the file `.env.*`: in development Expo bundles every root file whose
name starts with `.env`.

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
