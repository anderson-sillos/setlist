create or replace function public.touch_show_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  affected_show_id uuid;
begin
  if tg_table_name = 'show_blocks' then
    affected_show_id := case when tg_op = 'DELETE' then old.show_id else new.show_id end;
  else
    select show_id
    into affected_show_id
    from public.show_blocks
    where id = case when tg_op = 'DELETE' then old.block_id else new.block_id end;
  end if;

  if affected_show_id is not null then
    update public.shows
    set updated_at = clock_timestamp()
    where id = affected_show_id;
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger show_blocks_touch_show_updated_at
after insert or update or delete on public.show_blocks
for each row execute function public.touch_show_updated_at();

create trigger show_items_touch_show_updated_at
after insert or update or delete on public.show_items
for each row execute function public.touch_show_updated_at();

revoke all on function public.touch_show_updated_at() from public;
