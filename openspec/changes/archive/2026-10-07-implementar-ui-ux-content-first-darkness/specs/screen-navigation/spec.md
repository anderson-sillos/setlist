# Spec Delta

## Purpose

Define como as pessoas avançam e retornam entre áreas e telas do Setlist, preservam seu contexto de trabalho e entendem as transições sem perder edição nem conflitar com acessibilidade ou gestos do sistema.

## ADDED Requirements

### Requirement: Retorno previsível entre telas
O sistema SHALL oferecer retorno previsível na Web, Android e iOS, preservando o histórico válido de rotas e oferecendo retorno contextual quando a tela não tiver destino anterior dentro do app.

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
O sistema SHALL preservar busca, filtros, posição de rolagem e última rota utilizável separadamente por banda e seção ao alternar áreas e retornar às listas.

#### Scenario: Retornar à lista de repertório
- **WHEN** a pessoa retorna de detalhe ou letra para o repertório
- **THEN** busca, filtros e posição anteriores são restaurados sem iniciar consulta não necessária

#### Scenario: Alternar áreas da banda
- **WHEN** a pessoa navega entre Repertório, Shows e Banda e volta a uma área anterior
- **THEN** a área reaparece no último estado válido dela e da banda selecionada

#### Scenario: Contexto tornou-se inválido
- **WHEN** a pessoa perde acesso à banda ou sua sessão termina
- **THEN** conteúdo preservado não é mostrado como acessível e o fluxo volta para uma área autorizada

#### Scenario: Atualizar controles durante a rolagem
- **WHEN** controles visuais mudam enquanto a lista está sendo rolada
- **THEN** a lista não reaplica a posição lembrada nem interrompe a inércia; a restauração fica reservada à próxima abertura da seção

### Requirement: Destino após criação de banda
O sistema SHALL selecionar a banda recém-criada e abrir seu Repertório como primeira área de trabalho dessa banda.

#### Scenario: Criar uma banda com sucesso
- **WHEN** a pessoa conclui a criação de uma banda
- **THEN** a banda criada passa a ser a banda selecionada e o destino aberto é o Repertório dessa banda
- **AND** se não houver músicas cadastradas, a lista apresenta a orientação e a ação para adicionar a primeira música

### Requirement: Transições coerentes entre rotas
O sistema SHALL usar transições breves que comuniquem entrada, saída ou mudança de contexto, mantendo o conteúdo estável e as operações independentes do término da animação.

#### Scenario: Entrar e retornar de um detalhe
- **WHEN** uma pessoa abre um detalhe e usa retorno pelo botão ou gesto da plataforma
- **THEN** a transição respeita a plataforma e o retorno interativo pode ser cancelado sem alterar a rota ou o conteúdo ativo
- **AND** em iOS e Android, o botão Voltar substitui a rota atual pelo destino contextual com animação de retorno, garantindo que a tela correta entre pela esquerda mesmo se houver outras telas no histórico
- **AND** na Web, o botão Voltar navega ao destino contextual e mantém a integração com o histórico e a transição fade

#### Scenario: Retornar da letra em tela cheia
- **WHEN** a pessoa volta da letra em tela cheia
- **THEN** retorna ao detalhe da mesma música, sem passar pelo repertório ou por outra música do histórico
- **AND** em iOS e Android, o detalhe entra pela esquerda; se a letra foi aberta diretamente, o detalhe é apresentado com animação de retorno
- **AND** na Web, a navegação mantém a transição fade

#### Scenario: Trocar a seção ativa
- **WHEN** a pessoa muda de área da banda por controle de navegação
- **THEN** conteúdo, rótulo e seção selecionada mudam juntos sem aparentar que uma tela de detalhe foi empilhada
- **AND** nos controles nativos, avançar de Shows para Repertório ou de Repertório para Banda desliza a nova seção da direita; retroceder desliza da esquerda, mantendo a animação nativa do iOS e Android
- **AND** na Web, a troca mantém a transição fade existente

#### Scenario: Voltar para Minhas bandas
- **WHEN** a pessoa retorna de outra rota à tela Minhas bandas
- **THEN** Minhas bandas entra pela esquerda como o primeiro nível da pilha nativa

#### Scenario: Operação termina durante a transição
- **WHEN** navegação ou gravação prossegue enquanto a transição visual está acontecendo
- **THEN** o resultado funcional não aguarda a animação e o estado final exibido corresponde ao resultado real

### Requirement: Proteção de alterações não salvas
O sistema SHALL solicitar decisão explícita de descarte antes de sair de um editor com alterações não salvas, por qualquer caminho de retorno do app ou da plataforma.

#### Scenario: Tentar sair de edição alterada
- **WHEN** a pessoa tenta voltar, trocar área, fechar o editor ou usar o gesto de retorno após editar conteúdo
- **THEN** o sistema oferece continuar editando ou descartar as alterações antes de navegar

#### Scenario: Fechar o cadastro de banda alterado
- **WHEN** a pessoa altera o nome da banda ou o aceite do termo e tenta fechar o cadastro, tocar fora dele ou navegar para outra rota
- **THEN** o sistema oferece continuar preenchendo ou descartar as alterações antes de fechar ou navegar

#### Scenario: Continuar editando
- **WHEN** a pessoa escolhe continuar editando no aviso de descarte
- **THEN** o editor e todos os valores não salvos permanecem inalterados

#### Scenario: Confirmar descarte
- **WHEN** a pessoa confirma descarte
- **THEN** o sistema deixa o editor e descarta apenas as alterações locais daquela edição

#### Scenario: Salvamento em andamento
- **WHEN** uma gravação está em andamento e a pessoa tenta enviar novamente ou sair
- **THEN** envio duplicado é impedido e os valores permanecem disponíveis até resposta ou decisão segura do fluxo

#### Scenario: Salvamento confirmado
- **WHEN** a gravação termina com sucesso e o editor navega para o destino seguinte
- **THEN** a proteção reconhece a remoção autorizada da rota e não apresenta o aviso de descarte

### Requirement: Gestos complementares e sem conflito
O sistema SHALL preservar gestos de navegação da plataforma/navegador e oferecer alternativa visível operável com um único ponteiro para cada gesto próprio. Gestos próprios de navegação MUST NOT interceptar rolagem vertical, pull-to-refresh, seleção de texto, digitação, navegação por leitor de tela ou reordenação da setlist.

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
O sistema MAY oferecer deslize horizontal de seções no nativo somente após avaliação de usabilidade confirmar descoberta, destinos esperados, cancelamento e ausência de conflito prejudicial com rolagem ou gestos da plataforma; os controles visíveis de seção SHALL permanecer disponíveis.

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
O sistema SHALL respeitar a preferência de redução de movimento e manter foco, identidade da rota e feedback das operações quando transições forem encurtadas ou omitidas.

#### Scenario: Reduzir movimento
- **WHEN** a preferência de redução de movimento está ativada no sistema ou navegador
- **THEN** transições não essenciais são removidas ou simplificadas e todas as ações continuam disponíveis

#### Scenario: Abrir e fechar rota ou camada
- **WHEN** detalhe, drawer ou popup abre ou fecha
- **THEN** foco e anúncio acompanham o novo contexto e retornam ao acionador ou item de origem quando possível
