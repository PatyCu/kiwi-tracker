-- Local development data, loaded by `supabase db reset` after the migrations.
-- Never run this against the shared project.
--
-- Shaped like the shared project: two accounts share one household, and a
-- third account in its own household checks that outsiders see nothing. The
-- shared household has two pets, so views can show every pet or one, and the
-- outsider's household has one, so access can be checked both ways. A
-- fourth account's household has no pets yet, like a new account's.
--
-- Sign in locally with any of these accounts:
--
--   Email             Password        Name    Household (alias, id)                              Sees
--   alex@kiwi.test    kiwi-local-dev  Alex    Alex's home  aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa  Kiwi (cat) and Luna (dog), with events and plans around today
--   jordan@kiwi.test  kiwi-local-dev  Jordan  Alex's home  aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa  Kiwi (cat) and Luna (dog), with events and plans around today
--   sam@kiwi.test     kiwi-local-dev  Sam     Sam's home   bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb  Biscuit (dog, no events)
--   riley@kiwi.test   kiwi-local-dev  Riley   Riley's home eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee  No pets

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
    ('22222222-2222-4222-8222-222222222222'::uuid, 'sam@kiwi.test'),
    ('33333333-3333-4333-8333-333333333333'::uuid, 'jordan@kiwi.test'),
    ('44444444-4444-4444-8444-444444444444'::uuid, 'riley@kiwi.test')
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
where users.email in ('alex@kiwi.test', 'sam@kiwi.test', 'jordan@kiwi.test', 'riley@kiwi.test');

-- Households --------------------------------------------------------------------

insert into public.households (id, alias)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Alex''s home'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Sam''s home'),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'Riley''s home');

insert into public.household_members (user_id, household_id, display_name)
values
  ('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Alex'),
  ('22222222-2222-4222-8222-222222222222', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Sam'),
  ('33333333-3333-4333-8333-333333333333', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Jordan'),
  ('44444444-4444-4444-8444-444444444444', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'Riley');

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
    'ffffffff-ffff-4fff-8fff-ffffffffffff',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Luna',
    'Dog',
    'Beagle',
    '2022-09-03'
  ),
  (
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'Biscuit',
    'Dog',
    null,
    null
  );

insert into public.pet_events (pet_id, type, occurred_at, symptom, note)
values
  (
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    'symptom',
    now() - interval '1 day',
    'Hairball',
    'After breakfast.'
  ),
  ('ffffffff-ffff-4fff-8fff-ffffffffffff', 'symptom', now() - interval '2 hours', 'Vomiting', null);

-- Several things on one day, so a calendar day has more than fit in its cell.
insert into public.pet_events (pet_id, type, occurred_at, title)
values
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'other', now() - interval '3 hours', 'Weigh-in'),
  ('ffffffff-ffff-4fff-8fff-ffffffffffff', 'other', now() - interval '4 hours', 'Groomer'),
  ('ffffffff-ffff-4fff-8fff-ffffffffffff', 'other', now() - interval '6 days', 'Long walk');

insert into public.calendar_events (pet_id, title, starts_at, ends_at, location, description)
values
  (
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    'Annual vaccines',
    date_trunc('hour', now()) + interval '3 days',
    date_trunc('hour', now()) + interval '3 days 1 hour',
    'Riverside Vet Clinic',
    'Bring the vaccination card.'
  ),
  (
    'ffffffff-ffff-4fff-8fff-ffffffffffff',
    'Deworming',
    date_trunc('hour', now()) + interval '1 hour',
    date_trunc('hour', now()) + interval '90 minutes',
    null,
    null
  );
