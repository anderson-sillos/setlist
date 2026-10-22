# Tasks

## 1. Dependências e recursos de geração

- [x] 1.1 Adicionar versões compatíveis de `pdf-lib`, `@pdf-lib/fontkit`, `expo-sharing`, `expo-print`, `expo-calendar` e, se usado para a fonte nativa, `expo-font`; verificar instalação reproduzível, resolução de módulos na Web e no nativo e ausência de dependências nativas incompatíveis com o SDK 57.
- [ ] 1.2 Incluir uma fonte local distribuível com variantes necessárias e licença, com carregamento sob demanda; verificar acentos e caracteres dos cenários de exportação, fonte incorporada no PDF e carregamento correto sob o caminho publicado da Web.
- [ ] 1.3 Gerar development builds com os módulos adicionados e conferir exportação de imagem pelo SVG, abertura do formulário nativo documentado e compartilhamento de arquivo; registrar versões, configuração e resultados técnicos no desenho antes de integrar os comandos ao usuário.

## 2. Preparação dos dados e contratos compartilhados

- [x] 2.1 Implementar a cópia de dados autorizados a partir de `Show`, `BandContext` e dos resumos referenciados; verificar com testes músicas repetidas, setlist vazia, planejamento, separadores, música indisponível e ausência de letras, identificadores internos impressos ou dados de integrantes.
- [x] 2.2 Implementar as opções e os defaults de campos definidos no desenho; verificar com testes que TXT, PDF e PNG recebem a mesma seleção, observações começam desmarcadas e durações seguem as regras vigentes de zero, ausência e repetição.
- [ ] 2.3 Integrar as leituras existentes sem consultas de letras ou chamadas por ocorrência; verificar em teste de integração as consultas reutilizadas, dependências pendentes, falhas, perda de acesso e atualização explícita da cópia sem modificar a prévia em andamento.
- [x] 2.4 Documentar o contrato da cópia, a origem das observações e os estados de preparação no módulo; verificar que as interfaces não aceitam conteúdo completo de letras e que os exemplos usam apenas dados previstos nas duas especificações.

## 3. Paginação e arquivos PDF, TXT e PNG

- [x] 3.1 Implementar o modelo de páginas com métricas da fonte, quebra de linhas, cabeçalho e rodapé; verificar com testes blocos junto ao primeiro item, numeração contínua, títulos longos, observação maior que uma página e preservação de todo o conteúdo sem redução progressiva da fonte.
- [ ] 3.2 Implementar o TXT UTF-8 com a seleção de conteúdo e as divisórias textuais; verificar em testes e arquivo real a ordem, acentos, quebras, caracteres de controle e distinção entre duração ausente e zero.
- [ ] 3.3 Implementar o PDF com fonte incorporada e páginas A4; verificar abertura do arquivo gerado, quantidade/dimensões das páginas, correspondência com o modelo e seleção legível de textos com acentos em um visualizador real.
- [ ] 3.4 Implementar o PNG nativo a partir das páginas SVG e da fonte carregada; verificar em development build a assinatura/dimensão dos arquivos, legibilidade e geração de várias páginas sem depender da área visível da tela.
- [ ] 3.5 Implementar o PNG Web por Canvas 2D a partir do mesmo modelo; verificar em teste de navegador a geração após carregar a fonte, dimensões, quantidade de páginas e funcionamento da exportação estática sem APIs de navegador executadas no build.
- [ ] 3.6 Documentar o layout, os nomes de arquivo, a resolução e o comportamento de continuação no módulo de documentos; comparar artefatos dos três formatos com um mesmo cenário contendo repetições e planejamento para confirmar equivalência de conteúdo.

## 4. Entrega local e interface de exportação

- [ ] 4.1 Implementar os adaptadores nativos de cache, compartilhamento e impressão, incluindo salvamento disponível e limpeza com consumidor ativo; verificar arquivo real de cada tipo, cancelamento/falha, indisponibilidade de destino e ausência de confirmação de envio quando a API só informa fechamento do seletor.
- [ ] 4.2 Implementar download Web por `Blob`/`File`, compartilhamento condicionado a `canShare` e impressão isolada; verificar em navegador com e sem suporte que PDF/TXT/PNG são baixáveis, que um novo gesto aciona o compartilhamento e que a impressão não contém a navegação do app.
- [x] 4.3 Criar a rota e a tela de exportação com escolha de formato, opções, prévia acessível e lista de imagens paginadas; verificar por testes de interface os defaults, troca de formato, todas as páginas acessíveis, estado em andamento, nova tentativa e atualização explícita da prévia.
- [ ] 4.4 Integrar `Exportar setlist` ao menu dos detalhes para os três papéis, preservando as ações de edição; verificar com testes de permissões, retorno e abertura repetida que o menu é encerrado antes da preparação e que não existe sobreposição prejudicial de modais.
- [ ] 4.5 Documentar o uso da exportação, a seleção de observações, a entrega por página e os resultados que o sistema consegue confirmar em `docs/EXPORTACAO_SHOWS.md`; conferir as instruções em Web, iOS e Android com os arquivos gerados pelo fluxo.

## 5. Preparação temporal e arquivo de calendário

- [x] 5.1 Implementar o contrato de evento com título, estado, início, local e observações gerais opcionais; verificar em testes a ausência de letras, setlist, integrantes, convidados e credenciais, e os estados permitidos para shows passados, Rascunhos, Prontos e Cancelados.
- [x] 5.2 Implementar a sugestão e a edição do término com fuso explícito e validação de instante posterior ao início; verificar com testes em fusos diferentes duração positiva/parcial, zero, ausência, data inválida e virada da meia-noite sem alterar o início salvo ou persistir término no show.
- [x] 5.3 Implementar a serialização RFC 5545 com UID estável por hash, datas UTC, MIME e extensão corretos; verificar em testes CRLF, escapes, divisão em até 75 octetos por linha física sem romper UTF-8, ausência de injeção de propriedades e um único evento por arquivo.
- [ ] 5.4 Documentar os mapeamentos e limites temporais e a identidade do evento no módulo; conferir um `.ics` real com acentos, múltiplas linhas e evento que cruza a meia-noite em um importador compatível, preservando os instantes.

## 6. Calendário nativo e interface de confirmação

- [ ] 6.1 Implementar o adaptador do formulário nativo pelo caminho documentado para SDK 57, sem ler a agenda pessoal; verificar em development builds iOS e Android o recebimento dos dados, escolha do calendário e retorno, incluindo ausência de aplicativo/suporte e alternativa `.ics`.
- [x] 6.2 Normalizar os resultados do calendário e a entrega do `.ics`; verificar em testes gravação confirmada, cancelamento, erro e retorno Android sem prova de salvamento, garantindo que nenhuma situação dispara uma segunda criação automática.
- [ ] 6.3 Criar a rota/tela de preparação do evento com término, fuso, seleção de observações, aviso de cópia pontual e confirmação; verificar com testes de interface validação dos campos, preservação de valores na falha e download Web mesmo sem compartilhamento de `.ics`.
- [ ] 6.4 Integrar `Adicionar ao calendário` aos detalhes, incluindo motivo acessível para Cancelado; verificar os três papéis, fechamento do menu, teclado, Voltar e retorno do formulário do sistema ao mesmo show sem alterar seu cadastro.
- [ ] 6.5 Acrescentar ao guia de exportação o fluxo da agenda, importação de `.ics`, confirmação disponível por plataforma e possibilidade de duplicatas; conferir as instruções com um calendário pessoal real e manter explícita a independência das cópias.

## 7. Validação integrada da entrega

- [x] 7.1 Executar os checks de formatação, lint, TypeScript, testes pertinentes dos novos módulos e regressões de detalhes/navegação definidos pelo projeto; registrar comandos e resultados e corrigir as falhas antes de considerar a implementação concluída.
- [ ] 7.2 Exercitar a matriz Web, iOS e Android com show curto, show de muitas páginas, repetições, textos extensos, tempos ausentes, cancelamento e mudança de acesso; registrar abertura dos arquivos, impressão, memória na geração de PNG e recuperação das falhas nas três plataformas.
- [ ] 7.3 Conferir acessibilidade com fonte ampliada, teclado e leitor de tela nas duas preparações, inclusive prévia textual, paginação, mensagens de validação e retorno de foco; registrar dispositivos/navegadores usados e corrigir cortes ou controles inacessíveis.
- [ ] 7.4 Conferir importação de `.ics` e criação pelo formulário em calendários reais disponíveis nas plataformas suportadas, incluindo um calendário em outro fuso; registrar horários efetivos, comportamento de nova adição e limitações reais de confirmação ou deduplicação.
- [ ] 7.5 Atualizar changelog e notas de release com as duas funcionalidades e suas limitações verificadas; conferir a identificação comum de versão/commit e a necessidade dos novos builds nativos pelo processo de release, sem reusar tags de candidatas já geradas.

## Registro de andamento — 22/10/2026

### Builds de desenvolvimento concluídos

- iOS Simulator: versão `1.0.0 (7)`, perfil `development-ios-simulator`, build EAS [`37c4713b-a895-412d-9fa2-71062e75b91c`](https://expo.dev/accounts/anderson-silloss-team/projects/setlist/builds/37c4713b-a895-412d-9fa2-71062e75b91c). Instalado e aberto no iPhone 16 Pro Simulator com iOS 18.3.
- Android: versão `1.0.0 (9)`, perfil `development-android`, build EAS [`c530cb70-af90-4fd3-91e9-9fd160ff8af5`](https://expo.dev/accounts/anderson-silloss-team/projects/setlist/builds/c530cb70-af90-4fd3-91e9-9fd160ff8af5). APK instalado no dispositivo `SM_S731B`.
- A exportação estática da Web e a preparação local para GitHub Pages também foram concluídas; isso não representa publicação da Web.

### Pendências de validação

Os builds confirmam compilação e instalação, mas os fluxos novos ainda precisam ser exercitados manualmente. Permanecem pendentes a geração e abertura de arquivos TXT/PDF/PNG, compartilhamento e impressão, a geração nativa de PNG, a abertura e confirmação do formulário de calendário, a importação de `.ics`, a matriz funcional completa e a conferência de acessibilidade. Os itens correspondentes acima permanecem desmarcados até essas verificações serem realizadas.
