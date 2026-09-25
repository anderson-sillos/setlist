begin;

select plan(14);

do $$
declare
  owner_id uuid := '00000000-0000-0000-0000-000000000641';
  editor_id uuid := '00000000-0000-0000-0000-000000000642';
  member_id uuid := '00000000-0000-0000-0000-000000000643';
  band_id uuid := '00000000-0000-0000-0000-000000000644';
  song_id uuid := '00000000-0000-0000-0000-000000000645';
begin
  insert into auth.users (id, aud, role, email)
  values
    (owner_id, 'authenticated', 'authenticated', 'task-6-4-owner@example.test'),
    (editor_id, 'authenticated', 'authenticated', 'task-6-4-editor@example.test'),
    (member_id, 'authenticated', 'authenticated', 'task-6-4-member@example.test');

  insert into public.bands (id, name)
  values (band_id, 'Banda de aceite 6.4');

  insert into public.band_members (band_id, user_id, role)
  values
    (band_id, owner_id, 'owner'),
    (band_id, editor_id, 'editor'),
    (band_id, member_id, 'member');

  insert into public.songs (id, band_id, title)
  values (song_id, band_id, 'Música já publicada');
end;
$$;

select is(
  public.current_legal_term_version(),
  '2026-09',
  'the database exposes the current legal-term version'
);

set local role authenticated;

select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000641',
  true
);
select is(
  (select count(*)::integer from public.songs),
  1,
  'Owner reads the repertoire before accepting the current term'
);
select throws_ok(
  $$insert into public.songs (band_id, title)
    values ('00000000-0000-0000-0000-000000000644', 'Bloqueada para Owner')$$,
  '42501',
  null,
  'Owner cannot create a song before accepting the current term'
);
select ok(
  public.accept_current_band_term(
    '00000000-0000-0000-0000-000000000644',
    '2026-09'
  ) is not null,
  'Owner registers the current-term acceptance with a server timestamp'
);
select is(
  (select count(*)::integer from public.legal_acceptances
   where band_id = '00000000-0000-0000-0000-000000000644'
     and user_id = '00000000-0000-0000-0000-000000000641'
     and term_version = '2026-09'),
  1,
  'Owner acceptance is persisted for the current version'
);
insert into public.songs (band_id, title)
values ('00000000-0000-0000-0000-000000000644', 'Criada pelo Owner');
select is(
  (select count(*)::integer from public.songs),
  2,
  'Owner can create songs after accepting the current term'
);
select throws_ok(
  $$select public.accept_current_band_term(
      '00000000-0000-0000-0000-000000000644',
      '2026-08'
    )$$,
  'P0001',
  'TERM_VERSION_NOT_CURRENT',
  'a stale term version cannot be accepted'
);
select throws_ok(
  $$insert into public.legal_acceptances (band_id, user_id, term_version)
    values (
      '00000000-0000-0000-0000-000000000644',
      '00000000-0000-0000-0000-000000000641',
      '2026-09'
    )$$,
  '42501',
  null,
  'direct legal-acceptance writes are denied'
);

select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000642',
  true
);
select is(
  (select count(*)::integer from public.songs),
  2,
  'Editor reads the repertoire before accepting the current term'
);
select throws_ok(
  $$update public.songs
    set notes = 'Bloqueada para Editor'
    where id = '00000000-0000-0000-0000-000000000645'$$,
  '42501',
  null,
  'Editor cannot update a song before accepting the current term'
);
select ok(
  public.accept_current_band_term(
    '00000000-0000-0000-0000-000000000644',
    '2026-09'
  ) is not null,
  'Editor registers the current-term acceptance'
);
update public.songs
set notes = 'Editada pelo Editor'
where id = '00000000-0000-0000-0000-000000000645';
select is(
  (select notes from public.songs
   where id = '00000000-0000-0000-0000-000000000645'),
  'Editada pelo Editor',
  'Editor can update a song after accepting the current term'
);

select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000643',
  true
);
select is(
  (select count(*)::integer from public.songs),
  2,
  'Member keeps read access to the repertoire without accepting the term'
);
select throws_ok(
  $$select public.accept_current_band_term(
      '00000000-0000-0000-0000-000000000644',
      '2026-09'
    )$$,
  'P0001',
  'LEGAL_TERM_ROLE_REQUIRED',
  'Member cannot register a term acceptance for editing'
);

select * from finish();

rollback;
