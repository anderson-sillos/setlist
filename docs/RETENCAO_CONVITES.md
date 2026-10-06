# Retenção dos convites

A migração `20261002100000_expire_invitation_history.sql` prepara a exclusão
diária de convites 30 dias após o primeiro entre uso, revogação e vencimento.
O job `setlist-prune-invitations` roda às 03:00 UTC. Convites ainda válidos não
são removidos. A exclusão da banda continua removendo imediatamente seus
convites por cascata, inclusive os que estiverem sob suspensão de descarte.

Uma apuração que exija conservar um convite além do prazo deve ser documentada
antes da execução do job. A administração do banco pode registrar a exceção na
tabela `private.invitation_retention_holds`, com o ID do convite, motivo e
`hold_until` definido para uma data futura. Antes desse prazo terminar, revisar
o caso: prorrogar a data com justificativa ou retirar a exceção. O job ignora
somente exceções ainda vigentes. Essa tabela não é acessível pelo app.

Migração aplicada em `setlist-prod` em 02/10/2026; o job consta como ativo.
Conferir no painel Supabase → Cron seu histórico de execuções e a contagem de
convites elegíveis antes e depois da primeira execução. Registrar o resultado
da conferência. A rotina só poderá ser descrita como efetiva na política de
privacidade depois dessa validação.

Os aceites em `legal_acceptances` não fazem parte do job. Eles permanecem
vinculados à banda até sua exclusão; a exclusão da conta desvincula a
referência direta à pessoa.
