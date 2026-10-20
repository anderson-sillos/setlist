# Design

## Context

O banco já executa `setlist-prune-invitations` diariamente às 03:00 UTC. Ainda não existe limpeza de `auth.audit_log_entries`; a decisão operacional registrada é conservar 30 dias e limpar diariamente. O backup exclui deliberadamente essa tabela. O check do backup já usa uma Ping URL privada no GitHub Environment.

Healthchecks.io recebe sinais de tarefas; não faz a sondagem dos endpoints. As sondagens da Web e das APIs serão executadas por um workflow externo. A tabela `auth.audit_log_entries` é gerenciada pelo Supabase, portanto a migração de limpeza só pode ser aplicada depois de conferir a definição e os privilégios efetivos no banco. Como os workflows agendados sofreram atrasos longos no GitHub Actions, um Cloudflare Worker passa a iniciar os workflows por `workflow_dispatch`; o GitHub Actions continua executando jobs, mas deixa de ser o relógio das rotinas.

## Goals / Non-Goals

**Goals:**

- Emitir sinais independentes para a limpeza diária de convites e a verificação diária da retenção de auditoria.
- Verificar a página pública, a API REST e a API Auth do projeto de produção a cada 30 minutos, sem consultar dados de usuários.
- Ensaiar falha, início sem conclusão e recuperação em um check dedicado.
- Manter as URLs de ping fora do Git, do output e dos logs dos workflows.
- Disparar as rotinas nos horários UTC definidos usando Cloudflare Cron Triggers, sem manter cron schedules no GitHub Actions.
- Restringir o Worker a emitir `workflow_dispatch` para os workflows monitorados, sempre na `main`, sem receber credenciais de produção do app.

**Non-Goals:**

- Monitorar latência de consultas, métricas de performance, logs de acesso ou uso de cotas.
- Enviar logs, payloads, identificadores, IPs ou conteúdo de respostas ao Healthchecks.io.
- Alterar o check de backup durante os ensaios.
- Aumentar o prazo de retenção de auditoria já aprovado de 30 dias.

## Decisions

### Origem dos sinais de limpeza

Os workflows do GitHub Actions consultam o histórico `cron.job_run_details` e os predicados de retenção usando `SUPABASE_DB_URL`. O Cloudflare Worker os dispara diariamente nos horários configurados. Cada workflow envia sucesso ao Healthchecks somente depois de confirmar a execução bem-sucedida do job e a condição de limpeza; caso contrário, envia `/fail`. Isso verifica a execução real no Supabase e mantém a Ping URL fora do banco. Uma verificação diária independente verifica as execuções diárias da limpeza de auditoria e se existem registros vencidos.

Foram consideradas chamadas HTTP diretamente do Postgres via `pg_net`. A opção não foi escolhida porque `pg_net` está em beta, a fila/resposta pode reter a URL secreta do ping e exigiria instalar/configurar a extensão. O sinal por workflow externo evita colocar a Ping URL no banco.

### Limpeza da auditoria de autenticação

A função de limpeza apagará diariamente registros com `created_at` anterior a 30 dias, exceto entradas com retenção temporária vigente em `private.auth_audit_retention_holds`. Cada exceção requer justificativa e prazo futuro, não deve conter dados pessoais e é acessível somente à administração do banco. A limpeza remove exceções expiradas ou sem entrada correspondente. O check Healthchecks será diário e verificará as execuções, a retenção e a ausência de exceções vencidas. O preflight de produção confirmou a coluna, o privilégio `DELETE` e o bypass efetivo de RLS. A lista oficial de restrições a operações destrutivas do Supabase cobre tabelas de migração e não inclui `auth.audit_log_entries`; considerar isso uma inferência limitada, não uma garantia de estabilidade do esquema. Não alterar a tabela gerenciada nem criar dependências nela. A tabela de auditoria permanece fora dos backups; os metadados privados de retenção podem estar nos dumps cifrados e serão limpos no próximo ciclo após uma restauração sem auditorias.

Se a verificação prévia não confirmar suporte e privilégios, não aplicar a migração; abrir a pendência com o resultado agregado e consultar o fornecedor antes de escolher outra forma.

### Sondagem Web/API

Um workflow manual consulta `https://setlistbr.app.br/`, `/rest/v1/` e `/auth/v1/settings`. O Worker despacha o workflow a cada 30 minutos. Para as rotas Supabase usa apenas `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, que é uma chave pública sujeita a RLS; não usa service role, token de usuário nem URL de banco. O script valida status HTTP, usa timeout e descarta os corpos das respostas. Um único check só recebe sucesso após os três endpoints responderem corretamente. Os workflows monitorados usam a variável `HEALTHCHECKS_MONITORING_ENABLED=true` como chave de ativação.

Healthchecks usa intervalo de 30 minutos e tolerância de 30 minutos para acomodar atrasos de execução e despacho. Uma ausência pode gerar alerta até cerca de uma hora depois do último sinal; uma falha de endpoint é reportada pelo próximo workflow.

### Agendador Cloudflare

O Worker `setlist-cron-scheduler` recebe um Cron Trigger a cada minuto e compara o horário UTC programado com quatro rotinas fixas: disponibilidade a cada 30 minutos; limpeza de convites às 04:17; retenção da auditoria às 04:27; backup às 06:17 e às 08:37 UTC. Para o backup envia `skip_if_exists=true`, preservando a proteção contra cópias repetidas. Todos os dispatches apontam para `main`. Os workflows de monitoramento e backup não têm mais `on.schedule`; `workflow_dispatch` permanece disponível para execução manual.

O Worker cria um JWT efêmero de GitHub App e solicita um installation token com `Actions: write` somente para o repositório `setlist`. A lista de workflows e a referência são constantes no código; o endpoint HTTP do Worker responde 404. As únicas credenciais no Cloudflare são as do GitHub App; `SUPABASE_DB_URL`, Drive, publishable key e Ping URLs permanecem no GitHub Environment `production-backup`. O Environment separado `cloudflare-scheduler`, limitado a deployments da `main`, guarda o Cloudflare API token e os três valores do GitHub App. A automação publica o Worker inativo, atualiza os secrets e então publica a versão ativa.

### Ensaio de alertas

Um workflow manual restrito a `main` e ao Environment protegido recebe apenas o modo `fail`, `start`, `success` ou `no-ping`, mais uma frase de confirmação. `start` testa timeout sem conclusão; `no-ping` não faz request e serve para observar o prazo de ausência do check. O modo `success` é usado separadamente depois que o alerta for confirmado. A URL pertence a um check de ensaio com notificação por e-mail e configuração curta, sem vínculo com o check de backup.

### Segredos

Cada processo usa uma Ping URL própria em Secrets do Environment `production-backup`: `INVITATION_CLEANUP_HEARTBEAT_URL`, `AUTH_AUDIT_RETENTION_HEARTBEAT_URL`, `SERVICE_UPTIME_HEARTBEAT_URL` e `HEALTHCHECKS_REHEARSAL_URL`. A variável `HEALTHCHECKS_MONITORING_ENABLED` está configurada no repositório. A variável e a chave publicável do Supabase são as já usadas pelo Pages e não são credenciais administrativas. Nenhuma rotina imprime o valor das URLs.

O Environment `cloudflare-scheduler` requer `CLOUDFLARE_API_TOKEN`, `GITHUB_APP_ID`, `GITHUB_INSTALLATION_ID` e `GITHUB_APP_PRIVATE_KEY` como secrets, além de `CLOUDFLARE_ACCOUNT_ID` como variável. O GitHub App deve estar instalado somente em `anderson-sillos/setlist` e conceder somente `Actions: write`; o token do Cloudflare deve limitar-se ao deploy de Workers na conta correta. A ausência de qualquer configuração impede o deploy; o Worker não começa a despachar até a publicação final habilitada.

## Risks / Trade-offs

- [O Cron Trigger ou a API GitHub pode atrasar/falhar] → manter o sinal de início e conclusão dos workflows, usar Healthchecks com grace apropriado, registrar nomes de workflows e horários sem segredos, e investigar dispatches no histórico de Actions e nos logs do Worker.
- [A API REST pode responder com erro permanente caso a exposição do OpenAPI esteja desativada] → confirmar a rota em produção antes de ativar o cron; se `/rest/v1/` não for um endpoint estável no projeto, sondar uma rota REST autenticada anonimamente que não retorne linhas.
- [A tabela de Auth é gerenciada] → validar privilégio e suporte antes de criar ou aplicar a rotina de exclusão; manter a tabela fora do dump e documentar essa limitação de recuperação.
- [Credenciais do Worker ausentes ou inválidas impedem o despacho] → o deploy valida os secrets necessários; erros do Worker não registram tokens, chave, resposta da API ou URLs privadas; o Healthchecks detecta ausência do workflow.
- [O ensaio pode gerar e-mail real] → usar check dedicado, notificação previamente configurada e recuperação manual após confirmar a mensagem.

## Migration Plan

1. Criar checks independentes no Healthchecks.io com os períodos e canais descritos no runbook; cadastrar cada Ping URL no Environment protegido.
2. Validar em produção, somente com consultas de metadados e privilégios, se `auth.audit_log_entries` aceita a operação documentada; não apagar registros manualmente.
3. Aplicar a migração e integrar os workflows e Worker por PR. Configurar o Environment `cloudflare-scheduler` antes de implantar o Worker ativo; não ativar sondagens sem os respectivos checks.
4. Confirmar sinais, eventos e limites sem divulgar URLs nem valores de secrets; executar o ensaio no check isolado e restaurá-lo para `Up`.

Para reverter, desativar o Worker no Cloudflare e, se necessário, remover os workflows e os jobs/funções de limpeza pela migração de rollback aprovada. Não restaurar os registros de auditoria apagados: a tabela não integra os backups existentes.
