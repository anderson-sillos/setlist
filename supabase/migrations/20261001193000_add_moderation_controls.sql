-- Somente o administrador do projeto registra e reverte estas medidas.
create table public.moderated_songs (
  song_id uuid primary key references public.songs (id) on delete cascade,
  reason text not null check (btrim(reason) <> ''),
  recorded_by text not null check (btrim(recorded_by) <> ''),
  recorded_at timestamptz not null default now()
);

create table public.suspended_accounts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  reason text not null check (btrim(reason) <> ''),
  recorded_by text not null check (btrim(recorded_by) <> ''),
  recorded_at timestamptz not null default now()
);

alter table public.moderated_songs enable row level security;
alter table public.suspended_accounts enable row level security;
revoke all on public.moderated_songs from anon, authenticated;
revoke all on public.suspended_accounts from anon, authenticated;

create or replace function public.is_song_moderated(p_song_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1 from public.moderated_songs where song_id = p_song_id
  );
$$;

create or replace function public.is_account_suspended()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, auth
as $$
  select exists (
    select 1 from public.suspended_accounts where user_id = auth.uid()
  );
$$;

revoke all on function public.is_song_moderated(uuid) from public;
revoke all on function public.is_account_suspended() from public;
grant execute on function public.is_song_moderated(uuid) to authenticated;
grant execute on function public.is_account_suspended() to authenticated;

-- RPCs de ciclo de vida usam SECURITY DEFINER. Um editor não pode alterar ou
-- apagar a música oculta por essas rotas, mesmo conhecendo o UUID.
create or replace function public.protect_moderated_song()
returns trigger
language plpgsql
set search_path = pg_catalog, public, auth
as $$
begin
  if auth.role() = 'authenticated'
    and public.is_song_moderated(old.id) then
    raise exception 'SONG_MODERATED' using errcode = '42501';
  end if;
  if tg_op = 'UPDATE' then
    return new;
  end if;
  return old;
end;
$$;

revoke all on function public.protect_moderated_song() from public;
create trigger songs_protect_moderated
before update or delete on public.songs
for each row execute function public.protect_moderated_song();

drop policy if exists songs_select on public.songs;
create policy songs_select
on public.songs
for select to authenticated
using (
  public.is_band_member(band_id)
  and not public.is_song_moderated(id)
);

drop policy if exists show_items_select on public.show_items;
create policy show_items_select
on public.show_items
for select to authenticated
using (
  public.can_view_block(block_id)
  and (song_id is null or not public.is_song_moderated(song_id))
);

-- A política restritiva também vale para Realtime; o gancho abaixo cobre RPCs
-- SECURITY DEFINER acessadas pela Data API com um JWT antigo.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles', 'bands', 'band_members', 'legal_acceptances', 'songs',
    'shows', 'show_blocks', 'show_items', 'invitations'
  ] loop
    execute format(
      'create policy active_account on public.%I as restrictive for all to authenticated using (not public.is_account_suspended()) with check (not public.is_account_suspended())',
      table_name
    );
  end loop;
end;
$$;

create or replace function public.reject_suspended_request()
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
begin
  if public.is_account_suspended() then
    raise exception 'ACCOUNT_SUSPENDED' using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.reject_suspended_request() from public;
grant execute on function public.reject_suspended_request() to authenticator;
alter role authenticator set pgrst.db_pre_request = 'public.reject_suspended_request';
notify pgrst, 'reload config';
