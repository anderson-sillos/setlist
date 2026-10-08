begin;

select plan(14);

do $$
declare
  owner_id uuid := '00000000-0000-0000-0000-000000009701';
  band_id uuid := '00000000-0000-0000-0000-000000009711';
  free_song_id uuid := '00000000-0000-0000-0000-000000009721';
  used_song_id uuid := '00000000-0000-0000-0000-000000009722';
  collection_id uuid := '00000000-0000-0000-0000-000000009731';
  show_id uuid := '00000000-0000-0000-0000-000000009741';
  block_id uuid := '00000000-0000-0000-0000-000000009742';
begin
  insert into auth.users (id, aud, role, email)
  values (owner_id, 'authenticated', 'authenticated', 'task-9-4-owner@example.test');

  insert into public.profiles (id, display_name)
  values (owner_id, 'Owner de ciclo de vida');

  insert into public.bands (id, name)
  values (band_id, 'Banda de ciclo de vida');

  insert into public.band_members (band_id, user_id, role)
  values (band_id, owner_id, 'owner');

  insert into public.songs (id, band_id, title)
  values
    (free_song_id, band_id, 'Música sem show'),
    (used_song_id, band_id, 'Música em show');

  insert into public.repertoire_collections (id, band_id, name)
  values (collection_id, band_id, 'Coleção de ciclo de vida');

  insert into public.repertoire_collection_songs (
    band_id,
    collection_id,
    song_id,
    position
  )
  values
    (band_id, collection_id, free_song_id, 0),
    (band_id, collection_id, used_song_id, 1);

  insert into public.shows (id, band_id, name, starts_at, venue)
  values (
    show_id,
    band_id,
    'Show de ciclo de vida',
    '2026-11-01 21:00:00+00',
    'Palco de teste'
  );
  insert into public.show_blocks (id, show_id, name, position)
  values (block_id, show_id, 'Principal', 0);
  insert into public.show_items (block_id, position, item_type, song_id)
  values (block_id, 0, 'song', used_song_id);
end;
$$;

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000009701',
  true
);

select ok(
  public.accept_current_band_term(
    '00000000-0000-0000-0000-000000009711',
    public.current_legal_term_version()
  ) is not null,
  'Owner aceita o termo vigente para gerenciar músicas'
);
select ok(
  public.set_song_archived(
    '00000000-0000-0000-0000-000000009711',
    '00000000-0000-0000-0000-000000009721',
    true
  ) is not null,
  'Arquivamento de música de coleção é registrado'
);
select is(
  (
    select count(*)::integer
    from public.repertoire_collection_songs
    where song_id = '00000000-0000-0000-0000-000000009721'
  ),
  1,
  'Arquivar música mantém sua participação na coleção'
);
select is(
  public.set_song_archived(
    '00000000-0000-0000-0000-000000009711',
    '00000000-0000-0000-0000-000000009721',
    false
  ),
  null::timestamptz,
  'Restaurar limpa a data de arquivamento'
);
select is(
  (
    select count(*)::integer
    from public.repertoire_collection_songs
    where song_id = '00000000-0000-0000-0000-000000009721'
  ),
  1,
  'Restauração mantém participação e posição da música'
);

select is(
  public.remove_song(
    '00000000-0000-0000-0000-000000009711',
    '00000000-0000-0000-0000-000000009721'
  ),
  'deleted',
  'Exclusão definitiva autorizada remove música sem referência de show'
);
select is(
  (
    select count(*)::integer
    from public.repertoire_collection_songs
    where song_id = '00000000-0000-0000-0000-000000009721'
  ),
  0,
  'Exclusão definitiva remove somente a participação da música'
);
select is(
  (
    select count(*)::integer
    from public.repertoire_collections
    where id = '00000000-0000-0000-0000-000000009731'
  ),
  1,
  'Coleção permanece após excluir uma música'
);

select is(
  public.remove_song(
    '00000000-0000-0000-0000-000000009711',
    '00000000-0000-0000-0000-000000009722'
  ),
  'archived',
  'Música usada em show continua sendo arquivada'
);
select ok(
  (
    select archived_at is not null
    from public.songs
    where id = '00000000-0000-0000-0000-000000009722'
  ),
  'Arquivamento preserva cadastro usado no show'
);
select is(
  (
    select count(*)::integer
    from public.repertoire_collection_songs
    where song_id = '00000000-0000-0000-0000-000000009722'
  ),
  1,
  'Arquivamento preserva vínculo e ordem na coleção'
);
select is(
  (
    select count(*)::integer
    from public.show_items
    where song_id = '00000000-0000-0000-0000-000000009722'
  ),
  1,
  'Arquivamento mantém a ocorrência do setlist existente'
);
select is(
  (
    select count(*)::integer
    from public.repertoire_collection_songs
    where collection_id = '00000000-0000-0000-0000-000000009731'
  ),
  1,
  'Ciclo de vida de uma música não apaga as demais da coleção'
);
select is(
  (
    select count(*)::integer
    from public.songs
    where band_id = '00000000-0000-0000-0000-000000009711'
  ),
  1,
  'Apenas música sem referência é excluída definitivamente'
);

select * from finish();

rollback;
