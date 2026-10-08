select plan(7);

create extension if not exists dblink with schema extensions;

begin;

insert into auth.users (id, aud, role, email)
values (
  '00000000-0000-0000-0000-000000009701',
  'authenticated',
  'authenticated',
  'task-9-5-editor@example.test'
);

insert into public.profiles (id, display_name)
values ('00000000-0000-0000-0000-000000009701', 'Editor concorrente')
on conflict (id) do update
set display_name = excluded.display_name;

insert into public.bands (id, name)
values ('00000000-0000-0000-0000-000000009711', 'Banda concorrente');

insert into public.band_members (band_id, user_id, role)
values (
  '00000000-0000-0000-0000-000000009711',
  '00000000-0000-0000-0000-000000009701',
  'editor'
);

insert into public.songs (id, band_id, title)
values
  (
    '00000000-0000-0000-0000-000000009721',
    '00000000-0000-0000-0000-000000009711',
    'Música inicial'
  ),
  (
    '00000000-0000-0000-0000-000000009722',
    '00000000-0000-0000-0000-000000009711',
    'Inclusão lenta'
  ),
  (
    '00000000-0000-0000-0000-000000009723',
    '00000000-0000-0000-0000-000000009711',
    'Inclusão concorrente'
  );

insert into public.repertoire_collections (id, band_id, name)
values (
  '00000000-0000-0000-0000-000000009731',
  '00000000-0000-0000-0000-000000009711',
  'Concorrência'
);

insert into public.repertoire_collection_songs (
  band_id,
  collection_id,
  song_id,
  position
)
values (
  '00000000-0000-0000-0000-000000009711',
  '00000000-0000-0000-0000-000000009731',
  '00000000-0000-0000-0000-000000009721',
  0
);

commit;

create function public.test_repertoire_collection_append_after_lock(
  p_user_id uuid,
  p_band_id uuid,
  p_collection_id uuid,
  p_song_id uuid,
  p_delay_seconds double precision
)
returns uuid
language plpgsql
as $$
begin
  perform set_config('request.jwt.claim.sub', p_user_id::text, false);
  perform 1
  from public.repertoire_collections as collections
  where collections.id = p_collection_id
    and collections.band_id = p_band_id
  for update;

  perform pg_sleep(p_delay_seconds);

  return public.append_repertoire_collection_songs(
    p_band_id,
    p_collection_id,
    array[p_song_id]
  );
end;
$$;

select is(
  extensions.dblink_connect(
    'collection_append_slow',
    'dbname=' || current_database()
  ),
  'OK',
  'Conexão concorrente lenta abre'
);
select is(
  extensions.dblink_connect(
    'collection_append_fast',
    'dbname=' || current_database()
  ),
  'OK',
  'Conexão concorrente rápida abre'
);

select is(
  extensions.dblink_send_query(
    'collection_append_slow',
    $query$
      select public.test_repertoire_collection_append_after_lock(
        '00000000-0000-0000-0000-000000009701',
        '00000000-0000-0000-0000-000000009711',
        '00000000-0000-0000-0000-000000009731',
        '00000000-0000-0000-0000-000000009722',
        0.6
      )
    $query$
  ),
  1,
  'Primeira inclusão começa e mantém o bloqueio da coleção'
);

select pg_sleep(0.05);

select is(
  extensions.dblink_send_query(
    'collection_append_fast',
    $query$
      select public.test_repertoire_collection_append_after_lock(
        '00000000-0000-0000-0000-000000009701',
        '00000000-0000-0000-0000-000000009711',
        '00000000-0000-0000-0000-000000009731',
        '00000000-0000-0000-0000-000000009723',
        0
      )
    $query$
  ),
  1,
  'Segunda inclusão inicia enquanto a primeira mantém o bloqueio'
);

select is(
  (
    select result.collection_id
    from extensions.dblink_get_result('collection_append_slow')
      as result(collection_id uuid)
  ),
  '00000000-0000-0000-0000-000000009731'::uuid,
  'Primeira inclusão termina'
);
select is(
  (
    select result.collection_id
    from extensions.dblink_get_result('collection_append_fast')
      as result(collection_id uuid)
  ),
  '00000000-0000-0000-0000-000000009731'::uuid,
  'Segunda inclusão termina após obter o bloqueio'
);

select is(
  (
    select array_agg(links.song_id order by links.position)
    from public.repertoire_collection_songs as links
    where links.collection_id = '00000000-0000-0000-0000-000000009731'
  ),
  array[
    '00000000-0000-0000-0000-000000009721'::uuid,
    '00000000-0000-0000-0000-000000009722'::uuid,
    '00000000-0000-0000-0000-000000009723'::uuid
  ],
  'As duas inclusões concorrentes são mantidas na ordem de aquisição do bloqueio'
);

select extensions.dblink_disconnect('collection_append_slow');
select extensions.dblink_disconnect('collection_append_fast');
drop function public.test_repertoire_collection_append_after_lock(
  uuid,
  uuid,
  uuid,
  uuid,
  double precision
);

delete from public.bands
where id = '00000000-0000-0000-0000-000000009711';
delete from auth.users
where id = '00000000-0000-0000-0000-000000009701';
