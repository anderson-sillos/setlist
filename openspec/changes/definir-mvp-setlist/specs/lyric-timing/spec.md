## Purpose

Definir a criação de letras estruturadas e a marcação manual do início de cada linha usando um vídeo visível do YouTube como referência temporal.

## ADDED Requirements

### Requirement: Letra estruturada em blocos e linhas
O sistema SHALL permitir que Owner ou Editor digite ou cole uma letra, organize-a em blocos e linhas ordenados e reorganize esses elementos sem perder sua identidade.

#### Scenario: Criar letra com blocos
- **WHEN** um Owner ou Editor divide uma letra em versos, refrões ou outros blocos
- **THEN** o sistema preserva a ordem dos blocos e das linhas ao salvar e reabrir a música

#### Scenario: Reordenar conteúdo
- **WHEN** um Owner ou Editor move um bloco ou uma linha
- **THEN** o sistema atualiza a ordem e mantém associados os tempos das linhas movidas

### Requirement: Estados de preparação da letra
O sistema SHALL classificar cada música como Sem letra, Letra estática, Sincronização incompleta ou Sincronizada conforme a presença de texto e tempos.

#### Scenario: Música sem texto de letra
- **WHEN** uma música não possui nenhuma linha com texto
- **THEN** o sistema apresenta o estado Sem letra

#### Scenario: Letra sem marcações
- **WHEN** a música possui linhas de texto e nenhuma delas possui tempo inicial
- **THEN** o sistema apresenta o estado Letra estática

#### Scenario: Parte da letra está marcada
- **WHEN** apenas parte das linhas com texto possui tempo inicial válido
- **THEN** o sistema apresenta o estado Sincronização incompleta

#### Scenario: Todas as linhas estão marcadas
- **WHEN** todas as linhas com texto possuem tempos iniciais válidos e ordenados
- **THEN** o sistema apresenta o estado Sincronizada

### Requirement: Player de referência visível
O sistema MUST manter o player incorporado do YouTube visível e utilizável enquanto a pessoa realiza a sincronização em Android, iOS ou web.

#### Scenario: Abrir referência válida
- **WHEN** um Owner ou Editor abre uma música com vídeo do YouTube disponível
- **THEN** o sistema mostra o player com seus controles e permite acompanhar o tempo atual

#### Scenario: Referência indisponível
- **WHEN** o vídeo não pode ser incorporado, foi removido ou está bloqueado
- **THEN** o sistema informa a indisponibilidade e mantém disponíveis a edição do texto e a correção manual dos tempos

### Requirement: Marcação manual do início das linhas
O sistema SHALL permitir que Owner ou Editor associe o tempo atual do vídeo ao início de uma linha e corrija manualmente qualquer marcação.

#### Scenario: Marcar linha durante reprodução
- **WHEN** o editor toca em uma linha enquanto o vídeo está em reprodução
- **THEN** o sistema registra para essa linha o tempo atual observado em milissegundos

#### Scenario: Corrigir uma marcação
- **WHEN** o editor altera manualmente o tempo inicial de uma linha
- **THEN** o sistema valida e salva o novo valor como parte da letra vigente

#### Scenario: Salvar tempos fora de ordem
- **WHEN** o editor tenta concluir uma letra com tempos que recuam entre linhas sucessivas
- **THEN** o sistema identifica a inconsistência e mantém a música como Sincronização incompleta até a correção

### Requirement: Gravação integral da letra vigente
O sistema SHALL salvar texto, blocos, linhas e tempos como uma única atualização da letra vigente, sem produzir versões parciais visíveis.

#### Scenario: Falha ao salvar a letra
- **WHEN** ocorre uma falha antes da conclusão da gravação
- **THEN** o sistema preserva integralmente a letra vigente anterior e informa que a alteração não foi salva

### Requirement: Restrições do conteúdo de referência
O sistema MUST armazenar somente a referência do vídeo, sua duração quando necessária e os tempos das linhas e MUST NOT baixar, extrair, ocultar ou reproduzir em segundo plano o áudio ou vídeo do YouTube.

#### Scenario: Usar vídeo para sincronização
- **WHEN** um editor reproduz a referência durante a preparação
- **THEN** o sistema utiliza o player oficial visível sem criar arquivo local de áudio ou vídeo

#### Scenario: Encerrar ou ocultar a tela do player
- **WHEN** a tela que contém o player deixa de estar visível
- **THEN** o sistema não mantém a reprodução do YouTube em segundo plano

### Requirement: Fontes de letras no piloto
O sistema SHALL permitir entrada manual de letras declaradas como autorais, em domínio público ou autorizadas e MUST NOT oferecer busca ou importação automática de sites de letras.

#### Scenario: Adicionar letra manualmente
- **WHEN** um Owner ou Editor com termo vigente aceito digita ou cola uma letra pela qual declara responsabilidade
- **THEN** o sistema permite salvar o conteúdo na banda
