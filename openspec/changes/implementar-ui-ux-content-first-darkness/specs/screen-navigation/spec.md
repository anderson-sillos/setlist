# Spec Delta

## Purpose

Define como as pessoas avançam e retornam entre áreas e telas do Setlist, preservam seu contexto de trabalho e entendem as transições sem perder edição nem conflitar com acessibilidade ou gestos do sistema.

## ADDED Requirements

### Requirement: Retorno previsível entre telas
The system SHALL provide a predictable back path on Web, Android and iOS, preserving valid route history and giving a contextual return action when a screen has no prior in-app destination.

#### Scenario: Abrir detalhe a partir de uma lista
- **WHEN** uma pessoa abre o detalhe de uma música ou show e retorna
- **THEN** volta à lista de origem e encontra os controles e contexto previamente usados

#### Scenario: Acessar detalhe por link direto
- **WHEN** uma pessoa abre uma rota interna sem histórico navegável
- **THEN** o cabeçalho oferece retorno contextual para uma área válida e autorizada

#### Scenario: Voltar com uma camada aberta
- **WHEN** drawer, menu modal ou popup está aberto e a pessoa usa Voltar
- **THEN** a camada superior é encerrada antes de navegar para fora da tela

### Requirement: Preservação do estado da navegação
The system SHALL preserve valid search, filters, scroll position and last usable route separately for each band and section when switching areas and returning to lists.

#### Scenario: Retornar à lista de repertório
- **WHEN** a pessoa retorna de detalhe ou letra para o repertório
- **THEN** busca, filtros e posição anteriores são restaurados sem iniciar consulta não necessária

#### Scenario: Alternar áreas da banda
- **WHEN** a pessoa navega entre Repertório, Shows e Banda e volta a uma área anterior
- **THEN** a área reaparece no último estado válido dela e da banda selecionada

#### Scenario: Contexto tornou-se inválido
- **WHEN** a pessoa perde acesso à banda ou sua sessão termina
- **THEN** conteúdo preservado não é mostrado como acessível e o fluxo volta para uma área autorizada

### Requirement: Transições coerentes entre rotas
The system SHALL use brief transitions that communicate whether a route is entering, leaving or switching context while keeping content stable and operations independent of animation completion.

#### Scenario: Entrar e retornar de um detalhe
- **WHEN** uma pessoa abre um detalhe e usa retorno pelo botão ou gesto da plataforma
- **THEN** a transição respeita a plataforma e o retorno interativo pode ser cancelado sem alterar a rota ou o conteúdo ativo

#### Scenario: Trocar a seção ativa
- **WHEN** a pessoa muda de área da banda por controle de navegação
- **THEN** conteúdo, rótulo e seção selecionada mudam juntos sem aparentar que uma tela de detalhe foi empilhada

#### Scenario: Operação termina durante a transição
- **WHEN** navegação ou gravação prossegue enquanto a transição visual está acontecendo
- **THEN** o resultado funcional não aguarda a animação e o estado final exibido corresponde ao resultado real

### Requirement: Proteção de alterações não salvas
The system SHALL ask for an explicit discard decision before leaving an editor with unsaved changes by any in-app or platform back path.

#### Scenario: Tentar sair de edição alterada
- **WHEN** a pessoa tenta voltar, trocar área, fechar o editor ou usar o gesto de retorno após editar conteúdo
- **THEN** o sistema oferece continuar editando ou descartar as alterações antes de navegar

#### Scenario: Continuar editando
- **WHEN** a pessoa escolhe continuar editando no aviso de descarte
- **THEN** o editor e todos os valores não salvos permanecem inalterados

#### Scenario: Confirmar descarte
- **WHEN** a pessoa confirma descarte
- **THEN** o sistema deixa o editor e descarta apenas as alterações locais daquela edição

#### Scenario: Salvamento em andamento
- **WHEN** uma gravação está em andamento e a pessoa tenta enviar novamente ou sair
- **THEN** envio duplicado é impedido e os valores permanecem disponíveis até resposta ou decisão segura do fluxo

### Requirement: Gestos complementares e sem conflito
The system SHALL preserve platform/browser navigation gestures and provide a visible single-pointer alternative for each custom gesture. Custom navigation gestures MUST NOT intercept vertical scrolling, pull-to-refresh, text selection, keyboard input, screen-reader navigation or setlist reordering.

#### Scenario: Usar atualização móvel
- **WHEN** uma pessoa puxa a lista online no topo para atualizar
- **THEN** a lista atualiza conforme o requisito de atualização compartilhada sem acionar mudança de seção

#### Scenario: Interagir em editor ou campo
- **WHEN** o movimento começa em alça de arraste, campo de texto, seleção, controle horizontal ou teclado
- **THEN** o gesto especializado recebe a interação e nenhuma navegação de seção ocorre

#### Scenario: Navegar sem executar gesto personalizado
- **WHEN** a pessoa usa teclado, leitor de tela ou controles visíveis
- **THEN** consegue executar as mesmas tarefas de navegação e reordenação sem gesto de caminho obrigatório

### Requirement: Deslize entre seções condicionado à validação
The system MAY provide horizontal section navigation on native devices only after usability evaluation confirms discoverability, expected destinations, cancelability and no harmful conflict with scroll or platform gestures; the visible section controls SHALL remain available.

#### Scenario: Piloto aprovado
- **WHEN** o piloto demonstra os critérios definidos na avaliação e não há conflito com rolagem, leitura, edição ou sistema
- **THEN** deslizar entre Shows, Repertório e Banda leva ao último destino válido da área seguinte/antecedente, sem entrar em Palco

#### Scenario: Piloto reprovado ou ainda não avaliado
- **WHEN** os critérios de aprovação não são demonstrados ou a avaliação ainda não ocorreu
- **THEN** o deslize de seção não é habilitado e os controles visíveis continuam permitindo a navegação

#### Scenario: Cancelar deslize
- **WHEN** a pessoa inicia e cancela o deslize antes da confirmação
- **THEN** a seção, rota, consulta, seleção e posição de rolagem permanecem inalteradas

### Requirement: Redução de movimento e foco de navegação
The system SHALL respect the user's reduced-motion preference and maintain focus, route identity and operation feedback when transitions are shortened or omitted.

#### Scenario: Reduzir movimento
- **WHEN** a preferência de redução de movimento está ativada no sistema ou navegador
- **THEN** transições não essenciais são removidas ou simplificadas e todas as ações continuam disponíveis

#### Scenario: Abrir e fechar rota ou camada
- **WHEN** detalhe, drawer ou popup abre ou fecha
- **THEN** foco e anúncio acompanham o novo contexto e retornam ao acionador ou item de origem quando possível
