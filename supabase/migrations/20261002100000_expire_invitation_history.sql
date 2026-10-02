-- Retém convites por 30 dias após o primeiro evento que os encerrou.
-- Casos em apuração podem receber uma suspensão de descarte com prazo e motivo.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.invitation_retention_holds (
  invitation_id uuid primary key references public.invitations (id) on delete cascade,
  reason text not null check (btrim(reason) <> ''),
  hold_until timestamptz not null,
  created_at timestamptz not null default now(),
  constraint invitation_retention_holds_future_end
    check (hold_until > created_at)
);

comment on table private.invitation_retention_holds is
  'Exceções documentadas para conservar convites em apuração; uso exclusivo da administração do banco.';

create or replace function private.prune_invitations()
returns integer
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  deleted_count integer;
begin
  delete from public.invitations as invitation
  where least(
    invitation.expires_at,
    coalesce(invitation.revoked_at, 'infinity'::timestamptz),
    coalesce(invitation.used_at, 'infinity'::timestamptz)
  ) < now() - interval '30 days'
    and not exists (
      select 1
      from private.invitation_retention_holds as retention_hold
      where retention_hold.invitation_id = invitation.id
        and retention_hold.hold_until > now()
    );

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function private.prune_invitations() from public, anon, authenticated;

create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule(
  'setlist-prune-invitations',
  '0 3 * * *',
  $$select private.prune_invitations()$$
);
