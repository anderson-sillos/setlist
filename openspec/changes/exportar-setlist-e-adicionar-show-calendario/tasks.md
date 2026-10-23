# Tasks

## 1. Dependências e recursos de geração

- [x] 1.1 Adicionar versões compatíveis de `pdf-lib`, `@pdf-lib/fontkit`, `expo-sharing`, `expo-print`, `expo-calendar` e, se usado para a fonte nativa, `expo-font`; verificar instalação reproduzível, resolução de módulos na Web e no nativo e ausência de dependências nativas incompatíveis com o SDK 57.
- [x] 1.2 Incluir uma fonte local distribuível com variantes necessárias e licença, com carregamento sob demanda.
- [x] 1.3 Gerar development builds com os módulos adicionados e registrar versões, configuração e resultados técnicos no desenho. A validação funcional nas plataformas está na tarefa 7.2.

## 2. Preparação dos dados e contratos compartilhados

- [x] 2.1 Implementar a cópia de dados autorizados a partir de `Show`, `BandContext` e dos resumos referenciados; verificar com testes músicas repetidas, setlist vazia, planejamento, separadores, música indisponível e ausência de letras, identificadores internos impressos ou dados de integrantes.
- [x] 2.2 Implementar as opções e os defaults de campos definidos no desenho; verificar com testes que TXT, PDF e PNG recebem a mesma seleção, observações começam desmarcadas e durações seguem as regras vigentes de zero, ausência e repetição.
- [x] 2.3 Integrar as leituras existentes sem consultas de letras ou chamadas por ocorrência; manter a cópia estável até uma atualização explícita da prévia.
- [x] 2.4 Documentar o contrato da cópia, a origem das observações e os estados de preparação no módulo; verificar que as interfaces não aceitam conteúdo completo de letras e que os exemplos usam apenas dados previstos nas duas especificações.

## 3. Paginação e arquivos PDF, TXT e PNG

- [x] 3.1 Implementar o modelo de páginas com métricas da fonte, quebra de linhas, cabeçalho e rodapé; verificar com testes blocos junto ao primeiro item, numeração contínua, títulos longos, observação maior que uma página e preservação de todo o conteúdo sem redução progressiva da fonte.
- [x] 3.2 Implementar o TXT UTF-8 com a seleção de conteúdo e as divisórias textuais.
- [x] 3.3 Implementar o PDF com fonte incorporada e páginas A4.
- [x] 3.4 Implementar o PNG nativo a partir das páginas SVG e da fonte carregada.
- [x] 3.5 Implementar o PNG Web por Canvas 2D a partir do mesmo modelo.
- [x] 3.6 Documentar no módulo de documentos o layout, os nomes de arquivo, a resolução e o comportamento de continuação.
- [x] 3.7 Ajustar os metadados do documento exportado: remover o campo impresso de fuso, usar o rótulo `Situação` e exibir a data/hora de geração sem rótulo no rodapé à direita (ou como última linha no TXT).
- [x] 3.8 Manter opaca a superfície SVG usada na captura PNG nativa para que o fundo branco e o conteúdo não sejam exportados como transparência.

## 4. Entrega local e interface de exportação

- [x] 4.1 Implementar os adaptadores nativos de cache, compartilhamento e impressão, incluindo limpeza com consumidor ativo.
- [x] 4.2 Implementar download Web por `Blob`/`File`, compartilhamento condicionado a `canShare` e impressão isolada.
- [x] 4.3 Criar a rota e a tela de exportação com escolha de formato, opções, prévia acessível e lista de imagens paginadas; verificar por testes de interface os defaults, troca de formato, todas as páginas acessíveis, estado em andamento, nova tentativa e atualização explícita da prévia.
- [x] 4.4 Integrar `Exportar setlist` ao menu dos detalhes para os três papéis, preservando as ações de edição e encerrando o menu antes da navegação.
- [x] 4.5 Documentar o uso da exportação, a seleção de observações, o zoom da prévia, a entrega por página e os resultados que o sistema consegue confirmar em `docs/EXPORTACAO_SHOWS.md`.
- [x] 4.6 Adicionar à prévia os controles `−`, percentual atual, `+` e `Ajustar à largura`, com passos de 25 pontos percentuais; preservar a escala ao paginar, permitir rolagem horizontal quando ampliada e manter inalterado o layout A4 dos arquivos gerados.

## 5. Preparação temporal e arquivo de calendário

- [x] 5.1 Implementar o contrato de evento com título, estado, início, local e observações gerais opcionais; verificar em testes a ausência de letras, setlist, integrantes, convidados e credenciais, e os estados permitidos para shows passados, Rascunhos, Prontos e Cancelados.
- [x] 5.2 Calcular o término da cópia sem edição nesta tela: usar início mais a duração positiva do setlist ou duas horas quando ela estiver ausente, zero ou inválida; identificar a estimativa, manter conversão no fuso explícito e permitir ajustes no formulário nativo sem alterar o show salvo.
- [x] 5.3 Implementar a serialização RFC 5545 com UID estável por hash, datas UTC, MIME e extensão corretos; verificar em testes CRLF, escapes, divisão em até 75 octetos por linha física sem romper UTF-8, ausência de injeção de propriedades e um único evento por arquivo.
- [x] 5.4 Documentar no módulo os mapeamentos do `.ics`, o uso de UTC, o limite de fuso e a identidade estável do evento.

## 6. Calendário nativo e interface de confirmação

- [x] 6.1 Implementar o adaptador do formulário nativo pelo caminho documentado para SDK 57, sem ler a agenda pessoal.
- [x] 6.2 Normalizar os resultados do calendário e a entrega do `.ics`; verificar em testes gravação confirmada, cancelamento, erro e retorno Android sem prova de salvamento, garantindo que nenhuma situação dispara uma segunda criação automática.
- [x] 6.3 Criar a rota/tela de preparação do evento com término estimado, fuso, seleção de observações, aviso de cópia pontual e confirmação no calendário nativo.
- [x] 6.4 Integrar `Adicionar ao calendário` aos detalhes, incluindo o motivo acessível para shows Cancelados.
- [x] 6.5 Documentar no guia de exportação o fluxo da agenda, importação de `.ics`, confirmação disponível por plataforma e possibilidade de duplicatas.
- [x] 6.6 Ajustar os rótulos e ícones dos botões, limitar somente a largura do grupo de ações, abrir o seletor automaticamente após gerar `.ics` e manter a preparação visível ao retornar do seletor enquanto as consultas atualizam.

## 7. Validação integrada da entrega

- [x] 7.1 Executar os checks de formatação, lint, TypeScript, testes pertinentes dos novos módulos e regressões de detalhes/navegação definidos pelo projeto após as alterações recentes; registrar comandos e resultados e corrigir as falhas antes de considerar a implementação concluída.
- [x] 7.2 Exercitar a matriz Web, iOS e Android com show curto, show de muitas páginas, repetições, textos extensos, tempos ausentes, cancelamento e mudança de acesso; validar prévia ajustada à largura e ampliada, escala preservada ao paginar, conteúdo sem cortes e arquivos A4 invariáveis; registrar abertura dos arquivos, impressão, memória na geração de PNG e recuperação das falhas nas três plataformas.
- [x] 7.3 Conferir acessibilidade com fonte ampliada, teclado e leitor de tela nas duas preparações, inclusive prévia textual, paginação, mensagens de validação e retorno de foco; validar rótulos acessíveis e estados dos controles de zoom; registrar dispositivos/navegadores usados e corrigir cortes ou controles inacessíveis.
- [x] 7.4 Conferir importação de `.ics` e criação pelo formulário em calendários reais disponíveis nas plataformas suportadas, incluindo um calendário em outro fuso; registrar horários efetivos, comportamento de nova adição e limitações reais de confirmação ou deduplicação.
- [x] 7.5 Atualizar changelog e notas de release com as duas funcionalidades e suas limitações verificadas; conferir a identificação comum de versão/commit e a necessidade dos novos builds nativos pelo processo de release, sem reusar tags de candidatas já geradas.

## Registro de andamento — 22/10/2026

### Builds de desenvolvimento concluídos

- iOS Simulator: versão `1.0.0 (7)`, perfil `development-ios-simulator`, build EAS [`37c4713b-a895-412d-9fa2-71062e75b91c`](https://expo.dev/accounts/anderson-silloss-team/projects/setlist/builds/37c4713b-a895-412d-9fa2-71062e75b91c). Instalado e aberto no iPhone 16 Pro Simulator com iOS 18.3.
- Android: versão `1.0.0 (9)`, perfil `development-android`, build EAS [`c530cb70-af90-4fd3-91e9-9fd160ff8af5`](https://expo.dev/accounts/anderson-silloss-team/projects/setlist/builds/c530cb70-af90-4fd3-91e9-9fd160ff8af5). APK instalado no dispositivo `SM_S731B`.
- A exportação estática da Web e a preparação local para GitHub Pages também foram concluídas; isso não representa publicação da Web.

### Situação naquela data

Naquele registro, os builds confirmavam compilação e instalação, mas ainda não
havia sido informada a conclusão dos testes manuais. As validações foram
concluídas posteriormente e estão registradas em 23/10/2026.

## Registro de andamento — 23/10/2026

- O responsável confirmou que as validações funcionais multiplataforma,
  acessibilidade e calendários reais dos itens 7.2–7.4 foram concluídas. Os
  detalhes dos dispositivos, navegadores, calendários e evidências não foram
  incluídos nesta confirmação.
- `npm run format:check`, `npm run lint` e `npm run typecheck` passaram.
- As 12 suítes focadas em exportação, calendário, detalhes e navegação passaram
  (72 testes). A primeira execução apontou duas consultas ambíguas em
  `ShowCalendarScreen-test.tsx`, pois o título da tela e o botão compartilham
  o mesmo texto. Os testes agora localizam o controle por papel e nome
  acessível; a execução seguinte passou integralmente.
- A política de release define incremento minor para nova funcionalidade; esta
  entrega prepara a versão `1.1.0`, candidata `v1.1.0-rc.1`. A tag será criada
  somente após integração, no commit final da `main`. Builds de produção iOS e
  Android e exportação Web devem usar esse mesmo commit/tag; os builds de
  desenvolvimento anteriores não os substituem.
