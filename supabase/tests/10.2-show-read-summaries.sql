begin;

select plan(10);

do $$
declare
  owner_id uuid := '00000000-0000-0000-0000-000000002001';
  band_id uuid := '00000000-0000-0000-0000-000000002011';
  repeated_song_id uuid := '00000000-0000-0000-0000-000000002021';
  zero_song_id uuid := '00000000-0000-0000-0000-000000002022';
  archived_song_id uuid := '00000000-0000-0000-0000-000000002023';
  unknown_song_id uuid := '00000000-0000-0000-0000-000000002024';
  moderated_song_id uuid := '00000000-0000-0000-0000-000000002025';
  primary_show_id uuid := '00000000-0000-0000-0000-000000002031';
  unknown_show_id uuid := '00000000-0000-0000-0000-000000002032';
  zero_show_id uuid := '00000000-0000-0000-0000-000000002033';
  primary_block_a_id uuid := '00000000-0000-0000-0000-000000002041';
  primary_block_b_id uuid := '00000000-0000-0000-0000-000000002042';
  unknown_block_id uuid := '00000000-0000-0000-0000-000000002043';
  zero_block_id uuid := '00000000-0000-0000-0000-000000002044';
begin
  insert into auth.users (id, aud, role, email)
  values (owner_id, 'authenticated', 'authenticated', 'task-10-2-owner@example.test');

  insert into public.bands (id, name)
  values (band_id, 'Banda dos resumos de shows');

  insert into public.band_members (band_id, user_id, role)
  values (band_id, owner_id, 'owner');

  insert into public.songs (id, band_id, title, estimated_duration_ms, archived_at)
  values
    (repeated_song_id, band_id, 'Música repetida', 120000, null),
    (zero_song_id, band_id, 'Música com duração zero', 0, null),
    (archived_song_id, band_id, 'Música arquivada no show', 90000, statement_timestamp()),
    (unknown_song_id, band_id, 'Música sem duração', null, null),
    (moderated_song_id, band_id, 'Música ocultada', 45000, null);

  insert into public.shows (id, band_id, name, starts_at, venue, status)
  values
    (primary_show_id, band_id, 'Show com vários itens', statement_timestamp() + interval '10 days', 'Casa A', 'draft'),
    (unknown_show_id, band_id, 'Show sem duração', statement_timestamp() + interval '11 days', 'Casa B', 'draft'),
    (zero_show_id, band_id, 'Show com duração zero', statement_timestamp() + interval '12 days', 'Casa C', 'draft');

  insert into public.show_blocks (id, show_id, name, position)
  values
    (primary_block_a_id, primary_show_id, 'Primeiro bloco', 0),
    (primary_block_b_id, primary_show_id, 'Segundo bloco', 1),
    (unknown_block_id, unknown_show_id, 'Sem tempos', 0),
    (zero_block_id, zero_show_id, 'Tempo zero', 0);

  insert into public.show_items (block_id, position, item_type, song_id, description, estimated_duration_ms)
  values
    (primary_block_a_id, 0, 'song', repeated_song_id, null, null),
    (primary_block_a_id, 1, 'song', repeated_song_id, null, null),
    (primary_block_a_id, 2, 'planning', null, 'Troca de instrumento', 30000),
    (primary_block_a_id, 3, 'separator', null, null, null),
    (primary_block_b_id, 0, 'song', zero_song_id, null, null),
    (primary_block_b_id, 1, 'song', archived_song_id, null, null),
    (primary_block_b_id, 2, 'song', unknown_song_id, null, null),
    (primary_block_b_id, 3, 'song', moderated_song_id, null, null),
    (unknown_block_id, 0, 'song', unknown_song_id, null, null),
    (unknown_block_id, 1, 'planning', null, 'Pausa sem previsão', null),
    (unknown_block_id, 2, 'separator', null, null, null),
    (zero_block_id, 0, 'song', zero_song_id, null, null),
    (zero_block_id, 1, 'planning', null, 'Pausa sem duração', null),
    (zero_block_id, 2, 'separator', null, null, null);

  insert into public.moderated_songs (song_id, reason, recorded_by)
  values (moderated_song_id, 'Ocultada para teste do resumo', 'Teste pgTAP');
end;
$$;

select ok(
  has_table_privilege('authenticated', 'public.show_summaries', 'select'),
  'O resumo de shows pode ser consultado por authenticated'
);
select ok(
  (select reloptions @> array['security_invoker=true']::text[]
   from pg_class where oid = 'public.show_summaries'::regclass),
  'O resumo de shows executa com as permissões de quem consulta'
);
select is(
  (select array_agg(attribute.attname::text order by attribute.attnum)
   from pg_attribute as attribute
   where attribute.attrelid = 'public.show_summaries'::regclass
     and attribute.attnum > 0
     and not attribute.attisdropped),
  array['id', 'band_id', 'name', 'starts_at', 'venue', 'status', 'estimated_duration_ms']::text[],
  'O resumo não inclui blocos ou itens completos da setlist'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000002001', true);

select is(
  (select count(*)::integer from public.show_summaries),
  3,
  'O integrante recebe os três shows da própria banda'
);
select is(
  (select count(*)::integer from public.songs where id = '00000000-0000-0000-0000-000000002023'),
  1,
  'Uma música arquivada continua consultável na setlist já salva'
);
select is(
  (select estimated_duration_ms from public.show_summaries where id = '00000000-0000-0000-0000-000000002031'),
  360000::numeric,
  'A duração soma blocos, ocorrências repetidas e música arquivada; ignora separadores, ausências e música moderada'
);
select is(
  (select estimated_duration_ms from public.show_summaries where id = '00000000-0000-0000-0000-000000002032'),
  null::numeric,
  'A duração é nula quando todos os tempos estão ausentes'
);
select is(
  (select estimated_duration_ms from public.show_summaries where id = '00000000-0000-0000-0000-000000002033'),
  0::numeric,
  'Uma duração conhecida de zero permanece diferente de duração ausente'
);
select is(
  (select count(*)::integer from public.show_items where song_id = '00000000-0000-0000-0000-000000002025'),
  0,
  'A ocorrência da música moderada é removida pelas políticas de leitura'
);

reset role;
update public.songs
set estimated_duration_ms = 180000
where id = '00000000-0000-0000-0000-000000002021';
set local role authenticated;
select is(
  (select estimated_duration_ms from public.show_summaries where id = '00000000-0000-0000-0000-000000002031'),
  480000::numeric,
  'Alterar a duração de uma música atualiza o resumo sem salvar novamente a setlist'
);

select * from finish();

rollback;
