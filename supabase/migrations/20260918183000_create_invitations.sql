create extension if not exists pgcrypto with schema extensions;

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  band_id uuid not null references public.bands (id) on delete cascade,
  token_hash text not null,
  label text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  revoked_at timestamptz,
  used_at timestamptz,
  used_by uuid references public.profiles (id) on delete set null,
  constraint invitations_token_hash_unique unique (token_hash),
  constraint invitations_token_hash_format check (token_hash ~ '^[0-9a-f]{64}$'),
  constraint invitations_label_not_blank check (
    label is null or btrim(label) <> ''
  ),
  constraint invitations_label_length check (
    label is null or char_length(label) between 1 and 120
  ),
  constraint invitations_expires_after_creation check (expires_at > created_at),
  constraint invitations_revoked_after_creation check (
    revoked_at is null or revoked_at >= created_at
  ),
  constraint invitations_used_after_creation check (
    used_at is null or used_at >= created_at
  )
);

create index invitations_band_active_idx
  on public.invitations (band_id, created_at desc)
  where revoked_at is null and used_at is null;
create index invitations_expires_at_idx on public.invitations (expires_at);

alter table public.invitations enable row level security;

create or replace function public.create_invitation(
  p_band_id uuid,
  p_token text,
  p_label text default null,
  p_expires_at timestamptz default null
)
returns uuid
language plpgsql
security invoker
set search_path = pg_catalog, public, auth, extensions
as $$
declare
  new_invitation_id uuid;
  invitation_expiry timestamptz := coalesce(
    p_expires_at,
    now() + interval '7 days'
  );
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED'
      using errcode = 'P0001';
  end if;

  if p_band_id is null then
    raise exception 'BAND_REQUIRED'
      using errcode = 'P0001';
  end if;

  if p_token is null
    or btrim(p_token) = ''
    or char_length(p_token) > 2048 then
    raise exception 'INVITATION_TOKEN_INVALID'
      using errcode = 'P0001';
  end if;

  if p_label is not null
    and (btrim(p_label) = '' or char_length(p_label) > 120) then
    raise exception 'INVITATION_LABEL_INVALID'
      using errcode = 'P0001';
  end if;

  if invitation_expiry <= now() then
    raise exception 'INVITATION_EXPIRY_INVALID'
      using errcode = 'P0001';
  end if;

  insert into public.invitations (
    band_id,
    token_hash,
    label,
    created_by,
    expires_at
  )
  values (
    p_band_id,
    encode(extensions.digest(p_token, 'sha256'), 'hex'),
    nullif(btrim(p_label), ''),
    auth.uid(),
    invitation_expiry
  )
  returning id into new_invitation_id;

  return new_invitation_id;
end;
$$;

create or replace function public.revoke_invitation(p_invitation_id uuid)
returns boolean
language plpgsql
security invoker
set search_path = pg_catalog, public, auth
as $$
declare
  revoked_count integer;
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED'
      using errcode = 'P0001';
  end if;

  update public.invitations
  set revoked_at = now()
  where id = p_invitation_id
    and revoked_at is null
    and used_at is null;

  get diagnostics revoked_count = row_count;
  if revoked_count = 0 then
    raise exception 'INVITATION_NOT_AVAILABLE'
      using errcode = 'P0001';
  end if;

  return true;
end;
$$;

create or replace function public.accept_invitation(p_token text)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, auth, extensions
as $$
declare
  current_user_id uuid := auth.uid();
  invitation_record public.invitations;
begin
  if current_user_id is null then
    raise exception 'AUTHENTICATION_REQUIRED'
      using errcode = 'P0001';
  end if;

  if p_token is null
    or btrim(p_token) = ''
    or char_length(p_token) > 2048 then
    raise exception 'INVITATION_NOT_AVAILABLE'
      using errcode = 'P0001';
  end if;

  select invitation.*
  into invitation_record
  from public.invitations as invitation
  where invitation.token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
  for update;

  if not found
    or invitation_record.revoked_at is not null
    or invitation_record.used_at is not null
    or invitation_record.expires_at <= now() then
    raise exception 'INVITATION_NOT_AVAILABLE'
      using errcode = 'P0001';
  end if;

  insert into public.band_members (band_id, user_id, role)
  values (invitation_record.band_id, current_user_id, 'member')
  on conflict (band_id, user_id) do nothing;

  update public.invitations
  set used_at = now(),
      used_by = current_user_id
  where id = invitation_record.id;

  return invitation_record.band_id;
end;
$$;

revoke all on function public.create_invitation(uuid, text, text, timestamptz)
  from public;
revoke all on function public.revoke_invitation(uuid) from public;
revoke all on function public.accept_invitation(text) from public;
grant execute on function public.create_invitation(uuid, text, text, timestamptz)
  to authenticated;
grant execute on function public.revoke_invitation(uuid) to authenticated;
grant execute on function public.accept_invitation(text) to authenticated;
