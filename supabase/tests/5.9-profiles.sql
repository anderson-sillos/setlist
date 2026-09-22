begin;

select plan(29);

select has_column(
  'public'::name,
  'profiles'::name,
  'provider_display_name'::name,
  'profiles stores the latest provider name separately'
);
select has_column(
  'public'::name,
  'profiles'::name,
  'display_name_source'::name,
  'profiles tracks whether its display name is provider or user supplied'
);
select is(
  (select count(*)::integer from pg_trigger
   where tgrelid = 'auth.users'::regclass
     and tgname = 'sync_profile_from_auth_user'
     and not tgisinternal),
  1,
  'auth.users has a profile synchronization trigger'
);
select is(
  (select count(*)::integer from pg_proc
   where pronamespace = 'public'::regnamespace
     and proname = 'update_my_display_name'),
  1,
  'the current-user display name RPC exists'
);

do $$
declare
  owner_id uuid := '00000000-0000-0000-0000-000000000591';
  member_id uuid := '00000000-0000-0000-0000-000000000592';
  band_id uuid := '00000000-0000-0000-0000-000000000593';
begin
  insert into auth.users (id, aud, role, email, raw_user_meta_data)
  values
    (
      owner_id,
      'authenticated',
      'authenticated',
      'owner-profile@example.test',
      '{"full_name":"Nome do Google","picture":"https://img.example.test/owner.png"}'::jsonb
    ),
    (
      member_id,
      'authenticated',
      'authenticated',
      'member-profile@example.test',
      '{"name":"Membro do Google","avatar_url":"https://img.example.test/member.png"}'::jsonb
    );
  insert into public.bands (id, name)
  values (band_id, 'Banda de perfis 5.9');
  insert into public.band_members (band_id, user_id, role)
  values (band_id, owner_id, 'owner'), (band_id, member_id, 'member');
end;
$$;

select is(
  (select display_name from public.profiles
   where id = '00000000-0000-0000-0000-000000000591'),
  'Nome do Google',
  'new profiles initially use the provider display name'
);
select is(
  (select provider_display_name from public.profiles
   where id = '00000000-0000-0000-0000-000000000591'),
  'Nome do Google',
  'the provider display name is stored separately'
);
select is(
  (select email from public.profiles
   where id = '00000000-0000-0000-0000-000000000591'),
  'owner-profile@example.test',
  'the provider email is synchronized'
);
select is(
  (select avatar_url from public.profiles
   where id = '00000000-0000-0000-0000-000000000591'),
  'https://img.example.test/owner.png',
  'the provider avatar is synchronized'
);
select is(
  (select display_name from public.profiles
   where id = '00000000-0000-0000-0000-000000000592'),
  'Membro do Google',
  'the profile also accepts the provider name alias'
);
select is(
  (select display_name_source from public.profiles
   where id = '00000000-0000-0000-0000-000000000591'),
  'provider',
  'provider names are marked as provider supplied'
);

update auth.users
set email = 'owner-profile-updated@example.test',
    raw_user_meta_data = '{"name":"Nome Google Atualizado","avatar_url":"https://img.example.test/owner-2.png"}'::jsonb
where id = '00000000-0000-0000-0000-000000000591';

select is(
  (select provider_display_name from public.profiles
   where id = '00000000-0000-0000-0000-000000000591'),
  'Nome Google Atualizado',
  'provider name changes are synchronized'
);
select is(
  (select display_name from public.profiles
   where id = '00000000-0000-0000-0000-000000000591'),
  'Nome Google Atualizado',
  'the displayed name follows provider changes before customization'
);
select is(
  (select email from public.profiles
   where id = '00000000-0000-0000-0000-000000000591'),
  'owner-profile-updated@example.test',
  'provider email changes are synchronized'
);
select is(
  (select avatar_url from public.profiles
   where id = '00000000-0000-0000-0000-000000000591'),
  'https://img.example.test/owner-2.png',
  'provider avatar changes are synchronized'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000591',
  true
);
select lives_ok(
  $$select public.update_my_display_name('Nome Setlist')$$,
  'an authenticated user can update their own display name'
);
select is(
  (select display_name from public.profiles
   where id = '00000000-0000-0000-0000-000000000591'),
  'Nome Setlist',
  'the selected display name is persisted'
);
select is(
  (select display_name_source from public.profiles
   where id = '00000000-0000-0000-0000-000000000591'),
  'user',
  'a user-edited name is marked as user supplied'
);
select throws_ok(
  $$update public.profiles
    set provider_display_name = 'Nome adulterado'
    where id = '00000000-0000-0000-0000-000000000591'$$,
  '42501',
  null,
  'the client cannot directly update synchronized profile fields'
);
select throws_ok(
  $$select public.update_my_display_name('   ')$$,
  'P0001',
  'PROFILE_DISPLAY_NAME_INVALID',
  'a blank display name is rejected'
);
select throws_ok(
  $$select public.update_my_display_name(repeat('x', 121))$$,
  'P0001',
  'PROFILE_DISPLAY_NAME_INVALID',
  'a display name longer than 120 characters is rejected'
);

reset role;
update auth.users
set email = 'owner-profile-final@example.test',
    raw_user_meta_data = '{"full_name":"Nome do provedor final","picture":"https://img.example.test/owner-3.png"}'::jsonb
where id = '00000000-0000-0000-0000-000000000591';

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000591',
  true
);
select is(
  (select provider_display_name from public.profiles
   where id = '00000000-0000-0000-0000-000000000591'),
  'Nome do provedor final',
  'the latest provider name continues to synchronize'
);
select is(
  (select display_name from public.profiles
   where id = '00000000-0000-0000-0000-000000000591'),
  'Nome Setlist',
  'a later provider login does not overwrite the user display name'
);
select is(
  (select email from public.profiles
   where id = '00000000-0000-0000-0000-000000000591'),
  'owner-profile-final@example.test',
  'email continues to synchronize after display name customization'
);
select is(
  (select avatar_url from public.profiles
   where id = '00000000-0000-0000-0000-000000000591'),
  'https://img.example.test/owner-3.png',
  'avatar continues to synchronize after display name customization'
);

select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000592',
  true
);
select lives_ok(
  $$select public.update_my_display_name('Nome próprio do membro')$$,
  'a second authenticated user can update their own profile'
);
select is(
  (select display_name from public.profiles
   where id = '00000000-0000-0000-0000-000000000592'),
  'Nome próprio do membro',
  'the RPC updates the profile identified by the authenticated user'
);
select is(
  (select display_name from public.profiles
   where id = '00000000-0000-0000-0000-000000000591'),
  'Nome Setlist',
  'another user cannot change the first user profile through the RPC'
);
select ok(
  has_function_privilege(
    'authenticated',
    'public.update_my_display_name(text)',
    'EXECUTE'
  ),
  'authenticated users can execute the own-profile RPC'
);
select ok(
  not has_table_privilege('authenticated', 'public.profiles', 'UPDATE'),
  'authenticated users cannot update profile rows directly'
);

rollback;
