# Spec Delta

## Purpose

Define a linguagem visual responsiva do Setlist e o comportamento visual comum dos controles para que música, letra, repertório e setlist tenham hierarquia legível e consistente na Web, Android e iOS.

## ADDED Requirements

### Requirement: Paleta Content-First Darkness
O sistema SHALL usar canvas `#0B0B0D`, base `#121214`, superfície elevada `#1C1C1F`, hover `#28282D`, pressionado `#34343B`, selecionado `#2B203D`, texto principal `#F4F4F5`, secundário `#B8B8C2` e discreto `#92929F` nos papéis semânticos definidos.

#### Scenario: Renderizar superfícies e texto
- **WHEN** uma tela apresenta canvas, conteúdo, agrupamento, texto principal ou metadados
- **THEN** os papéis usam os valores definidos e a hierarquia não depende de azul-marinho ou superfície clara como padrão

### Requirement: Cores de ação, borda e foco
O sistema SHALL usar ação `#B692FF`, ação em hover `#C5AAFF`, ação pressionada `#A37CF0`, foco `#D0B8FF`, borda de controle `#74747F`, borda sutil `#303035`, texto sobre destaque `#160D24` e violeta da marca `#7C3AED` nos papéis correspondentes.

#### Scenario: Exibir controles e identidade
- **WHEN** uma ação, foco, borda de controle ou logo Setlist é apresentado
- **THEN** a cor corresponde ao papel semântico e o violeta escuro da marca não substitui o violeta claro da ação

### Requirement: Sistema visual semântico e legível
O sistema SHALL apresentar superfícies, texto, ações, seleção, foco e estados semânticos com papéis visuais consistentes entre telas e plataformas.

#### Scenario: Ler conteúdo em superfície escura
- **WHEN** uma pessoa abre uma tela, lista, formulário ou popup
- **THEN** texto principal, conteúdo secundário, bordas e ações são distinguíveis pelas funções visuais definidas e mantêm contraste legível

#### Scenario: Reconhecer seleção e foco
- **WHEN** um item é selecionado ou um controle recebe foco por toque, teclado ou tecnologia assistiva
- **THEN** a mudança fica visível sem depender somente de cor e não desloca o conteúdo ao redor

#### Scenario: Usar fonte ampliada
- **WHEN** tamanho de texto ou zoom aumenta
- **THEN** conteúdo e controles podem crescer ou refluem sem cortar rótulos, valores ou ações essenciais

### Requirement: Componentes compartilhados e feedback
O sistema SHALL aplicar geometria e estados de interação consistentes aos botões, campos, itens, chips, menus, popups e feedbacks de vazio, carregamento, erro e sucesso compartilhados.

#### Scenario: Interagir com um controle comum
- **WHEN** uma pessoa pressiona, foca ou desabilita um controle compartilhado
- **THEN** o estado é perceptível e consistente com seu papel e a ação principal da região permanece identificável

#### Scenario: Consultar lista vazia ou sem resultados
- **WHEN** uma consulta não tem itens ou filtros não encontram resultados
- **THEN** a tela explica o estado e oferece uma ação de recuperação pertinente à permissão da pessoa

#### Scenario: Falha em formulário
- **WHEN** uma validação ou operação de gravação falha
- **THEN** a mensagem explica o problema junto ao contexto adequado e o conteúdo digitado continua disponível para correção

### Requirement: Orientação contextual para conteúdo inicial
O sistema SHALL orientar integrantes para a próxima criação útil quando o repertório ou a lista de shows estiver vazio, respeitando as permissões existentes da pessoa.

#### Scenario: Repertório sem músicas cadastradas
- **WHEN** a lista do Repertório está vazia por não haver músicas cadastradas e nenhum filtro ou busca está limitando os resultados
- **THEN** a tela explica que a primeira música pode ser cadastrada e oferece a ação nomeada “Adicionar música”, com ícone indicativo de música, para proprietários e editores
- **AND** integrantes sem permissão de edição recebem orientação para pedir o cadastro a um proprietário ou editor

#### Scenario: Shows sem músicas no repertório
- **WHEN** a lista de Shows está vazia e a banda não tem música ativa no repertório
- **THEN** a tela orienta a cadastrar a primeira música antes de planejar um show
- **AND** proprietários e editores recebem a ação “Adicionar música”, com ícone indicativo de música, que abre o cadastro de música da banda
- **AND** integrantes sem permissão de edição recebem orientação para pedir o cadastro a um proprietário ou editor

#### Scenario: Repertório preenchido e nenhum show cadastrado
- **WHEN** há pelo menos uma música ativa no repertório e nenhum show foi cadastrado, sem busca ou filtros limitando os resultados
- **THEN** a tela orienta a criar o primeiro show e oferece a ação nomeada “Criar primeiro show”, com ícone indicativo de show, para proprietários e editores
- **AND** integrantes sem permissão de edição recebem orientação para pedir o cadastro a um proprietário ou editor

#### Scenario: Criar a primeira banda
- **WHEN** a lista Minhas bandas está vazia e não há uma busca ativa
- **THEN** a ação “Criar banda” aparece com o mesmo ícone de adicionar usado no cabeçalho da tela

#### Scenario: Busca ou filtro sem resultados
- **WHEN** uma busca ou filtro ativo deixa a lista de músicas ou shows sem resultados
- **THEN** a orientação inicial não substitui a mensagem de nenhum resultado e a pessoa pode limpar a busca ou os filtros

### Requirement: Navegação visual e conteúdo responsivo
O sistema SHALL aplicar a mesma hierarquia visual às telas de bandas, repertório, música e letra, shows e setlists, integrantes e convites e conta, adaptando o layout à Web, Android e iOS.

#### Scenario: Consultar repertório ou show
- **WHEN** uma pessoa abre uma lista de músicas ou shows
- **THEN** cada item aparece em card com a mesma borda `subtle` e geometria da lista de bandas, ícone representativo de 40 px em slot de 48, nome e artista/data/status em hierarquia clara, sem ações competindo com o conteúdo principal
- **AND** o status em lista/resumo compacto ocupa um indicador de 24 × 24 px com ícone de 16 × 16 px e mantém o nome completo acessível

#### Scenario: Consultar letra
- **WHEN** uma pessoa lê uma letra em tela pequena ou ampla
- **THEN** texto, blocos e quebras permanecem legíveis, com largura e margens adequadas à leitura

#### Scenario: Alternar apresentação responsiva
- **WHEN** a largura/orientação muda entre celular, tablet e desktop
- **THEN** navegação, lista e ações se reorganizam sem ocultar recursos disponíveis nem alterar as permissões

### Requirement: Iconografia e marca consistentes
O sistema SHALL usar uma família coerente de ícones sem distorção, com alinhamento estável e rótulos para ações ambíguas; o logo Setlist SHALL preservar a nota e a identidade violeta, com cantos arredondados na interface.

#### Scenario: Ação contextual identificada
- **WHEN** uma ação de fechar, excluir, remover vínculo, atualizar, restaurar ou reabrir é apresentada
- **THEN** a figura e o rótulo comunicam a operação correta sem reutilizar um símbolo de significado conflitante

#### Scenario: Ícones do cabeçalho
- **WHEN** o cabeçalho apresenta menu, voltar ou uma ação principal no lado direito
- **THEN** o ícone mede 32 px dentro de um alvo interativo de 48 × 48 px; cancelar mantém ícone de 22–24 px

#### Scenario: Navegação apresentada com ícones
- **WHEN** os destinos de navegação são mostrados na barra inferior, menu lateral ou drawer
- **THEN** os ícones compartilham slot e alinhamento, os rótulos permanecem visíveis e Palco continua representado como item que abre o aviso atual

#### Scenario: Logo apresentado no app
- **WHEN** o logo Setlist é mostrado no login, menu ou cabeçalho
- **THEN** nota, cor e proporção são preservadas e o fundo violeta usa cantos arredondados sem borda adicional

### Requirement: Ações e estados visíveis
O sistema SHALL identificar operações importantes com texto claro, hierarquia visível de ações e feedback ligado ao resultado real da operação.

#### Scenario: Identificar ação principal
- **WHEN** uma região permite criar, editar ou salvar conteúdo
- **THEN** há uma ação principal nomeada e ações secundárias não aparentam ter a mesma prioridade

#### Scenario: Operação em andamento
- **WHEN** atualização, salvamento ou envio está em andamento
- **THEN** a tela indica o estado, evita repetição da operação e não declara sucesso antes da confirmação

#### Scenario: Concluir operação
- **WHEN** uma operação conclui ou falha
- **THEN** a confirmação ou erro permanece perceptível e oferece recuperação quando aplicável

### Requirement: Controles de listas durante a rolagem
O sistema SHALL recolher os controles de filtro e ordenação de Shows e Repertório ao avançar pela lista e exibi-los novamente ao retornar intencionalmente, preservando a busca, a área de rolagem e a posição do conteúdo.

#### Scenario: Percorrer a lista lentamente
- **WHEN** a pessoa rola a lista para baixo com movimentos lentos e pequenas variações
- **THEN** os controles recolhem suavemente sem alternar continuamente nem deslocar a lista, e a busca permanece disponível

#### Scenario: Manter a direção durante a inércia
- **WHEN** uma rolagem rápida continua por inércia após o gesto
- **THEN** os controles mantêm o estado correspondente à direção escolhida, sem alternar por pequenos recuos ou rebotes
- **AND** uma nova rolagem intencional para cima pode exibir os controles antes de a inércia anterior terminar

#### Scenario: Retornar ao topo
- **WHEN** a pessoa retorna ao topo ou consulta uma lista sem espaço para rolagem
- **THEN** os controles ficam disponíveis, respeitando a preferência de redução de movimento
