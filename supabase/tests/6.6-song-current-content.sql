begin;

select plan(10);

do $$
declare
  owner_id uuid := '00000000-0000-0000-0000-000000000671';
  editor_id uuid := '00000000-0000-0000-0000-000000000672';
  member_id uuid := '00000000-0000-0000-0000-000000000673';
  band_id uuid := '00000000-0000-0000-0000-000000000674';
  song_id uuid := '00000000-0000-0000-0000-000000000675';
  show_id uuid := '00000000-0000-0000-0000-000000000676';
  block_id uuid := '00000000-0000-0000-0000-000000000677';
begin
  insert into auth.users (id, aud, role, email)
  values
    (owner_id, 'authenticated', 'authenticated', 'task-6-6-owner@example.test'),
    (editor_id, 'authenticated', 'authenticated', 'task-6-6-editor@example.test'),
    (member_id, 'authenticated', 'authenticated', 'task-6-6-member@example.test');

  insert into public.bands (id, name)
  values (band_id, 'Banda de conteúdo vigente 6.6');

  insert into public.band_members (band_id, user_id, role)
  values
    (band_id, owner_id, 'owner'),
    (band_id, editor_id, 'editor'),
    (band_id, member_id, 'member');

  insert into public.songs (id, band_id, title, notes)
  values (song_id, band_id, 'Versão antiga', 'Conteúdo antigo');

  insert into public.shows (id, band_id, name, starts_at, venue)
  values (show_id, band_id, 'Show com vínculo vigente', '2026-12-10 21:00:00+00', 'Palco 6.6');

  insert into public.show_blocks (id, show_id, name, position)
  values (block_id, show_id, 'Principal', 0);

  insert into public.show_items (block_id, position, item_type, song_id)
  values (block_id, 0, 'song', song_id);
end;
$$;

select is(
  (select count(*)::integer from public.songs
   where id = '00000000-0000-0000-0000-000000000675'),
  1,
  'the repertoire starts with one current song row'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000671',
  true
);
select ok(
  public.accept_current_band_term(
    '00000000-0000-0000-0000-000000000674',
    '2026-09'
  ) is not null,
  'Owner accepts the current term before updating the song'
);

update public.songs
set title = 'Versão atual do Owner',
    notes = 'Conteúdo vigente do Owner',
    updated_at = timestamp '2000-01-01'
where id = '00000000-0000-0000-0000-000000000675';

select is(
  (select count(*)::integer from public.songs
   where band_id = '00000000-0000-0000-0000-000000000674'),
  1,
  'updating a song keeps a single current row'
);
select is(
  (select title from public.songs
   where id = '00000000-0000-0000-0000-000000000675'),
  'Versão atual do Owner',
  'the detail exposes the latest song content'
);
select is(
  (select count(*)::integer from public.songs
   where band_id = '00000000-0000-0000-0000-000000000674'
     and title = 'Versão antiga'),
  0,
  'the previous song content is not exposed as history'
);
select ok(
  (select updated_at > timestamp '2026-01-01' from public.songs
   where id = '00000000-0000-0000-0000-000000000675'),
  'song updates use the server timestamp instead of the client value'
);
select is(
  (select song_id from public.show_items
   where block_id = '00000000-0000-0000-0000-000000000677'
     and position = 0),
  '00000000-0000-0000-0000-000000000675'::uuid,
  'updating a song preserves the show relationship'
);

select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000672',
  true
);
select ok(
  public.accept_current_band_term(
    '00000000-0000-0000-0000-000000000674',
    '2026-09'
  ) is not null,
  'Editor accepts the current term before updating the song'
);
update public.songs
set title = 'Versão atual do Editor',
    updated_at = timestamp '2000-01-01'
where id = '00000000-0000-0000-0000-000000000675';
select is(
  (select title from public.songs
   where id = '00000000-0000-0000-0000-000000000675'),
  'Versão atual do Editor',
  'Editor also replaces the current content'
);
select ok(
  (select updated_at > timestamp '2026-01-01' from public.songs
   where id = '00000000-0000-0000-0000-000000000675'),
  'Editor updates also use the server timestamp'
);

select * from finish();

rollback;
