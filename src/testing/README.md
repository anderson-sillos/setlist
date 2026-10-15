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

## Situação após a migração de telas e navegação

Após concluir as tarefas 4.1–4.3, a busca por imports e símbolos demonstrativos nos testes retornou dois arquivos. Na tarefa 5.2, o teste útil do repositório em memória foi movido para `src/testing/repositories/__tests__/RepertoireCollectionRepository-test.ts` e passou a construir dados locais com fábricas. A busca atual retorna somente:

- `src/data/demo/__tests__/demoData-test.ts`, que será removido junto com o catálogo após preservar as expectativas úteis (tarefa 6.1).

Os outros 22 consumidores diretos do inventário inicial foram migrados para dados locais tipados. Os três consumidores indiretos também foram tratados: `BandsScreen` usa um cenário local, a integração de rotas usa IDs e repositórios próprios, e o protótipo do YouTube não recebe mais um provedor que não utiliza. A nova busca por `TestAppProviders` encontra 13 arquivos de teste, incluindo os auxiliares de cenário. O próprio provedor ainda mantém `currentUserId` e `repositories` opcionais com defaults demonstrativos; a remoção desses defaults é a tarefa 5.4.

### Papéis e isolamento entre bandas

Cada chamada a `createBandScenario` cria seus próprios repositórios. Declare papel, usuário e banda no cenário usado pelo teste; não compartilhe uma instância entre casos que precisem de dados ou permissões diferentes:

```ts
const ownerScenario = createBandScenario({
  bandId: 'band-owner-case',
  userId: 'user-owner-case',
  role: 'owner',
});
const memberScenario = createBandScenario({
  bandId: 'band-member-case',
  userId: 'user-member-case',
  role: 'member',
});

const ownerBands = await ownerScenario.repositories.bands.listForUser(
  ownerScenario.currentUserId,
);
const memberBands = await memberScenario.repositories.bands.listForUser(
  memberScenario.currentUserId,
);
const crossScenarioBands = await ownerScenario.repositories.bands.listForUser(
  memberScenario.currentUserId,
);

expect(ownerBands[0]?.membership.role).toBe('owner');
expect(memberBands[0]?.membership.role).toBe('member');
expect(crossScenarioBands).toEqual([]);
```

`src/testing/factories/__tests__/domainFactories-test.ts` verifica as estruturas das fábricas; `src/testing/scenarios/__tests__/bandScenario-test.ts` verifica que cada cenário tem repositórios independentes. O exemplo destaca a relação que a tela consome: a mesma banda tem um papel por usuário, e um repositório não expõe o conteúdo do cenário vizinho.

## Verificações

- `npm run test:ci` executa Jest em CI e gera `coverage/coverage-final.json`.
- `rg -l "@/data/demo|src/data/demo|demoRepositoryData|demoIds|createDemoRepositories" src` procura usos diretos do catálogo e dos símbolos removidos.
- `rg -l "TestAppProviders" src --glob '**/__tests__/**'` procura testes e auxiliares que dependem do provedor.
- Os quatro limites globais de cobertura devem permanecer em 80%. Ao comparar a referência e o resultado final, use o mesmo conjunto de arquivos de produto.

## Limites das camadas

- Fábricas de domínio constroem entidades mínimas tipadas com relações explícitas e estruturas internas novas a cada chamada.
- Cenários juntam somente entidades que têm relação necessária ao teste. Dados omitidos continuam ausentes.
- Testes de telas podem injetar repositórios em memória e falhas explícitas para verificar a reação da interface.
- Testes de adaptadores verificam mapeamento, argumentos e propagação de erros usando respostas remotas simuladas.
- Integridade, permissões, concorrência e atomicidade são garantidas pelas suítes locais do Supabase, não pelo repositório em memória.

## Cobertura de coleções: réplica e banco

As verificações de `RepertoireCollectionRepository-test.ts` eram úteis para testar o comportamento da réplica em memória, mas não provavam as garantias da aplicação. Antes de simplificar/remover essas verificações, cada regra foi relacionada à suíte que cobre a fonte de verdade:

| Regra exercitada na réplica                                                                                                                                            | Garantia responsável                                         | Cobertura existente                                                                                        |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Uma música não se repete na mesma coleção; nomes e posições são únicos; vínculos pertencem à mesma banda; posição é não negativa.                                      | Constraints, chaves e relacionamentos do banco.              | `supabase/tests/9.1-repertoire-collections.sql`                                                            |
| Salvar e reordenar a coleção, acrescentar músicas sem duplicar, editar participações, rejeitar revisão antiga e excluir vínculos sem apagar músicas ou itens de shows. | RPCs transacionais e suas regras de concorrência.            | `supabase/tests/9.3-repertoire-collections-rpcs.sql`                                                       |
| Consulta com RLS, separação por banda e restrições por papel.                                                                                                          | Políticas de leitura e autorização das RPCs.                 | `supabase/tests/9.2-repertoire-collections-rls.sql` e `supabase/tests/9.3-repertoire-collections-rpcs.sql` |
| Arquivar/restaurar música preserva vínculos; exclusão definitiva limpa só vínculos elegíveis; músicas usadas em shows permanecem.                                      | Ciclo de vida coordenado entre músicas, coleções e setlists. | `supabase/tests/9.4-repertoire-collections-song-lifecycle.sql`                                             |

As suítes pgTAP cobrem essas invariantes. Foi identificada uma lacuna separada no adaptador: seus testes validavam a conversão de revisão desatualizada, mas não a tradução dos demais erros do banco para `RepertoireCollectionError`. `src/data/supabase/__tests__/repertoireCollectionRepository-test.ts` agora verifica os códigos de nome inválido/duplicado, revisão, ausência, música indisponível, permissão, entrada inválida e falha genérica. Essa cobertura verifica o contrato do adaptador e não duplica as garantias de integridade do banco.

## Exemplo de preparação de um teste

Construa a música com os valores que o cenário usa e passe uma banda, o papel e o usuário explicitamente ao cenário. O cenário cria repositórios isolados; o provedor recebe esses repositórios e a mesma identidade do usuário:

```tsx
const currentUserId = 'user-song-editor';
const song = createSong({
  id: 'song-to-edit',
  bandId: 'band-song-editor',
  title: 'Faixa em edição',
  originalArtist: 'Artista de teste',
  lyrics: createLyricsForStatus('static'),
  lyricStatus: 'static',
});
const scenario = createBandScenario({
  bandId: song.bandId,
  userId: currentUserId,
  role: 'editor',
  songs: [song],
});

render(
  <TestAppProviders
    currentUserId={scenario.currentUserId}
    repositories={scenario.repositories}
  >
    <SongEditorScreen bandId={scenario.band.id} songId={song.id} />
  </TestAppProviders>,
);
```

Na suíte real de `SongEditorScreen`, `createSong` e `createBandScenario` são usados da mesma forma. O teste declara o título, a letra, o papel e as relações que serão verificadas; nenhuma banda ou música adicional é carregada por padrão. Ao migrar `TestAppProviders` para propriedades obrigatórias, esse exemplo permanece válido sem mudanças.

## Cenários de repertório e coleções

Use `createRepertoireCollection` e `createRepertoireCollectionSong` para declarar a coleção, as músicas relacionadas e a ordem usada no cenário. Quando a tela precisar de uma banda e um papel, componha esses dados com `createBandScenario`; para controlar IDs gerados durante a criação, um teste pode preparar `createInMemoryRepositories` diretamente com os mesmos dados explícitos.

```tsx
const bandId = 'band-repertoire-test';
const currentUserId = 'user-repertoire-owner';
const song = createSong({
  id: 'song-opening',
  bandId,
  title: 'Abertura',
  estimatedDurationMs: 180_000,
});
const collection = createRepertoireCollection({
  id: 'collection-acoustic',
  bandId,
  name: 'Acústico',
});
const scenario = createBandScenario({
  bandId,
  userId: currentUserId,
  role: 'owner',
  songs: [song],
  collections: [collection],
  collectionSongs: [
    createRepertoireCollectionSong({
      bandId,
      collectionId: collection.id,
      songId: song.id,
      position: 0,
    }),
  ],
});

render(
  <TestAppProviders
    currentUserId={scenario.currentUserId}
    repositories={scenario.repositories}
  >
    <RepertoireCollectionsScreen bandId={scenario.band.id} />
  </TestAppProviders>,
);
```

As suítes de coleção também declaram estados vazios e permissões sem incluir dados alheios ao caso. Durações são definidas nas músicas e conferidas com um valor esperado fixo. Para erros de gravação e revisão concorrente, substitua apenas o método usado no cenário com `jest.spyOn(...).mockRejectedValueOnce(...)`; assim a falha simulada fica visível no próprio teste.

## Cenários de shows e setlists

Componha shows com `createShow`, blocos com `createShowSetlistBlock` e os itens da setlist com a fábrica correspondente ao tipo. O mapa de músicas passado aos cálculos de duração deve conter as mesmas identidades referenciadas pelos itens. Em testes de tela, use `createBandScenario` para relacionar a banda, o papel atual, as músicas e os shows:

```tsx
const bandId = 'band-show-editor';
const currentUserId = 'user-show-editor';
const song = createSong({
  id: 'song-opening',
  bandId,
  title: 'Abertura',
  estimatedDurationMs: 180_000,
});
const show = createShow({
  id: 'show-draft',
  bandId,
  name: 'Noite no Clube',
  startsAt: '2026-11-14T21:00:00-03:00',
  blocks: [
    createShowSetlistBlock({
      id: 'block-opening',
      name: 'Abertura',
      items: [
        createShowSongSetlistItem({
          id: 'item-opening',
          songId: song.id,
        }),
        createShowPlanningSetlistItem({
          id: 'item-interval',
          description: 'Troca de instrumento',
          estimatedDurationMs: 30_000,
        }),
        createShowSeparatorSetlistItem({ id: 'item-separator' }),
      ],
    }),
  ],
});
const scenario = createBandScenario({
  bandId,
  userId: currentUserId,
  role: 'owner',
  songs: [song],
  shows: [show],
});

render(
  <TestAppProviders
    currentUserId={scenario.currentUserId}
    repositories={scenario.repositories}
  >
    <ShowSetlistEditorScreen bandId={bandId} showId={show.id} />
  </TestAppProviders>,
);
```

For screens whose filtering depends on the current day, pass a fixed `now` to `ShowsScreen`; `MonthCalendar` receives an explicit `initialDate`. This keeps tests for past, upcoming and same-day shows independent of the machine clock. Tests that verify formatting, ordering or total duration should write those expected values directly, without deriving the expectation from the function under test.
