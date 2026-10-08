begin;

select plan(30);

select has_table(
  'public'::name,
  'repertoire_collections'::name,
  'Coleções existem'
);
select has_table(
  'public'::name,
  'repertoire_collection_songs'::name,
  'Participações existem'
);
select col_is_pk(
  'public'::name,
  'repertoire_collections'::name,
  'id'::name,
  'Coleção tem identificador primário'
);
select ok(
  (
    select cardinality(conkey) = 2
    from pg_constraint
    where conrelid = 'public.repertoire_collection_songs'::regclass
      and conname = 'repertoire_collection_songs_pkey'
      and contype = 'p'
  ),
  'Música aparece uma vez em cada coleção'
);
select col_not_null(
  'public'::name,
  'repertoire_collections'::name,
  'band_id'::name,
  'Coleção pertence a uma banda'
);
select col_not_null(
  'public'::name,
  'repertoire_collection_songs'::name,
  'position'::name,
  'Participação tem posição'
);
select fk_ok(
  'public'::name,
  'repertoire_collections'::name,
  'band_id'::name,
  'public'::name,
  'bands'::name,
  'id'::name,
  'Coleção referencia a banda'
);
select ok(
  exists (
    select 1
    from pg_constraint
    where conrelid = 'public.repertoire_collection_songs'::regclass
      and conname = 'repertoire_collection_songs_collection_band_fkey'
      and confrelid = 'public.repertoire_collections'::regclass
      and confdeltype = 'c'
  ),
  'Vínculo exige coleção da mesma banda e acompanha sua exclusão'
);
select ok(
  exists (
    select 1
    from pg_constraint
    where conrelid = 'public.repertoire_collection_songs'::regclass
      and conname = 'repertoire_collection_songs_song_band_fkey'
      and confrelid = 'public.songs'::regclass
      and confdeltype = 'c'
  ),
  'Vínculo exige música da mesma banda e acompanha exclusão definitiva'
);
select ok(
  exists (
    select 1
    from pg_index
    where indexrelid = 'public.repertoire_collections_band_name_key'::regclass
      and indisunique
  ),
  'Índice único protege nomes sem diferenciar caixa e espaços externos'
);
select ok(
  exists (
    select 1
    from pg_constraint
    where conrelid = 'public.repertoire_collection_songs'::regclass
      and conname = 'repertoire_collection_songs_collection_position_key'
      and contype = 'u'
      and condeferrable
      and condeferred is false
  ),
  'Ordem é única e pode ser reescrita dentro de transação'
);
select ok(
  exists (
    select 1
    from pg_constraint
    where conrelid = 'public.repertoire_collection_songs'::regclass
      and conname = 'repertoire_collection_songs_position_non_negative'
      and contype = 'c'
  ),
  'Posições não podem ser negativas'
);
select ok(
  (select relrowsecurity
   from pg_class
   where oid = 'public.repertoire_collections'::regclass),
  'RLS protege coleções'
);
select ok(
  (select relrowsecurity
   from pg_class
   where oid = 'public.repertoire_collection_songs'::regclass),
  'RLS protege participações'
);

insert into public.bands (id, name)
values
  ('00000000-0000-0000-0000-000000009101', 'Coleções banda um'),
  ('00000000-0000-0000-0000-000000009102', 'Coleções banda dois');

insert into public.songs (id, band_id, title)
values
  (
    '00000000-0000-0000-0000-000000009201',
    '00000000-0000-0000-0000-000000009101',
    'Música um'
  ),
  (
    '00000000-0000-0000-0000-000000009202',
    '00000000-0000-0000-0000-000000009101',
    'Música dois'
  ),
  (
    '00000000-0000-0000-0000-000000009203',
    '00000000-0000-0000-0000-000000009102',
    'Música da outra banda'
  );

insert into public.repertoire_collections (id, band_id, name)
values
  (
    '00000000-0000-0000-0000-000000009301',
    '00000000-0000-0000-0000-000000009101',
    'Festa'
  ),
  (
    '00000000-0000-0000-0000-000000009302',
    '00000000-0000-0000-0000-000000009101',
    'Acústico'
  ),
  (
    '00000000-0000-0000-0000-000000009303',
    '00000000-0000-0000-0000-000000009102',
    'Festa'
  );

select is(
  (
    select count(*)::integer
    from public.repertoire_collection_songs
    where collection_id = '00000000-0000-0000-0000-000000009301'
  ),
  0,
  'Coleção vazia pode existir'
);

insert into public.repertoire_collection_songs (
  band_id,
  collection_id,
  song_id,
  position
)
values
  (
    '00000000-0000-0000-0000-000000009101',
    '00000000-0000-0000-0000-000000009301',
    '00000000-0000-0000-0000-000000009201',
    0
  ),
  (
    '00000000-0000-0000-0000-000000009101',
    '00000000-0000-0000-0000-000000009301',
    '00000000-0000-0000-0000-000000009202',
    1
  ),
  (
    '00000000-0000-0000-0000-000000009101',
    '00000000-0000-0000-0000-000000009302',
    '00000000-0000-0000-0000-000000009201',
    0
  );

insert into public.repertoire_collection_songs (
  band_id,
  collection_id,
  song_id,
  position
)
values (
  '00000000-0000-0000-0000-000000009102',
  '00000000-0000-0000-0000-000000009303',
  '00000000-0000-0000-0000-000000009203',
  0
);

select is(
  (
    select count(*)::integer
    from public.repertoire_collection_songs
    where collection_id = '00000000-0000-0000-0000-000000009301'
  ),
  2,
  'Coleção mantém as músicas na ordem própria'
);
select is(
  (
    select count(*)::integer
    from public.repertoire_collection_songs
    where song_id = '00000000-0000-0000-0000-000000009201'
  ),
  2,
  'A mesma música pode participar de mais de uma coleção'
);

select throws_ok(
  $$
    insert into public.repertoire_collection_songs (
      band_id,
      collection_id,
      song_id,
      position
    )
    values (
      '00000000-0000-0000-0000-000000009101',
      '00000000-0000-0000-0000-000000009301',
      '00000000-0000-0000-0000-000000009201',
      2
    )
  $$,
  '23505',
  null,
  'A mesma música não pode repetir dentro da coleção'
);
select throws_ok(
  $$
    insert into public.repertoire_collection_songs (
      band_id,
      collection_id,
      song_id,
      position
    )
    values (
      '00000000-0000-0000-0000-000000009101',
      '00000000-0000-0000-0000-000000009301',
      '00000000-0000-0000-0000-000000009202',
      0
    )
  $$,
  '23505',
  null,
  'Posição repetida é rejeitada'
);
select throws_ok(
  $$
    insert into public.repertoire_collection_songs (
      band_id,
      collection_id,
      song_id,
      position
    )
    values (
      '00000000-0000-0000-0000-000000009101',
      '00000000-0000-0000-0000-000000009301',
      '00000000-0000-0000-0000-000000009202',
      -1
    )
  $$,
  '23514',
  null,
  'Posição negativa é rejeitada'
);
select throws_ok(
  $$
    insert into public.repertoire_collections (band_id, name)
    values ('00000000-0000-0000-0000-000000009101', '   ')
  $$,
  '23514',
  null,
  'Nome vazio é rejeitado'
);
select throws_ok(
  $$
    insert into public.repertoire_collections (band_id, name)
    values (
      '00000000-0000-0000-0000-000000009101',
      repeat('a', 121)
    )
  $$,
  '23514',
  null,
  'Nome acima do limite é rejeitado'
);
select throws_ok(
  $$
    insert into public.repertoire_collections (band_id, name)
    values ('00000000-0000-0000-0000-000000009101', ' fEsTa ')
  $$,
  '23505',
  null,
  'Nome existente ignora caixa e espaços externos'
);
select throws_ok(
  $$
    insert into public.repertoire_collection_songs (
      band_id,
      collection_id,
      song_id,
      position
    )
    values (
      '00000000-0000-0000-0000-000000009101',
      '00000000-0000-0000-0000-000000009303',
      '00000000-0000-0000-0000-000000009201',
      1
    )
  $$,
  '23503',
  null,
  'Coleção de outra banda é rejeitada'
);
select throws_ok(
  $$
    insert into public.repertoire_collection_songs (
      band_id,
      collection_id,
      song_id,
      position
    )
    values (
      '00000000-0000-0000-0000-000000009101',
      '00000000-0000-0000-0000-000000009301',
      '00000000-0000-0000-0000-000000009203',
      2
    )
  $$,
  '23503',
  null,
  'Música de outra banda é rejeitada'
);

insert into public.shows (id, band_id, name, starts_at, venue)
values (
  '00000000-0000-0000-0000-000000009401',
  '00000000-0000-0000-0000-000000009101',
  'Show preservado',
  '2026-11-01 21:00:00+00',
  'Palco de teste'
);
insert into public.show_blocks (id, show_id, name, position)
values (
  '00000000-0000-0000-0000-000000009402',
  '00000000-0000-0000-0000-000000009401',
  'Principal',
  0
);
insert into public.show_items (block_id, position, item_type, song_id)
values (
  '00000000-0000-0000-0000-000000009402',
  0,
  'song',
  '00000000-0000-0000-0000-000000009201'
);

delete from public.repertoire_collections
where id = '00000000-0000-0000-0000-000000009301';

select is(
  (
    select count(*)::integer
    from public.repertoire_collection_songs
    where collection_id = '00000000-0000-0000-0000-000000009301'
  ),
  0,
  'Excluir coleção remove somente seus vínculos'
);
select is(
  (
    select count(*)::integer
    from public.repertoire_collection_songs
    where collection_id = '00000000-0000-0000-0000-000000009302'
      and song_id = '00000000-0000-0000-0000-000000009201'
  ),
  1,
  'Outras participações da música permanecem'
);
select is(
  (
    select count(*)::integer
    from public.songs
    where band_id = '00000000-0000-0000-0000-000000009101'
  ),
  2,
  'Excluir coleção preserva o cadastro de músicas'
);
select is(
  (
    select count(*)::integer
    from public.show_items
    where song_id = '00000000-0000-0000-0000-000000009201'
  ),
  1,
  'Excluir coleção preserva itens do setlist existente'
);
select is(
  (
    select count(*)::integer
    from public.repertoire_collections
    where band_id = '00000000-0000-0000-0000-000000009102'
  ),
  1,
  'Nomes iguais são permitidos em bandas diferentes'
);

select * from finish();

rollback;
