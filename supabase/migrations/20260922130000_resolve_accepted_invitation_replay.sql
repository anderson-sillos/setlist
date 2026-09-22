drop function if exists public.get_invitation_preview(text);

create function public.get_invitation_preview(p_token text)
returns table (
  band_id uuid,
  band_name text,
  label text,
  expires_at timestamptz,
  already_accepted boolean
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
         invitation.expires_at,
         invitation.used_at is not null
           and invitation.used_by = auth.uid() as already_accepted
  from public.invitations as invitation
  join public.bands as band on band.id = invitation.band_id
  where invitation.token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
    and invitation.revoked_at is null
    and (
      (
        invitation.used_at is null
        and invitation.expires_at > now()
      )
      or (
        invitation.used_at is not null
        and invitation.used_by = auth.uid()
        and exists (
          select 1
          from public.band_members as membership
          where membership.band_id = invitation.band_id
            and membership.user_id = auth.uid()
        )
      )
    );

  if not found then
    raise exception 'INVITATION_NOT_AVAILABLE'
      using errcode = 'P0001';
  end if;
end;
$$;

revoke all on function public.get_invitation_preview(text) from public;
grant execute on function public.get_invitation_preview(text) to anon, authenticated;
