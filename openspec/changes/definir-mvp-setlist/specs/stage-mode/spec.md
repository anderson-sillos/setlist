## Purpose

Definir uma experiência de palco legível e previsível, com cronômetro manual independente, apresentação temporal da letra e proteção contra interrupções.

## ADDED Requirements

### Requirement: Cronômetro manual e independente
O sistema SHALL iniciar o cronômetro de uma música somente por ação do músico e MUST NOT compartilhar seu início, pausa ou progresso com outros aparelhos.

#### Scenario: Iniciar música
- **WHEN** o músico aciona o início de uma música no modo palco
- **THEN** o sistema inicia em seu aparelho um cronômetro local a partir de zero

#### Scenario: Outro aparelho está no mesmo show
- **WHEN** dois músicos usam o mesmo show em aparelhos diferentes
- **THEN** cada cronômetro responde somente aos comandos realizados no respectivo aparelho

### Requirement: Controles temporais
O sistema SHALL oferecer pausa, retomada, avanço de cinco segundos, retorno de cinco segundos e reinício do cronômetro.

#### Scenario: Ajustar tempo durante a execução
- **WHEN** o músico pausa, retoma ou ajusta o tempo
- **THEN** o sistema atualiza imediatamente o tempo exibido e a linha correspondente no aparelho

#### Scenario: Reiniciar música
- **WHEN** o músico confirma o reinício
- **THEN** o sistema retorna o cronômetro ao início da música

### Requirement: Apresentação da letra conforme seu estado
O sistema SHALL destacar automaticamente a linha correspondente apenas quando a letra estiver Sincronizada e SHALL preservar leitura manual nos demais estados.

#### Scenario: Exibir letra sincronizada
- **WHEN** o cronômetro alcança o início de uma linha de uma música Sincronizada
- **THEN** o sistema destaca essa linha e mantém linhas anteriores e seguintes visíveis

#### Scenario: Exibir letra estática ou incompleta
- **WHEN** a música está como Letra estática ou Sincronização incompleta
- **THEN** o sistema mostra a letra para leitura manual sem destaque automático que indique uma precisão inexistente

#### Scenario: Música sem letra
- **WHEN** a música está como Sem letra
- **THEN** o sistema mantém cronômetro e controles visíveis e apresenta `Sem letra cadastrada`

### Requirement: Informações do item e navegação manual
O sistema SHALL mostrar tempo transcorrido, duração total, observação específica do item e prévia da próxima música e SHALL trocar de música somente por ação do músico.

#### Scenario: Concluir uma música
- **WHEN** o cronômetro alcança a duração estimada da música atual
- **THEN** o sistema mantém a música atual aberta até que o músico solicite a próxima

#### Scenario: Avançar para a próxima música
- **WHEN** o músico usa o controle ou gesto de próxima música
- **THEN** o sistema abre o próximo item da setlist sem alterar a ordem compartilhada do show

### Requirement: Preferências de apresentação
O sistema SHALL permitir ajuste de tamanho da fonte, tema e orientação e SHALL tentar manter a tela ativa enquanto o modo palco estiver visível.

#### Scenario: Alterar legibilidade
- **WHEN** o músico modifica fonte, tema ou orientação
- **THEN** o sistema aplica a preferência sem reiniciar o cronômetro

### Requirement: Continuidade após perda de foco
O sistema SHALL calcular o tempo decorrido a partir de uma referência real para recuperar corretamente um cronômetro em execução após bloqueio de tela, chamada ou perda de foco.

#### Scenario: Retornar com cronômetro em execução
- **WHEN** o aplicativo volta ao primeiro plano após uma interrupção e o cronômetro estava em execução
- **THEN** o sistema recalcula o tempo real decorrido e mostra a linha correspondente

#### Scenario: Retornar com cronômetro pausado
- **WHEN** o aplicativo volta ao primeiro plano após uma interrupção e o cronômetro estava pausado
- **THEN** o sistema mantém o mesmo tempo pausado

### Requirement: Recuperação após encerramento do processo
O sistema SHALL restaurar o show e a música anteriormente abertos após encerramento do processo, mas MUST exigir uma decisão explícita antes de continuar o cronômetro.

#### Scenario: Reabrir sessão de palco interrompida
- **WHEN** a aplicação detecta uma sessão de palco interrompida por encerramento do processo
- **THEN** o sistema restaura o contexto e oferece Retomar ou Reiniciar sem iniciar o cronômetro silenciosamente

### Requirement: Bloqueio contra toques acidentais
O sistema SHALL oferecer bloqueio manual que desabilite comandos e gestos de execução sem interromper cronômetro ou rolagem temporal.

#### Scenario: Ativar bloqueio
- **WHEN** o músico ativa o bloqueio no modo palco
- **THEN** o sistema mostra um indicador discreto e ignora pausa, ajustes de tempo, troca de música e gestos

#### Scenario: Desbloquear controles
- **WHEN** o músico mantém pressionado o controle de desbloqueio por aproximadamente dois segundos
- **THEN** o sistema reativa os comandos do modo palco

#### Scenario: Abrir modo palco
- **WHEN** o músico abre uma música no modo palco
- **THEN** o bloqueio começa desativado

### Requirement: Alertas não intrusivos durante a execução
O sistema SHALL apresentar perda de conexão, verificação pendente ou pacote desatualizado por indicadores discretos e MUST NOT cobrir a letra com diálogos durante a execução.

#### Scenario: Perder conexão no palco
- **WHEN** a conexão é perdida enquanto o conteúdo disponível continua utilizável
- **THEN** o sistema sinaliza a condição sem interromper cronômetro, letra ou controles

#### Scenario: Pacote não pode ser usado
- **WHEN** o pacote necessário está ausente ou corrompido
- **THEN** o sistema bloqueia a execução offline e orienta novo download quando houver conexão
