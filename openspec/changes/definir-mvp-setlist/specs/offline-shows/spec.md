## Purpose

Definir download, verificação, substituição e remoção segura de pacotes de shows para execução offline nos aplicativos Android e iOS.

## ADDED Requirements

### Requirement: Offline restrito aos aplicativos móveis
O sistema SHALL oferecer pacotes offline em Android e iOS e MUST NOT oferecer download ou promessa de funcionamento offline na versão web.

#### Scenario: Acessar show Pronto no celular ou tablet
- **WHEN** um integrante abre um show Pronto no aplicativo Android ou iOS
- **THEN** o sistema oferece a opção de baixar o pacote

#### Scenario: Acessar versão web
- **WHEN** um integrante usa o Setlist em um navegador
- **THEN** o sistema exige conexão para consultar ou executar o show e não oferece pacote offline

### Requirement: Elegibilidade do show para download
O sistema SHALL permitir novos downloads somente para shows Prontos.

#### Scenario: Baixar show Pronto
- **WHEN** um integrante autorizado solicita o download de um show Pronto
- **THEN** o sistema prepara e salva o pacote completo no aplicativo móvel

#### Scenario: Tentar baixar Rascunho ou Cancelado
- **WHEN** um integrante solicita o download de um show em Rascunho ou Cancelado
- **THEN** o sistema rejeita a solicitação

### Requirement: Pacote autocontido de show
O sistema SHALL incluir no pacote os dados do show, blocos, ordem, itens, observações, músicas, letras, tempos, metadados necessários e a data/hora de conteúdo.

#### Scenario: Abrir pacote sem conexão
- **WHEN** um integrante autenticado anteriormente abre um pacote válido sem conexão
- **THEN** o sistema apresenta o show e permite o modo palco sem consultar o backend

### Requirement: Substituição atômica
O sistema MUST validar integralmente um novo pacote antes de substituir o pacote atual e SHALL manter somente um pacote vigente por show e usuário no aparelho.

#### Scenario: Atualização concluída
- **WHEN** o novo pacote termina de ser baixado e validado
- **THEN** o sistema substitui o pacote anterior como uma única operação e remove a cópia antiga

#### Scenario: Falha durante atualização
- **WHEN** o download, a gravação ou a validação do novo pacote falha
- **THEN** o sistema preserva o pacote anterior utilizável e informa que a atualização não foi concluída

### Requirement: Verificação temporal do conteúdo
O sistema SHALL comparar, quando conectado, o `content_updated_at` local com o valor atual fornecido pelo servidor para classificar a atualização do pacote.

#### Scenario: Timestamps iguais
- **WHEN** o valor local é igual ao valor atual do servidor
- **THEN** o sistema apresenta `Conteúdo atualizado`

#### Scenario: Timestamps diferentes
- **WHEN** o valor local é diferente do valor atual do servidor
- **THEN** o sistema apresenta `Atualização disponível` e mantém o pacote existente até solicitação do músico

#### Scenario: Não é possível consultar o servidor
- **WHEN** o aparelho está offline e não pode verificar o valor atual
- **THEN** o sistema apresenta `Verificação pendente` e permite usar o último pacote válido

### Requirement: Retenção controlada pelo músico
O sistema SHALL manter os pacotes na área persistente do aplicativo sem expiração automática e SHALL permitir sua remoção manual.

#### Scenario: Pacote permanece sem uso recente
- **WHEN** um pacote válido não é aberto por um período prolongado
- **THEN** o sistema o preserva até remoção manual ou ocorrência de uma regra de limpeza obrigatória

#### Scenario: Remover download
- **WHEN** o músico confirma a remoção de um show baixado
- **THEN** o sistema exclui o pacote daquele aparelho sem alterar o show compartilhado

### Requirement: Limpeza por segurança e estado
O sistema MUST remover pacotes no logout e SHALL bloquear e remover pacotes inacessíveis na próxima conexão após perda de participação ou cancelamento do show.

#### Scenario: Realizar logout
- **WHEN** a pessoa encerra sua sessão
- **THEN** o sistema remove a sessão e todos os seus pacotes do aparelho

#### Scenario: Integrante perde acesso à banda
- **WHEN** o aplicativo conectado detecta que a participação deixou de estar ativa
- **THEN** o sistema bloqueia e remove os pacotes dessa banda no aparelho

#### Scenario: Show baixado é cancelado
- **WHEN** o aplicativo conectado detecta que um show baixado passou a Cancelado
- **THEN** o sistema bloqueia e remove seu pacote do aparelho

#### Scenario: Aparelho permanece totalmente offline
- **WHEN** a participação ou o estado do show mudou no servidor mas o aparelho ainda não se conectou
- **THEN** o sistema não promete revogação imediata do pacote anteriormente autorizado

### Requirement: Tratamento de pacote inválido
O sistema MUST impedir a execução de um pacote ausente, incompleto ou corrompido.

#### Scenario: Detectar pacote corrompido
- **WHEN** a validação local identifica estrutura incompleta ou conteúdo inválido
- **THEN** o sistema descarta o pacote, bloqueia o modo palco offline e solicita novo download quando houver conexão
