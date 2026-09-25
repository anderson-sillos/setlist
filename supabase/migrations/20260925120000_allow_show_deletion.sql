-- Permite excluir definitivamente shows em qualquer status, sempre via RPC protegida.
-- A marca de sessão limita o bypass dos gatilhos somente à exclusão do show inteiro.

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
  if tg_op = 'DELETE'
    and current_setting('setlist.deleting_show', true) = 'true' then
    return old;
  end if;

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

create or replace function public.assert_show_update_allowed()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  if tg_op = 'DELETE' then
    if current_setting('setlist.deleting_show', true) = 'true'
      or old.status = 'draft' then
      return old;
    end if;
    raise exception 'SHOW_NOT_EDITABLE'
      using errcode = 'P0001';
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

create or replace function public.delete_show(
  p_band_id uuid,
  p_show_id uuid
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  target_band_id uuid;
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED'
      using errcode = 'P0001';
  end if;

  select band_id
  into target_band_id
  from public.shows
  where id = p_show_id;

  if target_band_id is null or target_band_id is distinct from p_band_id then
    raise exception 'SHOW_NOT_FOUND'
      using errcode = 'P0001';
  end if;

  if not public.has_band_role(
    target_band_id,
    array['owner', 'editor']::public.band_role[]
  ) then
    raise exception 'SHOW_DELETE_FORBIDDEN'
      using errcode = 'P0001';
  end if;

  perform set_config('setlist.deleting_show', 'true', true);
  delete from public.shows
  where id = p_show_id
    and band_id = p_band_id;
end;
$$;

revoke all on function public.assert_show_content_editable() from public;
revoke all on function public.assert_show_update_allowed() from public;
revoke all on function public.delete_show(uuid, uuid) from public;
grant execute on function public.delete_show(uuid, uuid) to authenticated;
