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
O monitor diário preparado em
[`HEALTHCHECKS_OPERACAO.md`](HEALTHCHECKS_OPERACAO.md) confere o estado ativo,
a última execução bem-sucedida e a ausência de convites elegíveis na conclusão
do job. Ele envia ao check próprio do Healthchecks somente depois de consultar
as contagens agregadas; a Ping URL ainda precisa ser cadastrada no Environment
`production-backup` e o monitor permanece desativado até habilitar
`HEALTHCHECKS_MONITORING_ENABLED`.

A rotina de limpeza foi confirmada pelo responsável em produção em 19/10/2026.
A verificação externa recorrente só poderá ser descrita como operacional após
cadastrar o check e observar um sinal verde no Healthchecks.

Os aceites em `legal_acceptances` não fazem parte do job. Eles permanecem
vinculados à banda até sua exclusão; a exclusão da conta desvincula a
referência direta à pessoa.
