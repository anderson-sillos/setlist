create view public.band_context
with (security_invoker = true)
as
select
  band.id as band_id,
  band.name as band_name,
  membership.role,
  exists (
    select 1
    from public.songs as song
    where song.band_id = band.id
      and song.archived_at is null
  ) as has_active_songs
from public.band_members as membership
join public.bands as band on band.id = membership.band_id
where membership.user_id = auth.uid();

comment on view public.band_context is
  'Contexto mínimo da banda atual para a pessoa autenticada, protegido pelas políticas RLS das tabelas de origem.';

grant select on public.band_context to authenticated;

create view public.user_band_summaries
with (security_invoker = true)
as
select
  band.id as band_id,
  band.name as band_name,
  membership.role,
  next_show.starts_at as next_show_starts_at
from public.band_members as membership
join public.bands as band on band.id = membership.band_id
left join lateral (
  select upcoming_show.starts_at
  from public.shows as upcoming_show
  where upcoming_show.band_id = band.id
    and upcoming_show.status <> 'cancelled'
    and upcoming_show.starts_at >= statement_timestamp()
  order by upcoming_show.starts_at asc
  limit 1
) as next_show on true
where membership.user_id = auth.uid();

comment on view public.user_band_summaries is
  'Resumo das bandas acessíveis pela pessoa autenticada e a data do primeiro show futuro não cancelado.';

grant select on public.user_band_summaries to authenticated;
