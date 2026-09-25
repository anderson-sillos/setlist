-- A versão vigente fica centralizada no banco. Uma alteração material deve
-- substituir esta função em uma nova migração e atualizar o texto no cliente.
create or replace function public.current_legal_term_version()
returns text
language sql
stable
set search_path = pg_catalog
as $$
  select '2026-09'::text;
$$;

create or replace function public.has_accepted_current_legal_term(
  p_band_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, auth
as $$
  select exists (
    select 1
    from public.legal_acceptances as acceptance
    where acceptance.band_id = p_band_id
      and acceptance.user_id = auth.uid()
      and acceptance.term_version = public.current_legal_term_version()
  );
$$;

create or replace function public.accept_current_band_term(
  p_band_id uuid,
  p_term_version text
)
returns timestamptz
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  current_user_id uuid := auth.uid();
  accepted_timestamp timestamptz;
begin
  if current_user_id is null then
    raise exception 'AUTHENTICATION_REQUIRED'
      using errcode = 'P0001';
  end if;

  if not public.has_band_role(
    p_band_id,
    array['owner', 'editor']::public.band_role[]
  ) then
    raise exception 'LEGAL_TERM_ROLE_REQUIRED'
      using errcode = 'P0001';
  end if;

  if p_term_version is null
    or btrim(p_term_version) <> public.current_legal_term_version() then
    raise exception 'TERM_VERSION_NOT_CURRENT'
      using errcode = 'P0001';
  end if;

  insert into public.legal_acceptances (band_id, user_id, term_version)
  values (p_band_id, current_user_id, public.current_legal_term_version())
  on conflict (user_id, band_id, term_version)
    where user_id is not null
    do nothing;

  select accepted_at
  into accepted_timestamp
  from public.legal_acceptances
  where band_id = p_band_id
    and user_id = current_user_id
    and term_version = public.current_legal_term_version();

  return accepted_timestamp;
end;
$$;

-- A criação também deve usar o termo vigente, e preserva a operação atômica
-- de perfil, banda, participação e aceite criada na tarefa 5.4.
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

  if btrim(p_term_version) <> public.current_legal_term_version() then
    raise exception 'TERM_VERSION_NOT_CURRENT'
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
  values (new_band_id, current_user_id, public.current_legal_term_version());

  return new_band_id;
end;
$$;

drop policy if exists legal_acceptances_insert on public.legal_acceptances;

drop policy if exists songs_insert on public.songs;
create policy songs_insert
on public.songs
for insert to authenticated
with check (
  public.has_band_role(
    band_id,
    array['owner', 'editor']::public.band_role[]
  )
  and public.has_accepted_current_legal_term(band_id)
);

drop policy if exists songs_update on public.songs;
create policy songs_update
on public.songs
for update to authenticated
using (
  public.has_band_role(
    band_id,
    array['owner', 'editor']::public.band_role[]
  )
)
with check (
  public.has_band_role(
    band_id,
    array['owner', 'editor']::public.band_role[]
  )
  and public.has_accepted_current_legal_term(band_id)
);

revoke all on function public.current_legal_term_version() from public;
revoke all on function public.has_accepted_current_legal_term(uuid) from public;
revoke all on function public.accept_current_band_term(uuid, text) from public;
grant execute on function public.current_legal_term_version() to authenticated;
grant execute on function public.has_accepted_current_legal_term(uuid) to authenticated;
grant execute on function public.accept_current_band_term(uuid, text) to authenticated;
