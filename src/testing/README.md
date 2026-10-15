# Dados dos testes

Os testes devem declarar apenas os registros e relações necessários ao cenário. Este diretório reúne as fábricas e composições reutilizadas pelos testes; não é uma fonte de dados do aplicativo nem replica as garantias do Supabase.

## Referência antes da migração

Na base `origin/main` `28f52a8`, antes de migrar os cenários:

- `npm run test:ci`: 109 suítes e 790 testes aprovados.
- Cobertura reportada pela configuração atual: statements 83,96%, branches 80,04%, functions 82,97% e lines 84,82%.
- Para comparar cobertura de produto, excluindo apenas o provedor de testes que será realocado: statements 83,95% (4.982/5.934), branches 80,03% (4.153/5.189), functions 82,95% (1.407/1.696) e lines 84,81% (4.833/5.698). O cálculo usa `coverage/coverage-final.json` e o resumo do `istanbul-lib-coverage`, filtrando `src/testing/**`.

O inventário foi obtido procurando imports de `src/data/demo/` e usos de `TestAppProviders` em testes. São 23 consumidores que importam diretamente dados ou IDs demonstrativos:

- Dados e domínio: `src/data/__tests__/repertoireCollectionQueries-test.tsx`, `src/data/demo/__tests__/demoData-test.ts`, `src/data/in-memory/__tests__/RepertoireCollectionRepository-test.ts` e `src/domain/__tests__/setlistDuration-test.ts`.
- Bandas e calendário: `src/features/bands/__tests__/BandScreen-test.tsx` e `src/features/calendar/__tests__/MonthCalendar-test.tsx`.
- Navegação: `src/features/navigation/__tests__/navigationMemory-test.tsx`, `navigationRoutes-test.ts`, `navigationShell-test.tsx` e `useSectionViewState-test.tsx`.
- Repertório: `src/features/repertoire/__tests__/RepertoireCollectionEditorScreen-test.tsx`, `RepertoireCollectionsScreens-test.tsx`, `RepertoireScreen-test.tsx`, `SongDetailScreen-test.tsx`, `SongEditorScreen-test.tsx`, `SongLifecycleDialog-test.tsx` e `songEditorForm-test.ts`.
- Shows e palco: `src/features/shows/__tests__/ShowBlockEditorDialog-test.tsx`, `ShowDetailScreen-test.tsx`, `ShowSetlistEditorScreen-test.tsx` e `ShowsScreen-test.tsx`; `src/features/stage/__tests__/StageHubScreen-test.tsx` e `StageScreen-test.tsx`.

Há 16 consumidores de `TestAppProviders`; 13 também estão na lista direta acima. Os três consumidores adicionais são `src/features/bands/__tests__/BandsScreen-test.tsx`, `src/features/navigation/__tests__/navigationIntegration-test.tsx` e `src/features/youtube/__tests__/YouTubeIframePrototype-test.tsx`.

Fora dos testes, `src/testing/TestAppProviders.tsx` era o único consumidor do catálogo como fallback. O inventário precisa ser repetido após cada migração, pois novos usos podem ser introduzidos durante o trabalho.

## Verificações

- `npm run test:ci` executa Jest em CI e gera `coverage/coverage-final.json`.
- `rg -l "@/data/demo|src/data/demo|demoRepositoryData|demoIds|createDemoRepositories" src` procura usos diretos do catálogo e dos símbolos removidos.
- `rg -l "TestAppProviders" src --glob '*test*'` procura testes que dependem do provedor.
- Os quatro limites globais de cobertura devem permanecer em 80%. Ao comparar a referência e o resultado final, use o mesmo conjunto de arquivos de produto.

## Limites das camadas

- Fábricas de domínio constroem entidades mínimas tipadas com relações explícitas e estruturas internas novas a cada chamada.
- Cenários juntam somente entidades que têm relação necessária ao teste. Dados omitidos continuam ausentes.
- Testes de telas podem injetar repositórios em memória e falhas explícitas para verificar a reação da interface.
- Testes de adaptadores verificam mapeamento, argumentos e propagação de erros usando respostas remotas simuladas.
- Integridade, permissões, concorrência e atomicidade são garantidas pelas suítes locais do Supabase, não pelo repositório em memória.
