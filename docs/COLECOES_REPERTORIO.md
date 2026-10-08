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

| RPC | Uso |
| --- | --- |
| `save_repertoire_collection` | Cria uma coleção vazia ou salva nome e ordem completa na revisão esperada. A substituição da ordem e a preservação de vínculos moderados acontecem na mesma transação. |
| `append_repertoire_collection_songs` | Acrescenta músicas no fim, mantém a ordem existente e torna reenvios idempotentes. |
| `set_song_repertoire_collections` | Atualiza, em lote, as participações de uma música. Recebe as revisões de todas as coleções afetadas; inclusões entram no final e remoções preservam a ordem relativa das demais músicas. |
| `delete_repertoire_collection` | Exclui a coleção na revisão esperada e remove seus vínculos por cascata, sem apagar músicas ou setlists. |

Edições e exclusões exigem o `updated_at` que o cliente leu. Inclusões e mudanças de participação atualizam a revisão das coleções afetadas. Uma revisão antiga resulta em `COLLECTION_CHANGED`; o cliente deve atualizar os dados e pedir que a pessoa reaplique a mudança, sem substituir silenciosamente a edição concorrente.

Vínculos de músicas moderadas permanecem no banco durante uma edição feita por alguém que não pode consultá-las. O serviço preserva esses vínculos sem os devolver ao cliente. Músicas arquivadas continuam vinculadas e visíveis a quem pode consultar o repertório, mas a composição de novas setlists deve excluí-las. Setlists existentes são independentes da coleção.

## Migrações e validação

1. Aplique `20261008100000_create_repertoire_collections.sql` para criar tabelas, restrições, índices e políticas RLS.
2. Aplique `20261008101000_manage_repertoire_collections.sql` para disponibilizar as operações transacionais.
3. Valide a estrutura e os cenários com `npm run supabase:lint` e `npm run supabase:test` em um Supabase local iniciado pelo Docker.

O workflow `Testes do banco` inicia um banco efêmero e executa o lint do schema seguido dos testes pgTAP, sem conexão com projetos Supabase hospedados. O computador de desenvolvimento usado nesta implementação não dispõe de Docker ou Podman; por isso, a validação foi executada nesse runner isolado. O workflow não aplica migrações ao ambiente de desenvolvimento ou produção.

As migrações são aditivas e não convertem dados existentes nem criam coleções automaticamente. Antes de aplicar em qualquer projeto hospedado, confirme o projeto de destino e siga o processo de implantação autorizado. Um retorno apenas da interface pode manter as tabelas e os vínculos para uso posterior.
