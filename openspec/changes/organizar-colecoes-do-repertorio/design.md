# Design

## Context

A motivação está em [proposal.md](./proposal.md); os comportamentos e critérios de aceitação estão em [repertoire-collections](./specs/repertoire-collections/spec.md).

O projeto usa Expo Router, React Query, repositórios de domínio e Supabase. `RepertoireScreen.tsx` já combina busca por título/artista, filtros de situação da letra e ordenação. `useSectionViewState.ts` preserva o contexto da seção por banda; os controles sobrepostos da lista têm comportamento de rolagem que deve ser mantido.

`SongDetailScreen.tsx` apresenta Tom e BPM no card de informações. `ShowBlockEditorDialog.tsx` já permite incluir várias músicas no bloco ativo como ocorrências comuns, e `ShowSetlistEditorScreen.tsx` mantém o rascunho local até salvar. A repetição de uma música no show é permitida.

O banco aplica isolamento por banda, papéis de integrante, suspensão de conta e visibilidade por moderação. O ciclo de vida vigente decide entre exclusão e arquivamento pela utilização em shows. Os novos vínculos não devem modificar essa decisão.

Os contratos de interface, navegação e atualização existem em `openspec/specs`. As definições funcionais de repertório e setlists também estão na change `definir-mvp-setlist`; esta proposta acrescenta a capacidade `repertoire-collections` sem alterar ou concluir aquela change.

## Goals / Non-Goals

**Goals:**

- Acrescentar entidades e operações próprias para coleções, reutilizando os cadastros de música e a estrutura de setlist existentes.
- Garantir operações atômicas, isolamento por banda e consultas com custos proporcionais à banda aberta.
- Reutilizar componentes, estado de consulta e proteção compartilhada de edição, preservando os fluxos já estabilizados nas três plataformas.
- Manter a experiência cotidiana simples para bandas que não adotarem coleções.

**Non-Goals:**

- Introduzir biblioteca, novo mecanismo de navegação, nova camada global de modais ou alteração geral do salvamento de shows.
- Criar execução de áudio, cópias de letras, sincronização permanente entre coleção e show ou uma fila de gravações offline.
- Implementar coleções automáticas, compartilhamento entre bandas ou criação a partir de shows/blocos nesta entrega.

## Decisions

### 1. Área subordinada ao Repertório e ações secundárias

Usar rotas sob `repertoire/collections` para lista, consulta e edição de coleções, mantendo Repertório como seção ativa. O segmento estático `collections` deve ser distinguido das rotas de detalhe de música. Retornos diretos ou sem histórico devem resolver para o Repertório da mesma banda.

Adicionar a ação nomeada **Coleções** aos controles secundários do Repertório, com tratamento neutro. A criação de música permanece como ação principal do cabeçalho. A seleção múltipla será outra ação secundária explícita, disponível apenas a proprietários e editores.

O filtro de coleção e a opção **Adicionar coleção** no setlist aparecem quando houver coleções. No detalhe da música, as etiquetas aparecem somente quando existem vínculos; o gerenciamento continua acessível como ação secundária a quem pode editar, inclusive sem vínculos.

**Alternativas consideradas:** destino próprio na barra inferior ou no drawer e aviso de primeira coleção. Essas opções aumentariam a presença do recurso para quem não deseja utilizá-lo; a área subordinada oferece um caminho nomeado e estável sem acrescentar etapa ao uso habitual.

### 2. Relação ordenada entre coleção e músicas

Propor duas tabelas:

| Tabela | Dados principais | Integridade |
| --- | --- | --- |
| `repertoire_collections` | `id`, `band_id`, `name`, `created_at`, `updated_at` | Nome não vazio, até 120 caracteres e único por banda após `lower(trim(name))` |
| `repertoire_collection_songs` | `collection_id`, `song_id`, `band_id`, `position` | Uma participação por música/coleção, posição não negativa e única dentro da coleção |

Usar chaves estrangeiras compostas com a banda para impedir associação cruzada, acrescentando os índices ou restrições de unicidade necessários às tabelas referenciadas. A ordem pertence ao vínculo e não modifica a ordem global do repertório.

A exclusão de uma coleção remove seus vínculos por cascata. A exclusão definitiva autorizada de uma música também remove somente seus vínculos. Arquivamento mantém a música e seus vínculos, com a mesma ordem relativa após restauração. Coleções vazias são válidas.

Quantidade e duração são derivadas das músicas que o solicitante pode consultar. Não armazenar cópias de título, artista, letra ou duração nos vínculos. O total usa as durações informadas; ausência total de duração recebe o mesmo tratamento de informação ausente da interface.

**Alternativas consideradas:** lista de IDs em JSON e classificação única na música. A relação própria permite várias coleções por música, ordenação independente, integridade referencial e autorização por registro.

### 3. Gravações transacionais e proteção contra concorrência

Oferecer operações de repositório para salvar coleção e ordem, acrescentar músicas, atualizar as participações de uma música e excluir coleção. No Supabase, as operações com vários registros serão RPCs transacionais; não distribuir a gravação de uma coleção entre chamadas independentes de exclusão e inclusão.

Bloquear a coleção durante alterações de composição e ordem. Para operações envolvendo várias coleções, adquirir os bloqueios em ordem estável. Toda alteração de vínculo deve atualizar `updated_at` da coleção. Editores enviarão a revisão conhecida; uma revisão desatualizada deve gerar erro recuperável antes de substituir a edição de outra pessoa. A inclusão simples ao final pode operar sobre a revisão vigente, preservando músicas e posições existentes.

Enviar mudanças explícitas de participação e a ordem das músicas consultáveis, preservando vínculos não consultáveis por moderação. Não remover um vínculo apenas porque seu cadastro ficou oculto da consulta. A reorganização das posições deve ocorrer dentro da transação, com restrição de unicidade adiável quando necessária.

Validar nomes, IDs, mesma banda, papel e disponibilidade no serviço. Reenvios de inclusão não duplicam participações; a interface bloqueia envios concorrentes e preserva o formulário em caso de falha.

**Alternativas consideradas:** gravações sequenciais no cliente e substituição irrestrita da lista de vínculos. Podem deixar dados parciais, apagar edições concorrentes ou remover participações não visíveis para o solicitante.

### 4. Autorização coerente com repertório e moderação

Aplicar RLS de leitura para integrantes ativos da banda e de escrita para proprietários/editores ativos. Incluir as restrições vigentes de suspensão. A leitura dos vínculos deve exigir que a música correspondente também esteja consultável pelas políticas de repertório.

RPCs devem repetir as verificações necessárias, especialmente se executadas com privilégios elevados no banco: sessão ativa, papel, mesma banda e visibilidade dos IDs submetidos. Dados ocultos não podem aparecer em respostas, etiquetas, contagens ou prévias. Quantidades de itens não incluíveis devem considerar somente itens consultáveis, como músicas arquivadas.

**Alternativa considerada:** confiar nas permissões dos botões ou apenas na coleção principal. A autorização precisa abranger também os vínculos e as operações em lote, independentemente do cliente usado.

### 5. Integração com domínio, repositórios e cache existentes

Acrescentar os tipos de coleção e participação em `src/domain/entities.ts`, um repositório em `src/domain/repositories.ts` e as implementações Supabase e em memória. Ajustar a injeção em `AppProviders.tsx`, os dados de demonstração e as fábricas de teste que constroem `AppRepositories`.

Criar consultas em `src/data/queries.ts` com chaves delimitadas pela banda. Consultar metadados de coleções e vínculos em lote, reaproveitando as músicas já obtidas pelo repertório para apresentar nomes, duração e situação. Evitar uma consulta de músicas por card de coleção e carregar letras somente pelos fluxos que já precisam delas.

As mutações invalidam lista, detalhe e participações da banda afetada. Mudanças em músicas atualizam as informações derivadas e os vínculos afetados. Incluir as novas chaves nas limpezas de cache e nas políticas existentes de sessão, reconexão e retomada do app; os dados da banda anterior não devem aparecer durante troca de contexto.

**Alternativa considerada:** estado global paralelo com objetos completos de música dentro de cada coleção. Duplicaria dados, exigiria sincronizações adicionais e poderia conservar conteúdo ocultado ou metadados antigos.

### 6. Escolha de músicas independente da consulta

Extrair ou reutilizar a lógica de busca, filtros e ordenação do Repertório no seletor de coleção. Manter o conjunto de IDs escolhidos separado dos resultados atuais. A quantidade sempre considera todas as escolhas, e a revisão permite remover músicas que ficaram fora da consulta atual.

**Selecionar os resultados** informa a quantidade e atua somente sobre os resultados atuais. As músicas adicionadas em cada confirmação seguem a ordem exibida naquele momento; as já presentes mantêm sua posição. A revisão da coleção permite reordenar antes de salvar, com gesto de arrastar e controles acessíveis de subir/descer.

No modo de seleção do Repertório, preservar os critérios de consulta e trocar explicitamente o comportamento do toque para marcar. Criar coleção abre o editor com as escolhidas. Acrescentar a uma existente usa uma operação atômica de inclusão ao final, sem substituir a composição existente. Cancelar a seleção não grava.

**Alternativa considerada:** derivar as músicas escolhidas dos cards atualmente renderizados ou aplicar automaticamente filtros como composição. Isso perderia escolhas entre consultas e tornaria mudanças de filtro destrutivas ou ambíguas.

### 7. Filtro por coleção como dimensão adicional

Manter a dimensão de coleção independente da situação da letra: `all`, `unassigned` ou ID de uma coleção. A consulta resulta da interseção entre essa dimensão, busca e situação, com a ordenação habitual do Repertório. Uma música é apresentada uma vez.

Adicionar o critério ao estado de consulta por banda em `useSectionViewState.ts`, seguindo o padrão existente de recuperação ao montar a seção. A etiqueta no detalhe da música deve aplicar o ID de coleção ao retornar ao Repertório e deixar o filtro identificável nos controles.

Somente uma atualização bem-sucedida pode concluir que a coleção filtrada foi excluída. Nesse caso, remover o critério de coleção e manter os demais. Uma falha de rede não deve apagar o filtro nem os últimos resultados válidos.

**Alternativa considerada:** seleção de várias coleções com operadores de união/interseção. A escolha de uma coleção por vez cobre o uso inicial com menos decisões e mantém o significado dos resultados claro.

### 8. Participações no detalhe da música

Apresentar etiquetas com nomes de coleções abaixo de Tom/BPM no card existente, permitindo quebra de linha e mantendo a prioridade dos dados musicais. Cada etiqueta possui destino e rótulo acessível.

Usar uma ação secundária para editar participações, com marcações, confirmação explícita e proteção de alterações não salvas. A operação aplica apenas o conjunto de mudanças daquela música: novas participações entram no final das coleções, e a remoção não muda a ordem relativa de outras músicas.

**Alternativa considerada:** manter uma seção permanente com mensagem de ausência e botão de adesão. As etiquetas condicionais mostram a organização existente e deixam o detalhe habitual leve para quem não utiliza o recurso.

### 9. Inclusão no setlist como lote local de ocorrências

Integrar **Adicionar coleção** à escolha de tipos de inclusão em `ShowBlockEditorDialog.tsx`. A consulta abre uma prévia com bloco ativo, músicas elegíveis na ordem salva, quantidade, duração estimada, músicas arquivadas consultáveis que ficarão de fora e indicação de repetições no show.

Revalidar a coleção e as músicas antes de confirmar, com conexão e acesso vigentes. Se a composição elegível mudar, atualizar a prévia e permitir nova confirmação. Uma coleção sem músicas elegíveis não oferece confirmação de inclusão.

Confirmar cria novas ocorrências de música em uma única atualização do estado local, ao final do bloco ativo. Usar identificadores locais próprios para cada ocorrência; não persistir dependência com o ID da coleção. Preservar outros blocos, observações, separadores e itens de planejamento. A gravação continua pelo botão de salvar do editor existente.

A integração deve verificar também a exclusão de músicas arquivadas nas opções de inclusão atuais: hoje o editor recebe `useSongs(bandId, true)`. A proteção deve ficar na seleção de novas músicas, mantendo a leitura dos itens já presentes em shows.

**Alternativas consideradas:** bloco vinculado à coleção ou gravação imediata no show. A cópia apenas da composição para o rascunho permite reorganizar cada show, descartar a inclusão e manter o salvamento habitual.

### 10. Reutilizar os padrões de edição e apresentação estabilizados

Preferir telas para consulta e edição de coleção. Para seletores ou confirmações, reutilizar os componentes de diálogo e `useUnsavedChangesGuard`/`UnsavedChangesPrompt`, respeitando o contexto de apresentação existente. Não criar novo controle global de camadas nem empilhar modais nativos para contornar posicionamento.

Manter alvos interativos, marcações, foco Web, área segura, fonte ampliada e redução de movimento. Na implementação, conferir que o novo controle Coleções e o modo de seleção cabem na toolbar e não alteram a posição da área de rolagem nem a lógica de ocultação dos controles.

**Alternativa considerada:** construir um editor como nova camada modal sobre o editor de setlist ou acrescentar lógica global de retorno. Isso amplia a superfície de regressão de foco, gestos e bloqueio de toques que já exigiram correções neste projeto.

## Risks / Trade-offs

- Escolhas se perderem ao mudar busca ou filtro → Manter IDs escolhidos fora da consulta e testar mudanças sucessivas antes da confirmação.
- Duas pessoas alterarem simultaneamente a ordem → Bloqueios transacionais, revisão de edição e mensagem recuperável sem sobrescrita silenciosa.
- Vínculos conservarem dados ocultados ou vazarem entre bandas → Políticas sobre vínculos, verificações nos RPCs, respostas derivadas somente de músicas consultáveis e invalidação do cache afetado.
- Edição remover participações que não estão visíveis → Gravar diferenças explícitas e preservar vínculos não consultáveis no serviço.
- Inclusão em lote modificar outros itens ou repetir um envio → Atualização única do rascunho, bloqueio transitório de confirmação e testes com blocos e tipos de item misturados.
- Novo controle deslocar a lista ou tornar o Repertório mais carregado → Ação neutra na toolbar existente e conferência em tela compacta, com e sem coleções.
- Diálogo de descarte aparecer atrás do editor ou bloquear toques no iOS → Reutilizar a apresentação compartilhada e executar regressão de abrir, editar, descartar e navegar repetidamente.
- Coleção muito extensa aumentar consultas ou tornar a revisão difícil → Buscar metadados e vínculos em lote, virtualizar listas quando aplicável e manter quantidade/revisão acessíveis.
- Total de duração incompleto → Somar somente valores informados e explicitar ausência de duração, sem tratar música desconhecida como zero confirmado.

## Migration Plan

1. Criar migração aditiva com tabelas, restrições, índices, RLS e RPCs; nenhum dado existente precisa de conversão ou coleção automática.
2. Validar integridade e autorização no ambiente local/desenvolvimento, incluindo contas suspensas, conteúdo oculto, associação entre bandas, concorrência e cascatas de exclusão.
3. Integrar as consultas e telas, validando primeiro uma banda sem coleções e depois coleções compartilhadas entre diferentes papéis.
4. Aplicar a migração no ambiente de destino antes de distribuir o cliente que usa o recurso, seguindo o processo vigente de publicação e suas autorizações.
5. Se for necessário reverter a interface, manter as tabelas e os dados de coleções; o cliente anterior continua funcionando sem o recurso. Não excluir dados criados por usuários como procedimento de retorno.

Esta change contém planejamento. A criação dos arquivos não aplica migração, altera aplicação nem publica nova versão.
