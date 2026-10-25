# Proposal

## Why

As músicas já podem possuir letra com tempos por linha, mas a consulta em tela cheia ainda exige acompanhar e rolar o texto manualmente. Aproveitar essas marcações com o cronômetro já validado permitirá acompanhar ensaios e apresentações, corrigir a posição temporal e manter o verso atual legível.

## What Changes

- Acrescentar acompanhamento temporal à tela de letra em tela cheia para músicas com sincronização completa, preservando leitura manual para os demais estados.
- Reutilizar o cronômetro validado na atividade 3.3 de `definir-mvp-setlist`, mantendo início explícito, pausa, retomada, reinício e recuperação do tempo real após interrupções.
- Na tela sincronizada, reduzir a opacidade das linhas e dos nomes dos blocos inativos para 65%; manter a linha atual em 100%, em negrito e com a cor normal do texto, sem fundo de destaque.
- Centralizar preferencialmente o destaque na área vertical útil da letra, incluindo primeira e última linhas e compensando mudanças de altura do texto.
- Dar prioridade à rolagem manual sem parar o cronômetro e mostrar um botão compacto “Acompanhar” para recentralizar e retomar o acompanhamento automático.
- Oferecer barra de progresso arrastável, com tempo atual, duração total e indicação do tempo durante o arraste, quando houver duração cadastrada válida.
- Permitir saltar ao início de uma linha inativa tocando nela, além de ajustes de −5s/+5s, preservando execução ou pausa.
- Manter controles compactos e acessíveis sobre uma barra translúcida: reinício à esquerda, comandos centrais e acompanhamento à direita somente com ícone.
- Suavizar a rolagem automática sem disputar com gestos manuais e respeitar a preferência por movimento reduzido.

## Capabilities

### New Capabilities

- `timed-lyrics-display`: acompanhamento local da letra em tela cheia, navegação temporal, destaque e centralização das linhas, com prioridade para interação manual.

### Modified Capabilities

Nenhuma. A nova capacidade utiliza as marcações de letra existentes e segue as regras vigentes de interface, atualização de dados e autorização de leitura.

## Impact

- Evolução de `SongLyricsScreen` e da apresentação em tela cheia de `SongLyricsContent`.
- Extensão do mesmo `useManualTimer` para posicionamento temporal; o destaque e a barra consumirão seu tempo decorrido.
- Novo controle compartilhado de progresso, utilizando a infraestrutura de gestos já integrada, e testes das novas transições e interações.
- Sem migração planejada: `startTimeMs` e `estimatedDurationMs` já fornecem os dados necessários.
- O escopo não inclui reativar o modo palco, tocar ou reconhecer áudio, controlar YouTube, sincronizar aparelhos, criar pacotes offline ou recuperar sessão após encerramento do processo. As tarefas completas de palco da change principal permanecem pendentes.
