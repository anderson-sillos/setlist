# Spec Delta

## MODIFIED Requirements

### Requirement: Atualizações limitadas à tela ativa
O sistema SHALL buscar novamente somente as consultas necessárias para os dados apresentados pela tela ativa, incluindo seu contexto de acesso. A atualização SHALL preservar os dados já exibidos, compartilhar dependências usadas por mais de uma região e evitar buscas equivalentes duplicadas, consultas de perfil sem uso e recargas de bandas ou áreas não visíveis.

#### Scenario: Atualizar integrantes depois de aceite de convite
- **WHEN** um convite é aceito em outra sessão e a pessoa atualiza a tela de integrantes da banda
- **THEN** a lista inclui o novo integrante sem recarregar repertório, shows ou dados de outras bandas

#### Scenario: Atualizar o próprio nível de acesso
- **WHEN** o papel da pessoa é alterado em outra sessão e ela atualiza uma tela que apresenta esse papel ou depende dele
- **THEN** o nível e os controles de acesso apresentados correspondem ao dado vigente no servidor
- **AND** a atualização consulta o contexto da banda sem exigir o perfil ou a relação completa de bandas do usuário

#### Scenario: Atualizar dados de repertório, músicas ou shows
- **WHEN** outra pessoa altera dados compartilhados e a pessoa atualiza a lista ou detalhe correspondente
- **THEN** a tela apresenta o dado vigente sem buscar novamente consultas não relacionadas

#### Scenario: Atualizar regiões com uma dependência comum
- **WHEN** a mesma atualização precisa dos metadados de músicas para o Repertório e para Coleções
- **THEN** a dependência é buscada uma única vez e alimenta ambas as regiões

### Requirement: Atualização ao retornar a uma tela
O sistema SHALL revalidar os dados da tela quando ela voltar a ficar ativa somente se o seu cache tiver ultrapassado o intervalo mínimo de frescor configurado. Essa revalidação SHALL ser limitada às consultas da tela ativa, compartilhar dependências e respeitar estado de conexão e carregamentos já em andamento, mantendo o conteúdo autorizado disponível durante a busca.

#### Scenario: Cache recente ao retornar
- **WHEN** a pessoa retorna a uma tela antes de expirar o intervalo mínimo de frescor
- **THEN** o sistema mantém o cache sem iniciar uma nova consulta

#### Scenario: Cache antigo ao retornar
- **WHEN** a pessoa retorna a uma tela depois de expirar o intervalo mínimo de frescor
- **THEN** o sistema atualiza somente as consultas usadas por aquela tela e mantém o conteúdo atual visível durante a busca

#### Scenario: Retornar durante uma atualização em andamento
- **WHEN** a tela volta a receber foco com uma consulta necessária já em andamento
- **THEN** o carregamento existente é compartilhado sem iniciar outra chamada equivalente

## ADDED Requirements

### Requirement: Atualização coerente dos resumos dependentes

Após uma alteração confirmada, o sistema SHALL marcar para atualização os resumos e detalhes afetados da banda, preservando dados não relacionados. A invalidação SHALL alcançar dependências de duração, próximo show e papel do usuário sem obrigar a recarga imediata de telas inativas. Dados em cache MUST NOT ser reaproveitados entre usuários ou bandas sem autorização correspondente.

#### Scenario: Alterar duração de uma música
- **WHEN** uma música usada em shows ou coleções tem sua duração alterada com sucesso
- **THEN** os resumos correspondentes deixam de ser considerados atuais e passam a refletir o novo tempo ao serem consultados
- **AND** não é necessário editar cada show ou coleção

#### Scenario: Alterar a agenda dos shows
- **WHEN** um show é criado, reagendado, cancelado, reaberto ou excluído
- **THEN** os resumos de shows e o próximo show da banda são atualizados na próxima consulta pertinente

#### Scenario: Mudar a composição da setlist
- **WHEN** a pessoa salva inclusões, remoções ou tempos na setlist
- **THEN** o detalhe e o resumo de duração daquele show passam a representar a mesma versão salva

#### Scenario: Mudar permissões ou encerrar a sessão
- **WHEN** uma atualização confirma perda de acesso ou o usuário encerra a sessão
- **THEN** dados protegidos deixam de ser apresentados no contexto sem autorização
- **AND** uma sessão posterior de outro usuário não recebe o conteúdo do cache anterior

#### Scenario: Reconectar após ocultação de conteúdo
- **WHEN** um dispositivo reconecta depois de uma música ter sido ocultada por moderação
- **THEN** a reconciliação remove o conteúdo ocultado das cópias locais controladas pelo app
- **AND** a preservação visual de cache não permite oferecer conteúdo que perdeu autorização
