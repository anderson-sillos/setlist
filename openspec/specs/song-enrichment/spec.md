# song-enrichment Specification

## Purpose

Permitir completar o rascunho de uma música por uma busca externa explícita, escolhendo uma gravação compatível e aproveitando metadados e letra sem perder a edição existente ou acrescentar uma sequência de telas.

## Requirements

### Requirement: Ação contextual para completar música
O sistema SHALL oferecer um botão compacto com ícone de varinha no lado esquerdo do rodapé do formulário e manter Cancelar e Salvar agrupados à direita, em Nova música e Editar música, com nome acessível “Completar música”. A ação SHALL exigir título preenchido e os mesmos direitos de edição e aceite de termo do formulário.

#### Scenario: Acionar a varinha
- **WHEN** um Owner ou Editor com termo vigente aceito aciona a varinha com título preenchido
- **THEN** a pesquisa usa os valores atuais do rascunho e apresenta seu andamento em um popup único, sem navegar para outra tela

#### Scenario: Impedir pesquisa sem título ou em duplicidade
- **WHEN** o título está vazio ou já há pesquisa ou salvamento em andamento
- **THEN** a ação permanece indisponível e não dispara outra operação

### Requirement: Identificação pública configurada por ambiente
O sistema SHALL carregar o identificador público opcional por EXPO_PUBLIC_LRCLIB_APP_ID e enviá-lo no cabeçalho Lrclib-App-Id somente quando possuir valor após remoção de espaços nas extremidades. Sem valor, a busca SHALL continuar sem esse cabeçalho. O valor MUST NOT ser fixado no adaptador ou exposto em mensagens da interface.

#### Scenario: Consultar com a identificação configurada
- **WHEN** a pessoa inicia uma pesquisa em um aplicativo construído com o identificador definido
- **THEN** a requisição e suas eventuais retentativas incluem Lrclib-App-Id com o valor do ambiente e não transmitem esse identificador na URL

#### Scenario: Construir aplicações para ambientes diferentes
- **WHEN** desenvolvimento e produção recebem configurações de ambiente diferentes
- **THEN** cada aplicativo utiliza o identificador de seu próprio ambiente sem exigir edição do adaptador

#### Scenario: Não haver identificador configurado
- **WHEN** o identificador está ausente, vazio ou contém somente espaços
- **THEN** a pesquisa e suas retentativas continuam disponíveis com Lrclib-App-Id inteiramente ausente e a identificação pública de nome e versão preservada

#### Scenario: Normalizar um identificador preenchido
- **WHEN** o identificador configurado possui espaços nas extremidades
- **THEN** cada consulta e retentativa envia o valor sem esses espaços no cabeçalho Lrclib-App-Id

### Requirement: Correspondência e duração na classificação
O sistema SHALL classificar resultados pela correspondência de título, artista e versão e, entre gravações compatíveis, pela menor diferença absoluta da duração informada. A preferência por letra com tempos SHALL respeitar essa correspondência. A pesquisa MUST NOT apresentar o candidato como melhor entre todo o catálogo quando a resposta for limitada.

#### Scenario: Priorizar uma duração próxima
- **WHEN** duas gravações compatíveis têm durações diferentes e a música possui duração informada
- **THEN** a gravação mais próxima é apresentada primeiro, sem eliminar as demais apenas por diferença de tempo

#### Scenario: Evitar outra versão sincronizada
- **WHEN** uma gravação corresponde ao título, artista e versão e outra gravação diferente possui letra com tempos
- **THEN** a preferência por tempos não transforma a outra gravação em correspondência inequívoca

### Requirement: Seleção simples em um único painel
O sistema SHALL preencher diretamente um candidato inequívoco ou apresentar alternativas em um único painel sobre o formulário. Cada linha inteira SHALL ser selecionável e mostrar título e artista preservando a capitalização mista da fonte; nomes uniformemente em minúsculas ou maiúsculas (ignorando a inicial) SHALL receber capitalização de título pt-BR, preservando siglas e nomes curtos claramente estilizados. As linhas também SHALL mostrar álbum, duração e indicação de tempos quando disponíveis. Registros equivalentes SHALL ser agrupados sem esconder versões diferentes.

#### Scenario: Encontrar uma correspondência inequívoca
- **WHEN** título e artista correspondem a um único grupo de gravações equivalentes e não há decisão de duração pendente
- **THEN** o preenchimento acontece sem painel de confirmação intermediário

#### Scenario: Escolher entre alternativas
- **WHEN** os resultados contêm artistas ou gravações distintos, ou a correspondência é apenas aproximada
- **THEN** o painel apresenta o título “Escolha a gravação”, permite escolher tocando na linha e aplica o candidato sem botões de confirmação por item ou navegação adicional, salvo a decisão de duração no mesmo painel

#### Scenario: Pesquisar sem artista informado
- **WHEN** o artista está vazio e há candidatos por título
- **THEN** o painel permite confirmar o artista e a gravação antes de preencher, mesmo quando só um candidato foi retornado

#### Scenario: Consultar a lista em telas pequenas ou amplas
- **WHEN** o painel é apresentado em celular, tablet ou navegador
- **THEN** as alternativas ficam em uma lista rolável com largura adequada, ações alcançáveis e fechamento que preserva o formulário

### Requirement: Atualização dos nomes e preservação dos demais campos
Ao aplicar uma correspondência escolhida ou inequívoca, o sistema SHALL atualizar título e artista com os valores do resultado. O sistema SHALL preservar capitalização mista da fonte e aplicar capitalização de título pt-BR somente quando as letras estiverem uniformemente em minúsculas ou maiúsculas, ignorando a inicial; siglas e nomes curtos claramente estilizados SHALL manter a forma recebida. O sistema SHALL preencher duração somente quando vazia e letra somente quando não houver texto; SHALL preservar integralmente uma letra existente e os demais valores. A duração já preenchida SHALL mudar apenas pela escolha explícita de assumir a gravação. O sistema MUST NOT inventar tom, BPM, YouTube ou observações.

#### Scenario: Atualizar título e artista a partir do resultado
- **WHEN** a pessoa escolhe um resultado ou o sistema aplica uma correspondência inequívoca
- **THEN** os campos Título da música e Artista/Banda recebem os nomes do resultado, normalizados somente quando a capitalização da fonte for uniforme, mesmo que já contivessem valores
- **AND** a duração existente, a letra existente e os demais campos são preservados, salvo decisão explícita sobre duração

#### Scenario: Preservar capitalização intencional da fonte
- **WHEN** o título ou artista recebido já possui capitalização mista, como “System of a Down” ou “iOS”, ou identifica uma sigla claramente estilizada
- **THEN** o sistema mantém essa capitalização no formulário e na lista de resultados

#### Scenario: Normalizar nomes com capitalização uniforme
- **WHEN** as letras do nome recebido estão uniformemente em minúsculas ou maiúsculas, desconsiderando a inicial
- **THEN** o sistema aplica capitalização de título pt-BR, exceto a siglas e nomes curtos claramente estilizados

#### Scenario: Completar uma música parcialmente preenchida
- **WHEN** o artista e a letra estão vazios e há duração, tom, BPM, referência e observações informados
- **THEN** título e artista recebem os valores formatados do resultado, a letra é completada se estiver vazia e duração, tom, BPM, referência e observações existentes são preservados, sujeito à escolha explícita de duração

#### Scenario: Preservar uma letra já editada
- **WHEN** o rascunho possui letra com texto, com ou sem tempos
- **THEN** a ação não substitui, mistura ou sincroniza essa letra com conteúdo externo

#### Scenario: Limpar a letra manualmente
- **WHEN** a pessoa aciona o botão “Limpar letra” no cabeçalho do editor
- **THEN** todo o conteúdo textual e os blocos da letra são removidos do rascunho, o campo fica vazio e a música continua sem ser salva até a ação explícita de salvar

#### Scenario: Não haver campos elegíveis
- **WHEN** título e artista já correspondem aos valores formatados do resultado e duração e letra já estão preenchidas
- **THEN** o sistema informa essa condição sem modificar valores ou oferecer substituição da letra

### Requirement: Decisão contextual sobre a duração
O sistema SHALL tratar diferenças de até dois segundos como compatíveis. Ao importar LRC válido com diferença maior, SHALL oferecer no mesmo painel usar a duração da gravação e sincronizar ou manter a duração atual e importar somente texto estático. Sem duração informada, SHALL aproveitar uma duração válida da gravação escolhida.

#### Scenario: Manter uma duração compatível
- **WHEN** a duração informada difere em no máximo dois segundos e o LRC é válido
- **THEN** o sistema preserva a duração informada e importa os tempos, permitindo a classificação Sincronizada

#### Scenario: Assumir a duração da gravação
- **WHEN** a diferença supera dois segundos e a pessoa escolhe usar a duração da gravação
- **THEN** o rascunho recebe essa duração e a letra com tempos válidos, com classificação Sincronizada

#### Scenario: Manter a duração informada
- **WHEN** a diferença supera dois segundos e a pessoa escolhe manter sua duração
- **THEN** a duração é preservada e a letra recebida fica estática, com todos os tempos nulos

#### Scenario: Preencher uma duração ausente
- **WHEN** a duração está vazia e o candidato escolhido possui duração válida e LRC consistente
- **THEN** o sistema preenche a duração e a letra com tempos sem abrir uma decisão de diferença

#### Scenario: Não haver LRC aproveitável
- **WHEN** o candidato fornece somente texto estático ou seus tempos são inconsistentes
- **THEN** a importação de texto não marca a música como Sincronizada e não exige uma decisão para aceitar tempos inexistentes ou inválidos

### Requirement: Conversão consistente da letra recebida
O sistema SHALL transformar a letra em blocos e linhas próprios, com identificadores novos e tempos válidos em milissegundos quando aproveitados. A importação SHALL verificar conteúdo, duração e marcações, preservar separações e representar repetições de marcas do LRC sem inventar tempos. A presença de tempos MUST NOT ser apresentada como conferência automática do áudio ou vídeo.

A letra sincronizada SHALL aproveitar separações explícitas, inclusive marcadores vazios com horário, e parágrafos do texto simples quando toda a sequência textual corresponder à letra sincronizada. Na ausência de separações internas nessas fontes, o sistema SHALL criar blocos sem nome em pausas que atinjam o maior valor entre oito segundos e 2,5 vezes a mediana dos intervalos positivos, exigindo ao menos três intervalos. O sistema MUST NOT alterar texto ou tempos para inferir essas quebras nem atribuir rótulos de Verso/Refrão pela duração da pausa.

#### Scenario: Converter um LRC aproveitável
- **WHEN** o candidato possui texto e marcações consistentes com a duração da gravação
- **THEN** o documento importado possui linhas e tempos adequados ao modelo do app sem exibir as marcações técnicas como parte da letra

#### Scenario: Recuperar separações explícitas da gravação
- **WHEN** o LRC contém marcadores vazios com horário ou o texto simples possui parágrafos cuja sequência completa corresponde ao LRC ordenado
- **THEN** essas separações formam blocos sem nome na letra sincronizada sem criar blocos vazios ou modificar texto e tempos

#### Scenario: Exibir a separação de blocos sem nome
- **WHEN** a pessoa lê uma letra com blocos sem nome, representados no editor por linhas contendo somente “#”
- **THEN** os detalhes da música, a tela cheia e a leitura no palco exibem um espaço de estrofe entre os blocos, preservando todas as linhas sem mostrar o marcador do editor

#### Scenario: Inferir quebra visual por uma pausa maior
- **WHEN** nenhuma fonte fornece separações internas e há ao menos três intervalos positivos entre linhas, com uma pausa que atinge oito segundos e 2,5 vezes a mediana
- **THEN** a próxima linha textual inicia um novo bloco sem nome e a letra mantém sua classificação sincronizada

#### Scenario: Evitar separações sem evidência suficiente
- **WHEN** os intervalos são regulares, a pausa não alcança o limite ou há menos de três intervalos positivos
- **THEN** o conversor mantém as linhas no mesmo bloco quando não existem separações explícitas

#### Scenario: Descartar parágrafos de um texto diferente
- **WHEN** a quantidade ou a sequência de linhas do texto simples diverge da letra sincronizada
- **THEN** seus parágrafos não orientam os blocos sincronizados e apenas as separações do LRC ou a inferência por pausas podem ser usadas

#### Scenario: Detectar duração incompatível com os tempos
- **WHEN** um registro informa cinco segundos e contém marcações posteriores a duzentos segundos
- **THEN** esses tempos e essa duração não são aplicados automaticamente e o conteúdo textual utilizável pode ser oferecido como letra estática

#### Scenario: Encontrar uma gravação instrumental
- **WHEN** o registro escolhido é instrumental e não possui letra
- **THEN** o sistema não cria texto ou tempos fictícios e informa a condição preservando a edição

### Requirement: Origem persistida sem exposição técnica na interface
O sistema SHALL preservar metadados internos da origem da letra importada, incluindo registro, gravação, duração, instante de importação e aproveitamento ou descarte dos tempos. A origem SHALL sobreviver ao salvamento e à reabertura, sem impedir a leitura de músicas antigas. A interface MUST NOT exibir nome do fornecedor, IDs, endpoints ou códigos técnicos.

#### Scenario: Salvar e reabrir uma letra importada
- **WHEN** a pessoa salva e depois reabre a música
- **THEN** a letra, os tempos adotados e os metadados internos da importação são preservados sem apresentar a identificação técnica do fornecedor na tela

#### Scenario: Abrir uma música anterior à integração
- **WHEN** a música não possui metadados de importação
- **THEN** leitura e edição continuam funcionando sem exigir uma busca externa

### Requirement: Marcação explícita de música instrumental
O sistema SHALL permitir marcar manualmente uma música como instrumental no editor e persistir essa indicação em `lyric_status`. A ausência de texto ou de resultado de busca MUST NOT marcar uma música como instrumental. Um resultado externo SHALL marcar automaticamente a música apenas quando indicar instrumental explicitamente e o rascunho não possuir texto de letra. O status instrumental SHALL ser exibido nos detalhes e no palco, ficar fora do filtro Pendentes e não gerar aviso de letra na prontidão do show.

#### Scenario: Marcar manualmente uma música instrumental
- **WHEN** a pessoa ativa “Música instrumental” no editor
- **THEN** `lyric_status` passa a `instrumental` mesmo sem blocos ou linhas de letra

#### Scenario: Desmarcar a indicação instrumental
- **WHEN** a pessoa desativa “Música instrumental” e não há texto de letra
- **THEN** o status volta a Sem letra e a mudança permanece apenas no rascunho até salvar

#### Scenario: Não inferir instrumental pela ausência de letra
- **WHEN** uma música não tem letra e a pessoa não a marcou como instrumental nem selecionou resultado que indique isso
- **THEN** ela continua com status Sem letra e permanece no filtro Pendentes

#### Scenario: Reconhecer resultado explicitamente instrumental
- **WHEN** um resultado selecionado declara a gravação instrumental e o rascunho não tem texto de letra
- **THEN** o rascunho é marcado como Instrumental sem criar linhas fictícias e sem abrir uma escolha de duração para tempos indisponíveis

#### Scenario: Preservar letra existente ao selecionar resultado instrumental
- **WHEN** o resultado declara instrumental, mas o rascunho já contém texto de letra
- **THEN** o resultado não marca a música como instrumental nem substitui ou apaga o texto existente

#### Scenario: Tratar instrumental como preparado para o show
- **WHEN** uma música instrumental é incluída em um show
- **THEN** o filtro Pendentes a exclui, a lista de prontidão não a apresenta como problema de letra e os detalhes ou o palco indicam Instrumental

### Requirement: Feedback compacto e bem-humorado
O sistema SHALL mostrar em um popup único uma indicação compacta de cada etapa real, com frases musicais bem-humoradas de sentido equivalente, sorteadas por etapa e tentativa. O mesmo popup SHALL acomodar andamento, resultados, escolha de duração, falha e conclusão, sem empilhar modais. O texto SHALL informar estado e recuperação sem atrasos artificiais, percentuais fictícios ou divulgação do fornecedor.

#### Scenario: Acompanhar a operação
- **WHEN** a operação passa pelas etapas de consulta, comparação e validação
- **THEN** a mensagem do popup acompanha a etapa real e a roda segue o desenho do indicador de atualização já utilizado pelo app, sem ocultar a edição

#### Scenario: Encerrar o indicador de atividade
- **WHEN** a pesquisa termina, falha, é cancelada ou aguarda uma escolha da pessoa
- **THEN** o indicador de operação ativa para e a interface apresenta o resultado, a recuperação ou a seleção pertinente

#### Scenario: Anunciar o preenchimento concluído
- **WHEN** os campos elegíveis foram preenchidos
- **THEN** a janela apresenta o título “Pesquisa concluída” e uma confirmação breve e bem-humorada informa o que mudou e se a letra ficou estática ou sincronizada, sem afirmar que a música já foi salva

#### Scenario: Fechar a confirmação da pesquisa
- **WHEN** a pesquisa é concluída e o resumo de preenchimento está visível
- **THEN** a pessoa pode fechar a confirmação por um botão primário centralizado “OK”, que encerra o popup sem salvar a música

#### Scenario: Variar as frases sem mudar o estado comunicado
- **WHEN** uma etapa ou retentativa começa
- **THEN** a mensagem é sorteada entre pelo menos cinco alternativas de mesmo sentido para aquele estado, com humor de ensaio, karaokê ou sofrência e evitando repetição consecutiva quando houver alternativa
- **AND** a frase permanece estável entre eventos, inclusive durante renderizações e atualizações da contagem regressiva

#### Scenario: Preservar informação objetiva durante o sorteio
- **WHEN** uma frase bem-humorada é apresentada na espera entre tentativas
- **THEN** a mensagem mantém visíveis o número correto da próxima tentativa, o limite total e o tempo restante, sem sugerir conclusão ou salvamento

### Requirement: Recuperação limitada de indisponibilidade
O sistema SHALL executar no máximo três tentativas totais por pesquisa diante de HTTP 503, respeitar Retry-After e usar espera progressiva de aproximadamente dois e quatro segundos quando o cabeçalho não existir. A espera SHALL indicar próxima tentativa e tempo restante em linguagem bem-humorada. Após esgotamento, SHALL haver ação Tentar novamente sem perda do rascunho.

#### Scenario: Recuperar na segunda tentativa
- **WHEN** a primeira tentativa recebe 503 e a segunda é bem-sucedida
- **THEN** o sistema informa a espera, realiza duas chamadas e continua a seleção ou o preenchimento sem iniciar a terceira

#### Scenario: Esgotar as tentativas
- **WHEN** as três tentativas recebem 503
- **THEN** o sistema para as chamadas automáticas, apresenta falha recuperável e permite iniciar outra pesquisa explicitamente

#### Scenario: Respeitar a espera indicada pelo serviço
- **WHEN** uma resposta recuperável contém Retry-After válido
- **THEN** nenhuma retentativa acontece antes desse prazo e a espera pode ser interrompida ao abandonar a pesquisa

### Requirement: Estados de ausência e falha distintos
O sistema SHALL distinguir lista vazia, indisponibilidade, timeout, limite de acesso e resposta inválida, mantendo o formulário editável. Ausência de resultado SHALL orientar ajuste de título ou artista, enquanto falhas SHALL oferecer recuperação sem nomes de fornecedor, códigos HTTP ou detalhes técnicos na mensagem.

#### Scenario: Pesquisa concluída sem candidatos
- **WHEN** o serviço devolve uma resposta válida sem registros
- **THEN** a janela apresenta o título “Nenhum resultado” e a mensagem informa que não houve correspondência e orienta ajustar título ou artista, sem declarar falha de conexão
- **AND** um botão primário centralizado “OK” fecha o popup sem alterar ou salvar o rascunho

#### Scenario: Rejeição ou resposta inválida
- **WHEN** a busca não conclui por limite, timeout ou resposta inválida
- **THEN** a falha é contextual, não preenche campos e não é apresentada como música ausente

### Requirement: Pesquisa vinculada ao rascunho vigente
O sistema SHALL impedir que respostas antigas ou retentativas abandonadas alterem o formulário. Sair da edição ou mudar título, artista ou duração durante a busca SHALL invalidar a operação correspondente. A ação MUST NOT pesquisar novamente apenas por digitação, abertura da tela, retorno de foco ou atualização de dados compartilhados.

#### Scenario: Alterar dados durante a pesquisa
- **WHEN** título, artista ou duração muda antes da aplicação
- **THEN** resultados e decisões da pesquisa anterior não são aplicados ao novo contexto

#### Scenario: Editar a letra enquanto aguarda
- **WHEN** a pessoa preenche a letra antes de a resposta chegar
- **THEN** o preenchimento reavalia o rascunho atual e preserva esse conteúdo

#### Scenario: Sair durante espera ou requisição
- **WHEN** a pessoa abandona a edição durante consulta ou espera entre tentativas
- **THEN** a operação é cancelada e respostas tardias não modificam outra tela ou música

#### Scenario: Iniciar uma nova pesquisa após editar o rascunho
- **WHEN** uma pesquisa anterior terminou e a pessoa altera o título, o artista ou a duração e aciona novamente a varinha
- **THEN** uma nova pesquisa começa com os valores atuais do rascunho e um novo ciclo de tentativas, sem reutilizar resultados da pesquisa anterior

### Requirement: Salvamento explícito e proteção existentes
O sistema SHALL aplicar o resultado somente ao rascunho e persistir alterações apenas por Salvar música. O cancelamento e a proteção de alterações não salvas SHALL continuar disponíveis. A interface MUST NOT acrescentar botão Desfazer ou gravar automaticamente por causa da pesquisa.

#### Scenario: Cancelar uma edição preenchida pela busca
- **WHEN** a pessoa descarta a edição depois de completar campos
- **THEN** nenhuma dessas alterações é persistida e a versão anterior permanece intacta

#### Scenario: Salvar uma duração substituída
- **WHEN** a pessoa salva uma alteração de duração aceita no painel
- **THEN** a gravação e a atualização dos resumos dependentes seguem o fluxo normal de edição da música

### Requirement: Integração restrita e responsabilidade pelo conteúdo
O sistema SHALL consultar somente a API oficial para obter conteúdo e manter as exigências de autorização sobre letras, moderação e isolamento por banda. Dados de sessão, letra já existente, observações e identificadores da banda MUST NOT ser enviados ao fornecedor. O app MUST NOT publicar as edições da banda no serviço externo.

#### Scenario: Consultar a fonte externa
- **WHEN** a pessoa solicita completar uma música
- **THEN** a consulta transmite somente os metadados de pesquisa necessários e a identificação pública do aplicativo, sem credenciais ou conteúdo privado da banda

#### Scenario: Salvar conteúdo importado
- **WHEN** a pessoa solicita salvar o rascunho preenchido
- **THEN** o conteúdo passa pelas permissões, pelo termo e pela moderação existentes e permanece restrito à banda
