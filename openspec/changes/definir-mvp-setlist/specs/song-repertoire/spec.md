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

### Requirement: Consulta organizada do repertório
O sistema SHALL apresentar as músicas em uma lista vertical rolável e SHALL permitir busca por título ou artista, filtros agrupados e ordenação do repertório.

#### Scenario: Abrir o repertório ativo
- **WHEN** um integrante abre o repertório sem alterar os controles de consulta
- **THEN** o sistema mostra somente músicas ativas, ordenadas por título, com título, artista, duração e estado da letra

#### Scenario: Buscar uma música
- **WHEN** um integrante informa parte do título ou do artista
- **THEN** o sistema mantém na lista somente as músicas correspondentes ao texto informado

#### Scenario: Filtrar músicas pendentes
- **WHEN** um integrante seleciona o filtro `Pendentes`
- **THEN** o sistema mostra músicas Sem letra, com Letra estática ou com Sincronização incompleta

#### Scenario: Filtrar músicas sincronizadas
- **WHEN** um integrante seleciona o filtro `Sincronizadas`
- **THEN** o sistema mostra somente as músicas com sincronização concluída

#### Scenario: Consultar músicas arquivadas
- **WHEN** um integrante seleciona o filtro `Arquivadas`
- **THEN** o sistema separa as músicas arquivadas do repertório ativo

#### Scenario: Alterar a ordenação
- **WHEN** um integrante escolhe uma ordenação diferente
- **THEN** o sistema permite ordenar por título, artista, atualização mais recente ou maior duração

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

### Requirement: Detalhe orientado à letra
O sistema SHALL priorizar a letra na consulta de uma música, SHALL manter todos os seus blocos expandidos em uma rolagem contínua e MUST NOT mostrar os timestamps das linhas fora do editor de sincronização.

#### Scenario: Abrir o detalhe de uma música
- **WHEN** um integrante abre uma música disponível
- **THEN** o sistema apresenta título, artista, duração, estado da letra e atualização relativa antes da letra e mantém tonalidade, BPM e observações como informações secundárias

#### Scenario: Consultar letra estruturada
- **WHEN** uma música possui blocos nomeados
- **THEN** o sistema apresenta todos os blocos expandidos, identificados e na ordem vigente

#### Scenario: Consultar música sincronizada
- **WHEN** um integrante abre uma música Sincronizada fora do editor
- **THEN** o sistema informa o estado Sincronizada sem exibir o tempo individual das linhas

#### Scenario: Abrir referência do YouTube
- **WHEN** uma música possui referência do YouTube e um integrante solicita sua abertura na consulta
- **THEN** o sistema abre o aplicativo ou navegador do YouTube sem armazenar o áudio

#### Scenario: Tentar editar sem conexão
- **WHEN** um Owner ou Editor consulta uma música sem conexão
- **THEN** o sistema mantém a ação de edição visível, porém indisponível com a indicação de que uma conexão é necessária

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
