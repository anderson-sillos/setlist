-- Garante o aceite explícito no servidor e o perfil autenticado antes de criar
-- a participação. O timestamp do aceite continua sendo gerado pelo default
-- now() do banco.
drop function if exists public.create_band(text, text);

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

  insert into public.profiles (id)
  values (current_user_id)
  on conflict (id) do nothing;

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

revoke all on function public.create_band(text, text, boolean) from public;
grant execute on function public.create_band(text, text, boolean) to authenticated;
