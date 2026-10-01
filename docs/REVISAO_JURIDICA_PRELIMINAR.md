# Revisão jurídica preliminar das três minutas do Setlist

Data: 01/10/2026. Escopo: `TERMOS_DE_USO_RASCUNHO.md`,
`POLITICA_DE_PRIVACIDADE_RASCUNHO.md` e
`PROCEDIMENTO_DE_REMOCAO_RASCUNHO.md`, confrontados com os fluxos atuais do
aplicativo. Este é um roteiro de revisão, não um parecer assinado por advogado.
As três minutas continuam sem aprovação para distribuição pública.

## Achados prioritários

| Prioridade | Documento | Achado e providência |
| --- | --- | --- |
| Alta | Termos e política | O controlador é descrito como pessoa física, mas só a marca e o domínio aparecem como identificação. A LGPD exige identificação e contato do controlador como informações distintas. Obter decisão jurídica sobre a identificação pública suficiente e preencher as minutas antes da publicação. Não presumir que e-mail ou domínio identificam a pessoa física. [LGPD, art. 9º, III e IV](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm). |
| Alta | Termos, política e produto | O login afirma concordância com termos e política, sem links para os textos; o item “Termos e privacidade” está desabilitado. Publicar versões datadas e acessíveis antes do login e no aplicativo, com canal de contato visível. Registrar a aceitação dos termos gerais se ela for a base contratual escolhida. A política informa o tratamento de dados; sua leitura não equivale a consentimento genérico. O aceite separado do termo de responsabilidade da banda já existe, mas não substitui a disponibilização dos termos gerais. [LGPD, arts. 8º e 9º](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm). |
| Alta | Termos, política e produto | As minutas deixaram de prometer dois canais simultâneos; agora preveem comunicação direta com destaque por e-mail cadastrado, quando disponível, ou outro meio adequado. Ainda não há fluxo operacional verificado para avisos legais, remetente de saída confirmado nem alternativa para contas sem e-mail alcançável. Definir, executar e documentar esse processo antes da publicação. Mudanças nas informações do tratamento exigem transparência específica; mudança incompatível de finalidade baseada em consentimento exige aviso prévio. [LGPD, arts. 8º, § 6º, e 9º, § 2º](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm). |
| Alta | Política | Ainda faltam inventário de dados e fornecedores, bases legais por operação, prazos de retenção de conta, pedidos, logs e backups, medidas de segurança confirmadas e destinos/mecanismos de transferências internacionais. A região primária do Supabase não comprova que todo tratamento fica no Brasil. Fechar o inventário e o mapa de bases antes da publicação. [LGPD, arts. 6º, 7º, 9º e 33](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm); [Resolução CD/ANPD nº 19/2024](https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-19-de-23-de-agosto-de-2024). |
| Alta | Termos e política | O serviço pretende restringir uso a maiores de 18 anos, mas não há aferição de idade no login. Uma autodeclaração foi cogitada, porém não se pode concluir que basta sem classificar o serviço e seus riscos à luz do ECA Digital. O protótipo com player incorporado foi retirado da navegação e da rota pública; permanecem o cadastro aberto, os campos livres e a referência externa opcional do YouTube. Fazer avaliação jurídica documentada de público dirigido ou acesso provável por menores e escolher medida proporcional antes da distribuição. [Lei nº 15.211/2025](https://planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/l15211.htm); [orientações atuais da ANPD](https://www.gov.br/anpd/pt-br/assuntos/eca-digital/). |
| Alta | Termos e procedimento | O app não oferece moderação administrativa de conteúdo. A função de remover música a arquiva se ela estiver ligada a um show; músicas arquivadas continuam acessíveis aos integrantes pela política de leitura. Arquivamento não é bloqueio. A tabela de músicas não identifica quem enviou ou alterou o registro. Definir meio efetivo, autorizado e auditável de restringir ou retirar conteúdo e de ouvir os responsáveis identificáveis antes de ativar o procedimento. O regime jurídico e a urgência dependem do tipo de violação e da classificação do serviço. [Marco Civil, arts. 19 a 21](https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l12965.htm); [ECA Digital, arts. 28 a 30](https://planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/l15211.htm). |
| Alta | App Store, termos e procedimento | A distribuição pública iOS foi incluída. O responsável escolheu revisão posterior à publicação, por denúncia ou inspeção, sem filtro automático ou aprovação prévia. A diretriz 1.2 da Apple pede método de filtragem de material inadequado antes da postagem, mecanismo de denúncia com resposta, bloqueio de usuários abusivos e contato publicado. O processo posterior escolhido não demonstra, sozinho, atendimento ao requisito preventivo; definir medida adicional ou obter avaliação da loja antes da submissão. [Apple App Review Guidelines, 1.2](https://developer.apple.com/app-store/review/guidelines/). |
| Alta | Google Play, termos e produto | A política de conteúdo criado por usuários do Google Play exige moderação contínua e mecanismo **dentro do app** para denunciar conteúdo e usuários; os controles de bloqueio dependem do tipo de interação. O e-mail foi escolhido como meio de envio das denúncias, mas só exibir o endereço em documentos não comprova a existência da função no app. Implementar uma ação acessível no app que encaminhe por e-mail, verificar se ela atende à política, e definir bloqueio/remoção proporcionais antes da submissão. [Google Play, política de conteúdo criado por usuários](https://support.google.com/googleplay/android-developer/answer/9876937?hl=en-GB). |
| Média | Termos e procedimento | A frase “conteúdo pertence à banda” confundia controle de acesso com titularidade autoral. Foi corrigida. Autor ou titular conserva os direitos; uso de letras de terceiros pode exigir autorização prévia e expressa mesmo em banda fechada. Confirmar com assessoria a extensão da autorização técnica concedida ao Setlist e o fluxo de denúncia/contranotificação, inclusive prova mínima e resposta à pessoa que enviou a obra. [Lei nº 9.610/1998, arts. 22 e 29](https://www.planalto.gov.br/ccivil_03/leis/l9610.htm). |
| Média | Política e procedimento | A meta interna de acusar recebimento em 5 dias úteis não pode retardar pedido de confirmação/acesso. A regra geral da LGPD é resposta simplificada imediata ou declaração completa em até 15 dias; a Resolução nº 2/2022 prevê prazos diferenciados se houver enquadramento como agente de pequeno porte. Os textos foram corrigidos e o enquadramento precisa ser decidido. [LGPD, art. 19](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm); [Resolução CD/ANPD nº 2/2022, arts. 14 e 15](https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-2-de-27-de-janeiro-de-2022). |
| Média | Procedimento | A comunicação de incidente com risco ou dano relevante deve alcançar ANPD e titulares; a possibilidade de complementar informações em até 20 dias úteis refere-se à comunicação à ANPD e não prorroga automaticamente o aviso aos titulares. O procedimento foi esclarecido. É preciso confirmar quem monitora e responde pelo canal e como a contagem do prazo será controlada. [Orientações de incidentes da ANPD](https://www.gov.br/anpd/pt-br/canais_atendimento/agente-de-tratamento/comunicado-de-incidente-de-seguranca-cis). |
| Média | Procedimento | Etiquetas comuns do Gmail organizam mensagens, mas não restringem leitura a quem tem acesso à caixa. Verificar acesso à conta, delegações e medidas de segurança, além das etiquetas. [Ajuda do Gmail sobre etiquetas](https://support.google.com/mail/answer/118708); [Ajuda do Gmail sobre delegação](https://support.google.com/mail/answer/138350). |
| Média | Política e procedimento | A incidência dos deveres de guarda de registros do Marco Civil da Internet depende da qualificação do operador e da atividade. O art. 15 impõe seis meses a provedores constituídos como pessoa jurídica que atuem profissionalmente e com fins econômicos; o Setlist é apresentado como gratuito e operado por pessoa física, mas essa conclusão precisa ser confrontada com a operação real e eventuais ordens específicas de preservação. Não aplicar automaticamente seis meses a todos os dados nem concluir que jamais haverá retenção obrigatória. [Lei nº 12.965/2014, arts. 15 e 16](https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l12965.htm). |

## Leitura por documento

### Termos de uso

O texto descreve corretamente o caráter gratuito, a colaboração por bandas,
o login Google/Apple e a distinção entre código aberto e dados privados. A
licença técnica para hospedar e exibir conteúdo foi delimitada, mas não sana
falta de autorização sobre letras de terceiros. As referências a arquivos
internos de rascunho foram retiradas. Antes da publicação, resolver a
identificação do operador, o fluxo de aceite e versão, a política pública de
denúncia e contestação e a publicação na URL aprovada da política de
privacidade. Cláusulas de foro
ou limitação de responsabilidade só devem ser incluídas após análise de
incidência do direito do consumidor e do funcionamento real do serviço.

O design, a especificação de acesso e a apresentação pública ainda diziam que
o conteúdo “pertence à banda”, embora as minutas já diferenciassem o vínculo
técnico da titularidade autoral. A redação desses artefatos foi alinhada: o
conteúdo permanece vinculado à banda após a saída ou exclusão da conta, sem
atribuir à banda os direitos do autor. [Lei nº 9.610/1998, arts. 22 e 29](https://www.planalto.gov.br/ccivil_03/leis/l9610.htm).
A apresentação também descrevia palco e pacotes offline como parte do “MVP
agora”, embora o primeiro lançamento Web/Android/iOS preveja apenas preparação
online. Uma nota na abertura e os rótulos da apresentação distinguem agora a
visão completa da primeira versão. A página publicada precisará ser atualizada
se a apresentação continuar acessível durante o lançamento.

### Política de privacidade

Foi acrescentada a categoria de mensagens e solicitações recebidas pelo canal,
que já era mencionada na retenção, mas faltava no mapa de dados. Os direitos
do titular agora aparecem explicitamente, inclusive portabilidade, oposição e
revogação do consentimento quando aplicáveis. O aviso de mudanças agora
descreve comunicação direta com destaque e ressalva o consentimento quando
aplicável; o processo de envio ainda precisa ser implantado. As URLs canônicas
já foram escolhidas; restam a identificação
suficiente do controlador, a configuração efetiva de segurança e a retenção.
Sem inventário real dos fornecedores, a política não está pronta para divulgar.
Convém registrar, por tratamento, dado, finalidade, base legal, destinatário,
local, prazo e gatilho de exclusão, inclusive no Gmail/Cloudflare e no player
externo. A eventual dispensa de encarregado exige enquadramento confirmado e
não elimina o canal de atendimento. [LGPD, art. 9º](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm);
[Resolução CD/ANPD nº 2/2022, art. 11](https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-2-de-27-de-janeiro-de-2022).

A revisão da retenção confirmou no código que convites usados, revogados ou
vencidos e aceites históricos não têm limpeza automática antes da exclusão da
banda; a exclusão da conta apenas desvincula as referências diretas à pessoa.
É preciso decidir uma regra de descarte e implementá-la caso não haja finalidade
justificada para toda a vida da banda. A minuta agora apresenta o ciclo de
conta, participação, conteúdo, convites e mensagens sem inventar prazos dos
fornecedores. [LGPD, arts. 6º, 15 e 16](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm).

O inventário local também identificou o identificador da última banda em
`SecureStore` no móvel e `localStorage` na Web. Antes desta revisão, o logout
não o apagava. Além disso, o cache de consultas em memória tinha duração
indefinida e algumas chaves de consulta de bandas não incluíam a conta; uma
nova sessão no mesmo processo poderia reutilizar conteúdo antigo. O código
agora remove a preferência local no logout e cria um novo cache quando muda o
identificador da conta autenticada. A política descreve essa retenção local,
inclusive o descarte após exclusão da conta ou detecção de perda de acesso.
Como qualquer dado que possa ser relacionado a uma pessoa, a preferência local
deve seguir finalidade e necessidade; o identificador sozinho não autoriza
acesso ao conteúdo da banda. [LGPD, arts. 5º, 6º, 15 e 16](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm).

#### Inventário preliminar de retenção dos fornecedores

As janelas de consulta ou recuperação publicadas pelos fornecedores não são,
por si, prova de eliminação definitiva. A aplicação também não controla
diretamente todos os registros operacionais. A apuração deve separar a base
ativa, os logs, as cópias de segurança e a caixa de atendimento, inclusive na
resposta a pedidos de exclusão. [LGPD, arts. 15 e 16](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm).

| Conjunto de dados | Informação confirmada em documentação ou código | Conferência necessária para `setlist-prod` |
| --- | --- | --- |
| Banco ativo do Supabase | O fluxo de exclusão remove perfil e identidade de autenticação, mas preserva o conteúdo de bandas ativas e desvincula referências pessoais de convites e aceites. | Definir a limpeza de convites usados, revogados ou vencidos e dos aceites históricos; registrar o resultado de exclusões. |
| Logs de API e banco do Supabase | A [tabela de planos](https://supabase.com/pricing) informa janela de acesso de 1 dia no Free, 7 dias no Pro, 28 dias no Team e 90 dias no Enterprise. A [documentação de uso](https://supabase.com/docs/guides/troubleshooting/check-usage-for-monthly-active-users-mau-MwZaBs) descreve esses períodos como tempo acessível ao cliente, sem demonstrar eliminação de todas as cópias. | Confirmar plano da organização, logs gerados, acesso, destino de eventuais exportações e prazo efetivo de eliminação. |
| Auditoria de autenticação do Supabase | Os [Auth Audit Logs](https://supabase.com/docs/guides/auth/audit-logs) registram eventos de login, renovação de token e logout em armazenamento externo; a gravação adicional em `auth.audit_log_entries` é opcional. A [tabela de planos](https://supabase.com/pricing) informa acesso de 1 hora no Free, 7 dias no Pro e 28 dias no Team; não especifica período no Enterprise. | Conferir em **Authentication → Audit Logs** se a gravação no Postgres está ativa, qual o prazo de acesso e de eliminação aplicável, e se registros identificáveis subsistem à exclusão de `auth.users`. Não presumir que a remoção da identidade os apaga. |
| Backups e PITR do Supabase | A [documentação de backups](https://supabase.com/docs/guides/platform/backups) informa ausência de backup automático diário no Free; acesso aos últimos 7 dias no Pro, 14 no Team e até 30 no Enterprise. Se PITR for habilitado, substitui os backups diários e usa período de recuperação configurável. | Confirmar plano da organização, backup/PITR do projeto, período de recuperação, existência de dumps externos e procedimento para dados já apagados da base ativa. |
| Visitas ao GitHub Pages | O [GitHub](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages) informa que registra o IP do visitante por segurança, sem prazo de eliminação nessa página. | Identificar a política aplicável ao serviço contratado e distinguir logs de visita dos artefatos e logs do Actions. |
| Encaminhamento do e-mail pela Cloudflare | O [Email Routing](https://developers.cloudflare.com/email-service/observability/logs/) expõe registros de atividade e entrega. O intervalo disponível para filtrar a tela não estabelece o prazo de eliminação. | Conferir quais metadados são mantidos, quem acessa, por quanto tempo e como pedidos relativos a esses registros são tratados. |
| Mensagens e anexos no Gmail | O procedimento atual prevê acompanhar casos na caixa de e-mail, sem descarte automático confirmado. | Definir prazo por tipo de caso, exceções legais, responsáveis pelo descarte, cópias e controles de acesso; verificar a configuração real da conta. |

O [plano do Supabase pertence à organização](https://supabase.com/docs/guides/platform/billing-on-supabase),
enquanto PITR é um adicional por projeto. A consulta anterior ao CLI mostrou
`setlist-dev` e `setlist-prod`, mas não comprovou o plano, o PITR ou a opção de
auditoria em Postgres de produção. Portanto, os números publicados pelo
fornecedor ainda não podem ser atribuídos ao Setlist como prazo efetivo.

#### Mapa preliminar de fornecedores e fluxos transfronteiriços

| Fluxo observado | Dados envolvidos e gatilho | Apuração antes da publicação |
| --- | --- | --- |
| App ↔ Supabase | Identidade, sessão e dados das bandas circulam entre o app e o projeto; os projetos consultados usam a região primária `sa-east-1`. | Conferir DPA aplicável à conta, lista atual de suboperadores, regiões de suporte/logs, transferências posteriores, países e mecanismo válido para cada operação. A região primária não define todos os locais de tratamento. |
| Login Google ou Apple ↔ Supabase | A pessoa inicia o fluxo no respectivo provedor; o Supabase recebe a identidade autorizada. O fluxo nativo Apple solicita e-mail e nome completo; o OAuth de navegador não especifica escopos no código. | Conferir escopos e atributos efetivos no painel dos provedores e do Supabase, papel de cada agente, locais de tratamento e se há transferência entre agentes ou coleta direta pelo provedor estrangeiro. |
| Navegador ↔ GitHub Pages | Acesso à versão Web; o GitHub registra o IP do visitante para segurança. O código consultado não envia conteúdo da banda ao GitHub Pages como função do app. | Confirmar logs do site, retenção e local do tratamento; classificar a coleta de IP feita pelo próprio GitHub. Logs de CI não são logs de visita. |
| Referência externa → YouTube | Ao acionar a referência em uma música, o app abre o YouTube no aplicativo ou navegador externo. O protótipo incorporado permanece no código, sem rota ou item de menu na primeira versão pública. | Confirmar os dados do fluxo externo e o papel do Google/YouTube. O Setlist não envia letras da banda para sincronização. O YouTube pode exibir publicidade própria. |
| Remetente ↔ Cloudflare Email Routing → Gmail/Google | A mensagem e eventuais anexos seguem ao e-mail de contato e são encaminhados à caixa do responsável. | Conferir configuração ativa, acesso à caixa, políticas de retenção, países de processamento, papéis dos agentes e eventual transferência entre Cloudflare e Gmail. |

A Resolução CD/ANPD nº 19/2024 distingue a **transferência entre agentes** da
**coleta direta** pelo agente situado no exterior. Não se deve rotular todos os
fluxos acima como uma transferência feita pelo Setlist sem examinar o caminho
efetivo dos dados. Quando houver transferência sujeita à LGPD, são necessários
hipótese legal e mecanismo do art. 33; a seleção do mecanismo não decorre
automaticamente da contratação do fornecedor. Se forem usadas cláusulas-padrão
contratuais, o art. 16 do regulamento exige a incorporação integral das
cláusulas da ANPD ao instrumento, e o art. 17 exige transparência pública sobre
a operação e disponibilização das cláusulas ao titular mediante pedido. A
política futura pode conter essa seção, desde que completa e destacada.
[Resolução CD/ANPD nº 19/2024, arts. 3º a 6º, 9º e 15 a 17](https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-19-de-23-de-agosto-de-2024).

O [DPA público do Supabase](https://supabase.com/legal/customer-resources/data-processing-addendum)
identifica cláusulas-padrão da União Europeia e permite tratamento por
suboperadores fora da região primária. A [lista pública de suboperadores](https://supabase.com/legal/customer-resources/subprocessor-list)
é atualizável. A ANPD informa que, até esta revisão, não reconheceu
cláusulas estrangeiras como equivalentes às brasileiras; portanto, a presença
de cláusulas europeias nesse DPA não comprova, sozinha, o mecanismo para uma
transferência regida pela LGPD. [ANPD, mecanismos de transferência](https://www.gov.br/anpd/pt-br/assuntos/assuntos-internacionais/transferencia-internacional-de-dados).
As descrições do [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages),
do [Email Routing da Cloudflare](https://developers.cloudflare.com/email-service/get-started/route-emails/)
e do [YouTube](https://developers.google.com/youtube/terms/developer-policies)
fundamentam as etapas técnicas mapeadas; não estabelecem os contratos ou
configurações efetivos da conta Setlist.

#### Mapa de bases legais para validação

| Operação observada | Base candidata para dados comuns | Validação necessária |
| --- | --- | --- |
| Login, sessão, perfil e participação solicitados pela pessoa | Execução do serviço/contrato, art. 7º, V | Confirmar quais atributos Google/Apple e Supabase recebem e se todos são necessários |
| Convites e colaboração na banda | Execução do serviço/contrato para dados da pessoa usuária, art. 7º, V | Separar dados de terceiros eventualmente escritos em rótulos e conteúdo; não presumir que o aceite do usuário cobre esses titulares |
| Registro de aceite do termo da banda | Execução do contrato, art. 7º, V; exercício regular de direitos, art. 7º, VI, apenas quando ligado a processo judicial, administrativo ou arbitral | Definir finalidade probatória, acesso e descarte após a saída ou exclusão da banda |
| Atendimento a direitos de titulares e obrigações legais | Cumprimento de obrigação legal, art. 7º, II, quando houver dever específico | Distinguir de dúvidas gerais e denúncias autorais, que podem exigir outra hipótese e prazo próprio |
| Segurança, prevenção de abuso e resposta a incidentes | Legítimo interesse, art. 7º, IX, quando cabível, ou obrigação legal específica, art. 7º, II | Inventariar logs e fazer teste de finalidade, necessidade, balanceamento e salvaguardas antes de invocar legítimo interesse |
| Conteúdo livre da banda e anexos enviados ao contato | Não há base única presumível para dados de terceiros | Avaliar minimização, dados sensíveis pelo art. 11, eventual conteúdo de menores e tratamento de pedidos de remoção |

O aceite dos termos não é consentimento genérico para tratamento de dados.
Também não se pode usar legítimo interesse como base do art. 7º para dados
sensíveis, que têm hipóteses próprias no art. 11. A escolha final por operação
deve ser validada com o inventário de dados e por profissional jurídico.
[LGPD, arts. 7º, 8º e 11](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm);
[guia da ANPD sobre legítimo interesse](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia_orientativo_hipoteses_legais_tratamento_de_dados_pessoais_legitimo_interesse).

#### Avaliação preliminar de idade

A finalidade declarada é organizar o trabalho de bandas, e o responsável
escolheu permitir contas apenas a maiores de 18 anos. Em 01/10/2026, informou
que não há menores de 18 anos nem bandas escolares entre os usuários atuais ou
as bandas previstas para o piloto. O app, porém, ainda não verifica idade. A
tela de login permite iniciar Google/Apple sem convite e a área autenticada
oferece criação de banda; a configuração efetiva de cadastro no Supabase de
produção ainda precisa ser conferida. Assim, a ausência de menores conhecidos
no piloto não demonstra que uma pessoa menor não possa entrar. Esses fatos
exigem avaliar se o Setlist é de **acesso provável** por menores segundo os
critérios do art. 1º do ECA Digital. O responsável definiu que o primeiro
lançamento Web/Android/iOS será **aberto ao público**, sem exigência de convite ou
allowlist para iniciar uma conta; convites servem para ingressar nas bandas de
outras pessoas. A facilidade de acesso é um fator da
avaliação, mas não determina sozinha o enquadramento jurídico. A colaboração
ocorre dentro de bandas e não foi identificada disseminação social
em larga escala no código consultado. O conteúdo livre e a referência externa
opcional do YouTube ainda entram na avaliação. Esta é uma inferência sobre o
produto, não uma classificação jurídica concluída.

O responsável decidiu proibir conteúdo pornográfico, inclusive em letras,
observações e links para vídeos, e atribuir à pessoa que o inseriu ou editou a
responsabilidade por seus próprios atos. A proibição foi incluída nos termos,
com procedimento de denúncia e sem afirmar que exista bloqueio automático. O
app não possui filtro desse tipo nem auditoria de autoria por música. Assim, a
regra escrita não impede tecnicamente a inserção ou o acesso e não permite
identificar sempre quem publicou. Tampouco elimina os deveres legais do
operador quando tomar conhecimento de conteúdo proibido. O termo de aceite
atual da banda em `src/features/bands/legalTerm.ts` ainda usa a redação mais
ampla de responsabilidade pelo conteúdo adicionado à banda; sua atualização
para refletir a responsabilidade individual e a proibição exige revisão antes
de colocar novas minutas em vigor.

O responsável também informou que haverá um **processo paralelo de filtragem de
conteúdo indevido**, separado das funções de edição da banda. A revisão foi
definida como **posterior** à publicação, acionada por denúncias enviadas por
e-mail ou por inspeções; não haverá aprovação prévia de cada edição. Não há
implementação ou procedimento operacional confirmado desse fluxo no repositório.
Antes de descrevê-lo como proteção ativa nos textos públicos, definir quem
acessa o material, critérios e frequência de inspeção, como a decisão impede
efetivamente a leitura ou novas postagens, como são tratados denúncias e
recursos e por quanto tempo ficam os registros. Essa decisão não substitui a
análise da adequação à diretriz 1.2 da App Store, à política de conteúdo criado
por usuários do Google Play e ao ECA Digital.

Para concluir a avaliação factual, conferir se a configuração real de cadastro
do Supabase permite essa entrada pública e a classificação etária nas lojas.
A avaliação jurídica deve considerar a possibilidade de conteúdo proibido ser
inserido em campos livres apesar da regra contratual. O piloto sem menores não
substitui essas verificações.

O responsável decidiu impedir o acesso ao protótipo do YouTube no primeiro
lançamento público Web/Android/iOS. O link foi retirado do menu lateral e o arquivo
da rota `/youtube-prototype` foi removido; o componente técnico permanece no
repositório para desenvolvimento posterior. A referência registrada em uma
música ainda pode ser aberta externamente por ação da pessoa usuária. A
configuração `app.json` não registra a classificação etária efetivamente
escolhida na loja. Permanecem os campos livres das bandas e o acesso público
ao cadastro, que exigem análise própria.

O responsável definiu que a primeira disponibilização pública ocorrerá pela
Web, pelo Google Play no Android e pela App Store no iOS. A limitação de acesso
ao ambiente de testes iOS foi resolvida; há validação manual de autenticação,
papéis, convites e navegação em iPhone físico. Isso não comprova validação
completa da preparação online nem aprovação de uma build pública iOS. Os
perfis `development-android`, `preview` e `preview-ios` do `eas.json` distribuem
builds internamente; o perfil `production` não contém configuração de envio às
lojas. O responsável confirmou que o Setlist ainda não foi cadastrado no Google
Play Console nem no App Store Connect; portanto, não há questionários ou
classificações dessas lojas a conferir neste momento.
O Google Play separa a declaração de **público-alvo** do questionário de
**classificação de conteúdo**; o primeiro deve refletir a decisão de destinar
o Setlist a adultos, enquanto o segundo deve descrever com precisão as funções
e o conteúdo do app, inclusive material enviado por usuários. Confirmar no
Play Console se o cadastro existe e, se existir, os valores declarados e a
classificação IARC obtida após criar o cadastro. Na App Store, preencher e
conferir as respostas ao questionário de faixa etária, a classificação
atribuída e os dados de privacidade do app após criar o cadastro.
A definição de 18+ nas lojas não substitui a análise da Web nem a aferição de
idade exigível no serviço.
[Ajuda oficial do Play Console: público-alvo](https://support.google.com/googleplay/android-developer/answer/9867159?hl=pt-br);
[classificações de conteúdo](https://support.google.com/googleplay/android-developer/answer/9898843?hl=pt-BR);
[App Store Connect: classificação etária](https://developer.apple.com/help/app-store-connect/manage-app-information/set-an-app-age-rating/);
[App Store Connect: privacidade](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/).

O art. 9º, § 1º, proíbe autodeclaração para acesso a conteúdo, produto ou
serviço impróprio, inadequado ou proibido a menores. A preferência do operador
por restringir contas a 18+ não demonstra, por si só, que todo o Setlist se
enquadra nessa hipótese; tampouco demonstra que uma autodeclaração basta para
qualquer dever de aferição aplicável. Antes de implementar o mecanismo,
documentar o público real, as funcionalidades acessíveis sem login, as faixas
etárias nas lojas e os riscos do conteúdo gerado pelas bandas, inclusive a
ausência de filtro automático, e submeter a
conclusão a profissional jurídico. [ECA Digital, arts. 1º, 9º e 10](https://planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/l15211.htm);
[ANPD, página de orientações](https://www.gov.br/anpd/pt-br/assuntos/eca-digital/).

### Procedimento de remoção e solicitações

Este é um procedimento **interno**; os usuários precisam de instruções públicas
simples para reclamar e solicitar remoção, como as inseridas nos termos. A
exclusão de conta descrita corresponde ao fluxo atual, com preservação do
conteúdo de bandas ainda ativas. A operação deve documentar critérios de
triagem, prova, restrição temporária, manifestação da pessoa que publicou,
decisão, contestação e encerramento. O processo de incidentes e a retenção de
mensagens dependem de configuração e de responsáveis efetivos. Se a avaliação
concluir que o Setlist é serviço de acesso provável por menores, verificar
também os deveres específicos de notificação, retirada e recurso dos arts. 28
a 30 do ECA Digital; a política geral de denúncia autoral não cobre
necessariamente esses casos. [Lei nº 15.211/2025](https://planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/l15211.htm).

A checagem técnica encontrou que `remove_song` devolve `archived` quando a
música tem referência em `show_items`; nesse caso a letra e os metadados
permanecem em `songs`. A RLS de leitura autoriza todos os integrantes da banda,
sem exceção para `archived_at`. A aplicação oculta músicas arquivadas da lista
principal, mas essa apresentação não revoga o acesso ao registro. Não foi
identificado comando do controlador para bloqueio administrativo de conteúdo ou
suspensão de conta. A minuta operacional agora distingue triagem, medida urgente,
manifestação, decisão e contestação, e proíbe tratar arquivamento como retirada.
Antes do lançamento, é preciso testar um mecanismo que impeça efetivamente a
leitura do material denunciado, inclusive nas referências de shows, e definir
quem pode acioná-lo e rever a decisão.

O [Marco Civil da Internet, arts. 19 a 21](https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l12965.htm)
contém regras distintas para conteúdo de terceiros, direitos autorais e
exposição de intimidade. Os [Temas 533 e 987 do STF](https://noticias.stf.jus.br/postsnoticias/nota-a-imprensa-43/)
alteraram a interpretação do art. 19 e distinguem categorias de provedores e
conteúdos. A aplicação dessas regras a uma banda privada e a cada tipo de
denúncia exige avaliação jurídica; não se deve exigir ordem judicial para todo
pedido nem prometer retirada automática após qualquer e-mail. Se a classificação
do Setlist atrair os [arts. 28 a 30 do ECA Digital](https://planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/l15211.htm),
há exigências próprias de mecanismo de notificação, retirada e recurso, com
prazos procedimentais a definir.

A tabela `songs` não registra `created_by` nem `updated_by`. O operador pode
localizar a banda e seus integrantes, mas não atribuir tecnicamente a música a
uma pessoa específica. O procedimento passou a prever manifestação de quem
inseriu o material quando houver identificação confiável ou, caso contrário,
dos responsáveis pela banda, sem presumir autoria individual. Se for necessário
um histórico de autoria/alterações para denúncias, definir finalidade, acesso e
prazo de retenção antes de acrescentar novos dados pessoais ao schema.

## Decisões e evidências necessárias para o fechamento

### Sequência de fechamento proposta

A identificação pública `Setlist — setlistbr.app.br` e a opção de não divulgar
nome/CPF já foram decididas pelo responsável. Esta revisão não substitui a
avaliação jurídica de sua suficiência. O canal `contato@setlistbr.app.br`
também já foi escolhido. Para a publicação, foram aprovadas duas páginas anônimas
e permanentes no domínio do aplicativo: `https://setlistbr.app.br/termos/` e
`https://setlistbr.app.br/privacidade/`. A versão pública inicial receberá
número e data de vigência quando o texto estiver aprovado; as versões
anteriores deverão continuar recuperáveis para comprovar o texto aplicável a
cada aceite. O procedimento de remoção permanecerá interno, com instruções
públicas para solicitações nos termos. A escolha das URLs não autoriza publicar
os rascunhos.

### Procedimento de avisos legais a implantar

O código atual não oferece links para os documentos na tela de login, mantém o
item “Termos e privacidade” desabilitado no menu e não contém fluxo de avisos
legais. A caixa de contato foi confirmada para **receber** mensagens, mas não
foi verificado o remetente de saída nem a entrega para os e-mails das contas.
Assim, publicar a nova redação pressupõe estas etapas operacionais:

1. Classificar a alteração: texto editorial, direitos/obrigações contratuais,
   informações de tratamento dos incisos I, II, III ou V do art. 9º da LGPD,
   ou nova finalidade incompatível com consentimento existente. Revisão jurídica
   decide antecedência, destinatários e necessidade de novo aceite.
2. Preparar versão, data de vigência, resumo destacado das mudanças e cópia
   recuperável da versão anterior. Publicar somente texto aprovado nas URLs
   canônicas e registrar quando cada versão entrou em vigor.
3. Conferir o canal direto antes de usar: remetente autorizado, alcance dos
   e-mails cadastrados, falhas de entrega e alternativa para contas sem e-mail
   alcançável. Enviar avisos individualmente ou com proteção dos destinatários;
   registrar versão, público alcançado, data e falhas sem criar listas paralelas
   desnecessárias. Um aviso no aplicativo só poderá ser prometido depois de
   implementado e acessível aos afetados.
4. Quando a mudança depender de novo aceite ou consentimento, obter e registrar
   a manifestação específica antes de aplicar a nova condição. Se não houver
   meio adequado de avisar ou colher a manifestação exigida, não tratar a mera
   publicação da página como comprovação de ciência ou de concordância.

[LGPD, arts. 8º, §§ 1º, 4º e 6º, e 9º, §§ 1º e 2º](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm).

1. Identificar suficientemente a pessoa física controladora e confirmar se o
   enquadramento como agente de pequeno porte e a dispensa de encarregado se
   aplicam. A opção de não divulgar CPF/endereço precisa de análise específica;
   não foi resolvida por esta revisão.
2. Implantar as URLs públicas já aprovadas, atribuir versão e data de vigência
   aos termos e à política, disponibilizar ambos antes do login e no menu, e
   decidir como comprovar a aceitação dos termos gerais.
3. Inventariar os dados e fluxos efetivos de Google, Apple, Supabase, GitHub
   Pages, YouTube, Cloudflare e Gmail; confirmar bases legais, contratos,
   suboperadores, retenção, backups e transferências internacionais.
4. Classificar a incidência do ECA Digital e definir a aferição de idade. A
   obrigação de relatório de transparência do art. 31 depende, entre outros
   requisitos, de mais de um milhão de usuários menores registrados; não há
   evidência de que esse limiar se aplique ao Setlist. [ANPD, esclarecimento de
   agosto/2026](https://www.gov.br/anpd/pt-br/assuntos/noticias/plataformas-digitais-acessadas-por-criancas-e-adolescentes-precisam-publicar-relatorio-de-transparencia-ate-17-de-setembro).
5. Confirmar o acesso à caixa de contato, o canal seguro excepcional para
   identificação, o fluxo de incidentes e os critérios de denúncias autorais;
   submeter textos e decisões a profissional jurídico habilitado.
6. Implantar o procedimento de avisos legais acima e conferir links, envio,
   tratamento de falhas e registro de eventual novo aceite antes da publicação.
7. Para a App Store, definir e validar o tratamento de conteúdo criado por
   usuários exigido pela diretriz 1.2 da Apple. O processo paralelo escolhido
   ocorre após a publicação, por denúncia enviada por e-mail ou inspeção.
   Definir responsável, critérios, acesso, efeito técnico, resposta e bloqueio
   de usuários abusivos, e resolver a exigência preventiva da Apple. Para o
   Google Play, tornar a denúncia acessível dentro do app, ainda que o envio
   seja por e-mail, e validar os controles de bloqueio aplicáveis. Submeter a
   solução e as minutas à revisão jurídica antes do envio às lojas.

As alterações desta revisão corrigem inconsistências identificadas, mas não
constituem validação jurídica final do item 11.3 do OpenSpec.
