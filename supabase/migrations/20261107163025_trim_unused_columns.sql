-- Keep only the columns the app uses.
-- pet_events.created_at stays: it records when an event was logged and orders
-- diet changes that share the same occurred_at.

-- Insert policies check created_by, so they go before the column.
drop policy "Members can add pets to their household" on public.pets;
drop policy "Members can add events to their household" on public.pet_events;

drop trigger set_updated_at on public.households;
drop trigger set_updated_at on public.household_members;
drop trigger set_updated_at on public.pets;
drop trigger set_updated_at on public.pet_events;
drop trigger keep_created_by on public.pets;
drop trigger keep_created_by on public.pet_events;

drop function private.set_updated_at();
drop function private.keep_created_by();

-- Dropping created_by also drops its index.
alter table public.households drop column created_at, drop column updated_at;
alter table public.household_members drop column created_at, drop column updated_at;
alter table public.pets drop column created_at, drop column updated_at, drop column created_by;
alter table public.pet_events drop column updated_at, drop column created_by;

create policy "Members can add pets to their household"
  on public.pets for insert to authenticated
  with check (private.is_household_member(household_id));
create policy "Members can add events to their household"
  on public.pet_events for insert to authenticated
  with check (private.is_household_member(household_id));
