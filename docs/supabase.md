# Supabase backend

Kiwi Tracker has a [Supabase](https://supabase.com) backend schema in which a
household shares its pets, events and pet photos. The app does not connect to it
yet; it still stores data on the device. You only need this setup to work on the
database.

The schema lives in `supabase/migrations/` and is the source of truth. You
develop against a local Supabase stack. The shared cloud project
(`kiwi-tracker`, EU West 3) changes only through a reviewed `supabase db push`.

## Data model

| Table / bucket      | Holds                                                              |
| ------------------- | ------------------------------------------------------------------ |
| `households`        | A group of people sharing pets.                                    |
| `household_members` | Links a Supabase Auth user to a household. One household per user. |
| `pets`              | A household's pets.                                                |
| `pet_events`        | Symptoms, diet changes and other events for a pet.                 |
| `pet-photos`        | Private storage bucket, files under `<household_id>/<pet_id>/`.    |

Members can read their household and its members, and can read, add, edit and
delete its pets, events and photos. The app cannot create households or change
memberships. Signed-out users have no access.

## Schema conventions

- Name each migration `<YYYYMMDDHHMMSS>_<description>.sql` (create it with
  `supabase migration new`). Never edit a migration that has already been
  applied; add a new one instead.
- Every table has a `uuid` `id`, which the database generates when the insert
  leaves it out.
- Add a column only when the app uses it. `pet_events.created_at` records when
  an event was logged, as opposed to `occurred_at`, when it happened.
- Every table has row-level security enabled, with access limited to members of
  the row's household (`private.is_household_member`).
- After a migration reaches the shared project, check **Advisors → Security
  Advisor** in the dashboard for new warnings.

## Membership

Only a maintainer manages memberships, from the shared project's dashboard:

1. In **Authentication → Users**, invite the person by email.
2. In **SQL Editor**, create a household if needed and add the user to it:

   ```sql
   insert into public.households (name) values ('Our pets') returning id;

   insert into public.household_members (user_id, household_id, display_name)
   values ('<user id from Authentication → Users>', '<household id>', '<name>');
   ```

Locally, `supabase/seed.sql` creates two households with one member each, so you
can check access from both sides. The accounts and their password are listed at
the top of that file.

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

4. Check the change: `supabase db lint` for schema errors, and Studio or the
   seeded accounts for access rules. Update `supabase/seed.sql` if the new
   schema needs local data.
5. Commit the migration and get it reviewed.

### Apply to the shared project

A maintainer applies reviewed migrations from `main`. `supabase login` opens a
browser to sign in; linking then uses that login.

```bash
supabase login
supabase link --project-ref gxljpicuptmmdwxmclwk
supabase db push --remote --dry-run
supabase db push --remote
```

Without `--remote`, `db push` targets the local database. `--dry-run` lists the
migrations the push would apply. Never pass `--include-seed`: the seed is local
test data. Then check the Security Advisor.
