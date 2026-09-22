create or replace function public.get_invitation_preview(p_token text)
returns table (
  band_id uuid,
  band_name text,
  label text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = pg_catalog, public, auth, extensions
as $$
begin
  if p_token is null
    or btrim(p_token) = ''
    or char_length(p_token) > 2048 then
    raise exception 'INVITATION_NOT_AVAILABLE'
      using errcode = 'P0001';
  end if;

  return query
  select invitation.band_id,
         band.name,
         invitation.label,
         invitation.expires_at
  from public.invitations as invitation
  join public.bands as band on band.id = invitation.band_id
  where invitation.token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
    and invitation.revoked_at is null
    and invitation.used_at is null
    and invitation.expires_at > now();

  if not found then
    raise exception 'INVITATION_NOT_AVAILABLE'
      using errcode = 'P0001';
  end if;
end;
$$;

create or replace function public.renew_invitation(
  p_invitation_id uuid,
  p_token text,
  p_expires_at timestamptz default null
)
returns uuid
language plpgsql
security invoker
set search_path = pg_catalog, public, auth, extensions
as $$
declare
  old_invitation public.invitations;
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

  if p_token is null
    or btrim(p_token) = ''
    or char_length(p_token) > 2048 then
    raise exception 'INVITATION_TOKEN_INVALID'
      using errcode = 'P0001';
  end if;

  if invitation_expiry <= now() then
    raise exception 'INVITATION_EXPIRY_INVALID'
      using errcode = 'P0001';
  end if;

  update public.invitations
  set revoked_at = now()
  where id = p_invitation_id
    and used_at is null
  returning * into old_invitation;

  if not found then
    raise exception 'INVITATION_NOT_AVAILABLE'
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
    old_invitation.band_id,
    encode(extensions.digest(p_token, 'sha256'), 'hex'),
    old_invitation.label,
    auth.uid(),
    invitation_expiry
  )
  returning id into new_invitation_id;

  return new_invitation_id;
end;
$$;

revoke all on function public.get_invitation_preview(text) from public;
grant execute on function public.get_invitation_preview(text) to anon, authenticated;

revoke all on function public.renew_invitation(uuid, text, timestamptz) from public;
grant execute on function public.renew_invitation(uuid, text, timestamptz) to authenticated;
