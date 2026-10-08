begin;

select plan(10);

do $$
declare
  owner_id uuid := '00000000-0000-0000-0000-000000009501';
  editor_id uuid := '00000000-0000-0000-0000-000000009502';
  member_id uuid := '00000000-0000-0000-0000-000000009503';
  outsider_id uuid := '00000000-0000-0000-0000-000000009504';
  suspended_id uuid := '00000000-0000-0000-0000-000000009505';
  band_id uuid := '00000000-0000-0000-0000-000000009511';
  other_band_id uuid := '00000000-0000-0000-0000-000000009512';
  active_song_id uuid := '00000000-0000-0000-0000-000000009521';
  hidden_song_id uuid := '00000000-0000-0000-0000-000000009522';
  other_song_id uuid := '00000000-0000-0000-0000-000000009523';
  collection_id uuid := '00000000-0000-0000-0000-000000009531';
  other_collection_id uuid := '00000000-0000-0000-0000-000000009532';
begin
  insert into auth.users (id, aud, role, email)
  values
    (owner_id, 'authenticated', 'authenticated', 'task-9-2-owner@example.test'),
    (editor_id, 'authenticated', 'authenticated', 'task-9-2-editor@example.test'),
    (member_id, 'authenticated', 'authenticated', 'task-9-2-member@example.test'),
    (outsider_id, 'authenticated', 'authenticated', 'task-9-2-outsider@example.test'),
    (suspended_id, 'authenticated', 'authenticated', 'task-9-2-suspended@example.test');

  insert into public.profiles (id, display_name)
  values
    (owner_id, 'Owner de teste'),
    (editor_id, 'Editor de teste'),
    (member_id, 'Integrante de teste'),
    (outsider_id, 'Pessoa externa de teste'),
    (suspended_id, 'Conta suspensa de teste')
  on conflict (id) do update
  set display_name = excluded.display_name;

  insert into public.bands (id, name)
  values
    (band_id, 'Banda de acesso a coleções'),
    (other_band_id, 'Outra banda de acesso');

  insert into public.band_members (band_id, user_id, role)
  values
    (band_id, owner_id, 'owner'),
    (band_id, editor_id, 'editor'),
    (band_id, member_id, 'member'),
    (band_id, suspended_id, 'member'),
    (other_band_id, outsider_id, 'owner');

  insert into public.suspended_accounts (user_id, reason, recorded_by)
  values (suspended_id, 'Suspensão usada no teste', 'Teste pgTAP');

  insert into public.songs (id, band_id, title)
  values
    (active_song_id, band_id, 'Música consultável'),
    (hidden_song_id, band_id, 'Música moderada'),
    (other_song_id, other_band_id, 'Música de outra banda');

  insert into public.moderated_songs (song_id, reason, recorded_by)
  values (hidden_song_id, 'Ocultação usada no teste', 'Teste pgTAP');

  insert into public.repertoire_collections (id, band_id, name)
  values
    (collection_id, band_id, 'Festa'),
    (other_collection_id, other_band_id, 'Acústico');

  insert into public.repertoire_collection_songs (
    band_id,
    collection_id,
    song_id,
    position
  )
  values
    (band_id, collection_id, active_song_id, 0),
    (band_id, collection_id, hidden_song_id, 1);
end;
$$;

select ok(
  has_table_privilege(
    'authenticated',
    'public.repertoire_collections',
    'select'
  ),
  'Integrantes podem consultar coleções sujeitas à RLS'
);
select ok(
  not has_table_privilege(
    'authenticated',
    'public.repertoire_collections',
    'insert'
  ),
  'Gravações de coleções ficam restritas às operações atômicas'
);
select ok(
  has_table_privilege(
    'authenticated',
    'public.repertoire_collection_songs',
    'select'
  ),
  'Integrantes podem consultar vínculos sujeitos à RLS'
);
select ok(
  not has_table_privilege(
    'authenticated',
    'public.repertoire_collection_songs',
    'insert'
  ),
  'Gravações de vínculos ficam restritas às operações atômicas'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000009502',
  true
);
select is(
  (select count(*)::integer from public.repertoire_collections),
  1,
  'Editor consulta somente coleções da própria banda'
);

select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000009503',
  true
);
select is(
  (select count(*)::integer from public.repertoire_collections),
  1,
  'Integrante consulta coleções compartilhadas da banda'
);
select is(
  (select count(*)::integer from public.repertoire_collection_songs),
  1,
  'Vínculos de músicas moderadas não aparecem nem contam'
);

select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000009504',
  true
);
select is(
  (
    select count(*)::integer
    from public.repertoire_collections
    where id = '00000000-0000-0000-0000-000000009531'
  ),
  0,
  'Pessoa externa não consulta coleções de outra banda'
);

select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000009505',
  true
);
select is(
  (select count(*)::integer from public.repertoire_collections),
  0,
  'Conta suspensa não consulta coleções com sessão antiga'
);
select is(
  (select count(*)::integer from public.repertoire_collection_songs),
  0,
  'Conta suspensa não consulta participações com sessão antiga'
);

select * from finish();

rollback;
