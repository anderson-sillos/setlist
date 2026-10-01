# Design

## Context

As consultas de negócio usam TanStack Query e hoje têm `staleTime` e `gcTime` globais infinitos. As telas mantêm listas com `FlatList`/`SectionList` e páginas de detalhe com rolagem própria. A aplicação já consulta novamente após algumas mutações feitas pela sessão atual, mas não sincroniza os caches de sessões distintas. Ver `proposal.md` para a motivação e `specs/shared-data-refresh/spec.md` para o contrato observável.

## Goals / Non-Goals

**Goals:**

- Oferecer um padrão reutilizável de atualização acionada pela pessoa e por retorno a telas com cache antigo.
- Limitar cada ação às queries realmente apresentadas pela tela atual.
- Respeitar listas móveis, controles web acessíveis e o gesto de reordenação da setlist.
- Manter os dados existentes durante consultas e evitar chamadas duplicadas simultâneas.

**Non-Goals:**

- Atualização em tempo real ou polling.
- Alterar o cache global do aplicativo ou atualizar áreas em segundo plano.
- Resolver conflitos entre um rascunho local de edição e alterações remotas feitas em paralelo.
- Recarregar formulários com alterações locais ainda não salvas.

## Decisions

### Atualização direcionada por tela

Cada tela fornecerá as funções `refetch` das queries que renderiza ao controle de atualização compartilhado. A ação manual usará essas funções, agrupadas em uma única operação concorrente; não invalidará prefixos globais nem fará fetch de dados não visíveis. O estado `isFetching` impedirá uma segunda atualização enquanto a primeira estiver em andamento. O conteúdo atual permanecerá renderizado.

Alternativa considerada: invalidar todos os dados de uma banda ou todos os dados do usuário. Foi rejeitada porque cria leituras para telas que não estão abertas e pode repetir consultas de listas independentes.

### Padrão visual por plataforma e interação

Listas de bandas, integrantes, repertório e shows usarão o controle nativo de puxar para atualizar em iOS e Android. Web terá um botão acessível dentro da área de controles da lista. Detalhes e páginas sem lista nativa terão um botão de atualização explícito. O editor da setlist não usará o gesto de puxar; a atualização da tela de edição não poderá substituir rascunhos locais.

Alternativa considerada: usar apenas o gesto em todas as plataformas. Foi rejeitada por ser pouco descobrível com mouse e por conflitar com a reordenação da setlist.

### Revalidação ao focar com janela de frescor limitada

As telas de leitura revalidarão suas próprias queries ao receber foco somente quando `dataUpdatedAt` tiver mais de 60 segundos. Uma mesma query não será refeita enquanto estiver em carregamento. O limite ficará em uma constante de configuração da camada de dados, não no valor global de `staleTime`.

Alternativa considerada: alterar `staleTime` global ou buscar dados a cada foco. Foram rejeitadas porque afetam telas não relacionadas e podem multiplicar consultas em navegação rápida.

### Tratamento de telas de edição

Formulários de música e show mantêm rascunhos em estado local. Eles não atualizarão esses rascunhos automaticamente ao receber foco. Os dados de leitura podem ser atualizados antes de iniciar a edição; depois que houver alterações locais, o conteúdo do formulário não será substituído. A edição do setlist usa a lista rolável e gestos para alterar blocos e itens; ela não receberá pull-to-refresh.

Alternativa considerada: rehidratar o formulário após qualquer refetch. Foi rejeitada porque pode descartar trabalho não salvo. Detecção e resolução de conflito na gravação ficam fora desta mudança.

### Membership caches

`useUserBands` e `useUserBandSummaries` atendem telas diferentes. Cada uma será revalidada apenas enquanto sua própria tela estiver ativa, em vez de invalidar ambas globalmente. A tela Banda também refaz a lista de integrantes, enquanto Minhas bandas atualiza o papel que exibe.

## Risks / Trade-offs

- [Uma alteração externa pode não aparecer enquanto a pessoa permanecer na tela] → disponibilizar gesto/ação manual; o foco só busca ao retornar e após 60 segundos.
- [A janela de 60 segundos pode ser longa para algumas pessoas] → a atualização manual sempre pode ser acionada, sem esperar a janela.
- [Web não tem gesto de puxar universalmente descobrível] → mostrar ação com rótulo acessível `Atualizar`.
- [Um refresh manual em uma tela com várias consultas gera uma consulta por fonte de dados visível] → limitar as fontes ao necessário para o resumo da própria tela e agrupar a operação para um único indicador.
- [Páginas de edição podem ter rascunhos diferentes do servidor] → não sincronizar estado de formulário automaticamente e excluir edição da setlist do gesto de refresh.

## Migration Plan

Não há migração de banco nem alteração de API. A mudança será implantada como código cliente comum para web, Android e iOS. Reversão consiste em remover os controles/hook compartilhados e voltar ao cache atual.
