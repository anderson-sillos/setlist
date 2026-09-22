begin;

select plan(30);

select has_table('public'::name, 'profiles'::name, 'profiles exists');
select has_table('public'::name, 'bands'::name, 'bands exists');
select has_table('public'::name, 'band_members'::name, 'band_members exists');
select has_table(
  'public'::name,
  'legal_acceptances'::name,
  'legal_acceptances exists'
);

select col_is_pk(
  'public'::name,
  'profiles'::name,
  'id'::name,
  'profiles id is the primary key'
);
select col_is_pk(
  'public'::name,
  'bands'::name,
  'id'::name,
  'bands id is the primary key'
);
select col_is_pk(
  'public'::name,
  'band_members'::name,
  'id'::name,
  'band_members id is the primary key'
);
select col_is_pk(
  'public'::name,
  'legal_acceptances'::name,
  'id'::name,
  'legal_acceptances id is the primary key'
);

select col_not_null(
  'public'::name,
  'bands'::name,
  'name'::name,
  'band name is required'
);
select col_not_null(
  'public'::name,
  'band_members'::name,
  'band_id'::name,
  'membership band is required'
);
select col_not_null(
  'public'::name,
  'band_members'::name,
  'user_id'::name,
  'membership user is required'
);
select col_not_null(
  'public'::name,
  'band_members'::name,
  'role'::name,
  'membership role is required'
);
select col_not_null(
  'public'::name,
  'legal_acceptances'::name,
  'band_id'::name,
  'legal acceptance band is required'
);
select col_not_null(
  'public'::name,
  'legal_acceptances'::name,
  'term_version'::name,
  'legal acceptance version is required'
);

select is(
  (select count(*)::integer
   from pg_constraint
   where conrelid = 'public.bands'::regclass
     and conname = 'bands_name_not_blank'),
  1,
  'band name has a non-blank check'
);
select is(
  (select count(*)::integer
   from pg_constraint
   where conrelid = 'public.bands'::regclass
     and conname = 'bands_name_length'),
  1,
  'band name has a length check'
);
select is(
  (select count(*)::integer
   from pg_constraint
   where conrelid = 'public.legal_acceptances'::regclass
     and conname = 'legal_acceptances_term_version_not_blank'),
  1,
  'legal acceptance version has a non-blank check'
);

select fk_ok(
  'public'::name,
  'profiles'::name,
  'id'::name,
  'auth'::name,
  'users'::name,
  'id'::name,
  'profile references auth user'
);
select fk_ok(
  'public'::name,
  'band_members'::name,
  'band_id'::name,
  'public'::name,
  'bands'::name,
  'id'::name,
  'membership references band'
);
select fk_ok(
  'public'::name,
  'band_members'::name,
  'user_id'::name,
  'public'::name,
  'profiles'::name,
  'id'::name,
  'membership references profile'
);
select fk_ok(
  'public'::name,
  'legal_acceptances'::name,
  'band_id'::name,
  'public'::name,
  'bands'::name,
  'id'::name,
  'legal acceptance references band'
);
select fk_ok(
  'public'::name,
  'legal_acceptances'::name,
  'user_id'::name,
  'public'::name,
  'profiles'::name,
  'id'::name,
  'legal acceptance references profile'
);

select is(
  (select count(*)::integer
   from pg_constraint
   where conrelid = 'public.band_members'::regclass
     and conname = 'band_members_band_user_key'),
  1,
  'a user can have only one membership per band'
);

select is(
  (select relrowsecurity from pg_class where oid = 'public.profiles'::regclass),
  true,
  'profiles has row level security enabled'
);
select is(
  (select relrowsecurity from pg_class where oid = 'public.bands'::regclass),
  true,
  'bands has row level security enabled'
);
select is(
  (select relrowsecurity from pg_class where oid = 'public.band_members'::regclass),
  true,
  'band_members has row level security enabled'
);
select is(
  (select relrowsecurity from pg_class where oid = 'public.legal_acceptances'::regclass),
  true,
  'legal_acceptances has row level security enabled'
);

do $$
declare
  test_user_id uuid := '00000000-0000-0000-0000-000000000042';
  test_band_id uuid := '00000000-0000-0000-0000-000000000043';
begin
  insert into auth.users (id, aud, role, email)
  values (test_user_id, 'authenticated', 'authenticated', 'task-4-2@example.test');

  insert into public.profiles (id, display_name, email)
  values (test_user_id, 'Teste 4.2', 'task-4-2@example.test')
  on conflict (id) do update
  set display_name = excluded.display_name,
      email = excluded.email;

  insert into public.bands (id, name)
  values (test_band_id, 'Banda de teste 4.2');

  insert into public.band_members (band_id, user_id, role)
  values (test_band_id, test_user_id, 'owner');

  insert into public.legal_acceptances (band_id, user_id, term_version)
  values (test_band_id, test_user_id, '2026-09-18');
end;
$$;

delete from auth.users
where id = '00000000-0000-0000-0000-000000000042';

select is(
  (select count(*)::integer
   from public.band_members
   where user_id = '00000000-0000-0000-0000-000000000042'),
  0,
  'deleting a user removes its band memberships'
);
select is(
  (select count(*)::integer
   from public.legal_acceptances
   where user_id is null
     and band_id = '00000000-0000-0000-0000-000000000043'),
  1,
  'deleting a user anonymizes its legal acceptance'
);

delete from public.bands
where id = '00000000-0000-0000-0000-000000000043';

select is(
  (select count(*)::integer
   from public.legal_acceptances
   where band_id = '00000000-0000-0000-0000-000000000043'),
  0,
  'deleting a band removes its legal acceptances'
);

select * from finish();

rollback;
