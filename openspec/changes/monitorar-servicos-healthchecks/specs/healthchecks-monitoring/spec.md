# Spec Delta

## Purpose

Detecta falhas ou ausências nas rotinas de retenção e nos serviços públicos do Setlist por meio de sinais independentes, sem enviar dados de usuários aos checks.

## ADDED Requirements

### Requirement: Agendar os workflows pelo Cloudflare
Um Cloudflare Worker SHALL despachar por GitHub `workflow_dispatch` os workflows de disponibilidade (a cada 30 minutos), limpeza de convites (04:17 UTC diariamente), retenção de auditoria (04:27 UTC diariamente) e backup (06:17 e 08:37 UTC diariamente). Os dispatches SHALL usar somente a referência `main` e a lista fixa de workflows. Os workflows correspondentes MUST NOT declarar `on.schedule`; a execução manual MUST permanecer disponível. O Worker MUST usar GitHub App instalado somente no repositório `setlist`, com permissão `Actions: write`, e MUST NOT receber credenciais de banco, Drive ou Healthchecks.

#### Scenario: Horário agendado alcançado
- **WHEN** o Cron Trigger do Cloudflare alcança um horário configurado
- **THEN** o Worker cria um token temporário do GitHub App restrito ao repositório e dispara somente o workflow correspondente na `main`

#### Scenario: Nenhum workflow está previsto
- **WHEN** um minuto não corresponde a nenhum dos horários de execução
- **THEN** o Worker não chama a API do GitHub

#### Scenario: Agendador desativado ou credencial inválida
- **WHEN** o Worker está desativado ou o GitHub rejeita a autenticação/dispatch
- **THEN** não declara a rotina como concluída e não registra credenciais ou corpos privados da resposta

#### Scenario: Backup de recuperação
- **WHEN** um dos horários diários de backup é disparado
- **THEN** envia `skip_if_exists=true`, para repetir somente se a cópia diária ainda não estiver íntegra

### Requirement: Validar a limpeza diária de convites
O monitor SHALL confirmar diariamente que o job de limpeza de convites está ativo, concluiu com sucesso e registrou sua execução. O monitor MUST NOT enviar IDs, tokens, endereços ou outros dados pessoais ao Healthchecks.io.

#### Scenario: Limpeza diária concluída
- **WHEN** o monitor verifica o job após o horário previsto
- **THEN** envia sucesso somente se o job ativo teve execução recente bem-sucedida e não deixou convites elegíveis para exclusão

#### Scenario: Limpeza ausente ou com erro
- **WHEN** o job está inativo, não executou, falhou ou deixou convites elegíveis
- **THEN** o monitor sinaliza falha ao check independente de convites

### Requirement: Aplicar e conferir a retenção da auditoria de autenticação
Os registros de `auth.audit_log_entries` SHALL ser conservados por no máximo 30 dias, com limpeza diária depois de confirmados o suporte do fornecedor e os privilégios necessários, exceto quando houver uma retenção temporária documentada e vigente. As exceções SHALL ter justificativa sem dados pessoais e prazo futuro em tabela privada, acessível somente à administração. A limpeza diária SHALL remover exceções vencidas ou sem registro correspondente. Um check diário SHALL conferir as execuções, a ausência de registros vencidos sem exceção e a ausência de exceções pendentes de limpeza.

#### Scenario: Revisão diária sem pendências
- **WHEN** a verificação diária encontra a rotina ativa, as execuções diárias esperadas bem-sucedidas, nenhum registro com mais de 30 dias sem exceção vigente e nenhuma exceção vencida
- **THEN** envia sucesso ao check diário de auditoria sem incluir conteúdo de eventos ou identificadores de usuários

#### Scenario: Registro de auditoria sob exceção vigente
- **WHEN** um registro com mais de 30 dias tem exceção administrativa vigente, com motivo documentado e prazo futuro
- **THEN** a limpeza o preserva e o monitor não o classifica como vencido até o fim do prazo

#### Scenario: Exceção expirada
- **WHEN** o prazo da exceção terminou
- **THEN** a próxima limpeza remove os metadados vencidos e o registro de auditoria se ele também ultrapassou 30 dias

#### Scenario: Retenção vencida ou rotina indisponível
- **WHEN** falta uma execução esperada, uma execução falhou, existem registros acima do prazo sem exceção vigente ou há exceção vencida pendente de limpeza
- **THEN** sinaliza falha ao check de auditoria e preserva evidência agregada suficiente para investigação

### Requirement: Sondar a disponibilidade pública da Web e do Supabase
Um processo externo SHALL sondar a página pública do Setlist e as APIs REST e Auth do Supabase a cada 30 minutos. SHALL enviar sucesso somente quando todas responderem com status HTTP de sucesso dentro do limite de tempo; MUST NOT ler dados de usuários.

#### Scenario: Serviços públicos disponíveis
- **WHEN** a página pública, a API REST e a API Auth respondem dentro do limite
- **THEN** envia sucesso ao check de disponibilidade

#### Scenario: Um serviço público falha
- **WHEN** qualquer endpoint retorna erro HTTP, falha TLS, não resolve ou excede o limite
- **THEN** sinaliza falha ao check de disponibilidade sem registrar respostas com dados de usuários

### Requirement: Ensaiar alertas em check isolado
O processo de ensaio SHALL usar um check Healthchecks.io exclusivo para testes e SHALL oferecer sinais controlados de falha, início sem conclusão e recuperação. MUST NOT alterar o check de backup nem enviar URLs de ping aos logs.

#### Scenario: Falha explícita no check de ensaio
- **WHEN** o responsável dispara o modo de falha
- **THEN** o check de ensaio recebe o sinal de falha e pode acionar os canais de notificação configurados

#### Scenario: Execução sem conclusão
- **WHEN** o responsável envia início e não conclui dentro da tolerância configurada
- **THEN** o check de ensaio passa a falho e aciona os canais de notificação

#### Scenario: Recuperar o check de ensaio
- **WHEN** o responsável dispara a recuperação depois de confirmar o alerta
- **THEN** o check volta a saudável sem alterar outros checks
