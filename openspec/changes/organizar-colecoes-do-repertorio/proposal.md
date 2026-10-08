# Proposal

## Why

Bandas precisam reunir músicas do repertório por ocasião, estilo ou intenção, como Festa, Acústico e Festival, e reaproveitar esses conjuntos na preparação dos shows. Coleções tornam essa organização disponível como uma facilidade opcional, com acesso discreto e simples para quem desejar usá-la.

## What Changes

- Introduzir **Coleções** compartilhadas pela banda, com nome, músicas em ordem própria, quantidade de músicas e duração estimada. Uma música poderá participar de várias coleções, preservando seu cadastro único no repertório.
- Oferecer acesso secundário a Coleções dentro do Repertório, com visual neutro e sem promover o recurso por avisos, passos obrigatórios, novos destinos na barra inferior ou convites recorrentes de uso.
- Permitir criação, edição, reordenação e exclusão de coleções por proprietários e editores; integrantes poderão consultá-las.
- Reutilizar busca, filtros e ordenação ao escolher músicas, mantendo as marcações entre consultas e permitindo selecionar explicitamente os resultados visíveis.
- Oferecer um modo explícito de seleção múltipla no Repertório para criar uma coleção ou acrescentar músicas a uma existente.
- Acrescentar ao painel Filtrar, quando existirem coleções, uma dimensão de coleção combinável com os critérios atuais: todas, sem coleção ou uma coleção da banda.
- Mostrar no detalhe da música as coleções das quais ela participa, com nomes clicáveis que abrem o Repertório filtrado; oferecer gerenciamento secundário dos vínculos a quem pode editar. Músicas sem vínculos não receberão aviso ou incentivo de adesão.
- Oferecer no menu de ações da música um atalho para abrir a letra em tela cheia quando houver letra disponível; na Web, permitir o mesmo acesso com clique duplo no card, preservando o clique simples para abrir os detalhes.
- Disponibilizar **Adicionar coleção** nas opções de inclusão do setlist quando houver coleções, com prévia da quantidade, duração e bloco de destino. As músicas disponíveis entrarão ao final do bloco ativo na ordem da coleção e permanecerão editáveis até o salvamento normal do setlist.
- Preservar a independência da composição de shows já montados: alterar ou excluir uma coleção não altera seus itens nem apaga músicas. Manter as regras vigentes de arquivamento, visibilidade e repetição de músicas no show.

## Capabilities

### New Capabilities

- `repertoire-collections`: agrupamentos opcionais e ordenados de músicas por banda, seus vínculos, gerenciamento, consulta e filtros no Repertório e inclusão em lote no setlist de um show.

### Modified Capabilities

Nenhuma. A integração segue os contratos vigentes de interface, navegação, atualização de dados e acesso ao conteúdo; o novo comportamento fica definido em `repertoire-collections`.

## Impact

- Supabase: tabelas de coleções e vínculos com músicas, índices, integridade por banda, políticas RLS e operações transacionais de gerenciamento.
- Domínio e dados: entidades, repositório Supabase e em memória, consultas e invalidações limitadas à banda e aos dados afetados.
- Interface Expo para Android, iOS e Web: área de Coleções dentro de Repertório, seletor de músicas, filtros, detalhe da música e inclusão em lote no editor de setlist.
- Navegação e feedback: rotas subordinadas ao Repertório, preservação do contexto e uso da proteção compartilhada de alterações não salvas.
- Verificação: cenários de acesso e ciclo de vida no banco, lógica de organização e filtros, regressões dos fluxos atuais e conferência visual nas três plataformas.
- Não exige nova biblioteca. Criar coleções a partir de shows/blocos, coleções automáticas por regras, compartilhamento entre bandas e edição offline ficam como evoluções futuras.
