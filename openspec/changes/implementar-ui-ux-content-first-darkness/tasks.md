# Tasks

## 1. Fundação do sistema visual

- [ ] 1.1 Definir tokens semânticos da paleta Content-First Darkness e aliases temporários, migrando primeiro os consumidores centrais sem alterar em lote o sentido antigo de `surface`; verificar pares e papéis com `npm test -- --runInBand src/theme/__tests__/color-contrast-test.ts`.
- [ ] 1.2 Atualizar tipografia, espaçamentos, raios e medidas de layout a partir da proposta; confirmar breakpoints e alvos mínimos com `npm test -- --runInBand src/theme/__tests__/responsive-test.ts`.
- [ ] 1.3 Estabelecer matriz de variantes e estados de controles reutilizáveis com os novos tokens; validar os estados por componente nos testes em `src/components/ui/__tests__/`.

## 2. Componentes e feedback comuns

- [ ] 2.1 Migrar `AppText`, `AppButton`, `Card`, `StatusPill`, inputs e controles de listas para papéis semânticos e estados visíveis, preservando expansão e alvos de toque; verificar com `npm test -- --runInBand src/components/ui/__tests__/AppButton-test.tsx src/components/ui/__tests__/AutocompleteField-test.tsx src/components/ui/__tests__/ListControls-test.tsx`.
- [ ] 2.2 Harmonizar popups, menus, estados vazios, carregamento, erro e sucesso com texto recuperável e foco apropriado; verificar com `npm test -- --runInBand src/components/feedback/__tests__/Feedback-test.tsx` e cobrir os estados alterados.

## 3. Ícones, marca e assets

- [ ] 3.1 Revisar os 43 identificadores do `AppIcon` segundo o inventário e separar fechar, excluir, remover vínculo, renovar/restaurar, atualizar e reabrir; verificar mapa, tamanhos, acessibilidade e composições em `npm test -- --runInBand src/components/ui/__tests__/AppIcon-test.tsx`.
- [ ] 3.2 Aplicar raio proporcional de 25% ao fundo violeta do logo nos usos de interface sem alterar nota, proporção ou cores; gerar assets com `npm run assets:icons` e conferir visualmente login, favicon e exportações nativas sem duplicar a máscara da plataforma.
- [ ] 3.3 Alinhar barra inferior, menu lateral e drawer em slots/rótulos/seleção, mantendo ordem, alvos de toque e ação atual do Palco; validar em dimensões compacta, tablet e desktop nos testes de navegação/responsividade.

## 4. Shell, login e bandas

- [ ] 4.1 Migrar shell, cabeçalho, navegação e superfícies de Minhas bandas para paleta e hierarquia propostas, preservando refresh/contexto de seleção; verificar com `npm test -- --runInBand src/features/navigation/__tests__/navigationShell-test.tsx src/features/bands/__tests__/BandsScreen-test.tsx`.
- [ ] 4.2 Migrar o login, disclaimer, documentos, versão e botões sociais para fundo escuro e alinhamento responsivo, preservando assets oficiais e fluxos de autenticação existentes; verificar com `npm test -- --runInBand src/features/auth/__tests__/AuthScreen-test.tsx src/features/auth/__tests__/AuthGate-test.tsx`.
- [ ] 4.3 Conferir a navegação inicial e estado vazio/erro de bandas em Web, Android e iOS; verificar visualmente nas larguras móvel, tablet e desktop sem dados de banda e com lista preenchida.

## 5. Repertório, música e leitura

- [ ] 5.1 Migrar lista, busca, filtros, duração, estados, detalhe e ações do repertório segundo a hierarquia proposta, mantendo consultas e permissões atuais; verificar com `npm test -- --runInBand src/features/repertoire/__tests__/RepertoireScreen-test.tsx src/features/repertoire/__tests__/SongDetailScreen-test.tsx`.
- [ ] 5.2 Migrar edição de música/letra, campos, blocos, observações, erro do filtro e leitura em tela cheia sem alterar seu formato nem a proteção de moderação; verificar com `npm test -- --runInBand src/features/repertoire/__tests__/SongEditorScreen-test.tsx src/features/repertoire/__tests__/LyricDocumentEditor-test.tsx src/features/repertoire/__tests__/SongDetailScreen-test.tsx`.
- [ ] 5.3 Inspecionar quebra de nomes longos, letra, fonte ampliada, teclado e listas em Web, Android e iOS; verificar rolagem, atualização e permanência dos dados após erro.

## 6. Shows, calendário e setlist

- [ ] 6.1 Migrar lista, busca, filtros, ordenação, calendário, datas, status e detalhe de show ao sistema visual preservando semântica de feriados e permissões; verificar com `npm test -- --runInBand src/features/shows/__tests__/ShowsScreen-test.tsx src/features/shows/__tests__/ShowDetailScreen-test.tsx`.
- [ ] 6.2 Migrar editor de setlist, blocos, alça, reordenação, observações, separadores e durações com estados claros; verificar preservação de ordem e alternativa textual nos testes de editor.
- [ ] 6.3 Inspecionar scroll, pull-to-refresh, painel de calendário e arraste em celular/tablet/desktop; verificar que atualização, filtragem e ordenação existentes mantêm o resultado.

## 7. Banda, conta e mensagens

- [ ] 7.1 Migrar integrantes, papéis, convites, denúncia, perfil/conta, menus e confirmações, preservando visibilidade condicional por permissão e compartilhamento de convite existente; verificar com `npm test -- --runInBand src/features/bands/__tests__ src/features/account/__tests__ src/features/moderation/__tests__`.
- [ ] 7.2 Migrar estados sem acesso, indisponibilidade e falha nas demais telas, mantendo Palco em alinhamento normal e abrindo o popup atual; verificar que nenhum conteúdo ou controle novo contorna autorização.
- [ ] 7.3 Rever os contrastes e nomes acessíveis das ações contextuais/discretas, incluindo denúncia e destruição; validar teclado, leitor de tela e toque em três plataformas.

## 8. Navegação, contexto e transições

- [ ] 8.1 Configurar Stacks raiz e aninhados por tipo de tela, com apresentação nativa para detalhe/retorno e fade breve para troca de seção, sem animação de tela inteira em refresh; validar rotas internas, deep links e cancelamento nativo nos fluxos manuais por plataforma.
- [ ] 8.2 Unificar a resolução de destino de barra, menu e retorno, usando memória por banda/seção para rota, busca, filtros e rolagem; verificar com `npm test -- --runInBand src/features/navigation/__tests__/navigationMemory-test.tsx src/features/navigation/__tests__/navigationIntegration-test.tsx src/features/navigation/__tests__/navigationRoutes-test.ts`.
- [ ] 8.3 Fazer Voltar fechar primeiro drawer/menu/popup quando aberto, respeitar histórico do navegador na Web e comportamento do teclado/Voltar do Android; verificar a sequência de retorno em Web, development builds Android e iOS.

## 9. Edições não salvas

- [ ] 9.1 Derivar estado alterado nos editores de música/letra, dados do show e setlist; confirmar que gravar sucesso redefine a referência e falha mantém conteúdo editável nos testes dos editores.
- [ ] 9.2 Proteger saída por botão, navegação entre áreas, gesto e Voltar do sistema com popup para continuar editando ou descartar; verificar que continuar preserva valores e confirmar descarte remove só mudanças locais.
- [ ] 9.3 Impedir envio duplicado e descarte silencioso durante salvamento; verificar operações em andamento/falha e documentar a limitação real do browser ao fechar ou recarregar aba.

## 10. Movimento, gestos e acessibilidade

- [ ] 10.1 Aplicar duração de superfície, camada e navegação proposta a botão, menu, popup, seleção e carregamento sem bloquear operação; verificar foco, estabilidade da lista e resultado antes/depois de cada efeito.
- [ ] 10.2 Respeitar redução de movimento do sistema e `prefers-reduced-motion` na Web para transições próprias e nativas; alternar preferência durante a sessão e verificar que funções, foco, feedback e cancelamento permanecem disponíveis.
- [ ] 10.3 Arbitrar o gesto de abertura do drawer com retorno do sistema, scroll, refresh, texto e drag; verificar manualmente conflitos na faixa de borda em iOS, Android com navegação por gesto e botão, e Web/trackpad.
- [ ] 10.4 Manter deslize de troca de seções desativado por padrão e executar o piloto de Think Aloud previsto no roteiro; entregar registro de descoberta, destino esperado, cancelamento, alternativas e conflitos com rolagem/sistema.
- [ ] 10.5 Se e somente se os critérios do piloto forem demonstrados, habilitar deslize Shows ↔ Repertório ↔ Banda em área autorizada e testar cancelamento/memória/gestos concorrentes. Se falhar ou não for realizado, registrar decisão, manter desligado e verificar que a troca por botões continua funcional.

## 11. Revisão integrada multiplataforma

- [ ] 11.1 Executar testes automatizados afetados, lint e typecheck; resolver falhas introduzidas nas etapas sem alterar escopo de domínio.
- [ ] 11.2 Fazer inspeção visual e funcional em Web, Android e iOS nos fluxos de login, banda, repertório/letra, show/setlist, popup, edição e retorno; incluir fontes ampliadas, teclado, landscape, VoiceOver/TalkBack e preferência de movimento reduzido.
- [ ] 11.3 Conferir regressões do refresh, cache/memória, atualização restrita à tela e Palco indisponível; validar que estado visual/navegação não altera permissões, requests ou conteúdo.
- [ ] 11.4 Atualizar a proposta/catalogação com diferenças observadas durante a implementação e deixar explícitos os itens visuais/interativos que dependem do piloto de usabilidade; verificar referências e decisões antes de concluir a change.
