-- O registro de frequência é transitório; o histórico do caso fica no e-mail.
create or replace function private.prune_report_rate_limits()
returns integer
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  deleted_count integer;
begin
  delete from public.report_rate_limits
  where next_allowed_at < now() - interval '24 hours';

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function private.prune_report_rate_limits()
  from public, anon, authenticated;

select cron.schedule(
  'setlist-prune-report-rate-limits',
  '10 3 * * *',
  $$select private.prune_report_rate_limits()$$
);
