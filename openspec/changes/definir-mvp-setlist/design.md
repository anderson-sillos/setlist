## Context

O projeto é novo e ainda não possui implementação ou especificações funcionais. A motivação e o escopo geral estão em `proposal.md`.

O MVP precisa atender bandas com integrantes usando aparelhos Android e iOS diferentes, oferecer preparação compartilhada pela internet e continuar funcionando no palco após o show ter sido baixado. O conteúdo pertence à banda, e não individualmente ao usuário.

## Goals / Non-Goals

**Goals:**

- Manter a arquitetura do MVP simples, com poucos serviços para instalar ou operar.
- Garantir separação segura do conteúdo de cada banda.
- Permitir preparação online colaborativa e execução offline confiável.
- Preservar uma fonte única para cada música, sinalizando atualizações nos shows que a utilizam.
- Tornar a leitura da letra no palco adequada a celulares e tablets.

**Non-Goals:**

- Reconhecer automaticamente a música ou sua posição no áudio.
- Sincronizar em tempo real os cronômetros dos aparelhos dos músicos.
- Armazenar, distribuir ou reproduzir arquivos de áudio próprios.
- Editar conteúdo sem conexão ou resolver conflitos de edições offline.
- Manter histórico de versões, arranjos alternativos, cifras ou transposição.
- Oferecer login por senha, Facebook ou outros provedores além de Google e Apple.

## Decisions

### Arquitetura geral

```text
+-------------------+       +---------------------------+
| App Expo          | <---> | Supabase hospedado        |
| Android e iOS     |       | Auth + Postgres + RLS     |
+---------+---------+       +---------------------------+
          |
          +------> SecureStore: sessão autenticada
          |
          +------> Arquivos JSON: shows baixados
          |
          +------> YouTube incorporado: referência na edição
```

O aplicativo será criado em React Native com Expo. Essa opção oferece uma base compartilhada para Android, iPhone e iPad e reduz o trabalho de configuração nativa no início.

O backend será o Supabase hospedado, inicialmente no plano gratuito, usando Auth, PostgreSQL e Row Level Security. Não haverá PostgreSQL ou outro servidor instalado localmente para executar o aplicativo. O plano Pro será considerado quando os limites, a disponibilidade ou o uso público justificarem o custo.

### Autenticação e acesso às bandas

- O login será exclusivamente social, com Google e Apple.
- O SecureStore guardará somente os dados necessários para persistir a sessão no aparelho, especialmente os tokens de acesso e renovação.
- Letras, shows e outros dados de negócio não serão armazenados no SecureStore.
- Nenhuma chave administrativa do Supabase será incluída no aplicativo. As permissões serão verificadas pelo backend com RLS.
- Um usuário poderá participar de várias bandas, e todo conteúdo funcional pertencerá a uma banda.
- Os papéis serão Owner, Editor e Member.
- Owner poderá administrar a banda, integrantes, conteúdo e outros Owners.
- Editor poderá editar repertório, letras, sincronização, shows e setlists.
- Member terá acesso de leitura, download e modo palco.
- Uma banda poderá ter vários Owners. O último Owner não poderá sair nem perder o papel até promover outro integrante.
- A entrada de integrantes ocorrerá por link de convite revogável e com expiração. Depois do login social, o usuário será adicionado à banda como Member.

### Repertório e letras

- Cada banda manterá seu próprio repertório.
- Cada música terá uma única versão vigente, sem arranjos alternativos ou histórico de versões exposto ao usuário.
- Os dados previstos para a música são título, artista original, tonalidade, BPM, duração estimada, referência do YouTube, letra estruturada, tempos das linhas, observações e identificação da última atualização.
- A letra será digitada ou colada pelos integrantes e organizada em blocos e linhas.
- A música poderá estar sem letra, com letra estática ou com letra sincronizada.
- Serão mantidas somente letras, sem cifras ou transposição.
- Uma música já utilizada em shows será arquivada em vez de excluída. Ela deixará de aparecer para novas inclusões, continuará nos shows existentes e poderá ser restaurada.

### Sincronização manual da letra

- A preparação exigirá conexão com a internet e utilizará um vídeo incorporado do YouTube como áudio de referência.
- O vídeo deverá permanecer visível durante a edição.
- O editor marcará o início de cada linha enquanto o vídeo é reproduzido e poderá corrigir manualmente os tempos.
- Serão armazenados somente a URL ou o identificador do vídeo, sua duração quando necessária e os tempos das linhas. Nenhum áudio será baixado ou armazenado.
- Spotify não fará parte do MVP, evitando dependência de conta Premium, limitações do SDK e restrições de reprodução.

### Shows e setlists

- O show será uma entidade própria com nome, data, horário, local e observações.
- Cada show terá sua própria setlist e poderá ser criado pela duplicação de um show anterior.
- A setlist aceitará blocos nomeados, como Primeiro Set, Segundo Set e Bis. Um bloco Principal será usado como padrão.
- Blocos e músicas poderão ser reordenados, e o aplicativo calculará suas durações totais.
- Os estados compartilhados do show serão Rascunho, Pronto e Cancelado.
- Um show Pronto ficará somente para leitura. Para editá-lo, Owner ou Editor deverá retorná-lo a Rascunho.
- Um show Cancelado ficará somente para leitura, mas poderá ser reaberto como Rascunho.
- Não haverá estados Em andamento ou Finalizado. Shows passados serão identificados pela data.
- Entrar no modo palco não modificará o estado compartilhado do show.
- Colocar um show em Pronto exibirá alertas sobre letras ausentes ou sincronizações incompletas, sem impedir a operação.

### Atualização das músicas nos shows

- Os itens da setlist referenciarão a música vigente do repertório, em vez de criar uma cópia ou versão da música.
- Alterar uma música não mudará o estado Pronto de um show que a utiliza.
- Shows e pacotes locais afetados indicarão que existe uma atualização disponível.
- O músico decidirá quando atualizar o pacote baixado antes da apresentação.
- Uma identificação interna de atualização, como `updated_at` ou equivalente, será mantida para detectar alterações; ela não será apresentada como histórico de versões.

### Modo palco

- Cada músico iniciará manualmente seu próprio cronômetro. Os cronômetros serão independentes e não tentarão permanecer sincronizados entre aparelhos.
- A linha correspondente ao tempo atual ficará destacada, mantendo linhas anteriores e seguintes visíveis.
- A tela exibirá tempo transcorrido, duração total e uma prévia da próxima música.
- Os controles incluirão pausar, avançar ou voltar cinco segundos e reiniciar.
- A troca para a próxima música será sempre manual por toque ou gesto.
- A navegação e o progresso locais não alterarão a ordem compartilhada da setlist.
- O modo palco permitirá ajustar fonte, tema e orientação e manterá a tela ativa durante a apresentação.

### Disponibilidade offline

- A edição será exclusivamente online.
- Um show previamente baixado será salvo como um pacote JSON com seus dados, setlist, letras, tempos e metadados necessários.
- Preferências e progresso local também poderão usar arquivos JSON.
- A atualização dos pacotes deverá usar escrita atômica, gravando primeiro um arquivo temporário e substituindo o anterior somente após sucesso.
- SQLite não será usado no MVP. Ele só deverá ser reconsiderado se surgirem edição offline, consultas locais complexas ou volume de dados que torne os pacotes JSON inadequados.
- Na ausência de conexão, o conteúdo baixado poderá ser aberto usando a última sessão considerada válida no aparelho, sempre sem edição.
- O logout removerá a sessão e os shows baixados daquele usuário.
- A remoção de um integrante será aplicada no aparelho e limpará o conteúdo daquela banda na próxima conexão com o backend.

### Modelo conceitual

```text
Usuario --< Participacao >-- Banda
                              |
                              +-- Convites
                              +-- Musicas --< Secoes --< Linhas
                              +-- Shows --< Blocos --< Itens >-- Musica

Dispositivo --< Pacotes locais de show
```

As tabelas e políticas RLS deverão usar a participação ativa na banda e o papel do usuário para autorizar cada operação. Os itens da setlist manterão a referência à música, enquanto o pacote local materializará os dados necessários para a execução offline.

## Risks / Trade-offs

- [Cronômetros independentes podem divergir entre músicos] → Tratar essa limitação como parte explícita do MVP e manter controles rápidos de correção; estudar reconhecimento automático apenas depois de validar o fluxo manual.
- [Um integrante removido ainda pode visualizar conteúdo já baixado enquanto permanecer totalmente offline] → Limpar os pacotes na próxima conexão e comunicar essa limitação; não prometer revogação instantânea de dados offline.
- [O projeto gratuito do Supabase possui limites e pode não oferecer disponibilidade adequada ao uso público] → Monitorar consumo e atividade e definir critérios de migração para o Pro antes do lançamento público.
- [Arquivos JSON são menos adequados a grandes consultas e edições concorrentes] → Limitar seu uso a pacotes de leitura por show e reavaliar SQLite somente quando houver necessidade concreta.
- [Um vídeo do YouTube pode ficar indisponível ou mudar] → Usá-lo apenas como referência na preparação; a execução no palco dependerá dos tempos já salvos, não do vídeo.
- [Tokens podem desaparecer no Android ou persistir no Keychain após reinstalação no iOS] → Tratar sessão ausente ou inválida normalmente, renová-la no servidor e limpar dados locais no logout.
- [Letras podem envolver direitos autorais] → Restringir o conteúdo às bandas autenticadas e revisar requisitos jurídicos, termos de uso e política de privacidade antes da distribuição pública.
- [Uma atualização de música pode afetar vários shows Prontos] → Exibir quais pacotes estão desatualizados e exigir atualização explícita do download, evitando troca silenciosa durante uma apresentação.

## Migration Plan

Não existe sistema anterior nem dados a migrar. A implantação será incremental em ambientes separados de desenvolvimento e produção. Enquanto o produto estiver no MVP, a reversão poderá ocorrer publicando a versão anterior do aplicativo e desativando temporariamente novas operações no backend sem apagar dados das bandas.

## Open Questions

### Pendências para fechar antes das especificações e tarefas

- Decidir se cada música adicionada à setlist poderá ter uma observação específica daquele show, sem alterar a música do repertório.
- Definir se shows em Rascunho poderão entrar no modo palco e ser baixados ou se o download ficará restrito a shows Prontos.
- Definir o comportamento exato de expiração dos convites, incluindo prazo padrão e possibilidade de gerar um novo link.
- Definir regras de exclusão de conta e destino das bandas quando um usuário também for Owner.
- Confirmar quais ações administrativas de integrantes poderão ser feitas por Editor, caso alguma, além das ações de conteúdo já definidas.

### Pendências de experiência do usuário

- Detalhar o mapa de telas e a navegação entre bandas, repertório, editor de sincronização, shows, downloads e modo palco.
- Definir o comportamento do cronômetro quando o aplicativo perder foco, receber uma chamada ou for encerrado pelo sistema.
- Definir se haverá bloqueio contra toques acidentais no modo palco.
- Definir como o aplicativo apresentará erros, ausência de letra, sincronização parcial e pacotes desatualizados durante a preparação e no palco.

### Pendências técnicas e operacionais

- Validar em um protótipo a incorporação visível do player do YouTube e a leitura precisa do tempo atual no Expo para Android e iOS.
- Definir bibliotecas de navegação, estado, formulários, validação e testes dentro do ecossistema Expo.
- Projetar o esquema PostgreSQL, as políticas RLS e a estratégia exata de identificação de atualizações.
- Definir limites, retenção e limpeza automática dos pacotes baixados.
- Configurar e validar os provedores Google e Apple, links universais e retorno da autenticação no aplicativo.
- Estabelecer critérios objetivos para migrar o Supabase do plano gratuito para o Pro.
- Elaborar política de privacidade, termos de uso e avaliação jurídica para letras inseridas pelos usuários antes de uma distribuição pública.
