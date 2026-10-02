# Procedimento de remoção e solicitações — rascunho

> **RASCUNHO OPERACIONAL INTERNO. Não publicar este documento como termo do
> serviço.** Confirmar acesso ao canal de contato, responsáveis, prazos e
> revisão jurídica antes de ativá-lo.

- Versão de trabalho: 0.1
- Data de preparação: 29/09/2026
- Responsável por receber solicitações: controlador do Setlist, pelo canal
  geral **contato@setlistbr.app.br**; a intenção é não nomear encarregado formal
  se a dispensa legal for aplicável.
- Canal: e-mail geral, também destinado a solicitações de privacidade e remoção
  de conteúdo — **contato@setlistbr.app.br**
- O responsável informa que a caixa será devidamente monitorada.
- Confirmação de recebimento: em até **5 dias úteis**. Esse prazo é para acusar
  o recebimento e não substitui o prazo legal ou o tempo necessário para analisar
  e responder ao mérito do pedido.

## 1. Exclusão da conta

1. Na aplicação, abrir **Perfil e conta → Excluir minha conta**.
2. Ler o aviso e digitar `EXCLUIR` para habilitar a confirmação.
3. Se a pessoa for o último Proprietário de uma banda com outros integrantes,
   promover outro integrante antes de excluir a conta.
4. Se for o único integrante e Proprietário de uma banda, excluir primeiro a
   banda pela área de administração da banda e então repetir o pedido de
   exclusão da conta.
5. Após a conclusão, o perfil e a identidade de autenticação são removidos, a
   sessão local é encerrada e a seleção da última banda é limpa.

O backend desvincula do perfil excluído os registros de aceite e as referências
de criação/uso de convites. O conteúdo de bandas ainda ativas permanece para os
demais integrantes e pode continuar associado à banda. A remoção de dados em
logs, backups e sistemas dos fornecedores segue prazos ainda não confirmados:
**[COMPLETAR COM O INVENTÁRIO DE RETENÇÃO]**.
Na apuração de cada pedido, considerar separadamente os registros de auditoria
de autenticação do Supabase: há armazenamento externo de logs e pode haver
cópia opcional na tabela `auth.audit_log_entries`. A exclusão da identidade de
autenticação não comprova a eliminação desses registros; conferir a configuração
e o tratamento aplicável antes de responder sobre eliminação completa.

## 2. Remoção de conteúdo de banda

O conteúdo é compartilhado na banda; os direitos autorais permanecem com seus
respectivos titulares. Os papéis na banda controlam o acesso técnico e não
transferem direitos sobre obras. A pessoa que insere ou edita conteúdo responde
por seus próprios atos, conforme a lei; o operador mantém os deveres legais de
tratar denúncias. Um Proprietário ou Editor pode editar conteúdo
conforme as permissões disponíveis. A exclusão de uma banda elimina seu
conteúdo, mas só está habilitada quando o solicitante é Proprietário e o único
integrante. Denúncias de conteúdo proibido e pedidos de remoção por direito
autoral, privacidade ou erro devem ser enviados por e-mail a
**contato@setlistbr.app.br** com:

- nome da banda e localização/identificador do conteúdo;
- descrição objetiva do problema e a providência solicitada;
- nome e meio de contato da pessoa solicitante;
- quando aplicável, o direito invocado e a relação da pessoa com esse direito;
- declaração de que as informações são corretas e autorização para contato
  sobre a solicitação.

Para um pedido sobre a própria conta, conferir primeiro se ele vem do e-mail
associado à conta. Se isso não for possível, pedir somente informação adicional
necessária para confirmar a identidade e o direito invocado. Para pedidos sobre
conteúdo de banda, verificar de forma proporcional a relação da pessoa com o
conteúdo ou a autoridade para agir em nome do titular do direito. Não solicitar
documento oficial de identidade por padrão. Se um caso excepcional justificar
essa necessidade, explicar o motivo e nunca pedir que a pessoa envie o documento
à caixa geral de e-mail. Só recebê-lo por um canal seguro previamente habilitado;
se esse canal não estiver disponível, buscar uma forma alternativa e
proporcional de confirmação. Restringir o acesso à cópia e apagá-la assim que a
verificação terminar, salvo obrigação legal de retenção. Manter no histórico do
caso apenas a justificativa para a coleta, a data e o resultado da verificação,
sem copiar dados do documento.

**Limite técnico e primeiro corte:** arquivar música vinculada a show não a
torna inacessível. A implementação desta change cria registro administrativo
separado para ocultação, aplicado nas consultas de músicas e itens de show, e
filtro simples que recusa gravações sinalizadas. O filtro não identifica todas
as infrações. A tabela de músicas ainda não guarda quem criou ou alterou cada
registro; não se deve presumir a autoria do Proprietário ou Editor. A medida
administrativa e o fluxo abaixo precisam ser validados no ambiente de destino
antes de sua ativação operacional.

## 3. Revisão posterior por denúncia ou inspeção

O primeiro corte aplica filtro preventivo simples às gravações de músicas e
mantém revisão **posterior** por denúncia ou inspeção. Não há fila de aprovação
prévia de cada envio. Integrantes denunciam música ou usuário pelo formulário
do app; o serviço encaminha identificadores e a descrição à caixa
**contato@setlistbr.app.br** sem anexar automaticamente a letra. Pessoas externas
e quem contesta uma recusa do filtro podem escrever diretamente ao endereço.
O responsável ainda precisa definir critérios, frequência, pessoa autorizada e
registro mínimo das inspeções.

1. Registrar e acompanhar denúncias recebidas por e-mail na caixa Gmail do
   canal, usando uma etiqueta dedicada a privacidade/remoção para organização.
   Restringir o acesso à conta e às mensagens ao responsável; etiquetas comuns
   do Gmail não limitam quem
   pode ler a caixa. Usar o histórico da própria mensagem como registro,
   anotando apenas data, tipo, situação e encerramento; não duplicar mensagens,
   anexos ou documentos em planilha paralela. Para inspeção iniciada internamente,
   documentar o mesmo mínimo em meio de acesso restrito a definir, sem copiar
   o material sensível para o e-mail. Confirmar à pessoa denunciante o recebimento
   em até **5 dias úteis**, sem adiar a resposta simplificada de confirmação ou
   acesso aos dados quando a LGPD exigir atendimento imediato. Para declaração
   completa, observar o prazo legal de até 15 dias do requerimento. Aplicar
   prazo diferenciado somente após confirmar o enquadramento como agente de
   pequeno porte.
2. Avaliar se há informação suficiente para localizar o registro e classificar
   o pedido: dado pessoal ou conta, direito autoral, conteúdo pornográfico
   proibido pelos termos, exposição de intimidade, possível exploração ou abuso
   sexual de criança ou adolescente, outra possível ilicitude ou erro comum.
   Para pedidos sobre conta, conferir o e-mail associado e pedir confirmação
   adicional mínima somente se necessário; para denúncias de conteúdo,
   verificar proporcionalmente a relação da pessoa com o conteúdo ou sua
   autoridade para agir. Não exigir documento oficial por padrão. Pedidos com
   risco atual de dano grave devem receber avaliação imediata, sem aguardar a
   meta geral de confirmação em cinco dias úteis. Indício de exploração ou abuso
   sexual de criança ou adolescente exige avaliação e encaminhamento urgentes,
   incluindo a comunicação às autoridades competentes quando exigida pelo art.
   27 do ECA Digital, conforme a regulamentação aplicável. Evitar circulação
   desnecessária do material durante a apuração.
3. Registrar quem decidiu a prioridade, qual conteúdo foi localizado, o risco
   considerado e a medida tecnicamente disponível. Se uma restrição imediata
   for necessária, aplicar o registro administrativo de ocultação e conferir
   suas políticas de leitura; **não usar o arquivamento da música como
   bloqueio**. Se não houver meio validado, escalar ao responsável técnico e à
   assessoria jurídica para definir uma ação proporcional e documentar a
   limitação; não responder à pessoa que o conteúdo foi removido sem verificar.
4. Antes da decisão definitiva, quando cabível, informar a pessoa que enviou o
   conteúdo **se for identificável**; caso contrário, contatar o Proprietário
   ou Editor responsável pela banda para obter esclarecimentos, sem atribuir-lhe
   autoria ou responsabilidade individual. Informar apenas o material e o
   fundamento necessários para a manifestação. Não revelar dados desnecessários
   da pessoa denunciante ou informações que aumentem o risco para a vítima. Uma
   medida urgente pode preceder essa manifestação, seguida de revisão.
5. Decidir e documentar a providência proporcional: corrigir informação,
   retirar o trecho ou registro, manter o conteúdo por insuficiência de
   fundamento, ou encaminhar a questão à autoridade competente quando exigido.
   Conferir o efeito no banco ativo, nas consultas e nas referências de shows;
   comunicar o resultado e o caminho de contestação às pessoas envolvidas,
   respeitando sigilo e direitos de terceiros. Uma contestação deve ser
   examinada por pessoa que considere os novos elementos e registre se mantém
   ou revê a decisão; não restaurar conteúdo em risco antes dessa análise.
6. Concluir a análise e responder conforme o prazo legal aplicável ou, quando
   não houver prazo específico para aquela denúncia, após análise diligente,
   informando o andamento quando necessário. Guardar somente os registros
   necessários enquanto forem úteis para tratar e documentar o caso, cumprir
   obrigação legal ou regulatória, ou exercer direitos. Encerrada essa
   necessidade, excluir ou anonimizar os registros, salvo hipótese legal que
   justifique retenção adicional. Não manter mensagens indefinidamente. O prazo
   e as exceções aplicáveis devem ser confirmados no inventário de retenção e
   com assessoria jurídica antes da publicação.

O responsável deve aprovar os critérios de prova, contranotificação, bloqueio,
recurso, comunicações a titulares e eventual comunicação à ANPD com assessoria
jurídica antes de lançar o serviço. A classificação jurídica de cada denúncia
deve considerar a legislação específica e os [Temas 533 e 987 do STF](https://noticias.stf.jus.br/postsnoticias/nota-a-imprensa-43/);
não presumir que toda reclamação exige ordem judicial ou que toda notificação
extrajudicial obriga retirada automática. Se o Setlist for classificado como
serviço direcionado a menores ou de acesso provável por eles, aplicar também
os requisitos de notificação, retirada e recurso dos arts. 28 a 30 do ECA
Digital, com prazos procedimentais definidos antes da ativação.

### Rotina mínima da caixa e contestação do filtro

1. Na caixa restrita de `contato@setlistbr.app.br`, identificar o assunto
   `[Setlist] Denúncia <UUID>` e etiquetar o caso. O UUID do assunto liga a
   resposta à denúncia. Para e-mail direto ou contestação de filtro, criar um
   identificador interno e manter a conversa na mesma sequência de mensagens.
2. Registrar no histórico da mensagem a data de recebimento, tipo de alvo,
   banda, responsável pela análise, estado e prazo de retorno. Conferir os
   identificadores no ambiente administrativo antes de consultar conteúdo.
3. Em contestação de recusa automática, pedir apenas o campo e o contexto
   necessários; verificar se a regra atingiu material permitido. Uma exceção
   nunca deve ser feita por um editor da banda no banco: corrigir a regra por
   migration revisada ou orientar uma redação permitida, mantendo o registro da
   decisão e a possibilidade de nova tentativa.
4. Responder pelo mesmo e-mail com recebimento, decisão ou prazo de análise.
   Registrar a medida aplicada e o resultado da conferência; encerrar a etiqueta
   somente após comunicar o resultado. Evitar copiar letras para o e-mail.

#### Exemplo de atendimento — simulação, não é um caso real

- **Identificação:** denúncia recebida pelo formulário sobre uma música; usar o
  UUID do assunto, tipo de alvo e IDs da banda e da música. A mensagem contém a
  descrição do integrante, sem anexar a letra.
- **Triagem:** a descrição informa que um aviso de segurança da banda foi
  recusado pelo filtro. Classificar como contestação de falso positivo, sem
  urgência ou indício de dano imediato. Não pedir a letra completa.
- **Conferência:** localizar a tentativa pelo relato do integrante e conferir
  no editor se a criação não apareceu ou se a edição anterior continua salva.
  O gatilho aborta a gravação recusada, portanto a versão anterior permanece.
- **Decisão registrada:** regra acionada por uma formulação do aviso; não há
  conteúdo publicado para ocultar. Manter a regra, orientar uma redação neutra
  e permitir nova tentativa. Registrar responsável, data, decisão e estado
  `respondido`; manter a mensagem na mesma conversa do caso.
- **Resposta registrada:** “Analisamos a contestação. A gravação foi recusada
  antes de ser salva e a versão anterior permaneceu intacta. O texto informado
  é um aviso da banda, mas a formulação acionou o filtro. Reescreva o aviso em
  termos neutros e tente salvar novamente. Se a recusa persistir, responda a
  esta mensagem com o campo afetado; não envie a letra completa.”
- **Encerramento:** após enviar essa resposta, marcar o caso como encerrado. Se
  houver nova tentativa recusada ou novos elementos, reabrir a conversa e
  registrar a nova decisão.

### Ocultação administrativa de música

Executar no SQL Editor do projeto correto, com acesso administrativo, depois
de conferir o UUID da música e registrar motivo, responsável e caso no histórico
restrito. Não conceder acesso de escrita às tabelas administrativas aos papéis
`anon` ou `authenticated`.

```sql
insert into public.moderated_songs (song_id, reason, recorded_by)
values ('<song-uuid>', '<motivo e identificador do caso>', '<responsável>')
on conflict (song_id) do nothing;
```

Conferir como integrante e editor que a música não aparece no repertório, no
detalhe nem na setlist do show. Revogar o acesso do cliente às cópias locais
requer reconexão ou abertura do app; a pessoa que recebeu a letra antes da
ocultação pode ter conservado uma cópia fora do Setlist. Para reverter após
decisão documentada:

```sql
delete from public.moderated_songs where song_id = '<song-uuid>';
```

### Suspensão administrativa de conta

Conferir a identidade pelo UUID de `auth.users`; registrar o caso e executar
primeiro a restrição de banco, que também atinge sessões com JWT ainda válido:

```sql
insert into public.suspended_accounts (user_id, reason, recorded_by)
values ('<user-uuid>', '<motivo e identificador do caso>', '<responsável>')
on conflict (user_id) do nothing;
```

Em seguida, aplicar o banimento da pessoa em **Supabase Auth → Users** no projeto
correto. Na validação realizada, a conta ainda conseguiu autenticar, mas ficou
sem acesso às operações protegidas do app; portanto, não use a tela de login
como confirmação do bloqueio. A restrição em `suspended_accounts`, aplicada
pelas políticas RLS e pela verificação anterior às requisições do Data API, é o
controle que impede consultas e alterações, inclusive com sessão já emitida.
Confirme esse bloqueio tentando ler e alterar dados. Para reverter, desbanir no
Auth e excluir a restrição de banco após decisão documentada; confirme que as
operações voltam a funcionar. Se qualquer etapa falhar, manter o caso aberto e
registrar o estado parcial. Os comandos de banco exigem acesso administrativo
ao projeto.

## 4. Incidentes de segurança

O controlador é responsável por receber e tratar suspeitas de acesso indevido,
exposição ou perda de dados. Usar a caixa **contato@setlistbr.app.br**, com uma
etiqueta separada para organizar incidentes e acesso à caixa restrito ao
responsável. Registrar somente as informações necessárias, preservar evidências
com acesso limitado, avaliar riscos às pessoas afetadas, mitigar o incidente e
documentar as decisões.
Confirmado incidente que envolva dados pessoais e possa acarretar risco ou dano
relevante aos titulares, o controlador deve comunicar a ANPD e as pessoas
afetadas em até **3 dias úteis**, ressalvado prazo diferente previsto em lei
específica e eventual prazo diferenciado se confirmado o enquadramento como
agente de pequeno porte. A comunicação aos titulares não é substituída pela
comunicação à ANPD e deve ocorrer diretamente, sempre que possível. Se ainda
faltarem informações, a comunicação à ANPD pode ser feita em etapas, com
justificativa, e complementada em até **20 dias úteis** após a comunicação
preliminar, conforme a regulamentação. Isso não autoriza adiar a comunicação
aos titulares por 20 dias. Registrar quando o controlador tomou conhecimento,
a avaliação de risco, as decisões, as medidas de mitigação e as comunicações
realizadas. O responsável deve confirmar com assessoria jurídica o
procedimento aplicável e os critérios do incidente antes de ativar este
rascunho como plano operacional.

## 5. Pendências para ativar este procedimento

- Identificar o controlador e a pessoa responsável por solicitações.
- Disponibilizar **contato@setlistbr.app.br** na Web e nos aplicativos para
  solicitações de privacidade, remoção e comunicação de incidentes; manter a
  caixa monitorada e restringir o acesso conforme a natureza do caso.
- O responsável já dispõe de acesso à caixa postal. Antes da ativação, criar e
  conferir as etiquetas separadas para privacidade/remoção e incidentes e
  verificar quem tem acesso à conta e às mensagens; a etiqueta não restringe
  acesso.
- Confirmar se o controlador se enquadra na dispensa de nomeação de encarregado
  para agente de tratamento de pequeno porte, inclusive quanto aos critérios de
  exclusão previstos na regulamentação.
- Confirmar que o procedimento de resposta a incidente permite avaliar e
  cumprir o prazo de 3 dias úteis quando a comunicação à ANPD e às pessoas
  afetadas for exigida; registrar eventual justificativa e complementação em
  etapas conforme o regulamento.
- Definir com assessoria jurídica o mecanismo de aferição de idade aplicável,
  considerando o público efetivo, os riscos e o ECA Digital, e implementá-lo
  antes da distribuição pública; registrar internamente a resposta geral para
  uso que não atenda ao critério de 18 anos.
- Confirmar no inventário de retenção e com assessoria jurídica os prazos e
  exceções aplicáveis aos registros dos pedidos; excluir ou anonimizar os
  registros após o encerramento das finalidades que justificam sua guarda.
- Disponibilizar e documentar um canal seguro antes de solicitar documento de
  identidade em qualquer caso excepcional; se não houver canal, usar método
  alternativo proporcional. Apagar a cópia após a verificação, salvo obrigação
  legal de retenção.
- Confirmar como tratar cópias de backup e registros operacionais com os
  fornecedores. No Supabase, verificar o plano da organização, backups/PITR do
  projeto e a opção de gravar auditoria de autenticação em
  `auth.audit_log_entries`; apurar se e quando os registros identificáveis são
  eliminados após a exclusão da conta. Para pedidos recebidos por e-mail,
  distinguir mensagens e anexos no Gmail dos registros de encaminhamento do
  Cloudflare Email Routing; definir o descarte de ambos.
- Aprovar critérios de denúncias de direitos autorais, conteúdo de terceiros e
  solicitações de remoção de dados; definir prazos internos de manifestação e
  recurso conforme o enquadramento jurídico aplicável.
- Definir o processo paralelo de inspeção posterior: critérios, frequência,
  pessoa autorizada, base legal, acesso ao conteúdo, registro mínimo e descarte.
  Validar em Web, Android e iOS o formulário interno de denúncia e o recebimento
  do e-mail transacional na caixa. Configurar chave API do Brevo e remetente
  verificado como segredos da Edge Function, sem colocá-los no aplicativo.
- Confirmar o novo aceite do termo da banda após a atualização material e a
  sincronização entre a versão do aplicativo e a versão vigente no banco.
- Executar em ambiente controlado a ocultação de música associada a show e a
  suspensão com sessão anterior; conferir que integrantes não revertem a medida.
- Revisar política, termos e procedimento com profissional jurídico.

### Referência para resposta a incidentes

- Resolução CD/ANPD nº 15/2024 e orientações da ANPD:
  <https://www.gov.br/anpd/pt-br/canais_atendimento/agente-de-tratamento/comunicado-de-incidente-de-seguranca-cis>
