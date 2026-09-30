# Política de privacidade do Setlist — rascunho

> **RASCUNHO PARA DISCUSSÃO. Não publicar.** Os itens entre colchetes dependem
> de confirmação operacional e do responsável pelo serviço. Revisão jurídica é
> obrigatória antes da publicação.

- Versão de trabalho: 0.1
- Data de preparação: 29/09/2026
- Controlador: pessoa física que opera o Setlist. Identificação pública
  escolhida: **Setlist — setlistbr.app.br**; confirmar com assessoria jurídica
  se é suficiente para identificar o controlador.
- Canal para titulares: e-mail geral, também destinado a pedidos de privacidade
  e remoção de conteúdo — **contato@setlistbr.app.br**
- A caixa será devidamente monitorada para solicitações dos titulares.
- CPF e endereço: **não preencher nesta etapa; avaliar necessidade de divulgação com assessoria jurídica**
- Encarregado: o responsável pretende não nomear encarregado formal e usar o
  canal geral, se a dispensa para agente de tratamento de pequeno porte for
  aplicável; confirmar o enquadramento e eventuais exclusões com assessoria.

## 1. Escopo

Esta política descreve o tratamento de dados pessoais no Setlist, serviço de
organização de bandas, repertórios, letras, shows e setlists. O serviço será
gratuito para os usuários e o código-fonte será disponibilizado como código
aberto sob GNU AGPL-3.0-only. Isso não torna público o conteúdo das contas ou
bandas. A identificação pública escolhida é **Setlist — setlistbr.app.br**;
assessoria jurídica deverá confirmar se essa identificação é suficiente para
identificar o controlador, que é pessoa física. A região do serviço e os prazos
de retenção ainda precisam ser confirmados. O canal escolhido é o e-mail geral
**contato@setlistbr.app.br**, que também receberá solicitações de titulares e
pedidos de remoção de conteúdo. O responsável informa que a caixa será
devidamente monitorada. O responsável pretende não nomear encarregado formal
se puder aplicar a dispensa prevista na Resolução CD/ANPD nº 2/2022; o
enquadramento, inclusive a avaliação de critérios de alto risco que podem
afastar a dispensa, ainda deve ser confirmado. Caso dispensado, o canal geral
continuará disponível aos titulares. A LGPD trata a identificação do controlador e as
informações de contato como itens separados; a eventual divulgação de
CPF/endereço será decidida após verificar se regras de contratação eletrônica
se aplicam ao modelo do serviço. Conforme a decisão atual do responsável, não
haverá anúncios, patrocínios, doações ou receita ligada ao aplicativo; os custos
serão cobertos pelo responsável. Se esse modelo mudar, a política deverá ser
revista antes da alteração.

## 2. Dados tratados

O código e o schema atuais indicam estas categorias:

| Categoria | Exemplos observados | Uso no serviço |
| --- | --- | --- |
| Identidade da conta | Identificador de usuário, e-mail, nome e metadados de identidade recebidos do provedor Google | Autenticar, manter a sessão e apresentar o perfil |
| Perfil | Nome de exibição e URL de avatar, quando disponíveis | Mostrar a identidade no perfil e nas listas de integrantes |
| Participação | Identificador da banda, papel e data de ingresso | Aplicar permissões e mostrar a participação |
| Convites | Rótulo opcional, hash do token, datas de criação, expiração, uso ou revogação e referências aos perfis envolvidos | Criar, aceitar, administrar e proteger links de convite |
| Aceites | Pessoa, banda, versão do termo e horário registrado pelo servidor | Demonstrar o aceite do termo de responsabilidade por conteúdo |
| Conteúdo da banda | Nome da banda, músicas, artista, tonalidade, BPM, duração, letras, observações, referência YouTube, shows, local, data, estado, blocos e setlist | Prestar as funções colaborativas solicitadas pela banda |
| Dados técnicos | Dados da sessão e registros operacionais que o app e seus fornecedores possam gerar, como horário e metadados de acesso; o GitHub informa que registra o IP de quem visita um site do GitHub Pages para fins de segurança | Identificar os registros efetivamente mantidos por cada fornecedor, suas finalidades e prazos |

Não foi localizado SDK de analytics ou publicidade no código consultado. Isso
não confirma a ausência de registros produzidos por hospedagem, autenticação,
infraestrutura, navegador ou ferramentas operacionais. O responsável deve
inventariá-los antes da publicação.

## 3. Finalidades e bases legais

Os dados são tratados para autenticar a pessoa e manter sua sessão; criar e
apresentar o perfil; administrar participação e permissões das bandas; criar,
validar e administrar convites; registrar a versão dos termos aceita; armazenar
e exibir o conteúdo da banda; proteger o serviço e atender solicitações e
obrigações legais. O responsável confirma que não há finalidade de analytics,
publicidade, marketing, venda de dados ou compartilhamento comercial.

> **Nota interna para revisão jurídica — bases candidatas, não conclusão legal:**
> os tratamentos necessários para fornecer as funções solicitadas pela pessoa
> podem se enquadrar na execução de contrato ou em procedimentos preliminares
> solicitados por ela (LGPD, art. 7º, V). O registro de aceite e o tratamento
> de solicitações ou obrigações devem ser avaliados conforme a finalidade
> específica, inclusive cumprimento de obrigação legal (art. 7º, II) ou
> exercício regular de direitos (art. 7º, VI), quando aplicáveis. Segurança,
> prevenção de abuso e análise de incidentes podem exigir avaliação de legítimo
> interesse (art. 7º, IX), com teste documentado de finalidade, necessidade,
> balanceamento e salvaguardas conforme orientação da ANPD. Não presumir uma
> base única para todos os dados nem tratar o aceite dos termos como
> consentimento geral para qualquer finalidade. Confirmar dados, prazos,
> titulares afetados e base de cada operação antes da publicação. [LGPD](https://www.planalto.gov.br/ccivil_03/leis/l13709.htm),
> [guia da ANPD sobre legítimo interesse](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia_orientativo_hipoteses_legais_tratamento_de_dados_pessoais_legitimo_interesse).

## 4. Acesso, compartilhamento e fornecedores

Nome, e-mail disponível, avatar e conteúdo da banda podem ser vistos por
integrantes com acesso àquela banda, conforme o papel e as permissões da
aplicação. As políticas de acesso do banco são aplicadas no backend; a lista
final de dados visíveis a cada papel deve ser conferida contra a configuração
de produção antes do lançamento.

Os fornecedores e integrações identificados no código e na configuração são:

| Fornecedor/integração | Situação e finalidade | Dados e observações |
| --- | --- | --- |
| Google | Ativo como provedor de login e destino final Gmail/Google da caixa de contato encaminhada pela Cloudflare | O fluxo de login recebe identificador e, quando disponíveis, e-mail, nome e avatar do perfil. O Gmail/Google também recebe o conteúdo das mensagens enviadas ao canal de contato, que pode incluir dados pessoais fornecidos pela pessoa solicitante. Confirmar no Google Cloud e no Supabase os escopos e dados efetivamente habilitados. |
| Supabase | Ativo para autenticação, banco de dados e acesso ao conteúdo | Guarda contas, perfis, bandas, integrantes, convites, aceites e conteúdo. Os projetos consultados usam a região primária `sa-east-1` (São Paulo). O contrato e a lista de suboperadores precisam ser conferidos; a região primária não determina por si só todos os locais de processamento. |
| GitHub Pages | Ativo para servir a versão Web | Além dos arquivos públicos da aplicação, o GitHub informa que registra o IP de visitantes para segurança. O prazo desses registros específicos ainda precisa ser confirmado. Logs de CI/build são tratados separadamente e não são registros de uso do app. |
| YouTube | Player externo opcional usado na sincronização de letras | O app carrega a API oficial do player e um vídeo escolhido pela pessoa. Quando o player é carregado, o YouTube recebe dados básicos para mostrar o vídeo e verificar disponibilidade, restrições e segurança. Aplicam-se os termos e a política de privacidade do Google/YouTube. |
| Apple — Iniciar sessão com Apple | Planejado; o botão atual informa “em breve” e não inicia autenticação | Quando a integração for habilitada, a Apple poderá fornecer um identificador e, conforme os dados solicitados e a escolha da pessoa, nome e e-mail, inclusive endereço de retransmissão privada. Atualizar esta política antes da ativação. |
| Cloudflare Email Routing | Roteamento de entrada do e-mail de contato, conforme os registros MX públicos do domínio | O recebimento passa primeiro por servidores MX da Cloudflare e, conforme confirmação do responsável, é encaminhado a uma caixa Gmail/Google. |

O responsável confirma que não há publicidade, marketing, venda de dados,
patrocínio ou compartilhamento comercial. O canal de contato é monitorado e as
mensagens são encaminhadas da Cloudflare ao Gmail/Google. Antes da publicação,
confirmar escopos OAuth, contratos, regiões de processamento, suboperadores,
prazos de logs e mecanismo aplicável a cada transferência internacional.

> **Nota interna de transferência internacional:** os metadados atuais do
> Supabase mostram os projetos em `sa-east-1` (São Paulo). O DPA do fornecedor
> diz que os dados dirigidos a uma região específica são armazenados e
> primariamente processados nela, mas também permite subprocessadores em locais
> onde o fornecedor mantenha instalações. O controlador deve revisar os termos
> efetivamente aplicáveis e identificar destinos e salvaguardas, considerando
> o Regulamento de Transferência Internacional da ANPD. Não afirmar que todos
> os dados ficam no Brasil apenas pela região primária do banco. [Regiões do Supabase](https://supabase.com/docs/guides/platform/regions),
> [DPA e suboperadores do Supabase](https://supabase.com/legal/customer-resources/data-processing-addendum),
> [Resolução CD/ANPD nº 19/2024](https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-19-de-23-de-agosto-de-2024).

## 5. Armazenamento local e segurança

A sessão é mantida por armazenamento seguro da plataforma nos aplicativos
móveis e por armazenamento do navegador na Web. Dados de conteúdo do repertório
e dos shows são mantidos online no backend; não são armazenados no SecureStore.
O código aplica controle de acesso por banda e papéis e políticas de Row Level
Security. A descrição pública das medidas de segurança, proteção em trânsito,
backups, registros e resposta a incidentes depende de validação da configuração
operacional: **[PREENCHER COM MEDIDAS CONFIRMADAS, SEM PROMESSAS NÃO VERIFICADAS]**.

## 6. Retenção e exclusão

Os dados são mantidos pelo tempo necessário para as finalidades informadas,
considerando a natureza dos dados, a necessidade de prestar o serviço e as
obrigações legais ou regulatórias aplicáveis. Registros de solicitações de
privacidade e remoção são mantidos enquanto necessários para tratar e
documentar o caso, cumprir obrigação legal ou regulatória, ou exercer direitos;
encerrada essa necessidade, são excluídos ou anonimizados, salvo hipótese legal
que justifique retenção adicional. O controlador não pretende manter esses
registros indefinidamente. Os prazos concretos e exceções devem ser confirmados
no inventário de retenção e com assessoria jurídica antes da publicação.
Logs operacionais dos fornecedores têm prazos próprios e não representam o
prazo de retenção dos dados da conta. Cópias de backup podem continuar
contendo dados já removidos da base ativa até expirarem; o prazo aplicável ao
projeto precisa ser confirmado.

> **Nota interna de apuração — substituir por prazos confirmados antes de
> publicar:** a documentação atual do Supabase informa retenção dos logs de API
> e banco de 1 dia no Free, 7 dias no Pro, 28 dias no Team e 90 dias no
> Enterprise. Backups automáticos diários não estão incluídos no Free; a
> documentação informa 7 dias no Pro e 14 dias no Team, com prazo personalizado
> no Enterprise. O CLI lista os projetos `setlist-dev` e `setlist-prod` na
> organização Supabase; o `.env.local` deste checkout aponta para `setlist-dev`.
> A listagem do CLI não informa o plano da organização nem as configurações de
> PITR. Confirmar esses itens no painel antes de publicar. [Planos e prazos do Supabase](https://supabase.com/pricing),
> [backups do Supabase](https://supabase.com/features/database-backups).
>
> O workflow do GitHub Pages define retenção de 1 dia para o artefato estático
> de publicação. A configuração consultada no GitHub para este repositório
> define retenção de 90 dias para artefatos e logs do Actions. Esses artefatos
> e logs de CI não são logs de atividade do app. [Retenção do GitHub Actions](https://docs.github.com/en/organizations/managing-organization-settings/configuring-the-retention-period-for-github-actions-artifacts-and-logs-in-your-organization).

No fluxo atual de exclusão, o app remove o perfil e a identidade de autenticação
da pessoa e encerra a sessão local. Vínculos de participação são removidos;
referências de aceite e de autoria/uso de convite são desvinculadas do perfil.
Conteúdo de bandas que permanecem ativas não é removido junto com a conta. Uma
banda só pode ser excluída pelo seu único Proprietário quando for também o
único integrante. Os prazos de propagação para backups e registros do provedor
precisam ser informados pelo controlador e pelo Supabase. O prazo do backup
aplicável depende do plano efetivo e de eventual PITR, ainda não confirmados.

## 7. Direitos e solicitações

Você pode solicitar confirmação e acesso aos dados, correção, informação sobre
compartilhamentos e demais direitos aplicáveis previstos na LGPD, pelo e-mail
geral de contato **contato@setlistbr.app.br**. Esse canal também recebe dúvidas
gerais e pedidos de remoção de conteúdo. O recebimento será confirmado em até
5 dias úteis. Para pedidos sobre uma conta, o controlador verificará primeiro o
e-mail associado a ela e poderá pedir informação adicional mínima se necessário.
Não é solicitado documento oficial de identidade por padrão. Se, em situação
excepcional, ele for indispensável, o controlador explicará o motivo e só o
receberá por canal seguro previamente habilitado; nunca deverá ser enviado à
caixa geral de e-mail. Se esse canal não estiver disponível, será buscada uma
forma alternativa e proporcional de confirmação. A cópia será apagada após a
verificação, salvo obrigação legal de retenção, e o caso registrará apenas a
justificativa, a data e o resultado, sem reproduzir os dados do documento. O
controlador avaliará o pedido e responderá no prazo legal aplicável; o prazo de
confirmação não substitui o prazo de atendimento do pedido. A exclusão pode
estar sujeita a obrigações legais, preservação de conteúdo compartilhado da
banda ou outras exceções que devem ser explicadas no atendimento. A aplicação
concreta dos prazos de retenção e das exceções precisa de revisão jurídica.

## 8. Idade mínima

O serviço é destinado exclusivamente a pessoas com 18 anos ou mais. O app não
deve ser apresentado como destinado a crianças ou adolescentes. Antes de
iniciar o login, a pessoa deverá fazer uma autodeclaração de que tem 18 anos ou
mais; não será solicitada data de nascimento para essa confirmação. A
autodeclaração ainda precisa ser implementada. Se houver uso em desacordo com
o critério de idade, o acesso poderá ser restringido e os dados serão tratados
conforme esta política e as obrigações legais aplicáveis, sem promessa de
exclusão automática de todos os dados. A LGPD estabelece que o tratamento de
dados de crianças e adolescentes deve observar seu melhor interesse.

## 9. Atualizações e contato

Mudanças materiais serão comunicadas por **[CANAL E CRITÉRIO DE AVISO]**. Dúvidas,
exercício de direitos, reclamações ou suspeitas de incidente de segurança podem
ser enviados ao e-mail geral de contato **contato@setlistbr.app.br**. O
controlador manterá uma versão datada desta política em **[URL CANÔNICA]**.

### Referências para validação jurídica

- Lei nº 13.709/2018 (LGPD): <https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm>
- Resolução CD/ANPD nº 2/2022, se o controlador se enquadrar como agente de
  tratamento de pequeno porte: <https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-2-de-27-de-janeiro-de-2022>
