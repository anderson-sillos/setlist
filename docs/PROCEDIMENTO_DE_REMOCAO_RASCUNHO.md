# Procedimento de remoção e solicitações — rascunho

> **RASCUNHO OPERACIONAL INTERNO. Não publicar este documento como termo do
> serviço.** A revisão por profissional jurídico foi informada como concluída;
> confirmar acesso ao canal, prazos e configurações antes de ativá-lo.

- Versão de trabalho: 0.1
- Data de preparação: 29/09/2026; revisão de moderação: 02/10/2026
- Responsável por receber solicitações: controlador do Setlist, pelo canal
  geral **contato@setlistbr.app.br**. Segundo a conclusão jurídica informada,
  o controlador está dispensado de nomear encarregado formal como agente de
  tratamento de pequeno porte.
- **Setlist** é o nome definitivo de apresentação do serviço e, segundo o
  responsável, a identificação pública da pessoa física controladora aprovada
  na revisão jurídica.
- Canal: e-mail geral, também destinado a solicitações de privacidade e remoção
  de conteúdo — **contato@setlistbr.app.br**
- O responsável acompanhará a caixa em todos os dias úteis e informou ser a
  única pessoa com acesso à caixa Gmail de destino.
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
demais integrantes e pode continuar associado à banda. O backup próprio
planejado para produção manterá até 12 cópias semanais criptografadas, após
implantação e validação da rotina. A remoção de dados em logs e sistemas dos
fornecedores segue prazos próprios. O inventário preliminar está na revisão
jurídica; ainda precisam ser confirmados os prazos efetivos de eliminação de
registros de Supabase, GitHub Pages, Cloudflare, Gmail e provedores de login.
No Brevo, foram escolhidos 1 mês para logs transacionais e nenhuma nova
prévia, mas a configuração ainda precisa ser aplicada e conferida.
Na apuração de cada pedido, considerar separadamente os registros de auditoria
de autenticação do Supabase: há armazenamento externo de logs e o responsável
confirmou que a gravação adicional em `auth.audit_log_entries` está **ligada**
em `setlist-prod`. A exclusão da identidade de autenticação não comprova a
eliminação desses registros. O responsável escolheu conservá-los por 30 dias
e limpar diariamente os mais antigos, mas essa rotina ainda não foi
implementada. Antes de responder sobre eliminação completa, conferir a tabela,
as exceções de conservação e as cópias de backup.

### Retenção de convites e aceites — limpeza pendente

O responsável decidiu descartar convites 30 dias após o primeiro evento que
encerrar sua utilidade: uso, revogação ou vencimento. Aceites do termo da banda
serão conservados enquanto a banda existir para documentar a versão aceita;
a exclusão da banda já os remove do banco ativo. Ao excluir uma conta, as
referências diretas dessa pessoa em convites e aceites são anuladas, mas os
demais campos podem continuar associados indiretamente a ela.

A limpeza automática foi implantada em `setlist-prod` em 02/10/2026, com job
diário ativo e tabela de exceções para casos em apuração. Ainda falta conferir
a primeira execução e documentar eventuais suspensões de descarte. Até essa
conferência, não afirmar em respostas a titulares que o prazo de 30 dias já foi
observado na prática. Cópias em backups seguem ciclo próprio de substituição.

## 2. Remoção de conteúdo de banda

O conteúdo é compartilhado na banda; os direitos autorais permanecem com seus
respectivos titulares. Os papéis na banda controlam o acesso técnico e não
transferem direitos sobre obras. A pessoa que insere ou edita conteúdo responde
por seus próprios atos, conforme a lei; o operador mantém os deveres legais de
tratar denúncias. Um Proprietário ou Editor pode editar conteúdo
conforme as permissões disponíveis. A exclusão de uma banda elimina seu
conteúdo, mas só está habilitada quando o solicitante é Proprietário e o único
integrante. Integrantes podem denunciar música ou outro integrante da própria
banda pelo formulário do app. Pessoas externas, contestações do filtro e
pedidos de remoção por direito autoral, privacidade ou erro devem ser enviados
por e-mail a **contato@setlistbr.app.br** com:

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
torna inacessível. O primeiro corte implementado usa um registro administrativo
separado para ocultação, aplicado às consultas de músicas e itens de show, e um
filtro preventivo simples no banco para recusar gravações sinalizadas. As regras
iniciais identificam apenas alguns padrões explícitos; não reavaliam
automaticamente o acervo anterior nem identificam todas as infrações. O texto
recusado não entra em fila de análise e uma edição recusada preserva o registro
anterior. A tabela de músicas ainda não guarda quem criou ou alterou cada
registro; não se deve presumir a autoria do Proprietário ou Editor. A ocultação
e a reversão foram validadas no ambiente de desenvolvimento; antes de usar este
procedimento em produção, conferir a implantação coordenada das migrations, da
função de denúncia e do cliente no projeto correto.

## 3. Revisão posterior por denúncia ou inspeção

O primeiro corte aplica filtro preventivo simples às gravações de músicas e
mantém revisão **posterior** quando houver denúncia ou indício concreto
documentado. Não há inspeção periódica por amostragem nem fila de aprovação
prévia de cada envio. Integrantes denunciam música ou outro integrante da banda
pelo formulário do app; a função verifica o vínculo de ambos com a banda,
limita a frequência de envios e usa a API do Brevo para encaminhar o tipo de
alvo, identificadores da banda, do alvo, do denunciante e do caso, e a descrição
à caixa **contato@setlistbr.app.br**, sem anexar automaticamente a letra. O banco
guarda a linha de frequência por denunciante e o identificador do último caso;
essa linha não é apagada automaticamente após o intervalo de bloqueio. A
descrição é tratada no e-mail. A confirmação no app significa que o provedor aceitou o
envio, não que a mensagem chegou ou foi lida. Se o aceite não for confirmado,
o app informa a falha e permite nova tentativa; conferir eventual duplicidade
pelo identificador do caso. Pessoas externas e quem contesta uma recusa do
filtro podem escrever diretamente ao endereço. O responsável pelo Setlist é a
pessoa autorizada a consultar o conteúdo privado apenas na extensão necessária
para apurar a denúncia ou o indício concreto. A origem do indício, a data, o
conteúdo consultado, a medida e o resultado seguem o registro mínimo do caso
descrito abaixo; não copiar a letra ou dados sensíveis para uma planilha.

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
   prazo diferenciado somente quando previsto para agente de pequeno porte.
2. Avaliar se há informação suficiente para localizar o registro e classificar
   o pedido: dado pessoal ou conta, direito autoral, conteúdo pornográfico
   proibido pelos termos, exposição de intimidade, possível exploração ou abuso
   sexual de criança ou adolescente, outra possível ilicitude ou erro comum.
   Para pedidos sobre conta, conferir o e-mail associado e pedir confirmação
   adicional mínima somente se necessário; para denúncias de conteúdo,
   verificar proporcionalmente a relação da pessoa com o conteúdo ou sua
   autoridade para agir. Não exigir documento oficial por padrão. Pedidos com
   risco atual de dano grave devem receber avaliação prioritária assim que o
   responsável tomar conhecimento, sem aguardar a
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
   justifique retenção adicional. Revisar os casos encerrados na caixa Gmail a
   cada três meses e apagar mensagens e anexos que não precisem mais ser
   mantidos; registrar na própria conversa a justificativa de retenções
   excepcionais, quando couber. Não manter mensagens indefinidamente. O prazo
   e as exceções aplicáveis devem ser confirmados no inventário de retenção
   antes da publicação.

O responsável aprovou o fluxo operacional acima: identificação do conteúdo e
motivo, verificação proporcional do direito quando aplicável, ocultação urgente
diante de risco, manifestação de quem enviou o conteúdo quando possível e
contestação da decisão. A classificação jurídica de cada denúncia
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

### Descarte do controle de frequência — primeira execução pendente

`report_rate_limits` serve para impedir envios repetidos durante a janela de
1 minuto. O responsável decidiu limpar diariamente as linhas cujo
`next_allowed_at` terminou há pelo menos 24 horas. A rotina foi implantada em
`setlist-prod` em 02/10/2026, com job diário ativo; a primeira execução ainda
precisa ser conferida. A linha também é substituída no próximo envio, removida
quando o envio falha ou eliminada com a conta. Conferir que o job não interfere
em um envio em andamento e que registra falhas sem
copiar identificadores de casos para logs. A caixa de e-mail continua sendo
o histórico operacional da denúncia e segue critérios próprios de descarte.

### Backup próprio de `setlist-prod` — implantação pendente

O responsável decidiu manter o projeto no plano Supabase Free, sem PITR, e
produzir uma cópia do banco **uma vez por semana** em **disco externo
criptografado**, conservando as **12 cópias semanais** mais recentes. A rotina
ainda não foi implementada nem validada por restauração.

1. Usar o procedimento oficial de exportação lógica do Supabase para obter os
   dados necessários à recuperação, incluindo dados do aplicativo e identidades
   de autenticação. Conferir também histórico de migrations, funções e ajustes
   do projeto que o dump não preserve; manter segredos fora do repositório e do
   arquivo de instruções. Se o aplicativo passar a usar objetos do Supabase
   Storage, incluí-los em procedimento separado, pois o dump do banco não
   contém os arquivos.
2. Gravar a exportação somente no disco criptografado, com acesso restrito ao
   responsável. Conferir conclusão, integridade e legibilidade da cópia antes
   de substituir a mais antiga. Registrar data, resultado e falhas sem copiar
   conteúdo privado para logs ou para o repositório.
3. Conservar apenas as 12 cópias semanais mais recentes; remover com segurança
   as anteriores após confirmar uma nova cópia íntegra. Ao atender pedidos de
   exclusão, informar que dados removidos do banco ativo podem persistir nessas
   cópias até sua substituição, observadas exceções legais aplicáveis.
4. Antes do lançamento, restaurar uma cópia em ambiente isolado e conferir
   contas, bandas, músicas, shows e controles de acesso. Definir a recorrência
   dos ensaios de restauração e a forma de guardar o disco quando desconectado.

Referência técnica: [Backup e restauração com Supabase CLI](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore).

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
específica e eventual prazo diferenciado aplicável a agente de pequeno porte.
A comunicação aos titulares não é substituída pela
comunicação à ANPD e deve ocorrer diretamente, sempre que possível. Se ainda
faltarem informações, a comunicação à ANPD pode ser feita em etapas, com
justificativa, e complementada em até **20 dias úteis** após a comunicação
preliminar, conforme a regulamentação. Isso não autoriza adiar a comunicação
aos titulares por 20 dias. Registrar quando o controlador tomou conhecimento,
a avaliação de risco, as decisões, as medidas de mitigação e as comunicações
realizadas. O responsável deve conferir os contatos, a contagem dos prazos e
o registro das decisões em um ensaio antes de ativar este rascunho como plano
operacional.

## 5. Pendências para ativar este procedimento

- Usar **Setlist** como identificação pública do controlador, conforme a
  conclusão jurídica informada pelo responsável. O próprio responsável atenderá as solicitações
  recebidas no canal de contato.
- Publicar as páginas aprovadas em `https://setlistbr.app.br/termos/` e
  `https://setlistbr.app.br/privacidade/` e tornar seus links acessíveis antes
  do login e no menu do aplicativo. Hoje a tela de login só menciona os
  documentos, e o item "Termos e privacidade" no menu está desabilitado.
- Disponibilizar **contato@setlistbr.app.br** na Web e nos aplicativos para
  solicitações de privacidade, remoção e comunicação de incidentes; manter a
  caixa monitorada e restringir o acesso conforme a natureza do caso.
- O responsável já dispõe de acesso à caixa postal, informou ser a única
  pessoa com acesso à caixa Gmail de destino e confirmou que existem etiquetas
  separadas para privacidade/remoção e incidentes. Revisar periodicamente quem
  tem acesso à conta e às mensagens, pois a etiqueta não restringe acesso. A
  caixa será acompanhada pelo responsável em todos os dias úteis. Não há
  conferência prevista nos fins de semana ou feriados; mensagens recebidas
  nesse período serão vistas no próximo dia útil. Ao tomar conhecimento de
  possível dano grave, priorizar a avaliação. Antes da distribuição pública,
  conferir à luz das regras das lojas se essa rotina
  permite resposta suficientemente rápida ou se exigirá ampliação.
- Preservar o registro da conclusão jurídica informada sobre o enquadramento
  como agente de tratamento de pequeno porte e a dispensa de encarregado;
  manter o canal de comunicação disponível aos titulares e reavaliar o
  enquadramento se a escala ou o risco do tratamento mudar.
- Confirmar que o procedimento de resposta a incidente permite avaliar e
  cumprir o prazo de 3 dias úteis quando a comunicação à ANPD e às pessoas
  afetadas for exigida; registrar eventual justificativa e complementação em
  etapas conforme o regulamento.
- Registrar a classificação de serviço adulto sem acesso provável por menores,
  conforme conclusão jurídica informada pelo responsável. A decisão para a
  primeira versão é manter a regra de 18 anos nos termos e configurar os
  controles disponíveis no Google Play e na App Store, sem confirmação de idade
  no cadastro do Setlist. Registrar que a Web permanece sem bloqueio etário,
  definir a resposta a indícios de uso por menores e reavaliar a classificação
  se o público ou as funcionalidades mudarem.
- Confirmar no inventário de retenção os prazos e
  exceções aplicáveis aos registros dos pedidos. Revisar trimestralmente os
  casos encerrados na caixa Gmail e excluir ou anonimizar os registros após o
  encerramento das finalidades que justificam sua guarda.
- Disponibilizar e documentar um canal seguro antes de solicitar documento de
  identidade em qualquer caso excepcional; se não houver canal, usar método
  alternativo proporcional. Apagar a cópia após a verificação, salvo obrigação
  legal de retenção.
- Confirmar como tratar cópias de backup e registros operacionais com os
  fornecedores. O responsável confirmou que `setlist-prod` está no plano
  Supabase **Free**, sem PITR, e decidiu manter o plano com backup próprio.
  O plano escolhido é gerar uma cópia **semanal** em disco externo
  **criptografado**, mantendo as **12 cópias semanais** mais recentes. Antes de
  distribuir publicamente, implementar e conferir a rotina, restringir o
  acesso ao disco e testar a
  restauração em ambiente separado. Conferir se a cópia cobre tanto os dados
  da aplicação quanto as identidades de autenticação e se as configurações
  necessárias à recuperação estão documentadas sem expor segredos no backup.
  O plano não oferece
  backup diário automático. Conferir
  também a retenção da auditoria de autenticação em
  `auth.audit_log_entries`, cuja gravação está ligada em produção; implantar
  e conferir a limpeza diária dos registros com mais de 30 dias, observadas
  exceções documentadas e cópias de backup.
  Para pedidos recebidos por e-mail,
  distinguir mensagens e anexos no Gmail dos registros de encaminhamento do
  Cloudflare Email Routing; para denúncias feitas no app, incluir os registros
  de envio do Brevo e a janela de frequência em `report_rate_limits`. Aplicar
  a limpeza diária decidida para as linhas cuja janela terminou há pelo menos
  24 horas e definir os demais critérios de descarte, sem presumir que excluir
  a mensagem no Gmail elimine cópias mantidas pelos fornecedores. O responsável informou
  que a conta Brevo é exclusiva do Setlist e escolheu **1 mês** de retenção dos
  logs transacionais, sem guardar novas prévias do e-mail. Aplicar e conferir
  essas opções em **Settings → Transactional emails → Retention rules** antes
  da publicação. Como a alteração das prévias não elimina cópias anteriores,
  conferir se há prévias antigas e apagá-las quando não houver motivo para
  conservá-las. Sem regra configurada, o fornecedor informa que não há exclusão
  automática dos logs transacionais e de eventuais prévias.
- Ensaiar o fluxo de denúncias de direitos autorais, conteúdo de terceiros e
  solicitações de remoção de dados; registrar os prazos legais aplicáveis em
  cada caso, as manifestações e o resultado das contestações.
- Avaliar se a cobertura limitada do filtro preventivo e a rotina de resposta
  atendem às regras de conteúdo gerado por usuários da App Store e do Google
  Play antes da submissão; as validações técnicas em desenvolvimento não
  significam aprovação pelas lojas.
- Aplicar a revisão posterior apenas diante de denúncia ou indício concreto
  documentado, com acesso restrito ao responsável e registro mínimo do caso;
  conferir o descarte conforme o inventário. Manter o acompanhamento da caixa
  em dias úteis e monitorar falhas de entrega.
  Confirmar em produção a chave API do Brevo e o remetente verificado como
  segredos da Edge Function, sem colocá-los no aplicativo.
- Conferir, na implantação em produção, que o cliente e o banco exigem a mesma
  versão `2026-10` do termo da banda e que o novo aceite é solicitado.
- Repetir a conferência de ocultação e suspensão no projeto de produção após a
  implantação, incluindo música associada a show e sessão já emitida.
- Incorporar às versões finais as decisões da revisão profissional informada
  como concluída pelo responsável.

### Validações já realizadas em desenvolvimento

- Formulários de denúncia de música e integrante verificados em Web, Android e
  iOS; o responsável confirmou o recebimento dos dois e-mails no canal de
  contato.
- Filtro preventivo verificado em criação, edição e gravação direta autenticada;
  gravações recusadas preservaram a versão anterior e os vínculos com shows.
- Registro em `moderated_songs` ocultou uma música; sua remoção restaurou a
  exibição. Consultas de repertório e show foram conferidas para músicas
  ocultadas.
- Suspensão no Supabase Auth e em `suspended_accounts` impediu operações
  protegidas mesmo quando a conta ainda pôde autenticar. A reversão restaurou
  o acesso.

Essas verificações ocorreram em `setlist-dev`. Não comprovam implantação nem
funcionamento das medidas em `setlist-prod`.

### Referência para resposta a incidentes

- Resolução CD/ANPD nº 15/2024 e orientações da ANPD:
  <https://www.gov.br/anpd/pt-br/canais_atendimento/agente-de-tratamento/comunicado-de-incidente-de-seguranca-cis>
