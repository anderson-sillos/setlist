## Purpose

Definir shows, seus estados e a organização de músicas em blocos ordenados para preparação, duplicação, consulta e execução pela banda.

## ADDED Requirements

### Requirement: Cadastro de show
O sistema SHALL permitir que Owner ou Editor crie um show com nome, data, horário, local e observações e SHALL permitir que integrantes consultem esses dados.

#### Scenario: Criar show
- **WHEN** um Owner ou Editor salva os dados obrigatórios de um novo show
- **THEN** o sistema cria o show em Rascunho com um bloco Principal vazio

#### Scenario: Editar show sem permissão
- **WHEN** um Member tenta alterar os dados de um show
- **THEN** o sistema rejeita a operação

### Requirement: Duplicação de show
O sistema SHALL permitir que Owner ou Editor crie um novo Rascunho copiando dados editáveis, blocos, itens, ordem e observações de outro show.

#### Scenario: Duplicar show existente
- **WHEN** um Owner ou Editor solicita a duplicação e informa os dados do novo evento
- **THEN** o sistema cria um show independente em Rascunho sem alterar o show de origem

### Requirement: Setlist organizada em blocos
O sistema SHALL permitir que Owner ou Editor crie, nomeie e reordene blocos e inclua e reordene músicas dentro deles.

#### Scenario: Organizar músicas em blocos
- **WHEN** um Owner ou Editor salva a ordem de blocos e músicas de um Rascunho
- **THEN** o sistema apresenta a setlist nessa ordem para todos os integrantes

#### Scenario: Calcular duração
- **WHEN** a setlist contém músicas com duração estimada
- **THEN** o sistema apresenta a duração de cada bloco e a duração total do show com base nesses valores

### Requirement: Observação específica do item
O sistema SHALL permitir uma observação opcional para cada ocorrência de uma música na setlist sem alterar a música do repertório.

#### Scenario: Adicionar orientação para um show
- **WHEN** um Owner ou Editor registra uma observação em um item da setlist
- **THEN** o sistema mostra a observação na setlist e no modo palco apenas para aquela ocorrência

### Requirement: Estados do show
O sistema SHALL limitar os estados compartilhados a Rascunho, Pronto e Cancelado e MUST NOT alterar o estado ao entrar ou navegar no modo palco.

#### Scenario: Tornar Rascunho Pronto
- **WHEN** um Owner ou Editor confirma a preparação de um show em Rascunho
- **THEN** o sistema altera seu estado para Pronto e o torna somente para leitura

#### Scenario: Reabrir show Pronto
- **WHEN** um Owner ou Editor solicita editar um show Pronto
- **THEN** o sistema exige seu retorno a Rascunho antes de aceitar mudanças

#### Scenario: Cancelar e reabrir show
- **WHEN** um Owner ou Editor cancela um show ou reabre um Cancelado
- **THEN** o sistema usa respectivamente os estados Cancelado ou Rascunho e mantém o conteúdo existente

#### Scenario: Usar modo palco
- **WHEN** um integrante entra ou sai do modo palco
- **THEN** o estado compartilhado do show permanece inalterado

### Requirement: Validação não bloqueante ao tornar Pronto
O sistema SHALL apresentar problemas de letra antes de tornar um show Pronto, mas SHALL permitir a confirmação mesmo com músicas sem letra ou com sincronização incompleta.

#### Scenario: Show contém problemas de letra
- **WHEN** um Owner ou Editor tenta tornar Pronto um show com letras ausentes, estáticas ou incompletas
- **THEN** o sistema mostra uma lista dos problemas e permite confirmar a mudança de estado

### Requirement: Acesso conforme o estado
O sistema SHALL permitir prévia online do modo palco em Rascunho, permitir execução online e download móvel em Pronto e impedir execução e novos downloads em Cancelado.

#### Scenario: Visualizar Rascunho no palco
- **WHEN** um integrante conectado solicita a prévia de um Rascunho
- **THEN** o sistema abre o modo palco online sem oferecer download

#### Scenario: Usar show Pronto
- **WHEN** um integrante solicita o modo palco de um show Pronto
- **THEN** o sistema permite a execução online e, no aplicativo móvel, oferece download

#### Scenario: Tentar executar show Cancelado
- **WHEN** um integrante solicita download ou modo palco de um show Cancelado
- **THEN** o sistema bloqueia a operação e informa que o show foi cancelado

### Requirement: Referência à música vigente
O sistema SHALL manter cada item vinculado à música vigente do repertório, inclusive quando ela for arquivada, sem criar uma versão particular por show.

#### Scenario: Música de uma setlist é alterada
- **WHEN** um Owner ou Editor altera uma música usada por um show
- **THEN** a consulta online do show passa a usar o conteúdo vigente e o estado do show não é alterado

### Requirement: Atualização temporal do show
O sistema SHALL atualizar a data/hora de conteúdo do show quando seus dados, blocos, itens, ordem ou observações forem alterados.

#### Scenario: Alterar a setlist
- **WHEN** um Owner ou Editor conclui uma alteração válida na setlist de um Rascunho
- **THEN** o sistema registra um novo horário de atualização gerado pelo servidor
