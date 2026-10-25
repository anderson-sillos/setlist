# Design

## Context

Consulte `proposal.md` para motivação e escopo. O contrato observável está em `specs/timed-lyrics-display/spec.md`.

- `SongLyricsScreen` já consulta uma música e apresenta `SongLyricsContent` em uma área rolável de tela cheia.
- `LyricLine.startTimeMs` fornece o início da linha; o documento não possui horário de fim por verso. `Song.estimatedDurationMs` fornece a duração cadastrada.
- `useManualTimer`, em `src/features/stage/useManualTimer.ts`, é a implementação validada na atividade 3.3 da change principal. Usa referência `Date.now()`, atualiza a cada 250 ms e recalcula o progresso ao voltar ao estado ativo. Início, pausa, retomada, reinício e independência das instâncias possuem testes; perda de foco, bloqueio e chamada foram validados em Android e iOS.
- O modo palco permanece indisponível nas rotas públicas. Esta entrega usa a consulta de letra já acessível pelo repertório.
- O projeto possui infraestrutura de gestos, animações, ícones, redução de movimento e componentes acessíveis. Não há um controle de progresso arrastável pronto para reutilização.

O design é necessário porque a extensão do relógio, os gestos de navegação e a medição de uma linha cuja altura muda precisam compartilhar decisões de estado antes da implementação.

## Goals / Non-Goals

**Goals:**

- Manter uma única referência temporal por sessão e derivar dela o relógio exibido, a barra e o destaque.
- Separar contagem, pré-visualização de arraste e preferência de rolagem para que uma interação não sobreponha outra.
- Centralizar o trecho usando a geometria renderizada e preservar controle manual e foco acessível.
- Reutilizar as consultas e autorizações existentes, sem gravar estado de execução no servidor.

**Non-Goals:**

- Criar outro cronômetro ou substituir a base validada por tempo acumulado a partir de intervalos.
- Relacionar o relógio à reprodução ou ao reconhecimento de áudio.
- Persistir sessão após encerramento do processo ou ampliar o escopo para execução completa de shows.
- Inferir horários de término de versos ou alterar as marcações e a duração cadastradas.

## Decisions

### 1. Estender o cronômetro validado com posicionamento absoluto

Reutilizar o mesmo `useManualTimer` e adicionar uma operação de posicionamento, por exemplo `seekTo(timeMs)`. Ajustes relativos de cinco segundos, barra e toque em verso devem chegar a essa mesma operação.

Em execução, posicionar recalcula a referência como `Date.now() - timeMs`; pausado ou ainda não iniciado, altera apenas o tempo guardado. O estado lógico de execução não muda por causa de um salto. Entradas inválidas são ignoradas; posições negativas são limitadas a zero. A tela aplica o limite superior quando a duração da música é utilizável, sem tornar o hook dependente de `Song`.

Reiniciar também restaura o modo automático e o contexto inicial de leitura, mantendo a contagem parada. Um verso com marca zero pode ficar destacado nessa posição sem iniciar a execução.

A referência real e a recuperação em `AppState` permanecem. O intervalo existente de 250 ms continua como cadência inicial; não haverá um temporizador por linha nem animação por quadro para contar tempo. Um segundo hook independente duplicaria a máquina já validada e criaria risco de divergência entre cronômetro e letra.

### 2. Projetar uma sequência temporal sem modificar o documento

Criar uma projeção pura das linhas textuais com identificador, posição no documento e tempo inicial. Validar números finitos, não negativos e não decrescentes além da classificação sincronizada. Preservar ordem, blocos, negritos e separadores; não ordenar silenciosamente um documento inconsistente.

Agrupar linhas com o mesmo início. A seleção do grupo atual usa intervalos com início inclusivo e próximo horário distinto exclusivo. Antes da primeira marca não existe grupo ativo. O grupo final termina na duração cadastrada quando ela é utilizável; sem isso, permanece como último trecho conhecido.

| Posição                                   | Apresentação temporal                       |
| ----------------------------------------- | ------------------------------------------- |
| Antes da primeira marca                   | Sem destaque                                |
| No início de uma linha ou grupo           | Novo trecho destacado                       |
| Entre duas marcas distintas               | Trecho anterior continua ativo              |
| No fim conhecido ou depois dele           | Sem destaque de verso                       |
| Depois da última marca, sem fim conhecido | Último trecho conhecido permanece destacado |

Essa escolha acompanha os dados disponíveis. Estimar quanto tempo cada verso é cantado acrescentaria uma precisão que o documento não fornece.

### 3. Usar a duração cadastrada como limite da barra

A duração utilizável é `estimatedDurationMs` positiva, finita e maior que a última marcação. A duração técnica de uma importação não substitui automaticamente o valor escolhido no cadastro. Quando não há um fim utilizável, a tela mantém o tempo, os ajustes e o salto por linha, mas não fabrica uma barra percentual a partir do último verso.

O progresso visual é limitado ao intervalo de zero a cem por cento. A contagem natural pode ultrapassar a estimativa, preservando o comportamento do cronômetro independente; um salto explícito fica limitado ao intervalo navegável quando conhecido. Alcançar a duração não troca de música e não inicia outra ação.

### 4. Separar arraste de progresso e tempo efetivo

A tela mantém `scrubPreviewMs` somente enquanto há um arraste. O tempo apresentado e o trecho pré-visualizado são derivados de `scrubPreviewMs ?? elapsedMs`. O relógio validado permanece a referência efetiva; seus ticks não reposicionam o marcador durante a interação.

Ao concluir, confirmar a posição pela operação única de salto e habilitar acompanhamento automático. Se estava executando, continua da escolha; se estava pausado ou não iniciado, continua parado. Ao cancelar, descartar a prévia e voltar ao tempo efetivo, incluindo o intervalo transcorrido numa execução ativa. Preservar também a opção anterior de rolagem manual quando o arraste é cancelado.

O controle apresenta trilha fina, progresso na cor de ação do Setlist, marcador e balão com tempo durante o arraste. A área de interação é maior que a espessura visual. Usar a infraestrutura de gestos já instalada, com operação de teclado e sem adicionar um módulo nativo apenas para essa barra.

### 5. Medir a área útil e a altura final do destaque

Manter cabeçalho compacto e colocar o rodapé compacto em sobreposição translúcida no limite inferior da área segura. Posicionar o rodapé acima do inset inferior reservado pelo sistema no iOS e Android, deixando a raiz ocupar a área até a borda inferior e aplicando o inset uma única vez no posicionamento do rodapé. A letra continua rolável por baixo dele. Em tablets e janelas largas, centralizar a coluna da letra e limitá-la a 840 pontos; o rodapé mantém seu próprio limite de largura. Medir a altura do rodapé e descontá-la, junto ao inset inferior, da área útil para centralização, mantendo espaço extra no final do conteúdo para trazer os últimos versos acima dos controles e da área de navegação. O tempo atual e a duração compartilham a linha do slider para reduzir a altura do rodapé.

Na tela sincronizada, versos e nomes dos blocos inativos usam 65% de opacidade. A linha ativa usa 100% de opacidade, mantém a cor normal do texto e fica em negrito, sem fundo de destaque. Acrescenta `spacing.sm` antes e depois da linha ativa, mantendo o tamanho da fonte e a altura de linha; o negrito pode alterar discretamente a largura dos glifos sem ampliar a tipografia. A centralização usa as dimensões reais do texto, considerando quebras causadas pela largura ou pelo tamanho de fonte configurado no aparelho; cada trecho informa sua posição e altura, e a centralização é calculada por `topo + altura / 2 - alturaUtil / 2`.

Adicionar espaço visual no início e no fim do contêiner para permitir centralizar os trechos extremos sem modificar o documento. Se um grupo exceder a altura útil, alinhar seu início com margem de leitura e manter estável essa escolha até mudar o grupo ou a geometria.

Recalcular quando muda o grupo ativo, a largura, a orientação, a fonte ou a área útil; não disparar uma rolagem a cada tick. Reunir medições de layout por um intervalo curto antes de rolar, para mover uma única vez até a geometria final e evitar reiniciar a animação durante a redistribuição dos versos. Medições antigas são invalidadas quando o documento ou a geração de layout muda. No React Native Web, normalizar a posição atual da linha em relação à área rolável usando as referências DOM e `getBoundingClientRect`; os eventos de layout do React Native Web fornecem a posição em relação ao elemento pai imediato. Disparar a rolagem pela referência do `ScrollView` com `{ y, animated }`, inclusive na Web, pois o React Native Web sobrescreve `scrollTo` no nó DOM com a assinatura do React Native. Nas plataformas nativas, combinar os deslocamentos relativos dos contêineres. Medir por callbacks de layout e referências compatíveis com a Web, evitando APIs de localização de nós incompatíveis com o navegador.

Ao voltar ao primeiro plano, o cache protegido pode ser reiniciado antes da revalidação. `SongLyricsScreen` conserva a última música autorizada somente durante esse estado pendente, evitando uma tela vazia; a resposta atualizada substitui o conteúdo e uma falha ou perda de acesso remove a cópia em memória e apresenta o estado de erro correspondente.

O aumento da fonte ativa foi removido porque alterava quebras de linha e confundia o acompanhamento da letra. O contraste de opacidade e o negrito distinguem o trecho sem alterar sua cor ou o fundo, nem aumentar a fonte ou a altura de linha; como o peso pode mudar discretamente a largura dos glifos, a centralização continua usando as dimensões medidas após a renderização.

### 6. Tratar rolagem manual como uma preferência explícita da sessão

Manter `followMode` com valores automático e manual. Identificar intenção humana pelos eventos de gesto, roda do mouse, barra de rolagem e comandos de teclado pertinentes. Movimentos programáticos por centralização não desabilitam o próprio acompanhamento.

Uma intervenção manual cancela centralizações pendentes e interrompe a animação em curso no deslocamento atual nas três plataformas. Mantém o modo manual mesmo depois de terminar a inércia ou mudar o verso. O relógio e o destaque continuam atualizados. Não usar um timeout para retomar automaticamente, pois ele disputaria a posição que a pessoa escolheu.

O botão “Acompanhar”, com somente o ícone de centralização e nome acessível, aparece no extremo direito da barra de controles enquanto o modo for manual. O reinício fica no extremo esquerdo; os demais comandos permanecem numa linha centralizada no mesmo eixo horizontal da barra de progresso. Todos os botões usam a mesma superfície neutra com 88% de opacidade; ícones, rótulos e bordas permanecem em opacidade total. Play/Pause usa um ícone maior num botão circular de 72 px, sem fundo colorido diferente dos demais e maior que os outros controles. Rótulos não quebram linha e os de −5s/+5s usam fonte menor. Reduzir o espaço vertical entre progresso, tempos e comandos sem diminuir a área de toque, removendo o espaço extra entre o slider e os botões. O fundo da barra usa uma cor translúcida. Ao acionar Acompanhar, centralizar o grupo atual, retornar ao modo automático e ocultar o botão. Sem grupo ativo, alinhar o primeiro trecho antes do início ou o último após o fim conhecido, sem destacá-los indevidamente.

Animar a centralização somente quando o grupo ou a geometria mudar, em vez de reagir a cada tick. Usar rolagem suave na Web e animação nativa, exceto quando a pessoa prefere movimento reduzido. Uma intervenção manual cancela a animação em andamento e preserva a posição escolhida.

Saltos confirmados pela barra, pelos ajustes ou por um verso também restauram o acompanhamento a partir do destino escolhido. O retorno do aplicativo ao primeiro plano respeita o modo manual anterior.

### 7. Manter o componente de letra reutilizável

Evoluir `SongLyricsContent` com informações opcionais de destaque, medição e seleção temporal usadas pela variante de tela cheia. A leitura em card e os documentos sem sincronização preservam seu comportamento.

Usar identificadores estáveis por linha e grupo. Versos com horário válido permitem ativação por toque e teclado, comunicando o destino de forma acessível; nomes de bloco, linhas vazias e separadores não se tornam alvos temporais. O reconhecimento de toque deve ser cancelado quando há um gesto de rolagem, e uma troca de destaque não deve reconstruir o elemento que mantém o foco do teclado.

O texto continua copiável na Web. O destaque não desloca o foco acessível nem gera anúncio a cada tick; o usuário consulta o valor do relógio ou ajusta a barra quando desejar. Respeitar a preferência de redução de movimento ao centralizar.

### 8. Integrar revalidação e ciclo de vida sem apagar a leitura

Continuar usando `useSong` e a política de atualização existente. Revalidações preservam dados já disponíveis e não zeram o cronômetro. Se uma resposta traz uma versão nova, reconstruir a projeção e as medidas com o mesmo tempo e modo de acompanhamento. Não aplicar medidas de identificadores que já não pertencem ao documento.

Se a versão deixa de ser elegível ao acompanhamento, parar o relógio e manter a leitura disponível no estado correspondente. Perda de autorização segue o fluxo existente de indisponibilidade e interrompe a sessão. A ação de atualização deve continuar acessível sem disputar os gestos de navegação temporal.

Background, bloqueio e chamada seguem a recuperação validada na atividade 3.3. Na Web, conferir também retorno da aba e foco para que o próximo recálculo use o intervalo real. Sair da rota encerra a sessão e limpa efeitos; abrir novamente começa em zero. Não há promessa de retomada após encerramento do processo.

### 9. Validar o fluxo novo e manter as evidências anteriores

Cobrir com testes significativos a projeção temporal, grupos simultâneos, limites, extensão do relógio e integração entre gesto, modo de rolagem e destaque. Os testes existentes de início, pausa, retomada, reinício e retorno do primeiro plano permanecem como regressão.

Validar manualmente centralização com fontes ampliadas, trechos longos, primeira e última linhas, arraste, retorno ao aplicativo e entrada por teclado em Web, iOS e Android. Registrar a nova integração sem apresentar as tarefas completas de palco 8.2, 8.3 ou 8.6 da change principal como concluídas por esta entrega parcial.

## Risks / Trade-offs

- Mudança de fonte e espaço pode provocar saltos ou usar medidas obsoletas → medir após aplicar o destaque, invalidar gerações antigas e centralizar apenas nos eventos relevantes.
- Um gesto de leitura pode disparar salto temporal → separar intenção de rolagem e ativação de linha, com cancelamento de toque quando houver deslocamento.
- O relógio pode disputar o marcador durante arraste → manter uma prévia de gesto separada da referência temporal e confirmar uma única posição ao concluir.
- Gestos manuais podem ser confundidos com rolagem automática → identificar a origem da interação e testar cancelamento de animação, inércia e rolagem programática nas plataformas.
- A duração cadastrada pode faltar ou não cobrir a última marca → omitir somente a barra proporcional e continuar oferecendo tempo e navegação pelos versos conhecidos.
- As marcações podem corresponder a uma gravação com ritmo diferente da execução real → oferecer posicionamento por barra, verso e ajustes de cinco segundos, preservando a escolha local.
- Revalidação pode modificar identificadores ou tempos durante a leitura → reconstruir a projeção sem reiniciar o relógio, preservar modo manual e interromper apenas quando a disponibilidade exigir.

## Migration Plan

Não há migração de banco ou mudança do documento persistido. A entrega altera o cliente e acrescenta a capacidade `timed-lyrics-display` quando a change for concluída e sincronizada.

Implementar a extensão do cronômetro com regressão antes de ligar os controles à tela. Validar a experiência nas três plataformas e seguir o processo normal de revisão e distribuição do projeto. Em caso de reversão, restaurar a leitura estática da tela cheia e os consumidores anteriores do hook; nenhuma marcação ou duração da banda precisa ser revertida.
