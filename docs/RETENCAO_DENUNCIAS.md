# Retenção do controle de frequência de denúncias

A migração `20261002101000_expire_report_rate_limits.sql` prepara o job
`setlist-prune-report-rate-limits`, que roda diariamente às 03:10 UTC. Ele
remove somente linhas de `report_rate_limits` cuja janela de um minuto
terminou há mais de 24 horas. A função de denúncia pode criar outra linha para
a mesma pessoa depois da limpeza; a restrição de frequência permanece ativa
durante a janela corrente.

Essa tabela contém identificador do denunciante, identificador do último caso
e horário da próxima denúncia permitida. Ela não guarda a descrição enviada.
O histórico necessário para atender o caso permanece no e-mail, conforme a
rotina de revisão trimestral definida pelo responsável.

Migração aplicada em `setlist-prod` em 02/10/2026; o job consta como ativo.
Conferir no painel Supabase → Cron as execuções do job e que uma linha com janela ainda ativa
permanece e que linhas elegíveis são removidas. Registrar a conferência antes
de descrever a limpeza como prática efetiva na política de privacidade.
