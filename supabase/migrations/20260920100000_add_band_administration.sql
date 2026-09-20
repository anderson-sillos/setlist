create or replace function public.delete_band(p_band_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  member_count integer;
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;

  if not exists (
    select 1
    from public.band_members
    where band_id = p_band_id
      and user_id = auth.uid()
      and role = 'owner'
  ) then
    raise exception 'BAND_OWNER_REQUIRED';
  end if;

  select count(*)::integer
  into member_count
  from public.band_members
  where band_id = p_band_id;

  if member_count <> 1 then
    raise exception 'BAND_MUST_BE_SOLO_OWNER';
  end if;

  delete from public.bands
  where id = p_band_id;

  if not found then
    raise exception 'BAND_NOT_FOUND';
  end if;
end;
$$;

revoke all on function public.delete_band(uuid) from public;
grant execute on function public.delete_band(uuid) to authenticated;
