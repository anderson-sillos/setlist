# Design

## Context

Ver `proposal.md` para motivação e `specs/song-enrichment/spec.md` para o contrato de comportamento.

- `SongEditorScreen.tsx` atende criação e edição, mantém `editedValues` e `editedLyrics`, calcula alterações pendentes e grava somente em `handleSave`. Owner/Editor e aceite do termo já são exigidos.
- `songEditorForm.ts` separa duração estimada, artista, tom, BPM, YouTube e observações. O artista sugerido atualmente vem das músicas da banda; esse autocomplete continua independente da nova busca.
- `LyricDocument` comporta blocos, linhas e `startTimeMs`. A classificação de `deriveLyricStatus` é estrutural e também é calculada no banco. Não representa conferência de um áudio.
- `lyricEditorText.ts` preserva IDs e tempos por posição ao editar. Não serve para substituir uma letra por texto externo reaproveitando o documento anterior.
- `songMutations.ts` e `songRepository.ts` atualmente reconstroem documentos contendo apenas `blocks`; ambos descartariam metadados opcionais de origem sem ajuste.
- A marca instrumental é persistida diretamente como `lyric_status = 'instrumental'`; o documento JSON da letra continua contendo somente blocos e metadados de origem. As migrations adicionam o novo valor do enum e ajustam a constraint para aceitar esse estado, mesmo que `derive_lyric_status` identifique o documento vazio como `missing`.
- `ScreenDataRefresh.tsx` usa `ActivityIndicator` pequeno no controle web e `RefreshControl` nativo nos dispositivos móveis. O desenho da roda já pode orientar o novo estado ocupado.
- A pesquisa real mostrou versões repetidas, registros inconsistentes e respostas 503. A API devolve até vinte registros com letras completas e não oferece paginação. As observações não constituem medição de cobertura ou garantia de disponibilidade.

## Goals / Non-Goals

**Goals:**

- Separar transporte, análise dos candidatos, conversão da letra e apresentação para possibilitar validação determinística.
- Integrar o resultado ao rascunho atual sem outro salvamento, sem registro público de conteúdo e sem dependência da busca para editar manualmente.
- Manter uma interface compacta, com a ação no rodapé do formulário e um só popup que comunique andamento, seleção e resultado.

**Non-Goals:**

- Autocomplete externo a cada tecla, catálogo completo de artistas, busca aproximada por inteligência artificial, scraping, sincronização entre aparelhos ou publicação de letras no fornecedor.
- Preencher tom, BPM ou link de vídeo, substituir letra existente ou completar seus tempos por semelhança de linhas.
- Implementar o player/editor de sincronização ou o acompanhamento automático do modo palco, ainda pendentes na change do MVP.
- Criar credenciais pessoais do usuário, backend intermediário, SDK nativo, download de áudio ou nova política de licenciamento.

## Decisions

### 1. Adaptador isolado e busca explícita

Criar um adaptador em `src/data/lrclib/` e funções de domínio da integração em `src/features/repertoire/enrichment/`. Usar `fetch` contra base fixa `https://lrclib.net`, com parâmetros codificados e identificação `Lrclib-Client: Setlist/<versão> (https://setlistbr.app.br)`, obtendo a versão de `getAppReleaseInfo`.

Ler o identificador público por acesso estático `process.env.EXPO_PUBLIC_LRCLIB_APP_ID`, compatível com a inclusão de variáveis pelo Expo. O valor informado para configurar os ambientes é:

```dotenv
EXPO_PUBLIC_LRCLIB_APP_ID=KimtAF-BYq41SRf-BC-Zx9WsNZ2ukwEDmsAJea0EWPg
```

Normalizar o valor com `trim()` e adicionar a cada consulta e retentativa o cabeçalho `Lrclib-App-Id` somente quando o resultado não estiver vazio, preservando também `Lrclib-Client` para identificação de nome e versão. Não usar o ID como parâmetro de URL, token Bearer ou literal de fallback no adaptador. O identificador é público e estará no bundle quando configurado, mas não será exibido nos textos do cliente. Chaves secretas de acesso de servidor não pertencem a essa configuração.

Na implementação, configurar `.env.local` para desenvolvimento, incluir a chave nos modelos `.env.development.example` e `.env.production.example`, definir seu valor público nos ambientes EAS `development` e `production` e injetar a variável em `.github/workflows/pages.yml` por `vars.EXPO_PUBLIC_LRCLIB_APP_ID`. Não registrar `.env.local` no Git. Alterações nessa variável precisam alcançar um novo bundle/export/build; mudar somente o ambiente depois da compilação não atualiza aplicativos já distribuídos.

Se o valor estiver ausente, vazio ou contiver somente espaços, omitir inteiramente `Lrclib-App-Id` e manter a busca disponível no modo sem Application ID, preservando a identificação por `Lrclib-Client` e o mesmo tratamento de limites e falhas. Não enviar valores vazios, `undefined` ou `null` como texto. Se um identificador configurado for rejeitado, produzir falha recuperável no cliente e diagnóstico técnico interno, sem retirar silenciosamente o cabeçalho para contornar a rejeição ou solicitar credenciais pessoais.

O documento público [API integration authorization para Setlist](https://lrclib.net/developers/authorizations/KimtAF-BYq41SRf-BC-Zx9WsNZ2ukwEDmsAJea0EWPg) foi consultado em 24/10/2026 pelo endpoint público utilizado pela própria página. Identifica o aplicativo Setlist, cobre web, iOS e Android e remete aos termos de 30/09/2026. A autorização é para uso da API; não equivale a licença das letras ou garantia de aprovação nas lojas. Guardar apenas a referência na documentação técnica, sem acrescentar outra tela ou mensagem de fornecedor ao produto.

Cada tentativa usa uma chamada a `/api/search` com `track_name` e, se preenchido, `artist_name`. Não enviar `q` junto desses filtros. O campo de duração do formulário classifica localmente os resultados; não restringe a busca a um intervalo que excluiria versões próximas. `/api/get` não é o mecanismo de classificação: tem seleção única e não garante o menor desvio de duração. Como a busca já inclui a letra, selecionar um item não exige outra consulta.

Interpretar status e cabeçalhos antes de exigir JSON: uma resposta de erro de borda pode não ser JSON e ainda precisar da política de retentativas. Nas respostas bem-sucedidas, validar JSON e os campos consumidos, admitir letra simples ou sincronizada nula e limitar o tratamento ao conjunto retornado. Não consumir páginas HTML ou YAML na primeira implementação. Enviar apenas metadados necessários e identificação pública; não reutilizar o cliente Supabase, seus tokens ou os cabeçalhos de sessão. O fornecedor e seus identificadores ficam no código, nos diagnósticos internos e na origem persistida, não na UI.

Alternativa considerada: proxy em função Supabase. Adiciona infraestrutura e concentra chamadas; não é necessário para a leitura pública inicial. O adaptador permite essa troca futura sem alterar a tela.

### 2. Classificação explicável e agrupamento conservador

Normalizar caixa, diacríticos, pontuação e espaços para comparar nomes, preservando os termos que identificam ao vivo, acústico, remix e outras versões. A classificação segue: correspondência de título/artista/versão, menor diferença absoluta de duração entre gravações compatíveis e, como desempate, disponibilidade de LRC consistente. Não mostrar percentuais artificiais de confiança.

Agrupar somente registros com título e artista equivalentes, duração compatível e conteúdo de letra e tempos equivalentes; álbuns diferentes podem representar compilações da mesma gravação. Não agrupar versões apenas por título e artista. Um candidato inconsistente não é elegível para aplicação automática; seu texto utilizável pode ser apresentado como alternativa estática, sem adotar duração inconsistente.

Aplicar automaticamente apenas quando título e artista preenchidos correspondem a um único grupo válido e não há decisão de duração. Artista ausente, correspondência parcial ou versões distintas levam à lista. A tolerância inicial de compatibilidade é uma constante de 2.000 ms, alinhada ao arredondamento discutido; converter valores da API para milissegundos antes da comparação. O resultado é o melhor entre os registros recebidos, não uma garantia sobre todo o catálogo.

Alternativa considerada: usar sempre o primeiro registro ou priorizar qualquer LRC. Não distingue gravações e reproduz as inconsistências observadas.

### 3. Ação no rodapé e popup único

Adicionar a varinha como ação compacta no lado esquerdo do rodapé do formulário e manter Cancelar e Salvar agrupados e alinhados à direita, com nome acessível “Completar música”. Em telas estreitas, permitir que o grupo de ações à direita quebre linha sem deslocar a varinha do lado esquerdo. Respeitar alvo mínimo de toque, fonte ampliada e tokens existentes. Desabilitar a ação sem título, durante outra busca e durante salvamento. O botão inicia a operação; o feedback não ocupa espaço permanente junto ao título.

Reusar `OptionSheet` como popup responsivo único para andamento, resultados, decisão de duração, falhas e confirmação. Não criar uma janela de progresso que abra outra janela de seleção, nem uma rota nova. Durante a consulta, o popup mostra a roda de atividade e a frase da etapa. Cada linha clicável usa duas linhas de texto: título e artista com a capitalização original da fonte; quando as letras forem uniformemente minúsculas ou maiúsculas (ignorando a inicial), aplicar capitalização de título pt-BR, preservando siglas e grafias intencionais como “iOS”. Mostrar também álbum, duração e “Letra sincronizada” ou “Letra estática”. Não expor fornecedor, IDs, pontuações ou filtros avançados. Tocar no resultado atualiza o conteúdo do mesmo popup, exceto quando não há decisão pendente e a conclusão pode ser apresentada ali. Fechar preserva o rascunho, cancela a operação ativa e devolve o foco ao botão do rodapé.

Quando já existe duração e a letra vazia pode receber um LRC válido, uma diferença superior a dois segundos troca o conteúdo do mesmo popup pela comparação objetiva e duas ações:

- “Usar 4:17 e sincronizar”: substitui explicitamente a duração e adota os tempos.
- “Manter 4:00 e importar texto”: mantém a duração e cria linhas com tempos nulos.

Os números são dinâmicos. Não criar essa decisão se a letra existente será preservada ou se não há LRC aproveitável. O popup continua podendo ser fechado sem aplicação.

### 4. Conversão de letra e compatibilidade de duração

Criar um conversor próprio para produzir `LyricDocument` com UUIDs novos. Não inserir as marcações LRC no campo de texto do editor nem reutilizar o documento anterior para associar tempos.

O conversor trata quebras de linha, separações de estrofe, frações de segundo, marcas múltiplas na mesma linha e metadados/offset de LRC. Expandir ocorrências repetidas e ordenar cronologicamente sua representação antes de validar os tempos resultantes. Valores negativos, não finitos, marcações sem conteúdo aproveitável, linhas textuais sem tempos necessários ou tempos incompatíveis com a duração invalidam o aproveitamento como sincronizada. Permitir a tolerância de dois segundos para arredondamento no fim da gravação; não corrigir dados incoerentes inventando duração ou tempos.

Na letra sincronizada, preservar quebras de linha vazias e marcadores LRC com horário e texto vazio como separações antes da próxima linha textual. Reaproveitar também os parágrafos de `plainLyrics` somente quando todas as linhas corresponderem, em quantidade e sequência, às linhas LRC expandidas e ordenadas; comparar caixa e espaços normalizados sem alterar o texto importado. Descartar o alinhamento por parágrafos quando o conteúdo divergir, evitando associar a estrutura de outra versão.

Quando nenhuma dessas fontes fornecer separação interna, inferir pausas comparando os intervalos positivos entre inícios de linhas. Exigir pelo menos três intervalos para calcular a mediana e criar uma quebra somente quando o intervalo atingir o maior valor entre oito segundos e 2,5 vezes essa mediana. Intervalos iguais a zero não entram na referência. Produzir blocos sem nome, mantendo texto e tempos originais, sem acrescentar linhas textuais fictícias ou classificar semanticamente Verso/Refrão. Essa inferência é uma organização visual conservadora e não garante identificar todas as estrofes.

A leitura deve reservar espaçamento próprio entre os blocos, inclusive quando não têm nome e aparecem no editor apenas com “#”. `SongLyricsContent` controla essa distância no próprio contêiner para os detalhes da música e a tela cheia; a leitura no palco aplica o mesmo princípio. Usar uma distância de estrofe maior que a distância entre linhas, ampliada na tela cheia, sem depender do espaçamento do cartão externo ou inserir texto e tempos no documento.

Quando o LRC não pode ser aproveitado, usar o texto simples disponível ou extrair seu conteúdo textual para importação estática. A origem marca que os tempos foram descartados. Registros instrumentais não geram letra fictícia.

| Duração no rascunho | LRC | Aplicação |
| --- | --- | --- |
| Vazia | Válido, com duração de gravação válida | Preencher duração e letra com tempos. |
| Preenchida, diferença até 2 s | Válido | Preservar duração e importar tempos. |
| Preenchida, diferença maior que 2 s | Válido | Pedir a decisão no mesmo painel. |
| Qualquer | Ausente ou inconsistente | Importar texto estático; preservar duração existente. |

Ao usar somente texto, todos os `startTimeMs` são nulos. Assim, o cálculo de status produz `static`. Tempos válidos adotados produzem `synchronized`; esse significado é estrutural e não promete equivalência automática com um vídeo. `instrumental` é escolhido explicitamente no editor ou após selecionar resultado que o declare, e é salvo em `lyric_status`; documento vazio sem essa escolha continua `missing`. O metadado `instrumental: true` do resultado pode marcar a música apenas se o rascunho não tiver texto de letra. Não se criam blocos ou versos fictícios. Ao inserir texto cantado, o editor remove a marca no rascunho.

### 5. Preenchimento e origem no documento

Ao aplicar uma correspondência escolhida ou inequívoca, definir título e artista a partir do resultado. Preservar a capitalização mista da fonte e aplicar capitalização de título pt-BR somente a nomes uniformemente em minúsculas ou maiúsculas (ignorando a inicial), mantendo siglas e nomes curtos claramente estilizados. Completar duração apenas quando vazia e letra apenas quando não há texto; a escolha de assumir duração é a única substituição da duração existente e é vinculada ao valor que a pessoa acabou de comparar. Letras com pelo menos uma linha textual permanecem intactas, assim como tom, BPM, YouTube e observações.

O cabeçalho do campo multilinha da letra inclui um botão compacto “Limpar letra” no lado direito quando há conteúdo, usando o mesmo ícone circular de fechar e alvo ampliado do campo de busca. A ação esvazia o texto e os blocos no rascunho, sem salvar a música.

Acrescentar ao `LyricDocument` um atributo opcional de origem, com fornecedor interno, ID do registro, título/artista/álbum da gravação, duração original em ms quando disponível, instante ISO de importação e modo adotado (`lrc` ou `plain`, inclusive quando os tempos foram recusados). Não armazenar resposta completa, HTML ou cópias adicionais das letras. A origem é referência histórica, não certificação autoral ou declaração de que edições posteriores são idênticas à fonte.

Atualizar validação e serialização em `songMutations.ts`, leitura em `songRepository.ts` e helpers de edição para preservar esse atributo, aceitando documentos antigos sem ele. Ler metadados desconhecidos ou malformados de forma defensiva sem tornar uma letra antiga ilegível. Os resumos do repertório continuam sem buscar letras para exibir listas.

Alternativa considerada: preencher Observações com a fonte ou criar uma tabela de importações. A primeira modifica conteúdo do usuário e expõe o fornecedor; a segunda não é necessária para a origem de uma única letra vigente.

### 6. Estado da operação e preservação da edição

Manter um controlador local: `idle`, `preparing`, `searching`, `retry-wait`, `ranking`, `selecting`, `duration-choice`, `validating`, `applying`, `completed`, `empty` e `failed`. Estados de escolha não exibem operação ativa. São passos reais; os estados rápidos não recebem duração artificial.

Cada pesquisa captura identidade da música e valores de título, artista e duração. Alterações desses valores durante uma operação, saída da tela, perda de permissão ou nova operação cancelam a requisição/espera com `AbortController` e invalidam seu identificador. Depois que a operação termina ou é fechada, a pessoa pode editar o rascunho e iniciar uma nova pesquisa explícita, que usa os valores atuais e reinicia a contagem de tentativas. A substituição de duração decidida no painel precisa distinguir a aplicação interna da edição que invalida a busca. Reavaliar a letra no rascunho mais recente antes de aplicar, evitando sobrescrever uma letra digitada enquanto a chamada aguardava.

Não registrar essa operação como consulta de atualização em `useScreenDataRefresh`; retorno de foco e atualização compartilhada não disparam enriquecimento. Aplicar o resultado integra os mecanismos existentes de dirty state, confirmação de descarte e salvamento. Não acrescentar Desfazer. Fechar a lista, falhar ou cancelar não realiza gravações.

### 7. Roda de atualização e frases aleatórias por etapa

Usar no popup a mesma linguagem visual da roda de `ScreenDataRefresh.tsx`: `ActivityIndicator` pequeno, cor semântica e dimensões fixas. A varinha do rodapé permanece desabilitada enquanto a operação estiver ativa; o indicador aparece junto ao feedback no popup. No móvel, preservar a coerência com o indicador nativo usado pelo refresh; não inserir `RefreshControl` nem ligar a ação à atualização da tela. Não reutilizar `WebRefreshButton` diretamente, pois ele é restrito à web e representa outra operação.

O popup mostra a frase atual e os controles pertinentes à etapa. Manter um catálogo tipado com pelo menos cinco alternativas por estado apresentado, inclusive espera, ausência e falha. Usar humor de ensaio, karaokê e sofrência, com indicação clara da etapa e da ação necessária. Sortear uma variante ao entrar no estado ou numa nova tentativa, evitando repetição consecutiva naquele estado; não sortear em cada renderização ou segundo da contagem regressiva. Injetar o gerador de aleatoriedade para verificações determinísticas. Não exigir que toda execução produza uma frase inédita, apenas que as alternativas possam ser selecionadas.

Catálogo inicial de redação, com sentido equivalente dentro de cada linha:

| Etapa | Alternativas |
| --- | --- |
| Preparação | “Afinando a busca… hoje até o vizinho vai pedir bis.”; “Preparando a pesquisa… o baterista jurou que já chega.”; “Abrindo os trabalhos da busca… alguém viu o cabo da varinha?”; “Passando o som da pesquisa… alô, um, dois, sofrência.”; “Preparando a busca… a varinha pediu só um cafezinho.” |
| Consulta | “Procurando a música… até debaixo do tapete do camarim.”; “Caçando essa música… mais difícil que achar palheta no palco.”; “Buscando a faixa… sem mandar mensagem para o ex, por enquanto.”; “Vasculhando o repertório… alguém deve lembrar além do ‘na-na-ná’.”; “Procurando a faixa… antes que o tio do churrasco peça Evidências.” |
| Comparação | “Comparando as versões… separando o original do primo que canta igual.”; “Conferindo as gravações… até o ‘ao vivo’ precisa mostrar documento.”; “Comparando os resultados… sem confundir o bis com o remix do churrasco.”; “Organizando as versões… cada gravação quer puxar o próprio solo.”; “Conferindo os candidatos… o júri da sofrência está reunido.” |
| Seleção | “A busca formou uma banda. Escolha a gravação que vai cantar com você.”; “Tem versão querendo carreira solo. Escolha a que você procurava.”; “O karaokê abriu audição. Escolha a gravação certa para o repertório.”; “Qual dessas vai ganhar o bis? Toque na gravação que você quer.”; “Agora o jurado é você. Escolha a gravação antes de soltar o gogó.” |
| Decisão de duração | “O relógio desafinou: as durações diferem. Escolha como importar.”; “Uma versão pediu bis no cronômetro. Escolha qual duração usar.”; “Tem mais de um tempo nessa sofrência. Escolha como importar.”; “Até o relógio quis fazer um solo. As durações diferem; escolha como seguir.”; “O cronômetro e a gravação não combinaram o ensaio. Escolha a duração.” |
| Validação | “Conferindo letra e tempos… vírgula fora do lugar também desafina.”; “Checando os versos… para a sofrência não entrar antes da hora.”; “Conferindo as marcações… até lágrima precisa entrar no compasso.”; “Revisando letra e tempos… o fiscal do karaokê chegou.”; “Checando a letra… o refrão não vai furar a fila dos versos.” |
| Preenchimento | “Preenchendo os campos… cada dado no seu quadrado e a dor no peito.”; “Organizando o rascunho… para o refrão não morar na casa do artista.”; “Preenchendo os campos… se a varinha pagasse boleto, era perfeição.”; “Colocando os dados no lugar… desembaraçando tudo como cabo depois do show.”; “Montando o rascunho… o resto do espetáculo fica por sua conta.” |
| Espera entre tentativas | “A busca fez uma pausa dramática. Aguarde a próxima tentativa.”; “O bis está no camarim. Aguarde a contagem para a próxima tentativa.”; “O palco está mais concorrido que karaokê de firma. Aguarde a próxima tentativa.”; “A varinha pediu um intervalo para o café. Aguarde a próxima tentativa.”; “Até o solo precisa respirar. Aguarde a próxima tentativa da busca.” |
| Sem resultado | “Essa deu perdido igual palheta emprestada. Confira título e artista.”; “Nem o tio do churrasco lembrou dessa. Confira título e artista.”; “A música fez carreira solo e sumiu da busca. Revise título e artista.”; “Essa escapou pela saída de emergência. Tente outro título ou artista.”; “A busca ficou no ‘na-na-ná’. Nenhum resultado; confira título e artista.” |
| Falha | “A busca tropeçou no cabo. Não foi possível concluir; tente novamente.”; “O amplificador da pesquisa ficou mudo. Tente a busca novamente.”; “A varinha desafinou no solo. Não foi possível concluir; tente novamente.”; “O bis deu microfonia. A busca falhou; tente novamente.”; “A pesquisa saiu do tom e pediu outra chance. Tente novamente.” |
| Conclusão | “Essa é de arrastar o chifre no asfalto! Confere os campos antes de sofrer no tom errado.”; “Encontramos! Confira os dados e avise o vizinho que hoje tem show.”; “Busca concluída! Revise os campos; a terapia em forma de refrão é com você.”; “Tá na mão! Confere o rascunho antes de soltar a voz e prender o choro.”; “Busca afinada! Confira os campos. O refrão é da música; a indireta é por sua conta.”; “Essa é massa! Confere os campos e prepara o gogó: o próximo bis já tem candidata.”; “Classicão! Confere os dados antes de pôr três gerações para cantar junto.”; “Essa é pedrada! Confira o rascunho antes de testar a resistência do telhado.”; “Essa merece air guitar até com vassoura! Revise os campos antes do solo.”; “Essa tira até o tímido da cadeira! Confere os dados antes de puxar o coro.” |

Na espera, acrescentar objetivamente “Tentativa 2 de 3 em 2 segundos…”, com valores reais. Na conclusão, usar o título “Pesquisa concluída” e acrescentar resumo curto dos campos alterados e do estado da letra, com botão primário centralizado “OK” que encerra a confirmação sem salvar a música. Para instrumental, duração diferente ou nenhuma lacuna a preencher, usar mensagens específicas claras, mantendo o mesmo tom e sem afirmar um preenchimento que não ocorreu. Nome do fornecedor, endpoints, códigos HTTP e IDs não aparecem em textos visíveis, tooltips ou anúncios de acessibilidade.

Quando não houver resultados, usar o título “Nenhum resultado”, manter a orientação para revisar título e artista e oferecer o mesmo botão primário centralizado “OK” para fechar o popup sem alterar o rascunho.

Os anúncios acessíveis ocorrem por mudança de etapa ou tentativa, sem repetir a frase em cada segundo. Não mover o foco para a mensagem. Interromper o indicador em conclusão, ausência, falha, cancelamento e espera por escolha.

### 8. Retentativas e diagnósticos limitados

Centralizar o orçamento no adaptador: até três chamadas reais por ciclo, uma inicial e duas retentativas para 503. Desabilitar retentativas adicionais de qualquer wrapper de consultas. Usar timeout por tentativa de dez segundos como padrão técnico inicial e tratar cancelamento separadamente de erro.

Interpretar `Retry-After` numérico ou em data HTTP; nunca repetir antes do prazo. Sem cabeçalho válido, aguardar dois e quatro segundos, podendo acrescentar pequena variação positiva. A contagem regressiva não escolhe frases novas. Uma resposta bem-sucedida interrompe as retentativas imediatamente. Rede, timeout, resposta inválida e demais erros não entram em repetição automática silenciosa; após falha oferecer Tentar novamente. Em 429, respeitar o prazo indicado antes de liberar nova consulta, sem tratar o limite como ausência de música.

Registrar somente metadados técnicos necessários, como etapa, status, duração e tentativa, sem letra, observações, tokens ou corpo integral. Uma lista vazia válida produz `empty`; falha HTTP ou de parsing produz `failed`. Não pesquisar continuamente quando não houver resultados.

## Risks / Trade-offs

- **Dados incoerentes ou gravação errada:** validar conteúdo/duração, priorizar correspondência e apresentar alternativas; classificação não comprova adequação do áudio.
- **Respostas limitadas e indisponibilidade:** declarar internamente a seleção como melhor entre candidatos retornados, manter edição manual e aplicar recuperação limitada.
- **Humor obscurecer a ação:** catálogo por estado, informação objetiva de recuperação e contagem real; não apresentar metáforas de escuta ou salvamento como operações executadas.
- **Perder origem em serialização ou edição:** atualizar leitura, escrita e helpers conjuntamente, com round-trip de documentos antigos e importados.
- **Confundir importação com licença:** os Termos de Uso esclarecem que a busca externa fornece apenas sugestões e não confirma autoria, exatidão, domínio público, licença ou autorização; a pessoa continua responsável por confirmar os direitos antes de salvar ou compartilhar. Manter moderação e isolamento existentes.
- **Regra antiga do piloto:** `Fontes de letras no piloto` em `definir-mvp-setlist/specs/lyric-timing/spec.md` e a nota correspondente do design excluem importação automática. Esta change é evolução explícita desse escopo; a conciliação documental é uma tarefa anterior à integração, sem reabrir sincronização manual ou modo palco.

## Migration Plan

1. Na implementação, conciliar a restrição antiga do piloto na fonte que estiver vigente: hoje o rascunho `definir-mvp-setlist`, ou a spec canônica se ele já tiver sido sincronizado. Limitar a alteração à exceção da importação por esta ação e manter as responsabilidades sobre conteúdo.
2. Implementar os artefatos técnicos e UI em TypeScript e acrescentar duas migrations SQL sequenciais: primeiro o novo valor do enum, depois a exceção da constraint de consistência para `instrumental`.
3. Conferir os cenários de seleção, duração, mensagens, retentativas, cancelamento e salvamento nas três plataformas antes da integração.
4. Em eventual retirada da funcionalidade, remover a ação e a consulta externa; letras já salvas continuam documentos normais. O status permanece explícito em `lyric_status`.

Referências técnicas consultadas em 24/10/2026: [API](https://lrclib.net/docs), [termos da API](https://lrclib.net/developers/terms) e [código da correspondência](https://github.com/tranxuanthang/lrclib/blob/04369d3f7c6e8cba1790629f26f866547a9b8f88/server/src/repositories/track_repository.rs). Estas referências pertencem à documentação interna da implementação, não aos textos do cliente.
