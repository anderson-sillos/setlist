begin;

select plan(12);

select is(
  (select count(*)::integer
   from pg_proc
   where pronamespace = 'public'::regnamespace
     and proname = 'get_invitation_preview'),
  1,
  'get_invitation_preview function exists'
);
select is(
  (select count(*)::integer
   from pg_proc
   where pronamespace = 'public'::regnamespace
     and proname = 'renew_invitation'),
  1,
  'renew_invitation function exists'
);

do $$
declare
  owner_id uuid := '00000000-0000-0000-0000-000000000075';
  band_id uuid := '00000000-0000-0000-0000-000000000076';
begin
  insert into auth.users (id, aud, role, email)
  values (owner_id, 'authenticated', 'authenticated', 'task-5-6-owner@example.test');
  insert into public.profiles (id, display_name)
  values (owner_id, 'Owner 5.6');
  insert into public.bands (id, name)
  values (band_id, 'Banda de teste 5.6');
  insert into public.band_members (band_id, user_id, role)
  values (band_id, owner_id, 'owner');
  perform set_config('request.jwt.claim.sub', owner_id::text, true);
  perform public.create_invitation(
    band_id,
    'convite-task-5-6-preview',
    'Tecladista'
  );
end;
$$;

select is(
  (select band_name from public.get_invitation_preview('convite-task-5-6-preview')),
  'Banda de teste 5.6',
  'preview exposes only the invited band name'
);
select is(
  (select label from public.get_invitation_preview('convite-task-5-6-preview')),
  'Tecladista',
  'preview preserves the optional label'
);
select ok(
  (select expires_at > now() from public.get_invitation_preview('convite-task-5-6-preview')),
  'preview exposes only a future expiry'
);
select throws_ok(
  $$select * from public.get_invitation_preview('convite-task-5-6-inexistente')$$,
  'P0001',
  null,
  'unknown preview is rejected'
);

select is(
  public.renew_invitation(
    (select id from public.invitations
     where token_hash = encode(extensions.digest('convite-task-5-6-preview', 'sha256'), 'hex')),
    'convite-task-5-6-renovado'
  ) is not null,
  true,
  'active invitation can be renewed'
);
select ok(
  (select revoked_at is not null
   from public.invitations
   where token_hash = encode(extensions.digest('convite-task-5-6-preview', 'sha256'), 'hex')),
  'renewal revokes the previous invitation'
);
select is(
  (select label from public.invitations
   where token_hash = encode(extensions.digest('convite-task-5-6-renovado', 'sha256'), 'hex')),
  'Tecladista',
  'renewal preserves the organizational label'
);

select is(
  public.revoke_invitation(
    (select id from public.invitations
     where token_hash = encode(extensions.digest('convite-task-5-6-renovado', 'sha256'), 'hex'))
  ),
  true,
  'renewed invitation can be revoked'
);
select is(
  public.renew_invitation(
    (select id from public.invitations
     where token_hash = encode(extensions.digest('convite-task-5-6-renovado', 'sha256'), 'hex')),
    'convite-task-5-6-substituto'
  ) is not null,
  true,
  'revoked invitation can be replaced'
);
select ok(
  not exists (
    select 1 from public.invitations
    where token_hash in ('convite-task-5-6-preview', 'convite-task-5-6-renovado')
  ),
  'raw tokens never appear in invitation storage'
);

select * from finish();

rollback;
