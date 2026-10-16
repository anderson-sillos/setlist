# Tasks

## 1. Linha de base e contratos de leitura

- [ ] 1.1 Registrar em `docs/SUPABASE_READ_PERFORMANCE.md` a linha de base de abertura, refresh e retorno por foco de Minhas bandas, Shows e Repertório com dados representativos de desenvolvimento; verificar que o documento distingue chamadas, bytes, tempo de rede e tempo até estrutura/conteúdo visível, identificando plataforma e condições da medição.
- [x] 1.2 Definir os tipos `BandContext`, `UserBandSummary`, `SongSummary` e `ShowSummary` e os métodos necessários dos repositórios, mantendo documentos completos distintos; verificar com typecheck e cenários de contrato que resumo não exige letra/blocos fictícios e distingue duração nula de zero.

## 2. Resumos autorizados no banco

- [x] 2.1 Criar migração aditiva de contexto da banda e resumo de Minhas bandas com papel atual, existência de músicas ativas e primeiro show futuro não cancelado; verificar com testes SQL bandas múltiplas, usuário sem participação, ausência de próximo show e comparação por instante completo.
- [x] 2.2 Criar a leitura de resumos de shows com duração agregada no banco; verificar com testes SQL paridade para vários blocos, músicas repetidas, anotações, separadores, tempos ausentes/zero, músicas arquivadas e alteração de duração sem resalvar a setlist.
- [x] 2.3 Verificar os novos contratos com grants e execução invoker sob papéis autenticados, incluindo conta suspensa e música moderada; confirmar em testes de banco que respostas e totais não revelam registros protegidos e que os endpoints anteriores continuam operacionais.
- [x] 2.4 Examinar os planos das consultas filtradas por banda e do próximo show com volume representativo e RLS; registrar `EXPLAIN (ANALYZE, BUFFERS)` e decisões de índices em `docs/SUPABASE_READ_PERFORMANCE.md`, adicionando índices somente quando houver benefício demonstrado.

## 3. Adaptadores e dados completos sob demanda

- [x] 3.1 Implementar adaptadores e parsers do contexto e de Minhas bandas; verificar com testes de repositório uma chamada por contrato, papel vigente, resultado vazio e próximo show nulo sem consultas de perfil ou shows por banda.
- [x] 3.2 Implementar a projeção explícita de `SongSummary` e a consulta em lote de documentos completos por IDs da mesma banda; verificar ausência de letras nas respostas de lista, preservação dos documentos completos e exclusão de IDs não solicitados ou não autorizados.
- [x] 3.3 Implementar o adaptador de `ShowSummary` preservando o detalhe completo de um show; verificar com testes respostas sem relações completas, duração nula/zero e falha recuperável para valores inválidos ou fora da faixa numérica segura.
- [x] 3.4 Adaptar factories e repositórios de teste em `src/testing` aos contratos novos usando cenários mínimos declarados; verificar as suítes consumidoras pertinentes e documentar o uso dos resumos sem reintroduzir catálogo demonstrativo como dependência de testes.

## 4. Cache compartilhado, atualização e invalidação

- [x] 4.1 Centralizar chaves/opções de consultas e derivar resumos de Coleções das consultas básicas compartilhadas; verificar por testes de abertura e refresh que Repertório e Coleções iniciam uma única busca equivalente de metadados de músicas e não confundem cache de resumo com documento completo.
- [x] 4.2 Ajustar a composição do refresh para atualizar contexto e dependências únicas, mantendo o frescor de 60 segundos e compartilhando pedidos em andamento; verificar retornos antes/depois do intervalo, refresh concorrente e ausência de novas chamadas equivalentes durante um carregamento.
- [x] 4.3 Centralizar invalidações de músicas, setlists, agenda, coleções e participações conforme a matriz do design; verificar em testes que mudanças atualizam duração/próximo show/papel, alterações só de vínculos não recarregam músicas e áreas inativas não fazem refetch forçado.
- [x] 4.4 Adaptar os eventos de sessão, reconexão e retorno ao primeiro plano para as novas chaves; verificar remoção de conteúdo moderado, perda de acesso e isolamento entre usuários sem iniciar recargas de telas inativas, registrando as regras de cache e suas exceções de segurança na documentação.

## 5. Telas e carregamento progressivo

- [x] 5.1 Compartilhar o contexto da banda entre `BandAreaLayout` e as telas que precisam apenas de nome/papel, removendo as consultas genéricas redundantes desses caminhos; verificar uma consulta de contexto com consumidores simultâneos e atualização dos controles após mudança de papel.
- [x] 5.2 Migrar Minhas bandas para o resumo com próximo show do servidor; verificar com respostas controladas que a estrutura aparece antes da resposta, os cards não esperam consultas de shows por banda e loading não é apresentado como ausência confirmada de próximo show.
- [x] 5.3 Migrar Shows e seus cards para `ShowSummary`, eliminando a lista de músicas para calcular durações; verificar busca, filtros, calendário, ordenação, orientação inicial e exibição dos cards enquanto o contexto secundário ainda está pendente ou falha.
- [x] 5.4 Migrar o Repertório para `SongSummary` e estados independentes de músicas/contexto/coleções; verificar seleção, filtros, ordenação, falha secundária localizada e espera correta quando um filtro de coleção depende de vínculos ainda pendentes.
- [ ] 5.5 Adaptar detalhe, edição e visualização de letra às consultas completas sob demanda; verificar os acessos pelo card/menu/atalho existente e que abrir e salvar uma música após consultar um resumo preserva a letra original.
- [ ] 5.6 Adaptar seletores e editores de coleção/setlist aos metadados compartilhados; verificar contagens, ordem, duração, elegibilidade de arquivadas e atualização imediata do total do rascunho sem chamadas de gravação por mudança local.
- [ ] 5.7 Adaptar os consumidores afetados da prévia de palco; verificar a lista com resumos e o carregamento das letras somente para IDs referenciados pelo show, preservando o comportamento atual da prévia.
- [ ] 5.8 Ajustar a composição de carregamento, `ContentFade` e feedback por região usando os componentes existentes; verificar com consultas deliberadamente atrasadas a navegação disponível, ausência de vazio transitório, preservação de rolagem/foco/seleção no refresh e respeito à redução de movimento.

## 6. Validação integrada e evidências

- [ ] 6.1 Executar as verificações pertinentes de formatação, lint, typecheck, suítes de domínio/repositórios/queries/interface e banco; confirmar a passagem dos checks exigidos pelo projeto e registrar comandos e resultados sem repetir execuções sem mudanças ou falhas novas.
- [ ] 6.2 Validar os fluxos completos em Android, iOS e web com conexão normal e respostas lentas/falhas secundárias, incluindo abrir letra, editar setlist, organizar coleções, refresh e mudança de papel; registrar comportamento e limitações observadas no relatório de desempenho.
- [ ] 6.3 Comparar chamadas e payloads com a linha de base: Shows com duas consultas de dados, Repertório com até quatro e músicas uma vez, Minhas bandas com uma consulta independente do número de bandas; comprovar também ausência de refetch por foco com cache recente, excluindo dos totais operações de autenticação.
- [ ] 6.4 Consolidar tempos de estrutura/conteúdo utilizável, volume transferido, planos SQL e compatibilidade de clientes anteriores em `docs/SUPABASE_READ_PERFORMANCE.md`; atualizar `docs/CODEX_HANDOFF.md` com a conclusão real, evidências e quaisquer pendências antes do encerramento da change.
