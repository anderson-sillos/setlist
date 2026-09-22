alter table public.profiles
  add column if not exists provider_display_name text,
  add column if not exists display_name_source text not null default 'provider';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'profiles_display_name_source_check'
  ) then
    alter table public.profiles
      add constraint profiles_display_name_source_check
      check (display_name_source in ('provider', 'user'));
  end if;
end;
$$;

create or replace function public._sync_profile_from_auth_user(
  p_user_id uuid,
  p_user_metadata jsonb,
  p_email text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  provider_name text := coalesce(
    nullif(btrim(p_user_metadata ->> 'full_name'), ''),
    nullif(btrim(p_user_metadata ->> 'name'), ''),
    nullif(btrim(p_user_metadata ->> 'preferred_username'), '')
  );
  provider_avatar_url text := coalesce(
    nullif(btrim(p_user_metadata ->> 'avatar_url'), ''),
    nullif(btrim(p_user_metadata ->> 'picture'), '')
  );
  normalized_email text := nullif(btrim(p_email), '');
begin
  if p_user_id is null then
    return;
  end if;

  insert into public.profiles (
    id,
    display_name,
    display_name_source,
    provider_display_name,
    email,
    avatar_url
  )
  values (
    p_user_id,
    coalesce(provider_name, normalized_email),
    'provider',
    provider_name,
    normalized_email,
    provider_avatar_url
  )
  on conflict (id) do update
  set provider_display_name = excluded.provider_display_name,
      display_name = case
        when public.profiles.display_name_source = 'provider'
          then coalesce(
            excluded.provider_display_name,
            excluded.email,
            public.profiles.display_name
          )
        else public.profiles.display_name
      end,
      email = excluded.email,
      avatar_url = excluded.avatar_url;
end;
$$;

revoke all on function public._sync_profile_from_auth_user(uuid, jsonb, text)
  from public, anon, authenticated;

create or replace function public.sync_profile_from_auth_user_trigger()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  perform public._sync_profile_from_auth_user(
    new.id,
    new.raw_user_meta_data,
    new.email
  );
  return new;
end;
$$;

revoke all on function public.sync_profile_from_auth_user_trigger()
  from public, anon, authenticated;

drop trigger if exists sync_profile_from_auth_user on auth.users;
create trigger sync_profile_from_auth_user
after insert or update of email, raw_user_meta_data on auth.users
for each row execute function public.sync_profile_from_auth_user_trigger();

-- Atualiza a origem do perfil sem substituir nomes que já foram personalizados.
select public._sync_profile_from_auth_user(users.id, users.raw_user_meta_data, users.email)
from auth.users as users;

drop policy if exists profiles_insert on public.profiles;
drop policy if exists profiles_update on public.profiles;
revoke insert, update on public.profiles from authenticated;

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

  perform public._sync_profile_from_auth_user(
    users.id,
    users.raw_user_meta_data,
    users.email
  )
  from auth.users as users
  where users.id = current_user_id;

  if not found then
    raise exception 'PROFILE_NOT_FOUND'
      using errcode = 'P0001';
  end if;
end;
$$;

revoke all on function public.ensure_current_user_profile() from public, anon;
grant execute on function public.ensure_current_user_profile() to authenticated;

create or replace function public.update_my_display_name(p_display_name text)
returns text
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  current_user_id uuid := auth.uid();
  normalized_name text := nullif(btrim(p_display_name), '');
  saved_name text;
begin
  if current_user_id is null then
    raise exception 'AUTHENTICATION_REQUIRED'
      using errcode = 'P0001';
  end if;

  if normalized_name is null or char_length(normalized_name) > 120 then
    raise exception 'PROFILE_DISPLAY_NAME_INVALID'
      using errcode = 'P0001';
  end if;

  perform public.ensure_current_user_profile();

  update public.profiles
  set display_name = normalized_name,
      display_name_source = 'user'
  where id = current_user_id
  returning display_name into saved_name;

  if saved_name is null then
    raise exception 'PROFILE_NOT_FOUND'
      using errcode = 'P0001';
  end if;

  return saved_name;
end;
$$;

revoke all on function public.update_my_display_name(text) from public, anon;
grant execute on function public.update_my_display_name(text) to authenticated;
