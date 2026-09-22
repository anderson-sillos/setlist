begin;

select plan(29);

select has_table('public'::name, 'shows'::name, 'shows exists');
select has_table('public'::name, 'show_blocks'::name, 'show_blocks exists');
select has_table('public'::name, 'show_items'::name, 'show_items exists');

select col_is_pk(
  'public'::name,
  'shows'::name,
  'id'::name,
  'shows id is the primary key'
);
select col_is_pk(
  'public'::name,
  'show_blocks'::name,
  'id'::name,
  'show_blocks id is the primary key'
);
select col_is_pk(
  'public'::name,
  'show_items'::name,
  'id'::name,
  'show_items id is the primary key'
);

select col_not_null(
  'public'::name,
  'shows'::name,
  'band_id'::name,
  'show band is required'
);
select col_not_null(
  'public'::name,
  'shows'::name,
  'starts_at'::name,
  'show date is required'
);
select col_not_null(
  'public'::name,
  'shows'::name,
  'status'::name,
  'show status is required'
);
select col_not_null(
  'public'::name,
  'show_blocks'::name,
  'show_id'::name,
  'block show is required'
);
select col_not_null(
  'public'::name,
  'show_blocks'::name,
  'position'::name,
  'block position is required'
);
select col_not_null(
  'public'::name,
  'show_items'::name,
  'block_id'::name,
  'item block is required'
);
select col_not_null(
  'public'::name,
  'show_items'::name,
  'item_type'::name,
  'item type is required'
);

select fk_ok(
  'public'::name,
  'shows'::name,
  'band_id'::name,
  'public'::name,
  'bands'::name,
  'id'::name,
  'show references band'
);
select fk_ok(
  'public'::name,
  'show_blocks'::name,
  'show_id'::name,
  'public'::name,
  'shows'::name,
  'id'::name,
  'block references show'
);
select fk_ok(
  'public'::name,
  'show_items'::name,
  'block_id'::name,
  'public'::name,
  'show_blocks'::name,
  'id'::name,
  'item references block'
);
select fk_ok(
  'public'::name,
  'show_items'::name,
  'song_id'::name,
  'public'::name,
  'songs'::name,
  'id'::name,
  'song item references song'
);

select is(
  (select count(*)::integer
   from pg_enum e
   join pg_type t on t.oid = e.enumtypid
   where t.typnamespace = 'public'::regnamespace
     and t.typname = 'show_status'
     and e.enumlabel in ('draft', 'ready', 'cancelled')),
  3,
  'show status enum has all allowed values'
);
select is(
  (select count(*)::integer
   from pg_enum e
   join pg_type t on t.oid = e.enumtypid
   where t.typnamespace = 'public'::regnamespace
     and t.typname = 'show_item_type'
     and e.enumlabel in ('song', 'planning', 'separator')),
  3,
  'show item enum has all allowed values'
);

select is(
  (select relrowsecurity from pg_class where oid = 'public.shows'::regclass),
  true,
  'shows has row level security enabled'
);
select is(
  (select relrowsecurity from pg_class where oid = 'public.show_blocks'::regclass),
  true,
  'show_blocks has row level security enabled'
);
select is(
  (select relrowsecurity from pg_class where oid = 'public.show_items'::regclass),
  true,
  'show_items has row level security enabled'
);

do $$
declare
  test_user_id uuid := '00000000-0000-0000-0000-000000000062';
  test_band_id uuid := '00000000-0000-0000-0000-000000000063';
  test_song_id uuid := '00000000-0000-0000-0000-000000000064';
  test_show_id uuid := '00000000-0000-0000-0000-000000000065';
  test_block_id uuid := '00000000-0000-0000-0000-000000000066';
begin
  insert into auth.users (id, aud, role, email)
  values (test_user_id, 'authenticated', 'authenticated', 'task-4-4@example.test');
  insert into public.profiles (id, display_name)
  values (test_user_id, 'Teste 4.4')
  on conflict (id) do update
  set display_name = excluded.display_name;
  insert into public.bands (id, name)
  values (test_band_id, 'Banda de teste 4.4');
  insert into public.songs (id, band_id, title, lyric_status)
  values (test_song_id, test_band_id, 'Música de teste', 'missing');
  insert into public.shows (id, band_id, name, starts_at, venue)
  values (test_show_id, test_band_id, 'Show de teste', '2026-10-01 21:00:00+00', 'Palco de teste');
  insert into public.show_blocks (id, show_id, name, position)
  values (test_block_id, test_show_id, 'Principal', 0);
end;
$$;

insert into public.show_items (block_id, position, item_type, song_id, notes)
values (
  '00000000-0000-0000-0000-000000000066',
  0,
  'song',
  '00000000-0000-0000-0000-000000000064',
  'Começar com contagem'
);
insert into public.show_items (block_id, position, item_type, estimated_duration_ms, description)
values (
  '00000000-0000-0000-0000-000000000066',
  1,
  'planning',
  30000,
  'Troca de instrumento'
);
insert into public.show_items (block_id, position, item_type)
values (
  '00000000-0000-0000-0000-000000000066',
  2,
  'separator'
);

select is(
  (select count(*)::integer from public.show_items),
  3,
  'song, planning and separator items are accepted'
);

select throws_ok(
  $$
    insert into public.show_items (block_id, position, item_type)
    values ('00000000-0000-0000-0000-000000000066', 3, 'song')
  $$,
  '23514',
  null,
  'song item requires a song reference'
);
select throws_ok(
  $$
    insert into public.show_items (block_id, position, item_type, description)
    values ('00000000-0000-0000-0000-000000000066', 3, 'planning', '   ')
  $$,
  '23514',
  null,
  'planning item requires a description'
);
select throws_ok(
  $$
    insert into public.show_items (block_id, position, item_type, description)
    values ('00000000-0000-0000-0000-000000000066', 3, 'separator', 'texto indevido')
  $$,
  '23514',
  null,
  'separator cannot have a description'
);
select throws_ok(
  $$
    insert into public.show_items (block_id, position, item_type, estimated_duration_ms, description)
    values ('00000000-0000-0000-0000-000000000066', 3, 'planning', -1, 'Duração inválida')
  $$,
  '23514',
  null,
  'planning duration cannot be negative'
);
select throws_ok(
  $$
    insert into public.show_items (block_id, position, item_type, song_id, notes)
    values (
      '00000000-0000-0000-0000-000000000066',
      1,
      'song',
      '00000000-0000-0000-0000-000000000064',
      null
    )
  $$,
  '23505',
  null,
  'item positions are unique within a block'
);

select throws_ok(
  $$
    delete from public.songs
    where id = '00000000-0000-0000-0000-000000000064'
  $$,
  '23503',
  null,
  'songs referenced by a setlist cannot be deleted'
);

select * from finish();

rollback;
