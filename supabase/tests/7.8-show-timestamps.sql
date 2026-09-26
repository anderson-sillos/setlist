begin;

select plan(8);

select is(
  (select count(*)::integer
   from pg_proc
   where oid = 'public.touch_show_updated_at()'::regprocedure),
  1,
  'show timestamp touch function exists'
);
select is(
  (select count(*)::integer
   from pg_trigger
   where tgrelid = 'public.show_blocks'::regclass
     and tgname = 'show_blocks_touch_show_updated_at'),
  1,
  'block changes touch show timestamp'
);
select is(
  (select count(*)::integer
   from pg_trigger
   where tgrelid = 'public.show_items'::regclass
     and tgname = 'show_items_touch_show_updated_at'),
  1,
  'item changes touch show timestamp'
);

do $$
declare
  test_user_id uuid := '00000000-0000-0000-0000-000000000b81';
  test_band_id uuid := '00000000-0000-0000-0000-000000000b82';
  test_song_id uuid := '00000000-0000-0000-0000-000000000b83';
  test_show_id uuid := '00000000-0000-0000-0000-000000000b84';
  test_block_id uuid := '00000000-0000-0000-0000-000000000b85';
begin
  insert into auth.users (id, aud, role, email)
  values (test_user_id, 'authenticated', 'authenticated', 'task-7-8@example.test');
  insert into public.profiles (id, display_name)
  values (test_user_id, 'Teste 7.8')
  on conflict (id) do update
  set display_name = excluded.display_name;
  insert into public.bands (id, name)
  values (test_band_id, 'Banda de teste 7.8');
  insert into public.songs (id, band_id, title)
  values (test_song_id, test_band_id, 'Música de teste 7.8');
  insert into public.shows (id, band_id, name, starts_at, venue)
  values (test_show_id, test_band_id, 'Show de teste 7.8', '2027-01-01 21:00:00+00', 'Palco 7.8');
  insert into public.show_blocks (id, show_id, name, position)
  values (test_block_id, test_show_id, 'Principal', 0);

  create temp table timestamp_checkpoints (
    name text primary key,
    value timestamptz not null
  ) on commit drop;
  insert into timestamp_checkpoints
  select 'after_block_insert', updated_at
  from public.shows
  where id = test_show_id;

  perform pg_sleep(0.01);
  update public.show_blocks
  set name = 'Principal atualizado'
  where id = test_block_id;
  insert into timestamp_checkpoints
  select 'after_block_update', updated_at
  from public.shows
  where id = test_show_id;

  perform pg_sleep(0.01);
  insert into public.show_items (block_id, position, item_type, song_id)
  values (test_block_id, 0, 'song', test_song_id);
  insert into timestamp_checkpoints
  select 'after_item_insert', updated_at
  from public.shows
  where id = test_show_id;

  perform pg_sleep(0.01);
  update public.show_items
  set notes = 'Observação atualizada'
  where block_id = test_block_id and position = 0;
  insert into timestamp_checkpoints
  select 'after_item_update', updated_at
  from public.shows
  where id = test_show_id;

  perform pg_sleep(0.01);
  delete from public.show_items
  where block_id = test_block_id and position = 0;
  insert into timestamp_checkpoints
  select 'after_item_delete', updated_at
  from public.shows
  where id = test_show_id;

  perform pg_sleep(0.01);
  delete from public.show_blocks
  where id = test_block_id;
  insert into timestamp_checkpoints
  select 'after_block_delete', updated_at
  from public.shows
  where id = test_show_id;
end;
$$;

select ok(
  (select value from timestamp_checkpoints where name = 'after_block_update')
    > (select value from timestamp_checkpoints where name = 'after_block_insert'),
  'updating a block refreshes the show timestamp'
);
select ok(
  (select value from timestamp_checkpoints where name = 'after_item_insert')
    > (select value from timestamp_checkpoints where name = 'after_block_update'),
  'inserting an item refreshes the show timestamp'
);
select ok(
  (select value from timestamp_checkpoints where name = 'after_item_update')
    > (select value from timestamp_checkpoints where name = 'after_item_insert'),
  'updating an item refreshes the show timestamp'
);
select ok(
  (select value from timestamp_checkpoints where name = 'after_item_delete')
    > (select value from timestamp_checkpoints where name = 'after_item_update'),
  'deleting an item refreshes the show timestamp'
);
select ok(
  (select value from timestamp_checkpoints where name = 'after_block_delete')
    > (select value from timestamp_checkpoints where name = 'after_item_delete'),
  'deleting a block refreshes the show timestamp'
);

select * from finish();
rollback;
