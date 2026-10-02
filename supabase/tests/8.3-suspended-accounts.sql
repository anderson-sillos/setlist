begin;

select plan(8);

do $$
declare
  user_id uuid := '00000000-0000-0000-0000-000000000831';
  band_id uuid := '00000000-0000-0000-0000-000000000832';
  song_id uuid := '00000000-0000-0000-0000-000000000833';
begin
  insert into auth.users (id, aud, role, email)
  values (user_id, 'authenticated', 'authenticated', 'task-8-3-user@example.test');

  insert into public.profiles (id, display_name)
  values (user_id, 'Suspended 8.3')
  on conflict (id) do update
  set display_name = excluded.display_name;

  insert into public.bands (id, name)
  values (band_id, 'Banda de suspensão 8.3');

  insert into public.band_members (band_id, user_id, role)
  values (band_id, user_id, 'owner');

  insert into public.songs (id, band_id, title)
  values (song_id, band_id, 'Música de suspensão 8.3');

  insert into public.suspended_accounts (user_id, reason, recorded_by)
  values (user_id, 'Teste administrativo', 'Teste pgTAP');
end;
$$;

select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000831', true);

select ok(
  exists (
    select 1
    from pg_db_role_setting as setting
    join pg_roles as db_role on db_role.oid = setting.setrole
    cross join lateral unnest(setting.setconfig) as config(value)
    where db_role.rolname = 'authenticator'
      and config.value = 'pgrst.db_pre_request=public.reject_suspended_request'
  ),
  'the API authenticator runs the suspension check before each request'
);
select ok(
  public.is_account_suspended(),
  'the account suspension record is recognized for the current identity'
);

-- Mantém o papel de execução privilegiado para o pgTAP poder registrar a
-- asserção; as claims abaixo simulam a requisição autenticada do usuário.
select throws_ok(
  $$select public.reject_suspended_request()$$,
  '42501',
  'ACCOUNT_SUSPENDED',
  'the pre-request check rejects a session that was already issued'
);

set local role authenticated;
select is(
  (select count(*)::integer from public.bands
   where id = '00000000-0000-0000-0000-000000000832'),
  0,
  'a suspended user cannot read its band through RLS'
);
select is(
  (select count(*)::integer from public.songs
   where id = '00000000-0000-0000-0000-000000000833'),
  0,
  'a suspended user cannot read songs through RLS'
);
select throws_ok(
  $$insert into public.songs (band_id, title)
    values ('00000000-0000-0000-0000-000000000832', 'Bloqueada')$$,
  '42501',
  null,
  'a suspended user cannot write through RLS'
);
select throws_ok(
  $$select * from public.suspended_accounts$$,
  '42501',
  null,
  'authenticated clients cannot read suspension records'
);
select throws_ok(
  $$insert into public.suspended_accounts (user_id, reason, recorded_by)
    values (
      '00000000-0000-0000-0000-000000000831',
      'attempto do cliente',
      'authenticated'
    )$$,
  '42501',
  null,
  'authenticated clients cannot add or reverse suspension records'
);

select * from finish();

rollback;
