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
  if tg_op = 'DELETE'
    or (
      tg_op = 'UPDATE'
      and (
        new.band_id is distinct from old.band_id
        or new.user_id is distinct from old.user_id
      )
    ) then
    -- Serialize membership removals for a band, including concurrent leave
    -- requests, so two people cannot both observe themselves as non-final.
    perform 1
    from public.bands
    where id = affected_band_id
    for update;

    -- Band deletion intentionally cascades its memberships. In that case the
    -- parent row is already gone and this membership guard does not apply.
    if found then
      select count(*)::integer
      into remaining_members
      from public.band_members
      where band_id = affected_band_id
        and id <> membership_id;

      if remaining_members = 0 then
        raise exception 'BAND_LAST_MEMBER_CANNOT_LEAVE'
          using errcode = 'P0001';
      end if;
    end if;
  end if;

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
