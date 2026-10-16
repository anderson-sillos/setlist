begin;

select plan(14);

do $$
declare
  owner_id uuid := '00000000-0000-0000-0000-000000001001';
  outsider_id uuid := '00000000-0000-0000-0000-000000001002';
  suspended_id uuid := '00000000-0000-0000-0000-000000001003';
  band_id uuid := '00000000-0000-0000-0000-000000001011';
  archived_only_band_id uuid := '00000000-0000-0000-0000-000000001012';
  outsider_band_id uuid := '00000000-0000-0000-0000-000000001013';
begin
  insert into auth.users (id, aud, role, email)
  values
    (owner_id, 'authenticated', 'authenticated', 'task-10-1-owner@example.test'),
    (outsider_id, 'authenticated', 'authenticated', 'task-10-1-outsider@example.test'),
    (suspended_id, 'authenticated', 'authenticated', 'task-10-1-suspended@example.test');

  insert into public.profiles (id, display_name)
  values
    (owner_id, 'Owner dos resumos'),
    (outsider_id, 'Pessoa externa dos resumos'),
    (suspended_id, 'Conta suspensa dos resumos')
  on conflict (id) do update
  set display_name = excluded.display_name;

  insert into public.bands (id, name)
  values
    (band_id, 'Banda com próximos shows'),
    (archived_only_band_id, 'Banda sem músicas ativas'),
    (outsider_band_id, 'Banda de outra pessoa');

  insert into public.band_members (band_id, user_id, role)
  values
    (band_id, owner_id, 'owner'),
    (archived_only_band_id, owner_id, 'editor'),
    (band_id, suspended_id, 'member'),
    (outsider_band_id, outsider_id, 'owner');

  insert into public.suspended_accounts (user_id, reason, recorded_by)
  values (suspended_id, 'Suspensão usada no teste', 'Teste pgTAP');

  insert into public.songs (band_id, title, archived_at)
  values
    (band_id, 'Música ativa', null),
    (archived_only_band_id, 'Música arquivada', statement_timestamp());

  insert into public.shows (band_id, name, starts_at, venue, status)
  values
    (band_id, 'Show passado', statement_timestamp() - interval '1 day', 'Casa A', 'ready'),
    (band_id, 'Show cancelado próximo', statement_timestamp() + interval '1 day', 'Casa B', 'cancelled'),
    (band_id, 'Primeiro show elegível', statement_timestamp() + interval '2 days 1 hour', 'Casa C', 'draft'),
    (band_id, 'Segundo show no mesmo dia', statement_timestamp() + interval '2 days 5 hours', 'Casa D', 'ready'),
    (band_id, 'Show posterior', statement_timestamp() + interval '3 days', 'Casa E', 'ready');
end;
$$;

select ok(
  has_table_privilege('authenticated', 'public.band_context', 'select'),
  'O contexto da banda pode ser consultado por authenticated'
);
select ok(
  has_table_privilege('authenticated', 'public.user_band_summaries', 'select'),
  'Os resumos de Minhas bandas podem ser consultados por authenticated'
);
select ok(
  (select reloptions @> array['security_invoker=true']::text[]
   from pg_class where oid = 'public.band_context'::regclass),
  'A view de contexto executa com as permissões de quem consulta'
);
select ok(
  (select reloptions @> array['security_invoker=true']::text[]
   from pg_class where oid = 'public.user_band_summaries'::regclass),
  'A view de Minhas bandas executa com as permissões de quem consulta'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000001001', true);
select is(
  (select role::text from public.band_context where band_id = '00000000-0000-0000-0000-000000001011'),
  'owner',
  'O contexto retorna o papel atual da pessoa na banda'
);
select is(
  (select has_active_songs from public.band_context where band_id = '00000000-0000-0000-0000-000000001011'),
  true,
  'O contexto reconhece músicas ativas consultáveis'
);
select is(
  (select has_active_songs from public.band_context where band_id = '00000000-0000-0000-0000-000000001012'),
  false,
  'O contexto não considera músicas arquivadas como ativas'
);
select is(
  (select count(*)::integer from public.user_band_summaries),
  2,
  'Minhas bandas retorna em uma leitura as bandas com participação'
);
select is(
  (select next_show_starts_at from public.user_band_summaries where band_id = '00000000-0000-0000-0000-000000001011'),
  (select starts_at from public.shows where band_id = '00000000-0000-0000-0000-000000001011' and name = 'Primeiro show elegível'),
  'O resumo usa o show futuro não cancelado mais próximo'
);
select is(
  (select next_show_starts_at from public.user_band_summaries where band_id = '00000000-0000-0000-0000-000000001012'),
  null::timestamptz,
  'A ausência de próximo show é representada como nula'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000001002', true);
select is(
  (select count(*) = 1 and bool_and(band_id = '00000000-0000-0000-0000-000000001013')
   from public.band_context),
  true,
  'Pessoa externa recebe o contexto somente da própria banda'
);
select is(
  (select count(*) = 1 and bool_and(band_id = '00000000-0000-0000-0000-000000001013')
   from public.user_band_summaries),
  true,
  'Pessoa externa recebe o resumo somente da própria banda'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000001003', true);
select is((select count(*)::integer from public.band_context), 0, 'Conta suspensa não recebe contexto com sessão antiga');
select is((select count(*)::integer from public.user_band_summaries), 0, 'Conta suspensa não recebe resumos com sessão antiga');

select * from finish();

rollback;
