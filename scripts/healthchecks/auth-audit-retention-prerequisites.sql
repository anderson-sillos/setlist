-- Consulta somente metadados. Execute no SQL Editor de setlist-prod como a
-- mesma role que aplicaria a migração. Não lê linhas da auditoria.
select
  to_regclass('auth.audit_log_entries') is not null as table_exists,
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'auth'
      and table_name = 'audit_log_entries'
      and column_name = 'created_at'
      and data_type = 'timestamp with time zone'
  ) as created_at_is_timestamptz,
  case
    when to_regclass('auth.audit_log_entries') is null then false
    else has_table_privilege(current_user, 'auth.audit_log_entries', 'DELETE')
  end as current_role_can_delete,
  case
    when to_regclass('auth.audit_log_entries') is null then true
    else not row_security_active('auth.audit_log_entries')
  end as current_role_bypasses_effective_rls,
  coalesce((
    select relrowsecurity
    from pg_class
    where oid = to_regclass('auth.audit_log_entries')
  ), false) as row_level_security_enabled;
