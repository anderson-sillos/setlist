# Arquitetura de telas

Este documento indica onde localizar cada tela do Setlist e define a convenção para novas telas.

## Convenção

- `src/app/` contém somente as entradas de rota do Expo Router. Esses arquivos leem parâmetros da URL e renderizam uma tela.
- `src/features/<domínio>/` contém a implementação visual e o comportamento das telas daquele domínio.
- Cada tela principal fica em um arquivo com o sufixo `Screen.tsx`.
- `src/features/navigation/` contém somente a estrutura compartilhada de navegação, como cabeçalho, menu lateral, barra inferior, rotas e memória de navegação.
- `src/components/` contém componentes reutilizáveis que não pertencem a um único domínio.

## Mapa de rotas e telas

| Rota                                   | Tela                      | Arquivo                                        |
| -------------------------------------- | ------------------------- | ---------------------------------------------- |
| `/`                                    | Minhas bandas             | `src/features/bands/BandsScreen.tsx`           |
| `/bands/[bandId]/band`                 | Banda e integrantes       | `src/features/bands/BandScreen.tsx`            |
| `/bands/[bandId]/repertoire`           | Repertório                | `src/features/repertoire/RepertoireScreen.tsx` |
| `/bands/[bandId]/repertoire/[songId]`  | Detalhes da música        | `src/features/repertoire/SongDetailScreen.tsx` |
| `/bands/[bandId]/shows`                | Shows                     | `src/features/shows/ShowsScreen.tsx`           |
| `/bands/[bandId]/shows/[showId]`       | Detalhes do show          | `src/features/shows/ShowDetailScreen.tsx`      |
| `/bands/[bandId]/stage`                | Seleção para o modo palco | `src/features/stage/StageHubScreen.tsx`        |
| `/bands/[bandId]/shows/[showId]/stage` | Execução do modo palco    | `src/features/stage/StageScreen.tsx`           |

## Componentes estruturais

| Responsabilidade                             | Arquivo                                                                            |
| -------------------------------------------- | ---------------------------------------------------------------------------------- |
| Composição da estrutura geral                | `src/features/navigation/AppNavigationShell.tsx`                                   |
| Cabeçalho fixo                               | `src/features/navigation/components/AppHeader.tsx`                                 |
| Barra inferior móvel                         | `src/features/navigation/components/BottomNavigation.tsx`                          |
| Conteúdo do menu lateral                     | `src/features/navigation/components/NavigationPanel.tsx`                           |
| Drawer e fundo do menu móvel                 | `src/features/navigation/components/MobileNavigationDrawer.tsx`                    |
| Estado, animação e gesto do drawer           | `src/features/navigation/hooks/useNavigationDrawer.ts`                             |
| Restauração de rota e rolagem da seção       | `src/features/navigation/hooks/useBandNavigationState.ts` e `NavigationMemory.tsx` |
| Definição das seções de navegação            | `src/features/navigation/navigationItems.ts`                                       |
| Contexto visual da banda selecionada         | `src/features/navigation/BandAreaLayout.tsx`                                       |
| Construção dos endereços das rotas           | `src/features/navigation/routes.ts`                                                |
| Preservação de filtros e visão de cada seção | `src/features/navigation/useSectionViewState.ts`                                   |
| Calendário mensal                            | `src/features/calendar/MonthCalendar.tsx`                                          |
| Cronômetro manual                            | `src/features/stage/useManualTimer.ts`                                             |

Ao criar uma tela, primeiro escolha o domínio responsável, crie o arquivo da tela nele e depois adicione uma entrada pequena em `src/app`. A entrada de rota não deve conter regras de negócio nem estilos da tela.
