create or replace function public.band_role_for(p_band_id uuid)
returns public.band_role
language sql
stable
security definer
set search_path = pg_catalog, public, auth
as $$
  select role
  from public.band_members
  where band_id = p_band_id
    and user_id = auth.uid()
  limit 1
$$;

create or replace function public.has_band_role(
  p_band_id uuid,
  p_roles public.band_role[]
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, auth
as $$
  select exists (
    select 1
    from public.band_members
    where band_id = p_band_id
      and user_id = auth.uid()
      and role = any(p_roles)
  )
$$;

create or replace function public.is_band_member(p_band_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, auth
as $$
  select public.band_role_for(p_band_id) is not null
$$;

create or replace function public.can_view_profile(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, auth
as $$
  select p_profile_id = auth.uid()
    or exists (
      select 1
      from public.band_members as mine
      join public.band_members as target
        on target.band_id = mine.band_id
      where mine.user_id = auth.uid()
        and target.user_id = p_profile_id
    )
$$;

create or replace function public.can_view_show(p_show_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, auth
as $$
  select exists (
    select 1
    from public.shows
    where id = p_show_id
      and public.is_band_member(band_id)
  )
$$;

create or replace function public.can_edit_show(p_show_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, auth
as $$
  select exists (
    select 1
    from public.shows
    where id = p_show_id
      and public.has_band_role(
        band_id,
        array['owner', 'editor']::public.band_role[]
      )
  )
$$;

create or replace function public.can_view_block(p_block_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, auth
as $$
  select exists (
    select 1
    from public.show_blocks
    join public.shows on shows.id = show_blocks.show_id
    where show_blocks.id = p_block_id
      and public.is_band_member(shows.band_id)
  )
$$;

create or replace function public.can_edit_block(p_block_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, auth
as $$
  select exists (
    select 1
    from public.show_blocks
    join public.shows on shows.id = show_blocks.show_id
    where show_blocks.id = p_block_id
      and public.has_band_role(
        shows.band_id,
        array['owner', 'editor']::public.band_role[]
      )
  )
$$;

create or replace function public.create_band(
  p_name text,
  p_term_version text
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  current_user_id uuid := auth.uid();
  new_band_id uuid;
begin
  if current_user_id is null then
    raise exception 'AUTHENTICATION_REQUIRED'
      using errcode = 'P0001';
  end if;

  if p_name is null or btrim(p_name) = '' or char_length(p_name) > 120 then
    raise exception 'BAND_NAME_INVALID'
      using errcode = 'P0001';
  end if;

  if p_term_version is null
    or btrim(p_term_version) = ''
    or char_length(p_term_version) > 64 then
    raise exception 'TERM_VERSION_REQUIRED'
      using errcode = 'P0001';
  end if;

  insert into public.bands (name)
  values (btrim(p_name))
  returning id into new_band_id;

  insert into public.band_members (band_id, user_id, role)
  values (new_band_id, current_user_id, 'owner');

  insert into public.legal_acceptances (band_id, user_id, term_version)
  values (new_band_id, current_user_id, btrim(p_term_version));

  return new_band_id;
end;
$$;

create policy profiles_select
on public.profiles
for select to authenticated
using (public.can_view_profile(id));

create policy profiles_insert
on public.profiles
for insert to authenticated
with check (id = auth.uid());

create policy profiles_update
on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy bands_select
on public.bands
for select to authenticated
using (public.is_band_member(id));

create policy bands_update
on public.bands
for update to authenticated
using (public.has_band_role(id, array['owner']::public.band_role[]))
with check (public.has_band_role(id, array['owner']::public.band_role[]));

create policy band_members_select
on public.band_members
for select to authenticated
using (public.is_band_member(band_id));

create policy band_members_insert
on public.band_members
for insert to authenticated
with check (public.has_band_role(band_id, array['owner']::public.band_role[]));

create policy band_members_update
on public.band_members
for update to authenticated
using (public.has_band_role(band_id, array['owner']::public.band_role[]))
with check (public.has_band_role(band_id, array['owner']::public.band_role[]));

create policy band_members_delete
on public.band_members
for delete to authenticated
using (public.has_band_role(band_id, array['owner']::public.band_role[]));

create policy legal_acceptances_select
on public.legal_acceptances
for select to authenticated
using (public.is_band_member(band_id));

create policy legal_acceptances_insert
on public.legal_acceptances
for insert to authenticated
with check (
  user_id = auth.uid()
  and public.has_band_role(
    band_id,
    array['owner', 'editor']::public.band_role[]
  )
);

create policy songs_select
on public.songs
for select to authenticated
using (public.is_band_member(band_id));

create policy songs_insert
on public.songs
for insert to authenticated
with check (
  public.has_band_role(
    band_id,
    array['owner', 'editor']::public.band_role[]
  )
);

create policy songs_update
on public.songs
for update to authenticated
using (
  public.has_band_role(
    band_id,
    array['owner', 'editor']::public.band_role[]
  )
)
with check (
  public.has_band_role(
    band_id,
    array['owner', 'editor']::public.band_role[]
  )
);

create policy shows_select
on public.shows
for select to authenticated
using (public.is_band_member(band_id));

create policy shows_insert
on public.shows
for insert to authenticated
with check (
  public.has_band_role(
    band_id,
    array['owner', 'editor']::public.band_role[]
  )
);

create policy shows_update
on public.shows
for update to authenticated
using (
  public.has_band_role(
    band_id,
    array['owner', 'editor']::public.band_role[]
  )
)
with check (
  public.has_band_role(
    band_id,
    array['owner', 'editor']::public.band_role[]
  )
);

create policy shows_delete
on public.shows
for delete to authenticated
using (
  public.has_band_role(
    band_id,
    array['owner', 'editor']::public.band_role[]
  )
);

create policy show_blocks_select
on public.show_blocks
for select to authenticated
using (public.can_view_show(show_id));

create policy show_blocks_insert
on public.show_blocks
for insert to authenticated
with check (public.can_edit_show(show_id));

create policy show_blocks_update
on public.show_blocks
for update to authenticated
using (public.can_edit_show(show_id))
with check (public.can_edit_show(show_id));

create policy show_blocks_delete
on public.show_blocks
for delete to authenticated
using (public.can_edit_show(show_id));

create policy show_items_select
on public.show_items
for select to authenticated
using (public.can_view_block(block_id));

create policy show_items_insert
on public.show_items
for insert to authenticated
with check (public.can_edit_block(block_id));

create policy show_items_update
on public.show_items
for update to authenticated
using (public.can_edit_block(block_id))
with check (public.can_edit_block(block_id));

create policy show_items_delete
on public.show_items
for delete to authenticated
using (public.can_edit_block(block_id));

create policy invitations_select
on public.invitations
for select to authenticated
using (public.has_band_role(band_id, array['owner']::public.band_role[]));

create policy invitations_insert
on public.invitations
for insert to authenticated
with check (public.has_band_role(band_id, array['owner']::public.band_role[]));

create policy invitations_update
on public.invitations
for update to authenticated
using (public.has_band_role(band_id, array['owner']::public.band_role[]))
with check (public.has_band_role(band_id, array['owner']::public.band_role[]));

revoke all on function public.band_role_for(uuid) from public;
revoke all on function public.has_band_role(uuid, public.band_role[]) from public;
revoke all on function public.is_band_member(uuid) from public;
revoke all on function public.can_view_profile(uuid) from public;
revoke all on function public.can_view_show(uuid) from public;
revoke all on function public.can_edit_show(uuid) from public;
revoke all on function public.can_view_block(uuid) from public;
revoke all on function public.can_edit_block(uuid) from public;
revoke all on function public.create_band(text, text) from public;
grant execute on function public.band_role_for(uuid) to authenticated;
grant execute on function public.has_band_role(uuid, public.band_role[]) to authenticated;
grant execute on function public.is_band_member(uuid) to authenticated;
grant execute on function public.can_view_profile(uuid) to authenticated;
grant execute on function public.can_view_show(uuid) to authenticated;
grant execute on function public.can_edit_show(uuid) to authenticated;
grant execute on function public.can_view_block(uuid) to authenticated;
grant execute on function public.can_edit_block(uuid) to authenticated;
grant execute on function public.create_band(text, text) to authenticated;
