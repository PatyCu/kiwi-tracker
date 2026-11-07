-- Replace households with per-pet ownership.
-- Each pet has one owner. Events and photos carry only their pet, and their
-- access rules go through private.accessible_pet_ids(), so sharing a pet with
-- other people later changes rules and that function, not the stored rows or
-- photo paths.

-- There is no safe owner to give existing rows, so stop instead of guessing.
do $$
begin
  if exists (select 1 from public.pets)
    or exists (select 1 from public.pet_events)
    or exists (select 1 from storage.objects where bucket_id = 'pet-photos')
  then
    raise exception 'per_pet_ownership expects no pets, events or pet photos; move or remove them first';
  end if;
end;
$$;

-- Household access rules ------------------------------------------------------

drop policy "Members can read their household" on public.households;
drop policy "Members can read their household's members" on public.household_members;

drop policy "Members can read their household's pets" on public.pets;
drop policy "Members can add pets to their household" on public.pets;
drop policy "Members can edit their household's pets" on public.pets;
drop policy "Members can delete their household's pets" on public.pets;

drop policy "Members can read their household's events" on public.pet_events;
drop policy "Members can add events to their household" on public.pet_events;
drop policy "Members can edit their household's events" on public.pet_events;
drop policy "Members can delete their household's events" on public.pet_events;

drop policy "Members can read their household's pet photos" on storage.objects;
drop policy "Members can upload their household's pet photos" on storage.objects;
drop policy "Members can replace their household's pet photos" on storage.objects;
drop policy "Members can delete their household's pet photos" on storage.objects;

drop function private.is_household_member(uuid);
drop function private.is_household_member_path(text);

-- Events reference only their pet ---------------------------------------------

alter table public.pet_events drop constraint pet_events_pet_fkey;
drop index public.pet_events_pet_timeline_idx;
drop index public.pet_events_household_timeline_idx;
alter table public.pet_events drop column household_id;

alter table public.pet_events
  add constraint pet_events_pet_id_fkey foreign key (pet_id)
    references public.pets (id) on delete cascade;

-- Per-pet timeline; also serves the pet_id foreign key.
create index pet_events_pet_timeline_idx on public.pet_events (pet_id, occurred_at desc);

-- Pets have an owner instead of a household -----------------------------------

alter table public.pets drop constraint pets_household_id_id_key;
alter table public.pets drop column household_id;

-- The owner is whoever adds the pet; deleting the account deletes their pets.
alter table public.pets
  add column owner_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade;

create index pets_owner_id_idx on public.pets (owner_id);

drop table public.household_members;
drop table public.households;

-- Access rules ----------------------------------------------------------------

-- Pets whose events and photos the signed-in user can use. Today that is the
-- pets they own. security definer so it reads pets without going through
-- their access rules.
create function private.accessible_pet_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id
  from public.pets
  where owner_id = (select auth.uid());
$$;

revoke execute on function private.accessible_pet_ids() from public, anon;
grant execute on function private.accessible_pet_ids() to authenticated;

-- Pets check the owner directly: a function that reads pets can't see a row
-- inserted by the same statement, so insert ... returning would fail.
-- Sharing later adds the shared pets to this read rule.
create policy "Owners can read their pets"
  on public.pets for select to authenticated
  using (owner_id = (select auth.uid()));
-- Adding, editing and deleting a pet stay with its owner, and the owner can't
-- hand a pet to someone else.
create policy "People can add their own pets"
  on public.pets for insert to authenticated
  with check (owner_id = (select auth.uid()));
create policy "Owners can edit their pets"
  on public.pets for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
create policy "Owners can delete their pets"
  on public.pets for delete to authenticated
  using (owner_id = (select auth.uid()));

create policy "People can read events for pets they have access to"
  on public.pet_events for select to authenticated
  using (pet_id in (select private.accessible_pet_ids()));
create policy "People can add events for pets they have access to"
  on public.pet_events for insert to authenticated
  with check (pet_id in (select private.accessible_pet_ids()));
create policy "People can edit events for pets they have access to"
  on public.pet_events for update to authenticated
  using (pet_id in (select private.accessible_pet_ids()))
  with check (pet_id in (select private.accessible_pet_ids()));
create policy "People can delete events for pets they have access to"
  on public.pet_events for delete to authenticated
  using (pet_id in (select private.accessible_pet_ids()));

-- Pet photos ------------------------------------------------------------------

-- Files live under <pet_id>/<file>. Compares as text so a malformed path is
-- denied instead of raising a cast error.
create policy "People can read photos of pets they have access to"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'pet-photos'
    and (storage.foldername(name))[1] in (
      select pet_id::text from private.accessible_pet_ids() as pet_id
    )
  );
create policy "People can upload photos of pets they have access to"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'pet-photos'
    and (storage.foldername(name))[1] in (
      select pet_id::text from private.accessible_pet_ids() as pet_id
    )
  );
create policy "People can replace photos of pets they have access to"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'pet-photos'
    and (storage.foldername(name))[1] in (
      select pet_id::text from private.accessible_pet_ids() as pet_id
    )
  )
  with check (
    bucket_id = 'pet-photos'
    and (storage.foldername(name))[1] in (
      select pet_id::text from private.accessible_pet_ids() as pet_id
    )
  );
create policy "People can delete photos of pets they have access to"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'pet-photos'
    and (storage.foldername(name))[1] in (
      select pet_id::text from private.accessible_pet_ids() as pet_id
    )
  );
