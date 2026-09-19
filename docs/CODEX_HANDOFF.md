# Handoff do Codex — Setlist

Este documento preserva o contexto necessário para que uma nova sessão do Codex continue o projeto sem reconstruir decisões já confirmadas. Ele resume o histórico de trabalho; os artefatos OpenSpec continuam sendo a fonte normativa do produto.

## Estado atual

- Repositório: `anderson-sillos/setlist`.
- Branch principal: `main`.
- Branch de trabalho: `feat/supabase-environments`.
- Change ativo: `definir-mvp-setlist`.
- Workflow OpenSpec: `spec-driven`, com 4/4 artefatos de planejamento concluídos.
- PR #10: segunda rodada de melhorias de UI integrada à `main`.
- PR #11: grupo 3 integrado à `main` por squash no commit `74be3c3` e encerrado após aprovação manual e CI aprovado.
- PR #12: grupo 4 aberto a partir de `feat/supabase-environments` e aguardando revisão.
- Implementação: Incrementos 1 e 2 concluídos até a tarefa 2.13; todo o grupo 3 foi implementado, validado e documentado; todo o grupo 4 foi concluído até a tarefa 4.8.
- Entrega atual: prévia web publicada e build interno Android final `76bdb0d2` concluído; build e acesso remoto no iOS adiados e registrados em `REVISAO_INCREMENTO_2.md`.
- Revisão: o relatório funcional, as decisões de UX/UI e os refinamentos finais foram aprovados explicitamente pelo usuário.
- Estado atual: a implementação da tarefa 5.1 segue em andamento por causa do iOS nativo adiado; o login foi validado manualmente na web, no Expo Go Android e no development build Android com Google nativo. A tarefa 5.2 foi implementada e validada manualmente no development build Android e na web, incluindo restauração da sessão e renovação ao retornar ao primeiro plano.

## Fontes de verdade

- `openspec/changes/definir-mvp-setlist/proposal.md`: motivação, escopo e capacidades.
- `openspec/changes/definir-mvp-setlist/design.md`: arquitetura, decisões e riscos.
- `openspec/changes/definir-mvp-setlist/specs/`: contratos de comportamento por capacidade.
- `openspec/changes/definir-mvp-setlist/tasks.md`: estratégia incremental e checklist de implementação.

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
56. A implementação do fluxo híbrido foi iniciada. `react-native-nitro-google-signin` e `react-native-nitro-modules` são carregados somente quando o runtime Android não é Expo Go e existe `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`; `src/features/auth/nativeGoogleModule.ts` mantém o import nativo isolado, `nativeGoogleSignIn.ts` troca o ID Token por sessão Supabase e retorna `unsupported` para o fallback OAuth. O config plugin é habilitado somente em builds Android (`EAS_BUILD_PLATFORM=android` ou `SETLIST_NATIVE_GOOGLE_ANDROID=1`); o iOS continua no navegador nesta etapa. Testes automatizados cobrem sucesso, ausência de credencial, cancelamento, indisponibilidade e falha da troca do token.
57. O diagnóstico do fluxo nativo foi instrumentado com eventos seguros `[auth:native-google]`, habilitados somente no ambiente de desenvolvimento. Os eventos cobrem cada etapa sem registrar tokens, Client IDs ou sessões. `eas.json` agora possui o perfil `development-android`, que gera um APK com `expo-dev-client`; após instalá-lo, alterações JavaScript e dos logs podem ser testadas pelo Metro sem novo build. Dependências nativas, plugins, configuração nativa, assinatura ou pacote Android continuam exigindo novo build. O README documenta `npm run build:development:android`, `npx expo start --dev-client --tunnel --clear` e `adb logcat -s ReactNativeJS`.
58. A experiência de sucesso do login foi refinada sem antecipar a persistência da tarefa 5.2. `AuthScreen` e `OAuthCallbackScreen` agora exibem um cartão `Login concluído`, mostram o e-mail quando o provedor o devolve e oferecem uma ação explícita para seguir para `Minhas bandas` ou retomar o convite. Cancelamento e falha continuam permitindo uma nova tentativa. Testes de componente cobrem os dois destinos e o retorno OAuth; formato, lint, TypeScript e os 193 testes automatizados passaram. A validação manual confirmou web e Expo Go Android; o desenvolvimento nativo Android e iOS seguem pendentes.
59. A revisão de UX da autenticação foi aplicada. Os botões agora diferenciam Google e Apple por ícones vetoriais próprios, o estado de abertura mostra indicador acessível, erros recuperáveis aparecem em um aviso destacado e o retorno OAuth usa o mesmo padrão de carregamento/erro. Após o sucesso, permanece somente a ação principal para `Minhas bandas` ou convite. A suíte passou com 194 testes e cobertura global de branches de 80,57%; não houve commit nesta etapa.
60. O primeiro runtime web reportou erro ao montar `AuthProviderIcon`. A causa foi isolada na forma de renderização do SVG e nas propriedades de acessibilidade aplicadas diretamente ao elemento. O componente agora usa o import default recomendado de `react-native-svg`, mantém as propriedades de acessibilidade em um `View` nativo e deixa o `Svg` apenas com dimensões, `viewBox` e paths. O `npm run export:web` voltou a concluir com sucesso; ao testar o servidor Metro, limpar o cache com `npx expo start --web --clear`.
61. O fluxo de entrada foi protegido no layout raiz. `AuthSessionProvider` consulta a sessão atual e acompanha mudanças do Supabase; `AuthGate` mantém o carregamento enquanto a consulta está pendente, apresenta `AuthScreen` diretamente em rotas privadas sem sessão e só monta a pilha protegida depois da autenticação. As rotas `auth` e `invite` continuam públicas para concluir OAuth e convites. A restauração persistente entre reinícios permanece no escopo da tarefa 5.2.
62. A tela de login recebeu uma revisão visual. O topo agora apresenta o ícone, o nome `Setlist` e uma breve explicação do produto; a orientação contextual para o acesso por Google ou Apple, inclusive para quem ainda não possui banda, fica junto dos controles no centro da tela. Os dois botões usam `variant="secondary"`, o mesmo fundo e ícones maiores; o rodapé exibe um disclaimer discreto sobre termos e privacidade. `Screen` passou a aceitar estilo de conteúdo para permitir esse alinhamento sem afetar as demais telas. A suíte passou com 194 testes e o export web foi validado.

63. O fluxo OAuth recebeu uma proteção contra o retorno duplicado observado no Android. O cliente nativo agora guarda somente o verificador temporário do PKCE no `SecureStore`, com fallback em memória; a sessão continua não persistida até a tarefa 5.2. `completeOAuthCallback` compartilha a mesma Promise por cliente e código durante uma janela curta, evitando que `openAuthSessionAsync` e `/auth/callback` consumam o mesmo código duas vezes e gerem `invalid flow state`. `getSupabaseClient` também preserva a instância em `globalThis`, evitando múltiplos `GoTrueClient` após Fast Refresh no navegador. A leitura do PKCE prioriza a gravação em memória sobre um valor antigo do SecureStore para impedir a reutilização do verifier após uma nova tentativa. A suíte passou com 200 testes, o export web foi validado e formato, lint, TypeScript e `git diff --check` passaram; não houve commit nesta etapa.
64. Para evitar divergência entre tentativas simultâneas ou retomadas pelo navegador, o cliente habilitou `experimental.appendPkceFlowIdToRedirects`. O callback agora preserva `sb_flow_id` e passa o identificador à troca da sessão, selecionando o verifier específico de cada fluxo. Os Redirect URLs documentados no README usam `**` no final do callback para aceitar esse parâmetro; o `Site URL` não foi alterado.
65. As URLs de callback do projeto Supabase de desenvolvimento foram sincronizadas pela CLI autenticada, usando um arquivo temporário que declarava somente `auth.site_url` e `auth.additional_redirect_urls`. Foram mantidos o `setlist://auth/callback` como `Site URL`, o retorno do GitHub Pages já existente e as configurações hospedadas não declaradas. A lista agora aceita `localhost:8081`, túneis `*.exp.direct`, Expo Go (`exp://**/--/`) e o esquema nativo, incluindo parâmetros `sb_flow_id`; o `config diff` final não apontou alterações pendentes nessas URLs.
66. A tarefa 5.2 foi iniciada. `nativeAuthStorage` passou a persistir tanto a sessão `sb-*-auth-token` quanto os verificadores PKCE no `expo-secure-store`, com fallback em memória somente quando o armazenamento seguro não estiver disponível; chaves que não pertencem à autenticação continuam ignoradas. Na web, o cliente mantém o armazenamento persistente padrão do navegador. `AuthSessionProvider` coordena `startAutoRefresh` e `stopAutoRefresh` conforme o ciclo ativo/segundo plano do aplicativo móvel. Testes cobrem gravação, restauração, remoção, falha do SecureStore, restauração do estado e renovação ao retornar ao primeiro plano. A correção do nonce do Google nativo também foi validada automaticamente com 43 suítes e 200 testes; não houve commit nesta etapa.
67. A validação manual da tarefa 5.2 foi concluída no development build Android e na versão web: após o login, o aplicativo foi encerrado e reaberto com a sessão restaurada, e o retorno do segundo plano preservou a sessão e retomou a renovação automática. A tarefa foi marcada como concluída no OpenSpec. A tarefa 5.1 continua parcialmente aberta apenas pelo iOS nativo adiado; a próxima atividade é a implementação de `Minhas bandas` na tarefa 5.3. Ainda não houve commit nesta etapa.
68. Antes de iniciar a tarefa 5.3, foi aplicada uma correção específica da web no `SearchField`: o contorno automático de foco do navegador foi removido do `TextInput`, mantendo a borda externa do componente e o comportamento visual nativo em Android/iOS. O workflow do GitHub Pages passou a receber e validar as variáveis públicas do Supabase; a branch `feat/supabase-environments` foi autorizada temporariamente no ambiente de publicação e a versão hospedada foi atualizada com sucesso para validação do login fora do Metro. A URL publicada é `https://anderson-sillos.github.io/setlist/app/`. A tarefa 5.3 continua pendente.

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

## Próxima ação recomendada

Iniciar a tarefa 5.3, implementando `Minhas bandas`, busca por nome, próximo
show, seleção e restauração da última banda autorizada e o fluxo sem banda. A
tarefa 5.1 continua parcialmente aberta pelo iOS nativo adiado; o OAuth pelo
navegador permanece o caminho suportado nessa plataforma.
