# Tasks

## 1. Relógio validado e sequência temporal

- [x] 1.1 Acrescentar posicionamento absoluto ao mesmo `useManualTimer` validado na atividade 3.3, documentar o contrato e verificar por testes início, pausa, retomada, reinício, saltos parado/em execução, entradas inválidas e recuperação após retorno ao primeiro plano.
- [x] 1.2 Criar a projeção temporal pura das linhas com grupos de horários iguais e validação de ordem, preservando o documento; verificar por testes fronteiras inclusivas/exclusivas, marca zero, trechos repetidos, títulos, linhas vazias e separadores.
- [x] 1.3 Definir duração utilizável e limites de navegação e progresso, documentando a distinção entre início do último verso e fim da música; verificar por testes duração ausente, inválida, igual/inferior à última marca, saltos negativos e contagem além da estimativa.

## 2. Acompanhamento na letra em tela cheia

- [x] 2.1 Integrar o relógio e a projeção a `SongLyricsScreen` somente quando a letra for elegível; verificar por testes disponibilidade para integrantes com leitura e preservação da consulta manual para letras estáticas, incompletas, ausentes e instrumentais.
- [ ] 2.2 Evoluir a variante de tela cheia de `SongLyricsContent` para manter versos e nomes dos blocos inativos em 65% de opacidade e a linha ativa em 100%, negrito e cor normal, sem fundo de destaque; acrescentar respiro antes/depois sem aumentar tamanho da fonte ou altura de linha, preservando formatação; verificar grupos simultâneos, restauração do trecho anterior e ausência de alteração na leitura em card por testes de componente.
- [ ] 2.3 Acrescentar cabeçalho e rodapé compactos; sobrepor os controles translúcidos à área rolável, mantendo a letra visível por baixo e respiro final para os últimos versos; posicionar o rodapé acima do inset inferior reservado pelo sistema no iOS e Android, aplicando-o uma única vez; centralizar a coluna da letra em telas amplas com limite de 840 pontos, mantendo o limite independente dos controles; usar fundo neutro nos botões com 88% de opacidade sem reduzir ícones e rótulos; diminuir o espaço entre slider e botões; alinhar tempo e duração à linha do slider e manter Iniciar/Pausar/Retomar em botão circular de 72 px, sem fundo colorido diferente dos demais e maior que os outros controles; verificar relógio, área útil e proporção em celular, tablet e Web.
- [x] 2.4 Atualizar `docs/ARQUITETURA_DE_TELAS.md` com a composição da tela e o reuso do relógio da atividade 3.3; conferir os caminhos e responsabilidades contra a implementação entregue neste grupo.
- [x] 2.5 Organizar os controles com Reiniciar à esquerda, Acompanhar somente com ícone à direita e os demais comandos alinhados ao centro horizontal da barra de progresso; reduzir espaços verticais, impedir quebra dos rótulos e reduzir fonte em −5s/+5s sem alterar áreas de toque; verificar posição e proporção por testes de componente.

## 3. Barra de progresso e navegação temporal

- [x] 3.1 Criar o controle compartilhado de progresso com trilha, marcador, tempo atual/total e área de toque ampliada, documentando suas propriedades; verificar por testes conversão entre posição e tempo, limites e ausência da barra sem duração utilizável.
- [x] 3.2 Integrar arraste com pré-visualização do tempo e do destaque, balão junto ao marcador, confirmação e cancelamento; verificar por testes que os ticks não disputam o marcador e que execução, pausa e estado ainda não iniciado são preservados.
- [x] 3.3 Acrescentar seleção na trilha, teclado e ajustes assistivos acessíveis pelo mesmo fluxo temporal; verificar por testes valores expostos, foco, nomes acessíveis e equivalência com a interação por toque.

## 4. Centralização, rolagem manual e toque nos versos

- [ ] 4.1 Medir área útil e altura final dos trechos, acrescentar respiro nas extremidades e calcular centralização após o destaque; na Web, normalizar as posições DOM das linhas em relação ao conteúdo rolável e usar a assinatura `{ y, animated }` da referência React Native para rolar; verificar por testes de cálculo/layout primeira e última linhas, fonte ampliada, quebras de texto, grupo maior que a área visível e redimensionamento.
- [x] 4.2 Distinguir intervenção manual e rolagem programática nas plataformas e cancelar centralizações pendentes ao rolar manualmente; verificar por testes que inércia e novos ticks não roubam a posição e que o movimento automático não desliga seu próprio acompanhamento.
- [x] 4.3 Acrescentar o botão compacto Acompanhar na região reservada de controles e implementar a retomada do alinhamento central; verificar por testes exibição após rolagem manual, ocultação ao retomar, preservação do relógio e contexto antes da primeira marca/depois do fim conhecido.
- [x] 4.4 Permitir salto ao horário de uma linha inativa por toque e teclado, restaurando destaque e centralização; verificar por testes destino exato, preservação de execução/pausa, foco estável e cancelamento do toque quando o gesto for de rolagem.
- [x] 4.5 Documentar no README o uso da barra, dos versos selecionáveis, do botão Acompanhar e do comportamento sem duração total; conferir o roteiro contra o fluxo integrado e a especificação desta change.
- [ ] 4.6 Destacar a linha ativa com opacidade total, cor normal, negrito e respiro vertical, enquanto versos inativos ficam em 65% de opacidade; reunir medições antes de rolar para evitar reiniciar animações, interromper o movimento no deslocamento atual durante a interação manual e respeitar movimento reduzido; verificar métricas e transições nas três plataformas.

## 5. Ciclo de vida e revalidação

- [x] 5.1 Integrar retorno do primeiro plano e encerramento da sessão ao sair da rota, mantendo a base validada na 3.3; verificar por testes retorno em execução/pausa, modo manual preservado, limpeza de efeitos e nova abertura em zero sem início automático.
- [x] 5.2 Preservar conteúdo autorizado, tempo e acompanhamento durante revalidação e falha, reconstruindo projeção e medidas quando o documento mudar; verificar por testes novas marcações, perda de elegibilidade e perda de acesso, sem tela vazia ou gravação de estado de execução nos repositórios.

## 6. Validação integrada nas três plataformas

- [x] 6.1 Executar os checks exigidos para o conjunto implementado, incluindo `npm run validate`, smoke Web pertinente e `openspec validate acompanhar-letra-sincronizada --strict`; registrar os resultados e corrigir falhas antes de considerar a implementação pronta.
- [ ] 6.2 Validar na Web o fluxo completo com mouse, teclado, rolagem manual, arraste/cancelamento, toque em versos, retorno de aba, redimensionamento e redução de movimento; registrar evidências e confirmar que o trecho atual fica centralizado sem saltos indevidos.
- [ ] 6.3 Validar no Android destaque, primeira/última linha, fonte ampliada, arraste, salto por verso, prioridade da rolagem manual, botão Acompanhar e retorno após interrupção; registrar o aparelho/build e os resultados da nova integração.
- [ ] 6.4 Validar em iPhone e iPad os mesmos fluxos temporais e de leitura, incluindo orientação, áreas seguras, tamanho dos controles e retorno após interrupção; registrar os ambientes e as evidências sem substituir a validação por testes de componente.
- [x] 6.5 Conferir a correspondência entre proposta, design, cenários e evidências, atualizar o handoff com o resultado da integração e verificar que a reutilização da 3.3 está registrada sem marcar como concluídas as tarefas completas de palco ainda adiadas na change principal.
