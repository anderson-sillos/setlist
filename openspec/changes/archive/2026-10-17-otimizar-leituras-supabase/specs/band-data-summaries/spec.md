# Spec Delta

## Purpose

Fornecer leituras autorizadas e enxutas dos dados da banda para montar listas e navegação, mantendo conteúdo completo disponível sob demanda e os valores derivados consistentes com os dados salvos.

## ADDED Requirements

### Requirement: Contexto compartilhado da banda atual

O sistema SHALL fornecer nome da banda, papel do usuário atual e indicação de músicas ativas consultáveis em uma leitura de contexto compartilhada pelos consumidores da tela. Essa leitura MUST NOT exigir o perfil ou a relação completa de bandas do usuário para apresentar o contexto da banda atual.

#### Scenario: Abrir uma área da banda
- **WHEN** um integrante abre Shows ou Repertório sem contexto em cache
- **THEN** uma única consulta de contexto fornece os dados necessários ao cabeçalho, às ações por papel e à orientação inicial
- **AND** não são iniciadas consultas separadas de perfil ou de todas as bandas apenas para completar esse contexto

#### Scenario: Consultar disponibilidade do repertório
- **WHEN** a lista de Shows precisa orientar o primeiro cadastro
- **THEN** identifica se há músicas ativas consultáveis sem transferir o repertório inteiro

### Requirement: Resumos de shows com duração calculada no servidor

O sistema SHALL fornecer a lista de shows com identificação, nome, data, local, status e duração estimada calculada a partir dos dados salvos no servidor. A consulta de lista MUST NOT transferir letras, o repertório completo ou os blocos e itens completos de cada setlist.

#### Scenario: Consultar ou atualizar Shows
- **WHEN** um integrante abre ou atualiza a lista de Shows
- **THEN** recebe os resumos dos shows autorizados da banda e suas durações em uma consulta de lista
- **AND** busca, filtros, calendário e ordenação por duração continuam disponíveis

#### Scenario: Consultar detalhes de um show
- **WHEN** a pessoa abre o detalhe ou a edição de um show
- **THEN** o sistema consulta os dados completos necessários àquele fluxo sem considerar o resumo uma setlist já carregada

### Requirement: Equivalência da duração estimada

O sistema SHALL calcular o total salvo somando a duração de cada ocorrência de música consultável e de cada anotação com tempo, ignorando separadores e valores ausentes. O resultado SHALL ser não informado quando não houver duração conhecida e SHALL refletir os valores vigentes das músicas e itens autorizados.

#### Scenario: Somar músicas e anotações
- **WHEN** um show possui músicas e anotações com duração em vários blocos
- **THEN** o total corresponde à soma de todos esses tempos
- **AND** separadores não acrescentam duração

#### Scenario: Repetir uma música na setlist
- **WHEN** uma música aparece duas vezes em um show
- **THEN** sua duração é somada duas vezes, uma para cada ocorrência

#### Scenario: Diferenciar tempo ausente de zero
- **WHEN** nenhum item de um show tem duração conhecida
- **THEN** o total é não informado
- **AND** um show com pelo menos uma duração informada de zero e sem outros tempos conhecidos apresenta total zero

#### Scenario: Usar uma música arquivada já incluída
- **WHEN** uma música arquivada permanece em uma setlist salva e continua consultável
- **THEN** sua duração participa do total daquela setlist

#### Scenario: Alterar o tempo de uma música
- **WHEN** uma duração de música usada em shows é alterada e os resumos afetados são consultados novamente
- **THEN** os totais refletem o novo tempo sem exigir alteração ou novo salvamento das setlists

#### Scenario: Editar um rascunho local
- **WHEN** a pessoa altera itens ou tempos de uma setlist sem salvar
- **THEN** a duração apresentada no editor acompanha o rascunho local sem exigir gravações ou consultas para cada alteração

### Requirement: Próximo show no resumo de Minhas bandas

O sistema SHALL apresentar nome, papel do usuário e data do próximo show de cada banda em uma consulta de resumos para as bandas acessíveis. O próximo show SHALL ser o não cancelado com menor data maior ou igual ao instante de referência da consulta. A listagem MUST NOT buscar todos os shows ou suas setlists por banda.

#### Scenario: Consultar várias bandas
- **WHEN** um usuário abre Minhas bandas e participa de várias bandas
- **THEN** uma consulta retorna os resumos dessas bandas e a data do próximo show de cada uma
- **AND** a quantidade de chamadas não cresce com o número de bandas

#### Scenario: Ignorar shows passados e cancelados
- **WHEN** uma banda tem shows passados, futuros cancelados e futuros não cancelados
- **THEN** o resumo usa a primeira data futura não cancelada, comparada pelo instante completo

#### Scenario: Não existir próximo show
- **WHEN** a consulta confirma que não há show elegível para uma banda
- **THEN** o resumo informa ausência de próximo show
- **AND** um resumo ainda em carregamento não é apresentado como ausência confirmada

### Requirement: Metadados de músicas separados do conteúdo completo

O sistema SHALL fornecer às listas os metadados necessários a nomes, artistas, status da letra, tempos, filtros e ordenação, sem incluir o documento da letra. Conteúdo completo SHALL ser carregado quando um fluxo de detalhe, leitura, edição ou palco precisar dele; um resumo MUST NOT ser interpretado como conteúdo completo ou letra vazia.

#### Scenario: Abrir o Repertório
- **WHEN** a pessoa consulta a lista de músicas
- **THEN** os resultados permitem os filtros, a seleção e as ações atuais sem transferir letras

#### Scenario: Abrir a letra pelas ações ou pelo atalho existente
- **WHEN** uma música tem letra disponível e a pessoa solicita sua visualização
- **THEN** o sistema consulta o conteúdo completo autorizado e mostra seu carregamento e eventuais falhas nessa visualização
- **AND** o resumo não substitui a letra salva por um documento vazio

#### Scenario: Carregar conteúdo para um show específico
- **WHEN** um fluxo precisa das letras das músicas de um show
- **THEN** pode obtê-las em lote para as músicas referenciadas naquele show sem baixar letras de músicas não utilizadas

### Requirement: Reutilização das músicas entre Repertório e Coleções

O sistema SHALL compartilhar os metadados de músicas usados pelo Repertório e pelos resumos de Coleções. Carregar ou atualizar ambos no mesmo ciclo MUST NOT gerar duas chamadas equivalentes da lista de músicas. Vínculos, ordem, contagens e durações SHALL considerar somente músicas consultáveis e manter os filtros existentes.

#### Scenario: Carregar músicas e coleções em paralelo
- **WHEN** a abertura ou atualização do Repertório precisa das músicas e dos vínculos de coleção
- **THEN** uma única consulta de metadados de músicas atende às duas necessidades
- **AND** as consultas de coleções e vínculos não repetem essa busca

#### Scenario: Atualizar a música de uma coleção
- **WHEN** título, duração ou arquivamento de uma música vinculada muda e os dados são atualizados
- **THEN** a lista e os resumos das coleções passam a usar o mesmo valor vigente

### Requirement: Autorização dos contratos de resumo

Os resumos SHALL respeitar as mesmas regras de participação, suspensão de conta e moderação dos dados de origem. A agregação MUST NOT expor conteúdo, identificadores, contagens ou durações provenientes de registros ocultados pelas regras aplicáveis à consulta.

#### Scenario: Consultar uma banda sem participação
- **WHEN** uma pessoa sem acesso solicita contexto, músicas ou resumos de shows daquela banda
- **THEN** não recebe dados protegidos da banda

#### Scenario: Consultar com uma conta suspensa
- **WHEN** uma conta suspensa usa uma sessão ainda emitida para solicitar resumos
- **THEN** não obtém acesso aos dados protegidos

#### Scenario: Ocultar uma música por moderação
- **WHEN** uma música é ocultada pelas regras de moderação
- **THEN** ela não aparece nos resumos de músicas, vínculos ou contagens consultáveis
- **AND** sua ocorrência não acrescenta duração aos resumos dos shows que a pessoa pode consultar
