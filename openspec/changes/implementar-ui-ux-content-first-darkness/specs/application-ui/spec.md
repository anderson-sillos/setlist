# Spec Delta

## Purpose

Define a linguagem visual responsiva do Setlist e o comportamento visual comum dos controles para que música, letra, repertório e setlist tenham hierarquia legível e consistente na Web, Android e iOS.

## ADDED Requirements

### Requirement: Paleta Content-First Darkness
The system SHALL use canvas `#0B0B0D`, base `#121214`, raised `#1C1C1F`, hover `#28282D`, pressed `#34343B`, selected `#2B203D`, primary text `#F4F4F5`, secondary `#B8B8C2` and muted text `#92929F` in their defined semantic roles.

#### Scenario: Renderizar superfícies e texto
- **WHEN** uma tela apresenta canvas, conteúdo, agrupamento, texto principal ou metadados
- **THEN** os papéis usam os valores definidos e a hierarquia não depende de azul-marinho ou superfície clara como padrão

### Requirement: Cores de ação, borda e foco
The system SHALL use action `#B692FF`, action hover `#C5AAFF`, action pressed `#A37CF0`, focus `#D0B8FF`, control border `#74747F`, subtle border `#303035`, text on accent `#160D24` and brand violet `#7C3AED` according to their roles.

#### Scenario: Exibir controles e identidade
- **WHEN** uma ação, foco, borda de controle ou logo Setlist é apresentado
- **THEN** a cor corresponde ao papel semântico e o violeta escuro da marca não substitui o violeta claro da ação

### Requirement: Sistema visual semântico e legível
The system SHALL present surfaces, text, actions, selection, focus and semantic states with consistent visual roles across screens and platforms.

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
The system SHALL apply consistent geometry and interaction states to shared buttons, fields, rows, chips, menus, popups and empty, loading, error and success feedback.

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
The system SHALL guide band members to the next useful creation step when a band's repertoire or show list is empty, while respecting the member's existing permissions.

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
The system SHALL apply the same visual hierarchy to band, repertoire, song and lyric, show and setlist, member and invitation, and account screens, adapting layout to Web, Android and iOS.

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
The system SHALL use a coherent icon family with undistorted symbols, stable alignment and labels for actions whose meaning may be ambiguous; the Setlist logo SHALL preserve its note and violet identity with rounded presentation corners.

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
The system SHALL identify important operations with clear text, a visible action hierarchy and feedback tied to the actual operation result.

#### Scenario: Identificar ação principal
- **WHEN** uma região permite criar, editar ou salvar conteúdo
- **THEN** há uma ação principal nomeada e ações secundárias não aparentam ter a mesma prioridade

#### Scenario: Operação em andamento
- **WHEN** atualização, salvamento ou envio está em andamento
- **THEN** a tela indica o estado, evita repetição da operação e não declara sucesso antes da confirmação

#### Scenario: Concluir operação
- **WHEN** uma operação conclui ou falha
- **THEN** a confirmação ou erro permanece perceptível e oferece recuperação quando aplicável
