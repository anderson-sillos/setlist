# Roteiro de teste de usabilidade do Setlist

**Versão:** 1.0

**Objetivo:** avaliar se pessoas novas entendem a navegação, os textos e as ações principais do Setlist.

**Método:** teste moderado por tarefas com Think Aloud e conversa breve após cada tarefa.

## 1. Objetivo do estudo

Observar se uma pessoa consegue começar a usar o Setlist sem treinamento, localizar as ações esperadas e entender o resultado do que fez. O estudo dará atenção especial a:

- localização e posição dos elementos de navegação e das ações;
- entendimento dos nomes, instruções, confirmações e mensagens;
- clareza dos papéis Owner e Editor e das ações disponíveis para cada um;
- entendimento de salvamento, convite e mudanças feitas no repertório e na setlist.

Este é um estudo qualitativo para encontrar problemas de uso e orientar ajustes. Os resultados de seis sessões não representam uma medida estatística nem uma comparação conclusiva entre plataformas.

## 2. Método

O moderador apresenta uma situação e uma tarefa com um objetivo claro. A pessoa usa o app e fala em voz alta o que procura, o que espera que aconteça e o que lhe causa dúvida. O moderador observa e toma notas sem mostrar o caminho.

Use Think Aloud concorrente durante as tarefas e perguntas retrospectivas curtas depois de cada uma. Assim, a pessoa pode explicar o que uma palavra ou ação significou para ela sem interromper a tentativa para responder a uma entrevista longa.

Os enunciados devem explicar o objetivo sem citar o nome da tela, do botão ou do controle a ser usado. Essa abordagem segue a orientação de testes moderados por tarefas do [GOV.UK Service Manual](https://www.gov.uk/service-manual/user-research/using-moderated-usability-testing).

## 3. Perfis e permissões

### Perfil A — pessoa que cria a banda (Owner)

Está começando a organizar uma banda no Setlist. Cria a banda, define quem pode participar e pode administrar integrantes e convites. Também pode criar e editar músicas, letras, shows e setlists.

### Perfil B — pessoa convidada para contribuir (Editor)

Recebe um convite e passa a ajudar a manter músicas, letras, shows e setlists. Pode editar esse conteúdo; não administra integrantes, convites ou configurações da banda.

São papéis reais da aplicação, não personagens que precisam ser encenados. Dê à pessoa um contexto curto e uma meta plausível. Os perfis devem usar contas separadas com as permissões correspondentes.

## 4. Participantes

### Primeira rodada recomendada

- Seis participantes: três no perfil Owner e três no perfil Editor.
- Procurar pessoas que conheçam minimamente o contexto musical ou de organização colaborativa, mas que não tenham usado o Setlist.
- Não é necessário que pertençam a uma banda real ou que testem conteúdo de sua própria banda.
- Se for importante observar as três plataformas nesta rodada, distribuir uma pessoa de cada perfil em Web, Android e iOS. Isso dá uma observação por combinação de perfil e plataforma; serve para encontrar dificuldades, não para comparar plataformas estatisticamente.
- Conduzir uma sessão piloto antes da rodada. Usar o piloto para corrigir instruções ambíguas; se o roteiro ou a interface mudar de forma relevante, não misturar os resultados do piloto aos da rodada.

Se houver apenas quatro participantes disponíveis, começar com duas pessoas por perfil e registrar quais papéis ou plataformas ficaram sem observação.

## 5. Ambiente e preparação

### Ambiente de teste

- Usar o projeto Supabase de desenvolvimento (`setlist-dev`) e conteúdo fictício.
- Usar Web configurada para desenvolvimento, perfil EAS `development-android` no Android e `development-ios-simulator` no simulador iOS.
- Não usar o perfil `production-ios-simulator` para estas sessões: ele aponta para o ambiente de produção e foi preparado para validação de produção.
- Antes da primeira sessão, confirmar que a URL e as credenciais públicas do cliente de teste selecionam o backend de desenvolvimento. Não mostrar nem registrar segredos durante a preparação.
- Não usar contas, letras, e-mails ou informações privadas de pessoas ou bandas reais.

### Contas e dados de exemplo

Preparar antes de cada sessão:

- conta de Owner e conta de Editor independentes, sem compartilhar senhas entre participantes;
- para a sessão Owner, conta sem banda e sem conteúdo preexistente;
- para a sessão Editor, banda fictícia `Horizonte`, show Rascunho `Ensaio aberto`, uma primeira música `Vento Norte` na setlist e música `Luzes da Rua` no repertório;
- para as tarefas, dados originais inventados: `Luzes da Rua`, artista `Horizonte`, Tom `G` e BPM `120`;
- convite de desenvolvimento válido para a conta Editor e um endereço de teste controlado para a tarefa de convite Owner;
- lista de estados iniciais e dados esperados para restaurar o ambiente entre sessões.

O Owner começa sem banda e cria uma durante a tarefa. O Editor começa com convite válido para uma banda de teste já preparada. Manter os dois roteiros independentes evita que uma sessão altere o ponto de partida da outra.

Se a tela de login for observada, explicar como a conta de pesquisa será usada e permitir que a pessoa opere a autenticação sem revelar senha ao moderador. Não pedir credenciais pessoais. Se não houver uma conta adequada, preparar a sessão já autenticada e limitar a avaliação do login à compreensão inicial da tela, sem concluir OAuth. Antes de gravar, explicar quem terá acesso à gravação e definir quando ela será apagada; pedir autorização separada para áudio e tela.

## 6. Materiais

- celular ou computador da plataforma atribuída;
- protótipo ou build com a versão que se pretende avaliar;
- conta e dados de teste restaurados;
- este roteiro e uma folha de observação por sessão;
- gravação de tela ou áudio somente se a pessoa autorizar; caso contrário, fazer anotações;
- cronômetro opcional para organizar o tempo, sem pressionar a pessoa.

Para tarefas de interação móvel, prefira um aparelho físico. Se a sessão iOS usar simulador, registre essa condição: ela permite avaliar layout e navegação, mas não substitui a observação de gestos e uso no aparelho físico.

## 7. Papel do moderador durante as tarefas

O moderador acompanha a tela enquanto a pessoa executa cada tarefa. Precisa observar o que ela abre e seleciona, onde procura primeiro, quando hesita, retorna ou tenta outro caminho e como reage às mensagens do app. Essas ações ajudam a explicar o resultado da tarefa.

- **Presencial:** peça que a pessoa mantenha a tela visível para você, ou sente-se num ângulo que permita acompanhar sem ficar sobre o ombro nem tocar no aparelho.
- **Remoto:** combine antes como a tela será compartilhada ou espelhada. Se isso não funcionar, use uma chamada de vídeo com o enquadramento voltado ao aparelho somente com autorização; uma gravação continua opcional.
- **Durante a tarefa:** observe em silêncio e anote ações e falas. Não indique elementos, não mova o aparelho e não complete a tarefa pela pessoa.
- **Privacidade:** explique que você acompanhará a tela. Peça autorização separada para qualquer gravação e permita a participação sem gravação, com anotações manuais.

O objetivo é observar a interação com o app, não avaliar a pessoa nem suas expressões faciais. Se a pessoa parecer desconfortável, pergunte se prefere pausar ou encerrar.

## 8. Duração sugerida

Planejar de 45 a 55 minutos por sessão:

| Etapa                                   | Tempo aproximado |
| --------------------------------------- | ---------------: |
| Boas-vindas, consentimento e contexto   |          5–8 min |
| Explicação do Think Aloud e aquecimento |          3–5 min |
| Tarefas do perfil                       |        25–30 min |
| Perguntas finais                        |         8–12 min |

## 9. Abertura e instruções ao participante

### Fala inicial sugerida

Antes de mostrar a tela, explique como a sessão funciona e peça autorização para anotações e, separadamente, para gravação. Ainda não apresente o propósito do produto: a primeira impressão também faz parte do estudo.

> Obrigado por participar. Estamos avaliando o aplicativo, não você; não há respostas certas ou erradas. Primeiro vou mostrar uma tela e perguntar o que você entende dela. Depois, vou pedir algumas tarefas. Enquanto usa o app, conte em voz alta, com frases simples, o que está procurando, o que espera que aconteça e o que está achando confuso. Você não precisa narrar cada toque nem explicar tudo. Por exemplo: “Estou procurando onde criar a banda”, “Achei que esse botão abriria os detalhes” ou “Não entendi o que essa mensagem quer dizer”.
>
> Durante as tarefas, posso ficar em silêncio para não influenciar suas escolhas. Se isso acontecer, continue falando o que está pensando. Se você me perguntar o que fazer, talvez eu não indique o caminho; quero observar o que o próprio aplicativo comunica. Você pode parar a sessão quando quiser. Posso fazer anotações? Você autoriza gravação de tela ou áudio? A gravação é opcional.

### Aquecimento de Think Aloud

Como os participantes não conhecem a técnica, faça um exercício de cerca de um minuto antes de abrir o Setlist. Não use telas nem palavras do produto nesse exercício.

1. Explique: “Vamos praticar falando o que você procura e espera, sem tentar dar a resposta certa.”
2. Dê uma situação cotidiana: “Imagine que você quer saber se uma loja abre aos domingos. O que procuraria primeiro e onde esperaria encontrar essa informação?”
3. Dê um exemplo curto de verbalização: “Eu procuraria o nome da loja; esperaria encontrar o horário junto das informações dela.”
4. Convide a pessoa a tentar com outra situação simples, como descobrir o horário de uma consulta num site. Agradeça e comece a sessão sem avaliar a resposta.

Se a pessoa ficar desconfortável falando em voz alta, não force. Continue observando as ações e use as perguntas retrospectivas depois das tarefas; registre essa adaptação nas notas.

### Impressão inicial e apresentação do produto

Depois do aquecimento, mostre a primeira tela prevista no estudo — preferencialmente a tela de login — e pergunte antes de explicar o produto:

> Pelo que você vê nesta tela, para que acha que serve este aplicativo? O que faria para começar?

Anote a resposta e pergunte qual texto ou elemento ajudou a formar essa impressão. Depois, dê o mesmo contexto curto a todas as pessoas:

> O Setlist é um aplicativo para bandas organizarem o repertório e prepararem shows em conjunto.

Essa apresentação dá contexto para as tarefas sem explicar onde ficam as funções nem como executá-las. Se a finalidade da primeira tela não fizer parte da pesquisa, a frase pode ser lida antes das tarefas, mas deve ser igual em todas as sessões.

### Perguntas breves de contexto

Faça antes das tarefas, sem apresentar nomes ou explicações do produto:

- Você já participou da organização de músicas, ensaios ou apresentações?
- Em quais aparelhos costuma usar aplicativos para organizar atividades?
- Com que frequência usa aplicativos novos sem receber instruções?

Não use as respostas para ensinar termos ou funções do Setlist.

## 10. Tarefas

Leia uma tarefa por vez. Não dê dicas nem corrija a pessoa durante a tentativa. Marque quando precisar usar uma pergunta de sondagem.

### Perfil A — Owner

| ID  | Enunciado a ler                                                                                                                                                      | O que observar                                                                                                                                           |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| O1  | “Você começou uma banda chamada Horizonte e quer organizar as músicas do grupo no Setlist. Crie a banda para começar.”                                               | Onde começa; como entende a criação; leitura e aceite do termo da banda; rótulos dos campos; entendimento da confirmação e próximo passo.                |
| O2  | “Rafa vai ajudar a atualizar músicas e shows, mas não deve administrar quem participa da banda. Convide essa pessoa com o acesso que você considera adequado.”       | Como encontra convites; se distingue Owner e Editor; se a explicação dos papéis basta para escolher; como percebe criação e compartilhamento do convite. |
| O3  | “A banda quer guardar uma música nova chamada `Luzes da Rua`, do artista `Horizonte`, para o próximo ensaio. Inclua-a no repertório e registre Tom `G` e BPM `120`.” | Onde espera criar uma música; se entende os nomes dos campos; como trata campos opcionais; como salva e percebe o resultado.                             |

Critérios de conclusão:

- **O1:** a banda foi criada e a pessoa chegou a uma área que reconhece como pertencente à banda.
- **O2:** um convite foi criado com permissões de edição de conteúdo, sem permissões de administração de integrantes.
- **O3:** a música aparece no repertório com título, Tom e BPM indicados.

### Perfil B — Editor convidado

Entregue um link de convite de teste válido, sem explicar em qual tela ele será aberto.

| ID  | Enunciado a ler                                                                                                               | O que observar                                                                                                                     |
| --- | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| E1  | “Você recebeu um convite da banda Horizonte para ajudar a manter músicas e shows antes do próximo ensaio. Entre na banda.”    | Se entende o convite e o login; se percebe a banda e o próprio papel; que expectativas cria sobre permissões.                      |
| E2  | “A banda combinou mudar o Tom de `Luzes da Rua` para `D`. Faça essa atualização e confirme se ela ficou salva.”               | Como encontra a música e a edição; se distingue leitura de edição; se entende `Tom`; se encontra salvar e percebe sucesso ou erro. |
| E3  | “A banda quer tocar `Luzes da Rua` no Ensaio aberto, logo depois de `Vento Norte`. Atualize a setlist e salve as alterações.” | Como encontra o show e a setlist; se entende inclusão e reordenação; se percebe alterações pendentes, salvamento e confirmação.    |

Critérios de conclusão:

- **E1:** a pessoa entra na banda e consegue identificar seu papel ou as ações disponíveis.
- **E2:** o Tom passa a `D` e a pessoa percebe que a alteração foi salva.
- **E3:** a música aparece na posição solicitada e as alterações ficam salvas.

Depois do E1, pergunte: “Pelo que você viu, que coisas acha que pode editar? E o que acha que não pode administrar?” Registre a resposta antes de explicar os papéis.

Se um enunciado exigir uma ação que não esteja disponível na versão testada, interrompa a tarefa, registre a divergência e não improvise outro fluxo durante a sessão.

## 11. Perguntas do moderador

### Durante a tarefa — sondagens neutras

Use somente quando a pessoa parar de verbalizar ou parecer sem saber como continuar:

- O que você está procurando agora?
- O que esperava que acontecesse?
- O que essa mensagem quer dizer para você?
- O que você tentaria em seguida?

Evite apontar para um elemento, ler um botão em voz alta, completar a frase ou dizer que uma escolha está certa.

Se a pessoa pedir ajuda, diga: “O que você faria se eu não estivesse aqui?” Se ainda não conseguir continuar, ajude para evitar desconforto e marque a tarefa como concluída com ajuda.

### Depois de cada tarefa

- O que nessa tarefa foi mais fácil?
- Em que momento ficou em dúvida?
- Teve algum texto, ícone ou nome que você interpretou de outro jeito?
- O que você achou que aconteceria ao acionar essa opção?
- De 1 a 5, quão confiante está de que concluiu a tarefa? O que causou essa nota?

Faça as perguntas depois da tentativa para não indicar o que a pessoa deve notar enquanto usa o app.

### Encerramento

- Qual foi a parte mais difícil ou inesperada?
- Houve alguma informação que você procurou e não encontrou?
- Que palavras ou rótulos você mudaria para entender melhor o app?
- Se pudesse melhorar uma coisa primeiro, o que escolheria?
- Há algo que o app fez que você não esperava?

Registre a opinião como opinião. Para priorizar uma mudança, procure ligá-la também a uma ação observada, uma hesitação ou uma interpretação concreta.

## 12. Folha de observação

Preencha uma cópia por participante e tarefa.

| Campo                              | Registro                                                     |
| ---------------------------------- | ------------------------------------------------------------ |
| Código do participante             | Ex.: O1, O2, E1; não registrar nome na planilha de achados   |
| Perfil e papel de teste            | Owner / Editor                                               |
| Plataforma e aparelho              | Web / Android / iOS; modelo se relevante                     |
| ID da tarefa                       | O1–O3 ou E1–E3                                               |
| Resultado                          | Sem ajuda / após sondagem / após ajuda direta / não concluiu |
| Primeiro lugar que procurou        | Elemento, tela ou área                                       |
| Hesitações e caminhos inesperados  | Ações observadas, em ordem                                   |
| Texto, ícone ou posição envolvidos | Usar o nome exibido ou descrever a localização               |
| Frase do participante              | Anotação breve; sem dados pessoais ou conteúdo real de banda |
| Confiança após a tarefa            | 1–5                                                          |
| Gravidade inicial                  | Bloqueador / alta / média / baixa                            |
| Observação ou hipótese             | Separar o que foi observado da interpretação do moderador    |

## 13. Classificação dos achados

- **Bloqueador:** a pessoa não consegue concluir uma tarefa central, entende incorretamente o papel ou corre risco de alterar algo diferente do que pretendia.
- **Alta:** conclui somente após ajuda direta, ou uma informação essencial está escondida ou mal interpretada.
- **Média:** conclui sem ajuda, mas hesita, escolhe caminho errado, volta atrás ou interpreta um rótulo de forma inesperada.
- **Baixa:** preferência ou refinamento visual sem impacto observado na conclusão ou no entendimento.

Ao consolidar, agrupe achados por tarefa, perfil, plataforma e elemento da interface. Dê prioridade a problemas observados em mais de uma sessão e a qualquer bloqueador mesmo se observado uma vez. Não trate uma preferência estética isolada como prova de falha de usabilidade.

## 14. Depois da rodada

1. Revise as notas no mesmo dia, enquanto os detalhes estão frescos.
2. Separe fatos observados, falas dos participantes e hipóteses da equipe.
3. Monte uma lista priorizada com o problema, evidência, perfil/plataforma, gravidade e ajuste sugerido.
4. Escolha até três problemas principais para corrigir primeiro.
5. Teste os fluxos alterados com participantes novos, especialmente se a mudança afetar papéis ou navegação.

O relatório da rodada deve registrar também o que não foi testado. Não generalize os resultados para todos os músicos, papéis ou dispositivos.

## 15. Fora do escopo desta rodada

- modo palco completo, que está adiado;
- sincronização de letras com YouTube;
- uso offline;
- comparação estatística de Web, Android e iOS;
- validação de regras de segurança do backend, que exige testes próprios.

## 16. Referência metodológica

- [Using moderated usability testing — GOV.UK Service Manual](https://www.gov.uk/service-manual/user-research/using-moderated-usability-testing): orientações para observar participantes executando tarefas, usar Think Aloud, criar tarefas com objetivos sem revelar a solução e explicar que a avaliação é do serviço.
