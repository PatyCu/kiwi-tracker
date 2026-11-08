-- Pets belong to a household again, and every member of that household can
-- read, add, edit and delete its pets, events and pet photos.
-- Event and photo rules keep going through private.accessible_pet_ids(), so
-- only that function and the pets rules change; stored photo paths stay
-- <pet_id>/<file>.
--
-- This migration only changes the schema. Households and memberships are
-- created by hand on the shared project and by supabase/seed.sql locally.

-- Every pet now needs a household and there is no safe one to pick for
-- existing rows, so stop instead of guessing. Once real data lives here, a
-- later migration must carry it over instead (one household per owner, never
-- one shared household).
do $$
begin
  if exists (select 1 from public.pets)
    or exists (select 1 from public.pet_events)
    or exists (select 1 from storage.objects where bucket_id = 'pet-photos')
  then
    raise exception 'household_pets expects no pets, events or pet photos; move or remove them first';
  end if;
end;
$$;

-- Households and members ------------------------------------------------------

create table public.households (
  id uuid primary key default gen_random_uuid(),
  -- What members call their household, shown on the Today card.
  alias text not null check (length(btrim(alias)) > 0)
);

create table public.household_members (
  id uuid primary key default gen_random_uuid(),
  -- unique: each person belongs to one household.
  user_id uuid not null unique references auth.users (id) on delete cascade,
  household_id uuid not null references public.households (id) on delete cascade
);

create index household_members_household_id_idx on public.household_members (household_id);

-- True when the signed-in user belongs to the given household.
-- security definer so rules can use it without going through the
-- household_members rules.
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

-- Pets belong to a household instead of an owner ------------------------------

-- These rules read owner_id, so they go before the column.
drop policy "Owners can read their pets" on public.pets;
drop policy "People can add their own pets" on public.pets;
drop policy "Owners can edit their pets" on public.pets;
drop policy "Owners can delete their pets" on public.pets;

-- Deleting a household deletes its pets; deleting an account only removes the
-- membership, so the household keeps its pets.
alter table public.pets
  add column household_id uuid not null references public.households (id) on delete cascade;

create index pets_household_id_idx on public.pets (household_id);

-- Pets whose events and photos the signed-in user can use: every pet in their
-- household. security definer so it reads pets and memberships without going
-- through their access rules.
create or replace function private.accessible_pet_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select pets.id
  from public.pets
  join public.household_members as members
    on members.household_id = pets.household_id
  where members.user_id = (select auth.uid());
$$;

-- Dropping owner_id also drops its index.
alter table public.pets drop column owner_id;

-- Access rules ----------------------------------------------------------------

alter table public.households enable row level security;
alter table public.household_members enable row level security;

-- Signed-out visitors get no table access at all.
revoke all on public.households, public.household_members from anon;
-- Households and memberships are read-only for the app.
revoke insert, update, delete, truncate on public.households, public.household_members
  from authenticated;

create policy "Members can read their household"
  on public.households for select to authenticated
  using (private.is_household_member(id));
-- The app reads its own membership to learn which household to add pets to.
create policy "People can read their own membership"
  on public.household_members for select to authenticated
  using (user_id = (select auth.uid()));

-- Pets check the household directly: a function that reads pets can't see a
-- row inserted by the same statement, so insert ... returning would fail.
-- The update check keeps a pet from moving to a household the user isn't in.
create policy "Members can read their household's pets"
  on public.pets for select to authenticated
  using (private.is_household_member(household_id));
create policy "Members can add pets to their household"
  on public.pets for insert to authenticated
  with check (private.is_household_member(household_id));
create policy "Members can edit their household's pets"
  on public.pets for update to authenticated
  using (private.is_household_member(household_id))
  with check (private.is_household_member(household_id));
create policy "Members can delete their household's pets"
  on public.pets for delete to authenticated
  using (private.is_household_member(household_id));
