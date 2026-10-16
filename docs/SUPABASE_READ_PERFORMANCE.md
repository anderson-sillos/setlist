# Desempenho das leituras do Supabase

Este documento compara as leituras das telas de Minhas bandas, Shows e
Repertório. Resultados observados em logs, estimativas derivadas do código e
medições de interface são identificados separadamente para que intervalos entre
logs não sejam confundidos com latência de rede ou tempo de renderização.

## Linha de base anterior à otimização

### Condições e evidências disponíveis

- Ambiente: projeto Supabase de desenvolvimento `zncaahgaoqwksdidunza`.
- Cliente registrado nos logs: Setlist `1.0.0`, iOS `18.3.1`; o modelo do
  aparelho não foi registrado nos trechos fornecidos.
- Os eventos foram copiados dos logs Edge do Supabase em UTC. Cada evento
  identifica uma chamada HTTP concluída, mas os trechos não incluem tamanho da
  resposta, duração individual da chamada ou instante em que o conteúdo ficou
  visível na tela.
- As três sequências de Shows e Repertório abaixo são observações da execução
  informada pelo responsável. O comportamento de Minhas bandas e do retorno por
  foco, quando indicado como derivado do código, ainda não foi conferido por
  uma sequência correspondente de logs.

| Fluxo                                   | Chamadas observadas ou derivadas                                                                                                                                                                | Bytes de resposta                      | Tempo de rede | Estrutura/conteúdo visível |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | ------------- | -------------------------- |
| Shows, abertura                         | 6 GETs observados: banda por ID, músicas completas, shows com blocos/itens, participações, bandas do usuário e perfil.                                                                          | Não disponível nos eventos fornecidos. | Não medido.   | Não medido.                |
| Shows, atualização manual               | 5 GETs observados: shows, músicas completas, participações, bandas do usuário e perfil.                                                                                                         | Não disponível nos eventos fornecidos. | Não medido.   | Não medido.                |
| Repertório, abertura                    | 7 GETs observados: participações, coleções, vínculos, bandas do usuário, perfil e **duas** consultas equivalentes de músicas completas.                                                         | Não disponível nos eventos fornecidos. | Não medido.   | Não medido.                |
| Minhas bandas, abertura                 | **3 + N GETs previstos pelo código atual**: participações, bandas, perfil e uma consulta de shows por banda. N é o número de bandas do usuário. Não foi fornecida sequência de logs dessa tela. | Não disponível.                        | Não medido.   | Não medido.                |
| Retorno por foco após expirar o frescor | O hook atual refaz cada query da tela ativa que esteja vencida e não esteja carregando. O limite configurado é 60 segundos. Não foi fornecida sequência de logs de retorno por foco.            | Não disponível.                        | Não medido.   | Não medido.                |

Os horários dos logs permitem calcular somente o intervalo entre o primeiro e o
último evento observado em cada sequência: 684 ms na abertura de Shows
(`22:37:11.478–22:37:12.162 UTC`), 2.291 s na atualização de Shows
(`22:50:48.122–22:50:50.413 UTC`) e 2.178 s na abertura de Repertório
(`22:43:58.778–22:44:00.956 UTC`). Esses intervalos incluem a emissão e a
ordenação dos eventos; **não** representam duração individual das consultas,
latência do banco ou tempo até a interface aparecer.

### Como completar as medições ausentes

Para uma comparação válida, repetir cada fluxo no mesmo ambiente, banda e
aparelho, com cache vazio e depois com cache recente, registrando plataforma,
versão, quantidade de músicas/bandas/shows, estado da rede e horário.

- **Chamadas:** contar os eventos Edge por sequência e agrupar por caminho,
  método e `request_id`; separar autenticação e renovação de sessão.
- **Bytes:** capturar `response.headers.content_length` quando presente nos
  logs. Quando ausente, medir o corpo recebido no cliente de desenvolvimento e
  registrar se o valor representa bytes descomprimidos ou transferidos. Não
  inferir bytes a partir da quantidade de linhas.
- **Rede:** usar duração por `request_id` em telemetria que forneça início e fim
  da requisição; não subtrair timestamps de eventos diferentes para estimar a
  duração individual.
- **Interface:** gravar a tela desde a navegação e cronometrar separadamente a
  estrutura utilizável (cabeçalho/navegação) e o primeiro conteúdo útil da
  lista. Associar a captura à sequência de logs e às condições acima.

### Progresso da linha de base

As contagens fornecidas já confirmam as chamadas excessivas em Shows e a busca
duplicada de músicas em Repertório. Bytes, duração individual da rede, tempo até
conteúdo visível, abertura de Minhas bandas e retorno por foco ainda precisam de
captura antes de declarar uma comparação quantitativa completa. Esses valores
permanecem pendentes; nenhum intervalo de logs foi usado como substituto.

## Metas da change

| Fluxo                            | Meta de chamadas de dados por abertura ou refresh sem falhas                |
| -------------------------------- | --------------------------------------------------------------------------- |
| Shows                            | 2: contexto da banda e resumos dos shows.                                   |
| Repertório com dados de coleções | Até 4: contexto, músicas, coleções e vínculos; músicas consultadas uma vez. |
| Minhas bandas                    | 1 consulta de resumos, sem chamadas por banda.                              |

As metas excluem autenticação e operações posteriores iniciadas pela pessoa.
Bytes, tempo de rede e tempo de interface serão adicionados após medições com as
mesmas condições da linha de base.

## Cenários de teste para os contratos de leitura

Os testes usam objetos mínimos declarados pelos cenários e as factories em
`src/testing/factories/readModels.ts` (`createBandContext`,
`createUserBandSummary`, `createSongSummary` e `createShowSummary`). Esses
resumos não são derivados do catálogo de demonstração da aplicação.

`createInMemoryRepositories` recebe bandas, participações, músicas e shows
especificados pelo próprio teste. Seus métodos de leitura derivam os resumos
desses dados: listas de músicas omitem letras, documentos completos são
carregados apenas pelos IDs solicitados e resumos de shows usam o mesmo cálculo
de duração do domínio. A opção `now` torna previsível o próximo show em
`listUserSummaries`. Assim, cada teste controla quais registros existem e não
depende de `demoRepositoryData` ou de um seed do banco.

As chaves de consultas são centralizadas em `src/data/queryKeys.ts`. Repertório
e Coleções observam as mesmas consultas básicas de músicas, coleções e vínculos;
os resumos de Coleções são derivados desses resultados em memória. A abertura e
o refresh compartilham uma única atualização da lista de músicas, e mudanças em
vínculos não invalidam os dados das músicas. Chaves de `SongSummary` e de
documentos completos são distintas para impedir que um resultado sem letra seja
usado em edição ou visualização de letra.

## Planos SQL sob RLS

Em 15/10/2026, foram executados `ANALYZE` e `EXPLAIN (ANALYZE, BUFFERS)` no
Supabase local, usando o papel `authenticated`, a identidade local da Banda
Demo e as views `security_invoker`. O conjunto continha 72 músicas, 30 shows,
103 blocos e 883 itens de setlist. Os resultados abaixo são tempo do banco
local com buffers já em memória; não representam latência HTTP nem produção.

| Consulta                                              | Linhas |   Execução | Buffers compartilhados | Plano relevante                                                                                                                |
| ----------------------------------------------------- | -----: | ---------: | ---------------------: | ------------------------------------------------------------------------------------------------------------------------------ |
| `user_band_summaries ORDER BY band_name`              |      1 |   3,718 ms |                     86 | A subconsulta do próximo show usou `shows_band_starts_at_idx`, filtrando banda e instante e parando no primeiro show elegível. |
| `show_summaries WHERE band_id = … ORDER BY starts_at` |     30 | 454,896 ms |                  9.758 | Usou `show_blocks_show_position_idx`, `show_items_block_position_idx` e `songs_pkey`; percorreu 883 ocorrências sob RLS.       |
| `band_context WHERE band_id = …`                      |      1 |   1,746 ms |                     11 | Leitura sequencial das tabelas pequenas; a checagem de música ativa examinou 72 músicas.                                       |

Não foi adicionado índice: os índices de relacionamento e o índice
`shows_band_starts_at_idx` já aparecem no plano; as leituras sequenciais de
30 shows e 72 músicas são esperadas neste volume. A agregação de shows ainda
percorre cada ocorrência e executa as políticas RLS correspondentes, portanto
seu tempo de 455 ms deve ser reavaliado com volume maior e após instrumentação
da consulta de produção antes de qualquer mudança de índice ou de política.
