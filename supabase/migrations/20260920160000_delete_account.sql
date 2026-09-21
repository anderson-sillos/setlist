create or replace function public.delete_account()
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'AUTHENTICATION_REQUIRED'
      using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from public.band_members as membership
    where membership.user_id = current_user_id
      and membership.role = 'owner'
      and exists (
        select 1
        from public.band_members as other_member
        where other_member.band_id = membership.band_id
          and other_member.user_id <> current_user_id
      )
      and not exists (
        select 1
        from public.band_members as other_owner
        where other_owner.band_id = membership.band_id
          and other_owner.user_id <> current_user_id
          and other_owner.role = 'owner'
      )
  ) then
    raise exception 'ACCOUNT_LAST_OWNER_REQUIRED'
      using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from public.band_members as membership
    where membership.user_id = current_user_id
      and membership.role = 'owner'
      and not exists (
        select 1
        from public.band_members as other_member
        where other_member.band_id = membership.band_id
          and other_member.user_id <> current_user_id
      )
  ) then
    raise exception 'ACCOUNT_SOLO_BAND_REQUIRED'
      using errcode = 'P0001';
  end if;

  -- Excluir o perfil primeiro executa a anonimização das referências históricas
  -- e remove somente os vínculos da pessoa. O conteúdo das bandas permanece.
  delete from public.profiles
  where id = current_user_id;

  delete from auth.users
  where id = current_user_id;

  if not found then
    raise exception 'ACCOUNT_NOT_FOUND'
      using errcode = 'P0001';
  end if;
end;
$$;

revoke all on function public.delete_account() from public;
grant execute on function public.delete_account() to authenticated;
