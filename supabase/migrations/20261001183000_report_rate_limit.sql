-- Guarda apenas a janela de envio; o e-mail é o registro operacional.
create table public.report_rate_limits (
  user_id uuid primary key references auth.users (id) on delete cascade,
  ticket uuid not null,
  next_allowed_at timestamptz not null
);

alter table public.report_rate_limits enable row level security;
revoke all on public.report_rate_limits from anon, authenticated;

create or replace function public.claim_report_slot()
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  claimed_ticket uuid;
begin
  -- A Edge Function valida a participação pela RLS antes de reservar a janela.
  -- Assim esta migration pode anteceder as medidas administrativas restantes.
  if auth.uid() is null then
    return null;
  end if;

  insert into public.report_rate_limits (user_id, ticket, next_allowed_at)
  values (auth.uid(), gen_random_uuid(), now() + interval '1 minute')
  on conflict (user_id) do update
    set ticket = excluded.ticket,
        next_allowed_at = excluded.next_allowed_at
    where public.report_rate_limits.next_allowed_at <= now()
  returning ticket into claimed_ticket;

  return claimed_ticket;
end;
$$;

create or replace function public.release_report_slot(p_ticket uuid)
returns void
language sql
security definer
set search_path = pg_catalog, public
as $$
  delete from public.report_rate_limits where ticket = p_ticket;
$$;

revoke all on function public.claim_report_slot() from public;
revoke all on function public.release_report_slot(uuid) from public;
revoke all on function public.claim_report_slot() from anon;
revoke all on function public.release_report_slot(uuid) from anon, authenticated;
grant execute on function public.claim_report_slot() to authenticated;
grant execute on function public.release_report_slot(uuid) to service_role;
