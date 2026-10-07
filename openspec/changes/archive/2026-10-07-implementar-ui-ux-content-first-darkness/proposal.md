# Proposal

## Why

A interface atual distribui cores, espaçamentos, iconografia e comportamentos de navegação sem um sistema visual e de interação único. A proposta `docs/PROPOSTA_UI_CONTENT_FIRST_DARKNESS.md` descreve uma direção validada conceitualmente para dar prioridade ao repertório, à preparação de shows e à leitura, mantendo continuidade entre Web, Android e iOS.

Esta change transforma essa direção em requisitos e etapas verificáveis. O piloto de deslize entre seções depende de avaliação com participantes antes de ser ativado; retorno previsível, proteção contra perda de edição e o restante da revisão visual compõem o primeiro corte.

## What Changes

- Introduzir tokens visuais semânticos para superfícies escuras, texto, violeta de ação/seleção, bordas, estados e geometria.
- Harmonizar componentes compartilhados, login, listas, formulários, popups, estados vazios, feedback, barra inferior e menu lateral nas três plataformas.
- Revisar os 43 identificadores de ícones existentes segundo o catálogo proposto; usar figuras próprias para significado distinto, manter rótulos claros e preservar a aparência arredondada recomendada para o logo.
- Aplicar hierarquia visual de conteúdo às telas de bandas, repertório, música/letra, shows/setlists, integrantes/convites e perfil/conta, sem alterar regras de domínio ou disponibilidade de funcionalidades.
- Guiar a primeira utilização: após criar uma banda, selecioná-la e abrir seu Repertório; orientar o próximo passo nas listas vazias de músicas e shows com ações compatíveis com as permissões.
- Definir transições de rota apropriadas por plataforma, retorno previsível e preservação do contexto por banda, incluindo busca, filtros e rolagem.
- Proteger edições não salvas em todos os caminhos de saída e comunicar estados de carregamento, sucesso e erro sem antecipar resultados.
- Respeitar redução de movimento, foco, leitores de tela, teclado, áreas seguras, rolagem, pull-to-refresh e gestos do sistema.
- Avaliar deslize entre Shows, Repertório e Banda como piloto nativo opcional; implementar e habilitar somente se tarefas com participantes demonstrarem descoberta, destino previsível, alternativa acessível e ausência de conflitos com rolagem e sistema. Palco permanece uma ação que abre o aviso atual.

## Capabilities

### New Capabilities

- `application-ui`: tokens visuais, iconografia, componentes, estados e aplicação responsiva do sistema visual Content-First Darkness.
- `screen-navigation`: comportamento de retorno, troca de áreas, preservação de estado, transições, gestos, proteção de edição e acessibilidade da navegação.

### Modified Capabilities

Nenhuma. `shared-data-refresh` já define preservação de conteúdo e alternativas ao gesto de atualização; esta mudança deve mantê-lo funcionando e não altera seu contrato de dados.

## Impact

- Documentos de referência: `docs/PROPOSTA_UI_CONTENT_FIRST_DARKNESS.md` e `docs/CATALOGO_ICONES_CONTENT_FIRST_DARKNESS.md`.
- Tokens/componentes: `src/theme/tokens.ts`, `src/theme/responsive.ts` e `src/components/ui/`.
- Telas: `src/features/auth/`, `bands/`, `repertoire/`, `shows/`, `account/`, `navigation/`, `feedback/` e `stage/`.
- Rotas, histórico, drawers e memória: `src/app/`, `src/features/navigation/`, `expo-router`, Gesture Handler e Reanimated já presentes no projeto.
- Critérios de foco, toque, movimento reduzido e navegação por teclado/leitor de tela para Web, Android e iOS.
- Nenhuma mudança de esquema de banco, API, autorização ou dependência é necessária por definição; reavaliar apenas se a implementação revelar necessidade concreta.

## Completion

Change finalizada em 7 de outubro de 2026. O responsável confirmou a validação integrada do item 11.2 em Web, Android e iOS e dispensou o piloto do item 10.4 deste fechamento, para execução em outro momento. Os 37 itens foram encerrados, sendo 36 concluídos e um dispensado com decisão registrada. A troca de seções por deslize permanece desativada; uma avaliação futura continua sendo condição para considerar sua habilitação.

As definições de `application-ui` e `screen-navigation` são consolidadas em `openspec/specs/`, e os artefatos desta entrega ficam no arquivo `openspec/changes/archive/2026-10-07-implementar-ui-ux-content-first-darkness/`.
