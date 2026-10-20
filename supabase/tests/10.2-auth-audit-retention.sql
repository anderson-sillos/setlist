begin;

select plan(7);

select ok(
  has_table_privilege(current_user, 'auth.audit_log_entries', 'DELETE'),
  'a role de teste pode excluir linhas da tabela Auth gerenciada'
);

insert into auth.audit_log_entries (instance_id, id, payload, created_at)
values
  (
    null,
    '00000000-0000-4000-8000-000000000001',
    '{"test_marker":"old-retention-row"}'::json,
    now() - interval '31 days'
  ),
  (
    null,
    '00000000-0000-4000-8000-000000000002',
    '{"test_marker":"recent-retention-row"}'::json,
    now() - interval '29 days'
  ),
  (
    null,
    '00000000-0000-4000-8000-000000000003',
    '{"test_marker":"held-retention-row"}'::json,
    now() - interval '31 days'
  ),
  (
    null,
    '00000000-0000-4000-8000-000000000004',
    '{"test_marker":"expired-hold-row"}'::json,
    now() - interval '31 days'
  );

insert into private.auth_audit_retention_holds (
  audit_log_entry_id, reason, hold_until, created_at
)
values
  (
    '00000000-0000-4000-8000-000000000003',
    'Caso sintético de retenção temporária',
    now() + interval '1 day',
    now()
  ),
  (
    '00000000-0000-4000-8000-000000000004',
    'Caso sintético de retenção encerrada',
    now() - interval '1 day',
    now() - interval '2 days'
  );

select lives_ok(
  'select private.prune_auth_audit_log_entries()',
  'a rotina de retenção conclui sem erro'
);

select is(
  (select count(*)::integer
   from auth.audit_log_entries
   where id = '00000000-0000-4000-8000-000000000001'),
  0,
  'a rotina remove o registro de teste com mais de 30 dias'
);

select is(
  (select count(*)::integer
   from auth.audit_log_entries
   where id = '00000000-0000-4000-8000-000000000002'),
  1,
  'a rotina preserva o registro de teste dentro dos 30 dias'
);

select is(
  (select count(*)::integer
   from auth.audit_log_entries
   where id = '00000000-0000-4000-8000-000000000003'),
  1,
  'a rotina preserva registro antigo com exceção vigente'
);

select is(
  (select count(*)::integer
   from auth.audit_log_entries
   where id = '00000000-0000-4000-8000-000000000004'),
  0,
  'a rotina remove registro antigo quando a exceção expirou'
);

select is(
  (select count(*)::integer
   from private.auth_audit_retention_holds
   where audit_log_entry_id = '00000000-0000-4000-8000-000000000004'),
  0,
  'a rotina remove metadados de exceções expiradas'
);

select * from finish();

rollback;
