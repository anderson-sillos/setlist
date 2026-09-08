## Purpose

Definir autenticação, participação em bandas, papéis, convites e responsabilidades necessárias para isolar conteúdo e controlar quem pode administrá-lo.

## ADDED Requirements

### Requirement: Autenticação social multiplataforma
O sistema SHALL permitir autenticação exclusivamente com Google ou Apple em Android, iOS e web e SHALL permitir que a sessão permaneça autenticada de acordo com os recursos seguros disponíveis na plataforma.

#### Scenario: Entrar com um provedor aceito
- **WHEN** uma pessoa conclui com sucesso o login pelo Google ou pela Apple
- **THEN** o sistema cria ou recupera seu perfil e abre o contexto autorizado da aplicação

#### Scenario: Tentar usar um método não suportado
- **WHEN** uma pessoa tenta entrar por senha ou por um provedor diferente de Google e Apple
- **THEN** o sistema não oferece nem aceita esse método de autenticação

### Requirement: Conta independente de banda
O sistema SHALL permitir que uma pessoa autenticada permaneça sem participar de uma banda ou sem selecionar uma banda ativa.

#### Scenario: Usuário ainda não participa de bandas
- **WHEN** uma pessoa autenticada não possui participação ativa em nenhuma banda
- **THEN** o sistema exibe `Minhas bandas` com opções para criar uma banda ou abrir um convite

#### Scenario: Última banda não está mais disponível
- **WHEN** a pessoa retorna à aplicação e sua última banda selecionada não está mais acessível
- **THEN** o sistema abre `Minhas bandas` sem expor conteúdo da banda anterior

### Requirement: Participação em várias bandas
O sistema SHALL permitir que uma pessoa participe de várias bandas e SHALL limitar cada operação de conteúdo à banda atualmente selecionada.

#### Scenario: Trocar a banda ativa
- **WHEN** uma pessoa seleciona outra banda da qual é integrante
- **THEN** o sistema passa a mostrar somente shows, repertório, integrantes e downloads associados à banda selecionada

#### Scenario: Restaurar a última banda
- **WHEN** uma pessoa retorna à aplicação e ainda participa da última banda selecionada
- **THEN** o sistema restaura essa banda como contexto ativo

### Requirement: Papéis e permissões
O sistema SHALL aplicar os papéis Owner, Editor e Member tanto na interface quanto nas operações do backend.

#### Scenario: Owner administra banda e conteúdo
- **WHEN** um Owner realiza uma operação de administração de integrantes, convites, banda ou conteúdo
- **THEN** o sistema autoriza a operação desde que as demais regras de integridade sejam satisfeitas

#### Scenario: Editor administra conteúdo
- **WHEN** um Editor cria ou altera repertório, letras, sincronizações, shows ou setlists
- **THEN** o sistema autoriza a operação

#### Scenario: Editor tenta administrar acesso
- **WHEN** um Editor tenta convidar ou remover integrante, alterar papel, promover Owner, excluir ou administrar a banda
- **THEN** o sistema rejeita a operação

#### Scenario: Member tenta alterar conteúdo
- **WHEN** um Member tenta criar, alterar, arquivar ou excluir conteúdo compartilhado
- **THEN** o sistema rejeita a operação e mantém acesso somente de leitura, download móvel e modo palco

#### Scenario: Pessoa sem participação tenta acessar uma banda
- **WHEN** uma pessoa autenticada solicita dados de uma banda da qual não participa
- **THEN** o backend nega a leitura e a alteração dos dados

### Requirement: Convites seguros para a banda
O sistema SHALL permitir que Owners criem links de convite de uso único, revogáveis, não vinculados a e-mail e com validade padrão de sete dias.

#### Scenario: Aceitar convite válido após autenticação
- **WHEN** uma pessoa abre um convite válido, conclui a autenticação e confirma a entrada
- **THEN** o sistema consome o convite uma única vez e adiciona a pessoa à banda como Member

#### Scenario: Preservar convite durante login
- **WHEN** uma pessoa não autenticada abre um convite em aplicativo ou navegador
- **THEN** o sistema preserva o convite durante o login e retoma sua confirmação depois da autenticação

#### Scenario: Abrir convite no dispositivo disponível
- **WHEN** uma pessoa abre o link HTTPS de um convite
- **THEN** o sistema abre o aplicativo associado quando possível ou continua o fluxo na versão web

#### Scenario: Recusar convite indisponível
- **WHEN** uma pessoa tenta aceitar um convite expirado, revogado ou já utilizado
- **THEN** o sistema não cria participação e informa que o convite não está mais disponível

#### Scenario: Substituir convite indisponível
- **WHEN** um Owner solicita outro convite depois de expiração ou revogação
- **THEN** o sistema gera um novo link independente do anterior

### Requirement: Proteção do último Owner
O sistema MUST impedir que uma banda com outros integrantes fique sem Owner.

#### Scenario: Último Owner tenta sair ou perder o papel
- **WHEN** o único Owner de uma banda com outros integrantes tenta sair, excluir a conta ou ser rebaixado
- **THEN** o sistema bloqueia a operação até que outro integrante seja promovido a Owner

#### Scenario: Banda possui outro Owner
- **WHEN** um Owner sai, exclui a conta ou perde o papel e pelo menos outro Owner permanece
- **THEN** o sistema conclui a operação sem alterar o conteúdo da banda

### Requirement: Exclusão de conta e preservação do conteúdo
O sistema SHALL oferecer exclusão de conta dentro da aplicação, remover os dados pessoais e as sessões da pessoa e preservar o conteúdo pertencente às bandas remanescentes.

#### Scenario: Excluir conta sem impedir continuidade da banda
- **WHEN** uma pessoa apta confirma a exclusão da conta
- **THEN** o sistema remove seu perfil e suas sessões, preserva o conteúdo das bandas e apresenta referências anteriores como `Usuário removido`

#### Scenario: Único integrante exclui banda e conta
- **WHEN** o único integrante e Owner confirma de forma reforçada a exclusão da banda e depois da conta
- **THEN** o sistema exclui a banda e seu conteúdo antes de concluir a exclusão da conta

### Requirement: Aceite de responsabilidade por letras
O sistema MUST exigir o aceite explícito do termo vigente de responsabilidade por letras na criação da banda e antes da primeira edição de conteúdo por cada Owner ou Editor.

#### Scenario: Criar banda com aceite
- **WHEN** uma pessoa marca explicitamente o aceite do termo vigente e confirma a criação
- **THEN** o sistema cria a banda e registra usuário, banda, versão do termo e data/hora do servidor

#### Scenario: Criar banda sem aceite
- **WHEN** uma pessoa tenta criar uma banda sem marcar o aceite
- **THEN** o sistema bloqueia a criação

#### Scenario: Editor ainda não aceitou o termo
- **WHEN** um Owner ou Editor tenta realizar sua primeira edição sem possuir aceite do termo vigente
- **THEN** o sistema exige o aceite antes de permitir a alteração

#### Scenario: Termo recebe mudança material
- **WHEN** uma nova versão material do termo entra em vigor
- **THEN** o sistema exige novo aceite antes da próxima edição e mantém disponíveis leitura e modo palco

#### Scenario: Consultar termo aceito
- **WHEN** um integrante abre as configurações da banda
- **THEN** o sistema permite consultar o termo vigente e as condições de responsabilidade pelo conteúdo
