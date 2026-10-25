# Publicação dos documentos legais

## Estado atual em 21/10/2026

Os documentos públicos versão 1.0.0, com vigência em 21/10/2026, foram
publicados a partir da `main` pela PR #70 e pelo workflow [Publicar GitHub
Pages, execução 39628507603](https://github.com/anderson-sillos/setlist/actions/runs/39628507603).
As URLs canônicas `/termos/` e `/privacidade/` retornaram HTTP 200 sem
autenticação e exibiram a versão e a data aprovadas. A tarefa 11.8.9 está
concluída. Este runbook passa a servir para futuras alterações dos documentos.

O grupo 11.8 permanece aberto: os documentos legais da Web estão publicados e
as configurações etárias das lojas foram conferidas, mas o app ainda não está
em distribuição pública nas duas lojas. O Google Play mantém o AAB em teste
fechado e o App Store Connect solicitou informações adicionais sob a diretriz
2.1.

### Candidata de atualização dos Termos preparada em 24/10/2026

`docs/termos.html` contém uma proposta de versão 1.1.0 que explica que a busca
assistida pode sugerir dados e letras de fontes externas, sem confirmar direitos
ou conceder licença. A versão 1.0.0 continua sendo a versão pública vigente até
que a proposta seja aprovada e publicada. A vigência da candidata foi definida
como 24/10/2026. A Política de Privacidade pública
permanece na versão 1.0.0; antes de atualizar as páginas públicas em conjunto,
revisar sua divulgação da consulta iniciada pela pessoa usuária, que envia o
título e, quando informado, o nome do artista à fonte externa.

Os arquivos-fonte das páginas públicas são `docs/termos.html` e
`docs/privacidade.html`. O workflow de GitHub Pages copia esses arquivos para
`/termos/` e `/privacidade/`. A versão pública dos Termos permanece 1.0.0 até a
publicação da candidata 1.1.0. O aplicativo aponta para os endereços canônicos
`https://setlistbr.app.br/termos/` e
`https://setlistbr.app.br/privacidade/` no login e no menu lateral.

Antes de publicar uma versão:

1. Conferir os textos finais com o responsável, inclusive afirmações sobre
   moderação, retenção, fornecedores, avisos e exclusão de conta. A revisão
   jurídica informada pelo responsável foi feita sobre as minutas; confirmar
   que a versão pública condensada preserva as decisões aprovadas. A comparação
   factual das páginas candidatas com as minutas e com o fluxo de aceite foi
   feita em 02/10/2026. As versões públicas 1.0.0 foram atualizadas em
   21/10/2026; o responsável aprovou a redação pública e a data de vigência em
   21/10/2026.
2. Decisão do responsável: os termos gerais serão disponibilizados antes do
   login e no aplicativo, sem aceite explícito registrado. O disclaimer do
   login informa que prosseguir significa concordar com os Termos de uso; a
   Política de privacidade permanece para consulta, sem ser apresentada como
   consentimento geral. O aceite separado do termo de responsabilidade da
   banda continua existindo.
3. As páginas publicadas registram vigência em 21/10/2026, data aprovada pelo
   responsável. Para uma futura atualização, definir a nova vigência antes de
   publicar e atualizar ambas as páginas.
4. Conferir a configuração efetiva em produção antes de fixar a descrição
   final dos prazos de retenção. As migrações de convites e de frequência de
   denúncias foram aplicadas e conferidas em produção. Em 21/10/2026, a limpeza
   de auditoria Auth de 30 dias também foi confirmada em produção e
   desenvolvimento: migração, preflight e cinco critérios agregados do monitor
   passaram nos dois projetos. A rotina de backup diário foi implantada e uma
   restauração isolada foi validada no projeto `setlist-restore` em 20/10/2026.
   Em 21/10/2026, o responsável determinou considerar concluídas a retenção
   do Brevo e a revisão do DPA na 11.8.8. As páginas publicadas refletem a
   retenção definida de um mês e a desativação de novas prévias.
5. As configurações foram conferidas em 21/10/2026: Google Play com público
   exclusivo 18+ e restrição para contas identificadas como menores; App Store
   Connect com override +18, A18 no Brasil e valores regionais registrados na
   seção 11.8.7. Não afirmar que o login verifica a idade ou que as lojas
   restringem a versão Web. Conferir os rótulos das fichas públicas quando a
   distribuição nas lojas avançar.
6. Em uma futura publicação, abrir ambas as URLs sem autenticação na Web e nos
   navegadores de Android e iOS. Confirmar conteúdo, título, versão, data,
   links cruzados, contato e acesso pelo login e pelo menu do app.

Para publicar uma futura atualização dos documentos legais junto à Web
candidata, primeiro integre a versão aprovada à `main`. Depois execute **Publicar GitHub Pages** por
`workflow_dispatch`, selecione a branch `main`, informe a Release candidata já
publicada `v1.0.0-rc.4` e ative `publish_current_legal_docs`. O site Web será
gerado da tag; os documentos legais virão da `main`. Confira a execução e os
conteúdos publicados antes de encerrar a atualização.

### Configuração etária nas lojas (11.8.7)

Faça as configurações no painel de cada loja com respostas fiéis ao produto.
O público-alvo e a classificação de conteúdo são declarações separadas; não
altere as respostas do questionário de conteúdo só para obter 18+.

#### Google Play Console

1. Abra **Policy → App content → Target audience and content** e selecione
   **Manage** (ou **Start**, se ainda não configurado). Antes de concluir,
   confira também as declarações de anúncios, instruções de acesso ao app e a
   URL pública da política de privacidade, exigidas para preencher esta seção.
2. Em **Target age**, selecione somente **18 and over**. Na mesma tela, marque
   **Restrict Minor Access** para impedir que contas que o Google identifique
   como menores encontrem, baixem ou comprem o app.
3. Revise as respostas de **App details**, salve e conclua o envio das
   alterações que o Console solicitar. Preencha separadamente o questionário
   **Content rating** com respostas verdadeiras sobre os recursos e conteúdo
   do Setlist.
4. Guarde uma captura do resumo salvo em que apareçam o grupo exclusivo **18
   and over** e **Restrict Minor Access** ativo, além da data da conferência.
   Abra a ficha da loja e confirme que a classificação está visível.

O Google diz que usuários identificados como menores deixam de encontrar,
baixar ou comprar o app; pessoas que já o instalaram ainda podem usá-lo. O
Console também avisa que pode não bloquear menores que não declararam ter menos
de 18 anos. A configuração da loja não acrescenta verificação de idade ao login
do Setlist e não restringe a versão Web. [Gerenciar público-alvo e conteúdo no Play
Console](https://support.google.com/googleplay/android-developer/answer/9867159?hl=pt-BR).

#### App Store Connect

1. Abra **Apps → Setlist → General → App Information → Age Ratings** e clique
   em **Set Up Age Ratings** (ou **Edit** para uma configuração existente).
2. Responda todas as perguntas sobre controles, recursos e frequência de
   conteúdo conforme o app realmente funciona. Confira o valor calculado.
3. Em **Age Categories and Override**, selecione **Override to Higher Age
   Rating** e escolha **18+**, pois os Termos do Setlist estabelecem idade
   mínima de 18 anos. Não mude as respostas do questionário para tentar obter
   esse valor: a opção de override é o controle próprio para elevar a
   classificação.
4. Salve, registre a classificação global e os valores regionais mostrados em
   **App Information** e confira a ficha da App Store. Guarde uma captura da
   classificação salva e da data. Se o campo opcional **Age Suitability URL**
   for usado, informe uma página pública que explique a restrição etária.

A Apple determina que, quando a EULA do app prevê idade mínima superior ao
resultado calculado, a classificação deve ser elevada por override; a
classificação ajustada é mostrada pela loja, com os valores regionais
correspondentes. Isso não verifica a idade dentro do app nem restringe o
Setlist Web. [Definir classificação
etária no App Store Connect](https://developer.apple.com/help/app-store-connect/manage-app-information/set-an-app-age-rating).

#### Evidência para concluir a 11.8.7

Estado conferido em 21/10/2026:

- As capturas do Play Console mostram somente **18 and over** selecionado e
  **Restrict users that Google has determined to be minors from my app**
  ativado. O Google pode não bloquear menores que não declararam ter menos de
  18 anos; a restrição não afeta quem já instalou o app.
- A captura do App Store Connect mostra **+18** em 173 países ou regiões,
  **A18** no Brasil, **+19** na Coreia do Sul e `https://setlistbr.app.br/termos/`
  como URL de indicação etária. Para sistemas anteriores à versão 26, o painel
  mostra a classificação global legada **+17**, com exceções regionais. A
  Apple mantém escalas diferentes por versão do sistema; a classificação
  legada não deve ser descrita como +18. [Valores oficiais de classificação
  etária da Apple](https://developer.apple.com/help/app-store-connect/reference/app-information/age-ratings-values-and-definitions/).
- As configurações das lojas não verificam idade no cadastro do Setlist e não
  restringem a versão Web. O Setlist mantém nos Termos a idade mínima de 18
  anos; não afirmar que as lojas impedem todo acesso de menores.

Com as capturas dos dois painéis registradas, a configuração da 11.8.7 foi
conferida. A disponibilidade pública das fichas e os valores nelas visíveis
devem ser verificados quando a distribuição estiver publicada.

### Retenção de logs transacionais do Brevo

#### Roteiro de configuração e evidência (11.8.5)

1. Entre na conta Brevo usada pelo Setlist com o perfil de administrador e
   abra o menu da conta → **Settings → Transactional emails → Retention
   rules**.
2. Em **Which senders' logs do you want to store?**, selecione **All senders**.
   Em retenção, escolha **1 month** e confirme que todos os remetentes estão
   cobertos pela regra.
3. Em **Do we need to keep your transactional email previews?**, selecione
   **Never store previews** e salve as alterações.
4. Registre uma captura da regra salva, sem mostrar dados de destinatários,
   conteúdo de e-mail, chaves ou outros segredos. Anote a data e a conta usada.
5. Abra **Transactional → Logs** e revise os eventos anteriores. Para conferir
   se um evento ainda tem conteúdo de prévia, abra os detalhes pelo ícone de
   olho. A coluna `tag`/`None` da lista não informa se há uma prévia armazenada.
   A opção **Never store previews** só impede prévias de mensagens enviadas
   depois de salvar; ela não remove prévias antigas.
6. A documentação do Brevo diz que prévias individuais podem ser removidas,
   mas a ação documentada nos detalhes do log é **Manually delete the
   transactional log**, que apaga o log. Se a interface não oferecer uma ação
   claramente separada para excluir apenas a prévia, não apague o log só para
   removê-la: deixe a retenção de um mês expirar ou confirme com o suporte
   Brevo se há uma remoção seletiva disponível para a conta.
7. A regra de retenção de logs aplica-se retroativamente. Depois de completar
   um mês, a remoção automática pode levar até 24 horas; uma exclusão manual de
   log pode levar até 72 horas para ser processada. Registre apenas o resultado
   agregado e a data, sem copiar conteúdo ou identificadores de destinatários.
8. A 11.8.5 foi considerada concluída por decisão do responsável em
   21/10/2026. Este roteiro permanece como referência operacional para
   auditorias futuras; não é necessário gerar uma denúncia real para conferir a
   retenção.

O Brevo exige ao menos um mês de retenção dos logs para detecção de spam e
reputação do remetente. A exclusão automática pode demorar até 24 horas após o
fim do prazo. Instruções oficiais:
[regras de retenção de logs transacionais e prévias](https://help.brevo.com/hc/en-us/articles/4415743225746-Configure-a-custom-retention-period-for-your-transactional-logs-and-email-previews).

### Revisão contratual do Brevo

#### Registro da revisão do DPA (11.8.8)

Em 21/10/2026, o responsável forneceu o texto do [Apêndice 3 — Data
Processing Agreement (DPA)](https://www.brevo.com/legal/termsofuse/#appendix-3-data-processing-agreement-dpa)
e confirmou sua revisão. O apêndice define o papel do Brevo como processador
dos dados do cliente e separa o uso exclusivamente transacional (SMTP/API) dos
recursos opcionais da plataforma. A integração do Setlist usa a API transacional
para enviar denúncias; não há no código integração de marketing, SMS ou IA.

Para o serviço transacional, o apêndice descreve o armazenamento de Usage Data
e permite desativar prévias dos logs. A configuração de um mês para logs e a
desativação de novas prévias foram registradas separadamente na 11.8.5. O
responsável decidiu que a revisão atende ao escopo efetivamente usado pelo
Setlist e concluiu a 11.8.8 em 21/10/2026. Não há chamado de suporte pendente
para este item.

O procedimento de remoção continua como documento operacional interno. O
canal público para denúncias e contestações está nos termos.

## Conferência de `setlist-prod` em 02/10/2026

Consulta de leitura pelo Supabase CLI, em cópia temporária da configuração
vinculada a `setlist-prod`, encontrou 12 versões em
`supabase_migrations.schema_migrations`, até `20260920160000`. As migrações
posteriores deste repositório ainda não constam do histórico de produção.
Uma consulta direta ao catálogo confirmou que `public.invitations` existe, mas
`public.report_rate_limits`, `public.moderated_songs`,
`public.suspended_accounts`, o gatilho `songs_filter_content`, as funções de
limpeza em `private` e a extensão `pg_cron` ainda não existem. A lista de Edge
Functions de `setlist-prod` está vazia, inclusive sem `report-content`.
O `supabase db push --dry-run`, feito somente na cópia temporária vinculada a
produção, enumerou 14 migrações pendentes, de `20260922120000` a
`20261002101000`, sem aplicá-las.
O backup anterior à implantação ainda depende da identificação do disco
externo criptografado. A tentativa de `supabase db dump --linked` não conseguiu
usar a conexão direta por ausência de IPv6 nesta rede; para a exportação,
conferir a conexão pelo pooler de sessão indicada pelo Supabase, sem registrar
a senha do banco em arquivos do repositório ou em comandos expostos no histórico.

Antes da aplicação, o responsável autorizou dispensar o backup dessa etapa,
pois não havia dados a preservar. Uma consulta de contagem confirmou zero
contas, bandas, participações, músicas, shows, convites e aceites em produção.
As 14 migrações foram aplicadas em 02/10/2026. O histórico agora contém 26
versões; filtro, tabelas de moderação, funções de limpeza e `pg_cron` existem.
Os jobs `setlist-prune-invitations` e `setlist-prune-report-rate-limits` estão
ativos. A Edge Function `report-content` foi implantada e aparece como ativa.

Em 02/10/2026, a lista de segredos de `setlist-prod` passou a mostrar
`BREVO_API_KEY` e `BREVO_SENDER_EMAIL`; a função `report-content` continua
ativa. A presença dos nomes não confirma a validade da chave nem a entrega de
e-mail. A consulta de produção ainda mostrou zero contas e bandas, portanto
não há como confirmar uma denúncia autenticada com alvo existente sem criar
dados de ensaio. Os dois jobs estavam ativos, mas ainda sem execução registrada.
Na conferência de 02/10/2026, o envio, a ocultação, a suspensão e a resposta do
filtro ainda dependiam de dados de ensaio; essa anotação é histórica. A validação
de produção dos fluxos foi confirmada pelo responsável em 19/10/2026. A dispensa
do backup antes das migrações também foi uma decisão histórica: desde 20/10/2026,
a rotina diária está ativa e a primeira cópia cifrada no Drive foi confirmada.
A restauração isolada foi validada em 20/10/2026 no projeto `setlist-restore`,
conforme a tarefa 11.8.4.
