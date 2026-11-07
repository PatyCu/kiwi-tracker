-- Local development data, loaded by `supabase db reset` after the migrations.
-- Never run this against the shared project.
--
-- Two households with one member each, so household-scoped access can be
-- checked both ways: each member sees their own household and not the other.
--
-- Sign in locally with either account (password: kiwi-local-dev):
--   alex@kiwi.test — member of "Test Household"
--   sam@kiwi.test  — member of "Other Household"

-- Auth users ------------------------------------------------------------------

-- Token columns must be empty strings, not null, or Auth fails to load the user.
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
)
select
  '00000000-0000-0000-0000-000000000000',
  seed.id,
  'authenticated',
  'authenticated',
  seed.email,
  extensions.crypt('kiwi-local-dev', extensions.gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  now(),
  now(),
  '',
  '',
  '',
  ''
from (
  values
    ('11111111-1111-4111-8111-111111111111'::uuid, 'alex@kiwi.test'),
    ('22222222-2222-4222-8222-222222222222'::uuid, 'sam@kiwi.test')
) as seed (id, email);

-- Email sign-in needs a matching identity per user.
insert into auth.identities (
  id,
  user_id,
  provider_id,
  provider,
  identity_data,
  last_sign_in_at,
  created_at,
  updated_at
)
select
  gen_random_uuid(),
  users.id,
  users.id::text,
  'email',
  jsonb_build_object('sub', users.id::text, 'email', users.email, 'email_verified', true),
  now(),
  now(),
  now()
from auth.users as users
where users.email in ('alex@kiwi.test', 'sam@kiwi.test');

-- Households and members --------------------------------------------------------

insert into public.households (id, name)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Test Household'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Other Household');

insert into public.household_members (user_id, household_id, display_name)
values
  ('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Alex'),
  ('22222222-2222-4222-8222-222222222222', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Sam');

-- Pets and events ---------------------------------------------------------------

insert into public.pets (id, household_id, name, species, breed, birth_date)
values
  (
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Kiwi',
    'Cat',
    'European Shorthair',
    '2021-04-12'
  ),
  (
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'Biscuit',
    'Dog',
    null,
    null
  );

insert into public.pet_events (household_id, pet_id, type, occurred_at, symptom, note)
values (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  'symptom',
  now() - interval '1 day',
  'Hairball',
  'After breakfast.'
);
