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

Verificação somente leitura em `setlist-prod` (`tqijocmmiwistinrjpwl`) em
19/10/2026 confirmou a migração `20261002101000`, o job ativo (03:10 UTC), 17
execuções bem-sucedidas e nenhuma execução com falha. A primeira execução foi
em 03/10/2026 às 03:10 UTC. A definição consultada no banco confirma o filtro
`next_allowed_at < now() - interval '24 hours'`. A reserva de envio usa
`now() + interval '1 minute'`, então uma janela aberta ou recém-encerrada não
é removida. No momento da consulta, a tabela estava vazia. O histórico do Cron
registra `1 row` para a instrução, sem expor o número de linhas apagadas; por
isso, não há evidência de uma exclusão efetiva de linha elegível ou de uma
janela ativa observada durante a execução.

A política de privacidade pública da RC.4 já informa que uma rotina diária
remove registros cuja janela terminou há mais de 24 horas. A conclusão desta
conferência é sustentada pela definição implantada e pelo histórico de execuções;
se for necessário comprovar uma exclusão de linha em produção, isso exigirá uma
validação controlada com registros de teste, que não foi realizada nesta
consulta somente leitura.
