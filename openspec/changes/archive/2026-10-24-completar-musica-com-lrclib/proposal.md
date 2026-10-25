# Proposal

## Why

O cadastro e a edição de músicas exigem preencher manualmente informações e letras que podem estar disponíveis na LRCLIB. Uma ação contextual pode completar o rascunho, aproveitar tempos já existentes e reduzir esse trabalho sem substituir o conteúdo preparado pela banda ou acrescentar uma sequência de telas.

## What Changes

- Incluir um botão compacto com ícone de varinha no lado esquerdo do rodapé do formulário e manter Cancelar e Salvar agrupados à direita, nas telas Nova música e Editar música, com identificação acessível “Completar música”.
- Reutilizar o desenho da roda de atualização atual como indicador da pesquisa, preservando o tamanho do botão e a consistência visual entre plataformas.
- Consultar a API oficial da LRCLIB por ação explícita, usando título e artista preenchidos e classificando os candidatos também pela proximidade da duração informada.
- Carregar o Application ID público opcional por `EXPO_PUBLIC_LRCLIB_APP_ID` e enviá-lo no cabeçalho `Lrclib-App-Id` somente quando preenchido, em cada tentativa. Sem valor, manter a busca sem esse cabeçalho, com configuração equivalente no desenvolvimento local, EAS e publicação web.
- Aplicar diretamente um candidato inequívoco ou apresentar alternativas distintas em uma única lista simples, com título, artista, álbum, duração e indicação de letra com tempos.
- Ao escolher ou aceitar uma correspondência inequívoca, atualizar título e artista conforme os metadados do resultado. Preservar a capitalização mista da fonte e aplicar capitalização de título pt-BR somente quando as letras vierem uniformemente em minúsculas ou maiúsculas, ignorando a inicial; preservar também siglas e nomes curtos claramente estilizados. Completar duração e letra somente quando vazias, preferir LRC consistente entre gravações equivalentes e preservar tom, BPM, YouTube e observações.
- Permitir uma nova busca explícita após a pessoa editar o rascunho, usando os novos valores de título, artista e duração.
- Quando a duração divergir, oferecer no mesmo painel usar a duração da gravação e seus tempos válidos ou manter a duração informada e importar somente o texto. Adotar inicialmente tolerância de dois segundos para arredondamentos.
- Organizar a letra sincronizada em blocos sem nome, aproveitando separações explícitas do LRC e parágrafos do texto simples quando toda a sequência corresponder. Na ausência dessas separações, usar pausas proporcionalmente maiores entre linhas para sugerir quebras visuais, preservando texto e tempos.
- Permitir marcar manualmente uma música como instrumental e reconhecer essa condição somente quando um resultado escolhido a indicar explicitamente. Músicas instrumentais não entram nas pendências de letra nem nos avisos de prontidão do show; a ausência de letra, sozinha, não determina que uma música seja instrumental.
- Mostrar em um popup único o feedback compacto com frases musicais bem-humoradas e equivalentes, sorteadas por etapa e tentativa, sem nomes do fornecedor ou detalhes técnicos na interface; usar o mesmo popup para resultados e decisão de duração, executar até três tentativas totais para HTTP 503 e permitir nova tentativa manual após esgotá-las, preservando o rascunho.
- Manter salvamento explícito, cancelamento e proteção de alterações não salvas existentes; não acrescentar botão Desfazer.
- Preservar origem da letra importada, permissões, aceite do termo de conteúdo, moderação e isolamento por banda.

## Capabilities

### New Capabilities

- `song-enrichment`: preenchimento assistido do rascunho de uma música por fonte externa, seleção de gravação, decisão sobre duração e tempos, feedback e recuperação de falhas da LRCLIB.

### Modified Capabilities

Nenhuma especificação canônica existente precisa mudar seus requisitos. `application-ui`, `shared-data-refresh` e `content-moderation` continuam aplicáveis. A restrição a entrada manual registrada na change ainda ativa `definir-mvp-setlist` precisa ser conciliada como evolução de escopo antes da integração desta funcionalidade; não há hoje uma spec canônica `lyric-timing` ou `song-repertoire` para declarar como modificada.

## Impact

- Interface e estado local de `src/features/repertoire/SongEditorScreen.tsx`, ícones compartilhados e painel de seleção responsivo.
- Novo adaptador HTTP da LRCLIB e funções puras para correspondência, agrupamento, comparação de duração, leitura de LRC e preenchimento do rascunho.
- Modelo `LyricDocument`, serialização em `songMutations.ts` e leitura em `songRepository.ts` para metadados opcionais de origem; o estado instrumental é persistido diretamente em `lyric_status`.
- Migrations SQL para incluir o valor `instrumental` no enum e ajustar a constraint de consistência do status.
- Consumo de `https://lrclib.net/api/search`, com identificação do aplicativo e tratamento de indisponibilidade; sem SDK nativo ou conta Genius/LRCLIB do usuário.
- Configuração nos modelos de ambiente, ambientes EAS e workflow de Pages, sem identificador fixo no adaptador; autorização pública da integração registrada como referência técnica no design.
- A importação não inclui reprodução sincronizada, editor de tempos, publicação de conteúdo na LRCLIB nem licenciamento de letras. A permissão de acesso à API não substitui os direitos necessários sobre o conteúdo.
