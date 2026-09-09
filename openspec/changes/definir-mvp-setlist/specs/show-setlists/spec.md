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
O sistema SHALL permitir que Owner ou Editor crie um novo Rascunho copiando dados editáveis, blocos, músicas, anotações de planejamento, separadores, ordem e observações de outro show.

#### Scenario: Duplicar show existente
- **WHEN** um Owner ou Editor solicita a duplicação e informa os dados do novo evento
- **THEN** o sistema cria um show independente em Rascunho sem alterar o show de origem

### Requirement: Setlist organizada em blocos
O sistema SHALL permitir que Owner ou Editor crie, nomeie e reordene blocos e inclua itens ordenados de música, anotação de planejamento ou separador dentro deles.

#### Scenario: Organizar músicas em blocos
- **WHEN** um Owner ou Editor salva a ordem de blocos e itens de um Rascunho
- **THEN** o sistema apresenta a setlist nessa ordem para todos os integrantes

#### Scenario: Calcular duração
- **WHEN** a setlist contém músicas ou anotações de planejamento com duração estimada
- **THEN** o sistema apresenta a duração de cada bloco e a duração total do show somando somente os valores informados, sem aviso de duração parcial

### Requirement: Planejamento temporal da setlist
O sistema SHALL permitir várias anotações de planejamento independentes entre as músicas, com descrição livre e duração opcional, e SHALL permitir separadores exclusivamente visuais sem descrição ou duração.

#### Scenario: Adicionar anotações de planejamento
- **WHEN** um Owner ou Editor inclui várias anotações em um bloco
- **THEN** o sistema preserva a ordem de cada anotação, diferencia-as visualmente das músicas e soma as durações informadas ao planejamento do bloco e do show

#### Scenario: Adicionar separador
- **WHEN** um Owner ou Editor inclui um separador na setlist
- **THEN** o sistema mostra uma linha divisória reordenável que não participa do cálculo de duração

#### Scenario: Consultar a composição da duração
- **WHEN** um integrante abre os detalhes de um show com tempos informados
- **THEN** o sistema apresenta a duração estimada total e sua composição entre músicas e planejamento

#### Scenario: Nenhum item possui duração
- **WHEN** um show não possui duração informada em nenhuma música ou anotação
- **THEN** o sistema mostra `Duração não informada` nos detalhes e um traço na lista de shows

#### Scenario: Abrir o modo palco
- **WHEN** um integrante inicia o modo palco de um show com anotações de planejamento ou separadores
- **THEN** o sistema não os transforma em etapas nem cria cronômetros para esses itens

### Requirement: Edição eficiente da setlist
O sistema SHALL oferecer uma única ação de inclusão para blocos, músicas, anotações e separadores, SHALL permitir seleção múltipla de músicas e SHALL permitir reordenar blocos e itens antes de um salvamento explícito.

#### Scenario: Incluir várias músicas
- **WHEN** um Owner ou Editor seleciona várias músicas para um bloco
- **THEN** o sistema inclui todas ao final do bloco sem impedir que uma música já usada no show seja adicionada novamente

#### Scenario: Reordenar a setlist
- **WHEN** um Owner ou Editor arrasta um bloco ou um item durante a edição
- **THEN** o sistema permite reordenar os blocos e mover itens dentro do bloco ou entre blocos, recalculando as durações apresentadas

#### Scenario: Salvar alterações da setlist
- **WHEN** um Owner ou Editor confirma o salvamento após realizar uma ou mais alterações locais
- **THEN** o sistema persiste o conjunto das alterações e atualiza o horário de conteúdo do show

#### Scenario: Sair com alterações pendentes
- **WHEN** um Owner ou Editor tenta sair da edição sem salvar
- **THEN** o sistema solicita confirmação antes de descartar as alterações locais

### Requirement: Observação específica do item
O sistema SHALL permitir uma observação opcional para cada ocorrência de uma música na setlist sem alterar a música do repertório.

#### Scenario: Adicionar orientação para um show
- **WHEN** um Owner ou Editor registra uma observação em um item da setlist
- **THEN** o sistema mostra a observação na setlist e no modo palco apenas para aquela ocorrência

### Requirement: Consulta organizada de shows
O sistema SHALL apresentar os shows em uma lista vertical rolável com busca por nome ou local, filtros por período e estado e ordenação por data, nome ou duração.

#### Scenario: Abrir a lista de shows
- **WHEN** um integrante abre Shows sem alterar os controles de consulta
- **THEN** o sistema mostra os próximos shows em Rascunho ou Pronto, ordenados pela data mais próxima, com a duração estimada de cada evento

#### Scenario: Consultar outros shows
- **WHEN** um integrante altera o período, estado ou ordenação
- **THEN** o sistema permite consultar shows passados, todos os períodos, Cancelados, nome, data mais distante ou maior duração

#### Scenario: Buscar show
- **WHEN** um integrante informa parte do nome do show ou do local
- **THEN** o sistema mantém na lista somente os shows correspondentes

### Requirement: Calendário mensal de shows
O sistema SHALL oferecer dentro de Shows uma visualização mensal das datas com eventos, sem integração com calendários externos, e SHALL calcular localmente os feriados nacionais do Brasil.

#### Scenario: Abrir o calendário
- **WHEN** um integrante alterna de Lista para Calendário
- **THEN** o sistema mostra o mês atual, inicia a semana no domingo, destaca e seleciona o dia de hoje e mantém Shows como área ativa da navegação

#### Scenario: Consultar um dia
- **WHEN** um integrante seleciona uma data
- **THEN** o sistema apresenta abaixo do calendário os shows do dia com horário, nome, local, estado e duração

#### Scenario: Dia com vários shows
- **WHEN** uma data possui mais de um show visível
- **THEN** o sistema apresenta no calendário um marcador com a quantidade de shows

#### Scenario: Consultar estados no calendário
- **WHEN** o calendário é aberto sem filtro adicional
- **THEN** o sistema mostra Rascunhos e Prontos do mês e mantém Cancelados ocultos até que sejam incluídos pelo filtro

#### Scenario: Diferenciar dias especiais
- **WHEN** o calendário apresenta sábados, domingos ou um feriado nacional
- **THEN** o sistema diferencia os finais de semana visualmente e identifica o feriado por marcador e nome sem depender apenas de cor

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
