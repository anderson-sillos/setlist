# Spec Delta

## ADDED Requirements

### Requirement: Estrutura visível durante o carregamento inicial

Após a autenticação estar definida, o sistema SHALL apresentar cabeçalho, navegação e estrutura de Minhas bandas, Shows e Repertório sem aguardar consultas de conteúdo. Regiões dependentes de dados SHALL indicar seu carregamento localmente, sem bloquear a navegação disponível ou criar atrasos artificiais antes das consultas.

#### Scenario: Abrir uma tela com conexão lenta
- **WHEN** uma pessoa navega para uma dessas telas sem dados em cache e a resposta ainda está pendente
- **THEN** a estrutura da tela e a navegação disponível já aparecem
- **AND** a área da lista apresenta um indicador de carregamento acessível

#### Scenario: Aguardar o papel do usuário
- **WHEN** a lista está carregada, mas o acesso necessário a uma ação de edição ainda não foi confirmado
- **THEN** a lista permanece visível e consultável
- **AND** a ação de edição aguarda o contexto autorizado sem deslocamentos desnecessários de layout

#### Scenario: Aguardar a confirmação de uma lista vazia
- **WHEN** uma consulta essencial ainda está pendente
- **THEN** a tela não apresenta vazio, nenhum resultado ou ausência de próximo show como um resultado confirmado

### Requirement: Conteúdo exibido conforme suas dependências

O sistema SHALL apresentar cada região quando seus dados essenciais estiverem disponíveis, preservando conteúdo autorizado em cache durante revalidação. Consultas secundárias de perfil, permissões ou coleções MUST NOT esconder listas já carregadas que não dependam delas. Falhas SHALL ser indicadas na região afetada com recuperação pertinente.

#### Scenario: Shows chegam antes das permissões
- **WHEN** os resumos dos shows chegam enquanto a consulta de contexto continua pendente
- **THEN** os cards ficam visíveis e podem ser consultados sem esperar a consulta secundária

#### Scenario: Minhas bandas não depende das setlists
- **WHEN** os resumos de Minhas bandas chegam
- **THEN** os cards são apresentados sem esperar consultas de todos os shows ou setlists de cada banda

#### Scenario: Coleções indisponíveis com repertório carregado
- **WHEN** as músicas estão disponíveis e o carregamento das coleções falha, sem filtro de coleção ativo
- **THEN** o repertório continua consultável e a falha fica vinculada às ações de coleção

#### Scenario: Filtro ativo depende de vínculos ainda pendentes
- **WHEN** uma coleção ou Sem coleção está aplicada e seus vínculos ainda não foram carregados, sem cache válido para a consulta
- **THEN** a região dos resultados indica que está carregando as dependências do filtro
- **AND** não mostra uma lista sem o filtro ou um vazio transitório como resultado confirmado

#### Scenario: Atualizar dados já disponíveis
- **WHEN** a pessoa retorna à tela ou solicita atualização com conteúdo em cache
- **THEN** os itens continuam visíveis durante a busca, com posição, filtros e seleção preservados quando ainda válidos
- **AND** a conclusão não reinicia uma animação de entrada da lista inteira nem rouba o foco
