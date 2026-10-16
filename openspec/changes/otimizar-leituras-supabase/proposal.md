# Proposal

## Why

As telas consultam repetidamente banda, participação e perfil, transferem letras e setlists completas para montar listas e, em alguns casos, escondem conteúdo já disponível até a consulta mais lenta terminar. Os acessos observados no Supabase permitem reduzir consumo de dados, trabalho no aparelho e espera visual preservando as regras de acesso e atualização compartilhada.

## What Changes

- Compartilhar uma consulta enxuta do contexto da banda, com nome, papel do usuário atual e disponibilidade de músicas ativas, evitando buscar todas as bandas e o perfil para decidir ações de uma tela.
- Consultar resumos de shows com duração calculada no banco, sem baixar todo o repertório ou os blocos e itens das setlists para exibir a lista.
- Retornar Minhas bandas com a data do próximo show não cancelado calculada no banco, eliminando a busca de todos os shows de cada banda.
- Separar resumos de músicas de documentos completos: listas recebem os metadados necessários; detalhe, letra e edição consultam o conteúdo completo quando solicitado.
- Compartilhar consultas e cache de músicas entre Repertório e Coleções, eliminando chamadas idênticas durante abertura, atualização e invalidação de dados.
- Exibir estrutura e navegação desde a montagem das telas e preencher regiões conforme seus dados essenciais chegam, preservando conteúdo em cache e tratando falhas secundárias localmente.
- Preservar atualização manual e revalidação por foco, incluindo mudanças no papel do usuário; invalidar os resumos dependentes após alterações confirmadas.
- Validar quantidade de chamadas, volume transferido, tempo até conteúdo utilizável, paridade dos cálculos e isolamento por banda nas três plataformas.

## Capabilities

### New Capabilities

- `band-data-summaries`: contratos de leitura enxutos e autorizados para contexto da banda, músicas, shows e próximo show de cada banda, com separação entre resumo e conteúdo completo.

### Modified Capabilities

- `application-ui`: abertura e carregamento progressivo de Minhas bandas, Shows e Repertório, sem bloquear conteúdo por consultas secundárias.
- `shared-data-refresh`: atualização de consultas compartilhadas sem duplicação, preservação dos dados disponíveis e invalidação dos resumos afetados por mudanças.

## Impact

- Migrações aditivas de views e/ou funções SQL no Supabase, mantendo RLS, moderação e compatibilidade com clientes já distribuídos.
- Tipos e contratos em `src/domain`, repositórios em `src/data/supabase` e composição/cache em `src/data/queries.ts`.
- `BandAreaLayout`, Minhas bandas, Shows, Repertório, Coleções e consumidores dos contratos compartilhados em detalhe, edição e prévia de palco.
- Componentes de carregamento, hooks de atualização e suítes pertinentes de banco, queries e interface.
- Documentação de validação com comparação antes/depois. Nenhuma nova dependência de serviço, publicação ou alteração de produção integra esta proposta.
