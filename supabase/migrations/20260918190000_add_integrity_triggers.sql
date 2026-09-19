create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  new.updated_at := clock_timestamp();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger bands_set_updated_at
before update on public.bands
for each row execute function public.set_updated_at();

create trigger songs_set_updated_at
before update on public.songs
for each row execute function public.set_updated_at();

create trigger shows_set_updated_at
before update on public.shows
for each row execute function public.set_updated_at();

create trigger show_blocks_set_updated_at
before update on public.show_blocks
for each row execute function public.set_updated_at();

create trigger show_items_set_updated_at
before update on public.show_items
for each row execute function public.set_updated_at();

create or replace function public.prevent_last_owner_change()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  remaining_owners integer;
  remaining_members integer;
  affected_band_id uuid := old.band_id;
  membership_id uuid := old.id;
begin
  if old.role <> 'owner' then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE'
    and new.role = 'owner'
    and new.band_id = old.band_id
    and new.user_id = old.user_id then
    return new;
  end if;

  select count(*)::integer
  into remaining_owners
  from public.band_members
  where band_id = affected_band_id
    and role = 'owner'
    and id <> membership_id;

  if remaining_owners > 0 then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  select count(*)::integer
  into remaining_members
  from public.band_members
  where band_id = affected_band_id
    and id <> membership_id;

  if remaining_members > 0 then
    raise exception 'LAST_OWNER_REQUIRED'
      using errcode = 'P0001';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger band_members_prevent_last_owner
before delete or update of band_id, user_id, role on public.band_members
for each row execute function public.prevent_last_owner_change();

create or replace function public.anonymize_profile_references()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  update public.legal_acceptances
  set user_id = null
  where user_id = old.id;

  update public.invitations
  set created_by = case when created_by = old.id then null else created_by end,
      used_by = case when used_by = old.id then null else used_by end
  where created_by = old.id
     or used_by = old.id;

  return old;
end;
$$;

create trigger profiles_anonymize_references
before delete on public.profiles
for each row execute function public.anonymize_profile_references();

create or replace function public.assert_show_draft(p_show_id uuid)
returns void
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  current_status public.show_status;
begin
  select status
  into current_status
  from public.shows
  where id = p_show_id;

  if not found then
    return;
  end if;

  if current_status <> 'draft' then
    raise exception 'SHOW_NOT_EDITABLE'
      using errcode = 'P0001';
  end if;
end;
$$;

create or replace function public.assert_show_content_editable()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  old_show_id uuid;
  new_show_id uuid;
begin
  if tg_table_name = 'show_blocks' then
    if tg_op <> 'INSERT' then
      old_show_id := old.show_id;
      perform public.assert_show_draft(old_show_id);
    end if;
    if tg_op <> 'DELETE' then
      new_show_id := new.show_id;
      if new_show_id is distinct from old_show_id then
        perform public.assert_show_draft(new_show_id);
      end if;
    end if;
  else
    if tg_op <> 'INSERT' then
      select show_id
      into old_show_id
      from public.show_blocks
      where id = old.block_id;
      perform public.assert_show_draft(old_show_id);
    end if;
    if tg_op <> 'DELETE' then
      select show_id
      into new_show_id
      from public.show_blocks
      where id = new.block_id;
      if new_show_id is distinct from old_show_id then
        perform public.assert_show_draft(new_show_id);
      end if;
    end if;
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger show_blocks_require_draft
before insert or update or delete on public.show_blocks
for each row execute function public.assert_show_content_editable();

create trigger show_items_require_draft
before insert or update or delete on public.show_items
for each row execute function public.assert_show_content_editable();

create or replace function public.assert_show_update_allowed()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  if tg_op = 'DELETE' then
    if old.status <> 'draft' then
      raise exception 'SHOW_NOT_EDITABLE'
        using errcode = 'P0001';
    end if;
    return old;
  end if;

  if old.status <> 'draft'
    and (
      new.band_id is distinct from old.band_id
      or new.name is distinct from old.name
      or new.starts_at is distinct from old.starts_at
      or new.venue is distinct from old.venue
      or new.notes is distinct from old.notes
      or new.created_at is distinct from old.created_at
    ) then
    raise exception 'SHOW_NOT_EDITABLE'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create trigger shows_require_editable_state
before update or delete on public.shows
for each row execute function public.assert_show_update_allowed();

create or replace function public.assert_song_belongs_to_show_band()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  show_band_id uuid;
  song_band_id uuid;
begin
  if new.item_type <> 'song' or new.song_id is null then
    return new;
  end if;

  select shows.band_id
  into show_band_id
  from public.show_blocks
  join public.shows on shows.id = show_blocks.show_id
  where show_blocks.id = new.block_id;

  select band_id
  into song_band_id
  from public.songs
  where id = new.song_id;

  if show_band_id is distinct from song_band_id then
    raise exception 'SONG_BAND_MISMATCH'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create trigger show_items_song_band_check
before insert or update on public.show_items
for each row execute function public.assert_song_belongs_to_show_band();

revoke all on function public.set_updated_at() from public;
revoke all on function public.prevent_last_owner_change() from public;
revoke all on function public.anonymize_profile_references() from public;
revoke all on function public.assert_show_draft(uuid) from public;
revoke all on function public.assert_show_content_editable() from public;
revoke all on function public.assert_show_update_allowed() from public;
revoke all on function public.assert_song_belongs_to_show_band() from public;
