-- Kiwi Tracker MVP schema: households share pets, events and pet photos.
-- Membership is managed from the Supabase dashboard; the app can only read it.

create schema if not exists private;
grant usage on schema private to authenticated;

-- Shared row bookkeeping ------------------------------------------------------

-- Refreshes updated_at on every change and keeps created_at fixed.
create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.created_at := old.created_at;
  new.updated_at := now();
  return new;
end;
$$;

-- Keeps the original author of a pet or event.
create function private.keep_created_by()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.created_by := old.created_by;
  return new;
end;
$$;

-- Households and members ------------------------------------------------------

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.household_members (
  id uuid primary key default gen_random_uuid(),
  -- unique: each person belongs to one household.
  user_id uuid not null unique references auth.users (id) on delete cascade,
  household_id uuid not null references public.households (id) on delete cascade,
  display_name text not null check (length(btrim(display_name)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index household_members_household_id_idx on public.household_members (household_id);

-- True when the signed-in user belongs to the given household.
-- security definer so policies on household_members can use it without recursion.
create function private.is_household_member(target_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.household_members
    where household_id = target_household_id
      and user_id = (select auth.uid())
  );
$$;

revoke execute on function private.is_household_member(uuid) from public, anon;
grant execute on function private.is_household_member(uuid) to authenticated;

-- Pets ------------------------------------------------------------------------

create table public.pets (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null check (length(btrim(name)) > 0),
  species text not null check (species in ('Cat', 'Dog', 'Other')),
  breed text,
  birth_date date,
  photo_path text,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Lets events reference (household_id, id) so an event's household always matches its pet's.
  -- Its index also serves the household_id foreign key.
  constraint pets_household_id_id_key unique (household_id, id)
);

create index pets_created_by_idx on public.pets (created_by);

-- Pet events ------------------------------------------------------------------

create table public.pet_events (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  pet_id uuid not null,
  type text not null check (type in ('symptom', 'diet-change', 'other')),
  occurred_at timestamptz not null,
  note text,
  symptom text check (
    symptom in (
      'Vomiting',
      'Diarrhea',
      'Asthma',
      'Hairball',
      'Nausea',
      'Loss of appetite',
      'Other'
    )
  ),
  title text,
  diet_change jsonb,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pet_events_pet_fkey foreign key (household_id, pet_id)
    references public.pets (household_id, id) on delete cascade,
  -- Each type carries exactly its own fields.
  constraint pet_events_type_fields check (
    (type = 'symptom' and symptom is not null and title is null and diet_change is null)
    or (
      type = 'other'
      and title is not null
      and length(btrim(title)) > 0
      and symptom is null
      and diet_change is null
    )
    or (
      type = 'diet-change'
      and jsonb_typeof(diet_change) = 'object'
      and symptom is null
      and title is null
    )
  )
);

-- Per-pet timeline; also serves the (household_id, pet_id) foreign key.
create index pet_events_pet_timeline_idx
  on public.pet_events (household_id, pet_id, occurred_at desc);
-- Household-wide timeline.
create index pet_events_household_timeline_idx
  on public.pet_events (household_id, occurred_at desc);
create index pet_events_created_by_idx on public.pet_events (created_by);

-- Triggers --------------------------------------------------------------------

create trigger set_updated_at before update on public.households
  for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.household_members
  for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.pets
  for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.pet_events
  for each row execute function private.set_updated_at();

create trigger keep_created_by before update on public.pets
  for each row execute function private.keep_created_by();
create trigger keep_created_by before update on public.pet_events
  for each row execute function private.keep_created_by();

-- Access rules ----------------------------------------------------------------

alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.pets enable row level security;
alter table public.pet_events enable row level security;

-- Signed-out visitors get no table access at all.
revoke all on public.households, public.household_members, public.pets, public.pet_events
  from anon;
-- Households and memberships are read-only for the app.
revoke insert, update, delete, truncate on public.households, public.household_members
  from authenticated;

create policy "Members can read their household"
  on public.households for select to authenticated
  using (private.is_household_member(id));

create policy "Members can read their household's members"
  on public.household_members for select to authenticated
  using (private.is_household_member(household_id));

create policy "Members can read their household's pets"
  on public.pets for select to authenticated
  using (private.is_household_member(household_id));
create policy "Members can add pets to their household"
  on public.pets for insert to authenticated
  with check (
    private.is_household_member(household_id)
    and created_by = (select auth.uid())
  );
create policy "Members can edit their household's pets"
  on public.pets for update to authenticated
  using (private.is_household_member(household_id))
  with check (private.is_household_member(household_id));
create policy "Members can delete their household's pets"
  on public.pets for delete to authenticated
  using (private.is_household_member(household_id));

create policy "Members can read their household's events"
  on public.pet_events for select to authenticated
  using (private.is_household_member(household_id));
create policy "Members can add events to their household"
  on public.pet_events for insert to authenticated
  with check (
    private.is_household_member(household_id)
    and created_by = (select auth.uid())
  );
create policy "Members can edit their household's events"
  on public.pet_events for update to authenticated
  using (private.is_household_member(household_id))
  with check (private.is_household_member(household_id));
create policy "Members can delete their household's events"
  on public.pet_events for delete to authenticated
  using (private.is_household_member(household_id));

-- Pet photos ------------------------------------------------------------------

-- Private bucket; files live under <household_id>/<pet_id>/<file>.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'pet-photos',
  'pet-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
);

-- True when the first folder of a storage path is a household the signed-in user belongs to.
-- Compares as text so a malformed path is denied instead of raising a cast error.
create function private.is_household_member_path(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.household_members
    where household_id::text = (storage.foldername(object_name))[1]
      and user_id = (select auth.uid())
  );
$$;

revoke execute on function private.is_household_member_path(text) from public, anon;
grant execute on function private.is_household_member_path(text) to authenticated;

create policy "Members can read their household's pet photos"
  on storage.objects for select to authenticated
  using (bucket_id = 'pet-photos' and private.is_household_member_path(name));
create policy "Members can upload their household's pet photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'pet-photos' and private.is_household_member_path(name));
create policy "Members can replace their household's pet photos"
  on storage.objects for update to authenticated
  using (bucket_id = 'pet-photos' and private.is_household_member_path(name))
  with check (bucket_id = 'pet-photos' and private.is_household_member_path(name));
create policy "Members can delete their household's pet photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'pet-photos' and private.is_household_member_path(name));
