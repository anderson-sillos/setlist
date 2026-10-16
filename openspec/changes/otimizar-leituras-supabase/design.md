# Design

## Context

Ver a motivação em `proposal.md`. A investigação identificou estes caminhos:

- `BandAreaLayout` usa `useBand`, enquanto as telas usam `useUserBands` para extrair o papel na banda. `SupabaseBandRepository.listForUser` faz três consultas sequenciais: participações, bandas e perfil.
- `ShowsScreen` consulta shows com blocos e itens completos e chama `useSongs(bandId, true)`. O repositório de músicas usa `select('*')`, incluindo `lyrics`, para permitir o cálculo local da duração dos cards.
- `useUserBandSummaries` chama `listForUser` e depois consulta todos os shows de cada banda. `BandsScreen` usa esses shows somente para escolher `nextShow.startsAt`.
- `useRepertoireCollections` chama o repositório de músicas dentro de sua própria função de consulta. `RepertoireScreen` consulta a mesma lista separadamente, produzindo dois GETs equivalentes.
- O cache global usa `staleTime` e `gcTime` infinitos, mas `useScreenDataRefresh` faz `refetch` explícito ao receber foco depois de 60 segundos. Portanto, o intervalo efetivo de atualização não é infinito.
- `ContentFade` oculta a lista de Shows enquanto qualquer consulta inicial de shows, músicas ou bandas do usuário está pendente. Minhas bandas recebe os dados somente depois do `Promise.all` de todos os shows das bandas.
- A spec `shared-data-refresh` exige atualizar o próprio papel no refresh. A spec `content-moderation` exige remover conteúdo ocultado das cópias locais quando o dispositivo reconecta. Melhorar cache e abertura não pode enfraquecer essas regras.

As sequências fornecidas mostram seis chamadas na abertura de Shows, cinco no refresh e sete no Repertório, incluindo dois GETs idênticos de músicas. São observações de chamadas; os intervalos entre timestamps não medem isoladamente o tempo SQL ou o tempo de navegação.

## Goals / Non-Goals

**Goals:**

- Definir contratos de resumo tipados, compartilhados e distintos dos documentos completos.
- Reduzir caminhos sequenciais e tráfego sem transferir a regra de autorização para o cliente.
- Calcular no servidor resumos salvos e manter cálculo local para alterações ainda não salvas.
- Tornar carregamento e falhas independentes por região, com navegação disponível desde a montagem.
- Demonstrar o ganho com contagem de chamadas, tamanho de respostas, tempo até conteúdo utilizável e plano SQL sob RLS.

**Non-Goals:**

- Alterar regras de duração, elegibilidade de músicas, seleção de coleções, filtros, ordenação ou permissões.
- Adicionar Realtime, polling, cache persistente, sincronização offline, paginação ou um backend intermediário.
- Armazenar totais redundantes por triggers ou introduzir materialized views nesta etapa.
- Ampliar a prévia de palco; adaptar apenas os consumidores afetados pelos contratos de leitura.
- Publicar clientes ou executar migrações de produção durante a implementação sem o fluxo de entrega correspondente.

## Decisions

### 1. Contratos de resumo separados dos documentos completos

Adicionar contratos específicos no domínio e nos repositórios, com projeções explícitas nos adaptadores Supabase:

| Contrato | Conteúdo necessário |
| --- | --- |
| `BandContext` | Identificação e nome da banda, papel atual e `hasActiveSongs` para orientar estados iniciais. |
| `UserBandSummary` | Identificação e nome da banda, papel e `nextShowStartsAt`, que pode ser nulo. |
| `SongSummary` | Identificação, banda, título, artista, tom, BPM, duração, status da letra, arquivamento e metadados de revisão usados pelos fluxos de lista. |
| `ShowSummary` | Identificação, banda, nome, data, local, status, revisão e duração estimada total. |

`Song` continua representando um documento completo, e `Show` continua contendo blocos e itens. Um resumo não é convertido nesses tipos com letras vazias ou blocos fictícios. Os parsers distinguem resposta vazia confirmada, erro e dado ainda não carregado.

O repertório, seletores e resumos de Coleções usam `SongSummary`. Detalhe, edição e visualização da letra solicitam o documento completo pelo identificador. Fluxos de show que precisam de documentos completos carregam em lote os IDs referenciados; a escolha de novas músicas no editor usa metadados do repertório. A lista da prévia de palco pode compartilhar `ShowSummary`; o fluxo que mostra letras continua carregando o conteúdo necessário antes de oferecê-lo.

Alternativa descartada: remover `lyrics` do `select` atual mantendo o tipo `Song`. Isso permitiria tratar um resumo como uma letra vazia real e contaminaria edição, caches e atalhos de letra.

### 2. Leituras de contexto e agenda sem cadeias de chamadas

Criar uma view `band_context` com `security_invoker = true`. Ela une a participação do usuário autenticado à banda e usa `EXISTS` sobre músicas ativas consultáveis para `has_active_songs`. Cabeçalho e tela compartilham uma chave de consulta por sessão e banda; não buscam o perfil ou todas as bandas para obter o papel atual.

Criar uma view `user_band_summaries`, também invoker, restrita às participações de `auth.uid()`. Uma subconsulta correlacionada ou `LATERAL` busca somente a primeira data de show não cancelado com `starts_at >= statement_timestamp()`, usando ordenação e limite. A consulta não percorre blocos ou itens das setlists e retorna todas as bandas do usuário em um pedido HTTP. Instantes são comparados como `timestamptz`; a formatação permanece no app.

Manter consultas de perfil e integrantes nos locais que realmente exibem esses dados. Uma consulta existente de participação detalhada que continue necessária pode usar os relacionamentos já presentes entre `band_members`, `bands` e `profiles`, sem reconstruir três etapas sequenciais. A adoção dos novos contratos remove a dependência dessas leituras genéricas das listas principais.

Alternativa descartada: apenas prolongar o cache de `useUserBands`. Isso manteria o volume e a cadeia de rede no refresh e poderia atrasar mudanças de papel.

### 3. Duração dos shows calculada na leitura SQL

Criar uma view `show_summaries` com `security_invoker = true`, consultada com filtro explícito de banda. O cálculo relaciona shows, blocos, itens e músicas autorizados e agrega uma vez por show. A consulta retornada ao app não inclui essas relações completas.

Regras de paridade com `src/domain/setlistDuration.ts`:

- Item de música usa a duração vigente de sua música; uma música repetida contribui em cada ocorrência, sem `SUM(DISTINCT ...)`.
- Anotação usa `show_items.estimated_duration_ms`; separador não soma.
- `SUM` ignora valores ausentes e permanece nulo se todos os tempos forem ausentes; zero explicitamente informado permanece um valor conhecido.
- Uma música arquivada ainda consultável continua contando em uma setlist salva.
- Linhas ocultadas por moderação não contribuem para conteúdo, contagem ou duração. Joins não podem reintroduzir linhas filtradas por RLS ou multiplicar ocorrências por vínculos de coleção/integrantes.
- Somar em tipo suficientemente amplo no SQL e validar a conversão para inteiro seguro no adaptador.

Usar views comuns mantém os totais atuais na próxima leitura após qualquer alteração de música ou item. O editor conserva o cálculo local sobre seu rascunho; os testes de paridade usam os mesmos casos de dados para comparar cálculo salvo e cálculo do domínio.

Alternativas consideradas: materialized views e coluna de total mantida por triggers. Ambas exigiriam sincronizar mudanças de músicas, itens, arquivamento e moderação, adicionando possibilidades de total desatualizado sem evidência de necessidade. RPC invoker fica como alternativa técnica se o plano da view não aplicar eficientemente o filtro de banda; deve manter o mesmo contrato e os critérios de segurança.

### 4. Consultas básicas compartilhadas e Coleções derivadas

Definir chaves e opções compartilhadas para contexto, metadados de músicas, coleções, vínculos, resumos de shows e detalhes. Separar chaves de resumo e de documento completo, incluindo banda e variantes da consulta; preservar o isolamento de sessão já existente.

O resumo de Coleções é derivado dos resultados das consultas de coleções, vínculos e metadados compartilhados. Ele não chama novamente o repositório de músicas por uma query composta independente. Todos os consumidores usam as mesmas opções/chaves para permitir compartilhamento de resposta e de pedido em andamento.

O refresh trabalha com essas dependências básicas únicas. Não atualizar ao mesmo tempo uma query composta e outra query que executem a mesma chamada por caminhos diferentes. Uma alteração de vínculo de coleção invalida coleções/vínculos; não invalida músicas cujo cadastro permaneceu igual.

Não unificar as respostas de toda a aplicação em uma única RPC: isso acoplaria regiões independentes e repetiria dados secundários a cada abertura.

### 5. Carregamento por dependências visuais

As rotas já montam os componentes sem aguardar os pedidos. A mudança está na composição das queries e nos estados usados para exibir cada região:

```text
Montagem da tela
  +--> cabecalho, navegacao e estrutura visiveis
  +--> contexto da banda --> acoes conforme o papel confirmado
  +--> lista de resumos --> cards visiveis
  +--> colecoes/vinculos --> filtros e acoes dependentes
```

Iniciar pedidos junto da montagem, sem timers artificiais para simular abertura rápida. Usar os skeletons e componentes existentes por região. `ContentFade` passa a acompanhar apenas a primeira disponibilidade dos dados essenciais daquela região; permissões pendentes não deixam a lista inteira com opacidade zero.

Uma lista de Shows com dados não espera perfil/contexto para mostrar cards. A ação de criar aguarda o papel confirmado, com espaço estável. No Repertório sem filtro de coleção, uma falha de Coleções não bloqueia músicas; com filtro de coleção aplicado, vínculos são essenciais e o resultado aguarda esses dados ou apresenta recuperação localizada. Não exibir o resultado de uma consulta sem o filtro selecionado enquanto ele carrega.

Minhas bandas depende somente de seu resumo enxuto, e não de consultas de shows por banda. Loading, erro e ausência confirmada de próximo show são estados diferentes. A primeira resposta pode apresentar o card completo sem consultas adicionais de agenda.

Revalidação comum mantém dados disponíveis, foco, rolagem, seleção e filtros válidos. Falhas secundárias usam a região pertinente. Perda confirmada de acesso, logout e reconciliação de conteúdo moderado têm precedência sobre a preservação visual de cache.

### 6. Frescor, invalidação e conteúdo sensível

Manter o intervalo atual de 60 segundos na revalidação por foco e o refresh manual. O contexto da banda participa da atualização para manter o papel vigente. Deduplicar cada dependência e não iniciar uma segunda chamada equivalente enquanto ela já estiver em andamento.

Centralizar as dependências de invalidação:

| Alteração confirmada | Leituras afetadas |
| --- | --- |
| Metadados/duração de música | Resumos e detalhe da música; resumos de Coleções derivados; resumos de shows quando o tempo mudar. |
| Arquivamento, restauração ou exclusão de música | Metadados, contexto de músicas ativas, vínculos/resumos de Coleções e referências afetadas. |
| Criar, reagendar, cancelar, reabrir ou excluir show | Resumos/detalhe de shows e próximo show de Minhas bandas. |
| Salvar itens/tempos da setlist | Detalhe daquele show e resumo de sua duração. |
| Criar, renomear ou alterar vínculos de coleção | Coleções e vínculos pertinentes, sem nova busca de músicas inalteradas. |
| Renomear banda ou mudar participação/papel | Contexto da banda, resumos de Minhas bandas e integrantes quando pertinentes. |

Invalidar dados inativos para atualização no próximo uso, sem forçar refetch imediato de todas as rotas montadas. Mudança de duração de música não necessariamente altera `shows.updated_at`; esse campo não é usado sozinho como prova de que o total continua atual.

Os atuais eventos de reconexão e retorno ao primeiro plano devem abranger as novas chaves e conservar a reconciliação de moderação. Cache sensível cuja autorização precisa ser revalidada pode ser temporariamente indisponibilizado; isso não obriga a esconder a estrutura da tela. Ao receber a resposta autorizada, remover das cópias locais controladas músicas ocultadas e documentos correspondentes. Não contornar esse fluxo apenas para manter dados antigos visíveis; não iniciar recargas de telas inativas para reconciliá-las.

### 7. Metas de validação e custo SQL

Para as listas principais, com cache vazio ou refresh manual concluído sem falhas:

| Fluxo | Referência observada | Meta do desenho |
| --- | --- | --- |
| Shows | 6 chamadas na abertura; 5 no refresh | 2: contexto da banda e resumos de shows. |
| Repertório com dados de Coleções | 7 chamadas, com duas listas de músicas idênticas | Até 4: contexto, metadados, coleções e vínculos; músicas uma vez. |
| Minhas bandas com N bandas | 3 + N chamadas | 1 consulta de resumos, sem fan-out por banda. |

Essas metas cobrem apenas dados dessas telas; não incluem renovação de sessão, autenticação ou ações posteriores. Antes do limite de frescor, retornar à tela com cache válido não inicia consultas novas sem invalidação ou reconciliação de segurança.

Registrar tamanho do conteúdo e bytes de rede quando disponíveis, duração dos pedidos, primeiro quadro da estrutura e primeiro conteúdo utilizável. Comparar mesmos dados, aparelho e condições; não converter a diferença entre timestamps dos logs em tempo de CPU do banco. Executar cenários SQL com papéis autenticados, `EXPLAIN (ANALYZE, BUFFERS)` e volume representativo. Reutilizar índices existentes em `shows(band_id, starts_at)`, blocos/itens e participações; adicionar índice apenas com evidência de benefício.

## Risks / Trade-offs

- Agregação pode deslocar custo para o banco → filtrar por banda, evitar fan-out de joins e medir o plano sob RLS; a redução de tráfego não é prova isolada de redução do tempo SQL.
- View criada com privilégios do proprietário pode expor dados → usar invoker, grants restritos e testes de usuário externo, conta suspensa e música moderada.
- Resumo interpretado como documento completo pode apagar ou ocultar letras → tipos, parsers e chaves de cache distintos; verificar detalhes, atalhos e edição após abrir uma lista.
- Atualizações de músicas podem deixar duração salva no cache → invalidação explícita das dependências, atualização por foco e consulta dinâmica no banco.
- Exibição progressiva pode mostrar permissões ou vazio incorretos → separar confirmação de acesso, ausência confirmada, loading e falhas por região.
- Redução de consultas pode comprometer reconciliação de moderação → conservar as regras existentes de descarte de conteúdo sensível em reconexão e perda de acesso.
- Resumos ainda retornam todos os cards da banda → medir com o volume atual; paginação e pesquisa no servidor ficam fora desta change.

## Migration Plan

1. Registrar uma linha de base reproduzível em desenvolvimento e definir fixtures de paridade/permissão antes de substituir os consumidores.
2. Adicionar views/contratos por migração, sem remover tabelas, colunas ou endpoints usados por clientes distribuídos. Validar grants, RLS e plano no banco local/de desenvolvimento.
3. Implementar adaptadores, queries compartilhadas e consumidores por grupo, com validação de regressão antes de avançar.
4. Validar abertura, refresh, foco, moderação e fluxos completos em iOS, Android e web; registrar resultados e limitações.
5. Na entrega autorizada, aplicar primeiro a migração aditiva no ambiente de destino e depois distribuir os clientes compatíveis. Esta change não autoriza publicação automática ou execução em produção.
6. Para rollback de cliente, os endpoints antigos permanecem disponíveis. Remover as novas views somente depois de confirmar que nenhum cliente distribuído depende delas; não excluir dados do domínio.

## References

- [Joins e relações na Data API](https://supabase.com/docs/guides/database/joins-and-nesting).
- [Views, segurança invoker e alternativas materializadas](https://supabase.com/docs/guides/database/views).
- [Funções de banco e privilégios](https://supabase.com/docs/guides/database/functions).
- [Planos e otimização de consultas](https://supabase.com/docs/guides/database/query-optimization).
