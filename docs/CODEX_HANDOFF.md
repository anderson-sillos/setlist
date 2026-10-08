# Handoff do Codex — Setlist

Este documento preserva o contexto necessário para que uma nova sessão do Codex continue o projeto sem reconstruir decisões já confirmadas. Ele resume o histórico de trabalho; os artefatos OpenSpec continuam sendo a fonte normativa do produto.

## Atualização de 7 de outubro de 2026 — Sobre e processos na PR #29

- O responsável solicitou commit e atualização da PR. A revisão sucede `b42aa6d` na branch `feat/release-versioning` e compõe o commit deste registro. Inclui Sobre compacta com link do código-fonte, origem da versão corrigida para clients antigos, diagnóstico de desenvolvimento e proteções dos comandos npm/EAS descritos abaixo. O changelog passa a registrar essas melhorias para o candidato `1.0.0`.
- A PR correspondente é #29, `https://github.com/anderson-sillos/setlist/pull/29`, com base `main`; a integração e os builds do primeiro candidato continuam pendentes. A solicitação atual é de commit/envio/atualização da descrição, sem merge ou geração de binários. Os registros de trabalho local nas duas seções abaixo descrevem o estado anterior a este envio.
- Evidências disponíveis: 26 testes de Sobre/versão passaram antes da inclusão do diagnóstico e dos novos hooks; conferência física de Sobre no Android, link do GitHub e metadados iOS/Android concluída. Conferência de versão `1.0.0`, tipos, lint e formatação das alterações passou. Não foi executada nova suíte nesta etapa de commit; o resultado do CI do novo SHA deve ser acompanhado separadamente das evidências anteriores.
- Usar acesso elevado no commit, push e atualização da PR; confirmar que o SHA remoto da branch e o `headRefOid` da PR são o mesmo commit e que a descrição foi gravada. Manter autor com `asillos@gmail.com`.

## Preparação de 7 de outubro de 2026 — versão 1.0.0 e primeiro Release

- O responsável solicitou um processo comum de versões Android/iOS/Web e o início do primeiro Release; definiu `1.0.0` como primeira versão pública e pediu a tela Sobre o Setlist. A preparação está na branch `feat/release-versioning`; as etapas de integração e geração do candidato continuam pendentes até a conferência remota.
- `app.json` é a fonte da versão, sincronizada com `package.json` e `package-lock.json` por `npm run release:version -- X.Y.Z`. O CI executa `release:check`. Contadores nativos são independentes, com `appVersionSource: remote` e incremento automático nos perfis de produção. Os contadores remotos foram inicializados em `1` para ambas as plataformas e conferidos com `build:version:get`; novos builds devem incrementá-los, sem reaproveitar o contador de um artefato anterior.
- O processo documentado em `docs/RELEASE_PROCESS.md` usa tags imutáveis, checkout limpo, ambiente EAS de produção, manifesto de versão/commit/builds e Release inicialmente em rascunho. `production-android` gera AAB; `production-android-validation` gera APK; `production` gera IPA para distribuição iOS. O candidato previsto é `v1.0.0-rc.1`; ainda não é uma versão pública aprovada.
- O Pages passa a obter o código de uma tag estável publicada e a verificar o manifesto com as três plataformas validadas. Push em `main`, rascunho e pré-release não publicam produção. A permissão de tags `v*` foi adicionada e confirmada remotamente no ambiente `github-pages`; as políticas existentes foram preservadas.
- A tela `/about` reúne apresentação, versão, build nativo, plataforma, ambiente, metadados de código quando disponíveis e links legais/notas de versões. Termos e privacidade permanecem diretamente no menu e antes do login, além da tela Sobre. O módulo nativo de identificação é opcional para preservar clients de desenvolvimento antigos; novos builds são necessários para incorporar a dependência.
- O APK `0.1.0` descrito abaixo continua como evidência da entrega anterior. Ele não valida a nova tela Sobre nem representa um artefato `1.0.0`. Concluir a validação Android/iOS/Web dos novos artefatos e as pendências operacionais/legais do grupo 11 antes de publicar a Release estável. As tarefas do MVP permanecem abertas conforme seu estado real.
- Validação local da preparação do commit `18c21ad`: 664 testes passaram em 98 suítes, com cobertura de condições de 80,24%; lint e formatação passaram. A change MVP passou na validação estrita. Foram conferidos também os casos de versão divergente, tag inválida, manifesto pendente e commit divergente em um checkout temporário. A tela Sobre e a leitura de versão têm 21 testes novos; essa evidência não substitui a validação dos novos binários nas três plataformas.
- Refinamento do menu após a inclusão de Sobre, solicitado e implementado na branch atual, sem nova change: cabeçalho móvel mínimo de 64, contexto da banda mínimo de 56, margens verticais e gaps entre grupos de 12 e margem da versão de 4. Foram conferidas revisões com linhas de 48 e depois navegação de 32/links legais de 28. Após a avaliação de UX, o responsável autorizou áreas interativas de 48 no celular, unificação da identificação/acesso ao perfil e indicação “Em breve” em Palco. Após a revisão da ordem dos destinos gerais, aprovada pelo responsável, a versão atual mostra primeiro o link `/account`, com avatar, nome, e-mail e seta, seguido de Minhas bandas; o nome acessível do perfil continua “Perfil e conta”. A identificação da pessoa introduz as bandas relacionadas à conta. Essa inversão foi aplicada no componente compartilhado, para drawer e sidebar, preservando os estilos e handlers existentes. Nome da pessoa usa a fonte da navegação (16 no drawer, 14 no desktop compacto), e-mail 11 e links legais 13. Sobre integra o grupo dos links legais no rodapé, separado por borda sutil e ancorado embaixo quando houver espaço. Desktop conserva linhas de 28–32, links legais de 28 e acesso ao perfil de pelo menos 40. As alturas acompanham a ampliação da fonte; não há expansão de alvos sobre itens vizinhos. Logo de 40, cores do destaque ativo e áreas seguras permanecem os atuais; indicador ativo com recuos verticais de 14 no drawer e 6–8 no desktop. A reorganização visual conserva o estado de navegação; o acesso ao perfil usa o fluxo dos links existentes. O refinamento posterior dos gestos Android está descrito na seção seguinte.
- Conferência visual da versão atual no Samsung `SM_S731B`, resolução 1080 × 2340, densidade 450 e escala de fonte 1: captura nativa e UIAutomator confirmaram dez itens interativos com 135 pixels (48 dp), incluindo o link da conta e os dois links legais. Todo o conteúdo do menu está visível e a versão usa seus 16 dp acima da navegação do sistema. Palco exibe “Em breve” e o acesso ao perfil mantém nome/e-mail na coluna dos demais rótulos. Durante a implementação, a referência da seta foi corrigida para o ícone existente `forward`; a renderização atual e a checagem de tipos passaram. A conexão local usa `adb reverse tcp:8081 tcp:8081` e URL do development client `http://127.0.0.1:8081`; a atualização carregou sem novo build. Tipos e lint dos componentes passaram; a proposta visual 9.11 foi atualizada. A revisão atual foi inspecionada no Android; a nova composição ainda não foi conferida em iOS/Web. Este refinamento compõe a atualização autorizada da branch `feat/release-versioning`, vinculada à PR #29.

## Refinamento de 7 de outubro de 2026 — gestos do menu no Android

- O responsável pediu ajuste fino no aparelho conectado, alternando movimentos lentos, rápidos e naturais. Esta revisão sucede o refinamento visual do menu acima e altera somente o reconhecimento/feedback dos gestos Android. Não foi criada nova change. O responsável aprovou os gestos e a revisão da ordem do menu e solicitou commit e envio à branch da PR #29.
- Foram reproduzidas falhas de fechamento lento no cabeçalho/área rolável, abertura iniciada um pouco fora da faixa de 16 dp e gestos curtos rápidos. Os links também fechavam o painel no `onPressIn`, antes de distinguir toque de arraste. A sequência inicial teve cinco falhas em dez verificações de estado final.
- Abertura e fechamento Android usam `Gesture.Pan` do Gesture Handler já instalado. O Modal do drawer recebe seu próprio `GestureHandlerRootView`; o reconhecimento não depende de o responder JavaScript disputar os movimentos com ScrollView e Pressable. A abertura fica nas telas principais, na faixa esquerda de 24 dp, e conclui ao soltar o dedo. O fechamento acompanha o dedo e restaura a posição se o gesto não completar. iOS/Web conservam os handlers anteriores; abertura por gesto continua desativada no iOS e em detalhes/edição.
- Calibração centralizada em `drawerGestures.ts`: ativação horizontal de 8 dp; conclusão por 48 dp ou por pelo menos 18 dp com velocidade de 250 dp/s; predominância horizontal de 1,25 e tolerância vertical inicial de 18 dp. Recuo rápido contrário à ação cancela a conclusão. O reconhecimento usa velocidade nativa. Rolagem vertical e pequenos deslocamentos lentos não concluem abertura/fechamento.
- No Android, links confirmam fechamento/navegação em `onPress`, após distinguir o toque do arraste. O cancelamento restaura o painel em 180 ms ou imediatamente com movimento reduzido. Quando X, fundo ou Voltar já iniciou o fechamento, o cancelamento de um gesto não pode restaurar o painel nem deixar um Modal invisível interceptando toques. Foi preservado o encerramento do Modal após a animação de fechamento.
- Validação no Samsung `SM_S731B`, 1080 × 2340, densidade 450, escala de fonte 1 e navegação do sistema por três botões: os dez cenários principais passaram; passaram também oito repetições de abertura/fechamento curto rápido e cinco cenários adicionais sobre Palco/conta, diagonais e movimento vertical. X, toque fora, Voltar e navegação para Repertório por toque passaram, com retorno para Shows ao final. Nenhum dado foi salvo ou excluído. As injeções ADB variaram de 100 a 1.000 ms; não substituem a percepção de uso com o dedo nem a validação com navegação gestual do sistema.
- A gravação `/private/tmp/setlist-drawer-refinement.mp4` confirmou deslocamento progressivo durante o fechamento lento e restauração após arraste curto lento, sem deslocamento residual nos quadros conferidos. Um movimento adicional para a esquerda seguido de retorno à posição inicial antes de soltar manteve o menu aberto. Resultados temporários: `setlist-drawer-native-final.json`, `setlist-drawer-rapid-repetition.json`, `setlist-drawer-secondary-controls.json` e `setlist-drawer-reversal.json`. O sexto ensaio adicional começou fora da faixa de captura, sobre um card, e acionou o detalhe do show; não é evidência de captura do menu. Esse caso não foi contado entre os cinco ensaios adicionais aprovados.
- A revisão está carregada pelo Metro 8081 no development client, sem novo build. Tipos e lint dos arquivos alterados passaram; 63 testes passaram nas cinco suítes de classificação, fechamento, abertura, shell e integração de rotas. A suíte do shell emite um aviso de `act()` da VirtualizedList, sem falha de teste; o novo teste de toque Android também passou isoladamente, sem esse aviso. A proposta visual 9.11 e a tabela de gestos Android foram atualizadas.

## Refinamento de 7 de outubro de 2026 — Sobre e identificação da versão

- O responsável pediu que a tela Sobre coubesse sem precisar rolar, com fontes proporcionais, revisão da origem de cada informação de versão e link para o código-fonte. A revisão está local na branch `feat/release-versioning`, sobre o commit `b42aa6d`; não houve commit, push, geração de build ou mudança de ambiente nesta rodada.
- `AboutScreen` conserva todo o texto de apresentação e os links legais. A composição usa logo de 40, nome de 20/24, títulos de 14/20, descrição de 14/20, informações de 13/20 e assinatura/licença de 12/18. Cards têm padding de 12 e gaps de 8. Quatro linhas de links com área mínima de 48 substituem os botões volumosos: Termos, Privacidade, Notas das versões e Código-fonte no GitHub. O repositório `https://github.com/anderson-sillos/setlist` foi confirmado como público.
- A tela usa uma área rolável própria, com margens de 12 e largura máxima de 600, dentro do shell existente. No aparelho de referência, o conteúdo inteiro cabe sem precisar rolar. A rolagem permanece disponível para telas menores, orientação horizontal, fonte ampliada ou mensagem de erro; texto e informações não são truncados para forçar encaixe. Foco por teclado e feedback de pressão foram mantidos nos links, com semântica de link e indicação de abertura externa.
- Diagnóstico real pelo inspector do Metro: ambos os runtimes carregam o `app.json` do código com `1.0.0`, mas `Constants.expoConfig.version` era `0.1.0` no iPhone 16 e `1.0.0` no Samsung. Ambos estavam em `bare`, sem `ExpoApplication`. A divergência vinha do manifesto mantido pelo client iOS, e não de dois números diferentes no código atual. ADB conferiu no Android instalado `versionName=0.1.0` e `versionCode=1`; essa leitura externa não foi embutida nem inventada como metadado do aplicativo.
- `getAppReleaseInfo` agora expõe `codeVersion` a partir do `app.json` incorporado ao bundle e `installedVersion` somente a partir do módulo nativo do Setlist. Mantém a prioridade dos números reais do binário quando disponíveis; na ausência deles, o fallback usa o código atual, sem depender do manifesto em cache. Sobre distingue “Versão instalada” de “Versão do código” e mostra “Código em execução” adicionalmente quando o módulo nativo informar uma versão instalada diferente. Build ausente aparece como “Não disponível”. Ambos os runtimes foram conferidos após a correção com versão/código `1.0.0` e versão instalada/build desconhecidos.
- Build continua vindo de `ExpoApplication.nativeBuildVersion`; plataforma vem de `Platform.OS`; ambiente vem de `EXPO_PUBLIC_APP_ENV`. Release e commit são metadados opcionais de `Constants.expoConfig.extra.release`, preenchidos por `app.config.ts` com as variáveis do processo de release/EAS. Commit válido é exibido com sete caracteres; não representa alterações locais posteriores ao build. A tabela completa das origens foi adicionada a `docs/RELEASE_PROCESS.md`. Novos binários que incorporem `expo-application` são necessários para obter os metadados nativos nesses clients antigos; recarregar o Metro não atualiza o APK/IPA.
- Conferência no Android `SM_S731B`, 1080 × 2340 e densidade 450: os quatro links ficaram visíveis com 135 pixels de altura cada; a licença terminou em y=1951, acima da área reservada do sistema em y=2205. Tentativa de rolagem vertical manteve os limites de marca, informações e licença na mesma posição. O novo link abriu o repositório no navegador e foi feito retorno à tela Sobre. Captura e medição temporárias: `/private/tmp/setlist-about-compact.png`, `setlist-about-compact.xml` e `setlist-about-fit.json`. A composição visual foi conferida no Android; no iOS foram conferidos os metadados do runtime, sem nova captura visual.
- Validação desta revisão: 26 testes passaram nas duas suítes de `appRelease` e `AboutScreen`, incluindo manifesto iOS antigo, diferença entre versão instalada e código, link do repositório e dimensões compactas com alvos de toque de 48. `npm run typecheck` e ESLint dos quatro arquivos TypeScript alterados passaram. Captura final no Android: `/private/tmp/setlist-about-final.png`, com todo o conteúdo visível.

## Processo de 7 de outubro de 2026 — prevenção de divergências de versão

- O responsável autorizou ajustar o processo atual para evitar divergências entre código, manifesto e binário. Preservar a revisão compacta de Sobre e as correções aprovadas de menu, navegação e descarte. Não houve commit, push, reinício do Metro, geração de build ou alteração de ambiente nesta rodada.
- Diagnóstico adicional nos runtimes: a configuração incorporada ao binário é `0.1.0` nos dois clients; o manifesto do launcher é `0.1.0` no iOS e `1.0.0` no Android. Ambos carregam `app.json` do código com `1.0.0`. O SDK iOS lê sua configuração incorporada de `EXConstants.bundle/app.config`, dentro do app instalado. Esses valores são cópias geradas/recebidas, não pontos independentes para edição da versão.
- `package.json` agora confere as versões de `app.json`, `package.json` e lockfile antes de iniciar o Expo, abrir Android/iOS/Web, exportar Web ou solicitar builds de desenvolvimento/preview. `eas-build-pre-install` repete a conferência em todos os perfis, antes das dependências. O checker usa somente Node/Git para as opções correspondentes, sem dependências externas nem valores de ambiente sensíveis. O CI já executava `release:check` e permanece com essa proteção.
- Os três atalhos `build:production:android`, `build:production:ios` e `build:validation:android` agora passam por `scripts/release-build.mjs` e exigem `--tag`: `npm run build:validation:android -- --tag vX.Y.Z-rc.N`. Mantêm os perfis de produção e recusa de checkout sujo, versão/tag ou commit diferentes. Todos os atalhos nativos usam EAS CLI `23.2.0`. O retorno deve identificar exatamente um build da plataforma/perfil esperados, com versão e commit da entrega; retorno vazio ou divergente interrompe o script. O envio continua sem submissão automática às lojas.
- `reportAppReleaseDiagnostics`, chamado por um efeito na raiz, escreve `[Setlist: versão]` somente com `__DEV__`. Registra versões de código/manifesto/binário e build, orientando para reabrir o projeto pelo Metro atual ou atualizar o client. Ausência de dados nativos gera orientação nos clients Setlist; Expo Go e Web não exigem um binário Setlist. Dados iguais são deduplicados. Usa `console.info` para manter o diagnóstico fora de LogBox, sem modais, estado de navegação ou bloqueio do app. Em bundles de produção o diagnóstico retorna imediatamente.
- `README.md` e `docs/RELEASE_PROCESS.md` explicam a origem central, os hooks, os atalhos com tag, a rotina de reabertura/reconstrução dos clients e a conferência do artefato instalado antes da entrega. A diferença de versão durante desenvolvimento não é tratada como prova de incompatibilidade nativa; bibliotecas/plugins/configurações nativas exigem reconstrução independentemente do número do produto.
- Conferências desta rodada: `npm run release:check` passou com `1.0.0`; `npm run typecheck` e ESLint dos três arquivos de implementação alterados passaram. Não foram adicionados nem executados novos testes nesta etapa. Os 26 testes registrados na seção Sobre foram executados antes destas mudanças de processo e não validam o novo diagnóstico ou os novos hooks. Os clients instalados continuam sendo os antigos; os novos comandos não geram nem instalam builds automaticamente.

## Encerramento de 7 de outubro de 2026 — Content-First Darkness

- Entrega da interface integrada: PR #28, https://github.com/anderson-sillos/setlist/pull/28, mesclada por squash na `main` em 7 de outubro de 2026, às 09h26 (Brasília), no commit `b7dc8b2b8f56ad85fb1f307b46d7fe6f50ada89b`. Estado `MERGED`, commit remoto e checkout local conferidos; diretório de trabalho limpo após a integração.
- A change `implementar-ui-ux-content-first-darkness` está finalizada e arquivada em `openspec/changes/archive/2026-10-07-implementar-ui-ux-content-first-darkness/`. As definições vigentes estão em `openspec/specs/application-ui/spec.md` e `openspec/specs/screen-navigation/spec.md`.
- Os 37 itens foram encerrados: 36 concluídos e um dispensado deste fechamento. O responsável confirmou o sucesso da revisão integrada Web/Android/iOS do item 11.2 em 7 de outubro de 2026.
- O piloto Think Aloud do item 10.4 não foi executado. Foi adiado pelo responsável para outro momento e não impede este encerramento. A troca de seções por deslize permanece desativada; considerar sua habilitação somente após avaliação futura, sem tratar o adiamento como aprovação do gesto.
- Última implementação aprovada antes do fechamento documental: `1906c6d`, com os controles de Shows/Repertório recolhendo e reaparecendo suavemente, busca permanente, espaço reservado estável, proteção contra alternância na inércia e restauração da posição somente ao montar a seção. O usuário aprovou o resultado no Android; 16 testes afetados, tipos, lint e formatação dos arquivos alterados passaram nessa rodada.
- O commit anterior `a29dfac` estabilizou o fechamento do drawer sem deixar uma camada invisível bloqueando o app e alinhou a data/hora do próximo show em Minhas bandas. Preservar essas correções e as correções de descarte no iOS descritas no registro histórico abaixo.
- Na preparação da integração, o CI apontou formatação pendente em cinco arquivos e dados de exemplo antigos de pgTAP que deixariam bandas sem integrantes. O fechamento corrige a formatação e mantém um proprietário nas bandas desses exemplos; as regras de banco e os contratos de exclusão de conta permanecem os atuais. No commit `e1ec009`, os testes do banco, o smoke test Web, formatação, lint e tipos passaram. A suíte Jest revelou expectativas antigas de quatro arquivos: títulos de blocos sem romanos, data anterior do próximo show, status em texto, orientação de repertório vazio e estilos antigos da conta. Essas expectativas foram atualizadas para a interface validada; o teste do drawer também usa o mock oficial de safe area, pois Jest não emite a medição nativa necessária para renderizar seu conteúdo. Os checks de qualidade, banco e smoke test Web passaram no commit final `f8835c2` antes do merge. Após a integração, os workflows da `main` também passaram: Qualidade `37621036340`, Banco `37621036354` e GitHub Pages `37621036323`.
- O responsável autorizou ampliar os testes e concluir o merge após o CI de `630b561` passar nos 621 testes, mas bloquear por cobertura de condições de 79,26%. Foram adicionados 22 cenários de proteção de edição, descarte, aviso de aba, fechamento/animação do drawer, conflitos de gesto, pressão/foco de botões e movimento reduzido. A suíte local completa passou com 643 testes em 96 suítes e cobertura de condições de 80,03%; tipos e lint também passaram. O mínimo de cobertura permanece 80% e a ampliação não altera o comportamento do aplicativo.
- Supabase de produção atualizado após o merge: `20261006120000_prevent_orphan_bands.sql` aplicada com sucesso em `setlist-prod` (`tqijocmmiwistinrjpwl`). O novo `dry-run` confirmou banco atualizado e nenhuma migração pendente. Essa migração impede que a última pessoa saia deixando uma banda inacessível; não remove bandas ou dados existentes. O vínculo local com `setlist-dev` (`zncaahgaoqwksdidunza`) foi preservado. A operação usou as migrações da `main` integrada, diretório isolado e `--project-ref` explícito, sem seed, roles ou reset.
- APK de produção concluído no EAS com perfil `production-android-validation`, distribuição interna, versão `0.1.0` / build `1` e código de `b7dc8b2`. Build `ffb4d4cd-1c95-407b-9aa5-762770767c6c`, estado `FINISHED` em 7 de outubro de 2026, às 10h30 (Brasília): https://expo.dev/accounts/anderson-silloss-team/projects/setlist/builds/ffb4d4cd-1c95-407b-9aa5-762770767c6c. APK: https://expo.dev/artifacts/eas/frGwyiJ_DqfeeS-OvacpNSK1DtwmtzJYOd5Ue3JG5zQ.apk. Ambiente EAS de produção e Google/Apple conferidos; assinatura Android existente reutilizada sem alterar credenciais.
- O responsável confirmou a conclusão do item 1 da sequência de publicação: validação manual desse APK Android em produção, incluindo instalação, login Google/Apple, bandas, convites, músicas, shows e descarte de alterações. Essa confirmação é do responsável; não foi executada nova automação nesta rodada. A próxima etapa é preparar a distribuição iOS e conferir os mesmos fluxos em iPhone físico. A validação Android encerra somente essa parte de `11.6`; preservar as pendências de Web/iOS e a conferência dos protótipos inacessíveis.
- A PR #27 já foi integrada à `main` em `8c58603`; o snapshot antigo abaixo sobre PRs abertas, autenticação e builds não representa o estado desta entrega.
- Próxima frente: retomar as pendências de preparação/publicação nas lojas em `openspec/changes/definir-mvp-setlist/tasks.md`. A conclusão desta change de interface não conclui automaticamente esse plano nem executa o piloto de usabilidade.
- Operações Git/GitHub continuam exigindo acesso elevado, conforme `AGENTS.md` e a regra permanente abaixo. O GitHub CLI instalado pode ser chamado diretamente em `/Users/anderson.martins/.local/bin/gh` se não estiver no `PATH`.

Os registros abaixo preservam o histórico. Para o estado vigente da interface, usar as specs principais e o arquivo da change indicados acima.

## Registro histórico de 7 de outubro de 2026 — descarte de alterações no iOS

- Branch local: `feat/implementar-ui-ux-content-first-darkness`, base `d154dd2`, referente à PR #28. As correções abaixo estão no diretório de trabalho; não houve commit nem atualização remota nesta rodada. O registro de estado mais antigo abaixo não representa a branch atual.
- O descarte foi reproduzido no simulador iPhone 16. Ao fechar a confirmação e o formulário/rota no mesmo ciclo, o React ficava com os modais em `visible=false`, mas o iOS mantinha um `RCTFabricModalHostViewController` apresentado. Janelas seguintes existiam na árvore React sem aparecer na captura nativa; o UIKit registrava `which is already presenting <RCTFabricModalHostViewController ...>`.
- `UnsavedChangesPrompt` agora oculta primeiro sua própria confirmação no iOS e executa `onDiscard` somente no evento nativo `onDismiss`, encaminhado por `OptionSheet`. Isso permite encerrar o formulário ou remover a rota após o término do fechamento da confirmação. Android e Web mantêm o descarte imediato. A posição e o estilo do aviso foram preservados.
- Preservar também a correção anterior de apresentação: na criação de banda/show, a confirmação de navegação do iOS pertence ao Modal do formulário, para aparecer acima dele. Não voltar à implementação de uma camada inline nem substituir o layout do aviso.
- Validação no simulador pelo runtime: 10 descartes entre criação de banda, novo show, nova música, edição de música, edição de show e edição de setlist. Incluiu continuar editando, reabrir formulários, retornar às telas anteriores e abrir o menu ao final. Após a correção, não apareceram novos conflitos de apresentação no log UIKit do processo observado. Nenhum formulário foi salvo.
- Os 13 testes específicos de `UnsavedChangesPrompt`, `ShowCreationDialog` e `useUnsavedChangesGuard` passaram. O caso iOS verifica que o formulário não fecha antes de `onDismiss`; Web/Android verificam o descarte imediato. O usuário confirmou que a correção funcionou e identificou somente a ausência do aviso na edição do nome da banda.
- A edição do nome agora informa seu estado alterado ao `BandScreen`, que usa `useUnsavedChangesGuard` para Cancelar, X, toque fora, retorno e saída de rota. A troca para a confirmação de exclusão também pede descarte se houver um nome pendente. Sem alteração, o fechamento é direto; durante salvamento a saída permanece bloqueada. No iOS, o aviso pertence ao Modal de administração e utiliza a mesma sequência `onDismiss` já validada.
- Conferência da edição do nome pelo runtime iOS: aviso centralizado acima do formulário, continuar preserva o texto, descarte fecha sem salvar, reabertura recupera o nome original e cancelamento sem mudanças não mostra aviso. Foram conferidos dois descartes (toque fora e X), além de Cancelar e continuar editando. Tipos e lint dos dois arquivos afetados passaram; não foram adicionados nem executados novos testes nesta correção pontual. Automação de callbacks e capturas nativas não substitui a conferência dos toques pelo usuário.
- Metro continua apenas na porta 8081. Na retomada do simulador, encerrar e abrir o processo do app foi suficiente para carregar o Metro automaticamente; evitar enviar também o deep link do development client se a conexão já iniciou, para não provocar um segundo carregamento desnecessário.
- Houve ainda uma coleta anterior com a thread principal presa em `InspectorPackagerConnection::Impl::closeAllConnections` após perder a conexão do depurador. Esse achado é separado do modal retido reproduzido nesta rodada. Não atribuir todos os travamentos a uma única causa nem desfazer navegação/UI validada por suposição.

## Snapshot anterior à integração da PR #27 — histórico

- Repositório: `anderson-sillos/setlist`; `origin/main` está em `d37278e`.
- Branch ativa local: `feat/documentos-legais-retencao`, com o commit base `04548e2` alinhado ao remoto; corresponde à PR #27, aberta como rascunho: https://github.com/anderson-sillos/setlist/pull/27. Não foi feito merge. Neste momento, somente este handoff e `AGENTS.md` estão modificados localmente e ainda não foram commitados.
- PR #28, `feat: implementar UI/UX Content-First Darkness`, continua aberta em https://github.com/anderson-sillos/setlist/pull/28. O commit `5143776` foi enviado em acesso elevado. A change OpenSpec está incompleta: 21/35 tarefas concluídas. Achados manuais pendentes: corrigir o símbolo Apple, restaurar os links legais no rodapé do login e resolver a incompatibilidade de nonce do login Google no iOS. Há sobreposição com a PR #27 em autenticação e links legais; ao retomar a #28, integrar primeiro as mudanças relevantes da #27 e preservar ambos os conjuntos de requisitos.
- A PR #27 reúne as minutas legais, páginas públicas, retenção, autenticação e migrações. A aprovação final das páginas legais e a data de vigência seguem pendentes; não publicar as minutas antes disso.
- GitHub Pages: o deploy manual mais recente registrado concluiu com sucesso, mas foi feito a partir de `main` em `d37278e` (run https://github.com/anderson-sillos/setlist/actions/runs/37045501790). Portanto, a página publicada não contém o código mais recente da PR #27; as alterações de `.github/workflows/pages.yml` estão na PR e aguardam integração.
- Supabase de produção (`tqijocmmiwistinrjpwl`): Google e Apple aparecem ativos. O login Apple Web foi validado pelo usuário. O Client ID enviado à Apple foi corrigido de `om.andersonsillos.setlist.web` para `com.andersonsillos.setlist.web`; o callback observado é `https://tqijocmmiwistinrjpwl.supabase.co/auth/v1/callback`.
- EAS: `eas.json` agora define `production-ios-simulator` e `production-android-validation`. O primeiro herda o ambiente de produção e gera build de simulador; o segundo herda produção e gera APK interno. O esquema OAuth iOS Google está explícito no perfil base; o Android ativa o módulo nativo Google e desativa a flag específica de iOS.
- Build Android de validação: enviado ao EAS com ID `c728fd9d-21e1-4be4-ac85-2eb2607f2188`. Último estado observado: aguardando executor na fila. O acompanhamento local foi interrompido sem cancelar o job remoto. Acompanhar em https://expo.dev/accounts/anderson-silloss-team/projects/setlist/builds/c728fd9d-21e1-4be4-ac85-2eb2607f2188.
- Esta atualização adiciona a regra operacional neste handoff e em `AGENTS.md`; ainda não foi commitada.

## Regra permanente para GitHub

- Para criar commits que serão enviados, fazer `git push`, atualizar branch remota ou criar/editar/mesclar PR, usar o comando correspondente em acesso elevado (`sandbox_permissions: "require_escalated"`). Não tentar concluir gravações remotas pelo sandbox nem depender da integração GitHub conectada para gravar arquivos ou metadados: ela pode não ter permissão de escrita.
- Uma solicitação explícita do usuário para commit, push ou atualização de PR autoriza a ação; não pedir a mesma autorização novamente. Executar pelo caminho elevado e atender qualquer aprovação adicional apresentada pela ferramenta.
- Depois de cada operação, confirmar o resultado no remoto (SHA da branch, estado/cabeçalho/descrição da PR) antes de dizer que terminou. Se o helper ou a credencial falhar, não afirmar que o remoto foi atualizado; identificar o erro e pedir somente a autenticação que estiver faltando.
- Aplicar esta regra em todas as sessões futuras deste repositório. Ela também está em `AGENTS.md`, que instrui as próximas sessões do Codex.

## Fontes de verdade

- `openspec/specs/application-ui/spec.md`: sistema visual, componentes, estados e controles de listas.
- `openspec/specs/screen-navigation/spec.md`: navegação, memória, transições, gestos e proteção de edições.
- `openspec/changes/archive/2026-10-07-implementar-ui-ux-content-first-darkness/`: proposta, design, decisões e checklist encerrado da entrega de UI/UX.
- `openspec/changes/definir-mvp-setlist/proposal.md`: motivação, escopo e capacidades.
- `openspec/changes/definir-mvp-setlist/design.md`: arquitetura, decisões e riscos.
- `openspec/changes/definir-mvp-setlist/specs/`: contratos de comportamento por capacidade.
- `openspec/changes/definir-mvp-setlist/tasks.md`: estratégia incremental e checklist de implementação.
- `openspec/specs/shared-data-refresh/spec.md`: contrato vigente de atualização de dados compartilhados restrita às telas relevantes.

Antes de implementar, executar:

```bash
openspec status --change definir-mvp-setlist
openspec validate definir-mvp-setlist --type change --strict
```

## Histórico resumido

1. O OpenSpec foi inicializado localmente no projeto e a cópia redundante foi removida.
2. A ideia do Setlist foi explorada até fechar o escopo funcional, as regras de acesso, o modo palco, o funcionamento offline e a arquitetura.
3. O repositório GitHub foi configurado, o README inicial foi criado e uma apresentação HTML responsiva foi publicada no GitHub Pages.
4. Os PRs #1 e #2 melhoraram a apresentação móvel e corrigiram sua conformidade HTML.
5. O PR #3 consolidou proposal, design, seis delta specs e o plano incremental em 11 incrementos.
6. O PR #4 adicionou este handoff e o PR #5 iniciou a fundação multiplataforma.
7. O PR #5 entregou a aplicação Expo inicial, configuração tipada, qualidade automatizada, catálogo responsivo, CI e roteiro reproduzível do ambiente.
8. Os PRs #6 e #7 ampliaram o roteiro do ambiente e documentaram a atualização segura do código local.
9. O PR #8 implementou a primeira versão navegável, publicou a versão web e entregou um build interno Android validado; a validação iOS foi adiada.
10. A revisão funcional e de UX/UI definiu a navegação móvel, listas compactas, calendário, detalhes orientados à letra, planejamento temporal da setlist e o tom de voz informal; o relatório foi aprovado e a implementação foi autorizada.
11. A tarefa 2.8 substituiu a navegação superior por um shell responsivo com cabeçalho fixo, barra inferior móvel, menu lateral, retorno nos detalhes, cabeçalho de edição e memória de rota e estado por seção.
12. A tarefa 2.9 transformou bandas, repertório e shows em listas compactas e roláveis com busca, filtros, ordenação, durações e permissões aparentes; os detalhes foram reorganizados e Shows ganhou um calendário mensal com fins de semana, feriados nacionais e os destaques solicitados para a terça-feira de Carnaval e Corpus Christi.
13. A tarefa 2.10 evoluiu a setlist para uma união discriminada de músicas, anotações de planejamento e separadores, adicionou movimentação imutável de blocos e itens, incluiu a composição do tempo entre música e planejamento e garantiu que itens não musicais não cheguem ao modo palco.
14. A tarefa 2.11 centralizou esqueletos de carregamento, erros recuperáveis, indisponibilidade, faixas de conexão e mensagens temporárias; o catálogo mantém variações determinísticas, ações objetivas, semântica acessível e textos neutros para situações sensíveis.
15. A tarefa 2.12 refinou a barra inferior e o destino Palco, a animação horizontal do menu, os filtros compactos, o alinhamento e a largura do conteúdo, as linhas das listas, o calendário e as transições de rota. A prévia web e o build Android final foram publicados e o Incremento 2 recebeu aprovação explícita.
16. A tarefa 2.13 abriu uma segunda rodada de refinamentos de UI. A iconografia deixou de usar caracteres tipográficos e passou a ser centralizada pelo componente semântico `AppIcon`, com Lucide React Native e `react-native-svg`, mantendo o mesmo desenho em Android, iOS e web.
17. As entradas de `src/app` passaram a somente encaminhar as rotas, enquanto as telas foram separadas por domínio em `features/bands`, `features/repertoire`, `features/shows` e `features/stage`. O shell de navegação, o menu lateral e os controles de lista também foram divididos em componentes e hooks menores, documentados em `docs/ARQUITETURA_DE_TELAS.md`.
18. As linhas de bandas, músicas e shows foram padronizadas, as datas e durações receberam formatadores compartilhados e os campos de busca ganharam uma ação acessível para limpar o texto. A identidade visual passou a incluir ícones nativos, foreground adaptativo do Android, favicon multirresolução e splash violeta com a nota branca do `brandMark`.
19. A consulta de Shows foi redefinida como uma única lista. O calendário deixou de ser uma visualização concorrente e passou a funcionar como filtro adicional de data aberto por um botão dedicado; a seleção muda período e estado para `Todos`, mostra todos os eventos daquele dia, contabiliza somente a data como `1` e preserva marcadores independentes da busca e ordenação. Remover a data restaura `Próximos` + `Ativo`. Esse padrão conta `2`, `Todos` nos dois grupos sem data conta `0`, e `Limpar` restaura o padrão, remove a data e fecha o painel. Filtros e ordenação usam ícones com rótulos em Shows e Repertório, e a futura criação de show permanece como ação contextual do cabeçalho para Owner e Editor. Os avisos de ações ainda demonstrativas passaram a usar um popup acessível. Ajustes pontuais adicionais alinharam os grupos de integrantes à esquerda, permitiram quebra responsiva nos controles do repertório e impediram novo acionamento do destino já ativo na barra inferior.
20. Os detalhes do show passaram a reutilizar o formato compacto de data e horário da lista, exibir a quantidade de ocorrências de músicas junto ao resumo temporal e diferenciar a precisão das durações: totais de show e bloco em horas e minutos e itens individuais com segundos. Em Rascunhos editáveis, a ação `Editar` com ícone foi movida para o cabeçalho da Setlist. As anotações de planejamento ficaram mais compactas, identificadas visualmente por fundo e ícone menor, sem repetir o rótulo `Planejamento` e mantendo o significado acessível.
21. Os detalhes da música foram alinhados ao mesmo sistema visual: estado e arquivamento usam marcadores compartilhados, a duração segue o formato da lista, a edição secundária ganhou ícone e nome acessível, os títulos das seções receberam semântica de cabeçalho e a referência do YouTube passou a usar um botão secundário com ícone vetorial externo.
22. Os dados demonstrativos foram ampliados para exercitar listas, filtros e calendários com conteúdo mais próximo do uso real: a Banda Horizonte passou a ter 9 músicas ativas e 9 shows, enquanto o Trio Aurora passou a ter 5 músicas e 4 shows. Os dois repertórios incluem músicas de artistas diferentes da banda responsável, e os eventos foram distribuídos por datas e meses distintos.
23. A antiga `features/navigation/display.ts` foi removida. Formatadores de data, duração e busca agora ficam em `src/utils` por assunto; constantes de localização ficam em `src/config/localization.ts`; o cálculo de duração da setlist fica em `src/domain/setlistDuration.ts`; e os rótulos de status ficam nas features de Shows e Repertório. `formatDateFilter` e a conversão de chaves civis de data também foram retirados dos módulos específicos onde estavam indevidamente acoplados.
24. A suíte monolítica `features/navigation/__tests__/navigation-test.tsx` foi dividida por responsabilidade. O diretório de navegação agora cobre apenas shell, integração de rotas, memória e builders de endereço; os testes de bandas, repertório, shows e seleção do palco ficam junto das respectivas features. O comportamento foi preservado e a convenção está documentada em `docs/ARQUITETURA_DE_TELAS.md`.
25. Os nomes com colchetes em `src/app/bands/[bandId]/...` são segmentos dinâmicos oficiais do Expo Router, não uma cópia redundante ou incompatível entre plataformas. Eles foram mantidos para preservar as URLs e o roteamento; comandos de shell que apontarem para esses caminhos devem usar aspas.
26. A limpeza estrutural removeu o componente legado não utilizado `src/components/layout/ResponsiveGrid.tsx`, o helper `getCatalogColumnCount` e seus testes, além das pastas vazias `public/icons`, `dist/icons`, `.vscode/.react` e `src/components/layout`. O diretório `.codex` permanece somente por ser um ponto de montagem ocupado pelo ambiente local; os placeholders `.gitkeep` do OpenSpec foram preservados.
27. A tarefa 2.13 foi aprovada e concluída após a revisão dos refinamentos visuais, organização de testes, arquitetura e limpeza de artefatos. O PR #10 foi integrado à `main`; a tarefa 3.1 foi iniciada em uma nova branch.
28. A tarefa 3.1 começou na branch `feat/youtube-iframe-prototype`. O protótipo web isolado está em `src/features/youtube/YouTubeIframePrototype.tsx`, usa a API oficial do YouTube IFrame para player visível, play, pause, busca de dez segundos e leitura periódica do tempo, e pode ser aberto em `/youtube-prototype`.
29. A validação manual da tarefa 3.1 confirmou no navegador o player visível, reprodução, pausa, busca e leitura do tempo atual. A tarefa foi marcada como concluída no OpenSpec; a adaptação para WebView Android e iOS permanece na tarefa 3.2.
30. A tarefa 3.2 começou na mesma branch. `src/features/youtube/YouTubeMobilePlayer.tsx` hospeda o player em `react-native-webview`; `youtubeMobilePlayer.ts` gera o HTML com origem e `baseUrl` definidos, envia comandos pela ponte `injectJavaScript` e valida mensagens de pronto, tempo, estado e vídeo indisponível. A validação automatizada da ponte passou; ainda falta conferir o comportamento em Android e iOS físicos ou simulados antes de marcar a tarefa como concluída.
31. O README passou a documentar o fluxo manual de trabalho com Git e GitHub CLI: atualizar `main`, criar branch, validar, revisar o staging, criar commit, publicar com `git push`, abrir ou editar a PR e acompanhar os checks sem fazer merge automático antes da revisão.
32. O roteiro manual também documenta a conclusão da PR: verificar aprovação e checks, trocar para `main`, executar `gh pr merge --squash --delete-branch`, atualizar a cópia local e remover a branch restante somente depois de confirmar a integração.
33. Durante a validação da tarefa 3.2, o menu lateral ganhou temporariamente o link `Player YouTube (protótipo)`, que abre `/youtube-prototype` no Expo Go sem exigir deep link manual. O item deve ser removido depois da validação nativa da WebView.
34. A tela do protótipo ganhou o botão `Fechar protótipo`, que retorna para `Minhas bandas` usando a rota raiz. Na WebView, `mediaPlaybackRequiresUserAction` foi desativado para permitir que o comando `Reproduzir` inicie o vídeo pela primeira vez sem exigir um toque prévio nos controles internos do YouTube.
35. A validação manual confirmou a tarefa 3.2 em Android e iOS: o player abriu na WebView, a ponte respondeu aos comandos e ao tempo, os controles funcionaram e o vídeo indisponível exibiu o estado correspondente. A tarefa 3.2 foi marcada como concluída; a tarefa 3.3 é o próximo protótipo técnico.
36. A tarefa 3.3 começou com o cronômetro mantendo uma referência de tempo real e recalculando o progresso quando o aplicativo volta ao estado `active` do React Native. O comportamento de retomada após perda de foco foi coberto no teste do hook.
37. A validação manual confirmou a tarefa 3.3 em Android e iOS: perda de foco, bloqueio de tela e chamada mantiveram o cronômetro baseado no tempo real; o estado pausado permaneceu estável. A tarefa 3.3 foi marcada como concluída; a tarefa 3.4 é o próximo protótipo técnico.
38. A tarefa 3.4 começou com um protótipo isolado de convite e retorno OAuth. As rotas `/invite/[token]` e `/auth/callback` preservam `invite_token`, `code` e `state`; `expo-linking` gera os endereços de desenvolvimento para web, Android e iOS. A tela temporária `Convite e OAuth (protótipo)` permite exercitar os dois caminhos e ficará disponível até a validação manual.
39. A validação manual confirmou a tarefa 3.4 no navegador, Android e iOS: os links de convite abriram a rota correta, `invite_token`, `code` e `state` permaneceram preservados no retorno OAuth e o convite pôde ser retomado. A tarefa 3.4 foi marcada como concluída; a tarefa 3.5 é o próximo registro técnico.
40. A tarefa 3.5 consolidou no design os resultados e limites dos três protótipos. O player YouTube permanece visível e dependente de conexão; o cronômetro continua local e já trata interrupções sem encerramento do processo; o fluxo de convite/OAuth preserva parâmetros, mas ainda depende da integração real com Supabase, estado protegido e links definitivos. As tarefas 5.1, 5.6, 8.6, 9.1, 9.2 e 11.5 foram explicitamente alinhadas a essas limitações. O grupo 3 foi concluído.
41. A tarefa 4.1 foi concluída na branch `feat/supabase-environments`. O cliente tipado em `src/data/supabase/client.ts` usa somente URL e chave publicável, os perfis EAS selecionam `development` e `production`, e os modelos `.env.development.example` e `.env.production.example` separam os projetos. Os comandos `npm run supabase:check -- development|production` e `npm run supabase:check:eas -- development|production` testam o endpoint público sem expor credenciais; o segundo injeta as variáveis cadastradas no EAS usando `eas env:exec`. As conexões de desenvolvimento e produção foram confirmadas com sucesso.
42. A tarefa 4.2 foi concluída na mesma branch. `supabase/migrations/20260918170000_create_band_access.sql` cria `profiles`, `bands`, `band_members` e `legal_acceptances`, com enumeração de papéis, chaves estrangeiras, unicidade de participação, validações de texto, timestamps, RLS habilitado e exclusões em cascata ou anonimização conforme o domínio. `supabase/tests/4.2-band-access.sql` verifica 30 invariantes e passou com `npm run supabase:test`; `supabase/seed.sql` habilita pgTAP somente no banco local. As políticas de acesso detalhadas permanecem para a tarefa 4.7 e as regras transacionais do último Owner para a tarefa 4.6.
43. A tarefa 4.3 foi concluída na mesma branch. `supabase/migrations/20260918173000_create_songs.sql` cria `songs`, o enum `lyric_status`, validação de documento JSONB com blocos/linhas/identificadores/tempos e derivação do estado da letra. A música mantém duração, referência do YouTube, arquivamento e timestamps gerados pelo banco; RLS fica habilitado sem políticas até a tarefa 4.7. `supabase/tests/4.3-songs.sql` cobre os estados válidos e rejeita estruturas, tempos, IDs e estados inconsistentes.
44. A tarefa 4.4 foi concluída na mesma branch. `supabase/migrations/20260918180000_create_shows_and_setlists.sql` cria `shows`, `show_blocks` e `show_items`, com os estados `draft`, `ready` e `cancelled`, ordem única por show/bloco, referências restritivas às músicas usadas, tipos discriminados para música, planejamento e separador, descrições e durações validadas e RLS habilitado sem políticas até a tarefa 4.7. `supabase/tests/4.4-shows-and-setlists.sql` verifica 29 invariantes e passou junto com as migrações anteriores, totalizando 76 testes.
45. A tarefa 4.5 foi concluída na mesma branch. `supabase/migrations/20260918183000_create_invitations.sql` cria convites com hash SHA-256 do token, rótulo opcional, validade padrão de sete dias, revogação, consumo e referências anuláveis de autoria/uso. As funções `create_invitation`, `revoke_invitation` e `accept_invitation` restringem execução a usuários autenticados; o aceite usa bloqueio da linha, valida expiração/revogação/uso e insere a participação como `member` de forma atômica, sem armazenar o token bruto. `supabase/tests/4.5-invitations.sql` cobre 33 invariantes e a suíte acumulada passou com 109 testes.
46. A tarefa 4.6 foi concluída na mesma branch. `supabase/migrations/20260918190000_add_integrity_triggers.sql` adiciona timestamps de servidor para perfis, bandas, músicas, shows, blocos e itens; impede que uma banda com outros integrantes fique sem Owner; anonimiza referências de conta removida em aceites e convites; bloqueia alterações de conteúdo fora de shows `draft`; e rejeita músicas de outra banda na setlist. `supabase/tests/4.6-integrity-triggers.sql` verifica 24 invariantes, incluindo exclusão de conta, estados somente leitura e reabertura para Rascunho; a suíte acumulada passou com 133 testes.
47. A tarefa 4.7 foi concluída na mesma branch. `supabase/migrations/20260918200000_add_rls_policies.sql` adiciona funções de escopo por banda/show, RLS para todas as tabelas de negócio, acesso de leitura aos integrantes, escrita de conteúdo para Owner/Editor, administração de acesso apenas para Owner e a RPC `create_band` com Owner e aceite do termo em uma operação segura. Usuários anônimos e externos permanecem sem acesso. `supabase/tests/4.7-rls-matrix.sql` verifica a matriz automatizada por papel; a suíte acumulada passou com 161 testes.
48. A tarefa 4.8 concluiu o grupo 4. O banco local foi recriado do zero duas vezes, em ambiente isolado, aplicando as seis migrações na mesma ordem; em ambos os ciclos `npm run supabase:test` passou com 161 testes. O novo `npm run supabase:lint` verifica somente o schema `public` com `--fail-on error` e terminou com `No schema errors found`; a exclusão do schema `extensions` evita falsos positivos internos do pgTAP. A validação OpenSpec, o formato, lint, TypeScript e os 155 testes automatizados do aplicativo também passaram.
49. A tarefa 5.1 foi iniciada na mesma branch. O cliente Supabase passou a usar PKCE e as dependências `expo-crypto` e `expo-web-browser` sustentam, respectivamente, o `state` protegido e o retorno nativo. `AuthScreen` oferece Google e Apple, `/auth/callback` troca `code` por sessão após validar `state`, e o serviço expõe renovação e inscrição no ciclo de sessão. O contexto `invite_token` segue preservado na rota real `/invite/[token]`; o atalho e as rotas temporárias do protótipo OAuth foram removidos. A cobertura automatizada cobre entrada, cancelamento, erro, retorno nativo/web, renovação e convite. A tarefa ainda não foi marcada como concluída: faltam credenciais dos provedores no Supabase e a validação manual em web, Android e iOS com development build.
50. A validação do login no Expo Go revelou que o runtime nativo não expunha `crypto.subtle`, fazendo o `auth-js` degradar o desafio PKCE para `plain`. `expo-standard-web-crypto` foi adicionado na versão do SDK 57 e `src/config/webCrypto.ts` completa a ponte com `expo-crypto` para `getRandomValues`, `TextEncoder`, `btoa` e SHA-256. O README passou a documentar o Redirect URL `exp://**/--/auth/callback` para sessões com `--tunnel`; o `Site URL` continua sendo a URL web do ambiente. A correção automatizada foi coberta e ainda depende da validação manual no aparelho.
51. Uma nova tentativa ainda exibiu a mensagem genérica de falha no botão do Google. O digest móvel passou a usar diretamente `expo-crypto`, sem reaproveitar uma implementação parcial de `crypto.subtle`, e o serviço agora normaliza e registra no Metro qualquer exceção inesperada como `oauth_unexpected_error`. O Expo Go não transporta corretamente um `ArrayBuffer` para o módulo Kotlin, então a ponte usa `digestStringAsync` e reconstrói o resultado hexadecimal; o teste cobre tanto `Uint8Array` quanto `ArrayBuffer`. A próxima validação deve conferir se o provedor Google está habilitado no mesmo projeto Supabase selecionado por `EXPO_PUBLIC_APP_ENV`.
52. O retorno final do Supabase entrega o `code` sem repetir o `state` usado no callback do provedor; o `state` é reservado e validado pelo próprio Supabase junto com PKCE. A validação local que exigia um `state` próprio foi removida, assim como o helper de armazenamento transitório, e o app troca o `code` por sessão diretamente. Os testes cobrem o callback sem `state`, erros do provedor, cancelamento e falhas inesperadas.
53. A validação manual confirmou o login Google no web por túnel e no Android: o callback chegou à rota `/auth/callback`, a aplicação voltou para a Home sem erro, o usuário foi criado no projeto Supabase e a sessão apareceu no `Local Storage` web. A PR ainda aguarda a confirmação do iOS e a revisão final antes de ser concluída.
54. Foi registrada a decisão de usar `auth.users.id` como UUID canônico da conta do Setlist, replicado em `public.profiles.id` e referenciado pelos dados do aplicativo. Identificadores externos de Google/Apple e e-mail permanecem atributos de identidade, não chaves estrangeiras. Como evolução futura, as configurações deverão oferecer **Adicionar outro método de login** ou **Vincular Google/Apple**; entrar com um provedor não vinculado poderá criar outra conta e exigirá recuperação ou mesclagem explícita, sem reassociação automática.
55. A tarefa 5.1 passou a adotar fluxo híbrido: Google nativo no Android quando houver development build ou build distribuído com o módulo e a configuração nativa disponíveis, usando `signInWithIdToken`; OAuth pelo navegador permanece o caminho da web e o fallback para Expo Go, ausência de Google Play Services ou configuração nativa. Cancelamento explícito do diálogo nativo não inicia fallback automático. O contexto de convite e o UUID da conta permanecem os mesmos nos dois caminhos.
56. A tarefa 5.3 começou na branch `feat/task-5-3-minhas-bandas` e foi concluída após validação manual no Android Metro. `BandsScreen` usa a participação retornada pelo repositório como fonte de autorização, mantém a busca somente por nome, informa o próximo show ou `Nenhum próximo show`, oferece o estado neutro para quem ainda não participa de uma banda e mantém criação/convites como ações demonstrativas das próximas tarefas. `LastBandSelectionProvider` e `lastBandStorage` persistem somente o identificador opaco da última banda no SecureStore móvel ou no armazenamento do navegador; qualquer seleção inacessível é descartada antes de ser destacada. A abertura aguarda a gravação persistente antes de navegar e usa a chave compatível `setlist-last-selected-band`; a leitura consulta o armazenamento real sempre que ele está disponível, usando memória somente como fallback. A cobertura valida seleção, restauração, limpeza por perda de acesso, fallback de armazenamento e o fluxo sem banda. Formato, lint, TypeScript e os 45 conjuntos de testes (218 testes) passaram.
57. A implementação do fluxo híbrido foi iniciada. `react-native-nitro-google-signin` e `react-native-nitro-modules` são carregados somente quando o runtime Android não é Expo Go e existe `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`; `src/features/auth/nativeGoogleModule.ts` mantém o import nativo isolado, `nativeGoogleSignIn.ts` troca o ID Token por sessão Supabase e retorna `unsupported` para o fallback OAuth. O config plugin é habilitado somente em builds Android (`EAS_BUILD_PLATFORM=android` ou `SETLIST_NATIVE_GOOGLE_ANDROID=1`); o iOS continua no navegador nesta etapa. Testes automatizados cobrem sucesso, ausência de credencial, cancelamento, indisponibilidade e falha da troca do token.
58. O diagnóstico do fluxo nativo foi instrumentado com eventos seguros `[auth:native-google]`, habilitados somente no ambiente de desenvolvimento. Os eventos cobrem cada etapa sem registrar tokens, Client IDs ou sessões. `eas.json` agora possui o perfil `development-android`, que gera um APK com `expo-dev-client`; após instalá-lo, alterações JavaScript e dos logs podem ser testadas pelo Metro sem novo build. Dependências nativas, plugins, configuração nativa, assinatura ou pacote Android continuam exigindo novo build. O README documenta `npm run build:development:android`, `npx expo start --dev-client --tunnel --clear` e `adb logcat -s ReactNativeJS`.
59. A experiência de sucesso do login foi refinada sem antecipar a persistência da tarefa 5.2. `AuthScreen` e `OAuthCallbackScreen` agora exibem um cartão `Login concluído`, mostram o e-mail quando o provedor o devolve e oferecem uma ação explícita para seguir para `Minhas bandas` ou retomar o convite. Cancelamento e falha continuam permitindo uma nova tentativa. Testes de componente cobrem os dois destinos e o retorno OAuth; formato, lint, TypeScript e os 193 testes automatizados passaram. A validação manual confirmou web e Expo Go Android; o desenvolvimento nativo Android e iOS seguem pendentes.
60. A revisão de UX da autenticação foi aplicada. Os botões agora diferenciam Google e Apple por ícones vetoriais próprios, o estado de abertura mostra indicador acessível, erros recuperáveis aparecem em um aviso destacado e o retorno OAuth usa o mesmo padrão de carregamento/erro. Após o sucesso, permanece somente a ação principal para `Minhas bandas` ou convite. A suíte passou com 194 testes e cobertura global de branches de 80,57%; não houve commit nesta etapa.
61. O primeiro runtime web reportou erro ao montar `AuthProviderIcon`. A causa foi isolada na forma de renderização do SVG e nas propriedades de acessibilidade aplicadas diretamente ao elemento. O componente agora usa o import default recomendado de `react-native-svg`, mantém as propriedades de acessibilidade em um `View` nativo e deixa o `Svg` apenas com dimensões, `viewBox` e paths. O `npm run export:web` voltou a concluir com sucesso; ao testar o servidor Metro, limpar o cache com `npx expo start --web --clear`.
62. O fluxo de entrada foi protegido no layout raiz. `AuthSessionProvider` consulta a sessão atual e acompanha mudanças do Supabase; `AuthGate` mantém o carregamento enquanto a consulta está pendente, apresenta `AuthScreen` diretamente em rotas privadas sem sessão e só monta a pilha protegida depois da autenticação. As rotas `auth` e `invite` continuam públicas para concluir OAuth e convites. A restauração persistente entre reinícios permanece no escopo da tarefa 5.2.
63. A tela de login recebeu uma revisão visual. O topo agora apresenta o ícone, o nome `Setlist` e uma breve explicação do produto; a orientação contextual para o acesso por Google ou Apple, inclusive para quem ainda não possui banda, fica junto dos controles no centro da tela. Os dois botões usam `variant="secondary"`, o mesmo fundo e ícones maiores; o rodapé exibe um disclaimer discreto sobre termos e privacidade. `Screen` passou a aceitar estilo de conteúdo para permitir esse alinhamento sem afetar as demais telas. A suíte passou com 194 testes e o export web foi validado.

64. O fluxo OAuth recebeu uma proteção contra o retorno duplicado observado no Android. O cliente nativo agora guarda somente o verificador temporário do PKCE no `SecureStore`, com fallback em memória; a sessão continua não persistida até a tarefa 5.2. `completeOAuthCallback` compartilha a mesma Promise por cliente e código durante uma janela curta, evitando que `openAuthSessionAsync` e `/auth/callback` consumam o mesmo código duas vezes e gerem `invalid flow state`. `getSupabaseClient` também preserva a instância em `globalThis`, evitando múltiplos `GoTrueClient` após Fast Refresh no navegador. A leitura do PKCE prioriza a gravação em memória sobre um valor antigo do SecureStore para impedir a reutilização do verifier após uma nova tentativa. A suíte passou com 200 testes, o export web foi validado e formato, lint, TypeScript e `git diff --check` passaram; não houve commit nesta etapa.
65. Para evitar divergência entre tentativas simultâneas ou retomadas pelo navegador, o cliente habilitou `experimental.appendPkceFlowIdToRedirects`. O callback agora preserva `sb_flow_id` e passa o identificador à troca da sessão, selecionando o verifier específico de cada fluxo. Os Redirect URLs documentados no README usam `**` no final do callback para aceitar esse parâmetro; o `Site URL` não foi alterado.
66. As URLs de callback do projeto Supabase de desenvolvimento foram sincronizadas pela CLI autenticada, usando um arquivo temporário que declarava somente `auth.site_url` e `auth.additional_redirect_urls`. Foram mantidos o `setlist://auth/callback` como `Site URL`, o retorno do GitHub Pages já existente e as configurações hospedadas não declaradas. A lista agora aceita `localhost:8081`, túneis `*.exp.direct`, Expo Go (`exp://**/--/`) e o esquema nativo, incluindo parâmetros `sb_flow_id`; o `config diff` final não apontou alterações pendentes nessas URLs.
67. A tarefa 5.2 foi iniciada. `nativeAuthStorage` passou a persistir tanto a sessão `sb-*-auth-token` quanto os verificadores PKCE no `expo-secure-store`, com fallback em memória somente quando o armazenamento seguro não estiver disponível; chaves que não pertencem à autenticação continuam ignoradas. Na web, o cliente mantém o armazenamento persistente padrão do navegador. `AuthSessionProvider` coordena `startAutoRefresh` e `stopAutoRefresh` conforme o ciclo ativo/segundo plano do aplicativo móvel. Testes cobrem gravação, restauração, remoção, falha do SecureStore, restauração do estado e renovação ao retornar ao primeiro plano. A correção do nonce do Google nativo também foi validada automaticamente com 43 suítes e 200 testes; não houve commit nesta etapa.
68. A validação manual da tarefa 5.2 foi concluída no development build Android e na versão web: após o login, o aplicativo foi encerrado e reaberto com a sessão restaurada, e o retorno do segundo plano preservou a sessão e retomou a renovação automática. A tarefa foi marcada como concluída no OpenSpec. A tarefa 5.1 continua parcialmente aberta apenas pelo iOS nativo adiado; a próxima atividade é a implementação de `Minhas bandas` na tarefa 5.3. Ainda não houve commit nesta etapa.
69. Antes de iniciar a tarefa 5.3, foi aplicada uma correção específica da web no `SearchField`: o contorno automático de foco do navegador foi removido do `TextInput`, mantendo a borda externa do componente e o comportamento visual nativo em Android/iOS. O workflow do GitHub Pages passou a receber e validar as variáveis públicas do Supabase; a branch `feat/supabase-environments` foi autorizada temporariamente no ambiente de publicação e a versão hospedada foi atualizada com sucesso para validação do login fora do Metro. A URL publicada é `https://anderson-sillos.github.io/setlist/app/`. A tarefa 5.3 continua pendente.
70. O primeiro login na prévia do GitHub Pages revelou que o `redirectTo` web ainda era montado pelo `Linking.createURL()` como `setlist://auth/callback`. `getRuntimeUrl` agora usa a origem do navegador e identifica o base path pelo bundle `/_expo/`, preservando `/setlist/app/auth/callback` no GitHub Pages e mantendo o esquema nativo em Android/iOS. A configuração do projeto Supabase de desenvolvimento foi atualizada pela CLI para aceitar `https://anderson-sillos.github.io/setlist/app/auth/callback**`, incluindo o parâmetro `sb_flow_id`; o retorno nativo e os demais padrões foram preservados. Testes cobrem o callback web hospedado.
71. Uma nova inspeção do fluxo publicado mostrou `redirect_to=https://setlist/app/auth/callback`, apesar de o navegador estar em `anderson-sillos.github.io`. A correção mantém a origem do navegador como autoridade em qualquer bundle executado com `window`, sem fixar o domínio no código nem recorrer ao scheme nativo `setlist://`; o base path continua sendo obtido do bundle `/_expo/`. O teste agora também cobre o caso em que `Platform.OS` chega incorreto no bundle web. A hipótese de domínio fixo foi descartada; a validação final deve ser feita com o artefato publicado e cache limpo.
72. Para diagnosticar a divergência entre a origem exibida pelo navegador e o `redirect_to` observado no Supabase, o início do OAuth web passou a registrar somente `pageOrigin`, `callbackOrigin` e `callbackPath` quando o ambiente não é `production`; nenhum token, código, convite ou sessão é registrado. O log permite confirmar se a URL já sai incorreta do app ou se é alterada depois pelo SDK/provedor. A proteção também funciona em testes sem `window.location`.
73. O diagnóstico no GitHub Pages confirmou `pageOrigin=https://anderson-sillos.github.io`, mas `callbackOrigin=https://setlist` e `callbackPath=/app/auth/callback`. A causa estava na combinação da leitura de `window.location.href` e do atributo textual do `<script>` no bundle estático. O callback agora usa diretamente `window.location.origin` e a propriedade resolvida `HTMLScriptElement.src`, preservando o base path completo `/setlist/app`; o fallback `setlist://` continua restrito a runtimes sem navegador.
74. A validação seguinte mostrou que o runtime web também polifilava o construtor global `URL`, mantendo a origem incorreta mesmo após a correção anterior. A montagem do callback foi simplificada para não usar `new URL`: concatena a origem já fornecida por `window.location.origin` e extrai o caminho do script por operações de string. O log seguro do OAuth também deixou de usar `new URL`, evitando diagnóstico enganoso.
75. O teste que simula o `URL` polifilado revelou e cobriu um segundo detalhe: a concatenação textual poderia duplicar a barra entre a origem e o base path. O caminho inicial agora remove barras à esquerda antes da concatenação e o teste exige exatamente `https://anderson-sillos.github.io/setlist/app/auth/callback`.
76. A validação manual final no GitHub Pages confirmou o fluxo web completo até a rota `/setlist/app/auth/callback`: o retorno chegou com `code` e `sb_flow_id`, mantendo o domínio `anderson-sillos.github.io` e sem tentar abrir `setlist://`. A correção do callback web está validada; a PR #12 permanece aberta para revisão do grupo 4/5.
77. Após a validação, a instrumentação temporária `[auth:web] callback_resolved` e seus helpers foram removidos do bundle. O comportamento do callback permanece coberto pelos testes de URL, sem logs adicionais no console do navegador.
78. A estratégia multiplataforma de autenticação foi esclarecida. No iOS, o Google pode ser integrado nativamente pelo SDK sem exigir que o usuário tenha outro aplicativo Google instalado; caso o fluxo nativo não esteja disponível, o SDK pode recorrer ao navegador. No estado atual do projeto, `nativeGoogleSignIn.ts` e o plugin nativo continuam limitados ao Android, portanto a validação do Google nativo no iOS foi adiada. O Sign in with Apple usa o framework `AuthenticationServices` nativo no iOS e OAuth pelo navegador no Android e na web; não há dependência de um aplicativo Apple instalado. A implementação do Apple será planejada junto com a configuração/distribuição iOS, considerando os requisitos da App Store para oferecer uma alternativa equivalente quando o Google estiver disponível.
79. O login por e-mail permanece em exploração como alternativa aos provedores sociais. O Supabase oferece magic link e OTP sem senha pelo método `signInWithOtp`; o magic link é de uso único, possui expiração e intervalo entre solicitações, e pode criar automaticamente uma conta quando o e-mail ainda não existe. O fluxo exigirá URLs de retorno para web e deep links móveis, tratamento de link expirado ou consumido, reenvio, abertura em outro dispositivo e possíveis prévias automáticas de links por provedores de e-mail. O serviço SMTP padrão do Supabase é adequado apenas para testes; produção exigirá SMTP personalizado. Ainda não foi decidido se o MVP usará somente magic link ou também OTP, nem como o método será vinculado a contas já criadas por Google/Apple; os artefatos OpenSpec não foram alterados enquanto essa decisão permanece aberta.
80. O passwordless por e-mail (magic link ou OTP) foi classificado como opção futura do Setlist, fora do escopo imediato da implementação da autenticação Google/Apple. A decisão poderá ser retomada após a validação dos fluxos atuais, considerando o provedor SMTP, URLs de retorno multiplataforma, experiência de abertura dos links e vinculação com identidades sociais existentes.
81. A tela de autenticação recebeu ajustes para o estado atual do produto: o botão Apple fica visível, porém desabilitado e identificado como `em breve`, enquanto o Google permanece ativo; a tela ganhou mais espaço superior para o logotipo. O `AuthGate` agora mantém o splash nativo até a consulta inicial da sessão terminar e usa uma tela de carregamento com a mesma identidade visual como fallback. O menu lateral deixou de oferecer `Entrar` para usuários já autenticados e passou a oferecer `Sair` com ícone; a ação encerra a sessão no Supabase e direciona para `/auth`. A alteração foi coberta por testes de autenticação e navegação.
82. O resumo da conta no menu lateral deixou de usar somente o usuário demonstrativo. Quando há sessão autenticada, ele apresenta o nome disponível em `user_metadata` (`full_name`, `name` ou `preferred_username`) e o e-mail retornado pelo Supabase, com fallback seguro para contas sem nome. O comportamento foi coberto no teste do shell de navegação.
83. Para diagnosticar o login no Expo Go sem expor credenciais, `authService.ts` passou a registrar temporariamente, somente em desenvolvimento, o `redirectTo` sanitizado antes de chamar `signInWithOAuth` e o tipo de retorno do navegador. A parte de consulta, que pode conter convite ou parâmetros PKCE, é substituída por `query_present=true`. No Expo Go Android, o retorno esperado é `exp://.../--/auth/callback`; em um development build ou app final, é `setlist://auth/callback`. Na web, deve preservar a origem e o base path atuais, inclusive quando executado por túnel.
84. A validação no Expo Go Android revelou que o runtime nativo expõe um `window.location` parcial apontando para o túnel HTTP. Isso fazia o callback ser montado como `http://...exp.direct/auth/callback`, que não é um deep link do Expo Go. `getRuntimeUrl` agora consulta `window.location` somente na web e usa `Linking.createURL()` em Android/iOS; o Expo Go passa a gerar `exp://.../--/auth/callback`. O cenário foi coberto por teste automatizado e a validação web/Android pelo Metro confirmou o retorno correto.
85. A correção do OAuth foi validada manualmente com sucesso no Metro web, no Expo Go Android e na prévia publicada no GitHub Pages. O login Google conclui o retorno e cria/restaura a sessão nos três ambientes. A validação nativa no iOS permanece adiada, conforme a decisão da tarefa 5.1.
86. O último development build Android do EAS (`development-android`, SDK 57, válido até 03/10/2026) foi validado com o Metro atual. O Google nativo ficou disponível no binário e a troca do ID Token por sessão Supabase concluiu com sucesso. As correções posteriores de callback foram JavaScript e puderam ser testadas sem gerar outro APK; a tarefa 5.1 continua parcialmente aberta somente pela validação nativa do iOS.
87. A tela intermediária `OAuthCallbackScreen` foi removida do fluxo visual. A rota `/auth/callback` continua existindo por ser o destino do Supabase, mas agora usa `OAuthCallbackHandler` para trocar o código e redirecionar diretamente para `Minhas bandas` ou para o convite; falhas retornam ao login com aviso. Foram adicionadas as variáveis opcionais `EXPO_PUBLIC_AUTH_SPLASH_PREVIEW_MS` e `EXPO_PUBLIC_AUTH_GATE_PREVIEW_MS`, limitadas ao desenvolvimento, para revisar separadamente o splash nativo e o carregamento do `AuthGate`.
88. A tarefa 5.4 foi implementada na branch `feat/task-5-3-minhas-bandas`, mantendo a PR #13 aberta. `BandsScreen` agora abre o formulário de criação com nome, termo vigente (versão `2026-09`) e checkbox desmarcado por padrão; o botão de confirmação permanece bloqueado sem nome e aceite. `src/data/supabase/bandMutations.ts` valida a entrada antes de chamar a RPC `create_band`, normaliza o nome e traduz erros do servidor sem expor detalhes internos. A migração `20260919100000_harden_create_band.sql` troca a assinatura antiga por uma RPC que exige `p_accepted = true`, garante o perfil autenticado, cria a banda e a participação como Owner e registra o aceite com `accepted_at` gerado pelo servidor em uma operação transacional. Testes unitários cobrem o bloqueio sem aceite, o envio da versão, os erros e a resposta da tela; `supabase/tests/5.4-band-creation.sql` cobre perfil, banda, Owner, versão, timestamp, aceite explícito e rejeições. TypeScript, lint, formatação, suíte do app (46 suítes/228 testes) e validação OpenSpec passaram. O lint pgTAP não pôde ser executado porque o banco local não estava iniciado (`127.0.0.1:54322`); deve ser repetido com `supabase start` antes da validação de banco.
89. Após a validação, o erro genérico de criação foi rastreado à ausência de migrações nos projetos hospedados: o histórico remoto estava vazio em `setlist-dev` e `setlist-prod`. As sete migrações versionadas, incluindo a RPC da tarefa 5.4, foram publicadas nos dois projetos sem resetar dados; o histórico remoto e o lint do desenvolvimento passaram. A janela de nova banda recebeu cabeçalho fixo com botão de fechar, área do formulário rolável, ações fixas no rodapé e um cartão de termo com fonte reduzida, altura máxima e rolagem interna. A PR #13 continua aberta.
90. Para permitir a validação pelo próprio app, `src/data/supabase/repositories.ts` passou a consultar participações, bandas e perfis autorizados pela sessão autenticada. `AppProviders` usa esse repositório remoto somente quando há sessão, combinando temporariamente as duas bandas demonstrativas para manter navegáveis Shows e Repertório enquanto esses módulos não têm leitura remota. Depois de criar uma banda, `BandsScreen` refaz a consulta, fecha o diálogo sem exibir a mensagem intermediária `Banda criada` e passa a exibir a banda persistida. As bandas demonstrativas recebem o rótulo `Demonstração`. Foram adicionados testes do mapeamento de entidades, perfis sem nome, erros do Supabase, bandas demonstrativas e seleção do repositório por sessão. Formatação, lint, TypeScript e 48 suítes (241 testes) passaram; a PR #13 continua aberta.
91. A tarefa 5.5 implementou a administração real de integrantes e da banda. `BandScreen` mantém os grupos de Proprietários, Editores e Integrantes em ordem alfabética, marca a própria pessoa e mostra os controles somente para Owners. Ações de promover para Proprietário e remover integrante usam um diálogo de confirmação que identifica a pessoa; a edição do nome usa o mesmo acesso e a exclusão exige digitar o nome completo, além de ser recusada pelo backend quando há outros integrantes. As mutações chamam o Supabase e traduzem erros de permissão ou do último Owner. Bandas demonstrativas continuam exibindo um aviso sem alterar dados. Foram adicionados testes de mutações, confirmações, ordenação e ausência de controles para Editor e Member, além da função SQL transacional de exclusão. Formatação, lint, TypeScript e 52 suítes (259 testes) passaram; a PR #13 continua aberta.
92. A revisão da tela de Banda removeu o menu intermediário de administração: o botão `...` no cabeçalho abre diretamente a edição, o botão de exclusão fica nessa janela e `Convidar` foi movido para acima da lista de membros. A lista agora invalida as consultas agregadas após editar ou excluir uma banda. A migração `20260920110000_sync_profile_identity.sql` preenche perfis existentes a partir de `auth.users` e sincroniza nome/e-mail ao criar banda ou aceitar convite, evitando `Usuário removido` quando a identidade está disponível. A migração foi aplicada nos projetos hospedados de desenvolvimento e produção; o lint do schema `public` passou. Formatação, lint, TypeScript, OpenSpec e 52 suítes (261 testes) passaram; a PR #13 continua aberta.
93. A janela de edição/exclusão da banda passou a usar a mesma estrutura de `BandCreationDialog`: cabeçalho fixo com título e fechar, formulário rolável e rodapé fixo com ações. O padrão deve ser reutilizado nas próximas janelas de edição para manter o comportamento consistente em telas pequenas.
94. A tarefa 5.6 foi iniciada na branch `feat/task-5-6-convites` e está em revisão na PR #14. `BandInvitationDialog` permite a Owners criar vários convites com rótulo opcional, compartilhar o link, revogar convites ativos e renovar links expirados ou revogados. O token bruto é gerado com `expo-crypto`, permanece somente em memória e o Supabase armazena apenas o hash. A tela `/invite/[token]` agora consulta uma prévia protegida depois do login, preserva o token durante o OAuth, exige confirmação explícita, consome o convite atomicamente e restaura a banda recém-aceita como contexto. A migração `20260920130000_invitation_preview_and_renewal.sql` adiciona as RPCs de prévia e renovação; `supabase/tests/5.6-invitations.sql` cobre esses contratos. `EXPO_PUBLIC_WEB_BASE_URL` foi documentada para links HTTPS compartilháveis. A migração foi publicada no projeto Supabase de desenvolvimento e o lint do schema `public` passou. TypeScript, lint, formatação e 54 suítes (280 testes) passaram; falta a validação manual dos fluxos autenticado, não autenticado, expirado, revogado e já utilizado antes de concluir a tarefa.
95. A revisão da administração de integrantes na mesma PR #14 incluiu transições completas de papel na interface: Member pode ser promovido a Editor ou Proprietário; Editor pode ser promovido a Proprietário ou rebaixado a Member; e outro Owner pode ser rebaixado a Editor ou Member. Cada transição exige confirmação. A atualização continua usando `updateBandMemberRole` e o gatilho `prevent_last_owner_change` bloqueia qualquer rebaixamento que deixaria uma banda com outros integrantes sem Owner. Foram adicionados testes do diálogo e do fluxo integrado de promoção para Editor. A saída de integrantes e a validação manual do convite continuam pendentes.
96. Corrigido o estado do `BandMemberManagementDialog`: depois de confirmar ou fechar uma ação, a seleção pendente é limpa. Ao abrir novamente a administração do mesmo integrante, o diálogo volta corretamente à lista de ações em vez de exibir diretamente a confirmação. O cenário foi coberto por teste de regressão; a validação completa passou com 54 suítes e 283 testes.
97. A tarefa 5.7 foi concluída na PR #14. A área Banda agora oferece a saída voluntária pelo próprio integrante, com confirmação e retorno para `Minhas bandas`. `leaveBand` chama a RPC transacional `leave_band`, publicada na migração `20260920150000_leave_band.sql`; a função valida a sessão e a participação antes de excluir somente o vínculo atual, enquanto `prevent_last_owner_change` impede que a banda fique sem Owner. O diálogo e o fluxo integrado foram cobertos por testes, e o Supabase de desenvolvimento passou pelo `db push` e pelo lint do schema público. A suíte pgTAP remota não pôde ser executada porque o projeto hospedado não possui a extensão pgTAP habilitada; o teste versionado permanece preparado para o ambiente local.
98. A tarefa 5.6 foi validada manualmente e concluída na PR #14. Foram conferidos os fluxos de convite autenticado e não autenticado, preservação do token durante o login, aceite único, convite expirado, convite revogado e renovação. Links HTTPS continuam sendo o formato compartilhável recomendado para abrir no navegador; `exp://.../--/invite/<token>` é um deep link do Expo Go e não deve ser tratado como URL do Chrome. A próxima atividade é a tarefa 5.8, que tratará exclusão de conta e exclusão de banda com as regras de anonimização e proteção do último Owner.
99. A implementação da tarefa 5.8 foi iniciada na PR #14. A migração `20260920160000_delete_account.sql` adiciona a RPC `delete_account`, bloqueando a exclusão quando a pessoa é o último Owner de uma banda com outros integrantes ou ainda possui uma banda solo; após a validação das regras, o perfil é removido, as referências históricas são anonimizadas, as participações são limpas por cascata, o conteúdo das bandas permanece e o usuário de `auth.users` é excluído. A tela `Perfil e conta` está disponível no menu lateral, exige digitar `EXCLUIR`, limpa a sessão local e a última banda após sucesso e apresenta erros diretos para as restrições de Owner. A exclusão da banda solo continua na edição da banda, exigindo o nome completo. Foram adicionados testes unitários do diálogo, tela, mutação e autenticação, além de `supabase/tests/5.8-account-deletion.sql`; a suíte do app passou com 58 suítes e 305 testes. A migração foi publicada nos projetos hospedados de desenvolvimento e produção e o lint do schema `public` passou. A suíte pgTAP remota continua impedida pela ausência da extensão no projeto hospedado; restam os cenários manuais para concluir a tarefa.

## Visão confirmada do produto

O Setlist atende dois objetivos principais:

1. Organizar repertório, shows, blocos e ordem das músicas de uma banda.
2. Apresentar letras acompanhadas por um cronômetro iniciado manualmente pelo músico.

O reconhecimento automático da música ou da posição do áudio fica fora do MVP. Cada aparelho mantém um cronômetro independente.

## Plataformas e arquitetura

- Uma única aplicação Expo com TypeScript e Expo Router.
- Android e iOS para celulares e tablets, com pacotes offline em JSON.
- Versão web responsiva para computadores, usada somente online.
- Supabase hospedado para Auth, PostgreSQL e RLS; nenhum banco local ou Docker é necessário para executar o projeto.
- SecureStore para sessão e verificador temporário do PKCE nos aplicativos móveis; a web usa o armazenamento persistente do navegador e renova a sessão enquanto a aba está ativa.
- TanStack Query para estado remoto, React Hook Form e Zod para formulários e validação.
- Funções puras compartilhadas organizadas em `src/utils` por assunto e regras de negócio em `src/domain`; `features/navigation` fica restrito à estrutura de navegação.
- Lucide React Native sobre `react-native-svg` para ícones vetoriais consistentes nas três plataformas, expostos internamente por `AppIcon`.
- Expo Splash Screen para a abertura nativa com o mesmo ícone e violeta da marca.
- Estado nativo do React inicialmente; Zustand somente se surgir necessidade concreta.
- Jest e React Native Testing Library, com Maestro para fluxos móveis e Playwright para web.

## Acesso e bandas

- Login exclusivamente com Google ou Apple.
- O UUID de `auth.users.id` é a chave canônica da conta; identidades Google/Apple podem ser vinculadas à mesma conta sem alterar as referências dos dados.
- Evolução futura: oferecer nas configurações as ações **Adicionar outro método de login** e **Vincular Google/Apple**. Um provedor usado sem vinculação pode criar uma segunda conta, que não deve ser mesclada automaticamente por e-mail.
- A conta pode existir sem banda selecionada; `Minhas bandas` é o contexto neutro.
- Um usuário pode participar de várias bandas.
- Papéis: Owner, Editor e Member.
- Owner administra integrantes, convites, banda e conteúdo.
- Editor altera conteúdo e consulta integrantes, mas não administra acesso ou a banda.
- Member consulta, baixa shows no aplicativo móvel e usa o modo palco.
- O último Owner não pode sair ou perder o papel, exceto se for o único integrante e excluir a banda com confirmação reforçada.
- Convites são links HTTPS de uso único, revogáveis, não vinculados a e-mail e válidos por padrão durante sete dias.
- Um convite aberto antes do login deve ser retomado depois da autenticação e adiciona o usuário como Member após confirmação.
- Na exclusão de conta, conteúdo das bandas é preservado e a autoria anterior aparece como `Usuário removido`.

## Responsabilidade pelas letras

- A criação da banda exige aceite explícito do termo de responsabilidade pelo conteúdo.
- Cada Owner ou Editor também deve aceitar o termo vigente antes de sua primeira edição.
- O aceite registra usuário, banda, versão do termo e horário do servidor.
- Uma mudança material do termo exige novo aceite para editar, sem bloquear leitura ou modo palco.
- O piloto admite apenas letras autorais da banda, em domínio público ou autorizadas.
- Não haverá busca ou importação automática de sites de letras.
- Termo, política de privacidade e procedimento de remoção precisam de revisão jurídica antes de distribuição pública.

## Repertório e sincronização

- Cada banda possui repertório próprio e uma única versão vigente por música.
- Letras contêm somente texto, sem cifras ou transposição.
- A letra fica em um documento JSONB com blocos e linhas ordenados, identificadores estáveis e tempos em milissegundos.
- Estados: Sem letra, Letra estática, Sincronização incompleta e Sincronizada.
- Músicas usadas por shows são arquivadas em vez de excluídas e podem ser restauradas.
- O YouTube é a única referência de áudio do MVP.
- Em Android e iOS, o player visível usa IFrame em WebView; na web, usa IFrame diretamente.
- O editor toca em cada linha durante a reprodução e pode corrigir os tempos manualmente.
- Não baixar, extrair, ocultar ou reproduzir o áudio do YouTube em segundo plano.

## UX/UI aprovada para implementação

- No celular e tablet em retrato, usar cabeçalho fixo, barra inferior compacta com Shows, Repertório, Palco e Banda e menu entrando horizontalmente pela esquerda; em tablet paisagem e computador, usar menu lateral permanente sem barra inferior.
- Fazer as mudanças de rota sem animação automática e manter a animação horizontal de abertura e fechamento do menu lateral móvel.
- Preservar pilha, busca, filtros, ordenação e rolagem ao alternar entre as seções principais.
- Usar listas compactas e roláveis para repertório, shows e bandas, com controles fixos conforme a tela.
- Priorizar a letra nos detalhes da música, mantendo todos os blocos expandidos e os tempos ocultos fora do editor de sincronização.
- Disponibilizar em Shows uma única lista com busca, filtros e ordenação; iniciar em `Próximos` + `Ativo`, contar período, estado e data de forma independente e restaurar esse padrão pela ação `Limpar`, fechando o painel. Usar o calendário mensal como filtro adicional de data aberto por um botão dedicado, aplicar o dia imediatamente com período e estado em `Todos` e contagem `1`; ao remover a data, restaurar `Próximos` + `Ativo`. Manter os marcadores independentes da busca e ordenação, usar fundos próprios para datas com eventos, finais de semana, hoje e feriados e mostrar o nome do feriado quando a data for selecionada.
- Nos detalhes do show, reutilizar a data compacta da lista, mostrar a quantidade de ocorrências de músicas junto ao resumo de tempo, usar horas e minutos nos totais e segundos nos itens e manter a ação de edição junto ao cabeçalho da Setlist.
- Nos detalhes da música, reutilizar os marcadores de estado e a duração da lista, manter a edição secundária com ícone junto ao título, preservar a letra como conteúdo principal e usar um botão secundário com ícone vetorial na referência externa do YouTube.
- Apresentar carregamento, vazio, erro, indisponibilidade, conexão e mensagens temporárias de forma consistente e acessível.
- Apresentar mensagens de ações ainda demonstrativas em um popup acessível com título, conteúdo e fechamento explícito ou pelo fundo.
- Usar ícones vetoriais Lucide para navegação, busca, setas, seletores, indicadores e menus; manter rótulos nos controles e tratar o desenho como elemento decorativo para tecnologias assistivas.
- Usar tom informal e bem-humorado em situações gerais e recuperáveis; manter linguagem direta em ações destrutivas, legais, de segurança ou de perda de conteúdo.
- Adiar a revisão específica do modo palco para a tarefa 8.9.

## Shows e modo palco

- Show: nome, data, horário, local, observações, blocos e setlist ordenada.
- Cada item da setlist pode ter uma observação específica do show.
- Estados: Rascunho, Pronto e Cancelado; não há Em andamento ou Finalizado.
- Rascunho aceita edição e prévia online, mas não download.
- Pronto é somente leitura e aceita modo palco online ou offline móvel.
- Cancelado não aceita execução nem novo download e pode voltar a Rascunho.
- Problemas de letra geram avisos ao tornar Pronto, sem bloquear a operação.
- O cronômetro é manual e independente por aparelho, com pausar, mais ou menos cinco segundos e reiniciar.
- A próxima música é sempre acionada manualmente.
- O modo palco oferece fonte, tema, orientação, tela ativa e bloqueio manual contra toques.
- Após interrupção, o tempo em execução é recalculado; após encerramento do processo, o usuário escolhe Retomar ou Reiniciar.
- Letra estática ou incompleta usa leitura manual, sem destaque temporal enganoso.

## Conteúdo offline e atualização

- Offline existe somente nos aplicativos Android e iOS e apenas para shows Prontos.
- Cada pacote é um JSON autocontido na área persistente do aplicativo, sem áudio ou imagens.
- Não há SQLite, expiração por idade ou limite próprio no MVP.
- Atualizações usam substituição atômica e mantêm apenas o pacote atual.
- O servidor gera um `content_updated_at`; o cliente mostra Conteúdo atualizado, Atualização disponível ou Verificação pendente.
- O timestamp serve somente para comparar o conteúdo local com o servidor; não representa versão ou histórico.
- Logout remove todos os pacotes. Perda de participação ou cancelamento remove os pacotes na próxima conexão.
- Não é possível prometer revogação enquanto o aparelho permanece totalmente offline.

## Estratégia incremental

O checklist está dividido nos seguintes incrementos:

1. Fundação executável multiplataforma.
2. Primeira versão navegável com dados demonstrativos e cronômetro.
3. Validação antecipada dos riscos técnicos.
4. Fundação do backend e segurança.
5. Autenticação, bandas e integrantes.
6. Repertório e letras estáticas.
7. Shows e setlists.
8. Modo palco conectado ao conteúdo real.
9. Sincronização manual com YouTube.
10. Pacotes offline em Android e iOS.
11. Consolidação e piloto.

O incremento 2 deve gerar a primeira versão revisável. Cada incremento funcional termina com validação ou versão interna para recolher feedback antes do próximo grupo.

## Validações e dependências externas

- O desenvolvimento ocorre no WSL2; para testar em Android físico, usar o túnel do Expo ou a rede espelhada e a regra restrita à porta 8081 documentadas no README.
- Validar YouTube IFrame, WebView, leitura do tempo e origem/referer nas três plataformas.
- Validar cronômetro após bloqueio, chamada, perda de foco e encerramento do processo.
- Criar e configurar projetos Supabase de desenvolvimento e produção.
- Configurar credenciais Google e Apple e URLs de retorno para web, Android e iOS.
- Validar links universais, App Links e esquema nativo de retorno.
- Testar a matriz RLS e as regras do último Owner, convites, estados do show e timestamps.
- Obter revisão jurídica do termo e da política de privacidade antes da distribuição pública.
- Começar no Supabase Free e avaliar Pro ao atingir 80% de uma cota ou antes de depender de disponibilidade e backups de produção.
- A prévia navegável está em `https://anderson-sillos.github.io/setlist/app/`; a apresentação permanece na raiz do mesmo site.
- A aparência exata dos novos ícones e da splash exige um novo build nativo; o Expo Go não recompila esses recursos de Android e iOS.
- A revisão funcional do Incremento 2, o build Android validado e a pendência do iOS estão registrados em `docs/REVISAO_INCREMENTO_2.md`.
- O relatório funcional consolidado e a revisão de UX/UI foram aprovados; as decisões estão registradas em `docs/REVISAO_INCREMENTO_2.md`, `docs/GUIA_DE_TOM_E_VOZ.md` e nas tarefas 2.8–2.12.

## Convenção de trabalho solicitada

- Criar um commit ao final de cada atividade concluída.
- Manter um PR aberto durante um grupo relacionado de atividades.
- Acrescentar ao mesmo PR os commits daquele grupo.
- Fazer merge e fechar o PR somente ao concluir e validar todo o grupo e, quando houver versão para revisão, após a aprovação explícita do usuário.
- Preferir squash merge, pois o repositório não aceita rebase merge.
- Atualizar este handoff ao final de cada grupo quando estado, decisões, riscos ou próximos passos mudarem.
- Não misturar mudanças não relacionadas no mesmo commit ou PR.
- Após testes locais aprovados de alterações do Supabase, conferir o remoto de desenvolvimento vinculado com `npx --yes supabase@latest db push --linked --dry-run`, aplicar as migrações pendentes com `npx --yes supabase@latest db push --linked` e confirmar novamente que não restam pendências. Não publicar no projeto de produção sem pedido explícito.
- Iniciar o Supabase local somente quando necessário e executar `npx --yes supabase@latest stop` ao terminar seu uso.

## Histórico de PRs relevante

- PR #1: melhorias da apresentação em dispositivos móveis.
- PR #2: conformidade HTML da apresentação.
- PR #3: planejamento incremental completo do MVP.
- PR #4: handoff do histórico do Codex.
- PR #5: fundação multiplataforma concluída.
- PR #6: complementos do ambiente de desenvolvimento.
- PR #7: roteiro para atualizar o ambiente local.
- PR #8: primeira versão navegável e revisão de UX/UI do Incremento 2, concluídas e aprovadas.
- PR #9: correção das vulnerabilidades de dependências apontadas pelo GitHub e pelo `npm audit`.
- PR #10: segunda rodada de melhorias de UI, reorganização das telas, identidade visual, favicon, splash e consulta de Shows com calendário como filtro de data; integrada à `main`.
- PR #11: validação antecipada dos riscos técnicos do player YouTube, cronômetro em tempo real e rotas de convite/OAuth; grupo 3 concluído e integrado à `main`.
- PR #12: fundação do Supabase, autenticação, persistência de sessão e ajustes de ambiente; grupo 4 integrado à `main`.
- PR #13: implementação de `Minhas bandas`, persistência da última banda e criação de banda com aceite do termo; integrada à `main` após aprovação.

100. O domínio canônico da aplicação foi definido como `https://setlistbr.app.br/`.
     O workflow do GitHub Pages foi ajustado para exportar a aplicação na raiz do
     artefato, manter a apresentação em `/docs/apresentacao.html`, preservar uma
     cópia temporária em `/setlist/app/` e injetar
     `EXPO_PUBLIC_WEB_BASE_URL=https://setlistbr.app.br`. A publicação ficará
     disponível assim que o DNS do Registro.br concluir a transição. O endereço antigo
     do GitHub Pages permanece documentado como fallback temporário. O Redirect URL
     `https://setlistbr.app.br/auth/callback**` foi adicionado aos projetos Supabase
     hospedados de desenvolvimento e produção pela CLI, sem remover os destinos já
     existentes; o `Site URL` não foi alterado. A configuração de App Links e
     Universal Links continuará separada, dependendo dos arquivos de associação e
     dos certificados dos builds nativos.

101. A fundação dos links HTTPS foi antecipada. `app.config.ts` declara o App Link
     Android para `/invite/*` com `autoVerify` e o entitlement
     `applinks:setlistbr.app.br` para iOS. O workflow executa
     `scripts/prepare-link-associations.mjs`, que gera `assetlinks.json` quando
     `SETLIST_ANDROID_SHA256_CERT_FINGERPRINTS` existir e o AASA quando
     `SETLIST_IOS_TEAM_ID` existir. O DNS e HTTPS do domínio canônico estão ativos;
     o endpoint Android retorna JSON válido e a API Digital Asset Links reconhece
     pacote e fingerprint. A tarefa 11.5 segue pendente até a validação no app
     Android instalado e a configuração/build/validação iOS.

102. O README passou a orientar a obtenção do `SHA256 Fingerprint` pelo comando
     `eas credentials -p android` e o cadastro de
     `SETLIST_ANDROID_SHA256_CERT_FINGERPRINTS` nas variáveis públicas do GitHub.
     A orientação diferencia a assinatura EAS dos builds internos e a chave de
     assinatura da Play App Signing; múltiplas impressões podem ser informadas
     separadas por vírgula. O APK anterior à configuração dos intent filters não
     serve para validar App Links e exige novo build.

103. A validação web do retorno OAuth em `/auth/callback` encontrou um defeito no
     fallback do GitHub Pages: o HTML renderizado no servidor usava caminhos
     relativos `./_expo`, que, em URLs aninhadas, eram requisitados em
     `/auth/_expo/...` ou `/invite/_expo/...` e retornavam 404. A tela HTML inicial
     mostrava “Conferindo seu acesso…”, mas o bundle não carregava para completar a
     hidratação e o fluxo OAuth. O workflow agora injeta em cada HTML exportado um
     `<base>` dinâmico: `/` no domínio canônico, `/app/` na cópia de conveniência e
     `/setlist/app/` na prévia `github.io`, incluindo o `404.html`. Assim as rotas
     aninhadas buscam os bundles no diretório correto. A atualização está incluída
     na PR #14 e será publicada pelo workflow do Pages após a integração em `main`.

104. A rodada final da PR #14 adicionou a sincronização de perfil por meio da
     migração `20260922120000_sync_editable_profiles.sql`, edição de nome de
     exibição, avatar com fallback por iniciais e uso de `profiles` como identidade
     canônica. A migração `20260922130000_resolve_accepted_invitation_replay.sql`
     resolve a reabertura do deep link de um convite já aceito pela mesma pessoa e
     a lista de convites exibe `used_at` em vez da expiração. O menu agora mantém
     nome e e-mail na mesma coluna ao lado do avatar. O teclado virtual reposiciona
     formulários móveis existentes de criação, edição e confirmação; a confirmação
     de exclusão da banda mantém o campo e as ações acessíveis. O usuário validou
     manualmente os ajustes visuais e de teclado no Android. O projeto passou em
     `npm run validate` (60 suítes, 326 testes), `git diff --check` e
     `openspec validate definir-mvp-setlist --type change --strict`; as migrações
     foram aplicadas ao Supabase de desenvolvimento e um dry-run confirmou que o
     remoto estava atualizado. Após a validação manual, as tarefas 5.8 e 5.9 foram
     concluídas; a tarefa 5.10, de testes ponta a ponta nas três plataformas,
     continua no roadmap.

105. A tentativa de eliminar o 404 em `/auth/callback` apenas inserindo um `<base>`
     dinâmico ainda permitia que o navegador descobrisse antecipadamente o `src`
     relativo `./_expo/...` e requisitasse `/auth/_expo/...`. O script
     `scripts/prepare-pages-html.mjs` agora substitui o `src` estático por um
     carregador que calcula o caminho antes de criar a tag do bundle, preservando
     o domínio canônico, `/app/` e a prévia `github.io`. O commit `785af60` foi
     publicado pelo workflow `35741870191`; o HTML ao vivo resolve diretamente o
     bundle na raiz, que responde `200`, e o usuário validou manualmente o login
     publicado sem o 404.

## Próxima ação recomendada

1. Acompanhar o build Android `c728fd9d-21e1-4be4-ac85-2eb2607f2188`; quando concluir, instalar o APK e validar o login nativo Google contra produção.
2. Gerar o build iOS de simulador com `eas build --platform ios --profile production-ios-simulator` e validar Apple/Google nativos contra produção.
3. Revisar a diferença entre a Web publicada (`d37278e`) e a branch da PR #27. Integrar a PR somente depois da aprovação final das minutas legais; o Pages publica automaticamente na `main`.
4. Continuar o checklist de publicação nas lojas depois das validações de plataforma e da conclusão jurídica.

5. Após a validação manual informada pelo usuário, a tarefa 5.10 foi dividida:
   5.10.1 (papéis e convites na web e Android, com publicação interna) foi
   concluída; 5.10.2 (iOS) permanece adiada até existir build e ambiente de
   validação disponíveis. O PR #14 já foi integrado em `main` por squash no
   commit `4603c69`. A nova branch `feat/task-6-1-repertoire`, baseada nesse
   `main`, inicia a implementação do repertório real da tarefa 6.1.

6. As tarefas 6.1 e 6.2 foram implementadas na branch
   `feat/task-6-1-repertoire`. O botão `Adicionar música` passou a aparecer
   como ação secundária explícita no cabeçalho para Owner/Editor, com bloqueio
   para Member e bandas demo. A tela de edição grava metadados e letra online;
   `LyricDocumentEditor` permite adicionar, remover, nomear e reordenar blocos
   e linhas, mantendo identificadores e tempos, e a mutação envia letra e
   `lyric_status` derivados em uma única atualização. TypeScript, lint,
   formatação e `npm run validate` passaram com 67 suítes e 357 testes. A
   validação SQL local não foi executada porque a inicialização do CLI do
   Supabase foi bloqueada pela escrita de telemetria fora da área permitida;
   nenhum estado remoto foi alterado. A classificação dos estados de letra da
   tarefa 6.3 foi concluída posteriormente.

7. Os botões de ação do cabeçalho foram padronizados no componente
   compartilhado `src/features/navigation/components/AppHeader.tsx`. Ações
   contextuais de bandas, shows e repertório agora usam o mesmo botão
   contornado com ícone, rótulo, altura, raio e espaçamento; `Salvar` mantém
   apenas a variante primária para indicar a ação principal. `Criar banda`
   também recebeu o ícone de inclusão. A validação completa permaneceu verde
   com 67 suítes e 357 testes, e a PR #15 continua aberta para revisão.

8. Após a revisão visual, as ações do cabeçalho deixaram de usar botões
   contornados com texto. Menu, voltar, adicionar, editar, mais opções,
   cancelar e salvar agora usam controles circulares somente com ícone,
   área de toque de 48 px, `hitSlop` e o mesmo feedback de pressão dos
   controles de navegação. Os rótulos completos continuam nos atributos de
   acessibilidade; `Salvar` usa `check`, `Cancelar` usa `close` e ações sem
   ícone explícito usam `more` como fallback. A validação completa passou com
   67 suítes e 357 testes.

9. A edição de letras foi simplificada para um único campo multilinha em
   `LyricDocumentEditor`, permitindo colar ou digitar a música inteira. Linhas
   iniciadas por `#` nomeiam blocos e uma linha `---` representa uma linha
   vazia; `lyricEditorText.ts` converte esse formato para o documento JSONB,
   preservando IDs e tempos existentes por posição. O campo mantém um rascunho
   local durante a digitação para não apagar quebras de linha intermediárias.
   O campo multiline de `Observações` recebeu dimensões explícitas somente na
   web, evitando que seu layout invada o bloco de letra. Foram adicionados
   testes de serialização, parsing, preservação de identidade e edição de
   formulário; a validação completa passou com 68 suítes e 361 testes,
   além do export web e da validação estrita do change OpenSpec.

10. A revisão visual seguinte ajustou o formulário de música. A duração agora
    usa entradas independentes para horas, minutos e segundos, recompondo o
    formato aceito pelo domínio sem exigir digitação de `:`. O campo vazio de
    duração permanece realmente vazio em músicas sem duração. O layout do
    formulário deixou de aplicar crescimento flexível aos campos verticais;
    junto às dimensões fixas do textarea multiline na web, isso evita que
    Observações invada o bloco de Letra. As instruções da letra foram
    reorganizadas em um guia visual compacto com exemplos de `# Refrão` e
    `---`. A validação passou com 68 suítes e 362 testes.

11. Os campos de duração foram retirados da linha de Tom/BPM e passaram para
    uma linha própria imediatamente após `Artista/Banda`. O grupo ocupa no
    máximo toda a largura disponível (`100%`), com inputs internos flexíveis
    para não ultrapassar o limite em telas estreitas. A suíte de tela e a
    verificação de tipos continuam aprovadas.

12. A duração agora usa o componente reutilizável `SpinButton`, com campo
    numérico acessível e controles verticais de incrementar/decrementar,
    respeitando limites de horas, minutos e segundos. Os três componentes
    ocupam partes iguais da largura disponível. `AutocompleteField` foi criado
    para o Artista/Banda: ao focar ou digitar, ele filtra valores distintos de
    `originalArtist` encontrados nas músicas dos repertórios das bandas da
    conta, ignora acentos e duplicatas e permite selecionar uma sugestão;
    o cache é invalidado após criar ou editar uma música. A validação completa
    passou com 70 suítes e 365 testes.

13. O repositório remoto não consulta mais o Supabase para IDs de bandas
    demonstrativas (`band-demo-horizonte` e `band-demo-aurora`): músicas,
    detalhes e integrantes desses IDs são resolvidos pelo repositório demo.
    Isso evita erros `22P02` de UUID ao montar as sugestões de
    `originalArtist` para o autocomplete em sessões autenticadas.

14. A edição e a visualização da letra preservam novos formatos de linha:
    `**texto**` aplica negrito e `***` cria uma linha de separação; o marcador
    `---` continua representando uma linha em branco. A tela de detalhes
    renderiza esses formatos dentro de cada bloco, e a validação inclui a
    serialização, a leitura e a apresentação desses marcadores.

15. Os nomes dos blocos na visualização da letra usam opacidade `0.55`,
    mantendo os títulos identificáveis, mas com menos destaque que as linhas
    da música.

16. No web, o menu lateral desfoca o elemento ativo antes de ocultar o
    `Modal` ao fechar ou navegar. Isso evita avisos de acessibilidade
    `aria-hidden` quando um link ou botão do menu ainda retém foco durante a
    troca de tela, inclusive ao acessar as telas de edição do repertório.

17. O componente `SpinButton` seleciona automaticamente todo o conteúdo ao
    receber foco (`selectTextOnFocus`). Os controles de incrementar e
    decrementar também devolvem o foco ao campo e selecionam o novo valor,
    permitindo substituí-lo pelo teclado sem precisar apagá-lo antes.

18. A seleção acionada pelos controles do `SpinButton` foi tornada
    compatível com todas as plataformas: no web usa `setSelectionRange` no
    elemento HTML, enquanto no Android/iOS usa `setSelection`, com fallback
    nativo opcional. Isso evita chamar `setNativeProps` em referências do
    React Native Web, que não oferecem esse método.

19. A seleção automática no foco deixou de usar `selectTextOnFocus` no
    React Native Web, pois esse recurso agenda uma seleção assíncrona que
    podia reaplicar a seleção após o primeiro caractere digitado. O
    `SpinButton` agora seleciona o valor diretamente no evento de foco e ao
    usar `+`/`−`, permitindo editar vários dígitos normalmente pelo teclado.

20. A tela de detalhes da música passou a apresentar o título com tipografia
    menor e organiza verticalmente, em largura total, os blocos de título,
    informações/observações e letra. O botão de referência do YouTube abre
    uma nova janela no web (`noopener,noreferrer`) e usa o navegador externo
    nas plataformas nativas. A validação passou com 70 suítes e 370 testes.

21. A edição dos campos de duração usa `durationFromEditorParts`, que mantém
    os dígitos exatamente como estão sendo digitados e não adiciona zeros à
    esquerda entre uma tecla e outra. A função `durationFromParts` continua
    disponível para a recomposição normalizada, e a validação do formulário
    segue normalizando a duração no salvamento. Isso permite informar, por
    exemplo, `45` em minutos ou segundos sem o segundo dígito ser bloqueado
    pelo `maxLength`.

22. Na versão web, o `RootLayout` define o título do documento como `Setlist`
    para manter o nome do app na aba do navegador. Todos os campos
    `TextInput` agora removem o contorno visual automático de foco no web,
    incluindo os campos de nome de exibição e de letra completa que ainda
    não tinham essa regra. A alteração visual manual do título da música foi
    mantida em `20px`.

23. A remoção do contorno de foco dos campos web foi centralizada no
    documento `src/app/+html.tsx`, aplicando `outline: none !important` a
    `input` e `textarea` focados em todas as rotas. As regras `outlineWidth`
    duplicadas foram removidas dos componentes individuais, mantendo a
    aparência consistente do app web.

24. O `AutocompleteField` passou a manter o foco e a lista de sugestões ao
    selecionar uma opção, além de aguardar brevemente o `blur` antes de
    desmontar a lista. Isso evita que o clique seja perdido no web e permite
    continuar editando o artista no Android. O `SpinButton` mantém um rascunho
    local durante o foco, impedindo que a normalização temporária para `0`
    insira um zero à esquerda e bloqueie a digitação do segundo dígito.

25. A saída da tela de edição de música agora verifica `router.canGoBack()` e
    usa a rota de detalhes da música (ou do repertório, no cadastro) como
    fallback quando a tela foi aberta diretamente por URL. Os links do menu
    lateral fecham o drawer no `onPressIn`, antes da navegação, e todas as
    seções passaram a informar esse callback. Isso evita o aviso de `GO_BACK`
    sem histórico e os avisos de foco retido em elementos dentro de um
    container `aria-hidden` durante a transição web.

26. O `AutocompleteField` só abre a lista de sugestões quando há pelo menos
    duas opções distintas para escolha. Com zero ou uma alternativa, o campo
    permanece limpo e não apresenta uma lista sem necessidade.

27. Na tela de detalhes da música, a ação `Editar música` foi movida para o
    cabeçalho como `headerAction` com o ícone `edit`, seguindo o padrão das
    demais telas. O botão secundário que ficava junto ao título foi removido;
    as mensagens de bloqueio para bandas de demonstração e as permissões de
    edição permanecem iguais.

28. O autocomplete oculta uma única sugestão somente quando ela já é igual
    ao valor preenchido, usando comparação normalizada. Se houver uma única
    opção diferente, ela continua sendo exibida para seleção; com duas ou
    mais opções a lista permanece disponível normalmente.

29. Os headers de criação passaram a usar iconografia semântica pelo catálogo
    `AppIcon`: `CalendarPlus` para novo show, composição `Music2 +` para nova
    música e composição `Users +` para nova banda. O `Plus` genérico foi
    preservado e a variante `CirclePlus` ficou disponível como `addCircle`
    para ações genéricas destacadas. TypeScript, lint, formatação e 70 suítes
    com 379 testes passaram.

30. O `+` das composições `Music2 +` e `Users +` recebeu selo e traço
    maiores, preservando a proporção responsiva para manter a ação de criação
    visualmente destacada nos headers móveis e web.

31. A espessura do traço do `+` foi ampliada proporcionalmente, sem alterar
    o tamanho do selo composto.

32. O traço do `+` nos ícones compostos foi dobrado novamente, mantendo o
    selo no mesmo tamanho para preservar a composição visual.

33. O ícone de nova banda passou a usar a composição `UserGroup +`, mais
    próxima da representação visual de um grupo de usuários.

34. O histórico de convites passou a usar ações iconográficas acessíveis:
    `Share2` para compartilhar novamente, `Ban` para revogar e `RefreshCw`
    para renovar. Convites ativos reutilizam o URL disponível na sessão ou
    geram um novo convite mantendo o anterior ativo quando o token original
    não está disponível, preservando o armazenamento apenas por hash no
    Supabase. A validação completa passou com 70 suítes e 379 testes.

35. A consulta de uma música recebeu a rota imersiva de letra
    `/bands/[bandId]/repertoire/[songId]/lyrics`, acessada por `Tela cheia`.
    O conteúdo visual é reutilizado entre detalhe e tela imersiva, preservando
    blocos, linhas em negrito, separadores e o retorno acessível aos detalhes.
    A ação só é apresentada para músicas que possuem letra; músicas no estado
    `Sem letra` continuam mostrando a orientação local sem oferecer uma tela
    vazia. Tom e BPM permanecem metadados secundários no resumo.

36. Após criar ou renovar um convite, `Link pronto para o palco` é mostrado
    em um popup próprio, separado do histórico de convites. A janela permite
    selecionar ou compartilhar o URL, pode ser fechada pelo botão, pelo ícone
    ou pelo fundo e é limpa ao fechar o diálogo principal. A validação completa
    passou com 70 suítes e 382 testes.

37. A tarefa 6.3 foi concluída: `deriveLyricStatus` classifica letras por
    linhas textuais, tempos informados e ordem crescente, e as mutações
    persistem o resultado junto ao documento JSONB. Os testes unitários cobrem
    Sem letra, Letra estática, Sincronização incompleta e Sincronizada.

38. A tarefa 6.4 foi concluída: Owner e Editor agora consultam o aceite do
    termo vigente antes de abrir o editor de músicas; o diálogo registra o
    aceite pela RPC protegida `accept_current_band_term`. O banco centraliza a
    versão vigente, exige o aceite em políticas de inserção/alteração e remove
    a escrita direta de `legal_acceptances`. Member, leitura do repertório e
    modo palco continuam disponíveis sem aceite. A suíte local passou com 14
    arquivos e 267 verificações; a migração foi publicada no Supabase de
    desenvolvimento e o lint remoto não encontrou erros.

39. A tarefa 6.5 foi concluída: Owner e Editor podem arquivar, restaurar ou
    excluir músicas pela tela de detalhes. A RPC protegida decide de forma
    atômica: músicas sem referência em shows são removidas definitivamente;
    músicas já usadas em setlists são arquivadas, preservando os itens
    existentes. O repertório mantém arquivadas fora das novas setlists,
    oferece filtro dedicado e exibe a confirmação contextual. A validação
    passou com 15 arquivos e 278 testes SQL, lint local/remoto sem erros e
    396 testes de aplicação; a migração foi publicada no Supabase de
    desenvolvimento.

40. A tarefa 6.6 foi concluída: as mutações de criação e edição de músicas
    agora solicitam `id, updated_at` ao Supabase e rejeitam respostas sem um
    horário válido gerado pelo servidor. O gatilho existente em
    `public.songs` continua sendo a fonte exclusiva do timestamp, sem aceitar
    datas produzidas no cliente. O teste SQL `6.6-song-current-content.sql`
    confirma que Owner e Editor substituem o conteúdo na única linha vigente,
    preservam o vínculo com shows e não expõem histórico. A validação passou
    com 73 suítes e 399 testes da aplicação, 16 arquivos e 288 testes SQL,
    lint local/remoto sem erros e banco remoto sem migrações pendentes.
    A validação da 6.7 e a publicação da prévia estão registradas na entrada
    seguinte; o PR permanece aberto para a revisão manual do grupo 6.

41. A tarefa 6.7 foi validada nos testes de repertório para Owner, Editor e
    Member, incluindo adaptação phone/tablet/desktop, cabeçalho fixo, blocos
    expandidos, atualização relativa, ação de edição restrita e estados de
    falha/indisponibilidade. A validação completa passou com 73 suítes e 399
    testes, e os checks da PR #15 foram aprovados. A prévia web foi publicada
    pelo workflow `35992917683` e responde com HTTP 200 em
    `https://setlistbr.app.br/` e `/app/`. O PR #15 permanece aberto para a
    revisão manual do grupo 6; não fazer merge ou encerrá-lo ainda.

42. A tarefa 7.9 foi validada manualmente na Web e no Android. O build interno
    Android EAS `56c043ff-d3a7-4a03-a6cf-75cf1a775c3b` (`preview`, APK,
    commit `4b6350f`) terminou com status `FINISHED` e foi validado no aparelho.
    O usuário adiou a validação iOS para uma etapa futura; a tarefa 7.9 está
    concluída com esse escopo. O grupo 8 só começa após integrar o PR #16.
    A PR #16 falhou inicialmente com 79,08% de branches; foram adicionados
    testes de fluxos de salvamento e ações de show. A validação local final
    passou: 82 suítes, 540 testes, cobertura de branches em 80,00%, lint,
    tipos, formatação e OpenSpec. O novo commit precisa rodar os checks no
    GitHub; manter o PR aberto até o check ficar verde e integrá-lo antes de
    iniciar o grupo 8.

43. As correções recentes foram validadas manualmente no Android e na Web. A
    raiz `GestureHandlerRootView` foi aplicada ao app e ao conteúdo do Modal de
    edição do setlist, removendo o erro de `PanGestureHandler` no Android. Na
    Web, o avatar usa uma imagem HTML com carregamento sob demanda; após uma
    resposta HTTP 429 temporária de `lh3.googleusercontent.com`, as fotos
    apareceram e o usuário confirmou a validação. O aviso de `aria-hidden` no
    console é de foco retido na tela anterior durante navegação web e não
    interrompe a execução. A PR #18 foi reaberta para integração à `main`;
    o check de CI da reabertura falhou porque o mock de gesture handler não
    exportava `GestureHandlerRootView`; o mock foi atualizado para incluí-lo.

44. A PR #18 foi integrada por squash à `main` no commit `1beb994`; o CI ficou
    verde e o usuário confirmou a validação Android/Web antes da integração.
    A limpeza prévia ao próximo incremento alinhou `main` ao remoto, removeu a
    branch local da PR já integrada e preservou a branch experimental e a
    branch remota da PR. O Metro segue ativo na porta 8081 com um cliente
    conectado. Antes de iniciar o item 8.1, o usuário decidiu adiar os grupos
    8, 9 e 10 para uma versão complementar e concluir primeiro a consolidação
    e o piloto da primeira versão publicável em Web e Android. Essa decisão foi
    registrada no design e no plano de tarefas; nenhum item dos grupos adiados
    foi marcado como concluído.

45. A preparação da primeira versão começou pelo item 11.1. `npm run validate`
    passou com formatação, lint, TypeScript e 82 suítes/542 testes Jest; a
    cobertura global de branches foi 80,01%. Os testes de banco pgTAP não foram
    executados porque Docker não está instalado neste ambiente. Não há
    configuração de Maestro ou Playwright no repositório. O item 11.1 continua
    pendente até completar a validação de RLS e definir/executar os fluxos e2e
    aplicáveis à versão 1. A validação OpenSpec estrita passou após a mudança
    de escopo.

46. O usuário iniciou a preparação do iOS via EAS. O perfil
    `development-ios-simulator` gera um development build com Google nativo
    no iOS. `EXPO_PUBLIC_APP_ENV`, as
    duas variáveis Supabase, os Client IDs Google Web/iOS e
    `EXPO_PUBLIC_WEB_BASE_URL` foram sincronizados do `.env.local` para o EAS
    `development`. `SETLIST_IOS_TEAM_ID` foi configurado no EAS `development`
    e `production`, e `app.config.ts` o mapeia para `ios.appleTeamId`. A mesma
    variável foi configurada e conferida como variável de repositório no
    GitHub Actions para gerar o AASA. O build EAS de simulador
    `c9f1ca0e-2feb-4395-9c6d-3cf5961e2c0d` concluiu. A instalação falhou porque
    o artefato exige iOS 16.4 e o Mac tem somente runtime 16.2 no Xcode 14.2;
    instalar Xcode/runtime compatível antes de retomar a validação.

47. A CI da PR #19 executou 82 suítes e 542 testes, todos aprovados, mas ficou
    abaixo do limite global de branches (79,92%). Foram acrescentados dois
    cenários em `nativeGoogleSignIn-test.ts` para o requisito e a configuração
    do Client ID iOS. `npm run test:ci` passou localmente com 82 suítes, 544
    testes e cobertura de branches de 80,05%; formatação, lint e TypeScript
    também passaram. O commit `bc85f44` foi enviado à PR #19; o run remoto
    `36518619647` aprovou formatação, lint, tipos e testes. A revisão do diff
    não encontrou bloqueios; a PR segue aberta, sem merge.

48. Em 29/09/2026, a PR #19 foi integrada por squash ao `main` no commit
    `3cc8d5e`; o GitHub Pages em `https://setlistbr.app.br` respondeu HTTP 200
    e o deploy mais recente publicou esse commit. O usuário confirmou a
    validação funcional da versão Web e Android. O APK
    standalone local de release foi gerado em `android/app/build/outputs/apk/release/app-release.apk`,
    com bundle JS embutido, somente `arm64-v8a`, assinado pelo keystore local
    (SHA-1 `5e8f16062ea3cd2c4a0d547876baa6f38cabf625`), instalado via ADB e
    validado pelo usuário sem Metro. O item 11.1 segue aberto para as suítes
    automatizadas RLS, Maestro e Playwright. O Mac está no macOS 12.7.6 e não
    possui runtime Docker; executar RLS em runner Linux do GitHub Actions é o
    próximo caminho a avaliar.

49. Em 29/09/2026, a suíte pgTAP/RLS foi adicionada ao workflow do GitHub
    Actions e passou na PR #20 junto com os checks de qualidade. O workflow de
    qualidade agora também gera um export Web com valores públicos fictícios
    e executa um smoke test Playwright para a tela de autenticação; o teste
    verifica os provedores visíveis e ausência de exceções JavaScript. O fluxo
    Maestro `.maestro/flows/android-auth-screen.yaml` cobre a abertura da tela
    Android e os botões de provedores. O usuário confirmou a validação manual
    de Web e Android. A execução local de Playwright não foi possível porque
    o export Metro permaneceu sem concluir nesta máquina e o Playwright não
    oferece Chromium para macOS 12; o daemon ADB também não iniciou nesta
    sessão. Na PR #20, passaram os três checks: qualidade (run `36578740301`),
    pgTAP/RLS (run `36578740356`) e smoke Playwright (run `36578740301`). Não
    havia dispositivo conectado ao ADB ao tentar executar Maestro. O item 11.1
    permanece pendente até rodar o fluxo Maestro em dispositivo/emulador; a
    validação Android manual foi confirmada pelo usuário.

50. Em 29/09/2026, o aparelho Android `SM_S731B` conectou via ADB Wi-Fi e o
    fluxo Maestro `.maestro/flows/android-auth-screen.yaml` passou com Maestro
    2.11.0: o app abriu após limpar o estado e exibiu Setlist, Continuar com
    Google e Continuar com Apple (em breve). Com as 82 suítes/544 testes Jest,
    pgTAP/RLS, Playwright e as validações manuais Web/Android aprovadas, a
    tarefa 11.1 foi marcada como concluída. Progresso OpenSpec: 75/106; as
    demais tarefas do grupo 11 seguem pendentes.

51. Registrar como melhoria futura a ampliação da cobertura Maestro para
    fluxos Android além da abertura e da tela de autenticação: login Google e
    jornadas críticas de bandas, repertório e shows. O smoke test atual foi
    considerado suficiente para o item 11.1 porque os fluxos críticos também
    foram validados manualmente pelo usuário; a ampliação não bloqueia essa
    conclusão.

52. O Playwright cobre a versão Web no navegador: o smoke test atual abre o
    export estático e verifica a tela inicial de autenticação, os provedores
    apresentados e a ausência de exceções JavaScript não tratadas. Ampliar
    futuramente essa suíte para os fluxos Web críticos, incluindo navegação e
    operações de bandas, repertório e shows, mantendo a cobertura de callbacks
    OAuth isolada de credenciais pessoais.

53. Em 29/09/2026, o item 11.2 avançou com revisão estática de acessibilidade,
    responsividade, desempenho e tom de voz. O texto `muted` tinha contraste
    4,46:1 sobre o fundo principal; o token foi ajustado para 5,07:1 e os pares
    principais de texto/fundo agora têm testes de contraste AA. O foco visível
    de teclado foi restaurado para campos de texto na Web; o drawer móvel
    informa que é modal e o foco do botão de navegação é removido antes de
    abrir o modal para evitar foco dentro de conteúdo ocultado. O CI da PR #20
    passou nos três checks: qualidade/testes, pgTAP/RLS e Playwright. Os testes
    Playwright atuais verificam a tela de autenticação em 320, 768 e 1280 px,
    axe nessa tela e o foco visível do botão Google. O build Android release
    local com bundle JS foi concluído (`android/app/build/outputs/apk/release/app-release.apk`,
    47 MB, somente arm64-v8a). Inicialmente não havia aparelho no ADB; depois,
    o APK foi instalado no `SM_S731B`, abriu na tela de autenticação e o logcat
    não mostrou exceção fatal. Essa revisão visual cobriu somente a tela de
    autenticação em um celular. A revisão de desempenho foi estática: listas
    de bandas, repertório e shows usam `FlatList`, enquanto telas de
    detalhe/editor usam conteúdo rolável delimitado; não houve medição em
    profiler. Como referência inicial no `SM_S731B`, `am start -W` reportou
    420 ms para iniciar a Activity em cold start; no estado de autenticação,
    `dumpsys meminfo` mostrou PSS total de aproximadamente 174 MiB. São
    amostras pontuais, sem comparação e sem representar uma jornada completa.
    A leitura do guia de tom não encontrou inconsistências que exigissem
    alteração. O item 11.2 permanece pendente: ainda falta validar
    as telas autenticadas e fluxos principais em celular/tablet/computador e
    medir desempenho em uso representativo.

54. Ainda em 29/09/2026, o aparelho `SM_S731B` foi conectado. O APK release foi
    instalado por cima da versão anterior e manteve a sessão; após o login, a
    revisão visual em celular percorreu Minhas bandas, integrantes da banda,
    listas e detalhes de shows, repertório e música. Os avatares dos integrantes
    carregaram, a letra longa rolou até o final mantendo a navegação acessível
    e o logcat não mostrou exceções durante a navegação. O detalhe de música
    exibia um cartão contextual vazio quando a música não tinha observações nem
    referência externa; a renderização agora omite o cartão nesse caso e o
    teste `SongDetailScreen-test.tsx` passou (12 testes). O APK foi reconstruído
    e reinstalado para confirmar a correção na tela; o cartão vazio não aparece.
    O item 11.2 permanece pendente para revisão das telas autenticadas em
    tablet/computador e medições de desempenho representativas. O detalhe de
    show ainda expõe o acesso ao modo palco, que deve ser ocultado conforme a
    tarefa 11.6 antes do candidato a piloto.

55. Ainda em 29/09/2026, a revisão Web autenticada foi retomada no Chrome com
    Metro na porta 19006. Minhas bandas, lista de shows, integrantes,
    repertório, detalhe do show e detalhe da música carregaram; os avatares dos
    integrantes foram exibidos. A letra de `Cowboys from Hell` rolou até o fim
    e a navegação inferior permaneceu visível. A tela de detalhes do show foi
    revisada em larguras de janela de aproximadamente 1120, 768 e 390 px, sem
    cortes horizontais aparentes. O Metro não registrou exceções durante essa
    navegação. As larguras menores foram simuladas redimensionando o Chrome,
    não em tablets ou celulares físicos. O item 11.2 permanece pendente para
    medir desempenho em uso representativo e revisar interações adicionais;
    o acesso ao modo palco continua visível até a tarefa 11.6.

56. Em 29/09/2026, foi coletada uma referência inicial de desempenho Web a
    partir do export estático de produção, em três contextos novos de Chrome
    headless e sem throttling, servido por loopback. No desktop, as medianas
    foram: TTFB 4 ms, DOMContentLoaded 429 ms, load 431 ms, FCP 136 ms e LCP
    840 ms. Em viewport móvel emulada de 390×844 px: TTFB 3 ms,
    DOMContentLoaded 423 ms, load 424 ms, FCP 140 ms e LCP 788 ms; as três
    sessões não tiveram overflow horizontal. Não houve erros de página nem de
    console. O bundle JavaScript único mede 5.455.098 bytes sem compressão e
    980.922 bytes em gzip. São referências locais da rota inicial, sem sessão
    autenticada, throttling ou latência de rede; as larguras móveis são
    emulação no desktop, não medição em aparelho.

57. Ainda em 29/09/2026, o editor do setlist foi revisado na Web em larguras
    de janela de aproximadamente 1120, 768 e 390 px; os campos e ações
    principais permaneceram visíveis. No fluxo de arraste, o usuário moveu
    `Bloco 2` acima de `Principal` e Cancelar abriu o diálogo de descarte. Com
    autorização do usuário, o editor foi fechado sem salvar; a tela de
    detalhes voltou a mostrar a ordem persistida original. A confirmação foi
    concluída por navegação para fora do editor porque o macOS bloqueou o
    clique automatizado no diálogo. Em conjunto com a revisão Android física,
    amostras Android de cold start/PSS já registradas, verificações de
    acessibilidade e voz documentadas no item 154 e as referências Web dos
    itens 156–157, o item 11.2 está concluído. As métricas são linhas de base
    locais e não estabelecem metas de desempenho para rede real.

58. Em 29/09/2026, foi iniciado o item 11.3. Foram criados rascunhos de
    termos de uso, política de privacidade e procedimento de remoção em
    `docs/TERMOS_DE_USO_RASCUNHO.md`,
    `docs/POLITICA_DE_PRIVACIDADE_RASCUNHO.md` e
    `docs/PROCEDIMENTO_DE_REMOCAO_RASCUNHO.md`. O conteúdo reflete o schema e
    os fluxos atuais: dados básicos de perfil, conteúdo compartilhado por
    banda, aceites e convites; exclusão de conta com desvinculação/anonimização
    de referências e preservação do conteúdo das bandas ativas. Não foram
    presumidos controlador, canal de privacidade, prazos de retenção, região de
    hospedagem, política para menores, bases legais ou processo operacional de
    denúncias; esses pontos estão destacados como pendências. Os documentos
    são rascunhos e precisam de confirmação do responsável e revisão jurídica.
    A tarefa 11.3 continua pendente e não pode ser tratada como concluída até
    essa revisão. Progresso OpenSpec: 76/106.

59. Na revisão guiada dos documentos, o responsável informou que opera o
    Setlist como pessoa física e questionou a divulgação pública de nome e
    documento. Os rascunhos agora separam identificação do controlador e canal
    de contato, registram o operador como pessoa física e deixam CPF/endereço
    sem preenchimento até avaliação jurídica. O canal de contato dedicado
    ainda precisa ser escolhido. Foi esclarecido que a LGPD enumera
    identificação e contato do controlador separadamente; exigências do
    Decreto nº 7.962/2013 podem depender de o serviço se enquadrar como oferta
    ou contratação de consumo em meio eletrônico. O modelo comercial
    (gratuito/pago e eventual contratação pelo app/site) e a decisão jurídica
    permanecem pendentes.

60. O responsável confirmou em 29/09/2026 que o Setlist será gratuito para
    usuários e que pretende disponibilizar o código-fonte como open source.
    Os rascunhos de termos e privacidade agora registram essa decisão e
    distinguem o código aberto do conteúdo privado das bandas. A licença do
    repositório ainda não foi escolhida: não há arquivo `LICENSE` na raiz nem
    campo `license` ou `repository` no `package.json`. A política também deixa
    pendente confirmar publicidade, patrocínio ou receita indireta; não se
    presume que gratuidade, por si só, resolva a aplicabilidade das regras de
    consumo. A revisão jurídica continua necessária.

61. O responsável confirmou que pretende abrir o repositório inteiro, sem
    preferência de licença. O documento de termos esclarece que a intenção
    abrange o código original de app, migrações e documentação, enquanto
    arquivos de terceiros continuam sujeitos aos avisos/licenças próprios.
    Foi verificado que não existe licença geral na raiz; o único arquivo
    encontrado é `vendor/decode-uri-component/LICENSE`. A escolha da licença
    continua pendente de decisão explícita; não foi criada licença nem
    declarada a publicação legal do projeto como open source.

62. Em 29/09/2026, o responsável escolheu GNU AGPL-3.0 para o repositório
    inteiro. Foi adicionada a cópia oficial e inalterada da licença em
    `LICENSE`, com identificador `AGPL-3.0-only` em `package.json`. O README e
    os rascunhos de termos e privacidade registram que o material original do
    projeto (app, migrações e documentação) usa AGPL-3.0-only, que componentes
    de terceiros retêm seus avisos e licenças e que isso não licencia dados ou
    letras enviadas pelos usuários. O item 162 registra o estado anterior à
    decisão. A revisão jurídica dos documentos de produto continua pendente.

63. Na revisão guiada em 29/09/2026, o responsável confirmou que não haverá
    anúncios, patrocínios, doações ou receita ligada ao aplicativo nos planos
    atuais e que os custos serão cobertos pelo responsável. A política de
    privacidade foi atualizada com essa informação e orienta nova revisão se
    o modelo mudar.

64. O responsável escolheu um canal geral de contato, em vez de um endereço
    exclusivo para privacidade. Os três rascunhos agora indicam que o mesmo
    e-mail geral receberá dúvidas, solicitações de titulares e pedidos de
    remoção de conteúdo. O endereço ainda não foi definido e permanece como
    campo pendente; antes da publicação será necessário monitorá-lo para esses
    tipos de solicitação.

65. O responsável definiu `contato@setlistbr.app.br` como canal geral. O
    endereço foi inserido nos três rascunhos e será monitorado. O
    responsável também decidiu destinar o Setlist apenas a pessoas com 18 anos
    ou mais. Termos e política registram essa regra, mas o app ainda precisa
    de uma forma de confirmação de idade e de procedimento para contas que
    eventualmente pertençam a menores. O item 11.3 continua pendente, inclusive
    de revisão jurídica. A LGPD exige melhor interesse no tratamento de dados
    de crianças e adolescentes (art. 14):
    <https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm>.

66. O responsável não quer publicar nome ou documento pessoal e perguntou se
    o domínio do app pode servir como identificação. Os rascunhos registram
    provisoriamente `Setlist — setlistbr.app.br` como identificação pública
    pretendida, sem inserir nome ou CPF; a suficiência jurídica dessa forma
    para identificar o controlador pessoa física permanece pendente de
    assessoria. A LGPD lista identificação e contato do controlador como
    informações distintas (art. 9º). O domínio pode estar associado a dados do
    titular consultáveis publicamente; o responsável aceita essa possibilidade.
    Referência jurídica: <https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm>.

67. O responsável decidiu usar `Setlist — setlistbr.app.br` como identificação
    pública nos documentos. Termos e política foram ajustados de “pretendida”
    para “escolhida”; não foram inseridos nome ou CPF. A validação jurídica de
    que essa identificação é suficiente continua pendente. A tarefa 11.3
    permanece aberta.

68. O responsável confirmou que não se opõe à divulgação de dados do titular
    que possam aparecer em consultas públicas sobre o domínio. Esse ponto
    deixa de ser uma pendência para a escolha do domínio. Continua pendente a revisão
    jurídica sobre se `Setlist — setlistbr.app.br` identifica suficientemente
    o controlador pessoa física; a tarefa 11.3 permanece aberta.

69. O responsável confirmou que o e-mail geral `contato@setlistbr.app.br` será
    devidamente monitorado. Os três rascunhos agora registram esse
    compromisso; a tarefa 11.3 permanece aberta.

70. Para a regra de acesso a maiores de 18 anos, o responsável escolheu uma
    autodeclaração antes do login. Termos e política agora dizem que a pessoa
    confirmará ter 18 anos ou mais antes de iniciar a autenticação, sem pedir
    data de nascimento para esse fim. O controle ainda não está implementado.

71. O responsável questionou se é necessário detalhar um fluxo específico para
    contas de menores. Os rascunhos agora usam uma regra geral: o serviço pode
    restringir ou suspender o acesso se houver motivo para entender que os
    critérios de elegibilidade não foram atendidos, e tratar os dados conforme
    a política e as obrigações legais, sem prometer exclusão automática. A LGPD
    exige que o tratamento de dados de crianças e adolescentes observe seu
    melhor interesse (art. 14); não foi afirmada uma obrigação de exclusão
    automática. O item 11.3 continua pendente de implementação e revisão
    jurídica. Referência: <https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm>.

72. O responsável escolheu não nomear encarregado formal, usando o canal geral
    `contato@setlistbr.app.br` para comunicação com titulares, condicionado à
    confirmação jurídica de que se aplica a dispensa para agentes de
    tratamento de pequeno porte. A política e o procedimento registram a
    intenção e mantêm pendente verificar os requisitos e as exclusões, como
    tratamento de alto risco. A Resolução CD/ANPD nº 2/2022 prevê a dispensa
    para agentes elegíveis e exige que mantenham canal de comunicação:
    <https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-2-de-27-de-janeiro-de-2022>.
    O item 11.3 continua pendente de confirmação jurídica.

73. A apuração de retenção para a política foi retomada em 30/09/2026. O
    workflow do GitHub Pages configura o artefato estático de publicação com
    retenção de 1 dia. Pela API autenticada do GitHub, a retenção configurada
    para artefatos e logs do Actions neste repositório é de 90 dias (máximo
    permitido também 90). O CLI Supabase lista `setlist-dev` e `setlist-prod`
    na organização; o `.env.local` deste checkout aponta para `setlist-dev`.
    A listagem não informa o plano nem PITR. A documentação Supabase informa
    logs API/DB por 1 dia no Free, 7 no Pro, 28 no Team e 90 no Enterprise;
    backups automáticos diários não estão incluídos no Free, ficam 7 dias no
    Pro, 14 no Team e têm prazo personalizado no Enterprise. Confirmar o plano
    e o PITR no painel Supabase; ainda falta definir retenção de dados ativos,
    aceites e exclusão dos backups. A nota interna da política foi atualizada
    com os achados e deve ser substituída por prazos do projeto antes da
    publicação. Referências: <https://supabase.com/pricing>,
    <https://supabase.com/features/database-backups>,
    <https://supabase.com/docs/reference/api/v1-get-an-organization> e
    <https://docs.github.com/en/organizations/managing-organization-settings/configuring-the-retention-period-for-github-actions-artifacts-and-logs-in-your-organization>.

74. O responsável concordou que os termos concedam ao Setlist uma autorização
    não exclusiva e sem cobrança, limitada a armazenar, processar, fazer cópias
    técnicas necessárias e exibir conteúdo às pessoas autorizadas da banda para
    operar o serviço. A cláusula exclui publicação fora da banda, anúncios e
    treinamento de modelos; permite operações pelos fornecedores de
    infraestrutura; e prevê que conteúdo compartilhado pode permanecer após a
    exclusão da conta de quem o enviou, terminando a autorização após remoção
    dos sistemas ativos, ressalvados backups e retenções legais. A seção 3 dos
    termos foi atualizada. Confirmar redação, alcance e compatibilidade com
    fluxos de exclusão na revisão jurídica; item 11.3 continua aberto.

75. O responsável concordou que mudanças relevantes e encerramento planejado
    sejam comunicados pelo e-mail cadastrado e por aviso dentro do app, com
    antecedência razoável sempre que possível. Pedidos de acesso/portabilidade
    de dados pessoais serão avaliados pelo canal geral conforme a política e a
    lei. Não se promete exportação completa do conteúdo das bandas, pois o app
    não oferece essa função; o destino do conteúdo deve ser explicado no aviso
    de encerramento, respeitando direitos e obrigações legais. A seção 5 dos
    termos foi atualizada. Revisar a formulação jurídica antes da publicação;
    item 11.3 continua aberto.

76. O responsável confirmou que o app não tem finalidades adicionais como
    analytics, publicidade, marketing, venda de dados ou compartilhamento
    comercial. A seção 3 da política agora descreve os propósitos observados e
    inclui um mapeamento preliminar de bases legais candidatas, sem as
    apresentar como conclusões: execução de contrato para funções pedidas;
    obrigação legal ou exercício regular de direitos conforme a operação; e legítimo
    interesse para segurança/abuso apenas após avaliação documentada. A seção
    4 registra a ausência de monetização/comercialização e mantém pendente o
    inventário dos fornecedores e compartilhamentos operacionais. A LGPD prevê
    as hipóteses do art. 7º; a ANPD orienta teste de finalidade, necessidade,
    balanceamento e salvaguardas para legítimo interesse:
    <https://www.planalto.gov.br/ccivil_03/leis/l13709.htm> e
    <https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia_orientativo_hipoteses_legais_tratamento_de_dados_pessoais_legitimo_interesse>.
    O mapa requer revisão jurídica e confirmação de retenção e dados técnicos;
    item 11.3 permanece aberto.

77. O inventário técnico identificou Google OAuth, Supabase (Auth e banco),
    GitHub Pages para a versão Web e player oficial do YouTube. O CLI Supabase
    lista dev e prod em `sa-east-1` (São Paulo); a região primária não prova que
    todo processamento/subprocessamento ocorre no Brasil, pois o DPA permite
    subprocessadores em outros locais. O GitHub declara que registra IPs de
    visitantes do Pages por segurança; prazo desses registros de visita não
    foi confirmado e é separado da retenção de logs/artifacts do Actions. O
    código usa `youtube.com/iframe_api`, portanto o player externo é carregado
    quando usado. A Apple foi incluída como integração planejada: o botão de
    login está desabilitado e indica “em breve”, então ainda não foi incluída
    como fluxo ativo. O fornecedor da caixa `contato@setlistbr.app.br`, os
    escopos Google, contratos e suboperadores, destinos e mecanismos para
    transferências internacionais ainda precisam ser inventariados. Política
    §2 e §4 recebeu o inventário e ressalvas. Referências: <https://supabase.com/docs/guides/platform/regions>,
    <https://supabase.com/legal/customer-resources/data-processing-addendum>,
    <https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages>,
    <https://developers.google.com/identity/protocols/oauth2/policies>,
    <https://www.apple.com/legal/privacy/data/en/sign-in-with-apple/> e
    <https://developers.google.com/youtube/terms/developer-policies>.
    A tarefa 11.3 continua aberta.

78. Por solicitação do responsável, Apple foi incluída no inventário como
    integração planejada, não ativa: o botão atual diz “em breve” e não inicia
    login. Uma consulta aos registros MX públicos de `setlistbr.app.br` retornou
    `route1/2/3.mx.cloudflare.net`, compatível com roteamento de entrada do
    Cloudflare Email Routing. Isso identifica o primeiro salto do e-mail, mas
    não revela a regra nem a caixa de destino. A política agora registra
    Cloudflare para o roteamento e deixa o destino final pendente. Confirmar
    com o responsável a plataforma que recebe as mensagens. Documentação:
    <https://developers.cloudflare.com/email-service/configuration/domains/>.

79. O responsável confirmou que as mensagens encaminhadas pela Cloudflare para
    `contato@setlistbr.app.br` chegam a uma caixa Gmail/Google. A política agora
    identifica Cloudflare como roteador de entrada e Google como destinatário
    final das mensagens, que podem conter dados pessoais inseridos pela pessoa
    solicitante. Item registrado sob a mesma seção de fornecedores; verificar
    os termos efetivamente usados na revisão jurídica. O item 11.3 continua
    aberto.

80. O responsável aprovou a confirmação de recebimento de pedidos gerais e
    denúncias de conteúdo em até 5 dias úteis. Os rascunhos da política de
    privacidade e do procedimento de remoção agora distinguem esse aviso do
    prazo de atendimento ou resposta de mérito, que segue o prazo legal
    aplicável ou a análise necessária ao caso. Ainda falta definir prazo de
    retenção dos registros de solicitações. Referências oficiais: a ANPD indica
    os prazos legais por categoria de pedido e a Resolução nº 2/2022 prevê
    prazos diferenciados para agentes de pequeno porte elegíveis:
    <https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados-1/direito-dos-titulares>
    e
    <https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-2-de-27-de-janeiro-de-2022>.

81. O responsável aprovou verificar pedidos de conta primeiro pelo e-mail
    associado à conta e pedir apenas confirmação adicional mínima se houver
    divergência ou dúvida sobre autoridade. Denúncias de conteúdo também terão
    verificação proporcional da relação com o conteúdo/direito invocado. Não
    pedir documento oficial de identidade por padrão; em caso excepcional,
    explicar a necessidade e usar canal seguro. A política e o procedimento
    foram atualizados. Falta definir o procedimento seguro para documentos
    excepcionais e revisar a redação juridicamente; item 11.3 permanece aberto.

82. O responsável aprovou usar a caixa Gmail do canal como registro de casos,
    com uma etiqueta dedicada a privacidade/remoção, acesso restrito e sem
    planilha paralela. Acompanhar cada pedido pelo histórico da própria
    mensagem, anotando data, tipo, situação e encerramento; manter somente uma
    justificativa resumida e necessária. O responsável aprovou uma regra de
    retenção orientada à finalidade: conservar registros enquanto necessários
    para tratar/documentar o caso, cumprir obrigações ou exercer direitos;
    depois excluir ou anonimizar, salvo hipótese legal de guarda adicional,
    sem retenção indefinida. Política e procedimento foram atualizados. O
    inventário deve confirmar prazos e exceções concretos com assessoria
    jurídica antes da publicação. A LGPD (arts. 15 e 16) não fixa um prazo
    universal; a ANPD orienta que a necessidade seja avaliada conforme o caso:
    <https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm>
    e
    <https://www.gov.br/anpd/pt-br/acesso-a-informacao/perguntas-frequentes/perguntas-frequentes>.
    Item 11.3 continua aberto.

83. O responsável aprovou o procedimento excepcional para documentos de
    identidade: não solicitar por padrão nem receber na caixa geral de e-mail;
    se indispensável, explicar o motivo, usar apenas canal seguro previamente
    habilitado, apagar a cópia após a verificação salvo obrigação legal de
    retenção e guardar no caso somente justificativa, data e resultado, sem
    reproduzir dados do documento. Se o canal seguro não estiver disponível,
    buscar meio alternativo proporcional e não pedir o envio do documento. A
    política e o procedimento foram atualizados. Continua pendente habilitar
    um canal seguro antes de qualquer coleta excepcional, caso ela venha a ser
    necessária, além da revisão jurídica. Item 11.3 permanece aberto.

84. O responsável aprovou que o controlador receba e trate alertas de
    segurança pela caixa `contato@setlistbr.app.br`, usando etiqueta separada
    para incidentes e acesso restrito. O procedimento de remoção agora inclui
    triagem, preservação limitada de evidências, avaliação de risco, mitigação
    e registro mínimo das decisões; a política também lista incidentes como
    assunto que pode ser encaminhado ao canal geral. Ainda é necessário
    validar medidas técnicas concretas, completar o plano operacional de
    resposta e revisar prazos/comunicações conforme as regras aplicáveis; item
    11.3 continua aberto.

85. O responsável informou que já tem acesso à caixa postal
    `contato@setlistbr.app.br`. O procedimento agora registra esse estado e
    mantém como verificação operacional antes da ativação a criação das
    etiquetas separadas para privacidade/remoção e incidentes e a conferência
    dos acessos. A disponibilidade da caixa não confirma, por si só, a
    inclusão do endereço na Web/aplicativos ou a configuração das etiquetas.

86. A integração Sign in with Apple foi validada manualmente pelo usuário na
    Web e no Android, tanto no sucesso quanto na falha. O APK de desenvolvimento
    foi instalado no aparelho e conectado ao Metro em `19006`; o login Apple
    concluiu e retornou ao app. O `site_url` do projeto Supabase de
    desenvolvimento está em HTTPS para servir de fallback global quando o
    estado OAuth não puder ser recuperado; os redirects explícitos continuam
    sendo calculados por plataforma no início do login. A configuração de
    produção não foi alterada. A validação nativa iOS, inclusive falha, segue
    pendente até haver simulador compatível; nenhum build iOS foi feito.

87. Para validar em iPhone físico sem Development Client, foi criado o perfil
    EAS `preview-ios`, isolado do preview Android/Web. Ele herda distribuição
    interna, não define `developmentClient`, ativa o plugin Google nativo para
    aplicar os `modular_headers` necessários a `AppCheckCore`,
    `GoogleUtilities` e `RecaptchaInterop` e informa o URL scheme reverso do
    cliente iOS durante a avaliação inicial do app config. Os quatro pacotes
    Expo fora do patch esperado pelo SDK 57 foram atualizados; a primeira
    tentativa de build falhou no Expo Doctor e a segunda revelou a dependência
    dos module maps. A terceira compilação concluiu como IPA Ad Hoc para o
    iPhone XR registrado. Build EAS: `4dcab6d9-67c6-4d92-87ef-c24742faf799`.
    O IPA está pronto para instalação pelo link/QR da página da build. Ainda
    naquele momento faltavam a instalação e a validação manual no iOS; as
    validações Web/Android já estavam aprovadas.

88. O usuário instalou e validou o build EAS `preview-ios` em um iPhone físico.
    Os logins Google e Apple concluíram com sucesso e a navegação pelas telas
    foi verificada. A validação funcional básica do iOS está aprovada. Ainda
    faltava confirmar o fluxo de falha Apple e os testes e2e de papéis e
    convites no iOS; o teste não foi feito em simulador.

89. O usuário confirmou que o fluxo de falha do login Apple e os testes de
    papéis e convites também foram validados no iOS. As tarefas OpenSpec
    5.1.2.4 e 5.10.2 foram concluídas. Com isso, os fluxos funcionais de
    autenticação, papéis e convites estão validados em Web, Android e iOS.

90. O usuário confirmou que retorno e renovação de sessão foram validados em
    Web, Android e iOS. A tarefa OpenSpec 5.1 está concluída; os fluxos de
    autenticação Google/Apple e o ciclo de sessão estão validados nas três
    plataformas.

91. Após integrar o PR #22, foi aberta a branch `feat/pull-to-refresh-data`
    para adicionar atualização manual e revalidação ao foco, limitada às
    queries da tela ativa, em Minhas bandas, Banda, Repertório e Shows. O
    change OpenSpec `atualizacao-direcionada-dados` acompanha o trabalho; as
    tarefas de implementação e validação manual ainda não foram concluídas.
    A validação atual revelou a tela Minhas bandas vazia em Web e Android.
    Na Web, ao tocar em Atualizar, logs de desenvolvimento confirmaram 2
    vínculos e 2 registros de bandas sem erro do Supabase, embora a lista
    continue visualmente vazia. O próximo passo é conferir se há busca ativa,
    qual mensagem vazia é exibida e revisar a renderização; depois remover a
    instrumentação temporária de contagens em
    `src/data/supabase/repositories.ts`. Não havia aparelho conectado ao ADB
    para inspecionar a execução Android. O Metro está na porta `19006` e
    serviu bundles Web e Android com HTTP 200. O trabalho foi salvo na branch
    de feature para retomar esse diagnóstico; não integrar a PR antes de o
    usuário validar manualmente.

92. Na retomada, antes de revisar este handoff, confirmei que a branch atual é
    `feat/pull-to-refresh-data`, no commit `7332d6b`, rastreando
    `origin/feat/pull-to-refresh-data`, com a árvore limpa. O OpenSpec CLI
    `1.14.0` reconhece
    `atualizacao-direcionada-dados` e informa 4/4 artefatos de planejamento;
    no checklist, 3.1 é a única tarefa concluída. Não há processo ouvindo na
    porta `19006` e o comando `adb` não está disponível nesta máquina. Node
    `24.21.0` e npm `11.20.0` atendem às versões fixadas pelo projeto.

93. Os logs da Web mostraram que `useUserBandSummaries` conclui com 2 bandas,
    e `BandsScreen` recebe `queryStatus: success`, `sourceCount: 2`,
    `displayedCount: 2` e `searchActive: false`. Isso descartou falha na
    consulta e no filtro como causa da lista vazia.

94. A implementação do gesto de atualização passava `<ListRefreshControl />`
    dentro da prop `refreshControl`. O `ScrollView` do React Native Web clona
    essa prop envolvendo o próprio conteúdo; como o wrapper retornava `null`
    na Web e descartava `children` no Android, o conteúdo inteiro da lista era
    removido nas duas plataformas. O helper agora retorna `undefined` na Web
    e um elemento `RefreshControl` nativo diretamente no Android/iOS. As
    referências foram atualizadas em todas as telas afetadas. Uma edição
    intermediária de diagnóstico também causou erro de sintaxe no Metro; a
    sintaxe foi corrigida, os logs temporários removidos e o último bundle Web
    compilou. Naquele momento, faltava a validação visual final no Web e no
    Android; ela foi confirmada pelo usuário no item 196.

95. O usuário confirmou que, após corrigir a prop `refreshControl`, as
    informações voltaram a aparecer no Web e no Android. A instrumentação
    temporária `[bands:*]` não está mais no código; os logs de diagnóstico do
    repositório também foram removidos. Revisei os demais callsites alterados:
    listas de integrantes, repertório e shows, letra em tela cheia e o shell
    de detalhes passam um `RefreshControl` nativo direto e mantêm o botão Web
    visível onde previsto. Não identifiquei outro wrapper descartando conteúdo.
    Ainda falta validar manualmente gesto/botão e revalidação nessas telas; o
    change `atualizacao-direcionada-dados` permanece incompleto; a revisão dos
    controles compartilhados concluiu a tarefa 1.1 no checklist.

96. A pedido do usuário, em Minhas bandas o botão de atualização Web foi
    alinhado à direita do campo de busca e passou a exibir somente o ícone.
    Enquanto atualiza, o ícone é substituído por um indicador de atividade;
    o rótulo acessível informa o estado. O botão continua exclusivo da Web e
    o gesto nativo de atualização Android não foi alterado.

97. O mesmo padrão compacto foi aplicado aos outros botões de atualização
    Web: integrantes, repertório, shows, letra em tela cheia e detalhes de
    música/show. Repertório e shows exibem a ação à direita da busca; os
    controles de detalhes e integrantes preservam seu alinhamento. Todos
    mantêm rótulos acessíveis e indicador visual durante a atualização.

98. Corrigido o botão `Compartilhar convite novamente` na Web: quando o link
    ativo não está no cache da tela, a ação agora chama `renew_invitation`
    para revogar o link anterior, gerar o substituto e compartilhá-lo. Isso
    evita deixar dois convites ativos para a mesma ação. Se o link já está em
    cache, ele continua sendo compartilhado sem renovação. O fluxo nativo não
    foi alterado.

99. A revisão seguinte confirmou que a causa não era exclusiva da Web: sem a
    URL em memória, o fallback antigo chamava `onCreate` em qualquer
    plataforma. O recompartilhamento agora usa `onRenew` em Web, Android e
    iOS quando o link não está no cache; quando está, compartilha o link sem
    renovação. O teste existente foi ajustado para esperar a renovação, mas
    não foi executado.

100. O modo palco foi ocultado nesta primeira versão: o item Palco abre um
     popup informando que a função estará disponível no futuro. URLs antigas
     do palco também exibem o popup e voltam para a tela anterior ao fechá-lo.
     O botão de entrada no palco foi removido do detalhe do show.

101. O menu lateral foi alinhado e compactado, mantendo o item Palco com a
     mesma apresentação dos demais. Os itens Player YouTube e Perfil e conta
     compartilham a mesma estrutura visual dos links da banda. O rodapé do
     menu lateral e a tela de login exibem discretamente a versão do app.
     O usuário confirmou visualmente os ajustes de navegação antes do commit.

102. Os botões de login Apple e Google usam imagens dos logos oficiais em
     Web, Android e iOS; no iOS, o botão Apple usa o mesmo componente visual
     do Google. A configuração do build de desenvolvimento para simulador iOS
     recebeu o esquema de URL do cliente Google. Os registros anteriores sobre
     indisponibilidade do simulador referem-se a uma etapa anterior: depois o
     usuário disponibilizou um simulador com iOS 18.3.

103. Em 01/10/2026, a retomada do item 11.3 revisou os três rascunhos e o
     comportamento atual do app. A tela de login já oferece Google e Apple,
     enquanto os rascunhos descreviam Apple como indisponível; a tabela da
     política também descrevia YouTube como integrado à sincronização, embora
     hoje esteja apenas no protótipo. Os textos foram corrigidos para refletir
     o código. O procedimento de incidentes agora registra a comunicação à
     ANPD e às pessoas afetadas em até 3 dias úteis quando houver risco ou dano
     relevante, com complementação fundamentada em até 20 dias úteis quando
     aplicável, conforme a Resolução CD/ANPD nº 15/2024 e orientação da ANPD.
104. A revisão jurídica identificou que a autodeclaração de idade, decisão
     anterior do responsável e ainda não implementada no app, precisa ser
     reavaliada diante do ECA Digital (Lei nº 15.211/2025), em vigor desde
     17/03/2026, e das orientações preliminares da ANPD sobre aferição de idade.
     Assessoria deve determinar se o Setlist é serviço direcionado a menores ou
     de acesso provável por eles e qual mecanismo atende ao caso; não presumir
     que autodeclaração é suficiente. Referências: <https://planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/l15211.htm>
     e <https://www.gov.br/anpd/pt-br/assuntos/eca-digital/mecanismos-confiaveis-de-afericao-de-idade-orientacoes-preliminares.pdf>.
105. O item 11.3 continua aberto. A caixa `contato@setlistbr.app.br` foi
     confirmada como acessível pelo responsável, mas ainda não foi verificada
     a criação das etiquetas separadas e a restrição dos acessos. O contato
     ainda não aparece na Web/app; `Termos e privacidade` está desabilitado no
     menu, e a mensagem de login não contém links para os documentos. Permanecem
     pendentes identificação pública suficiente do controlador, URL canônica,
     escopos/contratos e subprocessadores dos fornecedores, transferências
     internacionais, prazos de retenção e backups, medidas de segurança
     confirmadas, critérios de remoção e revisão por profissional jurídico.
     Progresso OpenSpec permanece 85/113; 11.3 não foi marcada como concluída.

106. Em 01/10/2026, foi feita revisão jurídica preliminar dos três rascunhos,
     documentada em `docs/REVISAO_JURIDICA_PRELIMINAR.md`. Os textos foram
     confrontados com LGPD, Lei de Direitos Autorais, regulamentos e orientações
     da ANPD e com o comportamento do app. Foram corrigidos: a afirmação de que
     o conteúdo pertence à banda, referências públicas ao procedimento interno,
     a omissão dos dados recebidos no canal de contato, a enumeração dos direitos
     dos titulares, os prazos de pedidos de acesso, a apresentação da etiqueta
     do Gmail como restrição de acesso e a ambiguidade dos 20 dias para
     complementar comunicação de incidente à ANPD. O ECA Digital foi revisto
     com as orientações atuais da ANPD, inclusive o limiar do art. 31 para
     relatório de transparência. Continuam pendentes a identificação suficiente
     do controlador, acesso público e aceite dos documentos, inventário e
     retenção dos dados, transferências internacionais, enquadramento como
     pequeno porte, aferição de idade e avaliação por profissional habilitado.
     Os três textos continuam rascunhos; o item 11.3 permanece aberto.

107. Em 01/10/2026, o responsável confirmou as URLs canônicas futuras dos
     documentos públicos: `https://setlistbr.app.br/termos/` e
     `https://setlistbr.app.br/privacidade/`. As minutas passaram a registrar
     esses endereços como aprovados para publicação futura, sem afirmar que as
     páginas já existem. O procedimento de remoção continuará interno, com
     orientações públicas nos termos. A versão e a data de vigência serão
     definidas na aprovação final; a identificação pública previamente
     escolhida permanece `Setlist — setlistbr.app.br`, cuja suficiência jurídica
     ainda depende de avaliação profissional. O item 11.3 continua aberto.

108. A revisão da retenção do item 11.3 acrescentou à política uma matriz do
     ciclo de dados no banco ativo, baseada nas migrações: exclusão de conta
     remove perfil e autenticação, mas preserva conteúdo de bandas ativas;
     convites históricos e aceites permanecem até a exclusão da banda, com
     referências ao perfil desvinculadas quando a conta é excluída. Não foi
     encontrada limpeza automática para convites usados, vencidos ou revogados.
     É preciso definir e, se necessário, implementar o descarte desses registros.
     O plano, backups e PITR de `setlist-prod` ainda aguardam conferência no
     painel; a intenção anterior era começar no Free, mas isso não comprova a
     configuração ativa. Nenhum prazo específico de fornecedor foi publicado
     nas minutas como fato confirmado.

109. A etapa seguinte do item 11.3 mapeou bases legais candidatas por operação
     em `docs/REVISAO_JURIDICA_PRELIMINAR.md`: prestação do serviço, aceites,
     atendimento de pedidos e segurança exigem análise separada. O texto
     ressalva que letras e observações livres podem conter dados pessoais de
     terceiros, inclusive sensíveis; o aceite dos termos não é consentimento
     geral e legítimo interesse do art. 7º não substitui hipótese do art. 11.
     As minutas de termos e privacidade passaram a orientar a minimização
     desses dados. A política também descreve apenas medidas comprovadas no
     código: URL HTTPS do Supabase, variável destinada à chave publicável,
     RLS, SecureStore móvel com fallback em memória e armazenamento de sessão
     no navegador. A
     configuração efetiva de produção e as bases finais continuam pendentes.

110. A avaliação preliminar de idade foi detalhada na revisão jurídica: o
     ECA Digital usa critérios de acesso provável por menores (art. 1º), e a
     vedação expressa à autodeclaração do art. 9º, § 1º, refere-se a conteúdo,
     produto ou serviço impróprio, inadequado ou proibido a menores. A opção do
     operador por contas 18+ não resolve sozinha o enquadramento nem comprova
     que a autodeclaração basta. O app permite convites e conteúdo livre, mas
     não foi identificada disseminação social em larga escala no código
     consultado; o protótipo YouTube também deve entrar na avaliação. A
     classificação e o mecanismo proporcional dependem de análise jurídica.

111. A etapa seguinte do item 11.3 mapeou os fluxos de Supabase, Google/Apple,
     GitHub Pages, YouTube e Cloudflare → Gmail na revisão jurídica preliminar.
     A política agora separa a região primária brasileira do Supabase das
     possíveis operações fora do país, descreve a coleta do player já na
     abertura da tela e distingue anúncios próprios do Setlist de publicidade
     eventualmente exibida pelo YouTube. Os termos passaram a descrever o
     player incorporado e a vincular os Termos de Serviço do YouTube. A
     Resolução CD/ANPD nº 19/2024 exige classificar cada fluxo como coleta
     direta ou transferência entre agentes; o DPA público do Supabase cita
     cláusulas europeias, mas isso não comprova mecanismo brasileiro válido.
     Faltam checagem dos contratos/configurações efetivos, países de destino,
     bases legais e eventual transparência do art. 17. As minutas seguem sem
     autorização para publicação; o item 11.3 permanece aberto.

112. A revisão de retenção local identificou que a última banda selecionada
     fica em SecureStore no móvel e localStorage na Web. O logout não a limpava;
     a ação agora a remove. O QueryClient também mantinha cache em memória por
     tempo indefinido, com chaves de banda sem identificador da conta; ele
     agora é recriado quando muda a conta autenticada para impedir reutilização
     de dados em outra sessão no mesmo processo. A política e a revisão jurídica
     preliminar foram atualizadas com esse ciclo. Não foram executados testes
     nesta etapa. Plano, backup/PITR e logs efetivos de produção ainda exigem
     conferência; as minutas não estão aprovadas para publicação e 11.3 segue
     pendente.

113. Uma revisão cruzada do item 11.3 encontrou no design, na spec
     `band-access` e na apresentação pública a expressão de que o conteúdo
     pertenceria à banda. Esses materiais agora descrevem somente o vínculo
     técnico e a preservação do conteúdo para integrantes remanescentes, sem
     transferir titularidade autoral.
     A apresentação recebeu uma nota separando a visão do MVP completo da
     primeira versão Web/Android, que cobre apenas preparação online; os
     rótulos que sugeriam palco/offline já no primeiro ciclo foram ajustados.
     A revisão jurídica também registrou que as minutas prometem avisos de
     mudanças por e-mail e no app, mas o fluxo correspondente ainda não foi
     identificado na implementação. Antes de publicar, definir e validar o
     procedimento real de aviso e adequar a redação. As minutas permanecem
     rascunhos; 11.3 continua aberta.

114. O inventário preliminar de retenção foi ampliado com uma separação entre
     banco ativo, logs de API/banco, auditoria de autenticação, backups/PITR,
     visitas ao GitHub Pages, registros de encaminhamento da Cloudflare e
     mensagens no Gmail. O Supabase grava eventos de autenticação em logs
     externos e pode gravá-los também em `auth.audit_log_entries`, opção ainda
     não conferida em `setlist-prod`; excluir `auth.users` não comprova a
     eliminação desses registros. As janelas publicadas nos planos representam
     acesso/recuperação e não demonstram, sozinhas, a eliminação definitiva.
     Confirmar no painel o plano da organização, PITR e auditoria do projeto,
     além dos prazos e configurações efetivos de Cloudflare/Gmail. A política,
     o procedimento interno e a revisão jurídica preliminar foram atualizados
     sem atribuir prazos presumidos à produção. Não foram executados testes;
     as minutas seguem sem aprovação para publicação e 11.3 permanece aberta.

115. A etapa seguinte examinou a promessa de aviso de alterações nas minutas.
     O login não oferece links para termos e política, o menu mantém “Termos e
     privacidade” desabilitado e não há fluxo de avisos legais no app. A caixa
     de contato foi confirmada para recebimento, mas o remetente de saída e a
     entrega aos e-mails das contas não foram verificados. Termos e política
     agora preveem comunicação direta com destaque por e-mail cadastrado quando
     disponível ou outro meio adequado, sem prometer simultaneamente aviso no
     app. A revisão jurídica preliminar recebeu um procedimento para classificar
     mudanças, preservar versões, conferir envio e falhas e colher novo aceite
     quando necessário. Esse processo ainda precisa ser implementado e validado
     antes da publicação; a simples atualização da página não comprova ciência
     ou concordância. O item 11.3 continua aberto.

116. A revisão do procedimento de denúncias encontrou duas limitações técnicas
     que impedem tratar a minuta como fluxo operacional ativo. A função
     `remove_song` arquiva músicas ligadas a shows; a RLS ainda permite que
     integrantes leiam a música arquivada, portanto arquivar não retira o
     conteúdo. Não há comando administrativo de bloqueio ou fila de moderação.
     Além disso, `songs` não registra quem criou ou alterou cada item; a pessoa
     que enviou o conteúdo pode não ser identificável. O procedimento e os
     termos agora distinguem triagem, medida urgente efetiva, manifestação,
     decisão e contestação, com interlocução alternativa junto aos responsáveis
     pela banda sem presumir autoria. A revisão jurídica preliminar registra
     os limites e a necessidade de classificar cada tipo de denúncia à luz do
     Marco Civil, dos Temas 533/987 do STF e, se aplicável, do ECA Digital.
     Antes de publicar, validar mecanismo real de restrição/retirada, acesso
     administrativo, prazos de recurso e critérios jurídicos. O item 11.3
     permanece aberto.

117. Na análise ponto a ponto das decisões jurídicas do item 11.3, o
     responsável informou que não há menores de 18 anos nem bandas escolares
     entre os usuários atuais ou as bandas previstas para o piloto. A revisão
     jurídica preliminar registra esse fato e corrige a redação anterior, que
     poderia sugerir participação efetiva de adolescentes. O código ainda não
     verifica idade: a tela inicia Google/Apple sem convite e, após autenticação,
     oferece criação de banda. A configuração de cadastro do Supabase em
     produção não foi confirmada. Para avaliar acesso provável por menores no
     lançamento público, falta decidir se a entrada será aberta ou limitada por
     convite/allowlist, conferir a implementação e a classificação etária nas
     lojas. A ausência de menores no piloto não encerra, por si, a avaliação
     do ECA Digital. As minutas seguem rascunhos e 11.3 continua aberto.

118. O responsável esclareceu que o primeiro lançamento Web/Android será
     aberto ao público, sem convite ou allowlist para criar uma conta. A revisão
     jurídica preliminar foi atualizada: a facilidade de acesso passa a integrar
     expressamente a avaliação de acesso provável por menores do art. 1º do ECA
     Digital, embora não determine sozinha o enquadramento. Permanecem sem
     conferência a configuração real de cadastro do Supabase em produção, a
     classificação etária nas lojas e a política para conteúdo livre de letras
     e observações. O público pretendido continua 18+, mas não há aferição de
     idade implementada. Nenhuma minuta foi aprovada para publicação; 11.3
     segue aberto.

119. O responsável definiu que conteúdo pornográfico deve ser expressamente
     proibido, inclusive quando inserido em letras, observações ou links, e
     que a pessoa que o insere ou edita responde por seus atos. As três minutas
     receberam essa orientação: termos com proibição e canal de denúncia,
     política com transparência sobre a ausência de filtro automático e
     procedimento interno com triagem específica e urgência para indícios de
     exploração ou abuso sexual de menores. A revisão jurídica preliminar
     ressalva que a cláusula não elimina deveres legais do operador, não bloqueia
     tecnicamente conteúdo e não resolve sozinha a avaliação etária; também
     aponta que o aceite vigente da banda ainda precisa ser alinhado antes da
     publicação. O item 11.3 permanece aberto para revisão profissional.

120. Na etapa seguinte da avaliação etária do item 11.3, foi confirmado que o
     item `Player YouTube (protótipo)` ainda está visível no menu lateral e a
     rota carrega um vídeo de referência. A primeira versão pública foi
     descrita como preparação online, mas ainda não há decisão sobre incluir
     esse protótipo no lançamento. O `app.json` não comprova a classificação
     etária definida na loja. A revisão jurídica registra esse fato e aguarda a
     decisão do responsável; cadastro público e campos livres continuam na
     análise mesmo se o protótipo for retirado. O item 11.3 segue aberto.

121. O responsável decidiu inibir o acesso ao protótipo do YouTube na primeira
     versão pública Web/Android. O item temporário foi removido do menu lateral
     e a rota `/youtube-prototype` foi excluída, de modo que um endereço direto
     também não carregue o player. O componente técnico foi preservado para a
     futura integração. A referência do YouTube no detalhe de uma música ainda
     abre o aplicativo ou navegador externo somente após ação da pessoa. Termos,
     política, arquitetura de telas e revisão jurídica preliminar foram
     alinhados a esse escopo. O teste de navegação deixou de esperar o item
     temporário; nenhuma suíte foi executada nesta etapa. A classificação
     etária, a avaliação do ECA Digital e o item 11.3 continuam pendentes.

122. O responsável definiu que a primeira disponibilização pública será pela
     Web e pelo Google Play no Android. O repositório só comprova APKs internos
     nos perfis `development-android` e `preview`; o perfil `production` ainda
     não define envio à loja. A revisão jurídica foi atualizada com essa decisão
     e distingue público-alvo 18+ da classificação de conteúdo IARC, ambos a
     conferir no Play Console. Ainda não há evidência local de cadastro do app
     na loja ou dos valores declarados. A análise da Web e da aferição de idade
     permanece independente do preenchimento da loja; o item 11.3 segue aberto.

123. O responsável esclareceu que a limitação dos testes iOS foi resolvida e
     incluiu distribuição pública pela App Store na primeira versão, junto com
     Web e Google Play. O escopo atual de design, tarefas, termos, apresentação
     e revisão jurídica foi atualizado para Web/Android/iOS. As validações já
     realizadas em iPhone físico incluem login, navegação, papéis e convites;
     não há evidência de validação completa da preparação online nem de build
     pública aprovada. As tarefas 11.1 e 11.2 seguem marcadas conforme o escopo
     anterior; 11.1.1 e 11.2.1 registram a validação iOS restante, e 11.6/11.8
     cobrem piloto e distribuição das três plataformas. A diretriz 1.2 da App
     Store exige meios de filtragem de conteúdo inadequado, denúncia, resposta,
     bloqueio de usuários abusivos e contato, ainda não implementados em
     conjunto; 11.8.1 registra a pendência. Os questionários etários e de
     privacidade das lojas continuam sem confirmação. O item 11.3 permanece
     aberto e nenhuma minuta foi aprovada para publicação.

124. O responsável confirmou que o Setlist ainda não está cadastrado no Google
     Play Console nem no App Store Connect. Não há classificação IARC, faixa
     etária da App Store nem declarações de privacidade das lojas já preenchidas.
     A revisão jurídica preliminar foi corrigida para tratar criação dos
     cadastros e preenchimento dos questionários como etapas futuras, sem
     atribuir ao app uma classificação não obtida. O próximo ponto jurídico e
     operacional é o tratamento do conteúdo enviado por usuários exigido pela
     diretriz 1.2 da Apple. O item 11.3 segue aberto.

125. O responsável decidiu assumir um processo paralelo de filtragem de
     conteúdo indevido para a distribuição pública, separado da edição da banda.
     A revisão jurídica e a tarefa 11.8.1 registram a decisão como plano
     operacional, sem afirmar que o fluxo já está implementado ou que a App
     Store o aceitará. Permanecem por definir o momento da análise, quem a
     executa, o acesso ao conteúdo, o efeito técnico de uma decisão, o registro,
     denúncia, recurso e bloqueio de usuários abusivos. A diretriz 1.2 da Apple
     exige método de filtragem de material inadequado antes da postagem; o
     funcionamento concreto precisa ser confrontado com isso antes do envio.

126. O responsável definiu o processo paralelo como revisão **posterior** à
     publicação, acionada por denúncia ou inspeção. Todas as denúncias de
     usuários devem ser enviadas por e-mail a `contato@setlistbr.app.br`. Termos,
     política, procedimento interno e revisão jurídica foram ajustados para não
     prometer aprovação prévia ou filtro automático. A diretriz 1.2 da Apple
     pede método de filtragem antes da postagem; o fluxo posterior não comprova
     atendimento a esse ponto. A política de UGC do Google Play pede denúncia
     acessível dentro do app; o e-mail pode ser o meio de envio, mas é preciso
     criar e validar uma ação interna, além de definir controles proporcionais
     de bloqueio. A tarefa 11.8.1 registra essas pendências. O processo ainda
     não está implementado e o item 11.3 segue aberto.
