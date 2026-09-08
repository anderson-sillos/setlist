## Context

O projeto é novo e ainda não possui implementação ou especificações funcionais. Consulte `proposal.md` para a motivação e o escopo do produto.

O MVP deve compartilhar uma única base entre Android, iOS e web. A preparação será colaborativa e online nas três plataformas; a execução offline será suportada apenas nos aplicativos móveis. O conteúdo pertence à banda, não ao usuário que o criou, e inclui letras potencialmente protegidas por direitos autorais.

## Goals / Non-Goals

**Goals:**

- Manter uma única base TypeScript e uma interface responsiva para celulares, tablets e computadores.
- Manter a arquitetura simples, hospedada e sem banco ou serviço adicional instalado localmente.
- Isolar com segurança o conteúdo de cada banda e aplicar as permissões também no banco.
- Permitir preparação online colaborativa e execução offline previsível nos aplicativos móveis.
- Preservar uma única fonte vigente por música e detectar se um pacote local está atualizado.
- Tornar a leitura e os controles no palco resistentes a interrupções e toques acidentais.

**Non-Goals:**

- Reconhecer automaticamente a música ou sua posição no áudio.
- Sincronizar em tempo real os cronômetros dos aparelhos dos músicos.
- Armazenar, distribuir, extrair ou reproduzir em segundo plano arquivos de áudio.
- Editar conteúdo sem conexão ou resolver conflitos de edições offline.
- Disponibilizar pacotes offline ou uma PWA offline na versão web.
- Manter histórico de versões, arranjos alternativos, cifras ou transposição.
- Oferecer login por senha, Facebook ou provedores além de Google e Apple.
- Buscar letras automaticamente ou conceder licença para conteúdo de terceiros.

## Decisions

### Arquitetura geral e plataformas

```text
                         +---------------------------+
                         | Supabase hospedado        |
                         | Auth + Postgres + RLS     |
                         +-------------+-------------+
                                       ^
                                       |
                 +---------------------+---------------------+
                 | App Expo + TypeScript + Expo Router       |
                 | interface responsiva e regras comuns       |
                 +---------------------+---------------------+
                                       |
                     +-----------------+-----------------+
                     |                                   |
           +---------v----------+              +---------v---------+
           | Android e iOS      |              | Navegador          |
           | SecureStore        |              | sessão web         |
           | arquivos JSON      |              | somente online     |
           | WebView YouTube    |              | IFrame YouTube     |
           +--------------------+              +-------------------+
```

A aplicação será criada em React Native com Expo e React Native Web. A versão para computador não será um sistema separado: usará os mesmos conceitos e fluxos, reorganizando colunas, painéis e controles conforme o espaço disponível.

O backend será o Supabase hospedado, usando Auth, PostgreSQL e Row Level Security. Não haverá PostgreSQL, Docker ou outro servidor obrigatório na máquina do desenvolvedor ou do usuário.

### Bibliotecas e organização do cliente

- Expo Router cuidará da navegação, das rotas tipadas e dos links de autenticação e convite.
- `@supabase/supabase-js` será o cliente de autenticação e dados.
- TanStack Query cuidará do estado remoto, invalidação, nova tentativa e reconexão. Seu cache será temporário e não substituirá os pacotes offline.
- React Hook Form e Zod cuidarão de formulários e validação.
- Estado local e Context do React serão usados inicialmente. Zustand só será adicionado se surgir estado global complexo que não seja remoto nem pertencente à rota.
- Jest e React Native Testing Library cobrirão unidades e componentes; Maestro cobrirá fluxos móveis e Playwright os fluxos web.

### Navegação e contexto da banda

- A autenticação e o perfil existirão independentemente da participação em uma banda.
- O usuário sem banda selecionada verá o espaço neutro `Minhas bandas`, no qual poderá criar uma banda, aguardar um convite ou abrir um convite recebido.
- Ao reabrir a aplicação, a última banda selecionada será restaurada se a participação continuar ativa; caso contrário, será exibido `Minhas bandas`.
- A navegação principal da banda terá Shows, Repertório e Banda. A troca de banda e o perfil ficarão no cabeçalho; os downloads ficarão dentro de Shows.
- O modo palco ocupará a tela inteira e não usará a navegação administrativa durante a apresentação.

### Autenticação, papéis e convites

- O login será exclusivamente social, com Google e Apple, tanto no cliente nativo quanto na web.
- O SecureStore guardará somente os dados necessários para persistir a sessão nos aplicativos móveis. Na web, a sessão usará o adaptador de armazenamento do navegador.
- Letras, shows e outros dados de negócio não serão armazenados no SecureStore.
- Nenhuma chave administrativa do Supabase será incluída no cliente.
- Um usuário poderá participar de várias bandas, e todo conteúdo funcional terá uma banda como escopo.
- Owner poderá administrar banda, integrantes, convites, conteúdo e outros Owners.
- Editor poderá criar e editar repertório, letras, sincronização, shows e setlists e poderá consultar integrantes e papéis. Não poderá convidar, remover, alterar papéis, promover Owners, administrar ou excluir a banda.
- Member terá acesso de leitura, download nos aplicativos móveis e modo palco.
- Uma banda poderá ter vários Owners. O último Owner não poderá sair, excluir a conta nem perder o papel até promover outro integrante, exceto quando for o único integrante e excluir antes a própria banda com confirmação reforçada.
- O convite será um link HTTPS de uso único, revogável, não vinculado a um e-mail e com validade padrão de sete dias. Um novo link poderá ser gerado após expiração ou revogação.
- O token bruto do convite não será armazenado; o banco manterá seu hash. A aceitação ocorrerá por uma função protegida e adicionará o usuário inicialmente como Member.
- O link abrirá o aplicativo instalado quando houver associação válida e, nos demais casos, a versão web. O token será preservado durante o login, mas a entrada na banda exigirá confirmação após a autenticação.
- URLs de desenvolvimento e produção serão configuradas separadamente. Um esquema como `setlist://` será o retorno alternativo nativo, e o endereço HTTPS definitivo será configurável.

### Exclusão de conta

- A exclusão removerá perfil, sessões e pacotes locais do usuário, mas preservará o conteúdo pertencente às bandas.
- Referências históricas ao autor ficarão sem dados pessoais e serão apresentadas como `Usuário removido`.
- A exclusão será bloqueada enquanto o usuário for o último Owner de uma banda com outros integrantes.
- Se for o único integrante, o usuário poderá excluir a banda e seu conteúdo mediante confirmação reforçada antes de excluir a própria conta.

### Responsabilidade pelo conteúdo das letras

- Criar uma banda exigirá aceite explícito, com opção desmarcada por padrão, do termo de responsabilidade sobre o conteúdo.
- O termo declarará que o responsável possui direitos ou autorizações para as letras, não deve copiar fontes não autorizadas, assume responsabilidade pelo conteúdo da banda e reconhece que acesso restrito não equivale a licença autoral.
- O termo permitirá bloquear ou remover conteúdo diante de denúncia ou possível infração e permanecerá consultável nas configurações da banda.
- Cada Owner ou Editor deverá aceitar o termo vigente antes da primeira criação ou edição de conteúdo.
- O aceite registrará usuário, banda, versão do termo e data/hora gerada pelo servidor.
- Uma mudança material no termo exigirá novo aceite antes de editar, sem bloquear leitura ou modo palco.
- O piloto aceitará somente letras autorais da própria banda, em domínio público ou com autorização. Não haverá busca ou importação automática de sites de letras.

### Repertório e estrutura da letra

- Cada banda manterá seu próprio repertório e uma única versão vigente de cada música.
- Os campos previstos são título, artista original, tonalidade, BPM, duração estimada, referência do YouTube, letra estruturada, observações, estado da sincronização e `updated_at`.
- A letra será um documento JSONB dentro da música, composto por blocos e linhas ordenados. Blocos e linhas terão identificadores estáveis; cada linha poderá ter seu início em milissegundos.
- Não haverá tabelas por linha, histórico de versões ou consulta textual avançada no MVP. A gravação de toda a letra será atômica.
- Os estados serão Sem letra, Letra estática, Sincronização incompleta e Sincronizada.
- Serão mantidas somente letras, sem cifras ou transposição.
- Uma música utilizada em shows será arquivada em vez de excluída. Ela deixará de aparecer para novas inclusões, continuará nos shows existentes e poderá ser restaurada.

### Sincronização manual com YouTube

- A preparação exigirá conexão e usará um vídeo visível do YouTube como áudio de referência.
- Nos aplicativos móveis, uma WebView do sistema hospedará a API oficial YouTube IFrame e enviará estado e tempo atual ao React Native por uma ponte JavaScript. Na web, o IFrame será incorporado diretamente.
- Enquanto o vídeo estiver tocando, o tempo poderá ser amostrado aproximadamente a cada 200 a 250 milissegundos; o toque em uma linha registrará o instante observado e permitirá correção manual.
- O player manterá controles, marca, dimensões e identificação de origem exigidos pelo YouTube. Não haverá sobreposição dos controles, reprodução oculta ou em segundo plano, download ou extração de áudio.
- Serão armazenados somente URL ou identificador do vídeo, duração quando necessária e tempos das linhas.
- Spotify não fará parte do MVP, evitando dependência de conta Premium e um segundo fluxo de reprodução.

### Shows, estados e setlists

- O show terá nome, data, horário, local, observações, estado e `updated_at`.
- Cada show terá setlist própria e poderá ser criado pela duplicação de outro show.
- A setlist aceitará blocos nomeados, como Primeiro Set, Segundo Set e Bis. Um bloco Principal será criado como padrão.
- Blocos e músicas poderão ser reordenados, e suas durações totais serão calculadas.
- Cada item poderá ter uma observação opcional específica do show, sem alterar a música do repertório. Ela aparecerá na setlist e no modo palco.
- Os estados compartilhados serão Rascunho, Pronto e Cancelado. Não haverá Em andamento ou Finalizado; shows passados serão identificados pela data.
- Rascunho aceitará edição e prévia online do modo palco, mas não poderá ser baixado.
- Pronto ficará somente para leitura e aceitará modo palco online ou offline. Owner ou Editor deverá retorná-lo a Rascunho para editar.
- Cancelado ficará somente para leitura, não aceitará novos downloads nem modo palco e poderá ser reaberto como Rascunho. Pacotes existentes serão bloqueados e removidos na próxima conexão.
- Colocar um show em Pronto exibirá uma lista de letras ausentes ou incompletas, mas não impedirá a operação.
- Entrar no modo palco não modificará o estado compartilhado.

### Verificação de conteúdo atualizado

- Os itens da setlist continuarão referenciando a música vigente; não criarão cópias ou versões por show.
- Músicas e shows terão `updated_at` do tipo timestamp com fuso, gerado pelo banco, nunca pelo relógio do dispositivo.
- Alterações em blocos, itens, ordem ou observações atualizarão o timestamp do show.
- O servidor fornecerá um único `content_updated_at` do pacote, considerando o show e todas as músicas incluídas.
- O pacote guardará esse timestamp. Ao conectar, o aplicativo comparará o valor local com o atual, sem usar número de versão ou histórico.
- A interface mostrará Conteúdo atualizado, Atualização disponível ou Verificação pendente quando estiver offline. O termo `sincronizado` será reservado ao estado temporal da letra.
- Uma alteração de música não mudará o estado Pronto dos shows que a utilizam. O pacote anterior continuará disponível até o músico solicitar uma atualização completa e atômica.

### Modo palco e interrupções

- Cada músico iniciará manualmente seu próprio cronômetro. Os cronômetros serão independentes e não tentarão permanecer sincronizados entre aparelhos.
- A linha correspondente ao tempo atual ficará destacada, mantendo linhas anteriores e seguintes visíveis.
- A tela exibirá tempo transcorrido, duração total, observação do item e prévia da próxima música.
- Os controles incluirão pausar, avançar ou voltar cinco segundos e reiniciar. A próxima música será sempre acionada manualmente por toque ou gesto.
- O modo permitirá ajustar fonte, tema e orientação e tentará manter a tela ativa enquanto estiver aberto.
- Ao perder foco, bloquear a tela ou receber uma chamada, um cronômetro em execução continuará baseado no tempo real. Ao retornar, o aplicativo recalculará o tempo e avançará para a linha correspondente; um cronômetro pausado continuará pausado.
- Se o processo for encerrado, o show e a música serão restaurados, mas o aplicativo perguntará se o músico deseja Retomar ou Reiniciar. Nenhum cronômetro será iniciado silenciosamente.
- Um bloqueio manual contra toques acidentais desabilitará pausa, ajustes, troca de música e gestos, sem interromper cronômetro ou rolagem. Um indicador discreto será exibido e o desbloqueio exigirá pressionar o controle por aproximadamente dois segundos. O bloqueio nunca será ativado automaticamente.
- Sem letra, serão mostrados cronômetro, controles e `Sem letra cadastrada`. Letra estática ou parcialmente sincronizada ficará disponível para leitura manual, sem destaque automático enganoso.
- Perda de conexão ou impossibilidade de verificar atualização produzirá apenas um indicador discreto. Nenhuma caixa de diálogo cobrirá a letra durante a execução.
- Pacote ausente ou corrompido bloqueará o modo palco offline e solicitará novo download quando houver conexão.

### Pacotes offline móveis

- A edição será exclusivamente online e a versão web não terá pacotes offline.
- Somente shows Prontos poderão ser baixados nos aplicativos móveis.
- Cada pacote será um arquivo JSON autocontido com dados do show, setlist, letras, tempos, observações, metadados e `content_updated_at`.
- Os arquivos ficarão na área persistente do aplicativo, não no cache temporário. Não haverá prazo de expiração nem limpeza automática por idade.
- O músico escolherá os shows a baixar e poderá removê-los manualmente. Como não haverá áudio nem imagens, não será imposto limite próprio de armazenamento no MVP.
- A atualização gravará e validará um arquivo temporário antes de substituir o anterior. Apenas o pacote atual será mantido.
- SQLite não será usado. Ele só será reconsiderado diante de edição offline, consultas locais complexas ou volume que torne os arquivos inadequados.
- Na ausência de conexão, o pacote poderá ser aberto usando a última sessão considerada válida, sempre sem edição. Não será prometida revogação instantânea enquanto o aparelho continuar totalmente offline.
- Logout removerá sessão e todos os pacotes do usuário. Perda de participação ou cancelamento do show bloqueará e removerá os pacotes correspondentes na próxima conexão.
- Arquivo inválido ou corrompido será descartado e exigirá novo download.

### Modelo PostgreSQL e RLS

```text
Usuario --< Participacao >-- Banda --< Convite
                              |
                              +-- Musica (letra JSONB)
                              |
                              +-- Show --< Bloco --< Item >-- Musica
                              |
                              +-- Aceite de termo

Dispositivo movel --< Pacote JSON de show
```

O modelo usará as tabelas `profiles`, `bands`, `band_members`, `invitations`, `songs`, `shows`, `show_blocks`, `show_items` e `legal_acceptances`. Não haverá tabelas de linhas da letra, histórico, áudio ou downloads do dispositivo.

Todas as tabelas de negócio usarão RLS com negação por padrão e escopo por participação ativa na banda. Owner terá administração completa; Editor terá escrita apenas de conteúdo e leitura de integrantes; Member terá somente leitura. Usuários sem banda acessarão apenas o próprio perfil, convites válidos apresentados por token e a criação de uma banda.

Regras que envolvem mais de uma linha serão protegidas por funções ou gatilhos do banco: impedir a saída do último Owner, aceitar convites de forma atômica, respeitar estados de show, atualizar timestamps derivados e anonimizar referências após exclusão da conta. O cliente não será a única barreira de autorização.

### Plano do Supabase

- O desenvolvimento e o piloto começarão no plano Free.
- Banco, tráfego e usuários ativos serão monitorados mensalmente.
- A migração será avaliada ao atingir 80% de qualquer cota, antes de lançamento público que exija disponibilidade e backups, ou quando a pausa por inatividade deixar de ser aceitável.
- Se houver migração para o Pro, o limite de gastos permanecerá ativado inicialmente.

### Privacidade, lojas e uso de terceiros

- O conteúdo ficará restrito a integrantes convidados e não será indexado publicamente, mas essa restrição não será tratada como licença autoral.
- Antes da distribuição pública serão elaborados e revisados juridicamente o termo de uso, a política de privacidade e o procedimento para denúncias e remoção de conteúdo.
- A política explicará o tratamento mínimo de nome, e-mail, identificador social, participações e conteúdo e oferecerá meios de acesso, correção e exclusão.
- A exclusão de conta estará disponível dentro do aplicativo e também será atendida pela versão web.
- A integração com YouTube seguirá os termos do player incorporado e não tentará contornar anúncios, marca, controles, restrições de reprodução ou indisponibilidade do vídeo.

## Risks / Trade-offs

- [Cronômetros independentes podem divergir entre músicos] -> Manter controles rápidos de correção e estudar reconhecimento automático somente após validar o fluxo manual.
- [Um integrante removido pode visualizar conteúdo baixado enquanto permanecer totalmente offline] -> Limpar na próxima conexão e comunicar explicitamente que não existe revogação offline instantânea.
- [A versão web depende de conexão e do armazenamento de sessão do navegador] -> Apresentar claramente o estado da conexão e reservar a execução offline confiável aos aplicativos móveis.
- [O plano Free pode pausar e não possui garantias adequadas ao uso público] -> Monitorar cotas e migrar antes de depender de disponibilidade e backups de produção.
- [Arquivos JSON são inadequados a consultas locais complexas] -> Usá-los somente como pacotes autocontidos de leitura e reconsiderar SQLite quando os requisitos mudarem.
- [Vídeos podem ficar indisponíveis ou políticas do YouTube podem mudar] -> Usá-los somente na preparação; o modo palco dependerá dos tempos salvos e a integração será validada periodicamente.
- [Tokens podem desaparecer no Android ou persistir no Keychain após reinstalação no iOS] -> Validar a sessão no servidor e tratar sessão ausente ou inválida normalmente.
- [O aceite do termo não elimina risco de infração autoral] -> Restringir fontes, oferecer remoção e obter revisão jurídica e licenças necessárias antes do lançamento público.
- [Uma atualização pode afetar vários shows Prontos] -> Sinalizar pacotes desatualizados e exigir atualização explícita, evitando mudança silenciosa durante a apresentação.
- [Comparações por timestamp dependem de atualização correta no banco] -> Gerar todos os valores no servidor e cobrir gatilhos de blocos, itens e músicas com testes de integração.

## Migration Plan

Não existe sistema anterior nem dados a migrar. A implantação será incremental, com projetos e URLs separados para desenvolvimento e produção. Migrações criarão tabelas, funções, gatilhos e políticas RLS de forma reproduzível antes da publicação dos clientes. O piloto validará Android, iOS e web com poucas bandas. Enquanto estiver no MVP, a reversão ocorrerá publicando a versão anterior do cliente e desabilitando temporariamente novas operações sem apagar conteúdo das bandas.

## Validações pendentes

- Construir um protótipo do YouTube IFrame em WebView e navegador e validar vídeo visível, play, pause, busca, leitura de tempo, captura de linha, origem/referer e falhas em Android, iOS e web.
- Validar o cronômetro e sua restauração após bloqueio, mudança de foco, chamada e encerramento do processo nos sistemas suportados.
- Configurar e testar Google, Apple, URLs de retorno, links de convite e preservação do token durante autenticação em desenvolvimento e produção.
- Implementar testes de integração das políticas RLS, do último Owner, dos estados do show, dos convites e dos timestamps de conteúdo.
- Validar escrita atômica, corrupção, substituição e limpeza dos pacotes JSON em Android e iOS.
- Redigir a versão inicial do termo de responsabilidade e da política de privacidade e submetê-los a revisão jurídica antes de distribuição pública.
