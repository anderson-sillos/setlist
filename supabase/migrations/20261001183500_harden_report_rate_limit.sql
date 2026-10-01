-- Corrige privilégios explícitos que podem vir dos default privileges do Supabase.
-- A função administrativa ainda confere o papel para impedir uso via RPC.
create or replace function public.release_report_slot(p_ticket uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'REPORT_ADMIN_REQUIRED' using errcode = '42501';
  end if;

  delete from public.report_rate_limits where ticket = p_ticket;
end;
$$;

revoke all on function public.release_report_slot(uuid) from public, anon, authenticated;
grant execute on function public.release_report_slot(uuid) to service_role;
