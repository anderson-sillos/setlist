## Purpose

Definir o repertório compartilhado de cada banda, seus dados essenciais, a fonte única de cada música e o ciclo seguro de arquivamento e restauração.

## ADDED Requirements

### Requirement: Repertório isolado por banda
O sistema SHALL manter cada música vinculada a uma única banda e SHALL disponibilizá-la somente a integrantes ativos dessa banda.

#### Scenario: Integrante consulta o repertório
- **WHEN** um integrante abre o repertório da banda selecionada
- **THEN** o sistema mostra apenas as músicas dessa banda que ele está autorizado a consultar

#### Scenario: Pessoa externa solicita uma música
- **WHEN** uma pessoa sem participação ativa tenta consultar uma música da banda
- **THEN** o sistema nega o acesso

### Requirement: Cadastro e edição online de música
O sistema SHALL permitir que Owner ou Editor crie e altere online uma música com título, artista original, tonalidade, BPM, duração estimada, referência do YouTube, letra estruturada e observações.

#### Scenario: Cadastrar música válida
- **WHEN** um Owner ou Editor autenticado informa os campos obrigatórios e salva uma nova música
- **THEN** o sistema inclui a música no repertório da banda e registra sua última atualização com o horário do servidor

#### Scenario: Tentar editar sem conexão
- **WHEN** uma pessoa tenta criar ou alterar uma música sem conexão com o backend
- **THEN** o sistema mantém o conteúdo somente para leitura e não cria uma edição local pendente

#### Scenario: Pessoa sem permissão tenta editar
- **WHEN** um Member tenta criar ou alterar uma música
- **THEN** o sistema rejeita a operação

### Requirement: Versão única vigente
O sistema SHALL manter uma única versão vigente de cada música, sem expor histórico, arranjos paralelos ou restauração de versões anteriores.

#### Scenario: Atualizar uma música existente
- **WHEN** um Owner ou Editor salva alterações em uma música
- **THEN** o sistema substitui o conteúdo vigente e mantém o mesmo vínculo usado pelos shows

#### Scenario: Consultar histórico inexistente
- **WHEN** um integrante abre os detalhes de uma música
- **THEN** o sistema apresenta somente o conteúdo atual e a identificação de sua última atualização

### Requirement: Conteúdo limitado a letras
O sistema SHALL tratar o texto musical somente como letra e SHALL excluir cifras, transposição e arranjos alternativos do fluxo do MVP.

#### Scenario: Consultar uma música
- **WHEN** um integrante abre uma música do repertório
- **THEN** o sistema apresenta os metadados, a letra e as observações sem controles de cifra ou transposição

### Requirement: Arquivamento seguro
O sistema SHALL arquivar, em vez de excluir, uma música já utilizada por algum show e SHALL permitir sua restauração.

#### Scenario: Arquivar música utilizada
- **WHEN** um Owner ou Editor arquiva uma música presente em uma setlist
- **THEN** o sistema a remove das opções para novas inclusões e a preserva nos shows existentes

#### Scenario: Restaurar música arquivada
- **WHEN** um Owner ou Editor restaura uma música arquivada
- **THEN** o sistema volta a oferecê-la para novas setlists com seu conteúdo vigente

#### Scenario: Consultar show com música arquivada
- **WHEN** um integrante abre um show que referencia uma música arquivada
- **THEN** o sistema mantém a música disponível naquele show

### Requirement: Sinalização de alteração da música
O sistema SHALL registrar no servidor a data/hora de cada alteração relevante da música para permitir que shows e pacotes detectem conteúdo desatualizado.

#### Scenario: Alterar conteúdo usado em show Pronto
- **WHEN** um Owner ou Editor altera uma música utilizada por um show Pronto
- **THEN** o sistema mantém o show Pronto e permite que seus pacotes sejam identificados como desatualizados
