# Desempenho das leituras do Supabase

Este documento compara as leituras das telas de Minhas bandas, Shows e
Repertório. Resultados observados em logs, estimativas derivadas do código e
medições de interface são identificados separadamente para que intervalos entre
logs não sejam confundidos com latência de rede ou tempo de renderização.

**Estado em 17/10/2026:** encerramento aceito pelo responsável com as evidências
existentes. As pendências descritas nas rodadas abaixo são registros históricos;
seu tratamento final está em “Encerramento aceito em 17/10/2026” ao fim do
relatório e no
[registro de verificação](../openspec/changes/archive/2026-10-17-otimizar-leituras-supabase/verification.md).
A instrumentação temporária de desempenho foi removida do app no encerramento.

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

### Observação pós-otimização recebida em 16/10/2026

Foi recebido um recorte de Edge Logs de desenvolvimento entre
`14:26:28.611` e `14:30:34.932 UTC`, com clientes Android 16, iOS 18.3.1 e web.
O arquivo contém 51 eventos: 41 `GET` e 10 `OPTIONS` de preflight do navegador;
todos retornaram status 200. Os preflights não são leituras de dados.

| Endpoint                      | GETs | `avg_origin_time_raw` | Bytes registrados em respostas |
| ----------------------------- | ---: | --------------------: | -----------------------------: |
| `user_band_summaries`         |    4 |                614,75 |                 não disponível |
| `band_context`                |    6 |                 145,5 |                 não disponível |
| `show_summaries`              |    3 |                493,67 |            2.529 em 1 resposta |
| `songs`                       |    6 |                246,67 |                 não disponível |
| `repertoire_collections`      |    4 |                   130 |              747 em 1 resposta |
| `repertoire_collection_songs` |    3 |                   351 |                 não disponível |
| `band_members`                |    5 |                 177,6 |              255 em 1 resposta |
| `profiles`                    |   10 |                 203,3 |              291 em 1 resposta |

O cabeçalho `content_length` veio preenchido em somente 4 dos 41 `GET`s. Os
3.822 bytes somados são apenas o volume conhecido; campos vazios foram tratados
como desconhecidos, não como respostas de zero bytes. Os valores de
`avg_origin_time_raw` são mantidos como registrados e não medem o tempo de
interface nem, isoladamente, a duração ponta a ponta observada pela pessoa.

Os recortes nativos mostram uma chamada a `show_summaries` e uma a
`band_context` por plataforma. Em Android há três leituras de repertório
(`songs`, coleções e vínculos); em iOS aparecem duas (`songs` e coleções), sem
uma chamada de vínculos nesse recorte. `user_band_summaries` aparece duas vezes
no Android, com 11,267 s entre chamadas, e uma vez em cada iOS e web. Isso
confirma que o novo contrato responde sem erro, mas não esclarece se a segunda
chamada Android foi uma reentrada ou ação explícita.

O trecho web tem chamadas repetidas de `profiles`, `band_members`,
`band_context` e `songs`, além de duas leituras de cada contrato de coleções,
em uma janela de cerca de 36 s. Como o recorte não identifica ações de
navegação, refresh manual, retorno ao foco ou mudança de rota, não é possível
atribuir essas repetições a uma única abertura. São candidatas a investigar em
um trace que marque cada ação; não demonstram, sozinhas, que o limite de frescor
de 60 s foi violado.

O recorte mistura plataformas e várias interações, então não constitui uma
comparação equivalente por abertura/refresh com a linha de base. Registra-se
como evidência preliminar de disponibilidade e contagens agregadas. Permanecem
pendentes os traces delimitados por ação, bytes completos, tempo de rede e
tempo até estrutura/conteúdo visível; por isso as tarefas 1.1.2, 6.3.2 e 6.4.2
continuam abertas.

### Sequência delimitada no iOS em 16/10/2026

Uma nova sequência no iOS 18.3.1, usando a Banda Demo no ambiente de
desenvolvimento, registrou seis `GET`s entre `15:34:04.573` e `15:35:05.817
UTC`. Todos retornaram status 200:

| Ação             | Endpoint                                                         | Chamadas | `origin_time` registrado |
| ---------------- | ---------------------------------------------------------------- | -------: | -----------------------: |
| Minhas bandas    | `user_band_summaries`                                            |        1 |                   756 ms |
| Abrir Shows      | `band_context`, `show_summaries`                                 |        2 |           351 ms; 707 ms |
| Abrir Repertório | `repertoire_collection_songs`, `songs`, `repertoire_collections` |        3 |   390 ms; 315 ms; 393 ms |

As chamadas de Repertório ocorreram no mesmo milissegundo, compatíveis com
consultas concorrentes. A ordem dos eventos não indica dependência entre elas.
Não houve leitura de `/shows` ou `/songs` ao abrir Shows: a tela usou o resumo
agregado de shows. O retorno a Shows não gerou outro evento no recorte; isso é
compatível com o cache recente, mas a hora exata do toque de retorno não aparece
nos logs.

Comparando as contagens por tela com as sequências antigas observadas, Shows
passou de 6 para 2 leituras (redução de 4, ou 66,7%) e Repertório passou de 7
para 3 (redução de 4, ou 57,1%). Em Repertório, as consultas duplicadas de
`songs` passaram de duas para uma. Minhas bandas fez uma leitura de resumo; não
há uma sequência antiga de logs delimitada dessa tela para uma comparação
observada.

Os tempos acima são os valores individuais `origin_time` dos eventos; não
medem tempo total de interface ou duração percebida. O campo
`response.headers.content_length` estava vazio em todos os seis eventos, então
esta rodada não permite comparar bytes. As novas contagens confirmam as metas
de chamadas para as três telas nessa navegação, mas bytes, latência de rede e
tempo até o conteúdo ficar visível continuam pendentes. Também faltam os fluxos
equivalentes na Web e os cenários de falha/rede lenta.

### Sequência delimitada no Android em 16/10/2026

Uma sequência equivalente no Android 16, também com a Banda Demo no ambiente
de desenvolvimento, registrou seis `GET`s entre `15:42:45.144` e
`15:42:56.169 UTC`. Todos retornaram status 200:

| Ação             | Endpoint                                                         | Chamadas | `origin_time` registrado |
| ---------------- | ---------------------------------------------------------------- | -------: | -----------------------: |
| Minhas bandas    | `user_band_summaries`                                            |        1 |                   730 ms |
| Abrir Shows      | `band_context`, `show_summaries`                                 |        2 |           303 ms; 619 ms |
| Abrir Repertório | `repertoire_collections`, `songs`, `repertoire_collection_songs` |        3 |   732 ms; 202 ms; 256 ms |

A contagem e os endpoints correspondem à sequência iOS descrita acima: uma
consulta de resumo para Minhas bandas, duas para Shows e três para Repertório.
Não houve leituras separadas de `/shows` ou de músicas durante a abertura de
Shows. O retorno a Shows não acrescentou uma leitura no recorte informado,
compatível com o cache recente. Os recortes confirmam paridade de chamadas
entre iOS e Android para essa sequência.

O cabeçalho `content_length` também veio vazio em todos os seis eventos Android.
Os `origin_time` registrados variam entre plataformas, mas sem medições de rede
e de interface alinhadas não permitem concluir qual experiência foi mais
rápida. A comparação de bytes e o tempo até estrutura/conteúdo visível seguem
pendentes; a sequência Web recebida a seguir não é delimitada o bastante para
ser comparada diretamente.

### Sequência Web recebida em 16/10/2026

O recorte do Chrome no macOS contém 18 eventos entre `15:45:59.276` e
`15:46:21.985 UTC`: 13 `GET`s e 5 `OPTIONS` de preflight, todos com status 200. O campo `content_length` está vazio em todos. O trecho não traz marcas de
toque/navegação, então não é possível associar cada grupo a uma ação específica.

| Endpoint              | GETs | Observação                                                   |
| --------------------- | ---: | ------------------------------------------------------------ |
| `profiles`            |    4 | Inclui perfil da conta na navegação persistente              |
| `user_band_summaries` |    1 | Uma leitura no trecho                                        |
| `band_context`        |    3 | Repetida em momentos diferentes                              |
| `band_members`        |    2 | Leitura redundante para exibir o papel na barra lateral      |
| `show_summaries`      |    2 | Repetida em momentos diferentes                              |
| `songs`               |    1 | O trecho não inclui todos os endpoints da tela de repertório |

Na versão do código analisada junto a esse log, a barra lateral web persistente
chamava `useBandMembers` apenas para encontrar o papel do usuário conectado.
Essa chamada também carregava os perfis dos integrantes. A barra passou a usar o
papel já retornado por `useBandContext`; o perfil atual continua sendo carregado
para apresentar nome, e-mail e avatar da conta. Assim, ao repetir o fluxo, não
se espera mais a leitura de `band_members` causada pela barra lateral. Outros
usos explícitos de integrantes, como a tela de detalhes da banda, permanecem.

As chamadas repetidas de `band_context`, `show_summaries` e `profiles` não podem
ser explicadas apenas por este recorte, pois ele não identifica cliques, foco,
refresh ou recarga do documento. Precisam ser reavaliadas com uma nova captura
após a alteração e com ações marcadas por horário. O campo `content_length`
vazio não permite comparar o volume transferido. As tarefas 1.1.2, 6.3.2 e
6.4.2 continuam abertas.

### Observação: “Conferindo seu acesso…” na navegação web

Essa mensagem é renderizada pelo `AuthGate` somente enquanto o estado da sessão
é `loading` (ou durante um atraso de prévia de desenvolvimento configurado).
`AuthSessionProvider` define `loading` na montagem e depois o substitui por
`authenticated`, `unauthenticated` ou `error`; mudanças normais de rota não
alteram esse estado. Portanto, a tela não deve aparecer a cada clique de
navegação. Antes da captura de rede abaixo, ainda não era possível distinguir
remontagem do provedor de recarga do documento. A variável local
`EXPO_PUBLIC_AUTH_GATE_PREVIEW_MS=4` controla apenas a espera de prévia após a
montagem e, sozinha, não explica reaparições por clique.

Uma captura posterior do DevTools mostrou navegações com novas requisições do
documento e do bundle `expo-router/entry.bundle`, além da reconexão de `/hot` e
`/message` do Metro após cliques entre rotas. Isso confirma recarga do documento,
e não apenas uma nova consulta do React Query. O stack do console fornecido
depois mostra a inicialização do cliente HMR nessa recarga; não é, por si só,
uma exceção da aplicação.

A revisão do código identificou `Link asChild` com React Native Web `Pressable`
como uma causa provável: o handler do Pressable pode substituir o clique do
Expo Router e deixar o navegador seguir o `href`. Os links da barra lateral, do
perfil e da navegação inferior foram adaptados para usar um `View` como filho Web
do `Link`; no React Native continuam usando `Pressable`.

Em 16/10/2026, o responsável confirmou visualmente que, após a alteração,
navegar na Web não voltou a apresentar “Conferindo seu acesso…”. Uma captura
anterior continha GET de documento para `/bands/.../shows`, bundle do Expo
Router e reconexões HMR, mas não identificava os limites das ações. Ela não
permite atribuir com segurança aquela recarga ao clique em Shows.

### Refresh de Bandas seguido de clique em Shows

Uma nova captura do DevTools foi feita em sequência controlada: primeiro houve
refresh na tela de Bandas; depois, clique em Shows. A primeira requisição foi
`GET /bands/{id}/band` com `Accept: text/html`, compatível com o refresh da
página que já estava aberta. O bundle `expo-router/entry.bundle` e as conexões
`/hot` e `/message` do Metro vieram nesse mesmo trecho, com referência à rota
de Bandas. Isso atribui a recarga observada ao refresh inicial.

Depois aparecem as consultas de inicialização/detalhe da banda (`profiles`,
`band_context`, `band_members`, outro `profiles` e `invitations`) e, após elas,
`GET /rest/v1/show_summaries`. Não há nesta captura novo GET de documento para
`/bands/{id}/shows`, nem novo bundle/HMR associado ao clique em Shows. Portanto,
o clique observado foi uma navegação SPA e carregou o resumo de Shows; a recarga
evidenciada ocorreu no refresh deliberado da tela de Bandas. Isso é consistente
com o aviso “Conferindo seu acesso…” não reaparecer ao navegar.

A captura não inclui timestamps por evento; a atribuição da última consulta a
Shows se baseia na ordem informada da interação e no endpoint específico. Ela
valida esse fluxo Web, mas não cobre Repertório, retorno por foco, rede lenta ou
falhas. A validação manual completa da tarefa 6.2 e as comparações de payload e
tempo das tarefas 1.1.2, 6.3.2 e 6.4.2 continuam abertas.

## Metas da change

| Fluxo                            | Meta de chamadas de dados por abertura ou refresh sem falhas                |
| -------------------------------- | --------------------------------------------------------------------------- |
| Shows                            | 2: contexto da banda e resumos dos shows.                                   |
| Repertório com dados de coleções | Até 4: contexto, músicas, coleções e vínculos; músicas consultadas uma vez. |
| Minhas bandas                    | 1 consulta de resumos, sem chamadas por banda.                              |

As metas excluem autenticação e operações posteriores iniciadas pela pessoa.
Bytes, tempo de rede e tempo de interface serão adicionados após medições com as
mesmas condições da linha de base.

### Comparação de chamadas derivada do código

Os números pós-otimização abaixo são contagens esperadas dos contratos de
consulta, conferidas nos hooks, adaptadores e testes automatizados. Ainda não
são uma contagem observada em Edge Logs após a mudança.

| Fluxo                          | Linha de base                                                                  | Leituras específicas esperadas após a mudança                                                | Evidência automatizada                                                                                                                                                |
| ------------------------------ | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shows, abertura ou atualização | 6 na abertura e 5 no refresh (observado)                                       | 2: `band_context` e `show_summaries`; sem lista de músicas ou show completo                  | Testes da tela confirmam uma leitura de resumos e nenhuma leitura de músicas ou documentos completos; teste de contexto confirma compartilhamento pela área da banda. |
| Repertório com Coleções        | 7 na abertura, incluindo duas consultas equivalentes de músicas (observado)    | Até 4: `band_context`, resumos de músicas, coleções e vínculos; metadados de músicas uma vez | Testes de Repertório e das queries confirmam consulta compartilhada de músicas e dependências separadas de coleções.                                                  |
| Minhas bandas                  | 3 + N, derivado do caminho anterior no código; sem sequência de logs fornecida | 1: `user_band_summaries`, independente de N                                                  | Teste de `BandsScreen` confirma uma chamada a `listUserSummaries` e nenhuma leitura de shows por banda.                                                               |
| Retorno com cache recente      | Antes da mudança, dependia das queries registradas e de sua validade           | 0 leituras de tela antes de 60 s; queries invalidadas explicitamente continuam revalidáveis  | Testes do hook cobrem cache recente, cache com 60 s, consulta em andamento, atualização concorrente e invalidação recente.                                            |

As contagens excluem autenticação e operações iniciadas após a tela estar
disponível. A soma ainda precisa ser conferida nos logs posteriores à mudança,
associando as requisições a uma navegação delimitada e comparando os bytes
quando `response.headers.content_length` estiver disponível.

As migrações de resumos são aditivas: criam os contratos novos sem remover as
tabelas e relações usadas pelos clientes anteriores. As suítes pgTAP antigas
de músicas, shows e integridade passaram no banco isolado limpo, além das
suítes novas; isso verifica os contratos de banco antigos e novos, mas não
substitui a conferência de compatibilidade em um cliente já distribuído.

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

O `BandAreaLayout` e as telas filhas usam `useBandContext` com a mesma chave por
usuário e banda. O nome e o papel atual são compartilhados em uma leitura de
`band_context`, sem carregar a lista completa de participações apenas para
decidir se a pessoa pode editar. A invalidação de participação atualiza esse
contexto ativo, então mudança de papel atualiza os controles da tela. A lista
geral de bandas permanece um contrato distinto para Minhas bandas.

Minhas bandas consulta `user_band_summaries` uma vez e usa seu próximo show já
calculado no servidor; a tela não carrega todos os shows de cada banda. `null`
significa que a consulta terminou e não há próximo show elegível. Antes da
resposta, a tela permanece em carregamento e não mostra essa ausência como
resultado confirmado. O teste da tela verifica uma única leitura de resumo e
nenhuma leitura da lista de shows por banda.

Shows consulta `show_summaries` e usa a duração agregada no banco para os cards
e a ordenação por duração. Pesquisa, filtros de data/status, calendário e
ordenação usam apenas os campos do resumo; a tela não carrega músicas nem o
documento completo dos shows para construir a lista. A consulta de contexto é
secundária: enquanto está pendente ou falha, os cards continuam visíveis e as
ações que dependem do papel ficam indisponíveis.

### Composição e frescor do refresh

As consultas expõem suas chaves de dados para `useScreenDataRefresh`. Quando
uma consulta composta cobre todas as chaves de outra consulta registrada na
tela, o refresh manual ou por foco atualiza apenas a composta. Dependências
parcialmente sobrepostas continuam sendo atualizadas para não omitir chaves
exclusivas. Consultas que já estão carregando são ignoradas, chamadas repetidas
de pull-to-refresh são serializadas e o React Query compartilha a requisição em
andamento entre observadores com a mesma chave.

O retorno por foco atualiza somente dados com pelo menos 60 segundos desde a
última atualização. Um resumo derivado de várias consultas usa o timestamp da
dependência mais antiga; assim, uma dependência vencida não fica escondida por
outra que acabou de atualizar. Testes cobrem o limite do intervalo, refresh
concorrente, deduplicação de chaves cobertas, dependências sobrepostas e
timestamp agregado.

### Sessão, reconexão e retorno ao primeiro plano

O `QueryClient` é criado por sessão e remontado quando o ID do usuário muda; os
dados em cache de uma sessão não são reutilizados pela seguinte. Ao recuperar a
conexão ou voltar ao primeiro plano, a aplicação cancela leituras protegidas em
andamento e limpa o cache das chaves de bandas e músicas. A tela focada registra
suas próprias consultas e somente elas são buscadas novamente. Consultas de
rotas inativas perdem os dados antigos, mas aguardam a próxima abertura para
fazer uma nova requisição. Isso permite remover letras, shows ou dados de banda
que deixaram de estar disponíveis após moderação ou perda de acesso sem fazer
uma atualização de rede para cada tela montada. Testes cobrem reconexão,
retorno ao primeiro plano, conteúdo atualizado/vazio, cache protegido de rota
inativa e isolamento entre usuários.

As invalidações são centralizadas em `src/data/queryInvalidations.ts` e seguem a
matriz do design: mudanças de duração alcançam os resumos de shows; alterações
de agenda alcançam o próximo show; mudanças de papel alcançam contexto,
integrantes e a lista do usuário. Alterações apenas nos vínculos invalidam
coleções/vínculos e preservam o cache de músicas. A invalidação usa
`refetchType: 'active'`; dados sem observadores são marcados para atualização
na próxima consulta. Testes verificam também que consultas não relacionadas
permanecem válidas e que o cache antigo do objeto de banda é atualizado após a
criação.

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

## Validação integrada

Em 16/10/2026, a validação automatizada do código passou com `npm run validate`:
formatação, lint e typecheck passaram; Jest passou com 115 suítes e 849 testes.
A cobertura foi de 84,23% em statements, 81,06% em branches, 82,14% em
functions e 85,12% em lines. `npm run supabase:lint` passou sem erros de
schema. `npm run test:e2e:web` passou nos quatro cenários existentes de
autenticação, acessibilidade e responsividade; esses cenários não cobrem os
fluxos autenticados de Repertório e Shows.

A suíte pgTAP completa passou em um Supabase local isolado, com seed desativado:
26 arquivos e 432 testes. No banco local de desenvolvimento com a Banda Demo,
três suítes antigas (`4.3-songs.sql`, `4.4-shows-and-setlists.sql` e
`4.6-integrity-triggers.sql`) falharam porque pressupõem tabelas sem dados
persistidos; o banco original não foi resetado nem alterado para contornar isso.
O clone temporário foi parado e removido depois da validação.

Esses resultados confirmam testes automatizados e contratos SQL, mas não
substituem a validação manual em aparelhos nem a comparação dos logs de
produção/desenvolvimento após a otimização. Os fluxos multiplataforma e as
contagens/tamanhos de payload pós-mudança continuam pendentes.

### Inspeção visual parcial no iPad em 16/10/2026

Foi feita uma inspeção manual no iPad Pro de 13 polegadas (M4), iOS 18.3,
com o app de desenvolvimento conectado ao Metro `8081`, sessão autenticada e
Banda Demo. Em Shows, a lista exibiu durações nos cards; um detalhe abriu com
50 minutos, 11 músicas, blocos e anotações. O editor de setlist exibiu o
conteúdo e os botões fixos Cancelar/Salvar. O editor foi cancelado sem gravar.

Em Repertório, foi aberta uma música e a tela carregou sua letra estruturada.
O diálogo de organização de coleções foi aberto com uma lista longa; o rodapé
com Nova coleção, Cancelar e Salvar permaneceu visível. O diálogo foi cancelado
sem alterar os vínculos. Esses resultados confirmam apenas a renderização e a
navegação visual nesses fluxos no iPad; não medem tempos de estrutura ou de
conteúdo visível. A espera observada entre abrir um show e mostrar seu detalhe
foi aproximada pela inspeção e não constitui uma medição cronometrada.

Esta rodada não validou um refresh de Shows de forma conclusiva, mudança de
papel, respostas lentas ou falhas, nem os mesmos fluxos completos no Android e
na Web. A consulta SQL não retornou dados: a aba nova estava configurada para a
fonte `Database`, onde `logs` não existe. A tela Unified Logs do Supabase foi
aberta depois e mostrou estas linhas (horários conforme exibidos no Dashboard):

| Horário  | Chamadas GET visíveis                                                            | Observação                                                                                                                      |
| -------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 13:50:21 | `songs`, `repertoire_collection_songs`, `band_context`, `repertoire_collections` | Quatro endpoints, status 200; compatível com a abertura de Repertório no iPad, mas a lista não mostrava request ID nem cliente. |
| 13:51:15 | `show_summaries`, `shows`                                                        | Dois endpoints, status 200; podem corresponder à lista de Shows e à abertura do detalhe.                                        |
| 13:51:49 | `band_context` duas vezes                                                        | Ambas 200; não há request IDs visíveis para confirmar se são duplicatas da mesma ação.                                          |
| 13:54:26 | `repertoire_collection_songs`, `songs`, `repertoire_collections`, `band_context` | Também havia `OPTIONS` para coleções, vínculos e músicas, indicando chamadas do navegador; não associar esse grupo ao iPad.     |

Essa inspeção visual do Logs Explorer é uma evidência parcial de chamadas e
respostas bem-sucedidas, mas não expôs `request_id`, `user_agent`,
`X-Client-Info` ou `content_length`. Os horários e caminhos não bastam para
vincular inequivocamente todas as linhas às ações do simulador. Não usar o
grupo de 13:50 como comparação quantitativa concluída com a linha de base nem
como medição de payload. Permanecem abertas as tarefas 1.1.2, 6.2, 6.3.2 e
6.4.2.

### Janela ampliada de Edge Logs recebida em 16/10/2026

O responsável ampliou o intervalo da consulta. O arquivo contém 147 eventos
entre `15:33:03.834` e `16:54:26.525 UTC` (cerca de 81 minutos): 134 `GET`s e
13 `OPTIONS`, todos com status 200. Os `OPTIONS` são preflights do navegador.
Por ser uma janela longa com várias navegações, os totais agregados não
representam a abertura de uma tela nem permitem comparação por ação.

| Cliente | GETs | OPTIONS |
| ------- | ---: | ------: |
| Web     |   96 |      13 |
| iOS     |   32 |       0 |
| Android |    6 |       0 |

O campo `content_length` estava preenchido em apenas 9 eventos; a soma dos
valores conhecidos foi 1.997 bytes. Os demais tamanhos são desconhecidos, não
zero, então não há volume total comparável. Não houve resposta com status de
erro nessa janela.

No iOS, 10 dos 32 GETs foram para `band_context`. Quatro pares ocorreram com
IDs de requisição diferentes e intervalo de 2–9 ms, em `15:50:11`, `16:48:44`,
`16:50:21` e `16:51:49 UTC`. Os timestamps e IDs confirmam chamadas HTTP
distintas. O código mostrava `BandAreaLayout` e a tela filha registrando
`band_context` em hooks de foco separados; quando ambos revalidavam a mesma
chave, um `refetch` podia cancelar e iniciar de novo o pedido do outro
consumidor. As demais ocorrências de contexto, summaries e metadados aparecem
em horários distintos e podem refletir navegações/retornos após o limite de
frescor; a janela não fornece marcação de ações para atribuí-las com certeza.

O refresh agora reserva temporariamente as chaves em voo e ignora um refetch
equivalente iniciado por outro consumidor, mantendo a possibilidade de
revalidar a chave depois que a chamada atual termina. O teste focado cobre dois
consumidores simultâneos e a próxima chamada após conclusão; os sete testes de
`useScreenDataRefresh` passaram. Essa é evidência automatizada do controle de
duplicidade, mas os logs fornecidos são anteriores à correção. Para fechar a
validação observada, repetir uma navegação/retorno no iOS e consultar uma janela
curta com `request_id`, `timestamp`, `path`, `status` e `x_client_info`; não é
necessário executar a query ampla novamente. As tarefas 6.2, 6.3.2 e 6.4.2
continuam abertas.

### Verificação curta no iOS após a deduplicação do refresh

O recorte enviado após a correção contém 15 eventos entre `19:32:38.536` e
`19:39:12.348 UTC`, incluindo chamadas da Web e do iOS. Todos retornaram status 200. No iOS, houve uma leitura de `band_context` (`origin_time` 140) e uma de
`show_summaries` (`508`), separadas por 8 ms; não houve uma segunda chamada de
`band_context` nesse fluxo. Isso é consistente com a deduplicação implementada,
embora o recorte não identifique explicitamente o toque de abertura de Shows.

Um novo `show_summaries` ocorreu às `19:39:04.861 UTC`, 117,597 s depois do
anterior, sem outro `band_context` no trecho. É uma chamada distinta e não o
par imediato visto antes; sem a sequência de ações do aparelho, não é possível
determinar por que apenas esse resumo foi atualizado. Repertório apresentou
uma chamada para cada um dos três recursos esperados (`repertoire_collections`,
`songs` e `repertoire_collection_songs`) em uma janela de 5 ms. O iOS também
teve três leituras de `user_band_summaries`, separadas por mais de 60 s, o que
não caracteriza duplicação concorrente neste recorte.

Os tamanhos das respostas iOS estão ausentes; o único `content_length` não
vazio foi 220 bytes numa leitura Web de perfil. Portanto, esta captura verifica
parcialmente a contagem de chamadas no iOS, mas não mede payloads nem latência
percebida. Para interpretar o segundo `show_summaries`, ainda seria necessário
marcar a hora da navegação/refresh correspondente. As tarefas 1.1.2, 6.2, 6.3.2
e 6.4.2 continuam abertas.

### Navegação cronometrada no simulador iOS e recorte de Edge Logs

Em 16/10/2026, foram feitas navegações autenticadas na Banda Demo no iPad Pro
13 polegadas (M4), iOS 18.3, com a versão de desenvolvimento `1.0.0`. O recorte
de Edge Logs contém 17 GETs entre `19:46:44.895` e `19:50:43.786 UTC`; todos
retornaram status 200 e identificam `platform=ios`. `content_length` está vazio
em todos os eventos, então não há tamanho de payload observável nesta rodada.
Shows foi aberto por toque na barra inferior. Para sair da tela de detalhe que
continuou no stack da aba, Repertório e Minhas bandas foram abertas com rotas
`setlist://` via `simctl`; seus tempos medem a transição/renderização da rota,
não uma navegação completa por toque.

| Ação associada                            | Janela / chamadas                                                                                           | Resultado                                                                                                                                                                                                                                                   |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Abrir Shows a partir do detalhe de música | `19:46:44.895–19:46:44.904`: `band_context` e `show_summaries`                                              | Dois GETs; os cards estavam visíveis na captura até 4 s após o toque.                                                                                                                                                                                       |
| Selecionar/retornar a Repertório          | `19:47:03.302–19:47:03.395`: `repertoire_collections`, `repertoire_collection_songs` e dois GETs de `songs` | Quatro GETs. A captura ainda mostrava o detalhe da música; a atribuição da consulta à mudança de foco é aproximada. Os dois de `songs` têm IDs diferentes e estão separados por 8 ms; o recorte não inclui a query string para confirmar filtros idênticos. |
| Atualização de contexto isolada           | `19:48:00.206`: `band_context`                                                                              | Um GET; não há outro recurso no trecho próximo que permita atribuir com certeza a qual mudança de foco corresponde.                                                                                                                                         |
| Abrir Repertório                          | `19:49:03.797–19:49:03.827`: contexto, coleções, vínculos e músicas                                         | Uma chamada por recurso. A lista e os dados estavam visíveis na captura feita até 4 s após abrir a rota.                                                                                                                                                    |
| Voltar a Shows                            | `19:49:42.788`: `show_summaries`                                                                            | Um GET; `band_context` fora do recorte da ação, ainda atualizado havia cerca de 39 s.                                                                                                                                                                       |
| Abrir Minhas bandas                       | `19:49:58.706`: `user_band_summaries`                                                                       | Um GET, sem carregar shows individuais das bandas. Os três cards estavam visíveis em até 3 s.                                                                                                                                                               |
| Reabrir Repertório                        | `19:50:43.733–19:50:43.786`: contexto, coleções, músicas e vínculos                                         | Uma chamada por recurso. Na segunda medição, a lista apareceu entre 1 e 2 s, e o indicador de carregamento não aparecia na captura de 4 s.                                                                                                                  |

Os tempos de tela são aproximações obtidas por capturas do simulador, não
telemetria de renderização. Na primeira abertura de Repertório a lista estava
visível em até 4 s, mas ainda havia um indicador de carregamento; ele já não
aparecia na captura feita 22 s após a navegação. Na segunda abertura, a lista
apareceu entre 1 e 2 s e o indicador havia sumido em 4 s. Essa diferença entre
as duas capturas precisa ser tratada como variabilidade observada, não como um
tempo exato de conclusão.

A contagem confirma, neste fluxo iOS, o resumo de Shows sem consulta à tabela
`shows` ou a uma lista de músicas para calcular duração, e Minhas bandas sem
consultas de shows por banda. Três carregamentos de Repertório tiveram uma
chamada por cada recurso de lista; uma interação inicial teve um segundo GET
de `songs` 8 ms após o primeiro. O hook de Repertório usa metadados de músicas
diretamente e também via `useRepertoireCollections`; os dois consumidores
compartilham a mesma chave de consulta, e o orquestrador de refresh remove
chaves equivalentes. A origem exata do segundo GET não está provada pelo recorte;
uma corrida entre a busca inicial e a revalidação no foco é uma hipótese a
investigar. Nas duas aberturas posteriores, essa repetição não ocorreu.

Os `origin_time` brutos deste recorte variam de 29 a 606; o log não fornece
tempo de ida e volta percebido pelo usuário, portanto esses valores não são
comparáveis diretamente com a medição visual. Também não existe uma captura
histórica anterior com sequência equivalente, então esta evidência ainda não
fecha a comparação de redução nem permite calcular bytes economizados. O trecho
valida parcialmente contagens e renderização no iOS; 1.1.2, 6.2, 6.3.2 e 6.4.2
continuam abertas para a linha de base comparável, o GET duplicado, payloads e
fluxos completos em Android/Web.

### Testes manuais Web no Chrome em 16/10/2026

Foi exercitada a versão Web de desenvolvimento no Metro `8081`, com sessão
autenticada, Banda Demo e Chrome. O DevTools Network foi limpo antes do refresh
isolado de Minhas bandas. A tela manteve os cards e o refresh gerou somente um
GET para `user_band_summaries`: status 200, 538 ms no Network e cerca de 1,2 kB
transferidos. Não apareceram GETs de `bands` nem de shows individuais nessa
ação. O tamanho exibido pelo Chrome é transferência HTTP observada no cliente;
não mede bytes processados pelo banco.

Também foram percorridos Shows, Repertório, detalhe de música e letra em tela
cheia, organizador de coleções e edição de setlist. As listas, detalhes, letra,
contagens e durações foram exibidos. Os dois editores foram cancelados sem
gravar alterações. A troca de seção Shows/Repertório funcionou como navegação
interna e não mostrou o indicador “Conferindo seu acesso…”. Nesta sessão, o
indicador apareceu ao abrir o detalhe de um show a partir do card e ao retornar
do modo de letra em tela cheia para o detalhe da música; em cada caso a tela
carregou depois de uma espera observada de aproximadamente 8 s. Essa observação
é visual, não uma medição de primeiro frame ou de autenticação, e não prova a
causa do indicador.

Sob perfil Slow 4G do DevTools, atualizar o detalhe do show manteve o conteúdo
anterior visível enquanto a atualização ocorria. Foram observados quatro GETs
Supabase: `band_context` (784 ms), `show_summaries` (881 ms), detalhe em
`shows` (813 ms) e `songs` (835 ms); o Chrome reportou cerca de 14,0 kB
transferidos nessa captura. Ao bloquear somente `band_context` e atualizar a
mesma tela, as outras três leituras continuaram bem-sucedidas e o resumo e a
setlist existentes permaneceram visíveis. O Network mostrou quatro tentativas
bloqueadas de `band_context` (0 ms/0 bytes), compatíveis com retries; a interface
apresentou o aviso “Não deu para carregar — Essa lista saiu do tom. Não
conseguimos carregar; tente novamente.” Isso valida degradação parcial sem
perda do conteúdo que já estava renderizado, mas também mostra que a falha de
contexto produz um aviso genérico mesmo com a lista principal presente.

Ao final, a regra de bloqueio foi removida; o DevTools confirmou “Nothing
throttled or blocked” e “No throttling”. A captura final deixou o app em
Minhas bandas com a sessão ativa. Não foi feita troca de papel da banda, pois
isso alteraria permissões persistidas. As capturas desta execução estão em
`/private/tmp/setlist-web-test-*` e são temporárias. A evidência vem do Network
do navegador, não de uma nova extração de Edge Logs do Supabase.

Este teste cobre parcialmente a plataforma Web em condição normal, lenta e com
falha de uma dependência. Não fecha a tarefa 6.2, que também exige Android e
iOS e outros fluxos/cenários; tampouco fornece uma linha de base histórica
equivalente para 1.1.2 ou uma comparação pré/pós de payloads para 6.3.2. Para
6.4.2, a inspeção atual registra conteúdo e chamadas da Web, mas não substitui
as medições faltantes e a validação manual multiplataforma. As tarefas
1.1.2, 6.2, 6.3.2 e 6.4.2 permanecem abertas.

### Recorte de Edge Logs Android recebido em 16/10/2026

O recorte contém 18 GETs de `Setlist/1.0.0` no Android 16, com
`platform=android` e `env=development` no `x_client_info`. Todos retornaram
status 200. `content_length` está vazio em todas as linhas; portanto, esta
captura não fornece bytes de resposta para comparação. Os `origin_time` variam
de 57 a 857 ms e representam a medição do serviço no log, não o tempo completo
percebido no aparelho.

| Recurso                       | GETs | Observação                                                                                                                                                                                    |
| ----------------------------- | ---: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `user_band_summaries`         |    1 | Única leitura na janela de Minhas bandas, sem leituras de shows individuais.                                                                                                                  |
| `band_context`                |    3 | Em momentos distintos da janela; sem pares imediatos duplicados.                                                                                                                              |
| `show_summaries`              |    3 | Uma leitura próxima a `band_context` na entrada/retorno a Shows e outra no fim do recorte.                                                                                                    |
| `shows`                       |    1 | Uma leitura separada, compatível com abrir detalhe; falta timestamp de ação para confirmar.                                                                                                   |
| `songs`                       |    4 | Três ocorrências alinhadas com grupos de leitura de Repertório; a ocorrência adicional 6,682 s após o primeiro grupo foi confirmada como consulta do documento completo de uma música por ID. |
| `repertoire_collections`      |    3 | Uma por cada um de três grupos temporais distintos.                                                                                                                                           |
| `repertoire_collection_songs` |    3 | Uma por cada um de três grupos temporais distintos.                                                                                                                                           |

Os três grupos de leitura do Repertório aparecem às `20:29:29`, `20:30:39` e
`20:33:09` no timestamp fornecido. São separados por mais de um minuto, e não
indicam duplicação concorrente. Em `20:29:29`, os três recursos principais
foram consultados em 18 ms; às `20:30:39`, em 28 ms; às `20:33:09`, contexto,
coleções, músicas e vínculos ocorreram em cerca de 122 ms. `show_summaries`
ocorreu às `20:33:13.908`, aproximadamente 4,5 s depois desse último grupo,
possivelmente após navegação, mas o recorte não traz marcação das ações.

Essa evidência Android sustenta que Minhas bandas não carrega shows por banda,
que a lista de Shows usa `show_summaries` e que `shows` aparece em uma leitura
separada de detalhe. Não há resposta com erro nem repetição imediata por rota
nesta janela. As URLs completas confirmam a separação intencional: às
`20:29:29.033`, a tela consultou a projeção explícita de metadados da lista;
às `20:29:35.715`, consultou `select=*` filtrando a mesma banda e o ID
`a8f418c7-8294-4d34-8400-825c006c0529`. Isso corresponde a uma leitura
posterior do documento completo de uma música, em chave de cache distinta dos
resumos, e não a uma duplicação da busca da lista. Ambas retornaram status 200;
`origin_time` foi 133 e 57, respectivamente. `content_length` continua ausente,
portanto não há comparação de bytes. A evidência confirma no Android o
carregamento sob demanda previsto em 5.5 e contribui parcialmente para 6.2;
não substitui os cenários de rede lenta/falha, medições visuais, a linha de
base de 1.1.2 ou a comparação pré/pós de payloads em 6.3.2. Permanecem abertas
1.1.2, 6.2, 6.3.2 e 6.4.2.

### Medição de respostas no cliente de desenvolvimento

Em 16/10/2026, `createSupabaseRequestFetch` passou a emitir
`[Setlist:supabase-read]` para GETs dos sete recursos desta change, somente
quando `__DEV__` está ativo e o ambiente do app é desenvolvimento. O registro
inclui método, caminho, nomes dos parâmetros (sem seus valores), status,
`timeToResponseHeadersMs`, o header `content-length` quando preenchido,
`responseBodyBytes` e `bodyReadMs`. Não registra URL completa, IDs, tokens nem
corpo de resposta. Se o header de tamanho estiver vazio, o cliente lê uma cópia
da resposta em segundo plano para contar o corpo; isso usa memória adicional
temporária em desenvolvimento e fica limitado aos endpoints listados.

`responseBodyBytes` é o tamanho do corpo entregue ao Fetch após eventual
descompressão; não deve ser comparado como se fosse bytes da transferência de
rede. `timeToResponseHeadersMs` mede do início do Fetch até receber os headers,
e não inclui necessariamente a leitura completa do corpo nem o tempo de tela.
Use o header de `content-length` e a medição do corpo como grandezas separadas.

A instrumentação foi verificada com 7 testes focados de
`requestIdentification-test.ts`, `npm run typecheck`, ESLint nos dois arquivos
alterados e Prettier; todos passaram naquela rodada. Os eventos foram coletados
no console de desenvolvimento junto aos Edge Logs durante a validação. Em
17/10/2026, o coletor e os dois testes exclusivos de medição foram removidos;
o cliente não faz mais a leitura adicional por `response.clone()` nem emite
`[Setlist:supabase-read]`. Os testes da identificação permanente nos headers
foram mantidos. Esta seção descreve a coleta histórica, e não uma configuração
ativa do app.
O ambiente desta sessão não tem o comando `adb`, então os eventos da
instrumentação local não foram coletados no Android. Há Edge Logs Android na
seção anterior, mas sem `content_length` nos GETs; eles permitem avaliar
contagens e `origin_time`, não bytes nem tempo de interface. Ainda faltam a
sequência histórica de Minhas bandas, cenários completos de falha e rede lenta
nas plataformas e comparação pré/pós de payloads.

Atualização: numa sessão posterior em 16/10/2026, o aparelho Android ficou
disponível e a instrumentação foi capturada pelo React Native DevTools ligado
ao Metro 8081. O `logcat` não continha esses eventos; consulte a seção de
validação Android abaixo. Isso corrige a limitação de coleta local descrita
acima, mas não resolve as lacunas de baseline, rede lenta/falha em todas as
plataformas ou payloads de rede comparáveis.

### Validação manual adicional no iPad em 16/10/2026

Usei o iPad Pro de 13 polegadas, iOS 18.3, com o app de desenvolvimento
conectado ao Metro 8081 e sessão autenticada. As telas de Minhas bandas, Shows,
Repertório, detalhe de música, letras em tela cheia e detalhe de show abriram e
exibiram conteúdo. A letra em tela cheia não provocou uma leitura adicional.
No detalhe do show, a leitura do documento completo ocorreu separada das
leituras resumidas da lista. Não foram feitas alterações persistentes.

Os eventos locais `[Setlist:supabase-read]` registraram as seguintes leituras
com status 200:

| Ação                    | Recurso                       | Tempo até headers | Corpo lido pelo Fetch |
| ----------------------- | ----------------------------- | ----------------: | --------------------: |
| Minhas bandas           | `user_band_summaries`         |          1,302 ms |                 404 B |
| Abrir Shows             | `band_context`                |            346 ms |                 116 B |
| Abrir Shows             | `show_summaries`              |          1,331 ms |               7,881 B |
| Atualizar Shows         | `band_context`                |          2,126 ms |                 116 B |
| Atualizar Shows         | `show_summaries`              |          2,131 ms |               7,881 B |
| Abrir Repertório        | `repertoire_collections`      |            139 ms |               2.736 B |
| Abrir Repertório        | `songs` (resumo)              |            556 ms |              26.751 B |
| Abrir Repertório        | `repertoire_collection_songs` |            563 ms |              31.528 B |
| Abrir detalhe da música | `songs` (documento por ID)    |            106 ms |               4.635 B |
| Voltar a Shows          | `band_context`                |            151 ms |                 116 B |
| Voltar a Shows          | `show_summaries`              |          1,604 ms |               7,881 B |
| Abrir detalhe do show   | `songs` (resumo)              |            192 ms |              26.751 B |
| Abrir detalhe do show   | `shows` (documento)           |            206 ms |               4.506 B |

O refresh de Shows repetiu contexto e resumo como nova leitura de atualização,
sem consultar `/songs`; a medição de tempo é até os headers e não mede quando a
tela terminou de renderizar. Ao retornar a Shows, houve nova consulta do resumo
compatível com atualização ao recuperar foco. A instrumentação conta o corpo
entregue ao Fetch, não bytes no fio; os valores não são uma medição de tráfego
transferido. A abertura do detalhe de show exibiu estado de carregamento antes
dos dados. Esta rodada não cobriu throttling ou falha no iOS, mudança de papel,
nem uma linha de base pré-otimização comparável. O fluxo web foi inspecionado,
mas não houve sequência isolada de leituras e tempos de renderização suficiente
para fechar a comparação entre plataformas. Portanto, os itens 1.1.2, 6.2,
6.3.2 e 6.4.2 continuam abertos.

### Validação manual adicional da rota Web em 16/10/2026

Com a sessão autenticada e a tela de detalhe de show aberta, carreguei
diretamente a rota `/bands/{bandId}/repertoire` no Chrome de desenvolvimento.
A lista de repertório apareceu com conteúdo. Os eventos locais do cliente Web
registraram um grupo de quatro GETs, todos com status 200:

| Recurso                       | Tempo até headers | Corpo lido pelo Fetch |
| ----------------------------- | ----------------: | --------------------: |
| `band_context`                |            938 ms |                 116 B |
| `repertoire_collections`      |            933 ms |               2.736 B |
| `songs` (resumo)              |          1.110 ms |              26.751 B |
| `repertoire_collection_songs` |          1.107 ms |              31.528 B |

O painel Network mostrava 38 requisições e 2,1 MB transferidos no momento da
captura, acumulados desde navegações anteriores com Keep log ativo; esse total
não é atribuível somente à abertura de Repertório. A medição isolada acima vem
da instrumentação dos GETs Supabase. A rota foi aberta pela barra de endereço,
portanto esta amostra avalia carregamento da rota autenticada, não transição SPA
por toque. Não mede tempo de renderização nem bytes efetivos de rede. O fluxo de
navegação entre abas, throttling/falha no iOS e uma comparação pré-otimização
equivalente seguem necessários para concluir 1.1.2, 6.2, 6.3.2 e 6.4.2.

### Comparação parcial de contagens observadas

Os recortes antigos registraram 6 GETs ao abrir Shows, 5 no refresh e 7 no
Repertório. A medição atual do iPad registrou 2 GETs para abrir Shows e 2 para
atualizar; o Repertório fez 3 GETs com o contexto da banda já em cache. A
abertura direta da rota Web, com contexto ainda não carregado, fez 4 GETs no
total. Minhas bandas fez 1 GET no iPad; a linha de base histórica de `3 + N`
continua sendo uma estimativa do código anterior, sem trace observado daquela
tela.

| Fluxo pós-otimização                 | GETs observados | Corpo entregue ao Fetch |
| ------------------------------------ | --------------: | ----------------------: |
| Minhas bandas (iPad)                 |               1 |                   404 B |
| Shows (iPad, abertura)               |               2 |                 7.997 B |
| Shows (iPad, refresh)                |               2 |                 7.997 B |
| Repertório (iPad, contexto em cache) |               3 |                61.015 B |
| Repertório (Web, contexto sem cache) |               4 |                61.131 B |

Isso confirma redução de contagens para as sequências observadas: Shows de 6
para 2 GETs na abertura e de 5 para 2 no refresh; Repertório de 7 para 3 com
contexto em cache, ou 4 quando o contexto também precisa ser carregado. A
estimativa de Minhas bandas cai de `3 + N` para 1 GET, mas não há linha de base
observada para validar essa comparação em produção/desenvolvimento.
`responseBodyBytes` não equivale a payload de rede. Os traces anteriores não
contêm tamanhos completos comparáveis e alguns `content_length` estão vazios;
portanto esta é uma comparação de contagens, com tamanhos pós-otimização apenas
como referência do corpo no Fetch. A tarefa 6.3.2 permanece aberta até haver
uma comparação de payload de rede delimitada e equivalente.

### Validação manual adicional no Android em 16/10/2026

Usei o Samsung SM-S731B (Android 16/API 36), autenticado na Banda Demo e
conectado ao Metro 8081. A captura foi feita no console do React Native
DevTools; os eventos `[Setlist:supabase-read]` não apareceram no `logcat`.
Todas as respostas observadas nesta rodada retornaram HTTP 200. O conteúdo da
lista de Shows, detalhe do show, editor de setlist e coleções foi exibido.

| Ação identificável      | Recurso                       | Tempo até headers | Corpo lido pelo Fetch |
| ----------------------- | ----------------------------- | ----------------: | --------------------: |
| Abrir Shows             | `band_context`                |            678 ms |                 116 B |
| Abrir Shows             | `show_summaries`              |            532 ms |               7.881 B |
| Abrir detalhe do show   | `shows` (documento)           |            163 ms |               4.505 B |
| Abrir detalhe do show   | `songs` (resumo)              |            148 ms |              26.751 B |
| Abrir editor de setlist | `repertoire_collections`      |            452 ms |               2.736 B |
| Abrir editor de setlist | `songs` (resumo)              |            442 ms |              26.751 B |
| Abrir editor de setlist | `repertoire_collection_songs` |            450 ms |              31.528 B |

O detalhe apresentou uma setlist de 50 minutos e 11 músicas. O editor abriu
com os blocos e itens, e foi cancelado sem salvar. A lista de Coleções mostrou
contagens e durações; o editor de uma coleção existente também foi fechado sem
salvar. Houve leituras dos recursos de Repertório durante essa navegação, mas
como o console já continha eventos de transições anteriores, não uso esse grupo
como contagem isolada por ação. Nenhuma música, coleção ou show foi modificada.

Também tentei puxar a lista de Shows para atualizar; a tela permaneceu na
lista e o console limpo não registrou novas leituras. Portanto, esse gesto não
foi considerado um refresh concluído. A evidência anterior de retorno ao
primeiro plano continua sendo a observação Android válida de atualização por
foco: `band_context` e `show_summaries`, sem nova leitura de `/songs`. A troca
temporária do papel do membro de teste foi testada em rodada anterior e o papel
Editor foi restaurado; não foi repetida nesta sessão.

Os tempos e tamanhos da tabela são medidas do cliente: `timeToResponseHeadersMs`
é tempo até headers e `responseBodyBytes` é o corpo entregue ao Fetch, podendo
estar descomprimido. Eles não medem o tempo de renderização nem os bytes reais
na rede. A rodada não simulou lentidão/falha de dependência no Android, e não
fornece trace histórico comparável. Os fluxos normais desta sessão ampliam a
evidência Android de 6.2, mas as tarefas 1.1.2, 6.2, 6.3.2 e 6.4.2 permanecem
abertas.

### Continuação manual no iOS e Web em 16/10/2026

O Android deixou de estar disponível para esta rodada; não tentei reconectá-lo.
Continuei com o iPad Pro 13-inch (M4), autenticado na Banda Demo, e com o Chrome
Web autenticado na mesma banda. As evidências Android anteriores neste relatório
continuam válidas para a rodada em que o aparelho estava conectado, mas não
foram repetidas agora.

No iPad, a tela Banda mostrou Anderson como proprietário e
`review-setlistbr-app` como Editor. Abri Shows pelo esquema interno do app após
mais de 60 segundos desde a leitura anterior. O coletor local registrou duas
respostas HTTP 200, sem duplicar o contexto e sem buscar músicas:

| Recurso          | Tempo até headers | Corpo lido pelo Fetch |
| ---------------- | ----------------: | --------------------: |
| `band_context`   |          3.295 ms |                 116 B |
| `show_summaries` |          3.296 ms |               7.881 B |

Na captura feita após a ação, os cards de Shows já mostravam título, local,
data e duração enquanto o indicador de carregamento ainda aparecia. Portanto,
há conteúdo visível durante a atualização, mas esta rodada não marcou o instante
exato em que cada campo apareceu. O tempo de 3,3 s é até os headers, não é tempo
de servidor puro nem de renderização. Uma repetição de navegação Banda/Shows
dentro do intervalo de frescor não gerou novos eventos no coletor, consistente
com a janela de 60 s; essa repetição usou links `setlist://`, não toque nos tabs.
Capturas temporárias: `/private/tmp/setlist-ipad-band-route.png` e
`/private/tmp/setlist-ipad-shows-route.png`.

Na Web, abri a rota Shows diretamente na aba autenticada e observei o painel
Network do Chrome. A navegação exibiu a lista e teve 9 requisições no total,
cerca de 2,0 MB transferidos e 14,2 MB de recursos carregados, incluindo o
bundle e recursos locais do Metro. Entre elas estavam os GETs de
`band_context` e `show_summaries`, ambos HTTP 200. Esse total de rede é da
navegação inteira em ambiente de desenvolvimento; não representa payload
Supabase isolado. Não consegui confirmar uma atualização Web isolada por botão
na captura atual, então mantenho como evidência de refresh Web a rodada anterior
descrita acima. Captura: `/private/tmp/setlist-web-shows-direct.png`.

Para conferir o papel do membro, naveguei diretamente de Shows para
`/bands/{bandId}/band`. O Chrome mostrou “Conferindo seu acesso…” na captura
feita cerca de 5 s após a navegação; depois de mais 8 s, a tela Banda carregou
com Anderson como proprietário e `review-setlistbr-app` como Editor. Como a
navegação recarregou o documento completo, isso não representa a transição SPA
por toque entre abas. O Network estava com histórico acumulado e não permite
atribuir seus 23 requests, 4,0 MB transferidos e 28,5 MB de recursos apenas a
essa rota. O menu de administração do membro não abriu durante a tentativa;
nenhum papel foi alterado. Captura final: `/private/tmp/setlist-web-band-ready.png`.

Os cenários Web de resposta lenta e bloqueio de `band_context` foram exercitados
na rodada anterior; no iOS não concluí simulação controlada de lentidão/falha.
Não houve alteração de dados ou papel. O Android está indisponível agora, e as
evidências Android anteriores não cobrem todos os fluxos e cenários de falha.
Continuam abertas as tarefas 1.1.2, 6.2, 6.3.2 e 6.4.2: faltam baseline
histórico equivalente, falha/lentidão iOS e Android, tempos cronometrados até
conteúdo visível em todas as plataformas e payloads de rede pré/pós comparáveis.

## Encerramento aceito em 17/10/2026

O responsável considerou as evidências suficientes e autorizou finalizar a
change. Os critérios de encerramento de 1.1.2, 6.2, 6.3.2 e 6.4.2 foram
ajustados para esse aceite; as 25 tarefas anteriores já estavam verificadas.
O aceite abrange as lacunas de medição e de cobertura manual descritas neste
relatório, sem transformar cenários não executados em resultados aprovados.

As observações comprovaram Shows de 6 para 2 GETs na abertura e de 5 para 2
no refresh; Repertório de 7 para 3 com contexto em cache ou 4 com contexto
frio. Minhas bandas fez 1 GET, com referência anterior `3 + N` derivada do
código. Os testes automatizados e SQL documentam autorização, paridade dos
totais, invalidação e preservação dos documentos completos. Os fluxos manuais
e o teste Web de falha/lentidão complementam essas evidências.

Ficaram dispensados como condição de encerramento: ampliar a matriz manual de
Android/iOS, realizar novas rodadas de gravação/restauração e obter baseline
histórico equivalente de bytes/primeiro conteúdo. Não há afirmação percentual
de economia de tráfego ou de velocidade. Esses limites podem orientar uma
avaliação futura se houver necessidade operacional.

O coletor temporário de desempenho foi retirado de `requestIdentification.ts`,
junto dos testes exclusivos dessa medição. O fluxo de fetch voltou a apenas
acrescentar a identificação permanente de versão/build/plataforma, preservando
os headers do SDK. As evidências anteriores continuam válidas como histórico.

As specs de interface, resumos e refresh foram sincronizadas; a implementação
e a cobertura estão mapeadas no registro de verificação arquivado com a change.

A validação final de 17/10/2026 passou com `npm run validate`: formatação, lint,
typecheck e 115 suítes/851 testes. Cobertura: 84,12% statements, 80,98% branches,
82,00% functions e 84,99% lines. Os 7 specs e a change passaram na validação
estrita OpenSpec. Os testes de banco anteriores continuam sendo a evidência
das migrações, que não mudaram desde aquela execução. A limpeza também encerrou
o processo auxiliar de captura e removeu seu script temporário, preservando os
registros de evidência disponíveis.
