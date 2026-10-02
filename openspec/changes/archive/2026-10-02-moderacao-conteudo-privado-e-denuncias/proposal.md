# Proposal

## Why

O repertório é privado aos integrantes de cada banda, mas letras e observações são conteúdo enviado por usuários e hoje ficam disponíveis à banda assim que são salvas. O app ainda não tem triagem preventiva, denúncia dentro do app ou um meio administrativo de indisponibilizar efetivamente conteúdo suspeito, inclusive quando ele aparece em shows.

## What Changes

- Aplicar, antes de cada gravação, um filtro simples de regras executado no servidor, sem enviar letras ou observações a um serviço externo de moderação. Recusar envios sinalizados, orientar o usuário a entrar em contato para solicitar revisão e não publicar conteúdo quando o filtro estiver indisponível. Uma edição recusada mantém a versão anterior da música.
- Oferecer dentro do app ações para denunciar música ou usuário, com formulário curto e envio confirmado por e-mail a `contato@setlistbr.app.br`. A caixa de e-mail será a fila operacional inicial, sem anexar a letra completa automaticamente.
- Permitir que um responsável autorizado oculte efetivamente uma música e suspenda uma conta por procedimento administrativo controlado no Supabase, sem construir um painel de moderação nesta etapa. O atendimento registra a decisão e responde à denúncia.
- Preservar o isolamento por banda: letras nunca serão publicadas em catálogo ou área pública.
- Atualizar os documentos de privacidade e uso para explicar o filtro, o canal de denúncia, o acesso operacional estritamente necessário e as medidas aplicáveis a conteúdo e contas.

Este primeiro corte não inclui fila de envios pendentes, aprovação prévia por moderador, versionamento de candidatos, painel administrativo próprio ou varredura automática de todo o acervo. Esses recursos podem ser avaliados após a operação inicial, conforme o volume e os tipos de denúncias e recusas.

## Capabilities

### New Capabilities

- `content-moderation`: filtro preventivo simples no servidor, denúncias dentro do app com encaminhamento por e-mail e medidas administrativas efetivas sobre conteúdo e contas.

### Modified Capabilities

Nenhuma. O inventário de especificações principais ainda não contém uma capacidade de repertório ou de acesso à banda; esta mudança introduz uma capacidade própria de moderação.

## Impact

- Fluxos de criação e edição de músicas, com validação no servidor antes da gravação e preservação da versão anterior quando uma edição for recusada.
- Modelo de dados e políticas RLS do Supabase para impedir acesso a conteúdo ocultado e novas ações de contas suspensas, inclusive por consultas diretas.
- Consultas de repertório, detalhes de músicas, shows e sincronização local para respeitar uma ocultação após a próxima conexão do dispositivo.
- Formulário de denúncia no app, integração de e-mail e procedimento administrativo restrito para ocultar conteúdo e suspender contas.
- Termos de uso e política de privacidade, para informar o filtro e o tratamento de denúncias.
