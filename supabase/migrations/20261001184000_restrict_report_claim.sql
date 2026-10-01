-- Os default privileges do projeto podem conceder EXECUTE ao papel anon.
-- A reserva da janela de denúncia exige uma sessão autenticada.
revoke all on function public.claim_report_slot() from public, anon;
grant execute on function public.claim_report_slot() to authenticated;
