begin;

select plan(17);

select has_table('public'::name, 'songs'::name, 'songs exists');
select col_is_pk(
  'public'::name,
  'songs'::name,
  'id'::name,
  'songs id is the primary key'
);
select col_not_null(
  'public'::name,
  'songs'::name,
  'band_id'::name,
  'song band is required'
);
select col_not_null(
  'public'::name,
  'songs'::name,
  'title'::name,
  'song title is required'
);
select col_not_null(
  'public'::name,
  'songs'::name,
  'lyrics'::name,
  'song lyrics are required'
);
select col_not_null(
  'public'::name,
  'songs'::name,
  'lyric_status'::name,
  'song lyric status is required'
);

select fk_ok(
  'public'::name,
  'songs'::name,
  'band_id'::name,
  'public'::name,
  'bands'::name,
  'id'::name,
  'song references band'
);

select is(
  (select count(*)::integer
   from pg_type
   where typnamespace = 'public'::regnamespace
     and typname = 'lyric_status'),
  1,
  'lyric status enum exists'
);
select is(
  (select count(*)::integer
   from pg_enum e
   join pg_type t on t.oid = e.enumtypid
   where t.typnamespace = 'public'::regnamespace
     and t.typname = 'lyric_status'
     and e.enumlabel in ('missing', 'static', 'incomplete', 'synchronized')),
  4,
  'lyric status enum has all allowed values'
);

select is(
  (select relrowsecurity from pg_class where oid = 'public.songs'::regclass),
  true,
  'songs has row level security enabled'
);
select is(
  (select count(*)::integer
   from pg_attrdef d
   join pg_attribute a on a.attrelid = d.adrelid and a.attnum = d.adnum
   where d.adrelid = 'public.songs'::regclass
     and a.attname in ('created_at', 'updated_at')),
  2,
  'song timestamps have database defaults'
);

do $$
declare
  test_user_id uuid := '00000000-0000-0000-0000-000000000052';
  test_band_id uuid := '00000000-0000-0000-0000-000000000053';
begin
  insert into auth.users (id, aud, role, email)
  values (test_user_id, 'authenticated', 'authenticated', 'task-4-3@example.test');
  insert into public.profiles (id, display_name)
  values (test_user_id, 'Teste 4.3')
  on conflict (id) do update
  set display_name = excluded.display_name;
  insert into public.bands (id, name)
  values (test_band_id, 'Banda de teste 4.3');
end;
$$;

insert into public.songs (band_id, title, lyric_status)
values ('00000000-0000-0000-0000-000000000053', 'Sem letra', 'missing');

select is(
  (select count(*)::integer from public.songs where title = 'Sem letra'),
  1,
  'missing accepts an empty lyric document'
);

insert into public.songs (
  band_id,
  title,
  lyrics,
  lyric_status
)
values (
  '00000000-0000-0000-0000-000000000053',
  'Letra estática',
  '{"blocks":[{"id":"b1","name":"Verso","lines":[{"id":"l1","text":"Olá","startTimeMs":null}]}]}',
  'static'
);

insert into public.songs (
  band_id,
  title,
  lyrics,
  lyric_status
)
values (
  '00000000-0000-0000-0000-000000000053',
  'Letra incompleta',
  '{"blocks":[{"id":"b1","name":"Verso","lines":[{"id":"l1","text":"Olá","startTimeMs":1000},{"id":"l2","text":"mundo","startTimeMs":null}]}]}',
  'incomplete'
);

insert into public.songs (
  band_id,
  title,
  lyrics,
  lyric_status,
  estimated_duration_ms,
  youtube_reference
)
values (
  '00000000-0000-0000-0000-000000000053',
  'Letra sincronizada',
  '{"blocks":[{"id":"b1","name":"Verso","lines":[{"id":"l1","text":"Olá","startTimeMs":0},{"id":"l2","text":"mundo","startTimeMs":1000}]}]}',
  'synchronized',
  120000,
  'https://www.youtube.com/watch?v=demo'
);

select is(
  (select count(*)::integer from public.songs),
  4,
  'valid lyric states can be stored'
);

select throws_ok(
  $$
    insert into public.songs (
      band_id, title, lyrics, lyric_status
    ) values (
      '00000000-0000-0000-0000-000000000053',
      'JSON inválido',
      '{"lines":[]}',
      'missing'
    )
  $$,
  '23514',
  null,
  'invalid lyric structure is rejected'
);

select throws_ok(
  $$
    insert into public.songs (
      band_id, title, lyrics, lyric_status
    ) values (
      '00000000-0000-0000-0000-000000000053',
      'Estado incorreto',
      '{"blocks":[{"id":"b1","lines":[{"id":"l1","text":"Olá","startTimeMs":null}]}]}',
      'synchronized'
    )
  $$,
  '23514',
  null,
  'lyric status must match the document'
);

select throws_ok(
  $$
    insert into public.songs (
      band_id, title, lyrics, lyric_status
    ) values (
      '00000000-0000-0000-0000-000000000053',
      'Tempo inválido',
      '{"blocks":[{"id":"b1","lines":[{"id":"l1","text":"Olá","startTimeMs":-1}]}]}',
      'missing'
    )
  $$,
  '23514',
  null,
  'negative line time is rejected'
);

select throws_ok(
  $$
    insert into public.songs (
      band_id, title, lyrics, lyric_status
    ) values (
      '00000000-0000-0000-0000-000000000053',
      'IDs repetidos',
      '{"blocks":[{"id":"b1","lines":[{"id":"l1","text":"Olá"},{"id":"l1","text":"mundo"}]}]}',
      'static'
    )
  $$,
  '23514',
  null,
  'duplicate line identifiers are rejected'
);

select * from finish();

rollback;
