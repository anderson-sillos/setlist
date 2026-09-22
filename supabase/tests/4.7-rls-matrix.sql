begin;

select plan(28);

select is(
  (select count(*)::integer
   from pg_policies
   where schemaname = 'public'
     and tablename in (
       'profiles', 'bands', 'band_members', 'legal_acceptances', 'songs',
       'shows', 'show_blocks', 'show_items', 'invitations'
     )),
  27,
  'all business tables have explicit RLS policies'
);
select is(
  (select relrowsecurity
   from pg_class
   where oid = 'public.invitations'::regclass),
  true,
  'invitations remains protected by RLS'
);
select is(
  (select relrowsecurity
   from pg_class
   where oid = 'public.songs'::regclass),
  true,
  'songs remains protected by RLS'
);

do $$
declare
  owner_id uuid := '00000000-0000-0000-0000-000000000102';
  editor_id uuid := '00000000-0000-0000-0000-000000000103';
  member_id uuid := '00000000-0000-0000-0000-000000000104';
  outsider_id uuid := '00000000-0000-0000-0000-000000000105';
  band_id uuid := '00000000-0000-0000-0000-000000000106';
  song_id uuid := '00000000-0000-0000-0000-000000000107';
  show_id uuid := '00000000-0000-0000-0000-000000000108';
  block_id uuid := '00000000-0000-0000-0000-000000000109';
begin
  insert into auth.users (id, aud, role, email)
  values
    (owner_id, 'authenticated', 'authenticated', 'task-4-7-owner@example.test'),
    (editor_id, 'authenticated', 'authenticated', 'task-4-7-editor@example.test'),
    (member_id, 'authenticated', 'authenticated', 'task-4-7-member@example.test'),
    (outsider_id, 'authenticated', 'authenticated', 'task-4-7-outsider@example.test');
  insert into public.profiles (id, display_name)
  values
    (owner_id, 'Owner 4.7'),
    (editor_id, 'Editor 4.7'),
    (member_id, 'Member 4.7'),
    (outsider_id, 'Outsider 4.7')
  on conflict (id) do update
  set display_name = excluded.display_name;
  insert into public.bands (id, name)
  values (band_id, 'Banda de teste 4.7');
  insert into public.band_members (band_id, user_id, role)
  values
    (band_id, owner_id, 'owner'),
    (band_id, editor_id, 'editor'),
    (band_id, member_id, 'member');
  insert into public.songs (id, band_id, title)
  values (song_id, band_id, 'Música de teste 4.7');
  insert into public.shows (id, band_id, name, starts_at, venue)
  values (show_id, band_id, 'Show de teste 4.7', '2026-12-01 21:00:00+00', 'Palco 4.7');
  insert into public.show_blocks (id, show_id, name, position)
  values (block_id, show_id, 'Principal', 0);
  insert into public.show_items (block_id, position, item_type, song_id)
  values (block_id, 0, 'song', song_id);
  insert into public.invitations (
    band_id,
    token_hash,
    label
  )
  values (
    band_id,
    encode(extensions.digest('task-4-7-token', 'sha256'), 'hex'),
    'Convite de teste'
  );
end;
$$;

set local role authenticated;

do $$
begin
  perform set_config(
    'request.jwt.claim.sub',
    '00000000-0000-0000-0000-000000000102',
    true
  );
end;
$$;
select is((select count(*)::integer from public.bands), 1, 'Owner reads own band');
select is((select count(*)::integer from public.songs), 1, 'Owner reads songs');
select is((select count(*)::integer from public.invitations), 1, 'Owner reads invitations');
select is((select count(*)::integer from public.profiles), 3, 'Owner reads band profiles');
select ok(
  public.create_band('Banda criada por Owner', '2026-01', true) is not null,
  'authenticated user can create a band through the secure function'
);
select is(
  (select count(*)::integer
   from public.band_members
   where user_id = '00000000-0000-0000-0000-000000000102'
     and role = 'owner'),
  2,
  'secure band creation creates an Owner membership and preserves the existing one'
);
select throws_ok(
  $$insert into public.bands (name) values ('Inserção direta indevida')$$,
  '42501',
  null,
  'direct band creation is denied by default'
);
update public.band_members
set role = 'editor'
where band_id = '00000000-0000-0000-0000-000000000106'
  and user_id = '00000000-0000-0000-0000-000000000104';
select is(
  (select role from public.band_members
   where band_id = '00000000-0000-0000-0000-000000000106'
     and user_id = '00000000-0000-0000-0000-000000000104'),
  'editor'::public.band_role,
  'Owner can administer membership roles'
);
update public.band_members
set role = 'member'
where band_id = '00000000-0000-0000-0000-000000000106'
  and user_id = '00000000-0000-0000-0000-000000000104';

do $$
begin
  perform set_config(
    'request.jwt.claim.sub',
    '00000000-0000-0000-0000-000000000103',
    true
  );
end;
$$;
select is((select count(*)::integer from public.songs), 1, 'Editor reads songs');
select is((select count(*)::integer from public.show_items), 1, 'Editor reads setlist items');
insert into public.songs (band_id, title)
values ('00000000-0000-0000-0000-000000000106', 'Música criada pelo Editor');
update public.songs
set notes = 'Editada pelo Editor'
where id = '00000000-0000-0000-0000-000000000107';
insert into public.shows (band_id, name, starts_at, venue)
values ('00000000-0000-0000-0000-000000000106', 'Show criado pelo Editor', '2027-01-01 21:00:00+00', 'Palco novo');
select throws_ok(
  $$insert into public.invitations (
      band_id, token_hash
    ) values (
      '00000000-0000-0000-0000-000000000106',
      encode(extensions.digest('task-4-7-editor-token', 'sha256'), 'hex')
    )$$,
  '42501',
  null,
  'Editor cannot create invitations'
);
select is(
  (select name from public.bands
   where id = '00000000-0000-0000-0000-000000000106'),
  'Banda de teste 4.7',
  'Editor cannot administer the band'
);

do $$
begin
  perform set_config(
    'request.jwt.claim.sub',
    '00000000-0000-0000-0000-000000000104',
    true
  );
end;
$$;
select is((select count(*)::integer from public.bands), 1, 'Member reads the band');
select is((select count(*)::integer from public.band_members), 3, 'Member reads band members');
select is((select count(*)::integer from public.show_blocks), 1, 'Member reads blocks');
select throws_ok(
  $$insert into public.songs (band_id, title)
    values ('00000000-0000-0000-0000-000000000106', 'Música indevida')$$,
  '42501',
  null,
  'Member cannot create songs'
);
select is(
  (select notes from public.songs
   where id = '00000000-0000-0000-0000-000000000107'),
  'Editada pelo Editor',
  'Member cannot edit songs'
);
select is(
  (select venue from public.shows
   where id = '00000000-0000-0000-0000-000000000108'),
  'Palco 4.7',
  'Member cannot edit shows'
);

do $$
begin
  perform set_config(
    'request.jwt.claim.sub',
    '00000000-0000-0000-0000-000000000105',
    true
  );
end;
$$;
select is((select count(*)::integer from public.bands), 0, 'outsider cannot read bands');
select is((select count(*)::integer from public.songs), 0, 'outsider cannot read songs');
select is((select count(*)::integer from public.shows), 0, 'outsider cannot read shows');
select is((select count(*)::integer from public.invitations), 0, 'outsider cannot read invitations');
select is(
  (select count(*)::integer from public.songs),
  0,
  'outsider cannot edit content'
);

set local role anon;
select is((select count(*)::integer from public.bands), 0, 'anonymous cannot read bands');
select is((select count(*)::integer from public.songs), 0, 'anonymous cannot read songs');

select * from finish();

rollback;
