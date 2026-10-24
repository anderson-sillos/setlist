# show-calendar-export Specification

## Purpose

Permitir que um integrante prepare e confirme uma cópia pontual de um show para sua agenda pessoal ou para um arquivo de calendário interoperável, preservando os instantes corretos do evento.

## Requirements

### Requirement: Adição à agenda por integrante autorizado

O sistema SHALL oferecer `Adicionar ao calendário` nos detalhes de um show autorizado para Owner, Editor e Member. Shows em Rascunho ou Pronto SHALL poder ser preparados; para shows Cancelados, a ação SHALL estar indisponível com motivo acessível.

#### Scenario: Integrante consulta show Pronto
- **WHEN** um Member autorizado abre os detalhes do show
- **THEN** pode preparar a cópia para a agenda sem obter permissão de edição do show

#### Scenario: Show está Cancelado
- **WHEN** a pessoa consulta um show Cancelado
- **THEN** o fluxo informa que um show cancelado não pode ser adicionado como novo evento ativo

#### Scenario: Sessão ou acesso tornou-se inválido
- **WHEN** o aplicativo identifica perda de acesso antes da entrega
- **THEN** encerra a prévia protegida e impede novas entregas daquele contexto

### Requirement: Cópia pontual confirmada pelo usuário

O sistema SHALL exigir uma ação explícita do usuário para entregar o evento à agenda e SHALL informar que a cópia não acompanha alterações posteriores do show. A operação MUST NOT alterar o show, cadastrar convidados ou solicitar credenciais de um provedor de calendário.

#### Scenario: Confirmar a preparação
- **WHEN** a pessoa confirma a prévia válida
- **THEN** pode abrir o formulário do calendário ou gerar o arquivo do evento com os valores revisados

#### Scenario: Show muda depois da cópia
- **WHEN** data, local, observações ou estado mudam no Setlist após a exportação
- **THEN** o sistema não altera nem exclui o evento externo e orienta que ajustes na cópia são feitos pelo usuário

#### Scenario: Adicionar novamente
- **WHEN** a pessoa usa a ação novamente para o mesmo show
- **THEN** o fluxo trata a ação como uma nova entrega, informa a possibilidade de duplicação e não promete atualização de um evento já existente

### Requirement: Prévia dos dados do evento

A prévia SHALL identificar banda, show, estado, início, término e local, e SHALL permitir escolher se as observações gerais do show serão incluídas. O evento SHALL usar como título a identificação da banda e do show; a seleção inicial de observações SHALL ser desmarcada.

#### Scenario: Preparar o evento
- **WHEN** a pessoa abre o fluxo
- **THEN** visualiza título, início, local e horário de término estimado, sem controles para editar o término nesta tela
- **AND** observações da setlist, letras e dados dos integrantes não são adicionados à descrição
- **AND** a descrição identifica o status do show, o fuso de referência e o término estimado

#### Scenario: Compartilhar um rascunho
- **WHEN** o show está em Rascunho
- **THEN** o estado aparece na prévia e na descrição da cópia, sem converter o estado de preparação em confirmação de contratação do evento

#### Scenario: Incluir observações gerais
- **WHEN** a pessoa seleciona as observações do show
- **THEN** somente esse texto adicional escolhido é incluído na descrição e o mesmo conteúdo acompanha o formulário nativo e o arquivo do evento

### Requirement: Término estimado e ajustável no calendário sem alterar o cadastro

O sistema SHALL calcular o término da cópia sem oferecer edição de data ou horário nesta tela. Quando a duração estimada do setlist for positiva, SHALL somá-la ao início salvo. Quando estiver ausente, for zero ou inválida, SHALL usar uma estimativa padrão de duas horas. A interface SHALL identificar a estimativa e informar que ela pode ser ajustada no formulário do calendário. O término SHALL ser posterior ao início.

#### Scenario: Duração conhecida
- **WHEN** o show possui duração estimada maior que zero
- **THEN** a prévia e a cópia usam início mais essa duração e identificam o término como estimado

#### Scenario: Setlist sem duração positiva
- **WHEN** a duração está ausente, é zero ou inválida
- **THEN** o término estimado usa duas horas após o início e a interface informa a estimativa padrão

#### Scenario: Ajustar término no calendário
- **WHEN** a pessoa abre o formulário nativo do calendário
- **THEN** pode alterar o horário de término antes de confirmar o evento

#### Scenario: Evento cruza a meia-noite
- **WHEN** o término válido ocorre no dia seguinte ao início
- **THEN** a cópia preserva a data final correta e o cadastro original do show permanece inalterado

#### Scenario: Retornar do seletor do sistema
- **WHEN** a pessoa retorna ao Setlist após compartilhar ou abrir o formulário nativo
- **THEN** a tela mantém a cópia preparada e suas ações visíveis, mesmo enquanto os dados em segundo plano são atualizados

### Requirement: Instantes e fuso consistentes

O sistema SHALL preservar o instante de início salvo, interpretar o término no fuso de referência identificado na prévia e entregar instantes sem ambiguidade ao calendário. A configuração de fuso do aparelho MUST NOT deslocar silenciosamente o horário do show.

#### Scenario: Calendário pessoal usa outro fuso
- **WHEN** a pessoa abre ou importa o evento em um calendário configurado para outro fuso
- **THEN** início e término representam os mesmos instantes da prévia, ainda que o calendário apresente a hora local correspondente

#### Scenario: Abrir o evento em aparelho de outro fuso
- **WHEN** o aparelho usa outro fuso e a pessoa abre o evento no calendário
- **THEN** a estimativa representa o mesmo instante definido pelo Setlist, e eventuais alterações feitas no calendário externo permanecem sob controle do usuário

### Requirement: Formulário do calendário móvel

Nos aplicativos iOS e Android, o sistema SHALL permitir abrir o formulário de criação de evento oferecido pelo sistema com os dados preparados, para que o usuário escolha o calendário e confirme. O fluxo SHALL evitar solicitar acesso de leitura à agenda pessoal apenas para essa ação.

#### Scenario: Abrir calendário no aplicativo
- **WHEN** a pessoa escolhe abrir o calendário e há suporte disponível
- **THEN** o formulário do sistema recebe título, início, término, local e descrição preparados e permite confirmar ou cancelar

#### Scenario: Formulário não está disponível
- **WHEN** não existe suporte para abrir a criação de eventos ou a tentativa falha
- **THEN** a pessoa mantém os dados preparados e pode usar o arquivo `.ics`, com explicação da falha da abertura

### Requirement: Arquivo iCalendar interoperável

O sistema SHALL gerar um arquivo `.ics` em UTF-8 compatível com RFC 5545, com um único evento, identificador estável para o show, data de geração, título, início, término, local e descrição selecionada. O arquivo SHALL estar disponível na Web e como alternativa nos aplicativos móveis.

#### Scenario: Baixar evento na Web
- **WHEN** a pessoa escolhe `Compartilhar` e o navegador não oferece compartilhamento de arquivos
- **THEN** o Setlist inicia automaticamente o download de um arquivo `.ics` com tipo `text/calendar`

#### Scenario: Compartilhar arquivo automaticamente
- **WHEN** a pessoa escolhe `Compartilhar` e a geração do arquivo `.ics` termina
- **THEN** o Setlist abre automaticamente o seletor de compartilhamento disponível, sem exigir outra ação para abri-lo

#### Scenario: Texto exige escape ou divisão de linha
- **WHEN** nome, local ou descrição contêm acentos, vírgulas, ponto e vírgula, barras invertidas, quebras ou linhas longas
- **THEN** o arquivo preserva o conteúdo usando os escapes e limites de linha do formato, sem introduzir propriedades ou eventos não escolhidos

#### Scenario: Exportar o mesmo show em outro momento
- **WHEN** a pessoa gera outro arquivo do mesmo show
- **THEN** a identidade do evento permanece estável, os dados refletem a nova prévia e a interface não garante que o importador eliminará duplicatas

### Requirement: Confirmação proporcional ao resultado da plataforma

O sistema SHALL distinguir prévia confirmada, formulário aberto, evento salvo quando confirmado pela plataforma, arquivo gerado e cancelamento. Abrir ou fechar um formulário MUST NOT ser apresentado como prova de gravação quando o sistema não informa esse resultado.

#### Scenario: Plataforma informa gravação
- **WHEN** o sistema de calendário confirma que o evento foi salvo
- **THEN** o aplicativo pode apresentar essa confirmação

#### Scenario: Plataforma informa somente retorno do formulário
- **WHEN** o calendário retorna ao Setlist sem confirmar se houve gravação
- **THEN** o feedback informa a abertura ou o retorno e orienta a conferir o calendário, sem afirmar que o evento foi salvo

#### Scenario: Cancelar o formulário
- **WHEN** a plataforma informa que a pessoa cancelou a criação
- **THEN** o Setlist retorna à preparação sem tratar cancelamento como falha e sem criar evento por outro caminho automaticamente

### Requirement: Entrega recuperável e dados mínimos

O arquivo do evento SHALL ser entregue por compartilhamento ou salvamento compatível; na Web, download SHALL estar disponível mesmo sem compartilhamento. A operação SHALL preservar os valores da prévia em caso de falha, impedir envios duplicados em andamento e manter os temporários somente pelo período necessário ao fluxo.

#### Scenario: Compartilhamento não suportado
- **WHEN** o navegador não pode compartilhar o `.ics`
- **THEN** o download permanece disponível sem exigir publicação do arquivo em um endereço externo

#### Scenario: Falha durante preparação ou entrega
- **WHEN** a geração, o salvamento ou o compartilhamento falha
- **THEN** o fluxo explica a etapa afetada, mantém a preparação visível e permite tentar novamente
