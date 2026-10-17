# Verification Report: otimizar-leituras-supabase

Data: 17/10/2026. Revisão de encerramento com aceite explícito do responsável
para usar as evidências existentes como suficientes.

## Summary

| Dimensão | Resultado |
| --- | --- |
| Completude | 29/29 tarefas encerradas: 25 verificadas e 4 com critério de evidência ajustado por aceite. |
| Correção | 12/12 requisitos dos deltas com implementação e cobertura identificadas. A matriz manual não foi exaustiva. |
| Coerência | Contratos distintos, views invoker, cache compartilhado e carregamento progressivo seguem o design. |
| Instrumentação | Coletor temporário de desempenho e testes exclusivos removidos; identificação permanente do cliente preservada. |

## Requirement mapping

| Requisito | Implementação | Evidência de cobertura |
| --- | --- | --- |
| Contexto compartilhado da banda atual | `src/data/supabase/repositories.ts`, `src/data/queries.ts`, `src/features/navigation/BandAreaLayout.tsx`, `src/features/navigation/components/NavigationPanel.tsx` | `src/data/supabase/__tests__/repositories-test.ts`, `src/features/navigation/__tests__/navigationShell-test.tsx`, logs de abertura. |
| Resumos de shows com duração calculada no servidor | `supabase/migrations/20261015110000_add_show_read_summaries.sql`, `src/data/supabase/showRepository.ts`, `src/features/shows/ShowsScreen.tsx` | `supabase/tests/10.2-show-read-summaries.sql`, `src/data/supabase/__tests__/showRepository-test.ts`, `src/features/shows/__tests__/ShowsScreen-test.tsx`, logs sem repertório na lista. |
| Equivalência da duração estimada | View `show_summaries`, `src/domain/setlistDuration.ts`, editor de setlist | `supabase/tests/10.2-show-read-summaries.sql`, `src/features/shows/__tests__/ShowBlockEditorDialog-test.tsx`. |
| Próximo show no resumo de Minhas bandas | `supabase/migrations/20261015100000_add_band_read_summaries.sql`, `src/data/supabase/repositories.ts`, `src/features/bands/BandsScreen.tsx` | `supabase/tests/10.1-band-read-summaries.sql`, `src/features/bands/__tests__/BandsScreen-test.tsx`, um GET observado. |
| Metadados de músicas separados do conteúdo completo | `src/data/supabase/songRepository.ts`, `src/data/queries.ts`, detalhe/letra/edição e palco | `src/data/supabase/__tests__/songRepository-test.ts`, `src/features/repertoire/__tests__/SongDetailScreen-test.tsx`, `src/features/repertoire/__tests__/SongEditorScreen-test.tsx`, inspeção de lista e letra. |
| Reutilização das músicas entre Repertório e Coleções | `src/data/queries.ts`, `src/data/queryKeys.ts` | `src/data/__tests__/repertoireCollectionQueries-test.tsx`, logs com um GET de metadados por ciclo. |
| Autorização dos contratos de resumo | Views com `security_invoker`, participação por `auth.uid()` e RLS das tabelas | `supabase/tests/10.1-band-read-summaries.sql`, `supabase/tests/10.2-show-read-summaries.sql`, suíte pgTAP registrada no relatório. |
| Estrutura visível durante o carregamento inicial | `BandsScreen.tsx`, `ShowsScreen.tsx`, `RepertoireScreen.tsx` | Suítes das três telas e inspeções em aparelhos/Web registradas no relatório. |
| Conteúdo exibido conforme suas dependências | Estados por consulta nas telas e `src/components/ui/ContentFade.tsx` | Suítes de Shows/Repertório/ContentFade; Web com `band_context` bloqueado preservou conteúdo. |
| Atualizações limitadas à tela ativa | `src/data/screenQueryRegistry.ts`, `src/hooks/useScreenDataRefresh.ts` | `src/hooks/__tests__/useScreenDataRefresh-test.tsx`, `src/data/__tests__/queryInvalidations-test.ts`. |
| Atualização ao retornar a uma tela | Frescor de 60 s e deduplicação em `useScreenDataRefresh`/registro de consultas | Testes do hook, traces de foco sem contexto duplicado e ausência de novas leituras no retorno recente. |
| Atualização coerente dos resumos dependentes | `src/data/queryInvalidations.ts`, queries e reconciliação de sessão | `src/data/__tests__/queryInvalidations-test.ts` e suites de consumidores; contratos de duração/agenda verificados no banco. |

## Validation

A validação integrada anterior registrou 115 suítes/849 testes Jest, lint,
typecheck, formatação, quatro E2E Web existentes e 26 arquivos/432 testes pgTAP
em banco isolado limpo. Os E2E Web existentes não cobrem os fluxos autenticados
de Shows/Repertório; estes têm cobertura de componente e evidência manual.
Os resultados pertencem às rodadas identificadas no relatório de desempenho.

A conferência final de 17/10/2026 passou com `npm run validate`: formatação,
lint, typecheck e 115 suítes/851 testes. Cobertura: 84,12% statements,
80,98% branches, 82,00% functions e 84,99% lines. Essa execução já inclui a
remoção do coletor temporário e preserva os testes permanentes de identificação.
Os 7 specs passaram em `openspec validate --specs --strict --no-interactive`;
a change também passou na validação estrita. As migrações não mudaram após a
validação pgTAP registrada; não houve repetição do banco nem nova rodada manual
depois do aceite.

## Accepted limitations

- Não existe comparação histórica completa de bytes de rede e primeiro conteúdo
  para os mesmos dados/aparelhos/condições. Corpos entregues ao Fetch foram
  registrados como grandeza própria, sem percentual de economia de tráfego.
- A cobertura manual Android/iOS não inclui toda a matriz de respostas lentas
  e falhas secundárias. O Android deixou de estar disponível na rodada final.
- A maior parte dos editores foi aberta e cancelada. As rodadas adicionais de
  gravação/restauração e falha/recuperação sugeridas na revisão final foram
  dispensadas pelo responsável, que aceitou a cobertura existente.
- O aceite ajusta o escopo de validação de quatro tarefas; não reduz os
  requisitos funcionais nem apresenta evidências ausentes como executadas.

## Assessment

Nenhum requisito de implementação ausente ou incompatibilidade com o design
foi identificado nesta revisão. As limitações de evidência acima foram aceitas
explicitamente. As três specs principais recebem os deltas preservando os
requisitos e cenários anteriores não alterados. As specs e os checks finais
passaram; não há pendência bloqueante para o arquivo no escopo aceito.
