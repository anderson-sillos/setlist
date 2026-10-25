# Tasks

## 1. Escopo e contratos

- [x] 1.1 Conciliar a exceção de importação na regra Fontes de letras no piloto e na nota correspondente do design de `definir-mvp-setlist`, ou na spec canônica se já sincronizada; revisar os Termos de Uso para deixar claro que a busca assistida só sugere conteúdo externo, não confirma direitos nem concede licença, e que a pessoa deve confirmar autorização antes de salvar ou compartilhar. Manter as responsabilidades autorais e conferir que os artefatos não proíbem a ação aprovada nem antecipam o modo palco.
- [x] 1.2 Definir os tipos de candidato, decisão de duração, estados da operação e origem opcional da letra; conferir compatibilidade com `SongEditorValues`, `LyricDocument`, status existentes e dados anteriores à integração.
- [x] 1.3 Configurar `EXPO_PUBLIC_LRCLIB_APP_ID` como variável opcional no ambiente local, modelos de ambiente, EAS development/production e `.github/workflows/pages.yml` por variável pública de repositório; conferir a disponibilidade quando preenchida e a busca sem cabeçalho quando ausente, sem valor fixo no adaptador, documentar o rebuild necessário para mudanças e manter a autorização pública como referência técnica.

## 2. Consulta e recuperação de falhas

- [x] 2.1 Implementar o adaptador `src/data/lrclib/` com busca estruturada, identificação de versão, `Lrclib-App-Id` opcional lido da variável de ambiente, validação defensiva e cancelamento; conferir com respostas simuladas o cabeçalho normalizado quando preenchido, sua omissão completa quando ausente/vazio/somente espaços em todas as tentativas, a continuidade da busca e a ausência de credenciais, letra existente ou IDs privados na requisição.
- [x] 2.2 Implementar orçamento único de três tentativas totais para 503, Retry-After numérico/data, esperas de dois/quatro segundos e timeout; conferir com relógio controlado sucesso na segunda, três falhas, cancelamento durante espera, contagem real e ausência de multiplicação por wrappers.
- [x] 2.3 Separar vazio, timeout, resposta inválida, limite e indisponibilidade e preservar diagnósticos internos sem conteúdo; conferir os estados com respostas simuladas, respeito a 429 e ausência de nomes técnicos nas mensagens destinadas à interface.

## 3. Correspondência, duração e letra

- [x] 3.1 Implementar normalização, classificação por correspondência e duração e agrupamento conservador; conferir em testes puros acentos, artistas distintos, versões ao vivo, compilações equivalentes e prioridade da duração antes do desempate por LRC.
- [x] 3.2 Implementar aplicação inequívoca versus seleção e a decisão de duração; conferir os limites de 1.999, 2.000 e 2.001 ms, artista ausente, título parcial, duração vazia e ambas as escolhas para duração divergente.
- [x] 3.3 Implementar o conversor de texto/LRC para documentos com novos IDs; conferir frações, offset, marcas múltiplas, estrofes explícitas, marcadores vazios com horário, parágrafos do texto simples com alinhamento completo e inferência conservadora por pausas (mínimo de oito segundos e 2,5 vezes a mediana, com três intervalos positivos); preservar expansão de repetições, texto e tempos, sem rótulos automáticos de Verso/Refrão ou sintaxe LRC no texto exibido.
- [x] 3.4 Validar aproveitamento dos tempos e fallback estático; conferir o registro inconsistente de cinco segundos com marcações acima de duzentos segundos, instrumental, LRC sem texto e status estático/sincronizado coerente com `deriveLyricStatus`.
- [x] 3.5 Implementar o preenchimento do rascunho, atualizando título e artista pelo resultado e preservando letra, duração e demais valores conforme elegibilidade; conferir em testes puros letra já preenchida, somente espaços, campos indisponíveis no fornecedor, alteração durante a busca e substituição da duração apenas por escolha explícita.

## 4. Persistência e edição da origem

- [x] 4.1 Acrescentar origem opcional ao documento e preservar sua serialização em `songMutations.ts` e leitura em `songRepository.ts`; conferir round-trip de letras importadas e leitura compatível de documentos antigos ou com origem desconhecida, sem ampliar consultas de resumo.
- [x] 4.2 Preservar a origem nos helpers de edição aplicáveis sem reutilizar tempos de outra letra por posição; conferir os testes de `lyricEditorText`, `LyricDocumentEditor` e mutações para edição posterior, IDs novos da importação e texto mantido ao reabrir.
- [x] 4.3 Conferir que o JSONB e o cálculo de status do servidor aceitam o documento enriquecido e que o salvamento continua sujeito a permissões e moderação; registrar o resultado técnico no design e manter a ausência de migração SQL se o contrato atual bastar.

## 5. Interface compacta, roda e mensagens

- [x] 5.1 Integrar a varinha ao lado esquerdo do rodapé de `SongEditorScreen.tsx` e manter Cancelar e Salvar agrupados à direita, em criação e edição, reutilizando tokens e infraestrutura de ícones; conferir nome acessível, foco, alvo de toque, título obrigatório e bloqueio de buscas ou salvamentos simultâneos nos testes de componente.
- [x] 5.2 Implementar um popup único com andamento, lista em `OptionSheet`, linhas inteiramente clicáveis e duas linhas de informação, mais decisão de duração no mesmo popup; conferir seleção direta, equivalência agrupada, fechamento sem perda do rascunho e ausência de rotas ou modais adicionais/empilhados.
- [x] 5.3 Reutilizar o desenho da roda de `ScreenDataRefresh.tsx` no popup durante a busca, sem disparar refresh da tela; manter o botão do rodapé desabilitado e estável; conferir dimensões, cor, início/fim da animação e parada enquanto se aguarda seleção.
- [x] 5.4 Implementar o catálogo de frases musicais cômicas com pelo menos cinco variantes equivalentes por estado, sorteio por etapa/tentativa e prevenção de repetição consecutiva; conferir com gerador controlado a seleção de variantes e estabilidade durante renders ou contagem regressiva, usando o catálogo do design como referência de redação.
- [x] 5.5 Exibir no popup feedback de etapas, tempo de espera, tentativas, falhas e resumo de preenchimento; conferir em testes de componente acessibilidade, informação objetiva preservada, texto estático/sincronizado correto e ausência de fornecedor, HTTP, endpoints ou IDs nos textos do cliente.

## 6. Ciclo da edição e integração

- [x] 6.1 Integrar cancelamento e invalidação por mudança de música, título, artista, duração e permissão; conferir respostas tardias, letra digitada durante a busca, saída durante backoff e retorno de foco sem consulta externa automática nos testes do editor.
- [x] 6.2 Integrar preenchimento ao dirty state, descarte e Salvar música sem Desfazer; conferir que consulta/seleção não fazem mutações, descarte mantém a versão anterior e salvamento de duração atualiza as dependências existentes.
- [ ] 6.3 Validar o fluxo completo na web, iPhone/iPad e Android, incluindo fonte ampliada, teclado, lista compacta, decisão de duração, frases aleatórias, roda de atividade, três tentativas, recuperação manual e a indicação instrumental; registrar as plataformas e os resultados observados. (24/10: bundles web e iOS compilados; no iPad, o app permaneceu na splash e não foi possível percorrer a tela; `adb devices` não encontrou Android conectado. A validação manual completa continua pendente.)
- [x] 6.4 Revisar coerência de proposta, spec, design, tarefas e documentação do piloto após implementar e executar a validação estrita da change; conferir que não restaram tarefas indevidamente concluídas ou promessas de player, modo palco ou direitos sobre letras.

## 7. Atualização dos nomes e novas buscas

- [x] 7.1 Permitir iniciar uma nova busca explícita após alterar o rascunho, usando título, artista e duração atuais; conferir que a pesquisa anterior não é reutilizada e que a busca pode ser iniciada mesmo após completar os campos.
- [x] 7.2 Exibir e aplicar título e artista do resultado preservando capitalização mista da fonte e normalizando somente nomes uniformemente em minúsculas ou maiúsculas (ignorando a inicial), com proteção para siglas e nomes curtos claramente estilizados; preservar duração já preenchida, letra existente e demais campos, e conferir popup, tela e helper de aplicação.
- [x] 7.3 Incluir botão compacto para limpar a letra no cabeçalho do editor, visível somente quando há conteúdo e acessível por teclado/leitor de tela; conferir que remove texto e blocos do rascunho sem salvar a música.
- [x] 7.4 Garantir espaçamento visível entre blocos de letra com ou sem nome nos detalhes, na tela cheia e na leitura no palco; manter “#” como marcador exclusivo do editor e preservar texto e tempos.
- [x] 7.5 Incluir botão primário centralizado “OK” para fechar o resumo quando a pesquisa terminar, inclusive quando nenhum resultado for encontrado; conferir que encerra o popup sem salvar a música.

## 8. Músicas instrumentais sem pendência de letra

- [x] 8.1 Derivar o estado de edição a partir do `lyric_status` persistido; manter músicas vazias sem indicação explícita como `missing`.
- [x] 8.2 Adicionar migrations sequenciais para incluir `instrumental` no enum PostgreSQL e permitir esse estado na constraint de consistência, sem persistir um marcador duplicado no JSONB.
- [x] 8.3 Incluir controle acessível “Música instrumental” no editor, persistindo a escolha no rascunho e permitindo desmarcá-la sem salvar automaticamente; remover a marca quando a pessoa digitar letra.
- [x] 8.4 Ler o indicador explícito de instrumental dos resultados, informar essa condição nas alternativas e marcá-la automaticamente apenas sem texto de letra; não importar texto/tempos contraditórios nem abrir decisão de duração para gravação instrumental.
- [x] 8.5 Excluir instrumentais do filtro Pendentes e da lista de avisos de prontidão do show, apresentar o status nos detalhes e indicar a condição no palco.
