-- Local development data, loaded by `supabase db reset` after the migrations.
-- Never run this against the shared project.
--
-- Two accounts with one pet each, so per-pet access can be checked both ways:
-- each person sees their own pet and not the other's.
--
-- Sign in locally with either account (password: kiwi-local-dev):
--   alex@kiwi.test — owns Kiwi
--   sam@kiwi.test  — owns Biscuit

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

-- Pets and events ---------------------------------------------------------------

insert into public.pets (id, owner_id, name, species, breed, birth_date)
values
  (
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    '11111111-1111-4111-8111-111111111111',
    'Kiwi',
    'Cat',
    'European Shorthair',
    '2021-04-12'
  ),
  (
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    '22222222-2222-4222-8222-222222222222',
    'Biscuit',
    'Dog',
    null,
    null
  );

insert into public.pet_events (pet_id, type, occurred_at, symptom, note)
values (
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  'symptom',
  now() - interval '1 day',
  'Hairball',
  'After breakfast.'
);
