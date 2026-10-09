# Spec Delta

## Purpose

Permitir que integrantes organizem músicas do repertório da banda em coleções opcionais, consultem seus vínculos e reutilizem suas músicas na preparação de setlists, mantendo o acesso simples, discreto e coerente com os fluxos existentes.

## ADDED Requirements

### Requirement: Recurso opcional com descoberta discreta

O sistema SHALL oferecer Coleções como ação secundária identificada no Repertório, com hierarquia visual neutra. O uso de coleções MUST NOT ser requisito para cadastrar músicas, criar shows ou montar setlists, nem gerar etapas obrigatórias, avisos de adesão ou novos destinos principais de navegação.

#### Scenario: Usar o app sem criar coleções

- **WHEN** uma banda organiza seu repertório e cria shows sem cadastrar coleções
- **THEN** os fluxos habituais continuam disponíveis e completos
- **AND** o app não apresenta aviso de coleção ausente, convite recorrente ou etapa de configuração de coleções

#### Scenario: Descobrir o recurso no Repertório

- **WHEN** um integrante deseja consultar ou organizar coleções
- **THEN** encontra uma ação secundária nomeada Coleções junto aos controles do Repertório, inclusive antes da primeira coleção
- **AND** a ação preserva contraste e alvo interativo acessíveis sem competir com a ação principal de adicionar música

#### Scenario: Acessar coleções e iniciar a seleção

- **WHEN** uma pessoa abre o botão Coleções ao lado de Filtrar e Ordenar
- **THEN** encontra Ver coleções e, quando pode editar, Selecionar músicas
- **AND** o uso habitual do Repertório mantém Coleções como controle secundário na toolbar

#### Scenario: Encontrar a ação de inclusão durante a seleção

- **WHEN** um proprietário ou editor marca ao menos uma música
- **THEN** Coleções é substituído por Adicionar, que abre diretamente a escolha do destino
- **AND** Adicionar fica indisponível sem músicas marcadas ou se as coleções não puderem ser carregadas
- **AND** o cabeçalho mostra a quantidade, apresenta Cancelar seleção à esquerda e Opções da seleção à direita
- **AND** o menu Opções da seleção reúne Selecionar todos, Limpar seleção e Cancelar seleção
- **AND** Limpar seleção desmarca músicas sem sair do modo, enquanto Cancelar seleção encerra o modo e limpa as escolhas
- **AND** Adicionar, Filtrar e Ordenar permanecem na linha atual da toolbar, sem criar uma faixa adicional

#### Scenario: Usar ações de uma música sem alterar o toque habitual

- **WHEN** uma pessoa toca nos três pontos verticais de uma música do Repertório
- **THEN** abre um menu com Ver detalhes e, quando pode editar, Selecionar, Editar música e Organizar em coleções
- **AND** tocar nas demais áreas do cartão continua abrindo os detalhes fora do modo de seleção
- **AND** uma ação que abre outro diálogo aguarda o fechamento do menu, incluindo sua conclusão nativa no iOS

#### Scenario: Selecionar uma música pelas ações individuais

- **WHEN** um proprietário ou editor escolhe Selecionar no menu de uma música
- **THEN** o Repertório ativa o modo de seleção e marca essa música imediatamente
- **AND** músicas que já estavam selecionadas continuam marcadas

#### Scenario: Restringir seleção aos papéis de edição

- **WHEN** um integrante sem papel de proprietário ou editor abre as ações da música ou mantém seu cartão pressionado
- **THEN** não encontra a ação Selecionar e o gesto não ativa o modo de seleção

#### Scenario: Iniciar a seleção mantendo um cartão pressionado

- **WHEN** um proprietário ou editor mantém pressionado o cartão de uma música fora do modo de seleção
- **THEN** o Repertório ativa o modo de seleção e marca essa música imediatamente
- **AND** soltar o cartão não abre os detalhes nem remove a marcação inicial

#### Scenario: Manter os controles visíveis durante a seleção

- **WHEN** uma pessoa rola a lista enquanto o modo de seleção está ativo
- **THEN** Coleções, Filtrar e Ordenar permanecem visíveis
- **AND** ao cancelar a seleção, a ocultação automática volta a responder à rolagem normalmente

### Requirement: Coleções compartilhadas e isoladas por banda

O sistema SHALL vincular cada coleção a uma única banda e permitir consulta somente a seus integrantes ativos. Proprietários e editores SHALL poder gerenciar coleções e vínculos; o serviço SHALL negar gravações a integrantes sem esse papel, pessoas externas e contas suspensas.

#### Scenario: Consultar coleções da banda

- **WHEN** um integrante ativo abre Coleções da banda selecionada
- **THEN** consulta somente as coleções e músicas que está autorizado a acessar naquela banda

#### Scenario: Gerenciar sem permissão

- **WHEN** um integrante sem papel de proprietário ou editor tenta criar, alterar, excluir ou modificar os vínculos de uma coleção
- **THEN** o serviço rejeita a operação e preserva os dados existentes

#### Scenario: Usar um identificador de outra banda

- **WHEN** uma requisição tenta associar uma música ou uma coleção pertencente a outra banda
- **THEN** o serviço rejeita a operação inteira

#### Scenario: Usar uma conta suspensa

- **WHEN** uma conta suspensa usa uma sessão ainda emitida para consultar ou alterar coleções
- **THEN** o serviço nega o acesso e a alteração

### Requirement: Músicas vinculadas em ordem própria

O sistema SHALL manter músicas de uma coleção como referências únicas ao repertório da mesma banda, em ordem própria. Uma música SHALL poder participar de várias coleções; sua inclusão em uma coleção MUST NOT criar uma cópia de seu cadastro, letra ou metadados.

#### Scenario: Participar de várias coleções

- **WHEN** a mesma música é incluída em Festa e Acústico
- **THEN** ambas as coleções referenciam o mesmo cadastro da música
- **AND** a música pode ser removida de uma coleção sem perder a participação na outra

#### Scenario: Acrescentar música já presente na coleção

- **WHEN** uma pessoa acrescenta à coleção uma música que já pertence a ela
- **THEN** a música mantém uma única participação e sua posição existente

#### Scenario: Atualizar o cadastro da música

- **WHEN** uma música pertencente a coleções tem seu título, artista ou duração alterado
- **THEN** as consultas das coleções usam os valores vigentes da música

### Requirement: Cadastro e administração de coleções

O sistema SHALL permitir criar, renomear, editar e excluir coleções com salvamento explícito, nome não vazio de até 120 caracteres e nome único na banda após ignorar diferenças de caixa e espaços nas extremidades. A criação SHALL pedir somente o nome, mantendo as músicas previamente escolhidas no Repertório quando existirem. A inclusão de novas músicas SHALL utilizar a seleção e as ações do Repertório. Coleções SHALL poder ser salvas vazias; exclusão SHALL exigir confirmação e preservar músicas e shows.

#### Scenario: Criar uma coleção válida

- **WHEN** um proprietário ou editor salva uma coleção com nome válido e músicas autorizadas
- **THEN** o serviço registra a coleção, seus vínculos e sua ordem, informando sucesso após a confirmação da gravação

#### Scenario: Criar sem duplicar a seleção de músicas

- **WHEN** uma pessoa abre Criar coleção
- **THEN** encontra o campo de nome e as ações de salvar/cancelar, sem busca, filtros ou lista de músicas
- **AND** quando veio de Nova coleção em um dos diálogos de organização, vê somente a contagem das músicas que serão incluídas ao salvar

#### Scenario: Apresentar nova coleção em uma janela de edição

- **WHEN** um proprietário ou editor inicia a criação de uma coleção
- **THEN** o formulário abre em uma janela modal centralizada sobre a tela de origem, em vez de ocupar a tela inteira
- **AND** a janela preserva o nome, a contagem de músicas selecionadas, o salvamento explícito e a proteção contra descarte
- **AND** fechar ou cancelar retorna ao contexto que abriu a janela

#### Scenario: Criar coleção a partir das coleções da música

- **WHEN** um proprietário ou editor escolhe Nova coleção em Coleções da música
- **THEN** abre a criação somente com o campo de nome e a música atual previamente escolhida
- **AND** mudanças pendentes nas participações existentes pedem confirmação antes de sair

#### Scenario: Criar coleção a partir da inclusão em coleção

- **WHEN** um proprietário ou editor escolhe Nova coleção em Adicionar a uma coleção
- **THEN** abre a criação somente com o campo de nome e todas as músicas selecionadas previamente escolhidas
- **AND** a ação também fica disponível quando a banda ainda não tem coleções
- **AND** nenhuma participação existente é alterada antes de salvar a nova coleção

#### Scenario: Incluir músicas numa coleção vazia

- **WHEN** uma pessoa aciona Adicionar músicas no detalhe de uma coleção vazia
- **THEN** abre o Repertório em modo de seleção, sem restrição de resultados à coleção vazia
- **AND** a confirmação de inclusão identifica essa coleção como destino inicialmente escolhido
- **AND** após confirmar, o editor da coleção abre com os dados atualizados

#### Scenario: Nome inválido ou duplicado

- **WHEN** uma pessoa envia um nome vazio, maior que 120 caracteres ou equivalente a outro nome da banda
- **THEN** recebe uma mensagem junto ao campo e mantém o preenchimento para correção

#### Scenario: Salvar uma coleção vazia

- **WHEN** uma pessoa salva uma coleção com nome válido e sem músicas
- **THEN** a coleção fica disponível na área de Coleções com quantidade zero
- **AND** a orientação para adicionar músicas aparece somente ao consultar essa coleção

#### Scenario: Excluir uma coleção

- **WHEN** um proprietário ou editor confirma a exclusão de uma coleção
- **THEN** são removidos somente a coleção e seus vínculos
- **AND** as músicas do repertório e os itens dos shows existentes permanecem preservados

### Requirement: Consulta e revisão de uma coleção

O sistema SHALL apresentar nome, quantidade de músicas consultáveis e duração estimada na lista de Coleções. Ao consultar uma coleção, SHALL mostrar suas músicas na ordem salva e permitir que quem pode editar reordene ou remova participações sem excluir as músicas do repertório.

#### Scenario: Abrir uma coleção

- **WHEN** um integrante abre uma coleção disponível
- **THEN** visualiza suas músicas na ordem salva, com título, artista e indicação de arquivamento quando aplicável

#### Scenario: Reordenar músicas

- **WHEN** um proprietário ou editor muda a ordem e salva a coleção
- **THEN** a ordem salva fica disponível para consulta e inclusão futura no setlist
- **AND** cada linha coloca a ação de remover à esquerda e a alça de arraste à direita
- **AND** a linha não apresenta botões separados de subir e descer

#### Scenario: Mostrar a prévia durante o arraste

- **WHEN** um proprietário ou editor arrasta uma música pela alça
- **THEN** uma prévia flutuante com o ícone de música e o título acompanha o gesto
- **AND** a linha original permanece destacada até o gesto terminar
- **AND** a alça recebe o destaque visual usado no editor de setlist
- **AND** a ação de remover usa uma lixeira de 17 px, com o tamanho do alvo e os estados de foco/pressionado do editor de setlist

#### Scenario: Consultar duração não informada

- **WHEN** nenhuma música consultável da coleção possui duração informada
- **THEN** a duração é apresentada como não informada
- **AND** quando houver durações, o total soma somente os valores informados

### Requirement: Edição direta e retorno contextual da coleção

O sistema SHALL abrir diretamente a edição ao selecionar uma coleção para proprietários e editores, sem exigir uma etapa separada de detalhe. Integrantes sem permissão de edição SHALL continuar podendo consultar a mesma coleção em modo somente leitura. Após criação ou inclusão em lote confirmada, SHALL abrir a edição da coleção afetada. Salvar ou cancelar SHALL retornar ao contexto de origem; cancelamento SHALL descartar somente mudanças ainda não salvas no editor, preservando a coleção recém-criada e inclusões já confirmadas.

#### Scenario: Abrir coleção para edição

- **WHEN** um proprietário ou editor toca em um cartão na lista de Coleções
- **THEN** o editor da coleção abre diretamente
- **AND** salvar ou cancelar retorna à lista de Coleções

#### Scenario: Apresentar as ações do editor da coleção

- **WHEN** um proprietário ou editor abre uma coleção existente
- **THEN** o cabeçalho apresenta Voltar à esquerda e Excluir à direita
- **AND** excluir abre a confirmação existente, sem um bloco de exclusão dentro do formulário
- **AND** quando não há alterações pendentes, o rodapé apresenta somente Fechar
- **AND** quando há alterações pendentes, o rodapé apresenta Cancelar e Salvar
- **AND** a lista não apresenta um título com a contagem de músicas
- **AND** a ação de inclusão é identificada como Adicionar músicas

#### Scenario: Consultar coleção sem permissão de edição

- **WHEN** um integrante sem papel de proprietário ou editor toca em um cartão na lista de Coleções
- **THEN** consulta as músicas na ordem salva em modo somente leitura
- **AND** não vê controles de edição

#### Scenario: Editar após criar uma coleção

- **WHEN** a criação de uma coleção é salva com sucesso
- **THEN** o editor da coleção recém-criada abre imediatamente
- **AND** cancelar essa edição mantém a coleção e suas músicas iniciais salvas, descartando somente mudanças feitas no editor depois da criação
- **AND** salvar ou cancelar retorna ao contexto que iniciou a criação

#### Scenario: Editar após incluir músicas em lote

- **WHEN** músicas são adicionadas com sucesso a uma coleção pelo seletor do Repertório
- **THEN** a seleção termina e o editor da coleção de destino abre para revisar e ordenar suas músicas
- **AND** salvar ou cancelar retorna ao Repertório
- **AND** cancelar mantém as inclusões que já foram confirmadas antes de abrir o editor

#### Scenario: Retomar a edição após adicionar músicas pelo editor

- **WHEN** a pessoa inicia Adicionar músicas durante a edição de uma coleção e confirma a inclusão em lote
- **THEN** o editor da coleção escolhida abre novamente com os dados atualizados

#### Scenario: Cancelar sem salvar a criação

- **WHEN** a pessoa cancela o formulário de nome antes de salvar uma nova coleção
- **THEN** nenhuma coleção é criada e o app retorna ao contexto de origem

### Requirement: Escolha múltipla com busca e filtros

O sistema SHALL oferecer busca por título ou artista, filtros Todas, Pendentes, Sincronizadas e Arquivadas e ordenação ao escolher músicas para uma coleção. Marcações SHALL persistir ao mudar a consulta; filtros e ordenação de consulta MUST NOT alterar automaticamente a composição ou a ordem de uma coleção salva.

#### Scenario: Continuar escolhendo após mudar a consulta

- **WHEN** uma pessoa marca músicas, muda a busca ou os filtros e marca outras
- **THEN** todas as músicas escolhidas permanecem marcadas, inclusive as temporariamente fora dos resultados
- **AND** a contagem total e a revisão das escolhidas permanecem disponíveis

#### Scenario: Selecionar todos os resultados visíveis

- **WHEN** uma pessoa aciona Selecionar todos
- **THEN** são acrescentadas somente as músicas dos resultados atuais, sem repetir músicas já marcadas
- **AND** o controle não seleciona músicas ocultas pela busca ou pelos filtros

#### Scenario: Desfazer escolhas e confirmar inclusão

- **WHEN** uma pessoa revisa, desmarca músicas e confirma a escolha
- **THEN** somente as músicas que permanecem escolhidas são acrescentadas à edição local da coleção
- **AND** a confirmação explicita a quantidade incluída

### Requirement: Organização a partir do Repertório

O sistema SHALL permitir a proprietários e editores ativar explicitamente um modo de escolha múltipla no Repertório para criar uma coleção ou acrescentar músicas a uma existente. O modo SHALL preservar critérios da consulta, manter quantidade e ações acessíveis e permitir cancelamento antes de gravar.

#### Scenario: Criar coleção a partir de músicas escolhidas

- **WHEN** uma pessoa escolhe músicas no Repertório, aciona Adicionar e escolhe Nova coleção
- **THEN** abre a criação para informar somente o nome e salvar com as músicas previamente escolhidas, preservando sua ordem

#### Scenario: Acrescentar a uma coleção existente

- **WHEN** uma pessoa confirma a inclusão das escolhidas em uma coleção existente
- **THEN** as músicas que ainda não pertencem a ela são acrescentadas ao final, preservando a ordem anterior
- **AND** a operação não remove participações de outras músicas
- **AND** após o sucesso, o seletor fecha, o modo de seleção termina e uma confirmação temporária informa a quantidade e o nome da coleção
- **AND** após uma falha, o seletor permanece aberto e as músicas continuam marcadas para nova tentativa

#### Scenario: Encerrar o modo de escolha

- **WHEN** uma pessoa aciona Cancelar seleção à esquerda do cabeçalho ou no menu Opções da seleção antes de gravar
- **THEN** a consulta volta ao comportamento habitual de abrir o detalhe ao tocar em uma música
- **AND** as músicas marcadas são removidas da seleção local
- **AND** nenhum vínculo de coleção é alterado

#### Scenario: Abrir a letra pelas ações da música

- **WHEN** uma pessoa abre o menu de ações de uma música que tem letra disponível
- **THEN** encontra a ação Exibir letra, que abre a letra em tela cheia
- **AND** músicas sem letra não apresentam essa ação

#### Scenario: Abrir a letra com clique duplo na Web

- **WHEN** uma pessoa dá um clique duplo no card de uma música com letra disponível no Repertório Web
- **THEN** a letra abre em tela cheia
- **AND** um clique simples continua abrindo os detalhes da música
- **AND** nas plataformas nativas o toque simples permanece imediato e o menu mantém o atalho para a letra

### Requirement: Filtro de coleção combinado no Repertório

Quando houver coleções na banda, o sistema SHALL oferecer no painel Filtrar uma dimensão de coleção com Todas as coleções, Sem coleção e uma coleção específica por vez, combinada por interseção com a busca e os filtros atuais. Todas as coleções SHALL incluir também músicas sem vínculo.

#### Scenario: Combinar coleção e status da letra

- **WHEN** um integrante escolhe Festa e Sincronizadas
- **THEN** o Repertório mostra somente músicas sincronizadas da coleção Festa que correspondem à busca atual
- **AND** cada música aparece uma única vez e a ordenação atual da lista é respeitada

#### Scenario: Consultar músicas sem coleção

- **WHEN** um integrante escolhe Sem coleção
- **THEN** o Repertório mostra somente músicas sem participação em qualquer coleção da banda e que atendem aos demais critérios

#### Scenario: Remover a restrição de coleção

- **WHEN** um integrante escolhe Todas as coleções
- **THEN** a consulta aplica somente os demais critérios, incluindo músicas com e sem coleção

#### Scenario: Banda sem coleções

- **WHEN** a banda não tem nenhuma coleção cadastrada
- **THEN** o painel Filtrar apresenta os filtros habituais sem acrescentar uma dimensão de coleção vazia

#### Scenario: Coleção filtrada foi excluída

- **WHEN** uma atualização confirma que a coleção usada como filtro não existe mais
- **THEN** o critério de coleção retorna a Todas as coleções, preservando os demais critérios
- **AND** o app informa discretamente que aquele filtro deixou de estar disponível

### Requirement: Participações no detalhe da música

O sistema SHALL mostrar as coleções de uma música como etiquetas nomeadas e clicáveis no card de informações, abaixo de Tom e BPM, quando houver vínculos. Cada etiqueta SHALL abrir o Repertório filtrado pela coleção; gerenciamento SHALL ser uma ação secundária disponível a proprietários e editores.

#### Scenario: Música participa de coleções

- **WHEN** um integrante consulta uma música vinculada a Festa e Acústico
- **THEN** os dois nomes ficam disponíveis em etiquetas que podem ocupar várias linhas
- **AND** tocar em um nome abre o Repertório com a coleção correspondente identificada no filtro

#### Scenario: Música sem coleções

- **WHEN** um integrante consulta uma música sem vínculos de coleção
- **THEN** o detalhe não apresenta seção vazia, aviso ou convite para usar Coleções
- **AND** quem pode editar continua encontrando o gerenciamento como ação secundária

#### Scenario: Gerenciar várias participações

- **WHEN** um proprietário ou editor confirma as coleções marcadas para uma música
- **THEN** os vínculos daquela música são atualizados em conjunto
- **AND** participações e posições de outras músicas nessas coleções são preservadas

### Requirement: Inclusão de coleção no setlist

Quando houver coleções, o sistema SHALL oferecer Adicionar coleção no editor de setlist e permitir que proprietários e editores incluam suas músicas disponíveis em um show Rascunho. Antes da confirmação, SHALL mostrar bloco de destino, quantidade e duração estimada das músicas elegíveis; a inclusão SHALL ocorrer ao final do bloco ativo, na ordem da coleção.

#### Scenario: Incluir uma coleção

- **WHEN** uma pessoa confirma a inclusão de uma coleção com músicas elegíveis
- **THEN** todas essas músicas são acrescentadas de uma vez ao final do bloco ativo, na ordem salva da coleção
- **AND** cada inclusão vira uma ocorrência normal de música na edição local do setlist, sujeita ao salvamento explícito do editor

#### Scenario: Música da coleção já está no show

- **WHEN** a coleção possui uma música já usada no show
- **THEN** a prévia informa a repetição e a inclusão continua permitida, criando uma nova ocorrência
- **AND** o sistema não remove nem altera a ocorrência anterior

#### Scenario: Algumas músicas estão arquivadas ou indisponíveis

- **WHEN** a coleção contém músicas que não podem ser incluídas em novos setlists
- **THEN** a prévia calcula a inclusão somente das músicas elegíveis e informa que há itens não incluíveis
- **AND** conteúdo oculto ou não autorizado não é revelado pela prévia

#### Scenario: Nenhuma música pode ser incluída

- **WHEN** a coleção está vazia ou não possui música elegível
- **THEN** a confirmação fica indisponível com explicação contextual, preservando o setlist

#### Scenario: Banda sem coleções no editor de setlist

- **WHEN** uma pessoa abre as opções de inclusão e a banda não tem coleções
- **THEN** as opções habituais aparecem sem uma ação vazia de Adicionar coleção

#### Scenario: Acesso ou disponibilidade mudou antes da inclusão

- **WHEN** a prévia deixa de ser válida por mudança de acesso, exclusão da coleção ou indisponibilidade das músicas
- **THEN** o sistema revalida a operação e atualiza a prévia ou apresenta erro recuperável
- **AND** nenhum conjunto parcial de novos itens é acrescentado silenciosamente

### Requirement: Independência dos shows após a inclusão

O sistema SHALL manter a composição e a ordem dos itens incluídos em um show independentes da coleção de origem, preservando as referências às músicas vigentes do repertório.

#### Scenario: Alterar ou excluir coleção já utilizada

- **WHEN** uma coleção usada na montagem de um show é reordenada, recebe ou perde músicas ou é excluída
- **THEN** a composição e a ordem daquele show permanecem como foram salvas

#### Scenario: Alterar música usada no show

- **WHEN** o cadastro de uma música incluída por uma coleção é atualizado
- **THEN** o show usa o cadastro vigente conforme as regras habituais das músicas do repertório

### Requirement: Ciclo de vida das músicas nas coleções

O sistema SHALL preservar vínculos de músicas arquivadas para permitir consulta e restauração, mantendo-as inelegíveis para inclusão em novos setlists. A exclusão definitiva autorizada de uma música SHALL remover seus vínculos de coleção sem excluir a coleção nem tornar seus demais itens indisponíveis.

#### Scenario: Arquivar e restaurar uma música

- **WHEN** uma música de coleção é arquivada e depois restaurada
- **THEN** sua participação e sua ordem na coleção permanecem preservadas
- **AND** ela volta a ficar elegível para futuras inclusões no show após a restauração

#### Scenario: Organizar músicas arquivadas

- **WHEN** uma pessoa usa o filtro Arquivadas durante a escolha de músicas para uma coleção
- **THEN** pode consultar e vincular as músicas arquivadas autorizadas, com sua condição identificada
- **AND** esses vínculos não tornam as músicas elegíveis para novos setlists

#### Scenario: Excluir definitivamente uma música

- **WHEN** a regra vigente permite excluir definitivamente uma música
- **THEN** suas participações em coleções são removidas e as demais músicas mantêm sua ordem relativa
- **AND** participar de uma coleção não impõe uma nova regra de arquivamento à música

#### Scenario: Ocultar uma música por moderação

- **WHEN** uma música é ocultada pelo serviço
- **THEN** ela não fornece conteúdo por consultas, vínculos, contagens ou prévias de coleção
- **AND** os vínculos não permitem contornar as regras vigentes de acesso

### Requirement: Salvamento consistente e proteção da edição

O sistema SHALL salvar nome, músicas e ordem de uma coleção como uma única operação, preservar edições após falha e impedir envios duplicados. Editores de coleção e de participações SHALL usar a proteção compartilhada de alterações não salvas; o salvamento confirmado SHALL permitir saída sem novo aviso de descarte.

#### Scenario: Falhar durante a gravação

- **WHEN** a gravação da coleção ou de participações falha
- **THEN** o conjunto previamente salvo permanece íntegro e o preenchimento local continua disponível para nova tentativa

#### Scenario: Sair com alterações locais

- **WHEN** uma pessoa tenta sair de uma edição alterada por botão, fechamento ou retorno da plataforma
- **THEN** recebe a decisão padrão entre continuar editando e descartar, acima do editor e corretamente posicionada

#### Scenario: Concluir o salvamento

- **WHEN** o serviço confirma a gravação
- **THEN** os dados confirmados são apresentados e a saída autorizada não abre o aviso de descarte

### Requirement: Atualização e contexto de navegação

O sistema SHALL manter Coleções subordinadas ao Repertório, preservar contexto de consulta por banda e permitir atualização manual dos dados visíveis. Falhas de atualização SHALL preservar os últimos dados disponíveis; edição e inclusão em lote SHALL exigir conexão e acesso vigentes.

#### Scenario: Retornar de uma coleção ou música

- **WHEN** uma pessoa retorna de uma consulta ao Repertório
- **THEN** encontra os critérios e o contexto válidos da banda, incluindo o filtro de coleção
- **AND** um acesso direto a uma rota de coleção oferece retorno contextual ao Repertório da mesma banda

#### Scenario: Outra pessoa altera a coleção

- **WHEN** um integrante atualiza a lista, o detalhe ou o filtro que depende da coleção
- **THEN** recebe os vínculos vigentes sem buscar novamente dados de bandas ou áreas não relacionadas

#### Scenario: Tentar editar sem conexão

- **WHEN** uma pessoa tenta salvar coleções ou incluir uma coleção no setlist sem conexão
- **THEN** o app indica a necessidade de conexão e preserva os dados locais em edição para recuperação
- **AND** não cria uma fila de gravações offline

### Requirement: Interface consistente nas três plataformas

O sistema SHALL apresentar os fluxos de Coleções na Web, Android e iOS usando os componentes e a hierarquia visual existentes, com foco, rótulos, marcações e controles acessíveis, respeitando áreas seguras e a preferência de redução de movimento.

#### Scenario: Operar com teclado ou leitor de tela

- **WHEN** uma pessoa consulta, escolhe, reordena ou gerencia músicas com teclado ou tecnologia assistiva
- **THEN** identifica as ações e marcações e consegue completar a operação sem depender de gesto de arraste ou pressão longa

#### Scenario: Consultar em tela compacta

- **WHEN** o recurso é usado em celular, com teclado aberto ou texto ampliado
- **THEN** os nomes, contagens, controles e ações continuam acessíveis, sem ocupar áreas reservadas ou encobrir confirmações
