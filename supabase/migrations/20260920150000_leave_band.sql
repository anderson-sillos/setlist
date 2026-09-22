create or replace function public.leave_band(p_band_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED'
      using errcode = 'P0001';
  end if;

  if not exists (
    select 1
    from public.band_members
    where band_id = p_band_id
      and user_id = auth.uid()
  ) then
    raise exception 'BAND_MEMBERSHIP_NOT_FOUND'
      using errcode = 'P0001';
  end if;

  delete from public.band_members
  where band_id = p_band_id
    and user_id = auth.uid();
end;
$$;

revoke all on function public.leave_band(uuid) from public;
grant execute on function public.leave_band(uuid) to authenticated;
