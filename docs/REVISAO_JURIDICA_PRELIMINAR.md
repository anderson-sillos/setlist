# Revisão jurídica preliminar das três minutas do Setlist

Data: 01/10/2026; atualização de moderação e retenção: 02/10/2026. Escopo: `TERMOS_DE_USO_RASCUNHO.md`,
`POLITICA_DE_PRIVACIDADE_RASCUNHO.md` e
`PROCEDIMENTO_DE_REMOCAO_RASCUNHO.md`, confrontados com os fluxos atuais do
aplicativo. Este é um roteiro de revisão, não um parecer assinado por advogado.
O responsável informou, para a etapa atual, que a revisão por profissional
jurídico está concluída. Este arquivo não registra um parecer nem comprova
que a redação produzida depois dessa revisão foi aprovada. As três minutas
continuam sem aprovação operacional para distribuição pública.

## Estado desta rodada

As minutas foram alinhadas ao controle preventivo limitado, às denúncias por
e-mail e às medidas administrativas já validadas em desenvolvimento. Foram
registradas as decisões do responsável sobre acompanhamento do canal nos dias
úteis, revisão trimestral de casos encerrados no Gmail, retenção de 1 mês dos
logs do Brevo sem novas prévias, backup semanal próprio com 12 cópias, descarte
de convites encerrados após 30 dias e limpeza dos registros temporários de
denúncia após 24 horas e auditoria de login no Postgres por 30 dias. As três
limpezas, o backup e a configuração do Brevo ainda precisam ser implantados e
verificados em produção.

As páginas HTML candidatas `docs/termos.html` e `docs/privacidade.html` foram
preparadas sem notas internas. O cliente agora apresenta links para os dois
endereços antes do login e no menu. Por decisão do responsável, o disclaimer
informa que prosseguir com o login significa concordar com os Termos de uso,
sem registrar aceite explícito dos termos gerais e sem tratar a Política de
privacidade como consentimento geral. O aceite separado do termo de
responsabilidade da banda permanece. Antes da publicação, conferir o texto
final, substituir a vigência condicionada pela data efetiva, validar os fatos
operacionais e abrir as URLs públicas sem autenticação.

O responsável informou que a revisão jurídica aprovou
**Setlist** como identificação pública do controlador pessoa física, sem nome
civil, CPF ou endereço no texto público. Continuam pendentes a conferência das
informações dos fornecedores, a configuração etária nas lojas e o acesso
público aos textos. A revisão jurídica
informada pelo responsável classificou o Setlist como serviço adulto sem acesso
provável por menores. A etapa de redação e revisão informada no item 11.3 do
OpenSpec foi encerrada; as conferências para publicação permanecem em 11.8.

### Fechamento das minutas

- **Decisões informadas como concluídas na revisão jurídica:** identificação
  pública como Setlist, enquadramento como agente de pequeno porte e dispensa
  de encarregado, classificação do serviço como adulto sem acesso provável por
  menores e bases legais propostas para dados comuns conforme a finalidade.
  O responsável decidiu aplicar a regra de 18 anos nos termos e nas lojas,
  sem confirmação de idade no cadastro, inclusive na Web.
- **Descrição fiel do fluxo:** a função de denúncia envia descrição e
  identificadores ao Brevo. A avaliação do responsável de que esse fluxo tem
  baixa relevância não altera os campos enviados. Conferir o contrato e as
  informações sobre o processamento antes da publicação; esta checagem não
  impede o encerramento da etapa de redação e revisão informada.
- **Conferências operacionais separadas da revisão jurídica:** inventário de
  fornecedores e retenção, rotinas de limpeza e backup, configuração do Brevo,
  publicação das URLs, links antes do login, avisos legais, controles das lojas
  e validação em produção. As tarefas 11.8.2 a 11.8.9 do OpenSpec registram
  parte dessas entregas.
- **Publicação:** consolidar versões públicas coerentes com os fluxos reais e
  com as decisões informadas, sem notas internas ou afirmações não verificadas.
  Essa entrega e a operação permanecem na etapa 11.8.

## Achados prioritários

| Prioridade | Documento                        | Achado e providência                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ---------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Resolvida conforme informação do responsável | Termos e política | O responsável informou que a revisão jurídica aprovou **Setlist** como identificação pública da pessoa física controladora, sem divulgar nome civil, CPF ou endereço, e `contato@setlistbr.app.br` como canal separado. As minutas foram alinhadas a essa decisão. Este roteiro não contém o parecer profissional nem comprova aprovação das alterações posteriores; preservar a conclusão jurídica junto ao registro interno de publicação. [LGPD, art. 9º, III e IV](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm). |
| Alta       | Termos, política e produto       | Achado histórico: o login afirmava concordância com termos e política sem links, e o item “Termos e privacidade” estava desabilitado. Os links foram preparados para o login e o menu, com disclaimer de concordância apenas com os Termos de uso; as páginas públicas ainda precisam ser publicadas e conferidas. Por decisão do responsável, não haverá registro separado de aceite dos termos gerais. A política informa o tratamento de dados; sua leitura não equivale a consentimento genérico. O aceite separado do termo de responsabilidade da banda já existe, mas não substitui a disponibilização dos termos gerais. [LGPD, arts. 8º e 9º](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm).                                                                                                                               |
| Alta       | Termos, política e produto       | As minutas deixaram de prometer dois canais simultâneos; agora preveem comunicação direta com destaque por e-mail cadastrado, quando disponível, ou outro meio adequado. Ainda não há fluxo operacional verificado para avisos legais, remetente de saída confirmado nem alternativa para contas sem e-mail alcançável. Definir, executar e documentar esse processo antes da publicação. Mudanças nas informações do tratamento exigem transparência específica; mudança incompatível de finalidade baseada em consentimento exige aviso prévio. [LGPD, arts. 8º, § 6º, e 9º, § 2º](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm).                                                                                                          |
| Alta       | Política                         | O responsável informou que a revisão jurídica aprovou as bases propostas para dados comuns das funções do serviço, obrigações legais e prevenção de abuso conforme a finalidade. Restam o inventário efetivo de dados e fornecedores, o teste documentado de legítimo interesse, a avaliação dos dados de terceiros e sensíveis em campos livres, os contratos, as exceções de retenção, as limpezas, o backup, as medidas de segurança em produção e os destinos e mecanismos de transferências internacionais. A região primária do Supabase não comprova que todo tratamento fica no Brasil. [LGPD, arts. 6º, 7º, 9º, 11 e 33](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm); [Resolução CD/ANPD nº 19/2024](https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-19-de-23-de-agosto-de-2024). |
| Alta       | Termos e política                | Segundo a conclusão da revisão jurídica informada pelo responsável, o Setlist é serviço adulto sem acesso provável por menores. O responsável decidiu manter a regra de 18 anos nos termos e usar os controles disponíveis nas lojas, sem confirmar idade no cadastro. Configurar as lojas antes da distribuição, documentar que a Web não terá bloqueio etário e definir a resposta a indícios de uso por menores. Reavaliar a classificação se o serviço ou o público mudar. [Lei nº 15.211/2025](https://planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/l15211.htm); [orientações atuais da ANPD](https://www.gov.br/anpd/pt-br/assuntos/eca-digital/). |
| Alta       | Termos e procedimento            | A moderação administrativa foi implementada e validada em `setlist-dev`: `moderated_songs` oculta a música das consultas de repertório e shows, e `suspended_accounts` bloqueia operações protegidas de contas suspensas. Arquivar música continua sem produzir esse bloqueio. A tabela de músicas não identifica quem enviou ou alterou cada registro. Antes da produção, implantar os controles, definir critérios e registro de decisões, e revisar juridicamente a manifestação de pessoas identificáveis. [Marco Civil, arts. 19 a 21](https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l12965.htm); [ECA Digital, arts. 28 a 30](https://planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/l15211.htm). |
| Alta       | App Store, termos e procedimento | O primeiro corte agora tem filtro preventivo no banco para alguns padrões explícitos em músicas, denúncia de música e integrante dentro do app e medidas manuais de ocultação e suspensão, validados em desenvolvimento. A revisão geral continua posterior à publicação. A diretriz 1.2 da Apple requer filtragem de material inadequado, denúncia e resposta oportuna, bloqueio de usuários abusivos e contato publicado. Avaliar a suficiência do filtro limitado e do atendimento apenas em dias úteis antes da submissão; a validação técnica não significa aprovação pela loja. [Apple App Review Guidelines, 1.2](https://developer.apple.com/app-store/review/guidelines/br/). |
| Alta       | Google Play, termos e produto    | As ações dentro do app para denunciar música e integrante, com envio por e-mail, foram implementadas e validadas em desenvolvimento. A política do Google Play exige moderação contínua proporcional ao conteúdo e mecanismos internos de denúncia e bloqueio conforme a experiência de interação. Confirmar que a rotina operacional, a suspensão administrativa e a distribuição final atendem à política antes da submissão. [Google Play, política de conteúdo criado por usuários](https://support.google.com/googleplay/android-developer/answer/9876937?hl=pt-BR). |
| Média      | Termos e procedimento            | A frase “conteúdo pertence à banda” confundia controle de acesso com titularidade autoral e foi corrigida. O responsável aprovou o fluxo operacional de denúncia: localização e motivo, prova proporcional quando aplicável, ocultação urgente em caso de risco, manifestação de quem enviou o conteúdo quando possível e contestação. Direitos sobre letras de terceiros e autorização técnica concedida ao Setlist ainda devem ser tratados conforme o caso e a redação final dos termos. [Lei nº 9.610/1998, arts. 22 e 29](https://www.planalto.gov.br/ccivil_03/leis/l9610.htm). |
| Resolvida conforme informação do responsável | Política e procedimento | O responsável informou que a revisão jurídica confirmou o enquadramento como agente de pequeno porte e a dispensa de encarregado, mantendo o e-mail de contato para titulares. Embora a Resolução nº 2/2022 preveja prazos diferenciados, a política adota a regra geral de resposta simplificada imediata ou declaração completa em até 15 dias; o aviso de recebimento em 5 dias úteis não substitui essa resposta. [LGPD, art. 19](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm); [Resolução CD/ANPD nº 2/2022, arts. 11, 14 e 15](https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-2-de-27-de-janeiro-de-2022). |
| Média      | Procedimento                     | A comunicação de incidente com risco ou dano relevante deve alcançar ANPD e titulares; a possibilidade de complementar informações em até 20 dias úteis refere-se à comunicação à ANPD e não prorroga automaticamente o aviso aos titulares. O procedimento foi esclarecido. É preciso confirmar quem monitora e responde pelo canal e como a contagem do prazo será controlada. [Orientações de incidentes da ANPD](https://www.gov.br/anpd/pt-br/canais_atendimento/agente-de-tratamento/comunicado-de-incidente-de-seguranca-cis).                                                                                                                                                                                                                                            |
| Média      | Procedimento                     | Etiquetas comuns do Gmail organizam mensagens, mas não restringem leitura a quem tem acesso à caixa. Verificar acesso à conta, delegações e medidas de segurança, além das etiquetas. [Ajuda do Gmail sobre etiquetas](https://support.google.com/mail/answer/118708); [Ajuda do Gmail sobre delegação](https://support.google.com/mail/answer/138350).                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Média      | Política e procedimento          | A incidência dos deveres de guarda de registros do Marco Civil da Internet depende da qualificação do operador e da atividade. O art. 15 impõe seis meses a provedores constituídos como pessoa jurídica que atuem profissionalmente e com fins econômicos; o Setlist é apresentado como gratuito e operado por pessoa física, mas essa conclusão precisa ser confrontada com a operação real e eventuais ordens específicas de preservação. Não aplicar automaticamente seis meses a todos os dados nem concluir que jamais haverá retenção obrigatória. [Lei nº 12.965/2014, arts. 15 e 16](https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l12965.htm).                                                                                                          |

## Leitura por documento

### Termos de uso

O texto descreve corretamente o caráter gratuito, a colaboração por bandas,
o login Google/Apple e a distinção entre código aberto e dados privados. A
licença técnica para hospedar e exibir conteúdo foi delimitada, mas não sana
falta de autorização sobre letras de terceiros. As referências a arquivos
internos de rascunho foram retiradas. Antes da publicação, aplicar a
identificação pública já definida, resolver o fluxo de aceite e versão e a política pública de
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
externo. O responsável informou que a revisão jurídica confirmou o
enquadramento como agente de pequeno porte e a dispensa de encarregado; o canal
de atendimento permanece obrigatório. [LGPD, art. 9º](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm);
[Resolução CD/ANPD nº 2/2022, art. 11](https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-2-de-27-de-janeiro-de-2022).

A revisão da retenção confirmou no código que convites usados, revogados ou
vencidos e aceites históricos não têm limpeza automática antes da exclusão da
banda; a exclusão da conta apenas desvincula as referências diretas à pessoa.
O responsável definiu uma regra de descarte, cuja implementação ainda está
pendente. A minuta apresenta o ciclo de
conta, participação, conteúdo, convites e mensagens sem inventar prazos dos
fornecedores. [LGPD, arts. 6º, 15 e 16](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm).

**Decisão do responsável, ainda não implementada:** apagar convites encerrados
30 dias após uso, revogação ou vencimento; conservar aceites do termo enquanto
a banda existir, para comprovar a versão aceita durante a participação, e
eliminá-los com a banda. A tabela de convites guarda o hash do token, rótulo,
datas e referências de criador/usuário; a tabela de aceites guarda banda,
versão e data do aceite. Após excluir uma conta, as referências diretas a ela
são anuladas, mas os demais campos ainda podem permitir associação indireta
em uma banda pequena. A limpeza de convites exigirá implementação e deve
preservar casos sob contestação ou obrigação específica de conservação. A
necessidade e proporcionalidade de cada prazo dependem de revisão jurídica;
nenhuma das duas regras escolhidas decorre automaticamente da LGPD.

O responsável também decidiu limpar diariamente os registros de
`report_rate_limits` quando a janela de envio tiver terminado há pelo menos
24 horas. Essa tabela guarda o identificador da conta, o último identificador
do caso e o horário do próximo envio permitido; a janela funcional é de
1 minuto. Hoje a linha pode persistir até novo envio ou exclusão da conta.
A limpeza ainda não foi implementada. O e-mail do caso é um registro separado,
com revisão de necessidade e descarte próprios.

**Decisão do responsável sobre auditoria de login, ainda não implementada:**
conservar a cópia em
`auth.audit_log_entries` por 30 dias para permitir apuração de acessos
suspeitos identificados após a janela de consulta externa do plano Free,
que é de 1 hora para Auth Audit Logs. Limpar diariamente os registros mais
antigos após conferir o esquema e as permissões da tabela gerenciada pelo
Supabase; documentar exceções necessárias à apuração de incidentes. O prazo
de 30 dias é uma escolha operacional, não exigência legal ou configuração
efetiva de limpeza. Antes de implantá-la, confirmar se a consulta no banco atende à
necessidade real de investigação, o volume de armazenamento, a viabilidade
de limpeza suportada pelo fornecedor e o tratamento dos registros após a
exclusão de uma conta. Os logs externos do Supabase seguem separados e não
adotam automaticamente o prazo escolhido para a tabela. [Auth Audit Logs](https://supabase.com/docs/guides/auth/audit-logs);
[planos do Supabase](https://supabase.com/pricing).

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

| Conjunto de dados                        | Informação confirmada em documentação ou código                                                                                                                                                                                                                                                                                                                                        | Conferência necessária para `setlist-prod`                                                                                                                                                                                                                 |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Banco ativo do Supabase                  | O fluxo de exclusão remove perfil e identidade de autenticação, mas preserva o conteúdo de bandas ativas e desvincula referências pessoais de convites e aceites. O responsável escolheu eliminar convites encerrados após 30 dias e manter aceites enquanto a banda existir. | Implementar e conferir a limpeza de convites com exceções documentadas; conferir a exclusão dos aceites com a banda e registrar o resultado de exclusões. |
| Logs de API e banco do Supabase          | A [tabela de planos](https://supabase.com/pricing) informa janela de acesso de 1 dia no Free. O responsável confirmou que `setlist-prod` está nesse plano; a janela de consulta não demonstra eliminação de todas as cópias. | Conferir logs gerados, acesso, destino de eventuais exportações e prazo efetivo de eliminação. |
| Auditoria de autenticação do Supabase    | Os [Auth Audit Logs](https://supabase.com/docs/guides/auth/audit-logs) registram eventos de login e renovação de token em armazenamento externo; a gravação adicional em `auth.audit_log_entries` está ligada em `setlist-prod`. O responsável decidiu manter essa cópia por 30 dias com limpeza diária, ainda não implantada. | Conferir o mecanismo suportado para limpar a tabela gerenciada, eventuais exceções e dados identificáveis após exclusão de `auth.users`; validar a execução em produção. A janela externa do plano Free não define a retenção dessa tabela. |
| Backups e PITR do Supabase               | O responsável confirmou `setlist-prod` no plano Free, sem PITR. A [documentação de backups](https://supabase.com/docs/guides/platform/backups) informa que esse plano não oferece backup diário automático. Foi escolhida uma cópia semanal própria em disco externo criptografado, com rotação das 12 cópias mais recentes. | Implementar e validar a rotina e a restauração em ambiente isolado; definir a guarda do disco e o tratamento de dados apagados da base ativa. |
| Visitas ao GitHub Pages                  | O [GitHub](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages) informa que registra o IP do visitante por segurança, sem prazo de eliminação nessa página.                                                                                                                                                                                        | Identificar a política aplicável ao serviço contratado e distinguir logs de visita dos artefatos e logs do Actions.                                                                                                                                        |
| Encaminhamento do e-mail pela Cloudflare | O [Email Routing](https://developers.cloudflare.com/email-service/observability/logs/) expõe registros de atividade e entrega. O intervalo disponível para filtrar a tela não estabelece o prazo de eliminação.                                                                                                                                                                        | Conferir quais metadados são mantidos, quem acessa, por quanto tempo e como pedidos relativos a esses registros são tratados.                                                                                                                              |
| Mensagens e anexos no Gmail              | O responsável é a única pessoa com acesso informado, acompanha a caixa nos dias úteis e revisará casos encerrados trimestralmente para descartar o que não precisar mais ser conservado. | Confirmar critérios e exceções de retenção com assessoria jurídica; conferir configuração real e cópias mantidas pelo fornecedor. |
| Denúncias enviadas pelo Brevo             | A conta é exclusiva do Setlist. O responsável escolheu 1 mês de logs transacionais e nenhuma nova prévia do e-mail. A [documentação do Brevo](https://help.brevo.com/hc/en-us/articles/4415743225746-Configure-a-custom-retention-period-for-your-transactional-logs-and-email-previews) informa retenção indefinida dos logs se não houver regra configurada. | Aplicar e conferir a regra no painel, inclusive prévias já existentes, contrato, locais de tratamento e eliminação efetiva. |

O [plano do Supabase pertence à organização](https://supabase.com/docs/guides/platform/billing-on-supabase),
enquanto PITR é um adicional por projeto. O responsável confirmou o plano Free
e a ausência de PITR em `setlist-prod`; o responsável confirmou a auditoria em
Postgres ligada, mas a eliminação efetiva de seus registros e daqueles mantidos
pelos fornecedores seguem sem
conferência. A janela de consulta publicada não deve ser apresentada como prazo
de eliminação definitiva.

#### Mapa preliminar de fornecedores e fluxos transfronteiriços

| Fluxo observado                                     | Dados envolvidos e gatilho                                                                                                                                                                              | Apuração antes da publicação                                                                                                                                                                                                 |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| App ↔ Supabase                                      | Identidade, sessão e dados das bandas circulam entre o app e o projeto; os projetos consultados usam a região primária `sa-east-1`.                                                                     | Conferir DPA aplicável à conta, lista atual de suboperadores, regiões de suporte/logs, transferências posteriores, países e mecanismo válido para cada operação. A região primária não define todos os locais de tratamento. |
| Login Google ou Apple ↔ Supabase                    | A pessoa inicia o fluxo no respectivo provedor; o Supabase recebe um token de identidade no fluxo nativo ou conclui o OAuth no navegador. Google usa login nativo em Android/iOS quando disponível; Apple usa login nativo no iOS. O fluxo nativo Apple solicita e-mail e nome completo; o OAuth de navegador não especifica escopos no código. | Conferir escopos e atributos efetivos no painel dos provedores e do Supabase, papel de cada agente, locais de tratamento e se há transferência entre agentes ou coleta direta pelo provedor estrangeiro. |
| Navegador ↔ GitHub Pages                            | Acesso à versão Web; o GitHub registra o IP do visitante para segurança. O código consultado não envia conteúdo da banda ao GitHub Pages como função do app.                                            | Confirmar logs do site, retenção e local do tratamento; classificar a coleta de IP feita pelo próprio GitHub. Logs de CI não são logs de visita.                                                                             |
| Referência externa → YouTube                        | Ao acionar a referência em uma música, o app abre o YouTube no aplicativo ou navegador externo. O protótipo incorporado permanece no código, sem rota ou item de menu na primeira versão pública.       | Confirmar os dados do fluxo externo e o papel do Google/YouTube. O Setlist não envia letras da banda para sincronização. O YouTube pode exibir publicidade própria.                                                          |
| Remetente ↔ Cloudflare Email Routing → Gmail/Google | A mensagem e eventuais anexos seguem ao e-mail de contato e são encaminhados à caixa do responsável.                                                                                                    | Conferir configuração ativa, acesso à caixa, políticas de retenção, países de processamento, papéis dos agentes e eventual transferência entre Cloudflare e Gmail.                                                           |
| Denúncia no app → Supabase Edge Function → Brevo → caixa de contato | A Edge Function verifica o vínculo com a banda e transmite identificadores de banda, alvo, denunciante e caso, além da descrição escrita pela pessoa; a letra não é anexada automaticamente. | Conferir contrato, localização e retenção efetiva em cada etapa; configurar 1 mês de logs do Brevo sem novas prévias, conforme decisão do responsável. |

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

O responsável considera os dados transmitidos ao Brevo de baixa relevância e
informou que a revisão jurídica concluiu não haver tratamento por fornecedores
fora do Brasil. Para manter a política fiel ao funcionamento do app, a etapa
de publicação deve conferir o fluxo e o contrato efetivos:
`supabase/functions/report-content/index.ts` envia à API do Brevo descrição e
identificadores, enquanto a [documentação do fornecedor informa processamento
e armazenamento na União
Europeia](https://help.brevo.com/hc/pt/articles/360001005510-Lugares-de-armazenamento-dos-dados).
Essa conferência não impede o encerramento da redação e revisão jurídica
informada para o item 11.3.

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

#### Mapa de bases legais

O responsável informou que a revisão jurídica aprovou as bases propostas para
dados comuns, conforme cada finalidade. O quadro conserva as apurações
operacionais necessárias para aplicá-las aos fluxos reais.

| Operação observada                                           | Base aprovada para dados comuns, segundo o responsável                                                                                             | Apuração operacional necessária                                                                                                     |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Login, sessão, perfil e participação solicitados pela pessoa | Execução do serviço/contrato, art. 7º, V                                                                                                           | Confirmar quais atributos Google/Apple e Supabase recebem e se todos são necessários                                                |
| Convites e colaboração na banda                              | Execução do serviço/contrato para dados da pessoa usuária, art. 7º, V                                                                              | Separar dados de terceiros eventualmente escritos em rótulos e conteúdo; não presumir que o aceite do usuário cobre esses titulares |
| Registro de aceite do termo da banda                         | Execução do contrato, art. 7º, V; exercício regular de direitos, art. 7º, VI, apenas quando ligado a processo judicial, administrativo ou arbitral | Definir finalidade probatória, acesso e descarte após a saída ou exclusão da banda                                                  |
| Atendimento a direitos de titulares e obrigações legais      | Cumprimento de obrigação legal, art. 7º, II, quando houver dever específico                                                                        | Distinguir de dúvidas gerais e denúncias autorais, que podem exigir outra hipótese e prazo próprio                                  |
| Segurança, prevenção de abuso e resposta a incidentes        | Legítimo interesse, art. 7º, IX, quando cabível, ou obrigação legal específica, art. 7º, II                                                        | Inventariar logs e fazer teste de finalidade, necessidade, balanceamento e salvaguardas antes de invocar legítimo interesse         |
| Conteúdo livre da banda e anexos enviados ao contato         | Não há base única presumível para dados de terceiros                                                                                               | Avaliar minimização, dados sensíveis pelo art. 11, eventual conteúdo de menores e tratamento de pedidos de remoção                  |

O aceite dos termos não é consentimento genérico para tratamento de dados.
Também não se pode usar legítimo interesse como base do art. 7º para dados
sensíveis, que têm hipóteses próprias no art. 11. A escolha final por operação
deve ser aplicada ao inventário real de dados; casos fora das finalidades
aprovadas exigem avaliação específica.
[LGPD, arts. 7º, 8º e 11](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm);
[guia da ANPD sobre legítimo interesse](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia_orientativo_hipoteses_legais_tratamento_de_dados_pessoais_legitimo_interesse).

#### Avaliação de idade

A finalidade declarada é organizar o trabalho de bandas, e o responsável
escolheu permitir contas apenas a maiores de 18 anos. Em 01/10/2026, informou
que não há menores de 18 anos nem bandas escolares entre os usuários atuais ou
as bandas previstas para o piloto. O app, porém, ainda não verifica idade. A
tela de login permite iniciar Google/Apple sem convite e a área autenticada
oferece criação de banda; a configuração efetiva de cadastro no Supabase de
produção ainda precisa ser conferida. Assim, a ausência de menores conhecidos
no piloto não demonstra que uma pessoa menor não possa entrar. Esses fatos
foram considerados na classificação jurídica. O responsável informou que a
revisão concluída classificou o Setlist como serviço adulto **sem acesso provável**
por menores. O responsável definiu que o primeiro
lançamento Web/Android/iOS será **aberto ao público**, sem exigência de convite ou
allowlist para iniciar uma conta; convites servem para ingressar nas bandas de
outras pessoas. A facilidade de acesso é um fator da
avaliação, mas não determina sozinha o enquadramento jurídico. A colaboração
ocorre dentro de bandas e não foi identificada disseminação social
em larga escala no código consultado. O conteúdo livre e a referência externa
opcional do YouTube são características a acompanhar. A conclusão jurídica
informada deve ser reavaliada se o público efetivo ou as funcionalidades mudarem.

O responsável decidiu proibir conteúdo pornográfico, inclusive em letras,
observações e links para vídeos, e atribuir à pessoa que o inseriu ou editou a
responsabilidade por seus próprios atos. O primeiro corte implementado em
`setlist-dev` aplica regras preventivas simples no banco antes de salvar
músicas; padrões sinalizados são recusados. A cobertura é restrita e não
reavalia o acervo anterior. A tabela de músicas continua sem auditoria de
autoria por registro, portanto não permite sempre identificar quem publicou.
A regra contratual e o filtro limitado não afastam os deveres legais do operador
quando tomar conhecimento de conteúdo proibido. O termo vigente da banda em
`src/features/bands/legalTerm.ts` já inclui responsabilidade individual,
proibição de material indevido, filtro e canal de contestação na versão
`2026-10`; sua implantação em produção exige coordenação com a migration.

A revisão geral foi definida como **posterior** à publicação, diante de denúncia
ou indício concreto documentado, sem inspeção periódica por amostragem nem
aprovação prévia de cada edição. O app passou a oferecer denúncia
de música e integrante com envio pelo Brevo à caixa de contato; o banco permite
ocultar músicas e suspender contas por ação administrativa. O responsável
validou esses fluxos em desenvolvimento. O responsável aprovou que somente ele
consultará conteúdo privado na extensão necessária à apuração, registrando
origem, data, conteúdo consultado, medida e resultado. Antes de
descrever as medidas como operacionais em produção, implantá-las e conferir a
rotina de atendimento. Sua suficiência perante a diretriz 1.2 da App Store,
a política de conteúdo criado por usuários do Google Play e o ECA Digital
continua sujeita à revisão específica.

Para concluir a preparação operacional, conferir se a configuração real de
cadastro do Supabase permite entrada pública e a classificação etária nas lojas.
Monitorar se o público efetivo e o conteúdo inserido em campos livres continuam
compatíveis com a classificação jurídica informada.

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
A definição de 18+ nas lojas não impede o cadastro pela Web nem comprova a
idade de quem utiliza o serviço.
[O Google Play permite selecionar 18+ como único público-alvo e ativar a
restrição de acesso a contas identificadas como menores](https://support.google.com/googleplay/android-developer/answer/9867159?hl=en),
mas a medida não interrompe o uso por quem já instalou o app. Na
[App Store, é possível elevar a classificação atribuída quando os termos
exigem idade mínima superior](https://developer.apple.com/help/app-store-connect/manage-app-information/set-an-app-age-rating/);
a classificação apoia controles parentais e não identifica individualmente
quem usa o serviço. Ambos os mecanismos serão configurados depois da criação
dos cadastros das lojas e não cobrem a Web.
[Ajuda oficial do Play Console: público-alvo](https://support.google.com/googleplay/android-developer/answer/9867159?hl=pt-br);
[classificações de conteúdo](https://support.google.com/googleplay/android-developer/answer/9898843?hl=pt-BR);
[App Store Connect: classificação etária](https://developer.apple.com/help/app-store-connect/manage-app-information/set-an-app-age-rating/);
[App Store Connect: privacidade](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/).

O art. 9º, § 1º, proíbe autodeclaração para acesso a conteúdo, produto ou
serviço impróprio, inadequado ou proibido a menores. O responsável decidiu não
incluir confirmação de idade no cadastro nesta versão; a regra de 18 anos
constará dos termos e os controles disponíveis serão configurados nas lojas.
Essa decisão deixa a Web sem bloqueio etário e não garante que todas as pessoas
usuárias sejam adultas. Acompanhar o público e o conteúdo efetivos e reavaliar
a classificação se mudarem. [ECA Digital, arts. 1º, 9º e 10](https://planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/l15211.htm);
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

A identificação pública `Setlist — setlistbr.app.br` sem nome civil, CPF ou
endereço foi aprovada na revisão jurídica, conforme informou o responsável.
Este roteiro não contém o parecer nem valida alterações posteriores. O canal `contato@setlistbr.app.br`
também já foi escolhido. Para a publicação, foram aprovadas duas páginas anônimas
e permanentes no domínio do aplicativo: `https://setlistbr.app.br/termos/` e
`https://setlistbr.app.br/privacidade/`. A versão pública inicial receberá
número e data de vigência quando o texto estiver aprovado; as versões
anteriores deverão continuar recuperáveis para comprovar o texto aplicável a
cada aceite. O procedimento de remoção permanecerá interno, com instruções
públicas para solicitações nos termos. A escolha das URLs não autoriza publicar
os rascunhos.

### Procedimento de avisos legais a implantar

O código já oferece links para os documentos na tela de login e no menu,
mas as páginas candidatas ainda não foram publicadas e o fluxo de avisos
legais permanece pendente. A caixa de contato foi confirmada para **receber** mensagens, mas não
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

1. Aplicar a identificação pública **Setlist** e o canal de contato separados,
   conforme a conclusão jurídica informada pelo responsável. Preservar também
   o registro da conclusão informada sobre pequeno porte e dispensa de
   encarregado, mantendo o canal para titulares.
2. Implantar as URLs públicas já aprovadas, atribuir versão e data de vigência
   aos termos e à política, disponibilizar ambos antes do login e no menu.
   O responsável decidiu não registrar aceite separado dos termos gerais; o
   aceite do termo de responsabilidade da banda continua registrado.
3. Inventariar os dados e fluxos efetivos de Google, Apple, Supabase, GitHub
   Pages, YouTube, Cloudflare e Gmail; confirmar bases legais, contratos,
   suboperadores, retenção, backups e transferências internacionais.
4. Registrar a classificação jurídica informada de serviço adulto sem acesso
   provável por menores, configurar os controles de idade disponíveis nas lojas
   e documentar o acesso sem bloqueio etário pela Web.
   A obrigação de relatório de transparência do art. 31 depende, entre outros
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
   ocorre após a publicação, diante de denúncia enviada por e-mail ou indício
   concreto documentado, sem varredura periódica. Conferir em produção o acesso,
   efeito técnico, resposta e bloqueio de usuários abusivos, e avaliar a
   suficiência do filtro preventivo perante a Apple. Para o
   Google Play, tornar a denúncia acessível dentro do app, ainda que o envio
   seja por e-mail, e validar os controles de bloqueio aplicáveis. Submeter a
   solução e as minutas frente às exigências das lojas antes do envio.

Este roteiro não substitui o parecer profissional cuja conclusão foi informada
pelo responsável, nem autoriza publicar minutas que ainda contenham notas
internas ou configurações não conferidas.
