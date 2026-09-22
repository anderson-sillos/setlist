begin;

select plan(10);

select is(
  (select count(*)::integer
   from pg_proc
   where pronamespace = 'public'::regnamespace
     and proname = 'leave_band'),
  1,
  'leave_band function exists'
);

do $$
declare
  owner_id uuid := '00000000-0000-0000-0000-000000000170';
  other_owner_id uuid := '00000000-0000-0000-0000-000000000171';
  member_id uuid := '00000000-0000-0000-0000-000000000172';
  band_id uuid := '00000000-0000-0000-0000-000000000173';
begin
  insert into auth.users (id, aud, role, email)
  values
    (owner_id, 'authenticated', 'authenticated', 'task-5-7-owner@example.test'),
    (other_owner_id, 'authenticated', 'authenticated', 'task-5-7-other-owner@example.test'),
    (member_id, 'authenticated', 'authenticated', 'task-5-7-member@example.test');
  insert into public.profiles (id, display_name)
  values
    (owner_id, 'Owner 5.7'),
    (other_owner_id, 'Other Owner 5.7'),
    (member_id, 'Member 5.7')
  on conflict (id) do update
  set display_name = excluded.display_name;
  insert into public.bands (id, name)
  values (band_id, 'Banda de teste 5.7');
  insert into public.band_members (band_id, user_id, role)
  values
    (band_id, owner_id, 'owner'),
    (band_id, other_owner_id, 'owner'),
    (band_id, member_id, 'member');
end;
$$;

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000172',
  true
);
select lives_ok(
  $$select public.leave_band('00000000-0000-0000-0000-000000000173')$$,
  'a Member can leave a band'
);
reset role;
select is(
  (select count(*)::integer
   from public.band_members
   where band_id = '00000000-0000-0000-0000-000000000173'),
  2,
  'leaving removes only the current membership'
);
set local role authenticated;
select throws_ok(
  $$select public.leave_band('00000000-0000-0000-0000-000000000173')$$,
  'P0001',
  null,
  'a person without membership cannot leave the band'
);

select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000170',
  true
);
select lives_ok(
  $$update public.band_members
    set role = 'member'
    where band_id = '00000000-0000-0000-0000-000000000173'
      and user_id = '00000000-0000-0000-0000-000000000171'$$,
  'an Owner can demote another Owner when one Owner remains'
);
select is(
  (select role from public.band_members
   where band_id = '00000000-0000-0000-0000-000000000173'
     and user_id = '00000000-0000-0000-0000-000000000171'),
  'member'::public.band_role,
  'the demoted Owner receives the requested role'
);
select throws_ok(
  $$update public.band_members
    set role = 'member'
    where band_id = '00000000-0000-0000-0000-000000000173'
      and user_id = '00000000-0000-0000-0000-000000000170'$$,
  'P0001',
  null,
  'the last Owner cannot be demoted'
);
select throws_ok(
  $$select public.leave_band('00000000-0000-0000-0000-000000000173')$$,
  'P0001',
  null,
  'the last Owner cannot leave a band with other members'
);

select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000171',
  true
);
select lives_ok(
  $$select public.leave_band('00000000-0000-0000-0000-000000000173')$$,
  'the remaining non-owner can leave'
);
reset role;
select is(
  (select count(*)::integer
   from public.band_members
   where band_id = '00000000-0000-0000-0000-000000000173'),
  1,
  'only the original Owner remains'
);

rollback;
