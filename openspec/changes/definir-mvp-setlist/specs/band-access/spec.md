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

#### Scenario: Usar Google nativo no Android
- **WHEN** uma pessoa escolhe Google em um development build ou build distribuído Android com a integração nativa disponível
- **THEN** o sistema apresenta a experiência nativa do Google, troca o ID Token recebido por uma sessão Supabase e preserva o contexto de convite sem abrir um navegador externo

#### Scenario: Usar OAuth quando a integração nativa não está disponível
- **WHEN** uma pessoa escolhe Google no Expo Go, na web, em um aparelho sem Google Play Services ou em um build sem a configuração nativa
- **THEN** o sistema inicia o OAuth pelo navegador e conclui o mesmo retorno `/auth/callback` usado no fluxo multiplataforma

#### Scenario: Cancelar o login nativo
- **WHEN** uma pessoa fecha ou cancela explicitamente a experiência nativa do Google
- **THEN** o sistema informa o cancelamento e não abre automaticamente o navegador

### Requirement: Conta independente de banda
O sistema SHALL permitir que uma pessoa autenticada permaneça sem participar de uma banda ou sem selecionar uma banda ativa.

#### Scenario: Usuário ainda não participa de bandas
- **WHEN** uma pessoa autenticada não possui participação ativa em nenhuma banda
- **THEN** o sistema exibe `Minhas bandas` com uma opção para criar uma banda e orientação para abrir o link de convite recebido

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

### Requirement: Perfil sincronizado e nome de exibição canônico
O sistema SHALL sincronizar os dados básicos da identidade autenticada para `profiles` e SHALL usar `profiles.display_name` como fonte canônica para apresentar integrantes em toda a aplicação. O nome de exibição SHALL poder ser personalizado pela própria pessoa e MUST NOT ser sobrescrito por sincronizações posteriores do provedor.

#### Scenario: Sincronizar a identidade do provedor
- **WHEN** o provedor cria ou atualiza nome, e-mail ou avatar na identidade autenticada
- **THEN** o sistema atualiza em `profiles` os dados de origem, e-mail e avatar e usa o nome do provedor como nome de exibição apenas enquanto a pessoa não tiver escolhido um nome próprio

#### Scenario: Personalizar nome de exibição
- **WHEN** uma pessoa autenticada salva um nome de exibição válido no próprio perfil
- **THEN** o sistema persiste `profiles.display_name`, marca o nome como personalizado e preserva esse valor após novos logins ou atualizações do provedor

#### Scenario: Tentar editar o perfil de outra pessoa
- **WHEN** uma pessoa tenta alterar o perfil ou o nome de exibição de outro usuário
- **THEN** o backend rejeita a operação e mantém inalterados os dados do perfil de destino

#### Scenario: Exibir identidade da pessoa
- **WHEN** a aplicação mostra a pessoa autenticada no menu, em Perfil e conta ou em uma lista de integrantes
- **THEN** ela usa o nome e o avatar consultados de `profiles`, sem substituir o nome pelo valor da sessão ou dos metadados do provedor

#### Scenario: Alinhar identidade no menu lateral
- **WHEN** o menu lateral apresenta avatar, nome e e-mail da pessoa
- **THEN** o avatar fica centralizado verticalmente junto à coluna de texto e o e-mail começa alinhado à esquerda com o nome

#### Scenario: Manter nome e e-mail no mesmo bloco
- **WHEN** o menu lateral mostra o nome e o e-mail junto ao avatar em uma tela estreita
- **THEN** ambos permanecem em uma coluna de texto agrupada, com o e-mail abaixo do nome e alinhado à sua esquerda

### Requirement: Formulários acessíveis com o teclado móvel
O sistema SHALL manter campos de texto, conteúdo rolável e ações dos formulários acessíveis quando o teclado virtual estiver aberto em um aplicativo móvel.

#### Scenario: Abrir o teclado em formulário de criação, edição ou confirmação
- **WHEN** uma pessoa foca um campo de texto em um formulário do aplicativo móvel
- **THEN** a janela se ajusta ao teclado e permite rolar o formulário para alcançar o campo e suas ações sem sobreposição

#### Scenario: Avatar ausente ou indisponível
- **WHEN** um perfil não possui URL de avatar ou a imagem não pode ser carregada
- **THEN** a aplicação mostra iniciais ao lado do nome sem quebrar a linha ou a navegação

### Requirement: Consulta de Minhas bandas
O sistema SHALL apresentar as participações em uma lista rolável, SHALL destacar primeiro a última banda acessada e SHALL permitir busca por nome sem oferecer filtros adicionais.

#### Scenario: Consultar várias bandas
- **WHEN** uma pessoa abre `Minhas bandas`
- **THEN** o sistema mostra primeiro a última banda acessada e ordena as demais alfabeticamente, informando em cada item seu papel e o próximo show

#### Scenario: Banda sem próximo show
- **WHEN** uma banda da lista não possui evento futuro
- **THEN** o sistema informa `Nenhum próximo show`

#### Scenario: Criar uma banda
- **WHEN** uma pessoa solicita a única ação de inclusão disponível em `Minhas bandas`
- **THEN** o sistema inicia a criação de banda sem oferecer colagem manual ou leitura de QR Code para convites

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

#### Scenario: Criador abre uma banda recém-criada
- **WHEN** o Owner abre os detalhes da banda logo após criá-la
- **THEN** a aplicação atualiza a participação e apresenta as opções de manutenção e convite permitidas ao Owner

#### Scenario: Member tenta alterar conteúdo
- **WHEN** um Member tenta criar, alterar, arquivar ou excluir conteúdo compartilhado
- **THEN** o sistema rejeita a operação e mantém acesso somente de leitura, download móvel e modo palco

#### Scenario: Pessoa sem participação tenta acessar uma banda
- **WHEN** uma pessoa autenticada solicita dados de uma banda da qual não participa
- **THEN** o backend nega a leitura e a alteração dos dados

### Requirement: Convites seguros para a banda
O sistema SHALL permitir que Owners mantenham vários links de convite ativos simultaneamente, de uso único, revogáveis, não vinculados a e-mail, com validade padrão de sete dias e rótulo organizacional opcional.

#### Scenario: Aceitar convite válido após autenticação
- **WHEN** uma pessoa abre um convite válido, conclui a autenticação e confirma a entrada
- **THEN** o sistema consome o convite uma única vez e adiciona a pessoa à banda como Member

#### Scenario: Preservar convite durante login
- **WHEN** uma pessoa não autenticada abre um convite em aplicativo ou navegador
- **THEN** o sistema preserva o convite durante o login e retoma sua confirmação depois da autenticação

#### Scenario: Reabrir um convite já aceito pela mesma pessoa
- **WHEN** o aplicativo restaura após reinicialização um link de convite que já foi aceito pela pessoa autenticada, cuja participação ainda está ativa
- **THEN** o backend reconhece o aceite apenas para essa pessoa e a aplicação remove a rota obsoleta, direcionando-a para `Minhas bandas` sem reapresentar o erro de convite utilizado

#### Scenario: Consultar um convite já aceito
- **WHEN** um Owner consulta o histórico de convites e um convite está utilizado
- **THEN** a aplicação mostra a data de aceite quando disponível em `used_at`, não mostra a data de expiração e omite qualquer data se o aceite não tiver timestamp

#### Scenario: Abrir convite no dispositivo disponível
- **WHEN** uma pessoa abre o link HTTPS de um convite
- **THEN** o sistema abre o aplicativo associado quando possível ou continua o fluxo na versão web

#### Scenario: Recusar convite indisponível
- **WHEN** uma pessoa tenta aceitar um convite expirado, revogado ou já utilizado por outra pessoa
- **THEN** o sistema não cria participação e informa que o convite não está mais disponível

#### Scenario: Substituir convite indisponível
- **WHEN** um Owner solicita outro convite depois de expiração ou revogação
- **THEN** o sistema gera um novo link independente do anterior

#### Scenario: Criar vários convites
- **WHEN** um Owner cria convites para mais de uma pessoa
- **THEN** o sistema mantém os links simultaneamente ativos e permite distingui-los por rótulo, criação e validade

#### Scenario: Usar um convite rotulado
- **WHEN** uma pessoa abre um convite que possui rótulo organizacional
- **THEN** o sistema não usa o rótulo como identidade nem restringe quem pode consumir o link

#### Scenario: Tentar colar convite manualmente
- **WHEN** uma pessoa procura uma entrada manual de convite em `Minhas bandas`
- **THEN** o sistema orienta o uso do link recebido e não oferece campo de colagem

### Requirement: Consulta e administração de integrantes
O sistema SHALL agrupar os integrantes por papel e ordená-los alfabeticamente dentro de cada grupo e SHALL mostrar controles administrativos somente a Owners.

#### Scenario: Consultar integrantes
- **WHEN** um integrante abre a área Banda
- **THEN** o sistema apresenta Proprietários, Editores e Integrantes em grupos, identifica a própria pessoa e não oferece busca ou filtros

#### Scenario: Promover para Proprietário
- **WHEN** um Owner solicita promover outra pessoa para Owner
- **THEN** o sistema exige confirmação explícita antes de conceder administração completa

#### Scenario: Remover integrante
- **WHEN** um Owner solicita remover outra pessoa
- **THEN** o sistema exige confirmação identificando a pessoa que perderá o acesso

### Requirement: Proteção do último Owner
O sistema MUST impedir que uma banda com outros integrantes fique sem Owner.

#### Scenario: Último Owner tenta sair ou perder o papel
- **WHEN** o único Owner de uma banda com outros integrantes tenta sair, excluir a conta ou ser rebaixado
- **THEN** o sistema bloqueia a operação até que outro integrante seja promovido a Owner

#### Scenario: Banda possui outro Owner
- **WHEN** um Owner sai, exclui a conta ou perde o papel e pelo menos outro Owner permanece
- **THEN** o sistema conclui a operação sem alterar o conteúdo da banda

### Requirement: Exclusão restrita da banda
O sistema MUST permitir a exclusão de uma banda somente quando o Owner solicitante for seu único integrante e SHALL exigir confirmação reforçada.

#### Scenario: Excluir banda sem outros integrantes
- **WHEN** o único integrante e Owner confirma de forma reforçada a exclusão
- **THEN** o sistema exclui a banda e todo o seu conteúdo

#### Scenario: Tentar excluir banda com outros integrantes
- **WHEN** um Owner tenta excluir uma banda que ainda possui outros integrantes
- **THEN** o sistema bloqueia a operação e orienta a transferência de responsabilidades ou a remoção prévia dos demais integrantes

#### Scenario: Confirmar exclusão com o teclado aberto no Android
- **WHEN** o Owner digita o nome da banda no campo de confirmação em um aparelho Android
- **THEN** a janela se ajusta ao teclado e permite rolar o formulário para manter o campo e as ações acessíveis

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
