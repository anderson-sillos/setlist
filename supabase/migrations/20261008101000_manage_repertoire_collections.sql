create or replace function public.order_repertoire_collection_songs(
  p_band_id uuid,
  p_collection_id uuid,
  p_song_ids uuid[]
)
returns void
language plpgsql
set search_path = pg_catalog, public, auth
as $$
declare
  ordered_song_ids uuid[] := coalesce(p_song_ids, '{}'::uuid[]);
  requested_count integer;
  matching_count integer;
begin
  if array_position(ordered_song_ids, null::uuid) is not null
    or coalesce(array_ndims(ordered_song_ids), 1) <> 1 then
    raise exception 'COLLECTION_SONGS_INVALID'
      using errcode = 'P0001';
  end if;

  select count(*)::integer
  into requested_count
  from unnest(ordered_song_ids) as requested(song_id);

  if (
    select count(distinct requested.song_id)::integer
    from unnest(ordered_song_ids) as requested(song_id)
  ) <> requested_count then
    raise exception 'COLLECTION_SONG_DUPLICATE'
      using errcode = 'P0001';
  end if;

  select count(*)::integer
  into matching_count
  from public.songs as songs
  where songs.band_id = p_band_id
    and songs.id = any(ordered_song_ids)
    and not public.is_song_moderated(songs.id);

  if matching_count <> requested_count then
    raise exception 'COLLECTION_SONG_UNAVAILABLE'
      using errcode = '42501';
  end if;

  set constraints public.repertoire_collection_songs_collection_position_key
    deferred;

  delete from public.repertoire_collection_songs as links
  where links.band_id = p_band_id
    and links.collection_id = p_collection_id
    and not public.is_song_moderated(links.song_id)
    and not (links.song_id = any(ordered_song_ids));

  update public.repertoire_collection_songs as links
  set position = requested.position::integer - 1
  from unnest(ordered_song_ids) with ordinality
    as requested(song_id, position)
  where links.band_id = p_band_id
    and links.collection_id = p_collection_id
    and links.song_id = requested.song_id;

  insert into public.repertoire_collection_songs (
    band_id,
    collection_id,
    song_id,
    position
  )
  select
    p_band_id,
    p_collection_id,
    requested.song_id,
    requested.position::integer - 1
  from unnest(ordered_song_ids) with ordinality
    as requested(song_id, position)
  where not exists (
    select 1
    from public.repertoire_collection_songs as links
    where links.collection_id = p_collection_id
      and links.song_id = requested.song_id
  );

  with hidden_links as (
    select
      links.song_id,
      row_number() over (order by links.position, links.song_id) as hidden_position
    from public.repertoire_collection_songs as links
    where links.band_id = p_band_id
      and links.collection_id = p_collection_id
      and public.is_song_moderated(links.song_id)
  )
  update public.repertoire_collection_songs as links
  set position = requested_count + hidden_links.hidden_position::integer - 1
  from hidden_links
  where links.band_id = p_band_id
    and links.collection_id = p_collection_id
    and links.song_id = hidden_links.song_id;

  set constraints public.repertoire_collection_songs_collection_position_key
    immediate;
end;
$$;

create or replace function public.save_repertoire_collection(
  p_band_id uuid,
  p_collection_id uuid,
  p_name text,
  p_song_ids uuid[],
  p_expected_updated_at timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  current_user_id uuid := auth.uid();
  normalized_name text := btrim(p_name);
  updated_collection_id uuid := p_collection_id;
  current_updated_at timestamptz;
begin
  if current_user_id is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;
  perform public.reject_suspended_request();

  if not public.has_band_role(
    p_band_id,
    array['owner', 'editor']::public.band_role[]
  ) then
    raise exception 'COLLECTION_ROLE_REQUIRED' using errcode = '42501';
  end if;

  if normalized_name is null or char_length(normalized_name) not between 1 and 120 then
    raise exception 'COLLECTION_NAME_INVALID' using errcode = 'P0001';
  end if;

  if updated_collection_id is null then
    if p_expected_updated_at is not null then
      raise exception 'COLLECTION_REVISION_INVALID' using errcode = 'P0001';
    end if;

    insert into public.repertoire_collections (band_id, name)
    values (p_band_id, normalized_name)
    returning id into updated_collection_id;
  else
    select collections.updated_at
    into current_updated_at
    from public.repertoire_collections as collections
    where collections.id = updated_collection_id
      and collections.band_id = p_band_id
    for update;

    if not found then
      raise exception 'COLLECTION_NOT_FOUND' using errcode = 'P0001';
    end if;
    if p_expected_updated_at is null
      or current_updated_at is distinct from p_expected_updated_at then
      raise exception 'COLLECTION_CHANGED' using errcode = 'P0001';
    end if;

    update public.repertoire_collections
    set name = normalized_name
    where id = updated_collection_id
      and band_id = p_band_id;
  end if;

  perform public.order_repertoire_collection_songs(
    p_band_id,
    updated_collection_id,
    p_song_ids
  );

  return updated_collection_id;
end;
$$;

create or replace function public.append_repertoire_collection_songs(
  p_band_id uuid,
  p_collection_id uuid,
  p_song_ids uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  current_user_id uuid := auth.uid();
  existing_song_ids uuid[];
  new_song_ids uuid[];
begin
  if current_user_id is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;
  perform public.reject_suspended_request();

  if not public.has_band_role(
    p_band_id,
    array['owner', 'editor']::public.band_role[]
  ) then
    raise exception 'COLLECTION_ROLE_REQUIRED' using errcode = '42501';
  end if;

  perform 1
  from public.repertoire_collections as collections
  where collections.id = p_collection_id
    and collections.band_id = p_band_id
  for update;
  if not found then
    raise exception 'COLLECTION_NOT_FOUND' using errcode = 'P0001';
  end if;

  select coalesce(array_agg(links.song_id order by links.position), '{}'::uuid[])
  into existing_song_ids
  from public.repertoire_collection_songs as links
  where links.band_id = p_band_id
    and links.collection_id = p_collection_id
    and not public.is_song_moderated(links.song_id);

  if array_position(coalesce(p_song_ids, '{}'::uuid[]), null::uuid) is not null
    or coalesce(array_ndims(p_song_ids), 1) <> 1
    or (
      select count(distinct requested.song_id)::integer
      from unnest(coalesce(p_song_ids, '{}'::uuid[])) as requested(song_id)
    ) <> cardinality(coalesce(p_song_ids, '{}'::uuid[])) then
    raise exception 'COLLECTION_SONGS_INVALID' using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from unnest(coalesce(p_song_ids, '{}'::uuid[])) as requested(song_id)
    where not exists (
      select 1
      from public.songs as songs
      where songs.band_id = p_band_id
        and songs.id = requested.song_id
        and not public.is_song_moderated(songs.id)
    )
  ) then
    raise exception 'COLLECTION_SONG_UNAVAILABLE' using errcode = '42501';
  end if;

  select coalesce(array_agg(requested.song_id order by requested.position), '{}'::uuid[])
  into new_song_ids
  from unnest(coalesce(p_song_ids, '{}'::uuid[])) with ordinality
    as requested(song_id, position)
  where not requested.song_id = any(existing_song_ids);

  perform public.order_repertoire_collection_songs(
    p_band_id,
    p_collection_id,
    existing_song_ids || new_song_ids
  );

  if cardinality(new_song_ids) > 0 then
    update public.repertoire_collections
    set updated_at = clock_timestamp()
    where id = p_collection_id
      and band_id = p_band_id;
  end if;

  return p_collection_id;
end;
$$;

create or replace function public.set_song_repertoire_collections(
  p_band_id uuid,
  p_song_id uuid,
  p_collection_ids uuid[],
  p_expected_revisions jsonb
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  current_user_id uuid := auth.uid();
  collection_record record;
  desired_collection_ids uuid[] := coalesce(p_collection_ids, '{}'::uuid[]);
  affected_collection_ids uuid[] := '{}'::uuid[];
  affected_collection_count integer;
  available_collection_count integer;
  current_position integer;
begin
  if current_user_id is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;
  perform public.reject_suspended_request();

  if not public.has_band_role(
    p_band_id,
    array['owner', 'editor']::public.band_role[]
  ) then
    raise exception 'COLLECTION_ROLE_REQUIRED' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.songs as songs
    where songs.id = p_song_id
      and songs.band_id = p_band_id
      and not public.is_song_moderated(songs.id)
  ) then
    raise exception 'COLLECTION_SONG_UNAVAILABLE' using errcode = '42501';
  end if;

  if p_expected_revisions is null
    or jsonb_typeof(p_expected_revisions) <> 'object'
    or array_position(desired_collection_ids, null::uuid) is not null
    or coalesce(array_ndims(desired_collection_ids), 1) <> 1
    or (
      select count(distinct requested.collection_id)::integer
      from unnest(desired_collection_ids) as requested(collection_id)
    ) <> cardinality(desired_collection_ids) then
    raise exception 'COLLECTION_REVISIONS_INVALID' using errcode = 'P0001';
  end if;

  select coalesce(array_agg(affected.id order by affected.id), '{}'::uuid[])
  into affected_collection_ids
  from (
    select links.collection_id as id
    from public.repertoire_collection_songs as links
    where links.band_id = p_band_id
      and links.song_id = p_song_id
    union
    select requested.collection_id as id
    from unnest(desired_collection_ids) as requested(collection_id)
  ) as affected;
  affected_collection_count := cardinality(affected_collection_ids);

  perform 1
  from public.repertoire_collections as collections
  where collections.band_id = p_band_id
    and collections.id in (
      select links.collection_id
      from public.repertoire_collection_songs as links
      where links.band_id = p_band_id
        and links.song_id = p_song_id
      union
      select requested.collection_id
      from unnest(desired_collection_ids) as requested(collection_id)
    )
  order by collections.id
  for update;

  select count(*)::integer
  into available_collection_count
  from (
    select links.collection_id as id
    from public.repertoire_collection_songs as links
    where links.band_id = p_band_id
      and links.song_id = p_song_id
    union
    select requested.collection_id as id
    from unnest(desired_collection_ids) as requested(collection_id)
  ) as affected
  join public.repertoire_collections as collections
    on collections.id = affected.id
    and collections.band_id = p_band_id;

  if available_collection_count <> affected_collection_count
    or jsonb_object_length(p_expected_revisions) <> affected_collection_count then
    raise exception 'COLLECTION_NOT_FOUND' using errcode = 'P0001';
  end if;

  for collection_record in
    select collections.id, collections.updated_at
    from public.repertoire_collections as collections
    where collections.band_id = p_band_id
      and collections.id in (
        select links.collection_id
        from public.repertoire_collection_songs as links
        where links.band_id = p_band_id
          and links.song_id = p_song_id
        union
        select requested.collection_id
        from unnest(desired_collection_ids) as requested(collection_id)
      )
    order by collections.id
  loop
    if (p_expected_revisions ->> collection_record.id::text)::timestamptz
      is distinct from collection_record.updated_at then
      raise exception 'COLLECTION_CHANGED' using errcode = 'P0001';
    end if;
  end loop;

  select count(*)::integer
  into available_collection_count
  from public.songs as songs
  where songs.id = p_song_id
    and songs.band_id = p_band_id
    and not public.is_song_moderated(songs.id);

  if available_collection_count <> 1 then
    raise exception 'COLLECTION_SONG_UNAVAILABLE' using errcode = '42501';
  end if;

  delete from public.repertoire_collection_songs as links
  where links.band_id = p_band_id
    and links.song_id = p_song_id
    and not public.is_song_moderated(links.song_id)
    and not (links.collection_id = any(desired_collection_ids));

  for collection_record in
    select collections.id
    from public.repertoire_collections as collections
    where collections.band_id = p_band_id
      and collections.id = any(desired_collection_ids)
    order by collections.id
  loop
    select coalesce(max(links.position) + 1, 0)::integer
    into current_position
    from public.repertoire_collection_songs as links
    where links.band_id = p_band_id
      and links.collection_id = collection_record.id;

    insert into public.repertoire_collection_songs (
      band_id,
      collection_id,
      song_id,
      position
    )
    values (
      p_band_id,
      collection_record.id,
      p_song_id,
      current_position
    )
    on conflict (collection_id, song_id) do nothing;
  end loop;

  update public.repertoire_collections as collections
  set updated_at = clock_timestamp()
  where collections.band_id = p_band_id
    and collections.id = any(affected_collection_ids);
end;
$$;

create or replace function public.delete_repertoire_collection(
  p_band_id uuid,
  p_collection_id uuid,
  p_expected_updated_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  current_user_id uuid := auth.uid();
  current_updated_at timestamptz;
begin
  if current_user_id is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;
  perform public.reject_suspended_request();

  if not public.has_band_role(
    p_band_id,
    array['owner', 'editor']::public.band_role[]
  ) then
    raise exception 'COLLECTION_ROLE_REQUIRED' using errcode = '42501';
  end if;

  select collections.updated_at
  into current_updated_at
  from public.repertoire_collections as collections
  where collections.id = p_collection_id
    and collections.band_id = p_band_id
  for update;

  if not found then
    raise exception 'COLLECTION_NOT_FOUND' using errcode = 'P0001';
  end if;
  if p_expected_updated_at is null
    or current_updated_at is distinct from p_expected_updated_at then
    raise exception 'COLLECTION_CHANGED' using errcode = 'P0001';
  end if;

  delete from public.repertoire_collections
  where id = p_collection_id
    and band_id = p_band_id;
end;
$$;

revoke all on function public.order_repertoire_collection_songs(uuid, uuid, uuid[])
  from public, anon, authenticated;
revoke all on function public.save_repertoire_collection(uuid, uuid, text, uuid[], timestamptz)
  from public, anon, authenticated;
revoke all on function public.append_repertoire_collection_songs(uuid, uuid, uuid[])
  from public, anon, authenticated;
revoke all on function public.set_song_repertoire_collections(uuid, uuid, uuid[], jsonb)
  from public, anon, authenticated;
revoke all on function public.delete_repertoire_collection(uuid, uuid, timestamptz)
  from public, anon, authenticated;

grant execute on function public.save_repertoire_collection(uuid, uuid, text, uuid[], timestamptz)
  to authenticated;
grant execute on function public.append_repertoire_collection_songs(uuid, uuid, uuid[])
  to authenticated;
grant execute on function public.set_song_repertoire_collections(uuid, uuid, uuid[], jsonb)
  to authenticated;
grant execute on function public.delete_repertoire_collection(uuid, uuid, timestamptz)
  to authenticated;

comment on function public.save_repertoire_collection(uuid, uuid, text, uuid[], timestamptz) is
  'Cria ou substitui atomicamente uma coleção na revisão esperada.';
comment on function public.append_repertoire_collection_songs(uuid, uuid, uuid[]) is
  'Acrescenta músicas disponíveis ao fim da coleção sem criar participações duplicadas.';
comment on function public.set_song_repertoire_collections(uuid, uuid, uuid[], jsonb) is
  'Atualiza as participações de uma música com revisão para cada coleção afetada.';
