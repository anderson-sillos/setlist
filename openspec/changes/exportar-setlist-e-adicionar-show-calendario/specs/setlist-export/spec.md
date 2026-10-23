# Spec Delta

## Purpose

Permitir que integrantes levem o roteiro de um show para impressão e compartilhamento por arquivo, preservando identificação, ordem e metadados escolhidos, sem exportar letras.

## ADDED Requirements

### Requirement: Exportação disponível a integrantes autorizados

O sistema SHALL oferecer `Exportar setlist` nos detalhes de um show consultável por Owner, Editor ou Member e SHALL manter as restrições existentes de edição e de acesso à banda.

#### Scenario: Integrante sem permissão de edição exporta
- **WHEN** um Member abre um show autorizado e os dados necessários estão disponíveis
- **THEN** pode iniciar a exportação sem receber ações de alteração do show reservadas a Owner ou Editor

#### Scenario: Acesso tornou-se indisponível
- **WHEN** o aplicativo identifica término da sessão ou perda de acesso durante a preparação
- **THEN** encerra a prévia protegida e impede novas gerações ou entregas a partir daquele contexto

### Requirement: Três formatos sem letras

O sistema SHALL oferecer PDF, TXT em UTF-8 e PNG na primeira entrega em Web, iOS e Android. Os arquivos e suas prévias MUST NOT incluir letras, tempos de linhas de letras, áudio ou vídeo.

#### Scenario: Escolher o formato
- **WHEN** a pessoa inicia uma exportação
- **THEN** PDF aparece como destino inicialmente selecionado e Texto (TXT) e Imagem (PNG) estão disponíveis

#### Scenario: Música possui letra cadastrada
- **WHEN** uma música da setlist possui letra estática ou sincronizada
- **THEN** o documento inclui somente seus metadados selecionados e não oferece opção para acrescentar a letra

#### Scenario: Preservar caracteres e arquivos reais
- **WHEN** o roteiro contém acentos, quebras de linha e títulos extensos
- **THEN** os três formatos preservam o texto legível e usam conteúdo compatível com a extensão e o tipo de arquivo escolhidos

### Requirement: Identificação do roteiro exportado

O documento SHALL apresentar nome da banda, nome do show, data e horário de início no formato usado pelo Setlist, local e situação do show. MUST NOT exibir um campo de fuso horário. A data e hora de geração SHALL aparecer sem rótulo, alinhadas à direita no rodapé de cada página, no formato `dd/mm/yyyy HH:MM`; no TXT, SHALL aparecer como última linha. A numeração e a data de geração SHALL permanecer identificáveis em documentos de várias páginas.

#### Scenario: Exportar um rascunho ou show cancelado
- **WHEN** a pessoa exporta um show em Rascunho ou Cancelado
- **THEN** o documento identifica explicitamente a situação sem apresentá-la como um show Pronto

#### Scenario: Aparelho usa outro fuso
- **WHEN** o fuso do aparelho difere do fuso de apresentação do Setlist
- **THEN** o documento mantém a data e o horário de referência apresentados pelo Setlist, sem imprimir um campo que identifique o fuso

#### Scenario: Data de geração no rodapé
- **WHEN** o roteiro é gerado em PDF, Imagem ou enviado à impressão
- **THEN** cada página mostra a data e hora de geração alinhadas à direita no rodapé, sem o texto `Preparado em` e no formato `dd/mm/yyyy HH:MM`

#### Scenario: Data de geração no TXT
- **WHEN** o roteiro é gerado como Texto
- **THEN** a data e hora no formato `dd/mm/yyyy HH:MM` aparecem como última linha, sem rótulo

### Requirement: Preservação de blocos e ocorrências

A exportação SHALL preservar blocos, ordem salva, ocorrências repetidas e separadores; SHALL numerar continuamente apenas as músicas; e SHALL permitir incluir ou retirar as anotações de planejamento sem alterar a ordem das músicas.

#### Scenario: Música aparece em mais de um ponto
- **WHEN** uma música é usada em dois itens da setlist
- **THEN** as duas ocorrências permanecem em suas posições, com números próprios e suas respectivas observações quando selecionadas

#### Scenario: Omitir planejamento
- **WHEN** a pessoa desmarca a inclusão das anotações de planejamento
- **THEN** essas anotações deixam de aparecer no documento sem reordenar músicas ou blocos

#### Scenario: Referência sem música consultável
- **WHEN** um item salvo referencia uma música cujo conteúdo não está disponível na leitura autorizada
- **THEN** a posição é preservada como `Música indisponível`, sem recuperar metadados ocultados nem expor identificadores internos

#### Scenario: Setlist vazia
- **WHEN** o show não possui músicas
- **THEN** a exportação continua disponível com a identificação do show, a indicação de ausência de músicas e os itens de planejamento selecionados que existirem

### Requirement: Prévia e escolha de campos

O sistema SHALL apresentar prévia antes da entrega e controles para artista, tom, BPM, durações, planejamento, observações gerais do show e observações de cada ocorrência de música. A seleção SHALL ser aplicada igualmente aos três formatos. A prévia SHALL começar ajustada à largura disponível e oferecer controles para reduzir, ampliar e ajustar à largura; ampliar a prévia SHALL alterar apenas sua visualização, sem modificar o tamanho A4 nem os arquivos gerados.

#### Scenario: Abrir a prévia inicial
- **WHEN** a pessoa abre a preparação de uma exportação
- **THEN** artista, tom, durações e planejamento começam selecionados; BPM e os dois grupos de observações começam desmarcados
- **AND** a identificação do show e os títulos das músicas permanecem presentes

#### Scenario: Alterar uma seleção
- **WHEN** a pessoa inclui observações ou retira um campo opcional
- **THEN** a prévia e os arquivos gerados refletem a mesma escolha, incluindo cabeçalhos, totais ou anotações relacionados ao campo

#### Scenario: Ajustar a escala da prévia
- **WHEN** a pessoa usa os controles de reduzir ou ampliar
- **THEN** a página inteira muda de escala em incrementos de 25 pontos percentuais, incluindo texto, margens e espaçamento
- **AND** o controle de ajuste à largura retorna a página à maior escala que cabe na área disponível
- **AND** uma página ampliada pode ser percorrida horizontalmente sem cortar o conteúdo

#### Scenario: Paginar com escala personalizada
- **WHEN** a pessoa navega para a página anterior ou seguinte
- **THEN** a nova página mantém a escala de prévia selecionada

#### Scenario: Gerar arquivo após ampliar a prévia
- **WHEN** a pessoa amplia ou reduz a prévia e gera um arquivo
- **THEN** PDF e Imagem mantêm o layout físico A4 e o conteúdo definido pelas opções, independentemente da escala de visualização

### Requirement: Durações coerentes com o show

Os tempos exportados SHALL seguir a soma vigente de cada ocorrência de música consultável e planejamento com duração, ignorando separadores e valores ausentes. Duração ausente SHALL permanecer distinta de zero. A seleção de campos MUST NOT mudar a duração estimada do show salvo.

#### Scenario: Valores ausentes e zero
- **WHEN** nenhuma duração é conhecida
- **THEN** o total é apresentado como não informado, se durações estiverem selecionadas
- **AND** uma duração conhecida de zero permanece zero e não é convertida em ausência

#### Scenario: Ocultar as durações
- **WHEN** a pessoa desmarca durações
- **THEN** tempos individuais e totais são omitidos dos arquivos e da prévia

#### Scenario: Ocultar planejamento e manter durações
- **WHEN** planejamento está desmarcado e durações estão selecionadas
- **THEN** o total continua identificado como estimativa do show completo e sua composição distingue músicas e planejamento, mesmo que as descrições de planejamento estejam ocultas

### Requirement: Paginação legível para impressão e imagem

PDF e PNG SHALL usar fundo branco, texto contrastante, cabeçalho de continuação e páginas numeradas. O PDF SHALL oferecer páginas A4; PNG SHALL gerar uma imagem por página quando necessário, preservando todo o conteúdo sem depender da área visível da tela.

#### Scenario: Roteiro ultrapassa uma página
- **WHEN** os itens não cabem na página na tipografia definida
- **THEN** são distribuídos por novas páginas sem diminuir progressivamente a fonte, cortar itens ou perder músicas

#### Scenario: Item muito extenso
- **WHEN** uma observação ou outro texto ocupa mais de uma página
- **THEN** o documento permite sua continuação identificada, preservando todo o texto e sem deixar um título de bloco isolado do primeiro item

#### Scenario: PNG possui várias páginas
- **WHEN** são geradas várias imagens
- **THEN** a interface apresenta a quantidade e a ordem das páginas e permite acessar e entregar cada imagem, sem afirmar que uma página isolada representa o conjunto completo

### Requirement: Escolher destino e entregar o roteiro

O sistema SHALL oferecer PDF, Texto, Imagem e Imprimir como destinos da preparação, com ícones distintos para PDF e Texto. A escolha de destino SHALL aparecer depois da pré-visualização, agrupada com o botão de geração; Imagem SHALL produzir arquivos PNG. Depois da geração, SHALL iniciar automaticamente o seletor de compartilhamento nos aplicativos móveis compatíveis, o compartilhamento ou download na Web, ou a impressão quando esse destino for escolhido. Na Web, compartilhar SHALL depender da disponibilidade real daquele arquivo; quando não estiver disponível ou o navegador bloquear a abertura automática, SHALL iniciar o download automaticamente.

#### Scenario: Compartilhar no aplicativo móvel
- **WHEN** a pessoa gera um arquivo com destino PDF, Texto ou Imagem
- **THEN** o sistema abre automaticamente o seletor de destino com o arquivo e seu tipo corretos

#### Scenario: Navegador compartilha o arquivo
- **WHEN** a pessoa gera um arquivo em um navegador que permite compartilhar aquele arquivo
- **THEN** o sistema abre o seletor de compartilhamento após a geração

#### Scenario: Navegador não compartilha ou bloqueia a abertura
- **WHEN** a pessoa gera um arquivo em um navegador sem suporte ao compartilhamento ou que bloqueia a abertura automática do seletor
- **THEN** o sistema inicia o download do arquivo e informa qual ação ocorreu

#### Scenario: Imprimir ou baixar PDF na Web
- **WHEN** a pessoa escolhe Imprimir e gera o documento
- **THEN** o sistema apresenta somente o roteiro preparado na janela de impressão, sem imprimir a navegação do aplicativo
- **AND** a janela é preparada durante o clique de geração para evitar bloqueio de pop-ups

#### Scenario: Cancelar compartilhamento
- **WHEN** a pessoa fecha o seletor sem concluir e a plataforma informa cancelamento
- **THEN** o fluxo retorna à preparação sem apresentar falha ou afirmar que o destinatário recebeu o arquivo

### Requirement: Cópia consistente dos dados carregados

A prévia e seus arquivos SHALL usar a mesma cópia de dados salvos e autorizados. O sistema SHALL aguardar as dependências necessárias e MUST NOT interpretar carregamento ou falha como uma setlist vazia. Atualizações recebidas durante a prévia SHALL ser aplicadas mediante ação explícita de atualizar a prévia.

#### Scenario: Repertório ainda está carregando
- **WHEN** os blocos do show chegaram, mas os metadados necessários ainda estão pendentes
- **THEN** a geração aguarda essas informações e oferece recuperação se ocorrer falha

#### Scenario: Dados mudam durante a prévia
- **WHEN** uma atualização do show ou de uma música consultável chega durante a preparação
- **THEN** o documento em preparação permanece estável e a pessoa pode atualizar a prévia antes de gerar novamente

#### Scenario: Exportar após editar sem salvar
- **WHEN** existem alterações locais não salvas em um editor
- **THEN** a exportação pelos detalhes usa somente a versão salva e não confirma nem descarta a edição silenciosamente

### Requirement: Resultado verificável e recuperação

O sistema SHALL distinguir arquivo gerado, seletor aberto, cancelamento e falha; SHALL preservar as escolhas para nova tentativa; e SHALL tratar os arquivos como cópias locais, com remoção dos temporários quando não estiverem em uso. A entrega MUST NOT publicar o conteúdo automaticamente em um serviço externo.

#### Scenario: Cancelar compartilhamento
- **WHEN** a pessoa fecha o seletor sem concluir e a plataforma informa cancelamento
- **THEN** o fluxo retorna à preparação sem apresentar falha ou afirmar que o destinatário recebeu o arquivo

#### Scenario: Geração ou entrega falha
- **WHEN** não é possível produzir ou entregar o arquivo
- **THEN** a mensagem identifica a etapa e permite tentar novamente ou usar outra forma de entrega sem alterar o show

#### Scenario: Operação em andamento
- **WHEN** um arquivo está sendo gerado
- **THEN** o fluxo indica progresso, impede solicitações duplicadas e não apresenta sucesso antes de existir um resultado válido
