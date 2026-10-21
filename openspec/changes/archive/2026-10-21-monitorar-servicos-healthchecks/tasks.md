# Tasks

## 1. Monitorar a limpeza de convites

- [x] 1.1 Criar consulta somente agregada para confirmar job ativo, execução recente bem-sucedida e ausência de convites vencidos não protegidos; preparar pgTAP para confirmar que Holds vigentes são excluídos e teste automatizado para garantir que a saída não contém IDs ou tokens.
- [x] 1.2 Criar workflow manual que execute a consulta e envie `start`, sucesso ou `/fail` ao check próprio; manter referência `main`, timeout, permissões mínimas e teste focado no CI. O Cloudflare Worker despacha a execução diária.
- [x] 1.3 Documentar check diário, período, tolerância, secret `INVITATION_CLEANUP_HEARTBEAT_URL`, ativação e leitura dos eventos; conferir o runbook contra o workflow.

## 2. Implementar e revisar a retenção da auditoria

- [x] 2.1 Consultar somente metadados em `setlist-prod` para confirmar colunas, privilégio `DELETE` e compatibilidade da operação com a tabela gerenciada; registrar resultado sem consultar ou exibir linhas de auditoria.
- [x] 2.2 Se o fornecedor e os privilégios permitirem, criar limpeza diária de `auth.audit_log_entries` com prazo de 30 dias, exceções privadas com prazo/motivo sem dados pessoais e teste pgTAP; se não permitirem, interromper esta tarefa e registrar a restrição.
- [x] 2.3 Criar workflow diário que confirme as execuções esperadas e a condição de retenção, enviando apenas resultado agregado ao check `AUTH_AUDIT_RETENTION_HEARTBEAT_URL`; cobrir estados de sucesso e falha no teste do runner.
- [x] 2.4 Atualizar a documentação de retenção e recuperação, explicando os 30 dias, a limpeza diária, o check diário e que a auditoria não está incluída no backup; conferir coerência com a política de privacidade e o script de backup.

## 3. Sondar Web e APIs Supabase a cada 30 minutos

- [x] 3.1 Implementar probe sem leitura de dados de usuários para a página pública, REST e Auth, usando somente URL e chave publicável; testar status, timeout, tratamento de respostas, redirecionamentos e ausência de bodies nos logs.
- [x] 3.2 Criar workflow manual restrito a `main`, com check próprio, sinais de início/sucesso/falha e timeout; o Cloudflare Worker o despacha a cada 30 minutos. O workflow permanece condicionado a `HEALTHCHECKS_MONITORING_ENABLED`.
- [x] 3.3 Documentar o check de 30 minutos, tolerância, URLs verificadas, secret `SERVICE_UPTIME_HEARTBEAT_URL`, variável de habilitação e limite de precisão do agendador externo; conferir instruções e workflows.

## 4. Ensaiar o canal de alertas

- [x] 4.1 Criar workflow manual em `main`, vinculado ao Environment `production-backup`, com confirmação explícita e modos `fail`, `start`, `no-ping` e `success`; testar que apenas o check dedicado é alterado e que a Ping URL não aparece nos logs.
- [x] 4.2 Documentar a criação do check curto de ensaio, os tempos de tolerância, a confirmação do alerta e o passo separado de recuperação; validar o fluxo sem usar o check do backup.

## 5. Conferir a integração

- [x] 5.1 Validar o schema OpenSpec, analisar sintaticamente os workflows, executar os testes focados e conferir o diff para assegurar que nenhum valor de secret real foi incluído.
- [x] 5.2 Configurar os checks e Secrets no Environment e habilitar `HEALTHCHECKS_MONITORING_ENABLED` no escopo do repositório; concluído em 20/10/2026.
- [x] 5.3 Confirmar os sinais automáticos diários e a cada 30 minutos e concluir o ensaio de falha e recuperação usando somente o check dedicado. Em 21/10/2026, os monitores de convites e auditoria concluíram com sucesso às 01:17 e 01:27 BRT ([39543190964](https://github.com/anderson-sillos/setlist/actions/runs/39543190964), [39544148965](https://github.com/anderson-sillos/setlist/actions/runs/39544148965)); o monitor Web/API passou em quatro dispatches consecutivos de 30 minutos ([39541631634](https://github.com/anderson-sillos/setlist/actions/runs/39541631634), [39544384804](https://github.com/anderson-sillos/setlist/actions/runs/39544384804), [39547102035](https://github.com/anderson-sillos/setlist/actions/runs/39547102035), [39549917610](https://github.com/anderson-sillos/setlist/actions/runs/39549917610)). As falhas anteriores do probe foram corrigidas. O responsável confirmou a recuperação do check dedicado após observar os estados down/up; os workflows do ensaio também concluíram com sucesso ([39542217837](https://github.com/anderson-sillos/setlist/actions/runs/39542217837), [39542755690](https://github.com/anderson-sillos/setlist/actions/runs/39542755690), [39546357591](https://github.com/anderson-sillos/setlist/actions/runs/39546357591)).

## 6. Substituir os cron schedules do GitHub pelo Cloudflare Worker

- [x] 6.1 Implementar Worker com Cron Trigger UTC, lista fixa dos workflows, GitHub App token efêmero limitado a `Actions: write` no repositório, dispatch apenas na `main` e testes de horários, JWT, permissões e erros sanitizados.
- [x] 6.2 Remover `on.schedule` de todos os workflows de produção afetados, preservar `workflow_dispatch` e garantir que os dois horários de backup mantenham `skip_if_exists=true`.
- [x] 6.3 Criar deploy do Worker na `main`, com Environment separado `cloudflare-scheduler`, secrets enviados sem exposição em logs e publicação final habilitada apenas após configurar as credenciais.
- [x] 6.4 Configurar GitHub App, token de deploy Cloudflare e variáveis/secrets no Environment `cloudflare-scheduler`; implantar, conferir os Cron Triggers e validar dispatches e sinais no Healthchecks. O deploy pós-correção concluiu com sucesso ([39535532070](https://github.com/anderson-sillos/setlist/actions/runs/39535532070)); o responsável confirmou no painel os quatro Cron Triggers configurados. Os dispatches nos horários previstos foram confirmados pelos runs de convites, auditoria e Web/API registrados na tarefa 5.3.


## Estado e evidências externas

- O preflight de `setlist-prod`, em 20/10/2026, confirmou `table_exists`,
  `created_at_is_timestamptz`, `current_role_can_delete` e
  `current_role_bypasses_effective_rls` como `true`; `row_level_security_enabled`
  também é `true`. Nenhuma linha de auditoria foi consultada. A lista oficial de
  restrições a DML destrutivo do Supabase se aplica às tabelas de migração e não
  inclui `auth.audit_log_entries`; essa compatibilidade é uma inferência da
  lista publicada, não uma garantia de estabilidade futura do esquema:
  https://supabase.com/changelog/34270-restricting-access-on-auth-storage-and-realtime-schemas-on-april-21-2025
- A migração `20261020120000_add_auth_audit_retention.sql` foi aplicada em
  `setlist-prod` e `setlist-dev` em 20/10/2026. O histórico remoto confirmou a
  função, a tabela privada de exceções e um job cron ativo (`20 3 * * *`) nos
  dois projetos. O monitor diário da auditoria teve execução bem-sucedida em
  21/10/2026 às 01:27 BRT ([39544148965](https://github.com/anderson-sillos/setlist/actions/runs/39544148965)).
- Exceções de auditoria ficam em tabela privada, com prazo e motivo sem dados
  pessoais. O monitor considera antigos vencidos somente os registros sem
  exceção vigente e detecta metadados de exceções expiradas ou órfãs. A auditoria
  permanece excluída do backup, conforme documentado em
  `docs/BACKUP_SUPABASE_TO_DRIVE.md`.
- Os testes Node focados, a validação OpenSpec e os testes pgTAP passaram no CI.
  O Docker local não foi iniciado.
- O Worker `setlist-cron-scheduler` foi implantado com sucesso após a correção do
  GitHub App ([deploy 39535532070](https://github.com/anderson-sillos/setlist/actions/runs/39535532070)).
  O responsável confirmou no painel os quatro Cron Triggers. Os dispatches
  automáticos dos monitores ocorreram nos horários previstos em 21/10/2026;
  as execuções e os sinais bem-sucedidos estão referenciados na tarefa 5.3.
- O check isolado `setlist-alert-rehearsal` foi usado no ensaio; o responsável
  confirmou sua recuperação após observar a transição de falha para saudável.
  O check do backup não foi usado no ensaio.
