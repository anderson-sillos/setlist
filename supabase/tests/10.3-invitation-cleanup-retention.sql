begin;

select plan(4);

insert into public.bands (id, name)
values ('00000000-0000-4000-8000-000000001030', 'Banda de retenção Healthchecks');

insert into public.invitations (
  id, band_id, token_hash, created_at, expires_at
)
values
  (
    '00000000-0000-4000-8000-000000001031',
    '00000000-0000-4000-8000-000000001030',
    repeat('a', 64),
    now() - interval '60 days',
    now() - interval '31 days'
  ),
  (
    '00000000-0000-4000-8000-000000001032',
    '00000000-0000-4000-8000-000000001030',
    repeat('b', 64),
    now() - interval '60 days',
    now() - interval '31 days'
  ),
  (
    '00000000-0000-4000-8000-000000001033',
    '00000000-0000-4000-8000-000000001030',
    repeat('c', 64),
    now() - interval '20 days',
    now() - interval '10 days'
  );

insert into private.invitation_retention_holds (
  invitation_id, reason, hold_until
)
values (
  '00000000-0000-4000-8000-000000001032',
  'Apuração sintética do teste de retenção',
  now() + interval '1 day'
);

select lives_ok(
  'select private.prune_invitations()',
  'a limpeza diária de convites conclui sem erro'
);

select is(
  (select count(*)::integer from public.invitations
   where id = '00000000-0000-4000-8000-000000001031'),
  0,
  'remove convite encerrado há mais de 30 dias sem suspensão'
);

select is(
  (select count(*)::integer from public.invitations
   where id = '00000000-0000-4000-8000-000000001032'),
  1,
  'preserva convite elegível com suspensão vigente'
);

select is(
  (select count(*)::integer from public.invitations
   where id = '00000000-0000-4000-8000-000000001033'),
  1,
  'preserva convite encerrado há menos de 30 dias'
);

select * from finish();

rollback;
