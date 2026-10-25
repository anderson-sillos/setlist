# Histórico de versões

## 1.1.0 — candidata `v1.1.0-rc.1` em preparação

Entrega posterior a `v1.0.2-rc.1`, reunindo as PRs #80, #81, #82, #83 e #84
e as correções do editor da branch `fix/song-editor-resume-refresh`. A versão
comum de Android, iOS e Web passa a `1.1.0`, conforme a regra de incremento para
novas funcionalidades em `docs/RELEASE_PROCESS.md`.

### Cadastro e edição de músicas

- Busca assistida pelo botão mágico para completar o rascunho com título,
  artista, duração e letra, priorizando os tempos sincronizados quando válidos.
  Resultados diferentes podem ser escolhidos em uma lista compacta; divergências
  de duração exigem a decisão da pessoa antes de assumir os tempos.
- Feedback por etapas, frases variadas, cancelamento e até três tentativas
  para indisponibilidade temporária, sem salvar automaticamente a música.
- Capitalização conservadora dos nomes e organização dos blocos da letra,
  preservando o conteúdo já preenchido e as edições do rascunho.
- Músicas instrumentais possuem estado próprio e deixam de aparecer como
  pendentes de letra nos filtros e avisos de prontidão.
- O botão mágico fica ao lado do título e acompanha a rolagem até o limite
  seguro do cabeçalho, mantendo-se acessível com o teclado aberto. A animação
  usa o driver nativo no iOS e Android.
- Guia de formatação recolhido em um botão de ajuda, campo de letra com altura
  de 420 pontos e remoção da borda externa redundante.
- O retorno ao app revalida os dados sem apagar o conteúdo da tela ativa.

### Acompanhamento da letra sincronizada

- Cronômetro manual na letra em tela cheia, com início, pausa, retomada,
  reinício e ajustes de cinco segundos, sem reprodução de áudio.
- Barra de progresso com arraste, seleção na trilha e teclado; tocar em um
  verso inativo posiciona o cronômetro no horário desse trecho.
- Linha atual destacada em negrito e opacidade total, com centralização e
  rolagem suave. A rolagem manual suspende o acompanhamento; o botão
  Acompanhar permite retomá-lo.
- Cabeçalho compacto e controles translúcidos, respeitando as áreas seguras
  do iOS e Android e a largura de leitura em tablets e na Web.

### Dependências e documentos

- Zod `4.6.7` na aplicação e no Expo CLI, com os ajustes das PRs #80 e #83.
- Undici `7.30.1` nas ferramentas do scheduler, pela PR #82.
- O GitHub confirmou os alertas #33 e #34 como corrigidos. O alerta #9
  (`node-forge`) continua aberto, conforme `docs/DEPENDENCY_SECURITY.md`.
- A candidata inclui a revisão dos Termos de Uso sobre a busca assistida,
  preservando a responsabilidade sobre os direitos do conteúdo sugerido.

### Preparação da distribuição

- Notas completas e roteiro da candidata em
  [docs/releases/v1.1.0-rc.1.md](docs/releases/v1.1.0-rc.1.md).
- Antes de salvar músicas instrumentais em produção, conferir as migrações
  `20261024100000` e `20261024100100` e aplicá-las, nessa ordem, se pendentes.
- A tag deve apontar para o commit integrado à `main`. Os novos builds AAB/IPA
  e o export Web deverão usar esse mesmo commit; os contadores serão
  registrados após sua atribuição real pelo EAS.
- A validação manual do cronômetro foi confirmada em Web, Android, iPad e
  iPhone. A tarefa 6.3 da busca assistida permanece pendente no arquivo da
  change; as últimas correções do editor e os artefatos de produção ainda
  precisam de conferência. Não foram gerados novos builds nesta preparação.

## 1.0.2 — pré-release `v1.0.2-rc.1`

Esta candidata substitui `v1.0.1-rc.2` após a falha reportada no envio do build
iOS `1.0.1 (9)`. A versão do aplicativo é `1.0.2`; a tag anterior permanece
imutável e não será reutilizada. Esta candidata inclui as PRs #77, #76, #78 e #79.

### Links das lojas

- A página Web de download agora aponta diretamente para Setlist na App Store
  e no Google Play, sem depender da busca pelo nome do app.
- O iOS `1.0.2 (10)` foi enviado ao App Store Connect e o Android `1.0.2 (11)`
  à faixa Alpha do Google Play. Os uploads não confirmam aprovação ou
  disponibilidade pública nas lojas.
- A candidata Web foi publicada pelo GitHub Pages no mesmo commit
  `40c3d22153e3fbe217e268cbbd3641c9cd93895f` da tag e dos builds nativos.

### Exportação de shows e calendário pessoal

- Exportação do setlist em PDF A4 com texto selecionável, TXT UTF-8 e PNG por
  página; a pessoa escolhe os metadados e observações que deseja incluir. Letras
  nunca são exportadas.
- Prévia estável, atualização explícita dos dados, paginação e zoom; a escala da
  prévia não altera os arquivos gerados.
- Entrega por compartilhamento, download ou impressão conforme a plataforma.
- Cópia pontual do show no formulário de calendário do iOS e Android, com
  término estimado pelas durações do setlist (duas horas quando ausentes) e
  ajustável no calendário. O arquivo `.ics` pode ser importado ou compartilhado.
- A cópia não sincroniza alterações posteriores e pode gerar duplicatas. O
  término é uma estimativa; no Android, o Setlist não recebe confirmação de que
  o evento foi salvo.
- A validação funcional, de acessibilidade e de calendários reais foi concluída
  conforme confirmação do responsável. Builds de produção iOS e Android e a
  exportação Web devem usar o mesmo commit final desta candidata.

## 1.0.0 — candidata `v1.0.0-rc.5` em preparação

### Correções no cadastro de músicas e shows

- A tela de nova música deixa de ficar vazia quando uma consulta de música
  desativada falha ao recuperar dados em segundo plano; erros de carregamento
  continuam visíveis ao editar uma música existente.
- As sugestões de artista consideram o repertório da banda atual, incluindo
  músicas arquivadas, sem misturar artistas de outras bandas.
- As listas de autocomplete aparecem em ordem alfabética, fecham após uma
  seleção e voltam ao entrar no campo ou editar o texto.
- A lista de locais sugeridos para um show permanece visível com a rolagem
  ajustada ao espaço disponível quando o teclado abre.
- O aviso de ação de demonstração passa a se chamar `ActionNotice`.

Os builds Android/iOS e a exportação Web serão gerados a partir do commit
integrado e identificado pela tag imutável `v1.0.0-rc.5`. Os artefatos e a
validação das lojas ficam pendentes até essa etapa.

## 1.0.0 — candidata `v1.0.0-rc.4` em andamento

### Correção do indicador de atualização

- Corrigido o círculo nativo de atualização que podia continuar visível no iOS após retornar a uma tela, mesmo com as consultas concluídas.
- A instância do `RefreshControl` é recriada nas transições do estado de atualização no iOS. O refresh automático mostra o círculo durante revalidação somente quando o cache atingiu 60 segundos; cache recente é revalidado em silêncio. O gesto manual mantém o feedback.
- A correção foi validada no simulador iPhone 16 Pro em fluxos de edição e navegação entre Música, Shows, Repertório e Banda. Sete suítes, com 105 testes, passaram; typecheck, ESLint, formatação e `git diff --check` também passaram.
- A PR #44 foi integrada à `main` por squash em 19/10/2026
  (`893a633b25a3d3fb33f5c20a66e473df399f2504`). A candidata e os builds ainda
  serão gerados a partir da tag RC.4.

### Otimização Android

- Habilitada minificação R8 com o preset `proguard-android-optimize.txt` e
  redução otimizada de recursos nos builds Android de release.
- O EAS coleta o `mapping.txt` nos perfis AAB e APK de validação; o CI confere
  o Gradle gerado e falha se as opções ou a coleta forem removidas.
- A validação final do AAB, APK e do mapa correspondente ao `versionCode`
  continuará pendente até a geração e conferência dos artefatos RC.4.

## 1.0.0 — pré-release `v1.0.0-rc.3`

Primeira versão pública para Web, Android e iOS. A versão exibida no aplicativo
é `1.0.0` nas três plataformas. O candidato anterior `v1.0.0-rc.2`, no commit
`93c21c397a50e1d0a0c2a9bf572582989f67fa6a`, foi enviado aos canais de teste
com contadores `4`. Esta candidata foi gerada do commit
`aab57d85b00c4e7852a40f7d9497d015d67c54d7`, com builds `1.0.0 (5)` para
Android e iOS e Web publicada a partir da mesma tag.
A [pré-release no GitHub](https://github.com/anderson-sillos/setlist/releases/tag/v1.0.0-rc.3)
contém as notas e o manifesto dos builds.

### Funcionalidades

- Login Google/Apple, perfil, bandas, papéis e convites.
- Repertório, músicas e letras estáticas compartilhadas.
- Shows, calendário, blocos e edição de setlists.
- Interface Content-First Darkness, navegação responsiva e proteção de alterações
  não salvas.
- Tela Sobre o Setlist compacta, com versão do código/instalada, build, ambiente,
  commit quando disponível, links legais e acesso ao código-fonte no GitHub.

### Segurança

- Atualização da dependência transitiva `shell-quote` de `1.10.0` para `1.12.0`,
  corrigindo o alerta crítico `GHSA-pqg4-j6r4-53mv`.
- Registro das dependências `node-forge`, `braces` e `sprintf-js` que continuam
  afetadas por avisos sem versão corrigida publicada, com ações de acompanhamento
  em `docs/DEPENDENCY_SECURITY.md`.

### Correções acumuladas até o candidato `rc.2`

- Ajustado o comportamento do teclado em formulários e editores para manter os
  campos acessíveis durante a rolagem e permitir dispensar o teclado.
- Mantidos acessíveis os botões de ação de diálogos e protegidos rascunhos de
  denúncia contra descarte acidental.
- Corrigida uma corrida de navegação durante o logout e ampliados os diagnósticos
  de sessão.
- Melhorados os layouts de autenticação e conta no iPad.
- Corrigida a rolagem do editor de blocos de shows e modernizados os gestos de
  arrastar dos editores.
- Corrigido o corte dos rótulos de botões no Android.

### Melhorias do candidato `rc.3`

- Identificação das chamadas Supabase por versão do Setlist, plataforma, sistema
  operacional e ambiente nos cabeçalhos de cliente.
- Leituras agregadas para Minhas bandas, contexto da banda e duração dos shows,
  evitando carregar a lista inteira de músicas ao abrir Shows.
- Carregamento sob demanda dos detalhes, reutilização do cache recente e
  deduplicação de revalidações de tela.
- Indicador de atualização somente durante revalidações necessárias e reserva
  estável de espaço para os controles de Shows e Repertório desde a abertura.
- Migrações correspondentes: `20261015100000` e `20261015110000`.
- As duas migrações foram aplicadas em `setlist-prod` em 17/10/2026; o dry-run
  posterior confirmou que o banco está atualizado.

### Distribuição

- Versão comum controlada no `app.json` e conferida no CI.
- Contadores Android/iOS gerenciados pelo EAS com incremento automático.
- Builds `1.0.0 (5)` vinculados à tag imutável `v1.0.0-rc.3` e ao commit
  `aab57d85b00c4e7852a40f7d9497d015d67c54d7`.
- O AAB Android foi enviado com sucesso pelo EAS à trilha Alpha/closed testing do
  Google Play. O IPA iOS foi enviado ao App Store Connect e está em processamento
  pela Apple; após o processamento, ficará disponível para conferência no TestFlight.
- A candidata Web foi publicada em `https://setlistbr.app.br` pelo workflow
  [GitHub Pages #39051191669](https://github.com/anderson-sillos/setlist/actions/runs/39051191669).
  O `/release.json` público confirma tag, versão e commit.
- Migrações `20261015100000` e `20261015110000` aplicadas em `setlist-prod`.
- Conferência de versões antes de iniciar o Expo, exportar Web e executar builds
  EAS; atalhos de produção/validação também exigem a tag e o commit da entrega.
- Diagnóstico no desenvolvimento para manifestos e clients desatualizados,
  preservando a identificação do código a partir do `app.json` do bundle atual.

### Conferências pendentes

- Aguardar o processamento do build iOS pela Apple e confirmar sua disponibilidade no
  TestFlight.
- Fazer validação funcional da candidata Web e dos builds Android/iOS instalados em
  aparelhos; as validações permanecem `pending` no manifesto.
- Conferir no Play Console o estado da análise/publicação da trilha Alpha e concluir
  os demais itens operacionais, legais e das lojas do grupo 11 de
  `openspec/changes/definir-mvp-setlist/tasks.md`.

O modo palco completo, a sincronização manual com YouTube e os pacotes offline
permanecem fora desta primeira entrega. O APK histórico `0.1.0`, baseado em
`b7dc8b2`, foi validado pelo responsável e não contém a nova tela Sobre.
