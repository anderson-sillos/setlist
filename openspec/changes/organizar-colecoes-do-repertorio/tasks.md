# Tasks

## 1. Persistência e autorização

- [x] 1.1 Criar migração aditiva para coleções e vínculos ordenados, com nomes válidos e únicos por banda, restrições de posição e cascatas; verificar com pgTAP nomes equivalentes, vínculo duplicado, associação entre bandas e exclusão sem apagar músicas ou shows.
- [x] 1.2 Implementar RLS para integrantes ativos, papéis de escrita, suspensão e visibilidade das músicas nos vínculos; verificar com pgTAP proprietário, editor, integrante, pessoa externa, conta suspensa e música ocultada, incluindo ausência de vazamento em contagens.
- [x] 1.3 Implementar RPCs atômicos para salvar coleção/ordem, acrescentar músicas, atualizar participações de uma música e excluir coleção; verificar rollback em entrada inválida, preservação de vínculos não consultáveis e reenvio sem duplicação.
- [x] 1.4 Implementar bloqueios, atualização da revisão e rejeição de edição desatualizada; verificar inclusões concorrentes e tentativas de sobrescrever uma revisão anterior sem perda silenciosa de dados.
- [x] 1.5 Ampliar os testes de ciclo de vida para arquivamento, restauração, moderação e exclusão definitiva de músicas vinculadas; verificar que a ordem relativa permanece e que coleções não alteram a decisão vigente entre exclusão e arquivamento.
- [x] 1.6 Documentar estrutura, permissões e sequência de aplicação da migração em `docs/COLECOES_REPERTORIO.md`; verificar correspondência com a migração e executar `npm run supabase:test` e `npm run supabase:lint` no ambiente local configurado ou no runner isolado da PR quando não houver Docker/Podman local.

## 2. Domínio, repositórios e consultas

- [x] 2.1 Acrescentar entidades e contrato de repositório de coleções, incluindo operações e revisão de edição; verificar `npm run typecheck` após ajustar a composição de `AppRepositories`.
- [x] 2.2 Implementar adaptadores Supabase e em memória, dados de demonstração e fábricas de teste; verificar os mesmos cenários de criação, ordem, várias participações, nomes duplicados e exclusão nos testes de contrato aplicáveis.
- [x] 2.3 Implementar consultas por banda e operações de mutação em `src/data/queries.ts`, com vínculos em lote e resumo derivado das músicas consultáveis; verificar testes de quantidade, duração não informada, metadados atualizados e ausência de consulta por card.
- [ ] 2.4 Integrar invalidações e limpeza de cache às mudanças de música, coleção, sessão e banda; verificar testes que atualizam somente os dados afetados e impedem exibição de vínculos antigos após troca de contexto ou ocultação.
- [ ] 2.5 Documentar o contrato e a origem das informações derivadas em `docs/COLECOES_REPERTORIO.md`; verificar que os exemplos não duplicam cadastros de música nem dependem de snapshots de letra.

## 3. Consulta e edição de coleções

- [ ] 3.1 Criar rotas subordinadas ao Repertório e ação secundária Coleções, com acesso de leitura e controles de edição por papel; verificar navegação direta, retorno contextual, distinção de rotas de música e ausência de novos itens no drawer ou rodapé.
- [ ] 3.2 Implementar lista e detalhe ordenado, quantidade, duração, indicação de arquivamento e estados vazios contextuais; verificar testes com zero, uma e várias coleções e ausência de aviso de adesão nas telas habituais.
- [ ] 3.3 Implementar criação e renomeação com validação de nome, salvamento explícito e coleção vazia válida; verificar nome vazio, limite de 120 caracteres, duplicidade e preservação do formulário após falha.
- [ ] 3.4 Implementar seletor de músicas com busca, filtros, ordenação, contagem, revisão e seleção explícita dos resultados; verificar testes que mudam a consulta várias vezes sem perder marcações ou selecionar músicas fora dos resultados.
- [ ] 3.5 Implementar remoção de participações, reordenação por arraste e controles de subir/descer, salvamento atômico e exclusão confirmada da coleção; verificar manutenção da ordem, ausência de exclusão de músicas e erro recuperável por edição concorrente.
- [ ] 3.6 Integrar a proteção compartilhada de alterações não salvas e bloquear envios concorrentes; verificar continuar, descartar, falhar e salvar sem aviso indevido, incluindo confirmação acima do editor e navegação responsiva após o fechamento.
- [ ] 3.7 Documentar consulta, edição e organização no seletor em `docs/COLECOES_REPERTORIO.md`; conferir os passos usando uma coleção com músicas ativas e arquivadas.

## 4. Organização a partir do Repertório

- [ ] 4.1 Acrescentar modo explícito de seleção múltipla para proprietários/editores, com ações secundárias, contagem e cancelamento; verificar preservação de busca/filtros e retorno ao toque habitual sem gravação ao cancelar.
- [ ] 4.2 Conectar as escolhidas à criação de coleção com nome e revisão de ordem; verificar que a criação usa somente as escolhidas e permanece sujeita ao salvamento e descarte padrões.
- [ ] 4.3 Implementar inclusão das escolhidas ao final de coleção existente, sem repetir participações ou alterar a ordem anterior; verificar testes com mistura de músicas novas e já presentes e falha sem mudança parcial.
- [ ] 4.4 Documentar as duas ações de organização a partir do Repertório em `docs/COLECOES_REPERTORIO.md`; conferir que ambas podem ser descobertas sem pressão longa ou etapa obrigatória.

## 5. Filtro de coleção e contexto da lista

- [ ] 5.1 Acrescentar Todas as coleções, Sem coleção e uma coleção por vez ao painel Filtrar quando houver coleções; verificar testes de interseção com busca/situação, músicas sem vínculo, ausência de duplicação e preservação da ordenação atual.
- [ ] 5.2 Persistir o critério de coleção no estado de consulta por banda e restaurar o contexto ao retornar; verificar testes de ida ao detalhe, troca de banda e atualização manual sem resetar a lista durante a rolagem.
- [ ] 5.3 Tratar exclusão da coleção filtrada somente após consulta bem-sucedida, com retorno ao critério geral e informação discreta; verificar manutenção dos demais filtros e preservação do critério/dados em falha de rede.
- [ ] 5.4 Integrar os controles novos sem deslocar a área de rolagem ou alterar a ocultação da toolbar; verificar os testes de `ListControlsOverlay` e de direção da rolagem e a ausência da dimensão de coleção em banda sem coleções.
- [ ] 5.5 Documentar o significado e a combinação dos filtros em `docs/COLECOES_REPERTORIO.md`; conferir os exemplos Todas as coleções, Sem coleção e Festa + Sincronizadas.

## 6. Participações no detalhe da música

- [ ] 6.1 Mostrar etiquetas de coleções abaixo de Tom/BPM somente quando houver vínculos; verificar testes com várias coleções, nomes longos e música sem vínculos sem seção vazia ou convite de adesão.
- [ ] 6.2 Conectar cada etiqueta ao Repertório filtrado pela coleção e incluir rótulos/foco acessíveis; verificar destino na mesma banda, identificação do filtro e retorno contextual nas rotas.
- [ ] 6.3 Implementar gerenciamento secundário de participações para quem pode editar, incluindo música ainda sem coleções; verificar atualização atômica, inclusão ao final, preservação de posições das outras músicas e negação a integrante sem permissão.
- [ ] 6.4 Integrar proteção compartilhada, falha recuperável e saída após salvamento; verificar testes de continuar/descartar/salvar e documentar a gestão de participações em `docs/COLECOES_REPERTORIO.md`.

## 7. Inclusão em lote no setlist

- [ ] 7.1 Acrescentar Adicionar coleção às opções de inclusão quando houver coleções e o show for editável; verificar que bandas sem coleções e pessoas sem papel de edição mantêm os controles habituais.
- [ ] 7.2 Implementar prévia do bloco de destino, músicas elegíveis ordenadas, quantidade, duração e repetições, com confirmação indisponível sem músicas elegíveis; verificar coleção vazia, arquivadas e conteúdo oculto sem expor dados não consultáveis.
- [ ] 7.3 Revalidar coleção, músicas e acesso antes da confirmação e exigir conexão; verificar exclusão ou alteração entre prévia e confirmação, erro recuperável e ausência de inclusão parcial silenciosa.
- [ ] 7.4 Acrescentar as ocorrências em uma única atualização local ao final do bloco ativo e bloquear dupla confirmação; verificar testes com repetições permitidas, outros blocos, separadores, planejamento e nenhuma gravação antes de salvar o setlist.
- [ ] 7.5 Garantir que novas inclusões, tanto pelo seletor habitual quanto por coleção, excluam músicas arquivadas sem esconder itens existentes do show; verificar regressão do editor com show já contendo música arquivada.
- [ ] 7.6 Verificar em testes de integração a independência do show após reordenar/excluir coleção, a utilização dos metadados vigentes das músicas e o descarte normal do rascunho; documentar a inclusão em lote em `docs/COLECOES_REPERTORIO.md`.

## 8. Conferência integrada e entrega

- [ ] 8.1 Executar os cenários completos de consultar, criar, editar, filtrar, gerenciar participações e incluir no show na Web, iOS e Android, incluindo banda sem coleções; registrar evidências e verificar que o recurso continua opcional e discreto.
- [ ] 8.2 Conferir telas compactas, texto ampliado, teclado, foco Web, leitor de tela, redução de movimento, áreas seguras e reordenação sem arraste; registrar resultados e verificar ausência de controles inacessíveis ou diálogos encobertos.
- [ ] 8.3 Executar regressão integrada de navegação, gestos do drawer, proteção de edição, rolagem da lista, atualização manual e troca de banda, além de `npm run validate`; verificar aprovação e registrar qualquer limitação comprovada antes de concluir a change.
- [ ] 8.4 Atualizar `docs/CODEX_HANDOFF.md` com escopo entregue, migração, verificações e orientações de distribuição/retorno; verificar `openspec validate organizar-colecoes-do-repertorio --strict --no-interactive` e correspondência entre documentação, requisitos e tarefas concluídas.
