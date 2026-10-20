# Tasks

## 1. Monitorar a limpeza de convites

- [x] 1.1 Criar consulta somente agregada para confirmar job ativo, execução recente bem-sucedida e ausência de convites vencidos não protegidos; preparar pgTAP para confirmar que Holds vigentes são excluídos e teste automatizado para garantir que a saída não contém IDs ou tokens.
- [x] 1.2 Criar workflow diário que execute a consulta e envie `start`, sucesso ou `/fail` ao check próprio; configurar agenda, referência `main`, timeout, permissões mínimas e teste focado no CI.
- [x] 1.3 Documentar check diário, período, tolerância, secret `INVITATION_CLEANUP_HEARTBEAT_URL`, ativação e leitura dos eventos; conferir o runbook contra o workflow.

## 2. Implementar e revisar a retenção da auditoria

- [x] 2.1 Consultar somente metadados em `setlist-prod` para confirmar colunas, privilégio `DELETE` e compatibilidade da operação com a tabela gerenciada; registrar resultado sem consultar ou exibir linhas de auditoria.
- [x] 2.2 Se o fornecedor e os privilégios permitirem, criar limpeza diária de `auth.audit_log_entries` com prazo de 30 dias, exceções privadas com prazo/motivo sem dados pessoais e teste pgTAP; se não permitirem, interromper esta tarefa e registrar a restrição.
- [x] 2.3 Criar workflow diário que confirme as execuções esperadas e a condição de retenção, enviando apenas resultado agregado ao check `AUTH_AUDIT_RETENTION_HEARTBEAT_URL`; cobrir estados de sucesso e falha no teste do runner.
- [x] 2.4 Atualizar a documentação de retenção e recuperação, explicando os 30 dias, a limpeza diária, o check diário e que a auditoria não está incluída no backup; conferir coerência com a política de privacidade e o script de backup.

## 3. Sondar Web e APIs Supabase a cada 30 minutos

- [x] 3.1 Implementar probe sem leitura de dados de usuários para a página pública, REST e Auth, usando somente URL e chave publicável; testar status, timeout, tratamento de respostas, redirecionamentos e ausência de bodies nos logs.
- [x] 3.2 Criar workflow `*/30 * * * *` restrito a `main`, com check próprio, sinais de início/sucesso/falha e timeout; manter o workflow inativo até `HEALTHCHECKS_MONITORING_ENABLED` ser habilitado.
- [x] 3.3 Documentar o check de 30 minutos, tolerância, URLs verificadas, secret `SERVICE_UPTIME_HEARTBEAT_URL`, variável de habilitação e limite de precisão do agendamento do GitHub; conferir instruções e workflows.

## 4. Ensaiar o canal de alertas

- [x] 4.1 Criar workflow manual em `main`, vinculado ao Environment `production-backup`, com confirmação explícita e modos `fail`, `start`, `no-ping` e `success`; testar que apenas o check dedicado é alterado e que a Ping URL não aparece nos logs.
- [x] 4.2 Documentar a criação do check curto de ensaio, os tempos de tolerância, a confirmação do alerta e o passo separado de recuperação; validar o fluxo sem usar o check do backup.

## 5. Conferir a integração

- [x] 5.1 Validar o schema OpenSpec, analisar sintaticamente os workflows, executar os testes focados e conferir o diff para assegurar que nenhum valor de secret real foi incluído.
- [ ] 5.2 Configurar os checks e Secrets no Environment, habilitar a variável de monitoramento, confirmar os sinais diários e a cada 30 minutos, e concluir o ensaio de falha e recuperação usando somente o check dedicado.

## Estado e pendências externas

- O preflight de `setlist-prod`, recebido em 20/10/2026, confirmou `table_exists`,
  `created_at_is_timestamptz`, `current_role_can_delete` e
  `current_role_bypasses_effective_rls` como `true`; `row_level_security_enabled`
  também é `true`. Nenhuma linha de auditoria foi consultada. A lista oficial de
  restrições a DML destrutivo do Supabase se aplica às tabelas de migração e não
  inclui `auth.audit_log_entries`; essa compatibilidade é uma inferência da
  lista publicada, não uma garantia de estabilidade futura do esquema:
  https://supabase.com/changelog/34270-restricting-access-on-auth-storage-and-realtime-schemas-on-april-21-2025
- O código da limpeza diária de auditoria e o pgTAP passaram no workflow
  `Testes do banco` da PR #56 ([run 39455484841](https://github.com/anderson-sillos/setlist/actions/runs/39455484841)).
  A migração ainda não foi aplicada em produção.
- Exceções de auditoria ficam em tabela privada, com prazo e motivo sem dados
  pessoais. O monitor considera antigos vencidos somente os registros sem
  exceção vigente e detecta metadados de exceções expiradas/orfãs.
- Os testes Node focados e a validação OpenSpec passaram. Os testes pgTAP serão
  executados no workflow de banco do CI; o Docker local não foi iniciado.
- A tarefa 5.2 depende de criar os quatro checks no Healthchecks, guardar as
  Ping URLs no Environment, habilitar a variável e observar os sinais reais.
