begin;

select plan(11);

do $$
declare
  test_user_id uuid := '00000000-0000-0000-0000-000000000154';
begin
  insert into auth.users (id, aud, role, email)
  values (test_user_id, 'authenticated', 'authenticated', 'task-5-4@example.test');
end;
$$;

set local role authenticated;

select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000154',
  true
);

select ok(
  public.create_band('Banda do Aceite', '2026-09', true) is not null,
  'authenticated user can create a band with the current term'
);
select is(
  (select count(*)::integer
   from public.profiles
   where id = '00000000-0000-0000-0000-000000000154'),
  1,
  'creation ensures the authenticated user profile exists'
);
select is(
  (select count(*)::integer
   from public.bands
   where name = 'Banda do Aceite'),
  1,
  'creation records the band'
);
select is(
  (select count(*)::integer
   from public.band_members
   join public.bands on bands.id = band_members.band_id
   where bands.name = 'Banda do Aceite'
     and band_members.user_id = '00000000-0000-0000-0000-000000000154'
     and band_members.role = 'owner'),
  1,
  'creation records the user as Owner'
);
select is(
  (select term_version
   from public.legal_acceptances
   join public.bands on bands.id = legal_acceptances.band_id
   where bands.name = 'Banda do Aceite'
     and legal_acceptances.user_id = '00000000-0000-0000-0000-000000000154'),
  '2026-09',
  'creation records the accepted term version'
);
select ok(
  (select accepted_at <= clock_timestamp()
   from public.legal_acceptances
   join public.bands on bands.id = legal_acceptances.band_id
   where bands.name = 'Banda do Aceite'
     and legal_acceptances.user_id = '00000000-0000-0000-0000-000000000154'),
  'creation records the acceptance timestamp on the server'
);
select throws_ok(
  $$select public.create_band('Banda inválida', '', true)$$,
  'P0001',
  'TERM_VERSION_REQUIRED',
  'an empty term version is rejected'
);
select throws_ok(
  $$select public.create_band('', '2026-09', true)$$,
  'P0001',
  'BAND_NAME_INVALID',
  'an empty band name is rejected'
);
select throws_ok(
  $$select public.create_band('Banda sem aceite', '2026-09', false)$$,
  'P0001',
  'ACCEPTANCE_REQUIRED',
  'an explicit term acceptance is required by the database'
);
select is(
  (select count(*)::integer
   from public.bands
   where name = 'Banda inválida'),
  0,
  'rejected creation does not persist a band'
);
select is(
  (select count(*)::integer
   from public.legal_acceptances
   where user_id = '00000000-0000-0000-0000-000000000154'),
  1,
  'rejected creation does not persist another acceptance'
);

rollback;
