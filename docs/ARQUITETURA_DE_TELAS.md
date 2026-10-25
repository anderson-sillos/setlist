# Arquitetura de telas

Este documento indica onde localizar cada tela do Setlist e define a convenção para novas telas.

## Convenção

- `src/app/` contém somente as entradas de rota do Expo Router. Esses arquivos leem parâmetros da URL e renderizam uma tela.
- `src/features/<domínio>/` contém a implementação visual e o comportamento das telas daquele domínio.
- Cada tela principal fica em um arquivo com o sufixo `Screen.tsx`.
- `src/features/navigation/` contém somente a estrutura compartilhada de navegação, como cabeçalho, menu lateral, barra inferior, rotas e memória de navegação.
- Os arquivos de rota com segmentos dinâmicos, como `src/app/bands/[bandId]/repertoire/[songId].tsx`, usam a sintaxe oficial do Expo Router. Os colchetes são intencionais, aceitos pelos sistemas de arquivos suportados e não devem ser trocados por nomes alternativos; ao referenciá-los em comandos de shell, use aspas para evitar expansão de curingas.
- `src/domain/` contém regras de negócio puras, sem formatação visual ou dependência de componentes.
- `src/utils/` contém funções puras reutilizadas por mais de um domínio, separadas por assunto; não deve existir um `utils.ts` genérico.
- `src/config/` contém constantes transversais de configuração, como idioma e fuso horário de apresentação.
- `src/components/` contém componentes reutilizáveis que não pertencem a um único domínio.
- Os testes de cada tela ficam em `__tests__/` dentro do domínio correspondente; `src/features/navigation/__tests__/` fica reservado ao shell, às rotas, à memória de navegação e às integrações entre rotas.

## Mapa de rotas e telas

| Rota                                         | Tela                    | Arquivo                                         |
| -------------------------------------------- | ----------------------- | ----------------------------------------------- |
| `/`                                          | Minhas bandas           | `src/features/bands/BandsScreen.tsx`            |
| `/account`                                   | Perfil e conta          | `src/features/account/AccountScreen.tsx`        |
| `/auth`                                      | Login social            | `src/features/auth/AuthScreen.tsx`              |
| `/auth/callback`                             | Retorno OAuth           | `src/features/auth/OAuthCallbackHandler.tsx`    |
| `/invite/[token]`                            | Convite e autenticação  | `src/features/auth/InviteScreen.tsx`            |
| `/bands/[bandId]/band`                       | Banda e integrantes     | `src/features/bands/BandScreen.tsx`             |
| `/bands/[bandId]/repertoire`                 | Repertório              | `src/features/repertoire/RepertoireScreen.tsx`  |
| `/bands/[bandId]/repertoire/new`             | Nova música             | `src/features/repertoire/SongEditorScreen.tsx`  |
| `/bands/[bandId]/repertoire/[songId]`        | Detalhes da música      | `src/features/repertoire/SongDetailScreen.tsx`  |
| `/bands/[bandId]/repertoire/[songId]/lyrics` | Letra em tela cheia     | `src/features/repertoire/SongLyricsScreen.tsx`  |
| `/bands/[bandId]/repertoire/[songId]/edit`   | Edição da música        | `src/features/repertoire/SongEditorScreen.tsx`  |
| `/bands/[bandId]/shows`                      | Shows                   | `src/features/shows/ShowsScreen.tsx`            |
| `/bands/[bandId]/shows/[showId]`             | Detalhes do show        | `src/features/shows/ShowDetailScreen.tsx`       |
| `/bands/[bandId]/stage`                      | Modo palco indisponível | `src/features/stage/StageUnavailableScreen.tsx` |
| `/bands/[bandId]/shows/[showId]/stage`       | Modo palco indisponível | `src/features/stage/StageUnavailableScreen.tsx` |

`StageHubScreen.tsx`, `StageScreen.tsx` e `YouTubeIframePrototype.tsx` são
protótipos mantidos para trabalho futuro. As rotas de palco atuais renderizam
`StageUnavailableScreen`; nenhuma rota do app importa os protótipos. Os testes
unitários desses componentes não significam que estejam acessíveis no produto.
A rota `/youtube-prototype` foi removida da versão publicável.

As telas de autenticação ficam em `src/features/auth/`. O fluxo real usa
`AuthScreen`, `OAuthCallbackHandler` e `InviteScreen`. O handler do callback
troca o código OAuth e redireciona diretamente para a área protegida ou para o
convite, sem exibir uma tela intermediária de sucesso. As telas temporárias do
protótipo 3.4 foram removidas quando o fluxo real entrou no menu principal; o
histórico técnico permanece registrado no handoff e no design.

### Letra sincronizada em tela cheia

`SongLyricsScreen` compõe cabeçalho compacto, área rolável e controles
compactos sobrepostos ao fim da tela. A barra translúcida deixa a letra visível
por baixo, enquanto um respiro inferior mantém os versos finais acessíveis. A tela só
ativa o acompanhamento quando `useTimedLyricsSession` considera a letra
síncrona e temporalmente válida. Esse hook reutiliza `useManualTimer`, já
validado na atividade 3.3, e deriva dele o tempo, o destaque e a prévia da
barra; a sessão não é gravada nos repositórios.
Em tablets e janelas largas, a coluna da letra fica centralizada e limitada a
840 pontos; os controles mantêm seu limite de largura independente.

`timedLyrics.ts` projeta as linhas marcadas em grupos temporais sem modificar o
documento. `SongLyricsContent` mantém os blocos e formatações, mede o documento,
os blocos e as linhas depois de aplicar opacidade e negrito, sem mudar cores ou
fundos, e permite selecionar uma linha marcada. `lyricAutoScroll.ts` reúne os cálculos de limites e centralização. A
tela reserva espaço nas extremidades para centralizar a primeira e a última
linha, acompanha os grupos automaticamente e suspende esse movimento depois de
uma rolagem humana. O botão **Acompanhar** retoma a centralização. Os eventos de
rolagem manual na Web complementam `onScrollBeginDrag` das plataformas nativas;
a Web normaliza as medições do DOM em relação ao conteúdo do `ScrollView` e
dispara a rolagem pela referência React Native com `{ y, animated }`, assinatura
instalada no elemento DOM pelo React Native Web. A rolagem automática é suave
na Web e animada no iOS/Android, exceto quando a
preferência por movimento reduzido está ativa. A interação manual cancela a
animação em curso. Na tela sincronizada, versos inativos e nomes dos blocos ficam
com 65% de opacidade; o verso atual fica em 100%, em negrito e com a cor normal,
sem fundo de destaque. Há respiro antes e depois do verso, sem aumentar o tamanho
da fonte ou a altura de linha. Alterações de layout próximas são reunidas antes de cada rolagem para
evitar reinícios da animação; a interação manual interrompe o movimento atual.

`TimedLyricsControls` apresenta reinício à esquerda, comandos alinhados ao eixo
central da barra de progresso e o botão Acompanhar somente com ícone à direita.
Os rótulos ficam em uma linha, com fonte menor nos ajustes de cinco segundos;
Play/Pause usa um botão circular maior, sem fundo colorido. O tempo atual e a duração ficam na
mesma linha do slider, reduzindo a altura do rodapé sem reduzir as áreas de toque.
O rodapé respeita o inset inferior do sistema no iOS e Android e aplica o valor uma única vez.
`ProgressSlider` aparece apenas quando a duração cadastrada é válida e maior que
a última marca. Arrastar a barra mostra uma
prévia separada do relógio e confirma um salto ao soltar. Tocar ou ativar por
teclado uma linha marcada faz o mesmo salto e retoma o acompanhamento; nenhuma
dessas ações inicia a contagem por conta própria.

## Componentes estruturais

| Responsabilidade                             | Arquivo                                                                                                              |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Composição da estrutura geral                | `src/features/navigation/AppNavigationShell.tsx`                                                                     |
| Cabeçalho fixo                               | `src/features/navigation/components/AppHeader.tsx`                                                                   |
| Barra inferior móvel                         | `src/features/navigation/components/BottomNavigation.tsx`                                                            |
| Conteúdo do menu lateral                     | `src/features/navigation/components/NavigationPanel.tsx`                                                             |
| Drawer e fundo do menu móvel                 | `src/features/navigation/components/MobileNavigationDrawer.tsx`                                                      |
| Estado, animação e gesto do drawer           | `src/features/navigation/hooks/useNavigationDrawer.ts`                                                               |
| Restauração de rota e rolagem da seção       | `src/features/navigation/hooks/useBandNavigationState.ts` e `NavigationMemory.tsx`                                   |
| Definição das seções de navegação            | `src/features/navigation/navigationItems.ts`                                                                         |
| Contexto visual da banda selecionada         | `src/features/navigation/BandAreaLayout.tsx`                                                                         |
| Persistência da última banda autorizada      | `src/features/bands/LastBandSelection.tsx` e `lastBandStorage.ts`                                                    |
| Criação de banda e aceite do termo           | `src/features/bands/BandCreationDialog.tsx`, `legalTerm.ts` e `src/data/supabase/bandMutations.ts`                   |
| Perfil, exclusão de conta e limpeza local    | `src/features/account/AccountScreen.tsx`, `AccountDeletionDialog.tsx` e `src/data/supabase/accountMutations.ts`      |
| Consulta remota de bandas e integrantes      | `src/data/supabase/repositories.ts` e `src/providers/AppProviders.tsx`                                               |
| Consulta remota e edição de músicas          | `src/data/supabase/songRepository.ts`, `songMutations.ts` e `src/providers/AppProviders.tsx`                         |
| Fábricas, cenários e repositórios de teste   | `src/testing/factories/`, `src/testing/scenarios/`, `src/testing/repositories/` e `src/testing/TestAppProviders.tsx` |
| Construção dos endereços das rotas           | `src/features/navigation/routes.ts`                                                                                  |
| Preservação de filtros e visão de cada seção | `src/features/navigation/useSectionViewState.ts`                                                                     |
| Calendário mensal                            | `src/features/calendar/MonthCalendar.tsx`                                                                            |
| Cronômetro manual                            | `src/features/stage/useManualTimer.ts`                                                                               |
| Formatação de datas e chaves civis           | `src/utils/dateTime.ts`                                                                                              |
| Formatação de durações                       | `src/utils/duration.ts`                                                                                              |
| Normalização de buscas                       | `src/utils/text.ts`                                                                                                  |
| Cálculo de duração da setlist                | `src/domain/setlistDuration.ts`                                                                                      |
| Rótulos visuais de Shows e Repertório        | `src/features/shows/showPresentation.ts` e `src/features/repertoire/songPresentation.ts`                             |

## Organização dos testes

| Escopo                                          | Local                                                                                                                                                                                                  |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Shell responsivo, menu, cabeçalhos e gestos     | `src/features/navigation/__tests__/navigationShell-test.tsx`                                                                                                                                           |
| Integração das entradas de rota                 | `src/features/navigation/__tests__/navigationIntegration-test.tsx`                                                                                                                                     |
| Memória de rota, rolagem e visão                | `src/features/navigation/__tests__/navigationMemory-test.tsx`                                                                                                                                          |
| Construção e codificação de endereços           | `src/features/navigation/__tests__/navigationRoutes-test.ts`                                                                                                                                           |
| Autenticação, state OAuth e convite             | `src/features/auth/__tests__/`                                                                                                                                                                         |
| Telas de bandas                                 | `src/features/bands/__tests__/BandsScreen-test.tsx` e `BandScreen-test.tsx`                                                                                                                            |
| Seleção persistida de banda                     | `src/features/bands/__tests__/lastBandStorage-test.ts`                                                                                                                                                 |
| Criação de banda e aceite do termo              | `src/features/bands/__tests__/BandsScreen-test.tsx` e `src/data/supabase/__tests__/bandMutations-test.ts`                                                                                              |
| Perfil e exclusão de conta                      | `src/features/account/__tests__/` e `src/data/supabase/__tests__/accountMutations-test.ts`                                                                                                             |
| Repertório, detalhe e editor da música          | `src/features/repertoire/__tests__/`, `src/data/supabase/__tests__/songRepository-test.ts` e `songMutations-test.ts`                                                                                   |
| Cronômetro e apresentação da letra sincronizada | `src/features/repertoire/__tests__/timedLyrics-test.ts`, `lyricAutoScroll-test.ts`, `SongLyricsContent-test.tsx`, `SongDetailScreen-test.tsx` e `src/features/stage/__tests__/useManualTimer-test.tsx` |
| Shows e detalhe do show                         | `src/features/shows/__tests__/ShowsScreen-test.tsx` e `ShowDetailScreen-test.tsx`                                                                                                                      |
| Aviso de indisponibilidade do modo palco        | `src/features/navigation/__tests__/navigationIntegration-test.tsx`                                                                                                                                     |

Ao criar uma tela, primeiro escolha o domínio responsável, crie o arquivo da tela nele e depois adicione uma entrada pequena em `src/app`. A entrada de rota não deve conter regras de negócio nem estilos da tela.

## Dados e limites dos testes

Os auxiliares de teste ficam em `src/testing/` e não são usados pelo aplicativo em produção. Fábricas criam entidades tipadas; cenários compõem somente os dados relacionados ao caso; repositórios em memória mantêm estado para que telas e hooks consultem o resultado de uma interação. `TestAppProviders` exige que o teste informe usuário e repositórios, sem carregar um catálogo implícito.

Testes de tela verificam apresentação, interação, consultas e reação a falhas explicitamente simuladas. Testes de adaptador verificam argumentos, mapeamento e propagação de erros do Supabase. Regras de integridade, acesso, concorrência e atomicidade são verificadas pelos testes do banco e não são garantidas pelos auxiliares em memória. Consulte `src/testing/README.md` para exemplos e comandos.
