-- Calendar events: planned care for a pet, such as a vet visit or a vaccine.
-- Every member of the pet's household can read and add them, like pet events.
-- Events don't repeat and have no guests; they start and end on the same day.

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  title text not null check (length(btrim(title)) > 0),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  location text,
  description text,
  created_at timestamptz not null default now(),
  constraint calendar_events_ends_after_start check (ends_at > starts_at)
);

-- A pet's events in date order; also serves the pet_id foreign key.
create index calendar_events_pet_schedule_idx on public.calendar_events (pet_id, starts_at);

-- Access rules ----------------------------------------------------------------

alter table public.calendar_events enable row level security;

-- Signed-out visitors get no table access at all.
revoke all on public.calendar_events from anon;

create policy "People can read calendar events for pets they have access to"
  on public.calendar_events for select to authenticated
  using (pet_id in (select private.accessible_pet_ids()));
create policy "People can add calendar events for pets they have access to"
  on public.calendar_events for insert to authenticated
  with check (pet_id in (select private.accessible_pet_ids()));
