# timed-lyrics-display Specification

## Purpose

Permitir acompanhar uma letra sincronizada em tela cheia pelo tempo local, com destaque legível, navegação temporal e centralização que respeita a leitura manual nas três plataformas.

## Requirements

### Requirement: Acompanhamento disponível na letra em tela cheia

O sistema SHALL oferecer acompanhamento temporal na letra em tela cheia quando a música possuir sincronização completa com tempos válidos e ordenados. Os demais estados SHALL preservar leitura manual e a apresentação existente de blocos, linhas, separadores e indicação instrumental, sem sugerir acompanhamento sincronizado.

#### Scenario: Consultar música sincronizada

- **WHEN** um integrante com autorização de leitura abre em tela cheia uma música com sincronização completa
- **THEN** a letra e os controles temporais ficam disponíveis sem exigir permissão de edição ou um novo aceite de termo para consultar

#### Scenario: Consultar letra estática ou incompleta

- **WHEN** a letra não possui tempos ou possui sincronização incompleta
- **THEN** ela permanece disponível para leitura manual, sem destaque temporal, barra de busca temporal ou salto por linha

#### Scenario: Consultar música sem letra ou instrumental

- **WHEN** a música não possui letra textual utilizável ou está marcada como instrumental
- **THEN** a tela mantém a indicação correspondente sem inventar versos ou uma sequência sincronizada

### Requirement: Cronômetro local com início explícito

O sistema SHALL abrir o acompanhamento em zero e parado e oferecer Iniciar, Pausar, Retomar e Reiniciar. Reiniciar SHALL retornar ao início sem iniciar automaticamente. Cada aparelho SHALL manter seu próprio tempo, sem alterar a música cadastrada ou o estado de outras sessões.

#### Scenario: Iniciar e retomar

- **WHEN** a pessoa inicia, pausa e depois retoma o cronômetro
- **THEN** o tempo avança somente durante a execução e a retomada continua do valor pausado

#### Scenario: Reiniciar uma execução

- **WHEN** a pessoa aciona Reiniciar
- **THEN** o tempo volta a zero, o acompanhamento volta ao início e permanece parado até outra ação explícita de início

#### Scenario: Usar a mesma música em dois aparelhos

- **WHEN** duas pessoas abrem a mesma música e uma delas altera seu tempo
- **THEN** o cronômetro da outra pessoa e os dados compartilhados permanecem iguais

### Requirement: Posicionamento temporal sem alterar o estado de execução

O sistema SHALL permitir avançar e voltar cinco segundos e posicionar o tempo por barra ou linha, preservando execução ou pausa. Antes do primeiro início, posicionar SHALL manter o cronômetro parado. Ajustes SHALL respeitar zero e a duração total quando válida; valores inválidos MUST NOT corromper o relógio.

#### Scenario: Corrigir o tempo enquanto executa

- **WHEN** o cronômetro está executando e a pessoa avança ou volta cinco segundos
- **THEN** o tempo e o destaque mudam imediatamente e a contagem continua a partir da nova posição

#### Scenario: Posicionar antes do início ou durante pausa

- **WHEN** a pessoa escolhe uma posição com o cronômetro ainda não iniciado ou pausado
- **THEN** o tempo e o destaque correspondem à escolha sem começar a contagem automaticamente

#### Scenario: Ajustar além dos limites

- **WHEN** um ajuste solicitado fica abaixo de zero ou acima da duração total válida
- **THEN** o tempo escolhido é limitado à extremidade correspondente, sem valores negativos ou fora do intervalo navegável

### Requirement: Destaque das linhas do instante atual

Na variante de tela cheia sincronizada, o sistema SHALL apresentar os versos e nomes de blocos inativos com 65% de opacidade e a linha ou grupo atual com 100% de opacidade e negrito. Todas as linhas SHALL manter a mesma cor normal do texto e SHALL NOT receber fundo colorido de destaque. O destaque SHALL acrescentar respiro vertical antes e depois da linha sem aumentar o tamanho da fonte ou a altura da linha. Ao mudar o instante, as linhas anteriores SHALL retornar a 65% de opacidade. Títulos, linhas vazias e separadores MUST NOT ser tratados como versos ativos.

#### Scenario: Alcançar o próximo verso

- **WHEN** o tempo alcança o início de uma linha ou grupo de linhas
- **THEN** o novo trecho recebe opacidade total e negrito, preservando a cor normal, enquanto o trecho anterior retorna a 65% de opacidade

#### Scenario: Várias linhas começam juntas

- **WHEN** duas ou mais linhas possuem o mesmo horário inicial
- **THEN** todas ficam destacadas no mesmo intervalo e a navegação preserva a ordem textual

#### Scenario: Aguardar a primeira marcação

- **WHEN** o tempo ainda não alcançou a primeira linha
- **THEN** nenhuma linha é apresentada como atual

#### Scenario: Chegar ao fim conhecido ou desconhecido

- **WHEN** a última linha é alcançada
- **THEN** ela permanece ativa até a duração total válida, quando conhecida, e deixa de ser destacada ao alcançar esse fim
- **AND** sem duração total válida, ela permanece como último trecho conhecido, sem inventar um horário de término

#### Scenario: Destacar sem aumentar o tamanho do texto

- **WHEN** uma linha passa a ser o trecho atual
- **THEN** opacidade total e negrito indicam o destaque sem alterar a cor, o fundo, o tamanho da fonte ou a altura da linha
- **AND** há respiro vertical adicional antes e depois da linha atual
- **AND** a renderização mantém a quebra de linha determinada pelo texto e pelas condições atuais de largura e acessibilidade

### Requirement: Centralização vertical com destaque legível

Durante o acompanhamento automático, o sistema SHALL manter preferencialmente o centro do trecho ativo no centro vertical da área útil da letra, descontando cabeçalho, controles e áreas seguras. A posição SHALL considerar a altura após o destaque, as quebras de texto e a fonte do sistema, com espaço nas extremidades para centralizar primeira e última linhas.

#### Scenario: Destacar uma linha com quebra de texto

- **WHEN** a fonte maior faz a linha ocupar várias linhas visuais
- **THEN** a centralização considera a altura renderizada completa e mantém o trecho legível, sem cortar suas bordas

#### Scenario: Centralizar a linha atual na Web

- **WHEN** a posição de uma linha sincronizada é medida no navegador
- **THEN** o cálculo da rolagem usa sua posição relativa ao conteúdo rolável, mantendo o trecho atual centralizado ao avançar o cronômetro

#### Scenario: Centralizar primeira e última linhas

- **WHEN** o trecho ativo está no início ou no final do documento
- **THEN** os espaços de início e fim permitem seu alinhamento central sem exigir conteúdo fictício na letra

#### Scenario: Trecho maior que a área útil

- **WHEN** o trecho ativo é mais alto que a área visível
- **THEN** o sistema prioriza a leitura de seu início e permite percorrê-lo sem oscilar entre posições de rolagem

#### Scenario: Redimensionar a tela

- **WHEN** orientação, janela, tamanho da fonte ou altura dos controles muda
- **THEN** o alinhamento é recalculado para a nova área útil sem reiniciar o cronômetro

### Requirement: Prioridade da rolagem manual

O sistema SHALL suspender somente a centralização automática quando a pessoa rolar a letra manualmente. Cronômetro e destaque SHALL continuar funcionando, e a posição manual SHALL ser respeitada até uma retomada explícita do acompanhamento. Rolagens disparadas pelo próprio acompanhamento MUST NOT ser confundidas com intervenção manual.

#### Scenario: Consultar outro trecho durante a execução

- **WHEN** a pessoa arrasta a letra, usa a roda do mouse ou outro comando manual de rolagem
- **THEN** a rolagem automática em andamento é interrompida e as mudanças de verso seguintes não recolocam a tela no centro por conta própria
- **AND** o tempo e o destaque continuam atualizados

#### Scenario: Acompanhar uma troca de verso automaticamente

- **WHEN** o sistema rola o conteúdo para centralizar um novo trecho
- **THEN** esse movimento não suspende o acompanhamento nem apresenta o botão de retomada

#### Scenario: Evitar solavancos durante a troca de verso

- **WHEN** o destaque muda e a tela recebe várias medições de layout em sequência
- **THEN** o sistema reúne essas medições antes de iniciar uma única rolagem para a posição final do verso
- **AND** alterações intermediárias do mesmo verso não reiniciam repetidamente a animação

### Requirement: Retomada pelo botão Acompanhar

Após uma rolagem manual interromper o acompanhamento, o sistema SHALL mostrar um botão compacto “Acompanhar”, com ícone de centralização e sem cobrir a letra ativa. Ao acioná-lo, SHALL recentralizar o trecho atual, restaurar a centralização das próximas linhas e ocultar o botão, preservando o estado do cronômetro.

#### Scenario: Voltar ao verso atual

- **WHEN** a pessoa aciona Acompanhar após consultar outro trecho
- **THEN** o verso atual é centralizado e as próximas mudanças voltam a ser acompanhadas automaticamente
- **AND** o botão desaparece sem iniciar ou pausar a contagem

#### Scenario: Retomar fora de um intervalo ativo

- **WHEN** a pessoa aciona Acompanhar antes da primeira marcação ou após o fim conhecido
- **THEN** a tela alinha o primeiro ou o último trecho para contexto, respectivamente, sem atribuir um destaque temporal incorreto
- **AND** o acompanhamento automático é restaurado e o botão deixa de aparecer

### Requirement: Barra proporcional à duração cadastrada

O sistema SHALL apresentar uma barra arrastável com tempo atual, duração total, trecho percorrido e marcador quando a duração cadastrada for positiva, finita e posterior à última marcação. Sem duração utilizável, SHALL manter cronômetro e salto por linha disponíveis, sem usar a última marcação como fim fictício da música.

#### Scenario: Exibir progresso com duração conhecida

- **WHEN** a música possui duração total válida
- **THEN** o início e o fim da barra correspondem a zero e a essa duração, com preenchimento proporcional à posição atual

#### Scenario: Duração ausente ou inconsistente

- **WHEN** a duração não está informada, é inválida ou não ultrapassa a última marcação
- **THEN** a tela mantém o tempo decorrido e a navegação por versos sem apresentar uma barra proporcional enganosa

#### Scenario: Contagem ultrapassa a estimativa

- **WHEN** o cronômetro em execução ultrapassa a duração cadastrada
- **THEN** o tempo decorrido continua visível, o preenchimento fica limitado a cem por cento e nenhuma troca de música é realizada automaticamente

### Requirement: Navegação por arraste da barra

Durante o arraste, o sistema SHALL mostrar o tempo escolhido junto ao marcador e atualizar a pré-visualização do destaque sem disputar a posição com os avanços do relógio. Ao concluir, SHALL aplicar a posição e retomar a centralização; ao cancelar, SHALL recuperar o tempo real do cronômetro, preservando seu estado.

#### Scenario: Arrastar em uma execução ativa

- **WHEN** a pessoa arrasta o marcador para frente ou para trás enquanto a contagem está ativa
- **THEN** o tempo escolhido e o destaque acompanham o gesto sem que o relógio mova o marcador à força
- **AND** ao soltar, a contagem continua da posição escolhida e o trecho correspondente fica centralizado

#### Scenario: Arrastar durante uma pausa

- **WHEN** a pessoa conclui um arraste com a contagem pausada
- **THEN** o cronômetro permanece pausado na nova posição, com o destaque correspondente

#### Scenario: Cancelar um gesto

- **WHEN** um arraste é cancelado antes de confirmar uma posição
- **THEN** a pré-visualização é descartada e a tela volta ao tempo efetivo, incluindo o intervalo transcorrido se a contagem estava ativa

#### Scenario: Escolher uma posição na trilha

- **WHEN** a pessoa toca ou clica em um ponto da barra
- **THEN** esse ponto é aplicado respeitando os limites e o estado atual de execução

### Requirement: Salto ao tocar uma linha inativa

O sistema SHALL permitir tocar ou ativar por teclado uma linha inativa com horário válido para posicionar o cronômetro no início dela, atualizar o destaque e restaurar sua centralização automática. O gesto de rolagem MUST NOT disparar esse salto; títulos, separadores e linhas sem horário MUST NOT oferecer essa ação.

#### Scenario: Escolher um verso anterior ou seguinte

- **WHEN** a pessoa toca em uma linha inativa com horário válido
- **THEN** o cronômetro passa exatamente para seu início, o trecho fica destacado e centralizado, e execução ou pausa é preservada

#### Scenario: Rolar começando sobre uma linha

- **WHEN** a pessoa inicia um movimento de rolagem sobre o texto
- **THEN** o conteúdo rola sem aplicar um salto temporal ao soltar o toque

### Requirement: Continuidade temporal após interrupções

O sistema SHALL calcular o tempo por uma referência real para recuperar uma execução após perda de foco do aplicativo, bloqueio ou chamada. O tempo pausado e a preferência temporária por rolagem manual SHALL ser preservados. Ao sair da tela ou reabri-la após encerramento do processo, uma nova sessão SHALL iniciar em zero e parada.

#### Scenario: Voltar ao aplicativo durante a execução

- **WHEN** a pessoa retorna ao primeiro plano após uma interrupção
- **THEN** o tempo inclui o intervalo transcorrido e o destaque corresponde à posição atual
- **AND** a centralização só é aplicada se o acompanhamento automático estava habilitado

#### Scenario: Voltar com a contagem pausada

- **WHEN** o aplicativo volta ao primeiro plano com o cronômetro pausado
- **THEN** o tempo mantém o valor anterior, sem somar o intervalo da interrupção

#### Scenario: Encerrar a consulta

- **WHEN** a pessoa sai da tela de letra e depois a abre novamente ou o processo é encerrado e reaberto
- **THEN** a sessão anterior não continua silenciosamente e a nova consulta começa em zero sem execução automática

### Requirement: Preservação da leitura durante revalidação

O sistema SHALL preservar letra autorizada, tempo e estado de acompanhamento durante consultas em andamento ou falhas de atualização. Ao receber dados novos, SHALL recalcular o destaque e as posições com o tempo vigente; se a letra deixar de ser sincronizada ou o acesso for revogado, SHALL interromper o acompanhamento e respeitar a disponibilidade atual.

#### Scenario: Atualizar uma letra já visível

- **WHEN** uma revalidação está em andamento ou falha enquanto há conteúdo autorizado disponível
- **THEN** o texto e os controles permanecem utilizáveis, sem tela vazia ou reinício da contagem

#### Scenario: Aplicar novas marcações válidas

- **WHEN** a consulta recebe uma versão sincronizada atualizada da mesma música
- **THEN** o destaque passa a usar as marcações atuais mantendo o tempo decorrido e respeitando a opção de rolagem manual

#### Scenario: Perder sincronização ou acesso

- **WHEN** a letra atualizada deixa de ter sincronização completa ou a música deixa de estar autorizada
- **THEN** a contagem e as interações temporais param e a tela apresenta leitura manual ou indisponibilidade, conforme o caso

#### Scenario: Atualizar a música ao voltar ao primeiro plano

- **WHEN** a consulta da música é reiniciada ao retornar de outro aplicativo
- **THEN** o último conteúdo já autorizado permanece visível enquanto a consulta estiver pendente
- **AND** o conteúdo novo substitui o anterior quando a consulta termina, ou a tela mostra o erro/indisponibilidade se a atualização falhar ou o acesso tiver sido removido

### Requirement: Controles acessíveis e responsivos

O sistema SHALL oferecer controles compactos e acessíveis nas três plataformas sobre uma barra translúcida que sobrepõe o fim da área de leitura, permitindo ver a letra por baixo. A tela SHALL reduzir a altura do cabeçalho e do rodapé para ampliar a área de rolagem; o conteúdo SHALL incluir espaço inferior para que os últimos versos não fiquem escondidos pelos controles. Reiniciar SHALL ficar no extremo esquerdo, comandos temporais alinhados ao eixo central da barra de progresso e Acompanhar no extremo direito, sem rótulo visual. Play/Pause SHALL ter um botão circular sem fundo colorido, maior que os demais controles, com ícone maior. O tempo atual e a duração total SHALL ocupar a mesma linha da barra para reduzir a altura do rodapé. Os rótulos SHALL permanecer em uma linha, com fonte menor em −5s/+5s, e os espaços verticais entre barra, tempos e comandos SHALL ser reduzidos sem diminuir as áreas de toque. Os controles SHALL manter nomes acessíveis, foco visível e operação por teclado na Web. A barra SHALL expor seu valor e permitir ajuste assistivo. Destaque e centralização SHALL respeitar fonte ampliada e redução de movimento sem depender somente de cor.

Em tablets e janelas largas, a coluna da letra SHALL ficar centralizada e limitada a 840 pontos, preservando margens equilibradas e uma largura de leitura confortável; o rodapé de controles SHALL manter seu limite de largura independente.

No iOS e no Android, o rodapé SHALL permanecer acima do inset inferior reservado pelo sistema. O layout SHALL estender a área de conteúdo até o limite inferior da tela e posicionar o rodapé usando o inset medido, sem aplicar o mesmo inset duas vezes. O cálculo da área útil e do espaço final da letra SHALL considerar esse inset para que a centralização e os últimos versos não sejam encobertos.

#### Scenario: Usar controles em tela ampla

- **WHEN** a tela é apresentada em tablet ou navegador largo
- **THEN** os botões mantêm dimensões proporcionais sem esticar por toda a largura disponível e a letra conserva sua área de leitura
- **AND** a coluna da letra permanece centralizada e limitada a 840 pontos

#### Scenario: Navegar por teclado ou leitor de tela

- **WHEN** a pessoa usa teclado ou tecnologia assistiva para ajustar o progresso ou ativar um verso
- **THEN** o tempo escolhido e a ação ficam identificáveis e produzem o mesmo resultado do toque, sem anúncios automáticos a cada atualização do relógio

#### Scenario: Reduzir movimento ou ampliar fontes

- **WHEN** a preferência de redução de movimento está ativa ou o tamanho da fonte aumenta
- **THEN** os controles e versos continuam legíveis e a centralização não força animação nem corta o texto

#### Scenario: Acompanhar uma mudança de linha suavemente

- **WHEN** o acompanhamento automático centraliza outro trecho
- **THEN** a rolagem acontece de forma suave na Web e com animação nas plataformas nativas, salvo quando movimento reduzido está ativo
- **AND** uma rolagem manual interrompe a transição sem recolocar a tela na posição anterior

#### Scenario: Usar os controles nas extremidades

- **WHEN** a barra de controles é apresentada
- **THEN** Reiniciar fica à esquerda e Acompanhar, somente com ícone e nome acessível, fica à direita
- **AND** Play/Pause aparece maior, circular e sem fundo colorido; os demais comandos continuam centralizados e a barra mantém seu fundo translúcido

#### Scenario: Ver a letra sob o rodapé

- **WHEN** a pessoa rola a letra até a área coberta pelos controles
- **THEN** as linhas continuam visíveis através do fundo translúcido do rodapé
- **AND** o espaço inferior permite trazer os últimos versos para a área livre acima dos controles

#### Scenario: Respeitar a área reservada no iOS e Android

- **WHEN** a tela de letra sincronizada é aberta no iOS ou Android com inset inferior reservado pelo sistema
- **THEN** o rodapé fica acima da área reservada pelo sistema
- **AND** a rolagem e a centralização consideram essa área ao posicionar a letra
