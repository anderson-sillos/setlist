begin;

select plan(33);

select has_table('public'::name, 'invitations'::name, 'invitations exists');
select col_is_pk(
  'public'::name,
  'invitations'::name,
  'id'::name,
  'invitations id is the primary key'
);
select col_not_null(
  'public'::name,
  'invitations'::name,
  'band_id'::name,
  'invitation band is required'
);
select col_not_null(
  'public'::name,
  'invitations'::name,
  'token_hash'::name,
  'invitation token hash is required'
);
select col_not_null(
  'public'::name,
  'invitations'::name,
  'created_at'::name,
  'invitation creation time is required'
);
select col_not_null(
  'public'::name,
  'invitations'::name,
  'expires_at'::name,
  'invitation expiry is required'
);
select fk_ok(
  'public'::name,
  'invitations'::name,
  'band_id'::name,
  'public'::name,
  'bands'::name,
  'id'::name,
  'invitation references band'
);
select fk_ok(
  'public'::name,
  'invitations'::name,
  'created_by'::name,
  'public'::name,
  'profiles'::name,
  'id'::name,
  'invitation records creator'
);
select fk_ok(
  'public'::name,
  'invitations'::name,
  'used_by'::name,
  'public'::name,
  'profiles'::name,
  'id'::name,
  'invitation records consumer'
);
select is(
  (select relrowsecurity from pg_class where oid = 'public.invitations'::regclass),
  true,
  'invitations has row level security enabled'
);

select is(
  (select count(*)::integer
   from pg_proc
   where pronamespace = 'public'::regnamespace
     and proname = 'create_invitation'),
  1,
  'create_invitation function exists'
);
select is(
  (select count(*)::integer
   from pg_proc
   where pronamespace = 'public'::regnamespace
     and proname = 'revoke_invitation'),
  1,
  'revoke_invitation function exists'
);
select is(
  (select count(*)::integer
   from pg_proc
   where pronamespace = 'public'::regnamespace
     and proname = 'accept_invitation'),
  1,
  'accept_invitation function exists'
);

do $$
declare
  owner_id uuid := '00000000-0000-0000-0000-000000000072';
  member_id uuid := '00000000-0000-0000-0000-000000000073';
  band_id uuid := '00000000-0000-0000-0000-000000000074';
  active_invitation_id uuid;
  default_invitation_id uuid;
begin
  insert into auth.users (id, aud, role, email)
  values
    (owner_id, 'authenticated', 'authenticated', 'task-4-5-owner@example.test'),
    (member_id, 'authenticated', 'authenticated', 'task-4-5-member@example.test');
  insert into public.profiles (id, display_name)
  values
    (owner_id, 'Owner 4.5'),
    (member_id, 'Member 4.5');
  insert into public.bands (id, name)
  values (band_id, 'Banda de teste 4.5');
  insert into public.band_members (band_id, user_id, role)
  values (band_id, owner_id, 'owner');

  perform set_config('request.jwt.claim.sub', owner_id::text, true);

  active_invitation_id := public.create_invitation(
    band_id,
    'convite-task-4-5-ativo',
    'Baixista',
    now() + interval '2 days'
  );
  default_invitation_id := public.create_invitation(
    band_id,
    'convite-task-4-5-padrao'
  );

  if active_invitation_id is null or default_invitation_id is null then
    raise exception 'invitation setup failed';
  end if;
end;
$$;

do $$
begin
  perform set_config(
    'request.jwt.claim.sub',
    '00000000-0000-0000-0000-000000000073',
    true
  );
end;
$$;

select ok(
  not exists (
    select 1 from public.invitations
    where token_hash in ('convite-task-4-5-ativo', 'convite-task-4-5-padrao')
  ),
  'raw invitation tokens are not persisted'
);
select is(
  (select count(*)::integer from public.invitations),
  2,
  'multiple active invitations are allowed'
);
select is(
  (select label from public.invitations
   where token_hash = encode(extensions.digest('convite-task-4-5-ativo', 'sha256'), 'hex')),
  'Baixista',
  'invitation labels are stored for organization'
);
select is(
  (select token_hash from public.invitations
   where token_hash = encode(extensions.digest('convite-task-4-5-ativo', 'sha256'), 'hex')),
  encode(extensions.digest('convite-task-4-5-ativo', 'sha256'), 'hex'),
  'only the token hash is persisted'
);
select ok(
  (select expires_at between now() + interval '6 days 23 hours'
                         and now() + interval '7 days 1 minute'
   from public.invitations
   where token_hash = encode(extensions.digest('convite-task-4-5-padrao', 'sha256'), 'hex')),
  'default invitation expiry is seven days'
);

select throws_ok(
  $$select public.create_invitation(
    '00000000-0000-0000-0000-000000000074',
    'convite-task-4-5-ativo'
  )$$,
  '23505',
  null,
  'the same token cannot create another invitation'
);
select throws_ok(
  $$select public.create_invitation(
    '00000000-0000-0000-0000-000000000074',
    '   '
  )$$,
  'P0001',
  null,
  'blank tokens are rejected'
);
select throws_ok(
  $$select public.create_invitation(
    '00000000-0000-0000-0000-000000000074',
    'convite-task-4-5-outro',
    '   '
  )$$,
  'P0001',
  null,
  'blank labels are rejected'
);
select throws_ok(
  $$select public.create_invitation(
    '00000000-0000-0000-0000-000000000074',
    'convite-task-4-5-vencido',
    null,
    now() - interval '1 minute'
  )$$,
  'P0001',
  null,
  'past expiry is rejected'
);
select throws_ok(
  $$insert into public.invitations (band_id, token_hash)
    values (
      '00000000-0000-0000-0000-000000000074',
      'token-em-texto-plano'
    )$$,
  '23514',
  null,
  'plain token values are rejected by the hash constraint'
);
select throws_ok(
  $$insert into public.invitations (band_id, token_hash, created_at, expires_at)
    values (
      '00000000-0000-0000-0000-000000000074',
      encode(extensions.digest('convite-task-4-5-criacao-invalida', 'sha256'), 'hex'),
      now(),
      now() - interval '1 minute'
    )$$,
  '23514',
  null,
  'an expiry cannot precede invitation creation'
);

select is(
  public.accept_invitation('convite-task-4-5-ativo'),
  '00000000-0000-0000-0000-000000000074'::uuid,
  'valid invitation returns its band'
);
select is(
  (select count(*)::integer
   from public.band_members
   where band_id = '00000000-0000-0000-0000-000000000074'
     and user_id = '00000000-0000-0000-0000-000000000073'
     and role = 'member'),
  1,
  'valid invitation adds the user as member'
);
select ok(
  (select used_at is not null and used_by = '00000000-0000-0000-0000-000000000073'::uuid
   from public.invitations
   where token_hash = encode(extensions.digest('convite-task-4-5-ativo', 'sha256'), 'hex')),
  'accepted invitation records its consumption'
);

select throws_ok(
  $$select public.accept_invitation('convite-task-4-5-ativo')$$,
  'P0001',
  null,
  'an invitation cannot be consumed twice'
);

select is(
  public.revoke_invitation(
    (select id from public.invitations
     where token_hash = encode(extensions.digest('convite-task-4-5-padrao', 'sha256'), 'hex'))
  ),
  true,
  'active invitation can be revoked'
);
select throws_ok(
  $$select public.accept_invitation('convite-task-4-5-padrao')$$,
  'P0001',
  null,
  'revoked invitation cannot be accepted'
);
select throws_ok(
  $$select public.revoke_invitation(
    (select id from public.invitations
     where token_hash = encode(extensions.digest('convite-task-4-5-padrao', 'sha256'), 'hex'))
  )$$,
  'P0001',
  null,
  'revoked invitation cannot be revoked again'
);

insert into public.invitations (
  band_id,
  token_hash,
  created_at,
  expires_at
)
values (
  '00000000-0000-0000-0000-000000000074',
  encode(extensions.digest('convite-task-4-5-expirado', 'sha256'), 'hex'),
  now() - interval '2 days',
  now() - interval '1 second'
);

select throws_ok(
  $$select public.accept_invitation('convite-task-4-5-expirado')$$,
  'P0001',
  null,
  'expired invitation cannot be accepted'
);
select throws_ok(
  $$select public.accept_invitation('token-inexistente')$$,
  'P0001',
  null,
  'unknown invitation cannot be accepted'
);

select * from finish();

rollback;
