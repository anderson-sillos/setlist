# content-moderation Specification

## Purpose

Definir o primeiro controle de conteúdo privado das bandas: filtragem simples antes da gravação, denúncia dentro do app com encaminhamento por e-mail e medidas administrativas manuais para ocultar conteúdo e suspender contas.

## Requirements

### Requirement: Filtro preventivo de conteúdo no servidor
O sistema SHALL aplicar regras preventivas no servidor aos campos de texto de músicas antes de gravar criações ou edições e SHALL impedir que o cliente contorne essas regras por gravação direta. Letras e observações MUST permanecer na infraestrutura do Setlist durante a análise, sem envio a serviço externo de moderação.

#### Scenario: Envio não sinalizado
- **WHEN** uma pessoa com permissão salva uma música cujo conteúdo não é sinalizado pelo filtro
- **THEN** a gravação é concluída e a música fica acessível somente aos integrantes ativos da banda

#### Scenario: Nova música sinalizada
- **WHEN** o filtro sinaliza o conteúdo de uma nova música
- **THEN** o sistema recusa a gravação, não publica a música e orienta a pessoa a entrar em contato para solicitar revisão

#### Scenario: Edição sinalizada
- **WHEN** o filtro sinaliza uma edição de música já existente
- **THEN** o sistema recusa a edição e mantém a versão anterior disponível à banda, inclusive nas referências de shows

#### Scenario: Falha na análise
- **WHEN** a análise no servidor não pode ser concluída
- **THEN** a gravação falha sem publicar conteúdo ainda não analisado nem modificar a versão anterior

### Requirement: Denúncia de conteúdo e usuário dentro do app
O sistema SHALL oferecer no app uma ação para denunciar música e outra para denunciar usuário, com descrição informada pelo denunciante, e SHALL encaminhar as denúncias a `contato@setlistbr.app.br` sem anexar automaticamente a letra completa.

#### Scenario: Denunciar música da banda
- **WHEN** um integrante denuncia uma música pelo app
- **THEN** o sistema encaminha e-mail com a identificação da banda, da música, do denunciante e a descrição fornecida

#### Scenario: Denunciar usuário da banda
- **WHEN** um integrante denuncia outro usuário pelo app
- **THEN** o sistema encaminha e-mail com a identificação da banda, do usuário denunciado, do denunciante e a descrição fornecida

#### Scenario: Serviço de e-mail recusa ou falha
- **WHEN** o serviço não confirma o aceite do e-mail de denúncia
- **THEN** o app informa que o envio não foi confirmado e permite nova tentativa sem exibir confirmação de recebimento

### Requirement: Atendimento operacional de denúncias e recusas
O responsável pelo Setlist SHALL acompanhar a caixa de e-mail de denúncias, avaliar os casos, registrar a decisão e responder em tempo hábil. A pessoa cuja gravação foi recusada SHALL ter acesso ao canal de contato para pedir revisão da regra aplicada.

#### Scenario: Denúncia exige medida
- **WHEN** a análise de uma denúncia confirma conteúdo ou comportamento indevido
- **THEN** o responsável registra a decisão no atendimento e aplica a medida administrativa cabível

#### Scenario: Contestação de recusa do filtro
- **WHEN** o responsável conclui que um conteúdo legítimo foi sinalizado incorretamente
- **THEN** corrige a regra ou orienta a pessoa a ajustar e reenviar o conteúdo, sem publicar automaticamente o envio recusado

### Requirement: Ocultação administrativa efetiva de música
O sistema SHALL permitir que um responsável autorizado oculte manualmente uma música e SHALL negar seu conteúdo aos integrantes em leituras do servidor. Integrantes e editores da banda MUST NOT conseguir desfazer a ocultação por atualização direta.

#### Scenario: Música referenciada por show é ocultada
- **WHEN** o responsável oculta uma música vinculada a shows
- **THEN** a música deixa de aparecer ou fornecer letra e observações em repertório, detalhes e shows, inclusive por consultas diretas

#### Scenario: Dispositivo volta a sincronizar
- **WHEN** um dispositivo reconecta após a ocultação de uma música
- **THEN** o app deixa de oferecer a música oculta e remove o conteúdo das cópias locais que controla

### Requirement: Suspensão administrativa de conta
O sistema SHALL permitir que um responsável autorizado suspenda manualmente uma conta abusiva, registre a medida e impeça o acesso a dados e novas ações mesmo que a autenticação ainda ocorra ou exista uma sessão emitida antes da suspensão.

#### Scenario: Conta suspensa tenta usar o serviço
- **WHEN** uma conta suspensa tenta autenticar ou usa uma sessão existente para consultar ou alterar dados
- **THEN** as operações protegidas são negadas no serviço e a conta não consegue enviar novo conteúdo, mesmo que o provedor ainda permita autenticar

### Requirement: Privacidade e isolamento por banda
O sistema SHALL manter o conteúdo das músicas acessível somente aos integrantes ativos de sua banda, exceto pelo acesso operacional estritamente necessário do responsável autorizado. O app MUST NOT publicar músicas em catálogo público.

#### Scenario: Pessoa externa consulta música
- **WHEN** uma pessoa sem participação ativa na banda solicita uma música
- **THEN** o servidor nega o acesso ao conteúdo
