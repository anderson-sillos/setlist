-- Mantém o nome e o e-mail do provedor de autenticação disponíveis para a
-- lista de integrantes, sem expor a tabela auth.users ao aplicativo.
create or replace function public.ensure_current_user_profile()
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'AUTHENTICATION_REQUIRED'
      using errcode = 'P0001';
  end if;

  insert into public.profiles (id, display_name, email)
  select
    users.id,
    coalesce(
      nullif(btrim(users.raw_user_meta_data ->> 'full_name'), ''),
      nullif(btrim(users.raw_user_meta_data ->> 'name'), ''),
      nullif(btrim(users.raw_user_meta_data ->> 'preferred_username'), '')
    ),
    nullif(btrim(users.email), '')
  from auth.users as users
  where users.id = current_user_id
  on conflict (id) do update
  set display_name = coalesce(public.profiles.display_name, excluded.display_name),
      email = coalesce(public.profiles.email, excluded.email);
end;
$$;

revoke all on function public.ensure_current_user_profile() from public;
grant execute on function public.ensure_current_user_profile() to authenticated;

-- Corrige perfis já criados antes desta rotina existir.
insert into public.profiles (id, display_name, email)
select
  users.id,
  coalesce(
    nullif(btrim(users.raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(users.raw_user_meta_data ->> 'name'), ''),
    nullif(btrim(users.raw_user_meta_data ->> 'preferred_username'), '')
  ),
  nullif(btrim(users.email), '')
from auth.users as users
on conflict (id) do update
set display_name = coalesce(public.profiles.display_name, excluded.display_name),
    email = coalesce(public.profiles.email, excluded.email);

create or replace function public.create_band(
  p_name text,
  p_term_version text,
  p_accepted boolean
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  current_user_id uuid := auth.uid();
  new_band_id uuid;
begin
  if current_user_id is null then
    raise exception 'AUTHENTICATION_REQUIRED'
      using errcode = 'P0001';
  end if;

  if p_name is null or btrim(p_name) = '' or char_length(p_name) > 120 then
    raise exception 'BAND_NAME_INVALID'
      using errcode = 'P0001';
  end if;

  if p_term_version is null
    or btrim(p_term_version) = ''
    or char_length(p_term_version) > 64 then
    raise exception 'TERM_VERSION_REQUIRED'
      using errcode = 'P0001';
  end if;

  if coalesce(p_accepted, false) is not true then
    raise exception 'ACCEPTANCE_REQUIRED'
      using errcode = 'P0001';
  end if;

  perform public.ensure_current_user_profile();

  insert into public.bands (name)
  values (btrim(p_name))
  returning id into new_band_id;

  insert into public.band_members (band_id, user_id, role)
  values (new_band_id, current_user_id, 'owner');

  insert into public.legal_acceptances (band_id, user_id, term_version)
  values (new_band_id, current_user_id, btrim(p_term_version));

  return new_band_id;
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

  perform public.ensure_current_user_profile();

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
