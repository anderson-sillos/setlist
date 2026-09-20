begin;

select plan(5);

do $$
declare
  owner_id uuid := '00000000-0000-0000-0000-000000000158';
  member_id uuid := '00000000-0000-0000-0000-000000000159';
  band_id uuid := '00000000-0000-0000-0000-000000000160';
begin
  insert into auth.users (
    id,
    aud,
    role,
    email,
    raw_user_meta_data
  )
  values
    (
      owner_id,
      'authenticated',
      'authenticated',
      'owner-5-5@example.test',
      '{"full_name":"Owner 5.5"}'::jsonb
    ),
    (
      member_id,
      'authenticated',
      'authenticated',
      'member-5-5@example.test',
      '{"name":"Member 5.5"}'::jsonb
    );
  insert into public.profiles (id)
  values (owner_id), (member_id);
  insert into public.bands (id, name)
  values (band_id, 'Banda de perfis 5.5');
  insert into public.band_members (band_id, user_id, role)
  values (band_id, owner_id, 'owner'), (band_id, member_id, 'member');
end;
$$;

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000158',
  true
);

select public.ensure_current_user_profile();
select is(
  (select display_name from public.profiles where id = '00000000-0000-0000-0000-000000000158'),
  'Owner 5.5',
  'profile receives the provider display name'
);
select is(
  (select email from public.profiles where id = '00000000-0000-0000-0000-000000000158'),
  'owner-5-5@example.test',
  'profile receives the provider email'
);

select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000159',
  true
);
select public.ensure_current_user_profile();
select is(
  (select display_name from public.profiles where id = '00000000-0000-0000-0000-000000000159'),
  'Member 5.5',
  'member profile receives the provider display name'
);
select is(
  (select email from public.profiles where id = '00000000-0000-0000-0000-000000000159'),
  'member-5-5@example.test',
  'member profile receives the provider email'
);
select is(
  (select count(*)::integer from public.band_members where band_id = '00000000-0000-0000-0000-000000000160'),
  2,
  'membership remains associated with the profile records'
);

rollback;
