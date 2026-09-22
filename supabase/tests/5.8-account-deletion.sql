begin;

select plan(16);

select is(
  (select count(*)::integer
   from pg_proc
   where pronamespace = 'public'::regnamespace
     and proname = 'delete_account'),
  1,
  'delete_account function exists'
);

do $$
declare
  member_id uuid := '00000000-0000-0000-0000-000000000261';
  owner_id uuid := '00000000-0000-0000-0000-000000000262';
  other_owner_id uuid := '00000000-0000-0000-0000-000000000263';
  blocked_owner_id uuid := '00000000-0000-0000-0000-000000000264';
  blocked_member_id uuid := '00000000-0000-0000-0000-000000000265';
  solo_owner_id uuid := '00000000-0000-0000-0000-000000000266';
  member_band_id uuid := '00000000-0000-0000-0000-000000000267';
  owner_band_id uuid := '00000000-0000-0000-0000-000000000268';
  blocked_band_id uuid := '00000000-0000-0000-0000-000000000269';
  solo_band_id uuid := '00000000-0000-0000-0000-000000000270';
  song_id uuid := '00000000-0000-0000-0000-000000000271';
begin
  insert into auth.users (id, aud, role, email)
  values
    (member_id, 'authenticated', 'authenticated', 'task-5-8-member@example.test'),
    (owner_id, 'authenticated', 'authenticated', 'task-5-8-owner@example.test'),
    (other_owner_id, 'authenticated', 'authenticated', 'task-5-8-other-owner@example.test'),
    (blocked_owner_id, 'authenticated', 'authenticated', 'task-5-8-blocked@example.test'),
    (blocked_member_id, 'authenticated', 'authenticated', 'task-5-8-blocked-member@example.test'),
    (solo_owner_id, 'authenticated', 'authenticated', 'task-5-8-solo@example.test');

  insert into public.profiles (id, display_name)
  values
    (member_id, 'Member 5.8'),
    (owner_id, 'Owner 5.8'),
    (other_owner_id, 'Other Owner 5.8'),
    (blocked_owner_id, 'Blocked Owner 5.8'),
    (blocked_member_id, 'Blocked Member 5.8'),
    (solo_owner_id, 'Solo Owner 5.8')
  on conflict (id) do update
  set display_name = excluded.display_name;

  insert into public.bands (id, name)
  values
    (member_band_id, 'Banda do Member 5.8'),
    (owner_band_id, 'Banda dos Owners 5.8'),
    (blocked_band_id, 'Banda do Último Owner 5.8'),
    (solo_band_id, 'Banda Solo 5.8');

  insert into public.band_members (band_id, user_id, role)
  values
    (member_band_id, member_id, 'member'),
    (owner_band_id, owner_id, 'owner'),
    (owner_band_id, other_owner_id, 'owner'),
    (blocked_band_id, blocked_owner_id, 'owner'),
    (blocked_band_id, blocked_member_id, 'member'),
    (solo_band_id, solo_owner_id, 'owner');

  insert into public.songs (id, band_id, title)
  values (song_id, member_band_id, 'Conteúdo preservado 5.8');

  insert into public.legal_acceptances (band_id, user_id, term_version)
  values (member_band_id, member_id, '2026-09');

  insert into public.invitations (
    band_id,
    token_hash,
    created_by,
    used_by
  )
  values (
    member_band_id,
    encode(extensions.digest('task-5-8-anonymization', 'sha256'), 'hex'),
    member_id,
    member_id
  );
end;
$$;

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000261',
  true
);

select lives_ok(
  $$select public.delete_account()$$,
  'a Member can delete their account'
);
reset role;
select is(
  (select count(*)::integer from auth.users
   where id = '00000000-0000-0000-0000-000000000261'),
  0,
  'account deletion removes the auth user'
);
select is(
  (select count(*)::integer from public.profiles
   where id = '00000000-0000-0000-0000-000000000261'),
  0,
  'account deletion removes the public profile'
);
select is(
  (select count(*)::integer from public.band_members
   where user_id = '00000000-0000-0000-0000-000000000261'),
  0,
  'account deletion removes the memberships of the person'
);
select is(
  (select count(*)::integer from public.bands
   where id = '00000000-0000-0000-0000-000000000267'),
  1,
  'account deletion preserves the band'
);
select is(
  (select count(*)::integer from public.songs
   where id = '00000000-0000-0000-0000-000000000271'),
  1,
  'account deletion preserves band content'
);
select is(
  (select count(*)::integer from public.legal_acceptances
   where band_id = '00000000-0000-0000-0000-000000000267'
     and user_id is null),
  1,
  'legal acceptance authorship is anonymized'
);
select is(
  (select count(*)::integer from public.invitations
   where band_id = '00000000-0000-0000-0000-000000000267'
     and created_by is null
     and used_by is null),
  1,
  'invitation references are anonymized'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000262',
  true
);
select lives_ok(
  $$select public.delete_account()$$,
  'an Owner can delete their account when another Owner remains'
);
reset role;
select is(
  (select count(*)::integer from public.bands
   where id = '00000000-0000-0000-0000-000000000268'),
  1,
  'the band remains after an Owner leaves by account deletion'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000264',
  true
);
select throws_ok(
  $$select public.delete_account()$$,
  'P0001',
  'ACCOUNT_LAST_OWNER_REQUIRED',
  'the last Owner cannot delete an account while other members remain'
);

select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000266',
  true
);
select throws_ok(
  $$select public.delete_account()$$,
  'P0001',
  'ACCOUNT_SOLO_BAND_REQUIRED',
  'a solo Owner must delete the band before the account'
);
select lives_ok(
  $$select public.delete_band('00000000-0000-0000-0000-000000000270')$$,
  'the solo Owner can delete the band first'
);
select lives_ok(
  $$select public.delete_account()$$,
  'the solo Owner can delete the account after the band'
);
reset role;
select is(
  (select count(*)::integer from auth.users
   where id = '00000000-0000-0000-0000-000000000266'),
  0,
  'the solo Owner auth user is removed after the band'
);

select * from finish();

rollback;
