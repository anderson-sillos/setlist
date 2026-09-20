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

| Rota                                   | Tela                      | Arquivo                                        |
| -------------------------------------- | ------------------------- | ---------------------------------------------- |
| `/`                                    | Minhas bandas             | `src/features/bands/BandsScreen.tsx`           |
| `/auth`                                | Login social              | `src/features/auth/AuthScreen.tsx`             |
| `/auth/callback`                       | Retorno OAuth             | `src/features/auth/OAuthCallbackHandler.tsx`   |
| `/invite/[token]`                      | Convite e autenticação    | `src/features/auth/InviteScreen.tsx`           |
| `/bands/[bandId]/band`                 | Banda e integrantes       | `src/features/bands/BandScreen.tsx`            |
| `/bands/[bandId]/repertoire`           | Repertório                | `src/features/repertoire/RepertoireScreen.tsx` |
| `/bands/[bandId]/repertoire/[songId]`  | Detalhes da música        | `src/features/repertoire/SongDetailScreen.tsx` |
| `/bands/[bandId]/shows`                | Shows                     | `src/features/shows/ShowsScreen.tsx`           |
| `/bands/[bandId]/shows/[showId]`       | Detalhes do show          | `src/features/shows/ShowDetailScreen.tsx`      |
| `/bands/[bandId]/stage`                | Seleção para o modo palco | `src/features/stage/StageHubScreen.tsx`        |
| `/bands/[bandId]/shows/[showId]/stage` | Execução do modo palco    | `src/features/stage/StageScreen.tsx`           |

O protótipo técnico `/youtube-prototype` fica fora da navegação principal e serve somente para validar a integração web do player do YouTube antes da implementação no detalhe da música.

As telas de autenticação ficam em `src/features/auth/`. O fluxo real usa
`AuthScreen`, `OAuthCallbackHandler` e `InviteScreen`. O handler do callback
troca o código OAuth e redireciona diretamente para a área protegida ou para o
convite, sem exibir uma tela intermediária de sucesso. As telas temporárias do
protótipo 3.4 foram removidas quando o fluxo real entrou no menu principal; o
histórico técnico permanece registrado no handoff e no design.

## Componentes estruturais

| Responsabilidade                             | Arquivo                                                                                            |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Composição da estrutura geral                | `src/features/navigation/AppNavigationShell.tsx`                                                   |
| Cabeçalho fixo                               | `src/features/navigation/components/AppHeader.tsx`                                                 |
| Barra inferior móvel                         | `src/features/navigation/components/BottomNavigation.tsx`                                          |
| Conteúdo do menu lateral                     | `src/features/navigation/components/NavigationPanel.tsx`                                           |
| Drawer e fundo do menu móvel                 | `src/features/navigation/components/MobileNavigationDrawer.tsx`                                    |
| Estado, animação e gesto do drawer           | `src/features/navigation/hooks/useNavigationDrawer.ts`                                             |
| Restauração de rota e rolagem da seção       | `src/features/navigation/hooks/useBandNavigationState.ts` e `NavigationMemory.tsx`                 |
| Definição das seções de navegação            | `src/features/navigation/navigationItems.ts`                                                       |
| Contexto visual da banda selecionada         | `src/features/navigation/BandAreaLayout.tsx`                                                       |
| Persistência da última banda autorizada      | `src/features/bands/LastBandSelection.tsx` e `lastBandStorage.ts`                                  |
| Criação de banda e aceite do termo           | `src/features/bands/BandCreationDialog.tsx`, `legalTerm.ts` e `src/data/supabase/bandMutations.ts` |
| Construção dos endereços das rotas           | `src/features/navigation/routes.ts`                                                                |
| Preservação de filtros e visão de cada seção | `src/features/navigation/useSectionViewState.ts`                                                   |
| Calendário mensal                            | `src/features/calendar/MonthCalendar.tsx`                                                          |
| Cronômetro manual                            | `src/features/stage/useManualTimer.ts`                                                             |
| Formatação de datas e chaves civis           | `src/utils/dateTime.ts`                                                                            |
| Formatação de durações                       | `src/utils/duration.ts`                                                                            |
| Normalização de buscas                       | `src/utils/text.ts`                                                                                |
| Cálculo de duração da setlist                | `src/domain/setlistDuration.ts`                                                                    |
| Rótulos visuais de Shows e Repertório        | `src/features/shows/showPresentation.ts` e `src/features/repertoire/songPresentation.ts`           |

## Organização dos testes

| Escopo                                      | Local                                                                                                     |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Shell responsivo, menu, cabeçalhos e gestos | `src/features/navigation/__tests__/navigationShell-test.tsx`                                              |
| Integração das entradas de rota             | `src/features/navigation/__tests__/navigationIntegration-test.tsx`                                        |
| Memória de rota, rolagem e visão            | `src/features/navigation/__tests__/navigationMemory-test.tsx`                                             |
| Construção e codificação de endereços       | `src/features/navigation/__tests__/navigationRoutes-test.ts`                                              |
| Autenticação, state OAuth e convite         | `src/features/auth/__tests__/`                                                                            |
| Telas de bandas                             | `src/features/bands/__tests__/BandsScreen-test.tsx` e `BandScreen-test.tsx`                               |
| Seleção persistida de banda                 | `src/features/bands/__tests__/lastBandStorage-test.ts`                                                    |
| Criação de banda e aceite do termo          | `src/features/bands/__tests__/BandsScreen-test.tsx` e `src/data/supabase/__tests__/bandMutations-test.ts` |
| Repertório e detalhe da música              | `src/features/repertoire/__tests__/RepertoireScreen-test.tsx` e `SongDetailScreen-test.tsx`               |
| Shows e detalhe do show                     | `src/features/shows/__tests__/ShowsScreen-test.tsx` e `ShowDetailScreen-test.tsx`                         |
| Seleção do modo palco                       | `src/features/stage/__tests__/StageHubScreen-test.tsx`                                                    |

Ao criar uma tela, primeiro escolha o domínio responsável, crie o arquivo da tela nele e depois adicione uma entrada pequena em `src/app`. A entrada de rota não deve conter regras de negócio nem estilos da tela.
