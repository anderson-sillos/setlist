# Tasks

## 1. Fábricas mínimas e primeira migração

- [x] 1.1 Registrar a referência das suítes afetadas e da cobertura sobre os arquivos de produto, identificando os consumidores diretos e indiretos de `src/data/demo/`; verificar o registro em `src/testing/README.md` com os comandos e a lista de grupos a migrar.
- [x] 1.2 Criar fábricas tipadas para bandas, integrantes, músicas e letras em `src/testing/factories/`, com identidades relacionadas explícitas, valores neutros e estruturas novas por chamada; verificar tipos e casos focados de independência de listas internas e coerência dos quatro estados de letra.
- [x] 1.3 Criar a composição mínima de banda em `src/testing/scenarios/`, retornando referências e repositórios novos com usuário e papel informados; verificar dois cenários independentes, ausência de conteúdo não solicitado e geração determinística de IDs e datas quando utilizada.
- [x] 1.4 Migrar `SongEditorScreen-test.tsx` para o novo padrão, preservando os casos de criação, edição, letras, falhas e papéis; verificar a suíte da tela e a ausência de imports do catálogo demonstrativo nesse arquivo.
- [x] 1.5 Documentar em `src/testing/README.md` o exemplo de criação de uma música e o uso explícito do cenário no provedor; verificar que o exemplo corresponde à API exercitada pela suíte migrada.

## 2. Repertório, coleções e consultas

- [x] 2.1 Acrescentar fábricas de coleções e vínculos somente com os campos e relações necessários aos consumidores existentes; migrar `repertoireCollectionQueries-test.tsx` e verificar quantidade, ordem, duração, arquivamento e atualização do cache com expectativas explícitas.
- [x] 2.2 Migrar `RepertoireScreen-test.tsx` para cenários pequenos de busca, filtros, coleções, papéis, seleção e atualização; verificar a suíte completa da tela, incluindo restauração de estado por banda e erros após conteúdo carregado.
- [x] 2.3 Migrar `SongDetailScreen-test.tsx`, `SongLifecycleDialog-test.tsx` e `songEditorForm-test.ts` sem copiar músicas do catálogo; verificar suas suítes e a preparação explícita de letras, estados e valores esperados.
- [x] 2.4 Migrar `RepertoireCollectionEditorScreen-test.tsx` e `RepertoireCollectionsScreens-test.tsx`, preparando erros específicos nos métodos necessários; verificar suas suítes para edição, ordem, descarte, exclusão e manutenção das músicas selecionadas.
- [x] 2.5 Documentar os cenários reutilizados de repertório e coleções em `src/testing/README.md`; verificar com busca estática que os testes migrados não dependem de `demoRepositoryData`, `demoIds` ou `createDemoRepositories`.

## 3. Shows, setlists, duração e calendário

- [x] 3.1 Criar fábricas tipadas de show, bloco, música da setlist, anotação e separador, com relações explícitas; migrar `setlistDuration-test.ts` e verificar os totais com valores esperados declarados independentemente da função sob teste.
- [x] 3.2 Migrar `ShowsScreen-test.tsx`, `ShowDetailScreen-test.tsx` e `MonthCalendar-test.tsx`, controlando datas relativas nos casos que dependem do relógio; verificar filtros, calendário, status, permissões e estados vazios nas suítes afetadas.
- [ ] 3.3 Migrar `ShowSetlistEditorScreen-test.tsx` e `ShowBlockEditorDialog-test.tsx`, declarando músicas, coleções, blocos e itens usados por cada cenário; verificar as suítes para inclusão, reordenação, duração, falhas e proteção de alterações.
- [ ] 3.4 Documentar em `src/testing/README.md` a composição de setlists e o controle de datas; verificar a ausência de dependências do catálogo demonstrativo nos testes de shows, calendário e duração.

## 4. Bandas, navegação e consumidores indiretos

- [ ] 4.1 Migrar `BandsScreen-test.tsx` e `BandScreen-test.tsx` para bandas e participações explícitas; verificar as suítes, preservando os cenários sem bandas, com múltiplas bandas e com papéis diferentes.
- [ ] 4.2 Migrar os consumidores em `src/features/navigation/__tests__/`, incluindo integração de rotas, shell, memória, estado de seção e construção de endereços; verificar as suítes afetadas com IDs locais e preservação do estado entre rotas e bandas.
- [ ] 4.3 Migrar os testes de `StageHubScreen`, `StageScreen` e `YouTubeIframePrototype`, assim como outros consumidores indiretos de `TestAppProviders`; verificar as suítes correspondentes e que as rotas atuais continuam apresentando a indisponibilidade prevista do modo palco.
- [ ] 4.4 Documentar em `src/testing/README.md` os exemplos de papéis e isolamento entre bandas; verificar o inventário inicial contra uma nova busca de imports e usos do provedor, confirmando a migração de todos os consumidores identificados.

## 5. Auxiliares em memória e provedor explícito

- [ ] 5.1 Relacionar as verificações de `RepertoireCollectionRepository-test.ts` sobre duplicação, revisão, integridade e permissões às suítes de adaptadores e aos testes `supabase/tests/9.*`; registrar a correspondência em `src/testing/README.md` e cobrir na suíte responsável qualquer lacuna relevante antes de retirar uma verificação da réplica.
- [ ] 5.2 Realocar os repositórios em memória e seus testes úteis para `src/testing/repositories/`, atualizando imports e dados locais; verificar as suítes consumidoras e o TypeScript sem imports dos módulos antigos.
- [ ] 5.3 Simplificar a réplica de mutações de coleções, mantendo apenas consultas e transições de estado necessárias aos testes de telas e hooks e preparando falhas explicitamente; verificar as suítes de consultas, coleções e adaptadores, além dos testes de banco quando sua cobertura tiver sido alterada.
- [ ] 5.4 Tornar `repositories` e `currentUserId` obrigatórios em `TestAppProviders` e eliminar seus defaults demonstrativos; verificar todos os consumidores com TypeScript, suas suítes e os testes que confirmam o comportamento remoto do provedor de produção.
- [ ] 5.5 Atualizar `src/testing/README.md` e `docs/ARQUITETURA_DE_TELAS.md` com a localização e o limite dos auxiliares, distinguindo simulação de interface de garantia do banco; verificar que os exemplos usam a API final e não indicam repositórios em memória como camada de produção.

## 6. Remoção do catálogo e cobertura de produto

- [ ] 6.1 Remover `src/data/demo/`, exports e módulos antigos de `src/data/in-memory/` após migrar as expectativas funcionais pertinentes de `demoData-test.ts`; verificar ausência de consumidores e símbolos herdados no código ativo, preservando registros históricos da documentação.
- [ ] 6.2 Excluir somente `src/testing/**` da cobertura de produto e manter os quatro limites de 80%; executar `npm run test:ci`, comparar os mesmos arquivos de produto com a referência inicial e corrigir eventuais lacunas sem excluir módulos de produção ou reduzir limites.
- [ ] 6.3 Registrar em `src/testing/README.md` e `docs/CODEX_HANDOFF.md` os cenários preservados, testes de catálogo removidos e comparação de cobertura; verificar a consistência dos caminhos, exemplos e resultados com a implementação final.

## 7. Verificação integrada

- [ ] 7.1 Executar formatação, lint e tipos e conferir o resultado da suíte completa da implementação final; verificar que não restam imports de auxiliares de teste em código de produção nem alterações nos seeds promocionais, e repetir testes somente se houver novas mudanças, falhas ou dúvidas pendentes.
- [ ] 7.2 Validar a change com OpenSpec e conferir os checks remotos de qualidade, banco e smoke test Web no commit final da PR de implementação; registrar os resultados necessários à revisão e ao encerramento da change pelo fluxo de PR do projeto.
