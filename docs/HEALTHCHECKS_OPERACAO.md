# Monitoramento operacional com Healthchecks.io

Este runbook descreve três checks independentes dos backups e um check isolado
para ensaiar alertas. Um Cloudflare Worker agenda os workflows de monitoramento
e backup; GitHub Actions executa o trabalho e mantém os secrets operacionais.
As URLs de ping são credenciais: mantenha-as somente em Secrets do GitHub
Environment `production-backup`; não as cole em issues, comandos, logs,
documentação ou mensagens.

## Checks e agenda

| Check                      | Workflow                                                                           | Período no Healthchecks |  Grace | O que confirma                                                                                                       |
| -------------------------- | ---------------------------------------------------------------------------------- | ----------------------: | -----: | -------------------------------------------------------------------------------------------------------------------- |
| Limpeza de convites        | Worker despacha `supabase-invitation-cleanup-monitor.yml` às 04:17 UTC diariamente |                    24 h |    6 h | Job diário ativo, última execução bem-sucedida recente e nenhum convite vencido elegível na conclusão dessa execução |
| Retenção da auditoria Auth | Worker despacha `supabase-auth-audit-monitor.yml` às 04:27 UTC diariamente         |                    24 h |    6 h | Job de limpeza diário ativo, execuções bem-sucedidas nos dias esperados e nenhum registro anterior a 30 dias         |
| Web e Supabase             | Worker despacha `service-availability-monitor.yml` a cada 30 minutos               |                  30 min | 30 min | Página pública, raiz REST e configuração pública Auth respondem com HTTP 2xx                                         |
| Ensaio de alertas          | `healthchecks-alert-rehearsal.yml`, manual                                         |                   5 min |  5 min | Sinal `fail`, timeout de `start`, ausência de ping ou recuperação; nunca usa o check de backup                       |

Os horários do Worker são UTC e não mudam com horário de verão. O monitor de
serviços não é um SLA; confirme o histórico de Cron Triggers no Cloudflare, os
dispatches no GitHub Actions e os eventos do Healthchecks antes de atribuir uma
falha ao serviço.
O Worker recebe 52 eventos programados por dia com os quatro Cron Triggers
acima, em vez de 1.440 chamadas por minuto.

## Configuração inicial

1. No Healthchecks.io, crie quatro checks separados com os períodos e grace
   acima. Habilite a notificação por e-mail nos três checks de produção e no
   check de ensaio. Não reutilize o check `Setlist Supabase backup`.
2. No repositório, em **Settings → Environments → production-backup**, cadastre
   estas Secrets com a Ping URL raiz de cada check:

   - `INVITATION_CLEANUP_HEARTBEAT_URL`
   - `AUTH_AUDIT_RETENTION_HEARTBEAT_URL`
   - `SERVICE_UPTIME_HEARTBEAT_URL`
   - `HEALTHCHECKS_REHEARSAL_URL`

3. Confirme que `SUPABASE_DB_URL` continua nesse Environment e que as variáveis
   públicas `EXPO_PUBLIC_SUPABASE_URL` e
   `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` estão configuradas no repositório.
   A chave publicável é usada somente nos probes REST/Auth; nenhum token de
   usuário, service-role ou conteúdo de resposta é enviado.
4. Execute o preflight da auditoria descrito abaixo. A migração é fail-closed
   e não instala a limpeza se a tabela, coluna, permissão ou bypass efetivo de
   RLS não corresponderem ao esperado.
5. Configure o Environment **cloudflare-scheduler**, permitido somente para
   deployments da `main`:

   - variável `CLOUDFLARE_ACCOUNT_ID`;
   - secret `CLOUDFLARE_API_TOKEN`, com acesso de edição a Workers na conta;
   - secrets `SETLIST_CRON_GITHUB_APP_ID`,
     `SETLIST_CRON_GITHUB_INSTALLATION_ID` e
     `SETLIST_CRON_GITHUB_APP_PRIVATE_KEY` de um GitHub App instalado somente
     no repositório `anderson-sillos/setlist`, com a permissão `Actions: write`.

   O Worker usa esses dados somente para emitir installation tokens temporários
   e despachar workflows. Não cadastre credenciais de banco, Drive ou Healthchecks
   nesse Environment. A rotina de deploy publica o Worker inativo, grava as
   credenciais como Worker Secrets e publica a versão ativa.

6. Integre a alteração e execute **Publicar agendador Cloudflare** na `main`.
   Defina `HEALTHCHECKS_MONITORING_ENABLED=true` no repositório somente depois
   de conferir que os checks e Secrets de produção estão prontos. Os workflows
   de monitoramento e backup são disparados pelo Worker e continuam disponíveis
   para operação manual na `main`.
7. Confira no Cloudflare os quatro Cron Triggers (`*/30 * * * *`,
   `17 4,6 * * *`, `27 4 * * *` e `37 8 * * *`) e os logs do Worker; depois
   confirme dispatches e sinais nos três checks monitorados. Valide o ensaio de
   alertas manualmente no check separado. Não registre nem compartilhe as Ping
   URLs.

### Criar as credenciais de deploy e dispatch

1. No GitHub, abra **Settings → Developer settings → GitHub Apps → New GitHub
   App**. Use `https://setlistbr.app.br` como Homepage URL, desative o webhook,
   conceda somente **Repository permissions → Actions → Read and write**, e
   crie o App. Instale-o somente no repositório `anderson-sillos/setlist`. Gere
   uma chave privada PEM e guarde-a em local seguro. No Environment
   `cloudflare-scheduler`, grave o App ID como
   `SETLIST_CRON_GITHUB_APP_ID`, o ID da instalação como
   `SETLIST_CRON_GITHUB_INSTALLATION_ID` e o conteúdo PEM como
   `SETLIST_CRON_GITHUB_APP_PRIVATE_KEY`.
2. No Cloudflare, abra **My Profile → API Tokens → Create Token → Custom Token**.
   Limite o token à conta Setlist e à permissão **Workers Scripts: Edit**. Grave
   o token como `CLOUDFLARE_API_TOKEN` e o Account ID da mesma conta como a
   variável `CLOUDFLARE_ACCOUNT_ID` no Environment.
3. Depois de cadastrar os valores, integre a alteração. O workflow de deploy
   usa o token do GitHub App para o dispatch e o token Cloudflare somente durante
   a publicação; os valores não devem ser copiados para o chat, para o código ou
   para Secrets de produção.

## Preflight somente leitura para a auditoria Auth

Antes de aplicar a migração, abra o SQL Editor de `setlist-prod` e execute o
conteúdo de
[`scripts/healthchecks/auth-audit-retention-prerequisites.sql`](../scripts/healthchecks/auth-audit-retention-prerequisites.sql)
com a mesma role que aplicará a migração. A saída tem cinco campos booleanos:

- `table_exists` deve ser `true`;
- `created_at_is_timestamptz` deve ser `true`;
- `current_role_can_delete` deve ser `true`;
- `current_role_bypasses_effective_rls` deve ser `true`.
- `row_level_security_enabled` é informativo: mostra se a tabela tem RLS
  habilitado; a role de migração ainda precisa ignorar as políticas efetivas,
  conforme o campo anterior.

Se algum dos quatro requisitos divergir, não aplique a migração. Mesmo quando
todos os quatro forem `true`, eles comprovam apenas esquema e permissões da role, não
uma garantia de estabilidade futura da tabela gerenciada. A lista oficial de
restrições a DML destrutivo do Supabase é específica para tabelas de migração e
não inclui `auth.audit_log_entries`; essa compatibilidade é uma inferência da
[lista publicada](https://supabase.com/changelog/34270-restricting-access-on-auth-storage-and-realtime-schemas-on-april-21-2025),
não uma garantia de que a estrutura da tabela permanecerá estável. A
[documentação de Auth Audit Logs](https://supabase.com/docs/guides/auth/audit-logs)
descreve a gravação Postgres como opcional. A consulta não lê eventos,
payloads, IDs ou dados de usuários.
A rotina proposta remove diariamente linhas com `created_at` anterior a 30 dias
que não tenham exceção vigente.

### Exceção temporária de auditoria

Use uma exceção somente para uma apuração concreta. A tabela
`private.auth_audit_retention_holds` guarda o ID do evento, um motivo e o prazo;
não inclua nome, e-mail, IP ou outro dado pessoal no motivo. Acesse o SQL Editor
com a role administrativa e registre uma exceção com prazo futuro:

```sql
do $$
declare
  selected_entry_id uuid := '<ID do registro de auditoria>';
begin
  if not exists (
    select 1
    from auth.audit_log_entries
    where id = selected_entry_id
  ) then
    raise exception 'Registro de auditoria não encontrado';
  end if;

  insert into private.auth_audit_retention_holds (
    audit_log_entry_id,
    reason,
    hold_until
  )
  values (
    selected_entry_id,
    '<referência curta do caso, sem dados pessoais>',
    '<data e hora com fuso, no futuro>'::timestamptz
  )
  on conflict (audit_log_entry_id) do update
  set reason = excluded.reason,
      hold_until = excluded.hold_until;
end;
$$;
```

Revise antes do vencimento e renove somente se a apuração ainda exigir a
retenção. A rotina diária remove exceções vencidas; se o registro correspondente
já não existir, também remove a exceção órfã. O check diário envia apenas
estados agregados, sem IDs ou justificativas.

## Sondagens e dados enviados

O probe de disponibilidade solicita somente:

- `https://setlistbr.app.br/`;
- `<EXPO_PUBLIC_SUPABASE_URL>/rest/v1/` com a chave publicável;
- `<EXPO_PUBLIC_SUPABASE_URL>/auth/v1/settings` com a chave publicável.

Os corpos HTTP são descartados. Os logs mostram apenas o nome do serviço e o
status HTTP ou uma mensagem genérica de falha; URLs completas e respostas não
são registradas. O sinal de sucesso só é enviado depois de todos os probes.

Os monitores de retenção consultam `cron.job`, `cron.job_run_details`, os
predicados de retenção e contagens. Não retornam IDs, tokens, e-mails, payloads
ou linhas da tabela de auditoria.

## Ensaio do canal de alerta

No GitHub, abra **Actions → Ensaio controlado do Healthchecks → Run workflow**,
selecione `main`, escolha o modo e digite exatamente
`RUN HEALTHCHECKS REHEARSAL` no campo de confirmação.

- `fail`: sinaliza falha imediatamente no check de ensaio.
- `start`: envia início; aguarde o grace de 5 minutos para confirmar o alerta.
- `no-ping`: não faz request; aguarde o check passar do prazo para confirmar
  alerta por ausência de sinal.
- `success`: recupera o check depois de confirmar o alerta.

Não execute `success` antes de observar o evento de falha/timeout, pois a
recuperação pode fechar a janela de investigação. A execução exige `main` e o
Environment `production-backup`. O workflow não aceita URL como input e nunca
exibe o Secret.

## Interpretação e recuperação

Um check `Down` por falta de sinal pode indicar atraso/ausência do workflow ou
falta de Secret; verifique primeiro o histórico do Actions e depois os eventos
do Healthchecks. Falha de probe mostra somente o serviço e o status, sem corpo
de resposta. Corrija o serviço ou workflow e aguarde o próximo sinal saudável.

Os registros de `auth.audit_log_entries` são deliberadamente excluídos do
backup. Depois de eliminados pela retenção de 30 dias, não podem ser restaurados
da cópia do Drive. A exclusão das auditorias já vencidas é irreversível.
