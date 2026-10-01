# Política de privacidade do Setlist — rascunho

> **RASCUNHO PARA DISCUSSÃO. Não publicar.** Os itens entre colchetes dependem
> de confirmação operacional e do responsável pelo serviço. Revisão jurídica é
> obrigatória antes da publicação.

- Versão de trabalho: 0.1
- Data de preparação: 29/09/2026
- URL canônica aprovada para publicação futura:
  **https://setlistbr.app.br/privacidade/** (página ainda não publicada)
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
haverá anúncios próprios do Setlist, patrocínios, doações ou receita ligada ao
aplicativo; os custos serão cobertos pelo responsável. O player incorporado do
YouTube não estará acessível na primeira versão pública. Ao abrir uma
referência externa do YouTube, essa plataforma pode apresentar publicidade
própria. Se o modelo do Setlist mudar, a política deverá ser revista antes da
alteração.

## 2. Dados tratados

O código e o schema atuais indicam estas categorias:

| Categoria           | Exemplos observados                                                                                                                                                                                                       | Uso no serviço                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Identidade da conta | Identificador de usuário, e-mail, nome e metadados de identidade recebidos do provedor Google ou Apple, conforme os dados disponibilizados em cada fluxo                                                                 | Autenticar, manter a sessão e apresentar o perfil                                             |
| Perfil              | Nome de exibição e URL de avatar, quando disponíveis                                                                                                                                                                      | Mostrar a identidade no perfil e nas listas de integrantes                                    |
| Participação        | Identificador da banda, papel e data de ingresso                                                                                                                                                                          | Aplicar permissões e mostrar a participação                                                   |
| Convites            | Rótulo opcional, hash do token, datas de criação, expiração, uso ou revogação e referências aos perfis envolvidos                                                                                                         | Criar, aceitar, administrar e proteger links de convite                                       |
| Aceites             | Pessoa, banda, versão do termo e horário registrado pelo servidor                                                                                                                                                         | Demonstrar o aceite do termo de responsabilidade por conteúdo                                 |
| Conteúdo da banda   | Nome da banda, músicas, artista, tonalidade, BPM, duração, letras, observações, referência YouTube, shows, local, data, estado, blocos e setlist                                                                          | Prestar as funções colaborativas solicitadas pela banda                                       |
| Dados técnicos      | Dados da sessão e registros operacionais que o app e seus fornecedores possam gerar, como horário e metadados de acesso; o GitHub informa que registra o IP de quem visita um site do GitHub Pages para fins de segurança | Identificar os registros efetivamente mantidos por cada fornecedor, suas finalidades e prazos |
| Contato e solicitações | E-mail, conteúdo da mensagem, anexos enviados voluntariamente, datas e histórico de atendimento de dúvidas, pedidos de privacidade, denúncias e incidentes | Receber, verificar, responder e documentar os casos pelo tempo necessário |
| Preferência local | Identificador da última banda selecionada, salvo no aparelho ou navegador | Restaurar a seleção após reabrir o app, sempre conferindo novamente a participação |

Não foi localizado SDK de analytics ou publicidade no código consultado. Isso
não confirma a ausência de registros produzidos por hospedagem, autenticação,
infraestrutura, navegador ou ferramentas operacionais. O responsável deve
inventariá-los antes da publicação.

## 3. Finalidades e bases legais

Os dados são tratados para autenticar a pessoa e manter sua sessão; criar e
apresentar o perfil; administrar participação e permissões das bandas; criar,
validar e administrar convites; registrar a versão dos termos aceita; armazenar
e exibir o conteúdo da banda; proteger o serviço e atender solicitações e
obrigações legais. O responsável confirma que não há finalidade própria de
analytics, publicidade, marketing, venda de dados ou compartilhamento comercial
do Setlist. A abertura de uma referência externa do YouTube, por escolha da
pessoa usuária, é descrita na seção 4.

Letras e observações são campos preenchidos pelas pessoas usuárias. Elas podem
incluir informações sobre terceiros que não possuem conta no Setlist, inclusive
dados sensíveis, embora isso não seja necessário para a finalidade principal do
serviço. Os termos de uso proíbem conteúdo pornográfico e outras formas de
conteúdo sexual ilícito, inclusive em links. Não há filtro automático para
identificar esse material nem aprovação prévia de cada edição. O processo
paralelo previsto de revisão posterior, por denúncia enviada a
**contato@setlistbr.app.br** ou por inspeção, pode exigir acesso limitado ao
conteúdo da banda, aos dados associados e às mensagens recebidas, apenas por
quem estiver autorizado a tratar o caso. Os critérios de inspeção, os acessos,
a base legal e a retenção dos registros precisam ser definidos antes da
publicação.

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

| Fornecedor/integração            | Situação e finalidade                                                                                     | Dados e observações                                                                                                                                                                                                                                                                                                                        |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Google                           | Ativo como provedor de login e destino final Gmail/Google da caixa de contato encaminhada pela Cloudflare | O fluxo de login recebe identificador e, quando disponíveis, e-mail, nome e avatar do perfil. O Gmail/Google também recebe o conteúdo das mensagens enviadas ao canal de contato, que pode incluir dados pessoais fornecidos pela pessoa solicitante. Confirmar no Google Cloud e no Supabase os escopos e dados efetivamente habilitados. |
| Supabase                         | Ativo para autenticação, banco de dados e acesso ao conteúdo                                              | Guarda contas, perfis, bandas, integrantes, convites, aceites e conteúdo. Os projetos consultados usam a região primária `sa-east-1` (São Paulo). O contrato e a lista de suboperadores precisam ser conferidos; a região primária não determina por si só todos os locais de processamento.                                               |
| GitHub Pages                     | Ativo para servir a versão Web                                                                            | Além dos arquivos públicos da aplicação, o GitHub informa que registra o IP de visitantes para segurança. O prazo desses registros específicos ainda precisa ser confirmado. Logs de CI/build são tratados separadamente e não são registros de uso do app.                                                                                |
| YouTube                          | Referência externa aberta somente a pedido da pessoa usuária; o protótipo com player incorporado está sem acesso na primeira versão pública | Ao acionar a referência de uma música, o app abre o endereço no aplicativo ou navegador externo. O tratamento resultante é feito pelo YouTube conforme seus próprios termos e política. O Setlist não envia letras ou repertórios para sincronização. |
| Apple — Iniciar sessão com Apple | Ativo como opção de autenticação; usa fluxo nativo no iOS e OAuth nas demais plataformas configuradas     | No fluxo nativo de iOS, o app solicita e-mail e nome completo; a Apple pode fornecer nome apenas na primeira autorização e e-mail, inclusive endereço de retransmissão privada, conforme a escolha da pessoa. Confirmar no Apple Developer e no Supabase os atributos efetivamente recebidos e os escopos do fluxo OAuth. |
| Cloudflare Email Routing         | Roteamento de entrada do e-mail de contato, conforme os registros MX públicos do domínio                  | O recebimento passa primeiro por servidores MX da Cloudflare e, conforme confirmação do responsável, é encaminhado a uma caixa Gmail/Google.                                                                                                                                                                                               |

O responsável confirma que o Setlist não veicula publicidade própria, faz
marketing, vende dados ou mantém patrocínio ou compartilhamento comercial. O
YouTube pode exibir publicidade própria após a abertura externa. O canal de
contato é monitorado e as mensagens são encaminhadas da Cloudflare ao
Gmail/Google. Antes da publicação,
confirmar escopos OAuth, contratos, regiões de processamento, suboperadores,
prazos de logs e mecanismo aplicável a cada transferência internacional.

### Transferências e coleta fora do Brasil — apuração pendente

Os projetos Supabase consultados têm região primária em São Paulo. Isso não
garante que operações de suporte, registros técnicos ou suboperadores desse
fornecedor permaneçam no Brasil. Outros serviços listados acima podem tratar
dados fora do país: o login depende de Google ou Apple; a versão Web é servida
pelo GitHub Pages; o canal de contato passa por Cloudflare e Gmail/Google. A
referência externa de uma música pode levar a pessoa ao YouTube somente após
sua ação de abertura; a primeira versão não carrega player incorporado. Os
países de destino, os dados envolvidos em cada fluxo e os mecanismos
jurídicos aplicáveis ainda precisam ser confirmados antes da publicação. Para
solicitar informações sobre esses fluxos, o canal é
**contato@setlistbr.app.br**.

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
>
> A regulamentação distingue transferência entre agentes de coleta direta
> pelo agente situado no exterior (arts. 3º, 5º e 6º). Classificar cada fluxo
> concreto antes de atribuir ao Setlist uma transferência internacional. Se a
> transferência usar cláusulas-padrão, verificar a incorporação integral das
> cláusulas da ANPD ao contrato e preparar a transparência do art. 17. O DPA
> público do Supabase menciona cláusulas da União Europeia; isso, sem análise
> do instrumento efetivamente aplicável, não comprova a adoção das cláusulas
> brasileiras nem a validade do mecanismo para a LGPD. [Regulamento da ANPD](https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-19-de-23-de-agosto-de-2024),
> [DPA do Supabase](https://supabase.com/legal/customer-resources/data-processing-addendum).

## 5. Armazenamento local e segurança

Dados de conteúdo do repertório e dos shows são mantidos online no backend;
não são armazenados no SecureStore. O app guarda localmente o identificador da
última banda selecionada: em SecureStore nos aplicativos móveis e em
`localStorage` na Web, com memória do processo como alternativa quando o
armazenamento falha. Esse identificador é usado apenas para restaurar a
seleção e não substitui a verificação de acesso à banda. Ele é removido no
logout e na exclusão da conta; se a banda deixar de estar disponível, o app o
descarta quando detectar essa condição.

No código atual, a configuração pública exige endereço HTTPS para o Supabase,
o cliente recebe a variável destinada à chave publicável e as migrações
configuram políticas de Row Level Security com regras de acesso por banda e
papel. Nos aplicativos móveis,
a sessão e os verificadores temporários de login são armazenados no SecureStore
quando disponível; se ele falhar, o código usa memória do processo. Na Web,
a sessão usa o armazenamento persistente do navegador. O cache de consultas é
mantido apenas em memória e recriado quando a conta autenticada muda, evitando
reutilizar dados de uma conta anterior. Esses controles não
substituem a conferência da chave e da configuração efetiva de produção, dos
acessos administrativos, dos backups, dos registros e da resposta a incidentes.

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

O ciclo observado no banco ativo, antes de considerar logs e backups, é:

| Categoria | Situação atual na aplicação | Definição ainda necessária |
| --- | --- | --- |
| Conta e perfil | Permanecem enquanto a conta está ativa; a operação **Excluir minha conta** remove perfil e identidade de autenticação após resolver as restrições de propriedade de bandas | Confirmar retenções independentes mantidas pelos provedores de login e autenticação |
| Participação na banda | O vínculo é removido quando a pessoa sai ou é removida, ao excluir a conta ou ao excluir a banda | Confirmar se há registros operacionais remanescentes |
| Músicas, letras e shows | Permanecem enquanto a banda os mantiver; a exclusão da conta de quem contribuiu não elimina o conteúdo de bandas ativas; a exclusão da banda remove o conteúdo do banco ativo | Definir resposta a pedidos de remoção de conteúdo compartilhado e tratamento de backups |
| Convites e aceites do termo da banda | Registros históricos permanecem até a exclusão da banda; quando uma conta é excluída, referências diretas ao perfil são desvinculadas | Definir prazo ou critério de limpeza para convites usados, revogados ou vencidos e aceites históricos, avaliando necessidade e eventual valor probatório |
| Mensagens de contato e denúncias | O atendimento usa a caixa de e-mail e ainda não tem descarte automático confirmado | Definir prazo após encerramento do caso e exceções para obrigação legal ou exercício de direitos |
| Última banda selecionada e cache do app | O identificador da banda fica no armazenamento local até logout, exclusão da conta ou descarte ao detectar perda de acesso; o cache de consultas fica em memória e é recriado ao mudar de conta | Conferir exclusão efetiva no dispositivo e eventuais cópias do armazenamento do navegador ou do aparelho |

A exclusão da identidade de autenticação não comprova a remoção de registros
independentes de auditoria de login. O Supabase registra eventos de autenticação
em armazenamento externo de logs e pode também gravá-los na tabela
`auth.audit_log_entries`, se essa opção estiver habilitada. A configuração e os
prazos efetivos do projeto ainda precisam ser verificados.

> **Nota interna de apuração — substituir por prazos confirmados antes de
> publicar:** a tabela de planos do Supabase informa janela de acesso aos logs
> de API e banco de 1 dia no Free, 7 dias no Pro, 28 dias no Team e 90 dias no
> Enterprise. Para **Auth Audit Logs**, a tabela informa 1 hora no Free, 7 dias
> no Pro e 28 dias no Team; não especifica um prazo para Enterprise. Essas
> janelas não demonstram a data de eliminação de todas as cópias mantidas pelo
> fornecedor. A opção de gravar auditoria de autenticação também no Postgres
> precisa ser conferida; se estiver ligada, definir como esses registros serão
> tratados após a exclusão da conta. Backups automáticos diários não estão
> incluídos no Free; a documentação informa 7 dias de acesso no Pro, 14 dias no
> Team e até 30 dias no Enterprise. Quando habilitado, o PITR substitui os
> backups diários e tem janela de recuperação própria. O CLI lista os projetos
> `setlist-dev` e `setlist-prod` na organização Supabase; o `.env.local` deste
> checkout aponta para `setlist-dev`. A listagem do CLI não informa o plano da
> organização nem as configurações de PITR ou auditoria do projeto. Confirmar
> esses itens no painel antes de publicar. [Planos do Supabase](https://supabase.com/pricing),
> [auditoria de autenticação](https://supabase.com/docs/guides/auth/audit-logs),
> [backups e PITR](https://supabase.com/docs/guides/platform/backups).
>
> O Cloudflare Email Routing expõe registros de atividade de encaminhamento,
> distintos das mensagens e anexos recebidos na caixa Gmail. A documentação
> permite filtrar períodos de atividade, mas não estabelece ali um prazo de
> eliminação desses registros. Confirmar separadamente o histórico da
> Cloudflare, as mensagens na caixa e seus critérios de descarte.
> [Logs do Email Routing](https://developers.cloudflare.com/email-service/observability/logs/).
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

Você pode solicitar confirmação de tratamento e acesso aos seus dados; correção
de dados incompletos, inexatos ou desatualizados; anonimização, bloqueio ou
eliminação de dados desnecessários, excessivos ou tratados em desconformidade
com a LGPD; portabilidade nos termos da regulamentação; informação sobre
compartilhamento; e, quando o tratamento se basear em consentimento, informação
sobre a possibilidade de não consentir e suas consequências, revogação do
consentimento e eliminação dos dados tratados nessa base, ressalvadas as
hipóteses legais de conservação. Também pode se opor a tratamento irregular
fundado em hipótese de dispensa de consentimento e peticionar à ANPD. O pedido
pode ser enviado sem custo ao e-mail **contato@setlistbr.app.br**. Esse canal
também recebe dúvidas gerais e pedidos de remoção de conteúdo. Para pedidos
sobre uma conta, o controlador verificará primeiro o
e-mail associado a ela e poderá pedir informação adicional mínima se necessário.
Não é solicitado documento oficial de identidade por padrão. Se, em situação
excepcional, ele for indispensável, o controlador explicará o motivo e só o
receberá por canal seguro previamente habilitado; nunca deverá ser enviado à
caixa geral de e-mail. Se esse canal não estiver disponível, será buscada uma
forma alternativa e proporcional de confirmação. A cópia será apagada após a
verificação, salvo obrigação legal de retenção, e o caso registrará apenas a
justificativa, a data e o resultado, sem reproduzir os dados do documento. O
controlador avaliará o pedido e responderá no prazo legal aplicável. Para
confirmação de tratamento ou acesso, a regra geral da LGPD é resposta
simplificada imediata ou declaração completa em até 15 dias do requerimento;
eventuais prazos diferenciados para agente de pequeno porte dependem de
enquadramento confirmado. O recebimento dos demais pedidos será acusado em até
5 dias úteis; esse prazo administrativo não substitui a resposta legal devida.
A exclusão pode estar sujeita a obrigações legais, preservação de conteúdo
compartilhado da banda ou outras exceções que devem ser explicadas no
atendimento. A aplicação concreta dos prazos de retenção e das exceções precisa
de revisão jurídica.

## 8. Idade mínima

O serviço é destinado exclusivamente a pessoas com 18 anos ou mais. O mecanismo
de confirmação de idade ainda não está implementado. A opção de autodeclaração
antes do login, sem coleta da data de nascimento, foi escolhida para avaliação;
sua adequação precisa ser confirmada por assessoria jurídica à luz do Estatuto
Digital da Criança e do Adolescente (Lei nº 15.211/2025), do Decreto nº
12.880/2026 e das orientações da ANPD antes de definir o fluxo e publicar esta
política. Se houver uso em desacordo com o critério de idade, o acesso poderá
ser restringido e os dados serão tratados conforme esta política e as
obrigações legais aplicáveis, sem promessa de exclusão automática de todos os
dados. A LGPD estabelece que o tratamento de dados de crianças e adolescentes
deve observar seu melhor interesse.

## 9. Atualizações e contato

O controlador manterá uma versão datada desta política em
**https://setlistbr.app.br/privacidade/** após a aprovação e publicação.
Alterações de finalidade, forma ou duração do tratamento, identificação do
controlador ou uso compartilhado de dados serão comunicadas às pessoas afetadas
com destaque específico do que mudou, pelo e-mail cadastrado quando disponível
ou por outro meio direto adequado. Quando o tratamento depender de consentimento,
uma finalidade nova e incompatível será informada previamente e a pessoa poderá
revogar o consentimento caso discorde. Dúvidas, exercício de direitos,
reclamações ou suspeitas de incidente de segurança podem ser enviados ao e-mail
geral de contato **contato@setlistbr.app.br**.

> **Nota interna antes da publicação:** confirmar remetente e capacidade de
> envio ao e-mail cadastrado, cobertura de contas sem e-mail alcançável, meio
> alternativo direto, registro da versão e dos avisos enviados, tratamento de
> falhas de entrega e eventual fluxo de novo aceite. A redação acima não
> comprova que esses meios já estão operacionais.

### Referências para validação jurídica

- Lei nº 13.709/2018 (LGPD): <https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm>
- Lei nº 15.211/2025 (Estatuto Digital da Criança e do Adolescente):
  <https://planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/l15211.htm>
- Orientações da ANPD sobre aferição de idade:
  <https://www.gov.br/anpd/pt-br/assuntos/eca-digital/mecanismos-confiaveis-de-afericao-de-idade-orientacoes-preliminares.pdf>
- Resolução CD/ANPD nº 2/2022, se o controlador se enquadrar como agente de
  tratamento de pequeno porte: <https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-2-de-27-de-janeiro-de-2022>
