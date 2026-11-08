-- Members go by a display name in their household, and every member can see
-- who else is in it. The app lists members by name in Settings, never by email.

-- Existing members get the part of their email before the @ so the column can
-- be required; set their real names by hand afterwards.
alter table public.household_members add column display_name text;

update public.household_members as members
set display_name = split_part(users.email, '@', 1)
from auth.users as users
where users.id = members.user_id;

alter table public.household_members
  alter column display_name set not null,
  add constraint household_members_display_name_check check (length(btrim(display_name)) > 0);

-- Members can read every membership in their household, their own included.
drop policy "People can read their own membership" on public.household_members;
create policy "Members can read their household's members"
  on public.household_members for select to authenticated
  using (private.is_household_member(household_id));
