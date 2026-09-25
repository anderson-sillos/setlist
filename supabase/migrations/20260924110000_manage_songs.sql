-- O ciclo de vida da música é decidido no banco para preservar referências
-- existentes em setlists e manter a autorização atômica.
create or replace function public.set_song_archived(
  p_band_id uuid,
  p_song_id uuid,
  p_archived boolean
)
returns timestamptz
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  archived_timestamp timestamptz;
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = 'P0001';
  end if;

  if not public.has_band_role(
    p_band_id,
    array['owner', 'editor']::public.band_role[]
  ) then
    raise exception 'SONG_ROLE_REQUIRED' using errcode = 'P0001';
  end if;

  if not public.has_accepted_current_legal_term(p_band_id) then
    raise exception 'SONG_TERM_ACCEPTANCE_REQUIRED' using errcode = 'P0001';
  end if;

  if not exists (
    select 1
    from public.songs
    where id = p_song_id
      and band_id = p_band_id
  ) then
    raise exception 'SONG_NOT_FOUND' using errcode = 'P0001';
  end if;

  update public.songs
  set archived_at = case when coalesce(p_archived, false) then now() else null end
  where id = p_song_id
    and band_id = p_band_id
  returning archived_at into archived_timestamp;

  return archived_timestamp;
end;
$$;

create or replace function public.remove_song(
  p_band_id uuid,
  p_song_id uuid
)
returns text
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  has_show_reference boolean;
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = 'P0001';
  end if;

  if not public.has_band_role(
    p_band_id,
    array['owner', 'editor']::public.band_role[]
  ) then
    raise exception 'SONG_ROLE_REQUIRED' using errcode = 'P0001';
  end if;

  if not public.has_accepted_current_legal_term(p_band_id) then
    raise exception 'SONG_TERM_ACCEPTANCE_REQUIRED' using errcode = 'P0001';
  end if;

  if not exists (
    select 1
    from public.songs
    where id = p_song_id
      and band_id = p_band_id
  ) then
    raise exception 'SONG_NOT_FOUND' using errcode = 'P0001';
  end if;

  select exists (
    select 1
    from public.show_items as item
    join public.show_blocks as block on block.id = item.block_id
    join public.shows as show on show.id = block.show_id
    where item.song_id = p_song_id
      and show.band_id = p_band_id
  ) into has_show_reference;

  if has_show_reference then
    update public.songs
    set archived_at = coalesce(archived_at, now())
    where id = p_song_id
      and band_id = p_band_id;
    return 'archived';
  end if;

  delete from public.songs
  where id = p_song_id
    and band_id = p_band_id;

  return 'deleted';
end;
$$;

revoke all on function public.set_song_archived(uuid, uuid, boolean) from public;
revoke all on function public.remove_song(uuid, uuid) from public;
grant execute on function public.set_song_archived(uuid, uuid, boolean) to authenticated;
grant execute on function public.remove_song(uuid, uuid) to authenticated;
