-- Mantém a cópia Postgres dos logs de autenticação por no máximo 30 dias.
-- A pré-condição é intencionalmente fail-closed para não alterar a tabela
-- gerenciada se esquema ou privilégios divergirem do esperado.
do $$
begin
  if to_regclass('auth.audit_log_entries') is null then
    raise exception 'auth.audit_log_entries não existe; limpeza de auditoria não foi instalada';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'auth'
      and table_name = 'audit_log_entries'
      and column_name = 'created_at'
      and data_type = 'timestamp with time zone'
  ) then
    raise exception 'auth.audit_log_entries.created_at não é timestamptz; limpeza de auditoria não foi instalada';
  end if;

  if not has_table_privilege(current_user, 'auth.audit_log_entries', 'DELETE') then
    raise exception 'a role atual não pode excluir auth.audit_log_entries; limpeza de auditoria não foi instalada';
  end if;

  if row_security_active('auth.audit_log_entries') then
    raise exception 'RLS está ativa para a role atual em auth.audit_log_entries; limpeza de auditoria não foi instalada';
  end if;
end;
$$;

create table private.auth_audit_retention_holds (
  audit_log_entry_id uuid primary key,
  reason text not null check (btrim(reason) <> ''),
  hold_until timestamptz not null,
  created_at timestamptz not null default now(),
  constraint auth_audit_retention_holds_future_end
    check (hold_until > created_at)
);

comment on table private.auth_audit_retention_holds is
  'Exceções administrativas com prazo para conservar registros Auth em apuração; não incluir dados pessoais no motivo.';

create index auth_audit_retention_holds_until_idx
  on private.auth_audit_retention_holds (hold_until);

create or replace function private.prune_auth_audit_log_entries()
returns integer
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  deleted_count integer;
begin
  delete from private.auth_audit_retention_holds as retention_hold
  where retention_hold.hold_until <= now()
    or not exists (
      select 1
      from auth.audit_log_entries as audit_entry
      where audit_entry.id = retention_hold.audit_log_entry_id
    );

  delete from auth.audit_log_entries as audit_entry
  where audit_entry.created_at < now() - interval '30 days'
    and not exists (
      select 1
      from private.auth_audit_retention_holds as retention_hold
      where retention_hold.audit_log_entry_id = audit_entry.id
        and retention_hold.hold_until > now()
    );

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function private.prune_auth_audit_log_entries()
  from public, anon, authenticated;
revoke all on table private.auth_audit_retention_holds
  from public, anon, authenticated;

select cron.schedule(
  'setlist-prune-auth-audit-logs',
  '20 3 * * *',
  $$select private.prune_auth_audit_log_entries()$$
);
