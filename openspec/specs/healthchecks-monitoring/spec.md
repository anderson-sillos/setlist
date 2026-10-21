# Healthchecks Monitoring Specification

## Purpose

Detecta falhas ou ausências nas rotinas de retenção e nos serviços públicos do Setlist por meio de sinais independentes, sem enviar dados de usuários aos checks.

## Requirements

### Requirement: Agendar os workflows pelo Cloudflare
Um Cloudflare Worker SHALL despachar os workflows operacionais em horários configurados, por GitHub `workflow_dispatch` e somente na referência `main`. O Worker MUST limitar o acesso e as credenciais às rotinas autorizadas.

#### Scenario: Horário agendado alcançado
- **WHEN** o Cron Trigger do Cloudflare alcança um horário configurado
- **THEN** o Worker cria um token temporário de um GitHub App instalado somente no repositório `setlist`, com permissão `Actions: write`, e dispara apenas o workflow fixo correspondente na `main`; não mantém credenciais de banco, Drive ou Healthchecks

#### Scenario: Invocações limitadas aos horários operacionais
- **WHEN** as rotinas estão agendadas com as quatro expressões Cron UTC
- **THEN** o Worker usa `*/30 * * * *`, `17 4,6 * * *`, `27 4 * * *` e `37 8 * * *`, totalizando 52 eventos diários e despachando somente os workflows devidos

#### Scenario: Agendador desativado ou credencial inválida
- **WHEN** o Worker está desativado ou o GitHub rejeita a autenticação/dispatch
- **THEN** não declara a rotina como concluída nem registra credenciais ou corpos privados da resposta

#### Scenario: Execução manual dos workflows
- **WHEN** um operador inicia manualmente um workflow monitorado
- **THEN** a execução permanece disponível e o workflow não declara `on.schedule`

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
O sistema SHALL conservar `auth.audit_log_entries` por no máximo 30 dias, exceto quando houver retenção temporária documentada e vigente. A limpeza diária SHALL operar somente após a confirmação do suporte do fornecedor e dos privilégios necessários. Um check diário SHALL verificar as execuções e a ausência de registros ou exceções vencidos.

#### Scenario: Revisão diária sem pendências
- **WHEN** a verificação diária encontra a rotina ativa, as execuções diárias esperadas bem-sucedidas, nenhum registro com mais de 30 dias sem exceção vigente e nenhuma exceção vencida
- **THEN** envia sucesso ao check diário de auditoria sem incluir conteúdo de eventos ou identificadores de usuários

#### Scenario: Exceção administrativa vigente
- **WHEN** um administrador cria uma exceção com justificativa sem dados pessoais e prazo futuro
- **THEN** os metadados ficam em tabela privada acessível somente à administração, e a limpeza preserva o registro de auditoria até o fim do prazo

#### Scenario: Registro de auditoria sob exceção vigente
- **WHEN** um registro com mais de 30 dias tem exceção administrativa vigente
- **THEN** a limpeza o preserva e o monitor não o classifica como vencido até o fim do prazo

#### Scenario: Exceção expirada ou órfã
- **WHEN** o prazo da exceção terminou ou o registro de auditoria correspondente não existe
- **THEN** a próxima limpeza remove os metadados da exceção e remove o registro de auditoria quando ele também ultrapassou 30 dias

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
