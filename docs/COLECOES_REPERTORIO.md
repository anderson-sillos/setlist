# Coleções do repertório

Coleções são uma organização opcional de músicas compartilhadas por uma banda. Uma música pode participar de várias coleções e cada coleção mantém sua própria ordem. O vínculo aponta para o cadastro atual da música; título, artista, letra e duração não são copiados.

## Estrutura e integridade

- `repertoire_collections` guarda banda, nome e revisão (`updated_at`). O nome é obrigatório, tem até 120 caracteres e é único na banda após remover espaços externos e ignorar diferenças de caixa.
- `repertoire_collection_songs` guarda banda, coleção, música e posição. Uma música só aparece uma vez em cada coleção; posições são não negativas e únicas dentro dela.
- As chaves estrangeiras compostas impedem misturar músicas ou coleções de bandas diferentes. Excluir uma coleção remove seus vínculos; excluir definitivamente uma música remove somente seus vínculos. Coleções vazias são permitidas.
- A duração e as quantidades são derivadas dos cadastros consultáveis no momento da leitura. Durações ausentes não são tratadas como duração zero confirmada.

## Leitura e autorização

As duas tabelas usam RLS. Integrantes ativos consultam coleções da própria banda; os vínculos só são retornados quando a música também pode ser consultada. Isso evita revelar conteúdo moderado ou incluir essas músicas em contagens e prévias. Contas suspensas continuam bloqueadas mesmo com uma sessão antiga.

O cliente tem apenas permissão de leitura direta. Escritas passam pelas RPCs e repetem as verificações de sessão, suspensão, banda e papel. Proprietários e editores podem organizar coleções; integrantes sem papel de edição não podem alterá-las.

## Operações atômicas

As funções da migração `20261008101000_manage_repertoire_collections.sql` mantêm cada alteração dentro de uma transação:

| RPC                                  | Uso                                                                                                                                                                                      |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `save_repertoire_collection`         | Cria uma coleção vazia ou salva nome e ordem completa na revisão esperada. A substituição da ordem e a preservação de vínculos moderados acontecem na mesma transação.                   |
| `append_repertoire_collection_songs` | Acrescenta músicas no fim, mantém a ordem existente e torna reenvios idempotentes.                                                                                                       |
| `set_song_repertoire_collections`    | Atualiza, em lote, as participações de uma música. Recebe as revisões de todas as coleções afetadas; inclusões entram no final e remoções preservam a ordem relativa das demais músicas. |
| `delete_repertoire_collection`       | Exclui a coleção na revisão esperada e remove seus vínculos por cascata, sem apagar músicas ou setlists.                                                                                 |

Edições e exclusões exigem o `updated_at` que o cliente leu. Inclusões e mudanças de participação atualizam a revisão das coleções afetadas. Uma revisão antiga resulta em `COLLECTION_CHANGED`; o cliente deve atualizar os dados e pedir que a pessoa reaplique a mudança, sem substituir silenciosamente a edição concorrente.

Vínculos de músicas moderadas permanecem no banco durante uma edição feita por alguém que não pode consultá-las. O serviço preserva esses vínculos sem os devolver ao cliente. Músicas arquivadas continuam vinculadas e visíveis a quem pode consultar o repertório, mas a composição de novas setlists deve excluí-las. Setlists existentes são independentes da coleção.

## Contrato dos repositórios e origem dos resumos

`RepertoireCollectionRepository` oferece consultas por banda e operações para salvar nome e ordem, acrescentar músicas, definir as coleções de uma música e excluir uma coleção. Edições existentes e exclusões recebem a revisão `updatedAt` que foi lida; a gestão das participações de uma música recebe as revisões de todas as coleções afetadas. O adaptador Supabase envia as escritas às RPCs e converte seus erros em códigos do domínio. O adaptador em memória aplica as mesmas regras de nomes, revisões, participações e ordem, com relógio e gerador de identificadores substituíveis nos testes.

`useRepertoireCollections` busca, em lote, as coleções, os vínculos consultáveis e os registros atuais das músicas da banda. A tela não faz uma consulta individual por cartão. O resumo é calculado a partir desses registros atuais:

- `songCount` inclui músicas ativas e arquivadas que podem ser consultadas.
- `activeSongCount` e `archivedSongCount` distinguem as situações atuais do repertório.
- `estimatedDurationMs` soma somente as durações informadas; `songsWithoutDurationCount` identifica os registros sem duração. Se nenhuma música tiver duração, o total é `null`, não zero.
- Nome, artista, tom, BPM, duração e situação vêm do cadastro atual da música. Não são copiados para o vínculo nem mantidos em snapshots dentro da coleção.

Por exemplo, “Festa” e “Acústico” podem apontar para a mesma música. Se o título ou o tom dessa música mudar, as duas coleções passam a exibir o valor atualizado na próxima consulta. A letra continua somente no cadastro da música; criar ou editar uma coleção não duplica a letra nem depende de um snapshot dela.

## Consulta, edição e organização no app

O botão **Coleções** fica ao lado de **Filtrar** e **Ordenar** no Repertório, com o mesmo tamanho e aparência. Seu menu reúne **Ver coleções** e, para proprietários e editores, **Selecionar músicas**. A criação de coleção pode ser iniciada na lista de coleções ou nos diálogos **Coleções da música** e **Adicionar a uma coleção**, pela ação **Nova coleção**. A função é opcional: as telas habituais de músicas e shows continuam disponíveis sem criar ou usar coleções. Integrantes ativos podem consultar as coleções; somente proprietários e editores veem as ações para criar, editar e excluir.

Na lista, cada cartão mostra o nome, a quantidade de músicas consultáveis, a duração conhecida e, quando aplicável, quantas estão arquivadas. Proprietários e editores abrem o editor diretamente ao tocar no cartão; os demais integrantes consultam a lista ordenada em modo somente leitura. Tocar numa música abre seu cadastro no Repertório. Uma coleção vazia continua válida e oferece **Adicionar músicas** a quem pode editar.

No detalhe da música, as coleções vinculadas aparecem como etiquetas abaixo de tom e BPM; tocar numa etiqueta abre o Repertório da mesma banda já filtrado por ela. Proprietários e editores também encontram **Organizar coleções** no cartão de informações, mesmo quando a música ainda não participa de nenhuma. Marque ou desmarque as coleções desejadas e salve para atualizar os vínculos em conjunto. Novas participações entram ao final da coleção e não mudam a ordem das outras músicas. **Nova coleção** abre o formulário com a música atual já incluída; se houver mudanças pendentes nas participações existentes, o app pede confirmação para descartá-las antes de sair. Se outra pessoa alterar uma coleção durante a edição, os dados escolhidos permanecem na janela para uma nova tentativa.

Na criação, informe apenas o **Nome da coleção** na janela que aparece sobre a tela atual e salve. A coleção pode começar vazia. Se a criação veio da ação **Nova coleção** em **Coleções da música** ou **Adicionar a uma coleção**, uma contagem discreta informa as músicas que serão incluídas; não há outra lista de seleção nesse formulário. Cancelar ou fechar antes de salvar retorna ao contexto que abriu a janela, sem criar uma coleção. Depois de salvar, o editor da nova coleção abre para revisão; cancelar essa edição mantém a coleção e as músicas iniciais já salvas e descarta somente mudanças feitas depois da criação.

Para incluir músicas, use **Coleções → Selecionar músicas** no Repertório ou **Adicionar músicas** no editor de uma coleção. Essa última ação abre o Repertório em seleção, sem restringir os resultados à coleção, e deixa o destino previamente marcado. Busca, status e ordenação permanecem disponíveis:

- **Todas** lista músicas ativas, independentemente do estado da letra.
- **Pendentes** lista músicas ativas cuja letra não está sincronizada.
- **Sincronizadas** lista músicas ativas cuja letra está sincronizada.
- **Arquivadas** lista somente músicas arquivadas.
- A ordenação pode usar título, artista/banda, atualização recente ou duração.

A edição de uma coleção existente permite renomear, remover participações e reordenar pela alça de arraste. As linhas seguem o arranjo do editor de setlist: remover à esquerda e alça de arraste à direita; não há setas separadas de reordenação. Durante o arraste, uma prévia flutuante com ícone e título acompanha o gesto, enquanto a linha original fica contornada. O botão de remoção usa uma lixeira de 17 px, com o mesmo alvo e estados de foco/pressionado do setlist. Sem alterações pendentes, o rodapé apresenta somente **Fechar**; com alterações, apresenta **Cancelar** e **Salvar**. O cabeçalho oferece Voltar à esquerda e Excluir à direita; a exclusão pede confirmação. **Adicionar músicas** abre a seleção na lista habitual; se houver alterações pendentes no editor, a saída pede confirmação de descarte. Depois de confirmar as inclusões, o editor da coleção escolhida abre para revisão. As alterações feitas no editor são persistidas ao tocar em **Salvar coleção**. Cancelar mantém as inclusões que já foram confirmadas e descarta somente as mudanças ainda locais no editor. Remover uma participação não exclui a música nem suas aparições em shows.

### Organizar músicas diretamente no Repertório

Proprietários e editores podem abrir **Coleções → Selecionar músicas** no Repertório. Também podem iniciar pelo menu de três pontos de uma música, escolhendo **Selecionar**, ou mantendo o cartão pressionado. Nessas duas ações, a música de origem já fica marcada. A contagem aparece no cabeçalho, com **Cancelar seleção** à esquerda e **Opções da seleção** à direita. Nesse modo, tocar numa música marca ou desmarca sua escolha, e a contagem inclui as músicas que ficaram fora dos resultados após uma busca ou filtro. **Selecionar todos** marca somente as músicas atualmente visíveis na busca e nos filtros. Ao iniciar pela pressão prolongada, soltar o cartão não abre os detalhes nem remove a marcação inicial.

Enquanto o modo de seleção estiver ativo, **Adicionar**, **Filtrar** e **Ordenar** permanecem visíveis na mesma linha durante a rolagem. Ao cancelar ou concluir a seleção, a ocultação automática da barra volta a funcionar a partir da posição atual da lista.

O botão **Adicionar** abre diretamente a escolha do destino. No menu **Opções da seleção**, **Limpar seleção** desmarca as músicas sem sair desse modo, enquanto **Cancelar seleção** remove as marcações e sai do modo. Com músicas escolhidas, confirme a coleção de destino ou escolha **Nova coleção** para abrir o formulário de nome já preenchido com as músicas; ao seguir para a criação, o modo de seleção termina e a nova coleção guarda essa lista inicial ao ser salva:

- A escolha do destino mostra quantas músicas estão marcadas, resume em uma frase quantas serão incluídas e quantas já pertencem à coleção. As novas entram ao final; as participações existentes não se repetem nem mudam de posição. **Nova coleção** abre o formulário com todas as músicas escolhidas, inclusive quando ainda não existe nenhuma coleção. Em caso de falha ao incluir numa coleção existente, o app mantém as escolhas para tentar novamente.

Após incluir músicas numa coleção existente, o seletor fecha, a seleção termina e o editor da coleção abre para revisão e reordenação. Salvar ou cancelar retorna ao Repertório; cancelar mantém a inclusão já confirmada e descarta somente mudanças locais no editor. O fluxo **Nova coleção** abre o formulário de nome e, após salvar, o editor da coleção criada. O botão **Cancelar seleção** no cabeçalho ou em **Opções da seleção** encerra o modo, limpa as escolhas locais e restaura a abertura habitual do detalhe ao tocar em uma música. Cancelar antes da confirmação não grava vínculos. Integrantes sem papel de edição continuam consultando o Repertório e as coleções sem ver essas ações de organização.

O botão de **três pontos verticais** de cada música oferece **Selecionar**, **Exibir letra** quando existe letra, além de **Ver detalhes**, **Editar música** e **Organizar em coleções**, conforme as permissões. **Selecionar** ativa o modo de seleção e marca a música imediatamente. **Exibir letra** abre a letra em tela cheia. Na Web, clique duplo no cartão com letra também abre essa tela; clique simples continua abrindo os detalhes. No iOS e Android, o toque simples continua imediato e o menu oferece o atalho à letra. No modo de seleção, tocar no cartão marca ou desmarca a música. A organização pelo menu utiliza o mesmo diálogo de participações disponível no detalhe, com salvamento e confirmação de descarte. No iOS, o menu fecha completamente antes de abrir o diálogo ou a tela de destino.

Uma falha na consulta opcional de coleções não impede a consulta das músicas. O erro e a nova tentativa aparecem nas ações de coleções; se houver dados anteriores, o filtro e os resultados são preservados.

### Filtrar o Repertório por coleção

Quando a banda tem ao menos uma coleção, o painel **Filtrar** mostra o grupo **Coleção**. **Todas as coleções** deixa esse critério sem restrição; **Sem coleção** mostra músicas que não pertencem a nenhuma coleção; as demais opções mostram somente as músicas da coleção escolhida. Em bandas sem coleções, o grupo não é exibido.

O filtro de coleção é combinado aos outros critérios: uma música precisa corresponder à busca e aos filtros de status e coleção selecionados. Por exemplo, **Festa** com **Sincronizadas** mostra apenas músicas sincronizadas que pertencem a Festa. A ordenação escolhida continua sendo aplicada aos resultados. **Sem coleção** também respeita o status: músicas arquivadas só aparecem quando **Arquivadas** está selecionado.

### Adicionar uma coleção à setlist

Na edição de um show em rascunho, **Adicionar coleção** permite escolher uma coleção e revisar a inclusão antes de confirmar. A prévia mostra o bloco de destino, a ordem atual das músicas ativas, a quantidade, a duração conhecida, músicas repetidas no show e faixas arquivadas que ficarão de fora. A confirmação exige conexão e revalida o show, o acesso, a coleção e os dados das músicas; se algo mudou desde a prévia, a pessoa revisa a versão atual antes de confirmar novamente.

Confirmar acrescenta as músicas ativas como ocorrências comuns ao final do bloco selecionado. A ordem é copiada naquele momento e músicas já presentes podem ser repetidas. A setlist guarda as referências das músicas, não o vínculo com a coleção: reordenar, editar ou excluir a coleção depois não altera as ocorrências do show. Os títulos e demais metadados continuam vindo do cadastro atual de cada música. A inclusão fica local até **Salvar setlist**; cancelar o editor usa a confirmação padrão para descartar o rascunho.

Se a coleção usada no filtro for excluída, o app aguarda a consulta atualizada confirmar a exclusão, volta a **Todas as coleções** e mostra um aviso temporário. Busca, status e ordenação permanecem. Se a atualização falhar, o critério e os dados carregados continuam disponíveis para tentar novamente.

Para renomear ou organizar uma coleção existente, toque em seu cartão na lista; proprietários e editores abrem diretamente o editor, enquanto os demais integrantes veem somente a consulta. O botão Excluir no cabeçalho pede confirmação e remove a coleção e seus vínculos; não remove músicas nem setlists existentes. Se houver alterações ainda não salvas, a confirmação informa que elas também serão descartadas. Ao detectar uma edição concorrente, o app mantém o rascunho na tela, bloqueia uma nova gravação com a revisão antiga e oferece a saída para revisar a versão atual.

### Conferência com músicas ativas e arquivadas

Use o repertório de demonstração. Em **Coleções → Selecionar músicas**, escolha **Luzes da Cidade**, use a busca para encontrar e acrescentar **Entre Pontes**, depois troque o filtro para **Arquivadas** e acrescente **Rota Antiga**. Ao voltar para **Todas** e mudar a ordenação, o contador permanece em três. Abra **Adicionar → Nova coleção**, informe **Ativas e arquivadas** e salve. A criação mantém a ordem escolhida — Luzes da Cidade, Entre Pontes e Rota Antiga — e o resumo identifica uma música arquivada. A verificação também confirma que Rota Antiga continua cadastrada no repertório.

## Migrações e validação

1. Aplique `20261008100000_create_repertoire_collections.sql` para criar tabelas, restrições, índices e políticas RLS.
2. Aplique `20261008101000_manage_repertoire_collections.sql` para disponibilizar as operações transacionais.
3. Valide a estrutura e os cenários com `npm run supabase:lint` e `npm run supabase:test` em um Supabase local iniciado pelo Docker.

O workflow `Testes do banco` inicia um banco efêmero e executa o lint do schema seguido dos testes pgTAP, sem conexão com projetos Supabase hospedados. O computador de desenvolvimento usado nesta implementação não dispõe de Docker ou Podman; por isso, a validação foi executada nesse runner isolado. O workflow não aplica migrações ao ambiente de desenvolvimento ou produção.

As migrações são aditivas e não convertem dados existentes nem criam coleções automaticamente. Antes de aplicar em qualquer projeto hospedado, confirme o projeto de destino e siga o processo de implantação autorizado. Um retorno apenas da interface pode manter as tabelas e os vínculos para uso posterior.
