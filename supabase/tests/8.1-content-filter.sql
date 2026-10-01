begin;

select plan(7);

insert into auth.users (id, aud, role, email)
values ('00000000-0000-0000-0000-000000000801', 'authenticated', 'authenticated', 'filter-test@example.test');

insert into public.profiles (id, display_name)
values ('00000000-0000-0000-0000-000000000801', 'Filtro');

insert into public.bands (id, name)
values ('00000000-0000-0000-0000-000000000802', 'Banda do filtro');

select is(
  (select count(*)::integer from pg_trigger
   where tgrelid = 'public.songs'::regclass
     and tgname = 'songs_filter_content'
     and not tgisinternal),
  1,
  'o filtro é um gatilho obrigatório da tabela songs'
);

insert into public.songs (id, band_id, title, notes)
values (
  '00000000-0000-0000-0000-000000000803',
  '00000000-0000-0000-0000-000000000802',
  'Música permitida',
  'Observação comum'
);

select is(
  (select count(*)::integer from public.songs
   where id = '00000000-0000-0000-0000-000000000803'),
  1,
  'conteúdo comum é salvo'
);

select throws_ok(
  $$insert into public.songs (band_id, title)
    values ('00000000-0000-0000-0000-000000000802', 'https://pornhub.com/video')$$,
  'P0001',
  'CONTENT_REJECTED',
  'link pornográfico é recusado antes da inserção'
);

select throws_ok(
  $$insert into public.songs (band_id, title, notes)
    values ('00000000-0000-0000-0000-000000000802', 'Título', 'vendo material de abuso sexual infantil')$$,
  'P0001',
  'CONTENT_REJECTED',
  'oferta explícita de exploração é recusada nas observações'
);

select throws_ok(
  $$insert into public.songs (band_id, title, lyrics, lyric_status)
    values (
      '00000000-0000-0000-0000-000000000802',
      'Título',
      '{"blocks":[{"id":"b1","lines":[{"id":"l1","text":"xvideos.com"}]}]}',
      'static'
    )$$,
  'P0001',
  'CONTENT_REJECTED',
  'o filtro também examina a letra'
);

select throws_ok(
  $$update public.songs set notes = 'xhamster.com'
    where id = '00000000-0000-0000-0000-000000000803'$$,
  'P0001',
  'CONTENT_REJECTED',
  'edição sinalizada é recusada'
);

select is(
  (select notes from public.songs
   where id = '00000000-0000-0000-0000-000000000803'),
  'Observação comum',
  'edição recusada preserva a versão anterior'
);

select * from finish();

rollback;
