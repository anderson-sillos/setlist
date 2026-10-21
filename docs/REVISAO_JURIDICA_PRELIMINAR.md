# Revisão jurídica preliminar das três minutas do Setlist

Data inicial: 01/10/2026; atualizações: 02/10/2026 e 21/10/2026. Escopo: `TERMOS_DE_USO_RASCUNHO.md`,
`POLITICA_DE_PRIVACIDADE_RASCUNHO.md` e
`PROCEDIMENTO_DE_REMOCAO_RASCUNHO.md`, confrontados com os fluxos atuais do
aplicativo. Este é um roteiro de revisão, não um parecer assinado por advogado.
O responsável informou, para a etapa atual, que a revisão por profissional
jurídico está concluída. Este arquivo não registra um parecer nem comprova
que a redação produzida depois dessa revisão foi aprovada. As três minutas
continuam sendo documentos internos de trabalho. As versões públicas aprovadas
são `docs/termos.html` e `docs/privacidade.html`, versão 1.0.0, vigentes desde
21/10/2026.

> **Estado atual — 21/10/2026:** use `openspec/changes/definir-mvp-setlist/tasks.md`
> e `docs/PUBLICACAO_DOCUMENTOS_LEGAIS.md` como fontes de status. Os documentos
> públicos foram publicados e conferidos; as configurações etárias das lojas,
> limpeza Auth, retenção Brevo e revisão do DPA foram concluídas. O grupo 11.8
> continua aberto enquanto o app não estiver em distribuição pública Android e
> iOS: o Play está em teste fechado e o App Store Connect solicitou informações
> adicionais sob a diretriz 2.1. As análises e pendências abaixo registram a
> revisão jurídica iniciada em 01/10/2026 e podem conter observações superadas.

## Estado desta rodada

As minutas foram alinhadas ao controle preventivo limitado, às denúncias por
e-mail e às medidas administrativas validadas em desenvolvimento e depois
conferidas em produção. Foram registradas as decisões do responsável sobre
acompanhamento do canal nos dias úteis, revisão trimestral de casos encerrados
no Gmail, retenção de 1 mês dos logs do Brevo sem novas prévias, backup diário
próprio com 84 cópias, descarte de convites encerrados após 30 dias e limpeza
dos registros temporários de denúncia após 24 horas e auditoria de login no
Postgres por 30 dias. A limpeza
de convites e a rotina de frequência de denúncias foram conferidas em produção;
a restauração isolada do backup foi validada em 20/10/2026. Em 21/10/2026, a
limpeza de auditoria Auth foi validada em produção e desenvolvimento, e o
responsável determinou considerar concluídas a retenção do Brevo e a revisão
do DPA para a integração transacional, registrada na 11.8.8. A configuração
etária das lojas foi conferida na 11.8.7 e os documentos públicos foram
publicados e verificados na 11.8.9. Permanece aberto o grupo 11.8 até a
distribuição pública Android/iOS e a conclusão da revisão da App Store.

As páginas HTML `docs/termos.html` e `docs/privacidade.html` foram publicadas
sem notas internas na versão 1.0.0, com vigência em 21/10/2026, e tiveram
acesso público conferido. O cliente apresenta links para os dois endereços
antes do login e no menu. Por decisão do responsável, o disclaimer
informa que prosseguir com o login significa concordar com os Termos de uso,
sem registrar aceite explícito dos termos gerais e sem tratar a Política de
privacidade como consentimento geral. O aceite separado do termo de
responsabilidade da banda permanece. A conferência do texto final, da vigência
e dos fatos operacionais, bem como a abertura das URLs sem autenticação, foi
registrada na 11.8.9.

O responsável informou que a revisão jurídica aprovou
**Setlist** como identificação pública do controlador pessoa física, sem nome
civil, CPF ou endereço no texto público. A configuração etária das lojas e o
acesso público aos textos foram conferidos; informações de retenção e suporte
de fornecedores que não constam da 11.8.5, 11.8.6 e 11.8.8 permanecem pontos de
monitoramento para futuras alterações. A revisão jurídica
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
  baixa relevância não altera os campos enviados. O responsável forneceu e
  revisou o DPA para o uso transacional e concluiu a conferência da 11.8.8 em
  21/10/2026. A política deve continuar identificando os dados enviados e a
  configuração de retenção registrada na 11.8.5.
- **Conferências operacionais separadas da revisão jurídica:** inventário de
  fornecedores e retenção, rotinas de limpeza e backup, configuração do Brevo,
  publicação das URLs, links antes do login, avisos legais, controles das lojas
  e validação em produção. As tarefas 11.8.2 a 11.8.9 do OpenSpec registram
  parte dessas entregas.
- **Publicação:** consolidar versões públicas coerentes com os fluxos reais e
  com as decisões informadas, sem notas internas ou afirmações não verificadas.
  Essa entrega e a operação permanecem na etapa 11.8.

## Achados prioritários

> Esta tabela registra achados da revisão inicial (01–02/10/2026). Os itens
> sobre publicação Web, retenção, backup, moderação e configuração etária foram
> atualizados depois; o estado vigente está resumido no início deste arquivo
> e detalhado nas tarefas 11.8.1–11.8.10. Use os textos públicos e o runbook
> como referência operacional.

| Prioridade                                                               | Documento                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Achado e providência                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Resolvida conforme informação do responsável                             | Termos e política                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | O responsável informou que a revisão jurídica aprovou **Setlist** como identificação pública da pessoa física controladora, sem divulgar nome civil, CPF ou endereço, e `contato@setlistbr.app.br` como canal separado. As minutas foram alinhadas a essa decisão. Este roteiro não contém o parecer profissional nem comprova aprovação das alterações posteriores; preservar a conclusão jurídica junto ao registro interno de publicação. [LGPD, art. 9º, III e IV](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm).                                                                                                                                                                        |
| Alta                                                                     | Termos, política e produto                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Achado histórico: o login afirmava concordância com termos e política sem links, e o item “Termos e privacidade” estava desabilitado. Os links agora estão disponíveis no login e no menu; os documentos públicos 1.0.0 foram publicados e conferidos em 21/10/2026 (11.8.9). Por decisão do responsável, não há registro separado de aceite dos termos gerais. A política informa o tratamento de dados; sua leitura não equivale a consentimento genérico. O aceite separado do termo de responsabilidade da banda permanece registrado. [LGPD, arts. 8º e 9º](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm).                                                                              |
| Monitoramento para futuras alterações                                    | Termos, política e produto                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | A versão pública 1.0.0 está publicada. O procedimento para futuras mudanças legais deve avaliar o conteúdo alterado, a necessidade de comunicação e eventual novo aceite antes de aplicar a mudança; não há evidência de um fluxo automatizado de avisos por e-mail ou dentro do app. Isso não é uma pendência de publicação da versão atual. Mudanças nas informações do tratamento exigem transparência específica; mudança incompatível de finalidade baseada em consentimento exige aviso prévio. [LGPD, arts. 8º, § 6º, e 9º, § 2º](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm).                                                                                                      |
| Monitoramento de privacidade                                             | A revisão jurídica informada pelo responsável aprovou as bases propostas para dados comuns. As tarefas operacionais de retenção e backup cobertas por 11.8.2–11.8.8 foram concluídas; a política pública 1.0.0 foi publicada e conferida em 11.8.9. Para futuras revisões, permanecem úteis o inventário de fornecedores e registros próprios, a avaliação documentada de legítimo interesse e a análise de dados de terceiros ou sensíveis que possam ser incluídos em campos livres. Esses pontos não são pendências de publicação da versão 1.0.0. [LGPD, arts. 6º, 7º, 9º e 11](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm). |
| Resolvida para a configuração atual; monitorar mudanças                  | Termos e política                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | O responsável informou que a revisão jurídica classificou o Setlist como serviço adulto sem acesso provável por menores. O controle de 18 anos nos termos e as configurações etárias de Google Play e App Store Connect foram conferidos em 21/10/2026 (11.8.7). O cadastro não verifica idade e a Web não aplica bloqueio etário; reavaliar se o público, a distribuição ou as funcionalidades mudarem. [Lei nº 15.211/2025](https://planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/l15211.htm); [orientações da ANPD](https://www.gov.br/anpd/pt-br/assuntos/eca-digital/).                                                                                                                                                  |
| Resolvida operacionalmente; revisar suficiência jurídica conforme o caso | Termos e procedimento                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | O responsável confirmou em 19/10/2026 a validação de ponta a ponta em produção da denúncia, encaminhamento, resposta e restrição/moderação (11.8.1). A ocultação e a suspensão são administrativas e caso a caso; denúncia não produz bloqueio automático nem garante sanção. Arquivar música não substitui a restrição efetiva, e a tabela não identifica necessariamente quem criou ou alterou cada música. [Marco Civil, arts. 19 a 21](https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l12965.htm); [ECA Digital, arts. 28 a 30](https://planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/l15211.htm).                                                                                                          |
| Revisão técnica concluída; decisão da loja pendente                      | App Store, termos e procedimento                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Filtro preventivo limitado, denúncia de música/integrante e moderação administrativa foram conferidos em produção conforme 11.8.1. A operação é posterior e caso a caso, sem inspeção por amostragem ou bloqueio automático. A diretriz 1.2 da Apple também é avaliada pela App Review: o envio atual recebeu pedido de informações sob a diretriz 2.1, e a distribuição pública iOS permanece pendente. A validação do produto não garante aprovação da loja. [Apple App Review Guidelines, 1.2](https://developer.apple.com/app-store/review/guidelines/br/).                                                                                                                                                                  |
| Mecanismos operacionais conferidos; distribuição ainda não concluída     | Google Play, termos e produto                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Denúncia interna de música e integrante, encaminhamento por e-mail e resposta/moderação foram confirmados em produção conforme 11.8.1. O Google Play permanece em teste fechado; a adequação final à política de conteúdo criado por usuários deve ser reavaliada durante a revisão e antes da distribuição pública. [Google Play, política de conteúdo criado por usuários](https://support.google.com/googleplay/android-developer/answer/9876937?hl=pt-BR).                                                                                                                                                                                                                                                                   |
| Média                                                                    | Termos e procedimento                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | A frase “conteúdo pertence à banda” confundia controle de acesso com titularidade autoral e foi corrigida. O responsável aprovou o fluxo operacional de denúncia: localização e motivo, prova proporcional quando aplicável, ocultação urgente em caso de risco, manifestação de quem enviou o conteúdo quando possível e contestação. Direitos sobre letras de terceiros e autorização técnica concedida ao Setlist ainda devem ser tratados conforme o caso e a redação final dos termos. [Lei nº 9.610/1998, arts. 22 e 29](https://www.planalto.gov.br/ccivil_03/leis/l9610.htm).                                                                                                                                            |
| Resolvida conforme informação do responsável                             | Política e procedimento                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | O responsável informou que a revisão jurídica confirmou o enquadramento como agente de pequeno porte e a dispensa de encarregado, mantendo o e-mail de contato para titulares. Embora a Resolução nº 2/2022 preveja prazos diferenciados, a política adota a regra geral de resposta simplificada imediata ou declaração completa em até 15 dias; o aviso de recebimento em 5 dias úteis não substitui essa resposta. [LGPD, art. 19](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm); [Resolução CD/ANPD nº 2/2022, arts. 11, 14 e 15](https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-2-de-27-de-janeiro-de-2022). |
| Média                                                                    | Procedimento                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | A comunicação de incidente com risco ou dano relevante deve alcançar ANPD e titulares; a possibilidade de complementar informações em até 20 dias úteis refere-se à comunicação à ANPD e não prorroga automaticamente o aviso aos titulares. O procedimento foi esclarecido. É preciso confirmar quem monitora e responde pelo canal e como a contagem do prazo será controlada. [Orientações de incidentes da ANPD](https://www.gov.br/anpd/pt-br/canais_atendimento/agente-de-tratamento/comunicado-de-incidente-de-seguranca-cis).                                                                                                                                                                                            |
| Média                                                                    | Procedimento                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Etiquetas comuns do Gmail organizam mensagens, mas não restringem leitura a quem tem acesso à caixa. Verificar acesso à conta, delegações e medidas de segurança, além das etiquetas. [Ajuda do Gmail sobre etiquetas](https://support.google.com/mail/answer/118708); [Ajuda do Gmail sobre delegação](https://support.google.com/mail/answer/138350).                                                                                                                                                                                                                                                                                                                                                                          |
| Média                                                                    | Política e procedimento                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | A incidência dos deveres de guarda de registros do Marco Civil da Internet depende da qualificação do operador e da atividade. O art. 15 impõe seis meses a provedores constituídos como pessoa jurídica que atuem profissionalmente e com fins econômicos; o Setlist é apresentado como gratuito e operado por pessoa física, mas essa conclusão precisa ser confrontada com a operação real e eventuais ordens específicas de preservação. Não aplicar automaticamente seis meses a todos os dados nem concluir que jamais haverá retenção obrigatória. [Lei nº 12.965/2014, arts. 15 e 16](https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l12965.htm).                                                          |

## Leitura por documento

### Termos de uso

O texto descreve corretamente o caráter gratuito, a colaboração por bandas,
o login Google/Apple e a distinção entre código aberto e dados privados. A
licença técnica para hospedar e exibir conteúdo foi delimitada, mas não sana
falta de autorização sobre letras de terceiros. As referências a arquivos
internos de rascunho foram retiradas. A versão 1.0.0 foi aprovada pelo
responsável, publicada em 21/10/2026 na URL canônica e conferida conforme
11.8.9. Para revisões futuras, preservar a versão anterior e avaliar aceite,
comunicação e direito do consumidor conforme a mudança concreta. Cláusulas de
foro ou limitação de responsabilidade só devem ser incluídas após análise de
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
do titular aparecem explicitamente, inclusive portabilidade, oposição e
revogação do consentimento quando aplicáveis. A versão 1.0.0 foi aprovada,
publicada em 21/10/2026 na URL canônica e conferida conforme 11.8.9. O texto
descreve comunicação direta com destaque para futuras mudanças; não há
evidência de um fluxo automatizado de avisos por e-mail ou no app, então a
necessidade de comunicação e eventual novo aceite deve ser analisada antes de
cada alteração material. Isso não bloqueia a versão já publicada. Continuam
úteis as revisões periódicas do inventário por tratamento, dado, finalidade,
base legal, destinatário, local, prazo e gatilho de exclusão, inclusive para
Gmail/Cloudflare e o player externo. O responsável informou que a revisão jurídica confirmou o
enquadramento como agente de pequeno porte e a dispensa de encarregado; o canal
de atendimento permanece obrigatório. [LGPD, art. 9º](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm);
[Resolução CD/ANPD nº 2/2022, art. 11](https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-2-de-27-de-janeiro-de-2022).

As regras de retenção de convites foram aplicadas e conferidas em produção em
19/10/2026 (11.8.2): convites usados, revogados ou vencidos são removidos após
30 dias, com exceções documentadas; os aceites do termo permanecem enquanto a
banda existir. Excluir uma conta desvincula suas referências diretas, mas não
remove imediatamente todos os registros de auditoria ou cópias de segurança.
A política pública descreve os prazos confirmados; prazos próprios de
fornecedores e da caixa de atendimento continuam sujeitos a revisão periódica.
[LGPD, arts. 6º, 15 e 16](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm).

**Decisão do responsável, implementada em produção:** apagar convites encerrados
30 dias após uso, revogação ou vencimento; conservar aceites do termo enquanto
a banda existir, para comprovar a versão aceita durante a participação, e
eliminá-los com a banda. A tabela de convites guarda o hash do token, rótulo,
datas e referências de criador/usuário; a tabela de aceites guarda banda,
versão e data do aceite. Após excluir uma conta, as referências diretas a ela
são anuladas, mas os demais campos ainda podem permitir associação indireta
em uma banda pequena. A limpeza diária preserva casos sob apuração por meio de
exceções com prazo e justificativa documentados. A necessidade e
proporcionalidade de cada prazo dependem de revisão jurídica; nenhuma das
regras escolhidas decorre automaticamente da LGPD.

O responsável também decidiu limpar diariamente os registros de
`report_rate_limits` quando a janela de envio tiver terminado há pelo menos
24 horas. Essa tabela guarda o identificador da conta, o último identificador
do caso e o horário do próximo envio permitido; a janela funcional é de
1 minuto. A limpeza diária foi aplicada e conferida em produção em 19/10/2026;
a consulta daquele dia confirmou 17 execuções bem-sucedidas sem falha desde a
primeira, e a tabela estava vazia. O e-mail do caso é um registro separado,
com revisão de necessidade e descarte próprios.

**Decisão do responsável sobre auditoria de login:** conservar a cópia em
`auth.audit_log_entries` por 30 dias para permitir apuração de acessos
suspeitos identificados após a janela de consulta externa do plano Free,
que é de 1 hora para Auth Audit Logs. Exceções administrativas terão motivo
sem dados pessoais e prazo futuro de revisão em tabela privada. A migração
`20261020120000` e o monitor diário foram aplicados e conferidos em
`setlist-prod` e `setlist-dev` em 21/10/2026 (11.8.6); o preflight de metadados
e cinco critérios agregados passaram nos dois ambientes. O prazo de 30 dias é
uma escolha operacional, não exigência legal. A exclusão da conta não remove
imediatamente esses registros; a limpeza diária os remove após o prazo, salvo
exceção documentada. Os logs externos do Supabase seguem separados e não
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

| Conjunto de dados                        | Informação confirmada em documentação ou código                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Conferência necessária para `setlist-prod`                                                                                                                                                                                                                                                     |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Banco ativo do Supabase                  | O fluxo de exclusão remove perfil e identidade de autenticação, mas preserva o conteúdo de bandas ativas e desvincula referências pessoais de convites e aceites. O responsável escolheu eliminar convites encerrados após 30 dias e manter aceites enquanto a banda existir; execução e exceções foram confirmadas em 19/10/2026.                                                                                                                                                                                                                                                                                                                                                                           | Acompanhar pedidos de exclusão e confirmar com a assessoria jurídica as exceções de conservação aplicáveis.                                                                                                                                                                                    |
| Logs de API e banco do Supabase          | A [tabela de planos](https://supabase.com/pricing) informa janela de acesso de 1 dia no Free. O responsável confirmou que `setlist-prod` está nesse plano; a janela de consulta não demonstra eliminação de todas as cópias.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Conferir logs gerados, acesso, destino de eventuais exportações e prazo efetivo de eliminação.                                                                                                                                                                                                 |
| Auditoria de autenticação do Supabase    | Os [Auth Audit Logs](https://supabase.com/docs/guides/auth/audit-logs) descrevem `auth.audit_log_entries` como armazenamento Postgres opcional; os registros podem conter identificador de usuário, IP e metadados. Em 21/10/2026, a migração `20261020120000` está aplicada em `setlist-prod` e `setlist-dev`; preflight e cinco verificações agregadas do monitor passaram em ambos. Não há FK nem trigger de exclusão de usuário que remova esses registros, e o backup próprio os exclui. A documentação pública não garante a estabilidade futura da tabela nem afirma explicitamente suporte a esta retenção personalizada; o changelog limita as proibições de DML destrutivo às tabelas de migração. | Operação validada na versão atual; manter o monitor e revisar se o Supabase alterar o schema ou os privilégios. O prazo externo do Free é independente e não indica eliminação definitiva no fornecedor. A cópia Postgres removida após 30 dias não pode ser recuperada dos backups do Drive.  |
| Backups e PITR do Supabase               | O responsável confirmou `setlist-prod` no plano Free, sem PITR. A documentação do Supabase informa que esse plano não oferece backup diário automático. A rotina própria transmite cópias diárias para uma conta dedicada do Google Drive, com criptografia no cliente e retenção das 84 cópias diárias mais recentes (12 semanas); a primeira execução foi confirmada em 20/10/2026.                                                                                                                                                                                                                                                                                                                        | A restauração isolada e a cobertura foram validadas em 20/10/2026, conforme evidência agregada registrada na tarefa 11.8.4. Para revisões futuras, manter a avaliação interna do tratamento e das condições do serviço de backup; essa anotação não é pendência de publicação da versão 1.0.0. |
| Visitas ao GitHub Pages                  | O [GitHub](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages) informa que registra o IP do visitante por segurança, sem prazo de eliminação nessa página.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Identificar a política aplicável ao serviço contratado e distinguir logs de visita dos artefatos e logs do Actions.                                                                                                                                                                            |
| Encaminhamento do e-mail pela Cloudflare | O [Email Routing](https://developers.cloudflare.com/email-service/observability/logs/) expõe registros de atividade e entrega. O intervalo disponível para filtrar a tela não estabelece o prazo de eliminação.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Conferir quais metadados são mantidos, quem acessa, por quanto tempo e como pedidos relativos a esses registros são tratados.                                                                                                                                                                  |
| Mensagens e anexos no Gmail              | O responsável é a única pessoa com acesso informado, acompanha a caixa nos dias úteis e revisará casos encerrados trimestralmente para descartar o que não precisar mais ser conservado.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Confirmar critérios e exceções de retenção com assessoria jurídica; conferir configuração real e cópias mantidas pelo fornecedor.                                                                                                                                                              |
| Denúncias enviadas pelo Brevo            | O responsável confirmou o fluxo de denúncia em produção e determinou considerar concluída, em 21/10/2026, a configuração de 1 mês para logs transacionais e a desativação de novas prévias. A cópia do DPA fornecida pelo responsável foi revisada nessa data para o uso transacional da API. A aplicação envia identificadores do caso, banda, alvo e denunciante e a descrição escrita pela pessoa.                                                                                                                                                                                                                                                                                                        | Revisão do DPA concluída pelo responsável em 21/10/2026. Manter o inventário fiel ao payload enviado pela função `report-content` e à configuração de retenção registrada na 11.8.5.                                                                                                           |

O [plano do Supabase pertence à organização](https://supabase.com/docs/guides/platform/billing-on-supabase),
enquanto PITR é um adicional por projeto. O responsável confirmou o plano Free
e a ausência de PITR em `setlist-prod`. Em 21/10/2026, a migração de retenção da
cópia Postgres da auditoria estava aplicada e validada em produção e
desenvolvimento. Essa verificação não cobre os registros Auth externos mantidos
pelo fornecedor; a janela de consulta publicada não deve ser apresentada como
prazo de eliminação definitiva.

#### Mapa técnico de fornecedores e fluxos de dados

| Fluxo observado                                     | Dados envolvidos e gatilho                                                                                                                                                                                                                                                                                                                      | Conferência interna para futuras revisões                                                                                                                           |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| App ↔ Supabase                                      | Identidade, sessão e dados das bandas circulam entre o app e o projeto; os projetos consultados usam a região primária `sa-east-1`.                                                                                                                                                                                                             | Conferir os serviços ativos na conta, os dados tratados em cada etapa e as configurações de acesso e retenção.                                                      |
| Login Google ou Apple ↔ Supabase                    | A pessoa inicia o fluxo no respectivo provedor; o Supabase recebe um token de identidade no fluxo nativo ou conclui o OAuth no navegador. Google usa login nativo em Android/iOS quando disponível; Apple usa login nativo no iOS. O fluxo nativo Apple solicita e-mail e nome completo; o OAuth de navegador não especifica escopos no código. | Conferir os escopos e atributos efetivamente recebidos pelos provedores e pelo Supabase e manter a descrição fiel ao fluxo configurado.                             |
| Navegador ↔ GitHub Pages                            | Acesso à versão Web; o GitHub registra o IP do visitante para segurança. O código consultado não envia conteúdo da banda ao GitHub Pages como função do app.                                                                                                                                                                                    | Confirmar logs do site, retenção e local do tratamento; classificar a coleta de IP feita pelo próprio GitHub. Logs de CI não são logs de visita.                    |
| Referência externa → YouTube                        | Ao acionar a referência em uma música, o app abre o YouTube no aplicativo ou navegador externo. O protótipo incorporado permanece no código, sem rota ou item de menu na primeira versão pública.                                                                                                                                               | Confirmar os dados do fluxo externo e o papel do Google/YouTube. O Setlist não envia letras da banda para sincronização. O YouTube pode exibir publicidade própria. |
| Remetente ↔ Cloudflare Email Routing → Gmail/Google | A mensagem e eventuais anexos seguem ao e-mail de contato e são encaminhados à caixa do responsável.                                                                                                                                                                                                                                            | Conferir configuração ativa, acesso à caixa e políticas de retenção.                                                                                                |

As descrições do [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages),
do [Email Routing da Cloudflare](https://developers.cloudflare.com/email-service/get-started/route-emails/)
e do [YouTube](https://developers.google.com/youtube/terms/developer-policies)
fundamentam as etapas técnicas mapeadas; não substituem a conferência das
configurações efetivas das contas Setlist.

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
as bandas previstas para o piloto. O app não verifica idade no cadastro. A
tela de login permite iniciar Google/Apple sem convite e a área autenticada
oferece criação de banda. As lojas foram configuradas e conferidas em
21/10/2026 (11.8.7): Google Play com público 18+ e restrição de contas que o
Google identifica como menores; App Store Connect com override +18 e as
classificações regionais registradas no OpenSpec. Essas medidas não restringem
a Web nem garantem que todas as pessoas sejam adultas. Assim, a ausência de menores conhecidos
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
responsabilidade por seus próprios atos. O filtro preventivo e os controles de
moderação foram aplicados e conferidos em produção conforme 11.8.1. A cobertura
do filtro é restrita e não
reavalia o acervo anterior. A tabela de músicas continua sem auditoria de
autoria por registro, portanto não permite sempre identificar quem publicou.
A regra contratual e o filtro limitado não afastam os deveres legais do operador
quando tomar conhecimento de conteúdo proibido. O termo vigente da banda em
`src/features/bands/legalTerm.ts` já inclui responsabilidade individual,
proibição de material indevido, filtro e canal de contestação na versão
`2026-10`; sua versão ativa foi conferida conforme a tarefa 11.8.1.

A revisão geral foi definida como **posterior** à publicação, diante de denúncia
ou indício concreto documentado, sem inspeção periódica por amostragem nem
aprovação prévia de cada edição. O app passou a oferecer denúncia
de música e integrante com envio ao canal de contato; a moderação administrativa
foi conferida em produção conforme 11.8.1. A ação é avaliada caso a caso: o
envio não bloqueia automaticamente a pessoa denunciada nem garante sanção. O
responsável consulta conteúdo privado somente na extensão necessária à apuração.
O App Store Connect ainda precisa concluir a revisão da submissão; validação
interna não representa aprovação da Apple. As exigências legais e das lojas
devem ser reavaliadas se a experiência, o público ou os requisitos mudarem.

Para a configuração atual, as lojas e a experiência de cadastro foram
conferidas. Monitorar se o público efetivo e o conteúdo inserido em campos livres continuam
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
Web, pelo Google Play no Android e pela App Store no iOS. A Web está publicada;
os apps ainda não estão em distribuição pública. O Google Play mantém o AAB em
teste fechado e o App Store Connect solicitou informações adicionais sob a
diretriz 2.1. Há gravação da build iOS em iPhone XR com iOS 18.7.10 e notas
preparadas para responder à Apple; a aprovação da submissão permanece pendente.
O Google Play separa a declaração de **público-alvo** do questionário de
**classificação de conteúdo**; o primeiro deve refletir a decisão de destinar
o Setlist a adultos, enquanto o segundo deve descrever com precisão as funções
e o conteúdo do app, inclusive material enviado por usuários. As respostas e
classificações atuais foram conferidas nas duas lojas conforme a tarefa 11.8.7;
reconfirmá-las se o conteúdo ou os recursos do app mudarem.
A definição de 18+ nas lojas não impede o cadastro pela Web nem comprova a
idade de quem utiliza o serviço.
[O Google Play permite selecionar 18+ como único público-alvo e ativar a
restrição de acesso a contas identificadas como menores](https://support.google.com/googleplay/android-developer/answer/9867159?hl=en),
mas a medida não interrompe o uso por quem já instalou o app. Na
[App Store, é possível elevar a classificação atribuída quando os termos
exigem idade mínima superior](https://developer.apple.com/help/app-store-connect/manage-app-information/set-an-app-age-rating/);
a classificação apoia controles parentais e não identifica individualmente
quem usa o serviço. Os mecanismos foram configurados e conferidos em
21/10/2026; não cobrem a Web.
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
permanecem em `songs`. Arquivar não equivale a moderar. A ocultação por
`moderated_songs` e a suspensão administrativa por `suspended_accounts` foram
conferidas em produção como parte da validação da 11.8.1. A suspensão impede
operações protegidas mesmo quando uma sessão já foi emitida. A decisão é manual
e caso a caso: não há bloqueio automático após denúncia nem botão de bloqueio
global entre usuários. A minuta operacional distingue triagem, medida urgente,
manifestação, decisão e contestação. A tabela `songs` não registra sempre quem
criou ou alterou cada música.

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

## Registro de fechamento da versão pública 1.0.0

### Publicação conferida em 21/10/2026

A identificação pública `Setlist — setlistbr.app.br` sem nome civil, CPF ou
endereço foi aprovada na revisão jurídica, conforme informou o responsável.
Este roteiro não contém o parecer nem valida alterações posteriores. O canal `contato@setlistbr.app.br`
também já foi escolhido. As páginas foram publicadas na versão 1.0.0, vigentes
desde 21/10/2026, em `https://setlistbr.app.br/termos/` e
`https://setlistbr.app.br/privacidade/`; ambas retornaram HTTP 200 sem
autenticação. A 11.8.9 registra aprovação do conteúdo e da vigência. Manter as
versões anteriores recuperáveis. O procedimento de remoção permanece interno;
os termos públicos contêm instruções para solicitações. Não publicar as
minutas deste repositório.

### Procedimento para futuras alterações legais

Os documentos 1.0.0 estão publicados e os links aparecem no login e no menu.
Não há evidência de um fluxo automatizado de avisos legais por e-mail ou no
app; para cada futura alteração material, avaliar a necessidade de aviso,
consentimento ou novo aceite antes de aplicar a mudança. Esse trabalho futuro
não bloqueia a publicação atual. Se houver envio por e-mail, conferir o
remetente, o alcance e as falhas de entrega, além de uma alternativa para
contas sem e-mail alcançável. Um aviso no app só pode ser prometido depois de
implementado e acessível às pessoas afetadas.

1. Classificar a alteração: texto editorial, direitos/obrigações contratuais,
   informações de tratamento dos incisos I, II, III ou V do art. 9º da LGPD,
   ou nova finalidade incompatível com consentimento existente. Revisão jurídica
   decide antecedência, destinatários e necessidade de novo aceite.
2. Preparar versão, data de vigência, resumo destacado das mudanças e cópia
   recuperável da versão anterior. Publicar somente texto aprovado nas URLs
   canônicas e registrar quando cada versão entrou em vigor.
3. Se a análise determinar envio por e-mail, conferir remetente autorizado,
   alcance dos e-mails cadastrados, falhas de entrega e alternativa para contas
   sem e-mail alcançável. Registrar versão, público alcançado, data e falhas sem
   criar listas paralelas desnecessárias.
4. Quando a mudança depender de novo aceite ou consentimento, obter e registrar
   a manifestação específica antes de aplicar a nova condição. Se não houver
   meio adequado de avisar ou colher a manifestação exigida, não tratar a mera
   publicação da página como comprovação de ciência ou de concordância.

[LGPD, arts. 8º, §§ 1º, 4º e 6º, e 9º, §§ 1º e 2º](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm).

> Os passos numerados abaixo são o checklist original de preparação. Para a
> versão pública 1.0.0, publicação, classificação etária, canal e moderação
> foram conferidos; veja as tarefas 11.8.1–11.8.9 e o estado atual no início
> deste arquivo. Reutilize apenas para futuras revisões, após confirmar o que
> continua aplicável.

1. Aplicar a identificação pública **Setlist** e o canal de contato separados,
   conforme a conclusão jurídica informada pelo responsável. Preservar também
   o registro da conclusão informada sobre pequeno porte e dispensa de
   encarregado, mantendo o canal para titulares.
2. Implantar as URLs públicas já aprovadas, atribuir versão e data de vigência
   aos termos e à política, disponibilizar ambos antes do login e no menu.
   O responsável decidiu não registrar aceite separado dos termos gerais; o
   aceite do termo de responsabilidade da banda continua registrado.
3. Inventariar os dados e fluxos efetivos de Google, Apple, Supabase, GitHub
   Pages, YouTube, Cloudflare e Gmail; confirmar bases legais, configurações,
   retenção e backups.
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
