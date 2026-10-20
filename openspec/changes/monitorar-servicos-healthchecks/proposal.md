# Proposal

## Why

As rotinas de retenção e os serviços públicos do Setlist precisam de sinais independentes de sucesso e falha. O check existente cobre o backup; checks próprios podem detectar uma limpeza que não rodou, indisponibilidade da Web ou da API e falhas no canal de alerta.

## What Changes

- Monitorar diariamente a execução de limpeza de convites já agendada no Supabase e confirmar que não restaram convites elegíveis, sem registrar identificadores ou dados pessoais nos pings.
- Implementar a retenção de auditoria de autenticação conforme a decisão já registrada de 30 dias, preservando a rotina diária e exceções administrativas com prazo e justificativa sem dados pessoais. Conferir diariamente a rotina por Healthchecks.
- Executar sondagens sintéticas da Web pública e das APIs REST e Auth do Supabase a cada 30 minutos; enviar sucesso somente quando todas responderem conforme esperado.
- Preparar um check de ensaio separado para validar falha, ausência de conclusão após início e recuperação, sem alterar o check de backup de produção.
- Documentar os checks, os Secrets necessários, a configuração dos períodos e a interpretação dos alertas.

## Capabilities

### New Capabilities

- `healthchecks-monitoring`: monitoramento externo das rotinas de retenção, disponibilidade dos serviços públicos e funcionamento do canal de alertas.

### Modified Capabilities

Nenhuma.

## Impact

- Novos workflows, scripts e verificações no GitHub Actions.
- Migração e testes SQL para limpeza de `auth.audit_log_entries`, condicionados à confirmação de suporte e permissões da tabela gerenciada pelo Supabase.
- Secrets separados no Environment `production-backup` para cada check; as URLs de ping não serão armazenadas no repositório nem impressas nos logs. Os workflows ficam desativados até os checks e os Secrets estarem configurados.
- Configuração manual de checks no Healthchecks.io e validação operacional final depois que os Secrets forem cadastrados.
