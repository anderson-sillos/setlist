begin;

select plan(25);

do $$
declare
  owner_id uuid := '00000000-0000-0000-0000-000000009601';
  editor_id uuid := '00000000-0000-0000-0000-000000009602';
  member_id uuid := '00000000-0000-0000-0000-000000009603';
  band_id uuid := '00000000-0000-0000-0000-000000009611';
  other_band_id uuid := '00000000-0000-0000-0000-000000009612';
  song_one_id uuid := '00000000-0000-0000-0000-000000009621';
  song_two_id uuid := '00000000-0000-0000-0000-000000009622';
  song_three_id uuid := '00000000-0000-0000-0000-000000009623';
  hidden_song_id uuid := '00000000-0000-0000-0000-000000009624';
  song_four_id uuid := '00000000-0000-0000-0000-000000009625';
  other_song_id uuid := '00000000-0000-0000-0000-000000009626';
  collection_id uuid := '00000000-0000-0000-0000-000000009631';
  other_collection_id uuid := '00000000-0000-0000-0000-000000009632';
begin
  insert into auth.users (id, aud, role, email)
  values
    (owner_id, 'authenticated', 'authenticated', 'task-9-3-owner@example.test'),
    (editor_id, 'authenticated', 'authenticated', 'task-9-3-editor@example.test'),
    (member_id, 'authenticated', 'authenticated', 'task-9-3-member@example.test');

  insert into public.profiles (id, display_name)
  values
    (owner_id, 'Owner RPC'),
    (editor_id, 'Editor RPC'),
    (member_id, 'Integrante RPC')
  on conflict (id) do update
  set display_name = excluded.display_name;

  insert into public.bands (id, name)
  values
    (band_id, 'Banda de RPCs'),
    (other_band_id, 'Outra banda de RPCs');

  insert into public.band_members (band_id, user_id, role)
  values
    (band_id, owner_id, 'owner'),
    (band_id, editor_id, 'editor'),
    (band_id, member_id, 'member');

  insert into public.songs (id, band_id, title)
  values
    (song_one_id, band_id, 'Música um'),
    (song_two_id, band_id, 'Música dois'),
    (song_three_id, band_id, 'Música três'),
    (hidden_song_id, band_id, 'Música moderada'),
    (song_four_id, band_id, 'Música quatro'),
    (other_song_id, other_band_id, 'Música da outra banda');

  insert into public.moderated_songs (song_id, reason, recorded_by)
  values (hidden_song_id, 'Ocultação usada no teste', 'Teste pgTAP');

  insert into public.repertoire_collections (id, band_id, name)
  values
    (collection_id, band_id, 'Festa'),
    (other_collection_id, band_id, 'Acústico');

  insert into public.repertoire_collection_songs (
    band_id,
    collection_id,
    song_id,
    position
  )
  values
    (band_id, collection_id, song_one_id, 0),
    (band_id, collection_id, song_two_id, 1),
    (band_id, collection_id, hidden_song_id, 2),
    (band_id, other_collection_id, song_three_id, 0);

  insert into public.shows (id, band_id, name, starts_at, venue)
  values (
    '00000000-0000-0000-0000-000000009641',
    band_id,
    'Show independente',
    '2026-11-01 21:00:00+00',
    'Palco de teste'
  );
  insert into public.show_blocks (id, show_id, name, position)
  values (
    '00000000-0000-0000-0000-000000009642',
    '00000000-0000-0000-0000-000000009641',
    'Principal',
    0
  );
  insert into public.show_items (block_id, position, item_type, song_id)
  values (
    '00000000-0000-0000-0000-000000009642',
    0,
    'song',
    song_one_id
  );
end;
$$;

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000009602',
  true
);

select lives_ok(
  $$
    select public.save_repertoire_collection(
      '00000000-0000-0000-0000-000000009611',
      '00000000-0000-0000-0000-000000009631',
      '  Festa revisada  ',
      array[
        '00000000-0000-0000-0000-000000009622'::uuid,
        '00000000-0000-0000-0000-000000009621'::uuid
      ],
      (select updated_at
       from public.repertoire_collections
       where id = '00000000-0000-0000-0000-000000009631')
    )
  $$,
  'Editor salva nome e ordem atomicamente'
);
select is(
  (
    select name
    from public.repertoire_collections
    where id = '00000000-0000-0000-0000-000000009631'
  ),
  'Festa revisada',
  'Nome é normalizado antes de salvar'
);
select is(
  (
    select array_agg(song_id order by position)
    from public.repertoire_collection_songs
    where collection_id = '00000000-0000-0000-0000-000000009631'
      and not public.is_song_moderated(song_id)
  ),
  array[
    '00000000-0000-0000-0000-000000009622'::uuid,
    '00000000-0000-0000-0000-000000009621'::uuid
  ],
  'Reordenação reflete somente a escolha confirmada'
);
select ok(
  exists (
    select 1
    from public.repertoire_collection_songs
    where collection_id = '00000000-0000-0000-0000-000000009631'
      and song_id = '00000000-0000-0000-0000-000000009624'
      and position = 2
  ),
  'Edição preserva vínculo de música oculta e sua posição relativa'
);

select throws_ok(
  $$
    select public.save_repertoire_collection(
      '00000000-0000-0000-0000-000000009611',
      '00000000-0000-0000-0000-000000009631',
      'Nome parcial',
      array[
        '00000000-0000-0000-0000-000000009621'::uuid,
        '00000000-0000-0000-0000-000000009621'::uuid
      ],
      (select updated_at
       from public.repertoire_collections
       where id = '00000000-0000-0000-0000-000000009631')
    )
  $$,
  'P0001',
  'COLLECTION_SONG_DUPLICATE',
  'RPC rejeita música duplicada sem gravar parcialmente'
);
select throws_ok(
  $$
    select public.save_repertoire_collection(
      '00000000-0000-0000-0000-000000009611',
      '00000000-0000-0000-0000-000000009631',
      'Nome parcial',
      array['00000000-0000-0000-0000-000000009626'::uuid],
      (select updated_at
       from public.repertoire_collections
       where id = '00000000-0000-0000-0000-000000009631')
    )
  $$,
  '42501',
  'COLLECTION_SONG_UNAVAILABLE',
  'RPC rejeita música de outra banda'
);
select is(
  (
    select name
    from public.repertoire_collections
    where id = '00000000-0000-0000-0000-000000009631'
  ),
  'Festa revisada',
  'Falha na composição reverte também a mudança do nome'
);
select throws_ok(
  $$
    select public.save_repertoire_collection(
      '00000000-0000-0000-0000-000000009611',
      '00000000-0000-0000-0000-000000009631',
      'Edição antiga',
      array[
        '00000000-0000-0000-0000-000000009622'::uuid,
        '00000000-0000-0000-0000-000000009621'::uuid
      ],
      '2000-01-01 00:00:00+00'
    )
  $$,
  'P0001',
  'COLLECTION_CHANGED',
  'RPC rejeita revisão desatualizada sem sobrescrever a coleção'
);

select is(
  public.append_repertoire_collection_songs(
    '00000000-0000-0000-0000-000000009611',
    '00000000-0000-0000-0000-000000009631',
    array[
      '00000000-0000-0000-0000-000000009621'::uuid,
      '00000000-0000-0000-0000-000000009623'::uuid
    ]
  ),
  '00000000-0000-0000-0000-000000009631'::uuid,
  'Inclusão em lote ignora participação existente e acrescenta as novas'
);
select is(
  (
    select array_agg(song_id order by position)
    from public.repertoire_collection_songs
    where collection_id = '00000000-0000-0000-0000-000000009631'
      and not public.is_song_moderated(song_id)
  ),
  array[
    '00000000-0000-0000-0000-000000009622'::uuid,
    '00000000-0000-0000-0000-000000009621'::uuid,
    '00000000-0000-0000-0000-000000009623'::uuid
  ],
  'Inclusão em lote preserva ordem e acrescenta ao final'
);
select throws_ok(
  $$
    select public.append_repertoire_collection_songs(
      '00000000-0000-0000-0000-000000009611',
      '00000000-0000-0000-0000-000000009631',
      array[
        '00000000-0000-0000-0000-000000009623'::uuid,
        '00000000-0000-0000-0000-000000009623'::uuid
      ]
    )
  $$,
  'P0001',
  'COLLECTION_SONGS_INVALID',
  'Inclusão rejeita um mesmo identificador repetido no envio'
);

select lives_ok(
  $$
    select public.set_song_repertoire_collections(
      '00000000-0000-0000-0000-000000009611',
      '00000000-0000-0000-0000-000000009625',
      array[
        '00000000-0000-0000-0000-000000009631'::uuid,
        '00000000-0000-0000-0000-000000009632'::uuid
      ],
      (
        select jsonb_object_agg(id::text, updated_at)
        from public.repertoire_collections
        where id in (
          '00000000-0000-0000-0000-000000009631',
          '00000000-0000-0000-0000-000000009632'
        )
      )
    )
  $$,
  'Gestão da música inclui participação em mais de uma coleção'
);
select is(
  (
    select position
    from public.repertoire_collection_songs
    where collection_id = '00000000-0000-0000-0000-000000009631'
      and song_id = '00000000-0000-0000-0000-000000009625'
  ),
  4,
  'Gerenciar participação acrescenta a música ao final'
);
select is(
  (
    select count(*)::integer
    from public.repertoire_collection_songs
    where collection_id = '00000000-0000-0000-0000-000000009631'
  ),
  5,
  'Gerenciar uma música não remove vínculos de outras músicas'
);
select is(
  (
    select position
    from public.repertoire_collection_songs
    where collection_id = '00000000-0000-0000-0000-000000009632'
      and song_id = '00000000-0000-0000-0000-000000009623'
  ),
  1,
  'Gerenciar participação preserva ordem das outras músicas da coleção'
);

select lives_ok(
  $$
    select public.set_song_repertoire_collections(
      '00000000-0000-0000-0000-000000009611',
      '00000000-0000-0000-0000-000000009625',
      array['00000000-0000-0000-0000-000000009632'::uuid],
      (
        select jsonb_object_agg(id::text, updated_at)
        from public.repertoire_collections
        where id in (
          '00000000-0000-0000-0000-000000009631',
          '00000000-0000-0000-0000-000000009632'
        )
      )
    )
  $$,
  'Gestão remove somente a participação desmarcada'
);
select is(
  (
    select count(*)::integer
    from public.repertoire_collection_songs
    where song_id = '00000000-0000-0000-0000-000000009625'
  ),
  1,
  'Remoção de participação mantém os outros vínculos da coleção'
);
select is(
  (
    select position
    from public.repertoire_collection_songs
    where collection_id = '00000000-0000-0000-0000-000000009631'
      and song_id = '00000000-0000-0000-0000-000000009624'
  ),
  3,
  'Remover outra música preserva a participação moderada'
);
select throws_ok(
  $$
    select public.set_song_repertoire_collections(
      '00000000-0000-0000-0000-000000009611',
      '00000000-0000-0000-0000-000000009623',
      array['00000000-0000-0000-0000-000000009632'::uuid],
      jsonb_build_object(
        '00000000-0000-0000-0000-000000009632',
        '2000-01-01 00:00:00+00'
      )
    )
  $$,
  'P0001',
  'COLLECTION_CHANGED',
  'Gestão de participação rejeita revisão desatualizada'
);

select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000009603',
  true
);
select throws_ok(
  $$
    select public.append_repertoire_collection_songs(
      '00000000-0000-0000-0000-000000009611',
      '00000000-0000-0000-0000-000000009631',
      '{}'::uuid[]
    )
  $$,
  '42501',
  'COLLECTION_ROLE_REQUIRED',
  'Integrante sem papel de edição não altera a coleção'
);

select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000009602',
  true
);
select throws_ok(
  $$
    select public.delete_repertoire_collection(
      '00000000-0000-0000-0000-000000009611',
      '00000000-0000-0000-0000-000000009631',
      '2000-01-01 00:00:00+00'
    )
  $$,
  'P0001',
  'COLLECTION_CHANGED',
  'Exclusão não confirma uma revisão antiga'
);
select lives_ok(
  $$
    select public.delete_repertoire_collection(
      '00000000-0000-0000-0000-000000009611',
      '00000000-0000-0000-0000-000000009631',
      (select updated_at
       from public.repertoire_collections
       where id = '00000000-0000-0000-0000-000000009631')
    )
  $$,
  'Editor exclui a coleção na revisão atual'
);
select is(
  (
    select count(*)::integer
    from public.repertoire_collection_songs
    where collection_id = '00000000-0000-0000-0000-000000009631'
  ),
  0,
  'Exclusão remove participações por cascata'
);
select is(
  (
    select count(*)::integer
    from public.songs
    where band_id = '00000000-0000-0000-0000-000000009611'
  ),
  4,
  'Exclusão de coleção mantém as músicas da banda'
);
select is(
  (
    select count(*)::integer
    from public.show_items
    where song_id = '00000000-0000-0000-0000-000000009621'
  ),
  1,
  'Exclusão de coleção mantém itens do show independente'
);

select * from finish();

rollback;
