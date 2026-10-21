# Política de privacidade do Setlist — rascunho

> **RASCUNHO HISTÓRICO. Não publicar como política vigente.** A versão pública
> aprovada é a 1.0.0, vigente desde 21/10/2026, em
> <https://setlistbr.app.br/privacidade/>. Este arquivo preserva notas da
> preparação; pendências e afirmações operacionais abaixo são registros da
> época e devem ser conferidas em `openspec/changes/definir-mvp-setlist/tasks.md`
> e `docs/PUBLICACAO_DOCUMENTOS_LEGAIS.md` antes de qualquer reutilização. As
> tarefas 11.8.1–11.8.10 estão concluídas; o grupo 11.8 permanece aberto até
> a distribuição pública Android/iOS.

- Versão de trabalho: 0.1
- Data de preparação: 29/09/2026; revisão de moderação: 02/10/2026
- URL da versão pública atual:
  **https://setlistbr.app.br/privacidade/** (versão 1.0.0, vigente desde 21/10/2026)
- Nome definitivo de apresentação do serviço: **Setlist**
  (`setlistbr.app.br`). Segundo o responsável, a revisão jurídica aprovou
  **Setlist** como identificação pública do controlador pessoa física.
- Canal para titulares: e-mail geral, também destinado a pedidos de privacidade
  e remoção de conteúdo — **contato@setlistbr.app.br**
- O controlador acompanhará a caixa em todos os dias úteis para solicitações
  dos titulares.
- Nome civil, CPF e endereço não constarão da versão pública, conforme a
  conclusão da revisão jurídica informada pelo responsável.
- Encarregado: segundo a conclusão da revisão jurídica informada pelo
  responsável, o Setlist se enquadra como agente de tratamento de pequeno porte
  e está dispensado de nomeá-lo. O canal para titulares é
  **contato@setlistbr.app.br**.

## 1. Escopo

Esta política descreve o tratamento de dados pessoais no Setlist, serviço de
organização de bandas, repertórios, letras, shows e setlists. O serviço será
gratuito para os usuários e o código-fonte será disponibilizado como código
aberto sob GNU AGPL-3.0-only. Isso não torna público o conteúdo das contas ou
bandas. **Setlist** é o nome definitivo de apresentação do serviço. A pessoa
física que o opera é a controladora; segundo o responsável, a revisão jurídica
aprovou **Setlist** como sua identificação pública, com contato separado pelo
e-mail informado abaixo. A versão pública 1.0.0 reflete os prazos operacionais
confirmados nas tarefas 11.8.2–11.8.8; detalhes de logs mantidos por outros
fornecedores continuam sujeitos a revisão. O canal escolhido é o e-mail geral
**contato@setlistbr.app.br**, que também receberá solicitações de titulares e
pedidos de remoção de conteúdo. O responsável acompanhará a caixa em todos os
dias úteis e informou ser a única pessoa com acesso à caixa Gmail de destino.
Segundo a conclusão da revisão jurídica informada pelo responsável, o Setlist
se enquadra como agente de tratamento de pequeno porte e está dispensado de
nomear encarregado formal. O canal geral permanece disponível aos titulares.
A LGPD trata a identificação do controlador e as
informações de contato como itens separados. A conclusão jurídica sobre usar
apenas **Setlist** como identificação pública foi informada pelo responsável;
este rascunho não substitui o parecer. Conforme a decisão atual do responsável, não
haverá anúncios próprios do Setlist, patrocínios, doações ou receita ligada ao
aplicativo; os custos serão cobertos pelo responsável. O player incorporado do
YouTube não estará acessível na primeira versão pública. Ao abrir uma
referência externa do YouTube, essa plataforma pode apresentar publicidade
própria. Se o modelo do Setlist mudar, a política deverá ser revista antes da
alteração.

## 2. Dados tratados

O código e o schema atuais indicam estas categorias:

| Categoria              | Exemplos observados                                                                                                                                                                                                       | Uso no serviço                                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Identidade da conta    | Identificador de usuário, e-mail, nome e metadados de identidade recebidos do provedor Google ou Apple, conforme os dados disponibilizados em cada fluxo                                                                  | Autenticar, manter a sessão e apresentar o perfil                                                |
| Perfil                 | Nome de exibição e URL de avatar, quando disponíveis                                                                                                                                                                      | Mostrar a identidade no perfil e nas listas de integrantes                                       |
| Participação           | Identificador da banda, papel e data de ingresso                                                                                                                                                                          | Aplicar permissões e mostrar a participação                                                      |
| Convites               | Rótulo opcional, hash do token, datas de criação, expiração, uso ou revogação e referências aos perfis envolvidos                                                                                                         | Criar, aceitar, administrar e proteger links de convite                                          |
| Aceites                | Pessoa, banda, versão do termo e horário registrado pelo servidor                                                                                                                                                         | Demonstrar o aceite do termo de responsabilidade por conteúdo                                    |
| Conteúdo da banda      | Nome da banda, músicas, artista, tonalidade, BPM, duração, letras, observações, referência YouTube, shows, local, data, estado, blocos e setlist                                                                          | Prestar as funções colaborativas solicitadas pela banda                                          |
| Dados técnicos         | Dados da sessão e registros operacionais que o app e seus fornecedores possam gerar, como horário e metadados de acesso; o GitHub informa que registra o IP de quem visita um site do GitHub Pages para fins de segurança | Identificar os registros efetivamente mantidos por cada fornecedor, suas finalidades e prazos    |
| Contato e solicitações | E-mail, conteúdo da mensagem, anexos enviados voluntariamente, datas e histórico de atendimento de dúvidas, pedidos de privacidade, denúncias e incidentes                                                                | Receber, verificar, responder e documentar os casos pelo tempo necessário                        |
| Moderação e denúncias  | Identificadores da banda, do alvo e do denunciante; descrição enviada pelo denunciante; identificador do caso; dados de controle de frequência; motivo, responsável e data de ocultação de música ou suspensão de conta   | Receber denúncias, limitar abuso do canal, investigar, aplicar e revisar medidas administrativas |
| Preferência local      | Identificador da última banda selecionada, salvo no aparelho ou navegador                                                                                                                                                 | Restaurar a seleção após reabrir o app, sempre conferindo novamente a participação               |

Não foi localizado SDK de analytics ou publicidade no código consultado. Isso
não confirma a ausência de registros produzidos por hospedagem, autenticação,
infraestrutura, navegador ou ferramentas operacionais. A versão pública 1.0.0
descreve as categorias e os fornecedores identificados; revisar esse inventário
quando o código ou os serviços contratados mudarem.

## 3. Finalidades e bases legais

Os dados são tratados para autenticar a pessoa e manter sua sessão; criar e
apresentar o perfil; administrar participação e permissões das bandas; criar,
validar e administrar convites; registrar a versão aceita do termo de responsabilidade da banda; armazenar
e exibir o conteúdo da banda; filtrar gravações de músicas, receber e analisar
denúncias, ocultar conteúdo ou suspender contas quando cabível; proteger o
serviço e atender solicitações e obrigações legais. O responsável confirma que
não há finalidade própria de analytics, publicidade, marketing, venda de dados
ou compartilhamento comercial do Setlist. A abertura de uma referência externa
do YouTube, por escolha da
pessoa usuária, é descrita na seção 4.

Letras e observações são campos preenchidos pelas pessoas usuárias. Elas podem
incluir informações sobre terceiros que não possuem conta no Setlist, inclusive
dados sensíveis, embora isso não seja necessário para a finalidade principal do
serviço. Os termos de uso proíbem conteúdo pornográfico e outras formas de
conteúdo sexual ilícito, inclusive em links. No primeiro corte implementado no
ambiente de desenvolvimento, um gatilho do banco examina título, artista,
observações, referência YouTube e letra de músicas antes da gravação, inclusive
em chamadas diretas à API. As regras iniciais reconhecem apenas alguns padrões
explícitos; o filtro não interpreta todo o contexto nem reavalia o acervo
anterior. Tentativas sinalizadas são recusadas sem fila ou cópia separada do
envio; a versão anterior de uma edição recusada permanece salva. A pessoa pode
contestar a regra pelo canal de contato. A análise automática ocorre no banco
do Setlist, sem enviar letras a um serviço externo de moderação.

A denúncia feita dentro do app transmite à função do Setlist a descrição
escrita pela pessoa, o tipo de alvo e identificadores da banda, do alvo e do
denunciante. A função verifica o vínculo com a banda e limita a frequência de
envios. Um identificador de caso é gerado e, junto com esses dados, enviado
pela API transacional do Brevo a **contato@setlistbr.app.br**; a letra completa
não é anexada automaticamente. A confirmação no app corresponde ao aceite do
envio pelo provedor, sem garantir a entrega ou a leitura do e-mail. A descrição
é livre e pode incluir trechos de conteúdo que a própria pessoa decida citar.
O banco mantém identificador do denunciante, do caso e da próxima janela
permitida para limitar a frequência, sem armazenar ali a descrição da denúncia. A
descrição e o histórico do atendimento ficam na cadeia de e-mails. A ocultação
administrativa de música e a suspensão de conta registram identificador do
alvo, motivo, responsável pela medida e data. Denúncias e indícios concretos
documentados podem exigir acesso limitado ao conteúdo da banda e às mensagens
recebidas pelo responsável autorizado. Não haverá inspeção periódica por
amostragem. A base aplicável a cada caso e a retenção dos registros devem
seguir o inventário e a finalidade da apuração.

Segundo a conclusão da revisão jurídica informada pelo responsável, as bases
para os dados pessoais comuns usados nas funções previstas são:

| Finalidade                                                                                     | Base legal                                                                                                                                                                         |
| ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Login, sessão, perfil, convites e colaboração solicitados pela pessoa                          | Execução do serviço ou procedimentos preliminares solicitados por ela (LGPD, art. 7º, V).                                                                                          |
| Atendimento de pedidos e deveres previstos em lei                                              | Cumprimento de obrigação legal ou regulatória (art. 7º, II), quando houver dever específico.                                                                                       |
| Conservação e uso de registros necessários a processos judiciais, administrativos ou arbitrais | Exercício regular de direitos (art. 7º, VI), quando essa finalidade existir.                                                                                                       |
| Segurança do serviço, prevenção de abuso e análise de incidentes                               | Legítimo interesse (art. 7º, IX), quando cabível após avaliação documentada de finalidade, necessidade, balanceamento e salvaguardas, ou obrigação legal específica (art. 7º, II). |

O aceite dos termos não constitui consentimento geral para tratar dados. Uma
mensagem de denúncia ou um campo livre pode incluir dados de terceiros e dados
sensíveis que não são necessários ao serviço. A base para tratar esses dados
deve ser avaliada conforme o conteúdo e a finalidade do caso; legítimo
interesse do art. 7º não é base para dados sensíveis, que seguem as hipóteses
do art. 11. A classificação efetiva desses casos e o registro do teste de
legítimo interesse permanecem na preparação operacional.
[LGPD, arts. 7º e 11](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm);
[guia da ANPD sobre legítimo interesse](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia_orientativo_hipoteses_legais_tratamento_de_dados_pessoais_legitimo_interesse).

## 4. Acesso, compartilhamento e fornecedores

Nome, e-mail disponível, avatar e conteúdo da banda podem ser vistos por
integrantes com acesso àquela banda, conforme o papel e as permissões da
aplicação. Não há catálogo público de músicas ou bandas. O responsável
autorizado pode consultar conteúdo privado quando necessário para analisar
denúncia ou indício concreto e aplicar uma medida. As políticas de acesso do
banco e as operações protegidas de contas suspensas foram conferidas em
produção na tarefa 11.8.1; revisar permissões se o schema ou os papéis mudarem.

Os fornecedores e integrações identificados no código e na configuração são:

| Fornecedor/integração            | Situação e finalidade                                                                                                                        | Dados e observações                                                                                                                                                                                                                                                                                                                                                                           |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Google                           | Ativo como provedor de login e destino final Gmail/Google da caixa de contato encaminhada pela Cloudflare                                    | No Android e iOS, o login Google usa o fluxo nativo quando disponível e envia o token de identidade ao Supabase; nos demais casos usa OAuth no navegador. O app recebe identificador e, quando disponíveis, e-mail, nome e avatar do perfil. O Gmail/Google também recebe as mensagens enviadas ao canal de contato. Confirmar no Google Cloud e no Supabase os escopos e atributos efetivos. |
| Supabase                         | Ativo para autenticação, banco de dados e acesso ao conteúdo                                                                                 | Guarda contas, perfis, bandas, integrantes, convites, aceites e conteúdo. Os projetos consultados usam a região primária `sa-east-1` (São Paulo). O contrato e a lista de suboperadores precisam ser conferidos; a região primária não determina por si só todos os locais de processamento.                                                                                                  |
| GitHub Pages                     | Ativo para servir a versão Web                                                                                                               | Além dos arquivos públicos da aplicação, o GitHub informa que registra o IP de visitantes para segurança. O prazo desses registros específicos ainda precisa ser confirmado. Logs de CI/build são tratados separadamente e não são registros de uso do app.                                                                                                                                   |
| YouTube                          | Referência externa aberta somente a pedido da pessoa usuária; o protótipo com player incorporado está sem acesso na primeira versão pública  | Ao acionar a referência de uma música, o app abre o endereço no aplicativo ou navegador externo. O tratamento resultante é feito pelo YouTube conforme seus próprios termos e política. O Setlist não envia letras ou repertórios para sincronização.                                                                                                                                         |
| Apple — Iniciar sessão com Apple | Ativo como opção de autenticação; usa fluxo nativo no iOS e OAuth nas demais plataformas configuradas                                        | No fluxo nativo de iOS, o app solicita e-mail e nome completo; a Apple pode fornecer nome apenas na primeira autorização e e-mail, inclusive endereço de retransmissão privada, conforme a escolha da pessoa. Confirmar no Apple Developer e no Supabase os atributos efetivamente recebidos e os escopos do fluxo OAuth.                                                                     |
| Cloudflare Email Routing         | Roteamento de entrada do e-mail de contato, conforme os registros MX públicos do domínio                                                     | O recebimento passa primeiro por servidores MX da Cloudflare e, conforme confirmação do responsável, é encaminhado a uma caixa Gmail/Google.                                                                                                                                                                                                                                                  |
| Brevo                            | Envio transacional das denúncias pelo app por meio da Edge Function do Supabase; o responsável confirmou o fluxo de produção em 19/10/2026 | Recebe o identificador do caso, da banda, do alvo e do denunciante e a descrição escrita pela pessoa. A letra completa não é anexada automaticamente. O DPA foi revisado em 21/10/2026 para a integração transacional. Em 21/10/2026, o responsável confirmou a retenção de 1 mês dos logs e a desativação de novas prévias; a versão pública 1.0.0 já reflete essa configuração. |

O responsável confirma que o Setlist não veicula publicidade própria, faz
marketing, vende dados ou mantém patrocínio ou compartilhamento comercial. O
YouTube pode exibir publicidade própria após a abertura externa. O canal de
contato é monitorado e as mensagens são encaminhadas da Cloudflare ao
Gmail/Google. Para futuras revisões desta minuta, acompanhar escopos OAuth,
contratos, suboperadores e prazos de logs; esta lista não altera o estado da
política 1.0.0 já publicada.

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
registros indefinidamente e revisará os casos encerrados na caixa Gmail a cada
três meses para apagar mensagens e anexos que não precisem mais ser mantidos.
Os prazos e exceções publicados estão registrados na versão 1.0.0 e no
inventário operacional; confira essas fontes antes de reutilizar este rascunho.
Logs operacionais dos fornecedores têm prazos próprios e não representam o
prazo de retenção dos dados da conta. Cópias de backup podem continuar
contendo dados já removidos da base ativa até expirarem. A rotina própria
conserva até 84 cópias diárias (12 semanas) numa conta Google Drive dedicada,
cifradas no cliente. A primeira execução foi confirmada em 20/10/2026 e a
restauração isolada foi validada em `setlist-restore` no mesmo dia (11.8.4).

O ciclo observado no banco ativo, antes de considerar logs e backups, é:

| Categoria                                     | Situação atual na aplicação                                                                                                                                                                                                                                                                                                                                                                                                     | Definição ainda necessária                                                                                                                                                                                                                                                                                                  |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Conta e perfil                                | Permanecem enquanto a conta está ativa; a operação **Excluir minha conta** remove perfil e identidade de autenticação após resolver as restrições de propriedade de bandas                                                                                                                                                                                                                                                      | Confirmar retenções independentes mantidas pelos provedores de login e autenticação                                                                                                                                                                                                                                         |
| Participação na banda                         | O vínculo é removido quando a pessoa sai ou é removida, ao excluir a conta ou ao excluir a banda                                                                                                                                                                                                                                                                                                                                | Confirmar se há registros operacionais remanescentes                                                                                                                                                                                                                                                                        |
| Músicas, letras e shows                       | Permanecem enquanto a banda os mantiver; a exclusão da conta de quem contribuiu não elimina o conteúdo de bandas ativas; a exclusão da banda remove o conteúdo do banco ativo                                                                                                                                                                                                                                                   | Definir resposta a pedidos de remoção de conteúdo compartilhado e tratamento de backups                                                                                                                                                                                                                                     |
| Convites e aceites do termo da banda          | A migração de limpeza foi aplicada em produção em 02/10/2026: convites encerrados há mais de 30 dias entram em job diário, salvo exceções documentadas; aceites permanecem enquanto a banda existir. Ao excluir uma conta, referências diretas ao perfil são desvinculadas. O responsável confirmou em 19/10/2026 a execução para os estados aplicáveis, as exceções, a preservação dos aceites e o alinhamento da política.    | A política foi alinhada ao comportamento conferido; cópias em backups seguem ciclo próprio de substituição.                                                                                                                                                                                                                 |
| Mensagens de contato e denúncias              | O atendimento usa a caixa Gmail, sem descarte automático confirmado; o responsável revisará casos encerrados trimestralmente e apagará mensagens e anexos cuja guarda não seja mais necessária                                                                                                                                                                                                                                  | Registrar critérios e exceções de conservação no inventário; a revisão trimestral não equivale a prazo fixo de retenção.                                                                                                                                                                                                    |
| Controle de frequência e medidas de moderação | A migração foi aplicada em produção em 02/10/2026. Consulta de 19/10 confirmou o job ativo e 17 execuções bem-sucedidas sem falhas desde a primeira, em 03/10; a função remove apenas janelas encerradas há mais de 24 horas. A tabela estava vazia na consulta, e o histórico do Cron não informa a quantidade apagada. Registros de ocultação e suspensão permanecem enquanto a medida vigorar; a reversão remove o registro. | A validação de rotina e a redação pública de 24 horas estão conferidas. Se for necessária evidência de exclusão real de uma linha, fazer teste controlado em ambiente isolado; definir separadamente a retenção do histórico de decisões e contestações. O histórico do atendimento fica no e-mail, sob critérios próprios. |
| Última banda selecionada e cache do app       | O identificador da banda fica no armazenamento local até logout, exclusão da conta ou descarte ao detectar perda de acesso; o cache de consultas fica em memória e é recriado ao mudar de conta                                                                                                                                                                                                                                 | Conferir exclusão efetiva no dispositivo e eventuais cópias do armazenamento do navegador ou do aparelho                                                                                                                                                                                                                    |

A exclusão da identidade de autenticação não comprova a remoção de registros
independentes de auditoria de login. O Supabase registra eventos de autenticação
em armazenamento externo de logs. O responsável confirmou que, em
`setlist-prod`, a opção de gravar auditoria também na tabela
`auth.audit_log_entries` está **ligada**. Esses registros podem conter
identificador de usuário, IP e metadados de acesso. O responsável decidiu
conservar essa cópia por **30 dias**, com limpeza diária dos registros mais
antigos, salvo exceções administrativas temporárias e documentadas para uma
apuração. O motivo da exceção não deve conter dados pessoais e cada retenção
tem prazo para revisão. Em 21/10/2026, a migração `20261020120000` e o job
diário foram confirmados em `setlist-prod` e `setlist-dev`. O preflight de
metadados passou nos dois ambientes, e a conferência agregada confirmou a
última execução bem-sucedida, a recorrência diária, nenhum evento vencido sem
exceção e nenhuma exceção vencida ou órfã. A exclusão da conta não remove
imediatamente esses registros; a rotina os remove depois do prazo, salvo
exceção documentada. A auditoria Postgres é excluída do backup diário do Drive
e não pode ser recuperada dessas cópias. Os logs externos do fornecedor têm
retenção própria e não são controlados por essa rotina.

> **Nota interna de apuração — substituir por prazos confirmados antes de
> publicar:** a tabela de planos do Supabase informa janela de acesso aos logs
> de API e banco de 1 dia no Free, 7 dias no Pro, 28 dias no Team e 90 dias no
> Enterprise. Para **Auth Audit Logs**, a tabela informa 1 hora no Free, 7 dias
> no Pro e 28 dias no Team; não especifica um prazo para Enterprise. Essas
> janelas não demonstram a data de eliminação de todas as cópias mantidas pelo
> fornecedor. A gravação adicional de auditoria de autenticação no Postgres
> está ligada em `setlist-prod`; a migração para retenção de 30 dias e limpeza
> diária está aplicada nos projetos `setlist-prod` e `setlist-dev`; a consulta
> de 21/10/2026 confirmou job ativo, execuções esperadas, ausência de registros
> vencidos e ausência de exceções vencidas ou órfãs. Backups automáticos diários não estão
> incluídos no Free; a documentação informa 7 dias de acesso no Pro, 14 dias no
> Team e até 30 dias no Enterprise. Quando habilitado, o PITR substitui os
> backups diários e tem janela de recuperação própria. O CLI lista os projetos
> `setlist-dev` e `setlist-prod` na organização Supabase; o `.env.local` deste
> checkout aponta para `setlist-dev`. O responsável confirmou que `setlist-prod`
> está no plano **Free**, sem PITR. Nesse plano, o Supabase não oferece backup
> diário automático. A rotina própria transmite cópias **diárias** para uma
> conta dedicada do Google Drive, cifradas no cliente, e conserva as **84 cópias
> diárias** mais recentes (12 semanas). O executor transmite o dump sem gravá-lo
> em disco local ou artefatos. A primeira execução foi confirmada em 20/10/2026;
> uma restauração isolada foi validada no projeto `setlist-restore` em
> 20/10/2026. Um backup diário pode não incluir
> alterações feitas desde a cópia anterior. Dados removidos do banco ativo
> podem continuar em uma dessas cópias até a substituição correspondente;
> exceções de retenção e a eliminação segura do arquivo antigo precisam ser
> conferidas. A migração `20261020120000` e a limpeza diária da auditoria Auth
> foram confirmadas em `setlist-prod` e `setlist-dev` em 21/10/2026; o monitor
> agregou `true` nos cinco critérios nos dois ambientes. A exclusão da conta
> não apaga esses eventos imediatamente, e a tabela não está incluída no backup
> do Drive. [Planos do Supabase](https://supabase.com/pricing),
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
> O Brevo informa que, sem regra configurada, logs transacionais e eventuais
> prévias de e-mail não são apagados automaticamente. O painel permite definir
> retenção de logs de 1 a 24 meses por remetente e desabilitar novas
> prévias; a mudança do prazo de logs também alcança registros existentes,
> enquanto a mudança de prévias não elimina as já guardadas. A captura do
> painel enviada em 21/10/2026 confirma a regra para todos os remetentes,
> retenção de **1 mês** e **Never store previews**. Pré-visualizações de logs
> anteriores ainda podem permanecer até que seus logs expirem. Não presumir
> que a exclusão no Gmail apague dados mantidos pelo
> Brevo. [Regras de retenção do Brevo](https://help.brevo.com/hc/en-us/articles/4415743225746-Configure-a-custom-retention-period-for-your-transactional-logs-and-email-previews).
>
> No Gmail, apagar uma mensagem a envia à Lixeira, onde ela pode permanecer por
> até 30 dias antes da exclusão permanente da interface; a Lixeira também pode
> ser esvaziada manualmente. Essa etapa não comprova a eliminação de registros
> independentes em Brevo ou Cloudflare. [Exclusão de mensagens no Gmail](https://support.google.com/mail/answer/7401).
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
único integrante. Para `setlist-prod`, no plano Free sem PITR, o responsável
mantém até 84 cópias diárias próprias numa conta dedicada do Google Drive,
com criptografia no cliente e transmissão direta pelo executor externo. A
primeira execução foi confirmada em 20/10/2026; a restauração isolada foi
validada no projeto `setlist-restore` em 20/10/2026 (11.8.4). Dados apagados do banco ativo poderão persistir nessas cópias até
a respectiva substituição. Os prazos e mecanismos de eliminação dos registros independentes
mantidos pelos fornecedores ainda precisam ser confirmados.

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
o Setlist adotará esses prazos na rotina de atendimento. O recebimento dos
demais pedidos será acusado em até 5 dias úteis; esse prazo administrativo
não substitui a resposta legal devida.
A exclusão pode estar sujeita a obrigações legais, preservação de conteúdo
compartilhado da banda ou outras exceções que devem ser explicadas no
atendimento. A aplicação concreta dos prazos de retenção e das exceções deve
seguir o inventário de retenção aprovado.

## 8. Idade mínima

O serviço é destinado exclusivamente a pessoas com 18 anos ou mais. Segundo a
conclusão da revisão jurídica informada pelo responsável, o Setlist é um serviço
adulto, sem acesso provável por menores. O cadastro do Setlist não confirma a
idade; os controles de distribuição das lojas não abrangem o cadastro pela Web.
Se houver uso em desacordo com o critério de idade, o acesso poderá ser
restringido e os dados serão tratados conforme esta política e as obrigações
legais aplicáveis, sem promessa de exclusão automática de todos os dados. A
LGPD estabelece que o tratamento de dados de crianças e adolescentes deve
observar seu melhor interesse.

## 9. Atualizações e contato

O controlador mantém uma versão datada desta política em
**https://setlistbr.app.br/privacidade/**; a versão pública atual é a 1.0.0,
vigente desde 21/10/2026.
Alterações de finalidade, forma ou duração do tratamento, identificação do
controlador ou uso compartilhado de dados serão comunicadas às pessoas afetadas
com destaque específico do que mudou, pelo e-mail cadastrado quando disponível
ou por outro meio direto adequado. Quando o tratamento depender de consentimento,
uma finalidade nova e incompatível será informada previamente e a pessoa poderá
revogar o consentimento caso discorde. Dúvidas, exercício de direitos,
reclamações ou suspeitas de incidente de segurança podem ser enviados ao e-mail
geral de contato **contato@setlistbr.app.br**.

> **Nota interna para futuras alterações materiais:** confirmar remetente e capacidade de
> envio ao e-mail cadastrado, cobertura de contas sem e-mail alcançável, meio
> alternativo direto, registro da versão e dos avisos enviados, tratamento de
> falhas de entrega e eventual fluxo de novo aceite. A redação acima não
> comprova que esses meios já estão operacionais. Esta pendência não altera o
> status da publicação da versão 1.0.0; deve ser tratada antes de uma mudança
> que exija aviso direto ou novo aceite.

### Referências para validação jurídica

- Lei nº 13.709/2018 (LGPD): <https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm>
- Lei nº 15.211/2025 (Estatuto Digital da Criança e do Adolescente):
  <https://planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/l15211.htm>
- Orientações da ANPD sobre aferição de idade:
  <https://www.gov.br/anpd/pt-br/assuntos/eca-digital/mecanismos-confiaveis-de-afericao-de-idade-orientacoes-preliminares.pdf>
- Resolução CD/ANPD nº 2/2022, se o controlador se enquadrar como agente de
  tratamento de pequeno porte: <https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-2-de-27-de-janeiro-de-2022>
