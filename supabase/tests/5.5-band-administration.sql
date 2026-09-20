begin;

select plan(6);

do $$
declare
  owner_id uuid := '00000000-0000-0000-0000-000000000155';
  member_id uuid := '00000000-0000-0000-0000-000000000156';
  band_id uuid := '00000000-0000-0000-0000-000000000157';
begin
  insert into auth.users (id, aud, role, email)
  values
    (owner_id, 'authenticated', 'authenticated', 'task-5-5-owner@example.test'),
    (member_id, 'authenticated', 'authenticated', 'task-5-5-member@example.test');
  insert into public.profiles (id, display_name)
  values (owner_id, 'Owner 5.5'), (member_id, 'Member 5.5');
  insert into public.bands (id, name)
  values (band_id, 'Banda 5.5');
  insert into public.band_members (band_id, user_id, role)
  values (band_id, owner_id, 'owner'), (band_id, member_id, 'member');
end;
$$;

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000155',
  true
);

update public.bands
set name = 'Banda 5.5 atualizada'
where id = '00000000-0000-0000-0000-000000000157';
select is(
  (select name from public.bands where id = '00000000-0000-0000-0000-000000000157'),
  'Banda 5.5 atualizada',
  'Owner can update the band name'
);

select throws_ok(
  $$select public.delete_band('00000000-0000-0000-0000-000000000157')$$,
  'P0001',
  'BAND_MUST_BE_SOLO_OWNER',
  'a band with other members cannot be deleted'
);

delete from public.band_members
where band_id = '00000000-0000-0000-0000-000000000157'
  and user_id = '00000000-0000-0000-0000-000000000156';
select is(
  (select count(*)::integer
   from public.band_members
   where band_id = '00000000-0000-0000-0000-000000000157'),
  1,
  'Owner can remove the remaining member before deletion'
);

select lives_ok(
  $$select public.delete_band('00000000-0000-0000-0000-000000000157')$$,
  'the only Owner can delete the band'
);
select is(
  (select count(*)::integer
   from public.bands
   where id = '00000000-0000-0000-0000-000000000157'),
  0,
  'deleting a band removes the band record'
);
select is(
  (select count(*)::integer
   from public.band_members
   where band_id = '00000000-0000-0000-0000-000000000157'),
  0,
  'deleting a band removes its memberships'
);

rollback;
