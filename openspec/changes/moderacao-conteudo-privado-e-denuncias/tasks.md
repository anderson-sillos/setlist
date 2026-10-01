# Tasks

## 1. Filtro preventivo simples

- [ ] 1.1 Criar migration com função e gatilho que analisam os campos textuais de `songs` por regras de alta confiança, sem chamada externa; verificar em banco que inserção e edição sinalizadas são recusadas e que uma falha do filtro aborta a transação.
- [ ] 1.2 Cobrir permissões e gravação direta por PostgREST/RLS para confirmar que nenhum cliente contorna o gatilho; verificar que uma edição recusada preserva a versão anterior e os vínculos com shows.
- [ ] 1.3 Exibir no editor uma mensagem compreensível para a recusa, com canal de contestação, sem registrar letra em logs; verificar os fluxos de criar, editar e reenviar após ajuste.

## 2. Denúncia dentro do app

- [ ] 2.1 Criar função autenticada para validar denunciante/alvo, limitar abuso e encaminhar e-mail a `contato@setlistbr.app.br` com identificadores e descrição, sem letra completa; verificar os dois tipos de alvo e o conteúdo recebido na caixa de teste.
- [ ] 2.2 Adicionar ações e formulário de denúncia de música e usuário em Web, Android e iOS; verificar que cada ação é encontrável e envia o alvo correto.
- [ ] 2.3 Tratar aceite e falha do serviço de e-mail no formulário, permitindo nova tentativa sem falsa confirmação; verificar comportamento com entrega aceita, erro e indisponibilidade.
- [ ] 2.4 Documentar na rotina da caixa como identificar, registrar, responder e encerrar denúncias e contestações de filtro; verificar que um caso de exemplo percorre a rotina com decisão e resposta registradas.

## 3. Medidas administrativas manuais

- [ ] 3.1 Criar estado administrativo de música oculta com acesso restrito e atualizar RLS/funções para negar sua leitura em `songs` e `show_items`; verificar consultas diretas de integrante, editor e usuário externo, inclusive para música em show.
- [ ] 3.2 Revisar RPCs e demais consultas que possam devolver conteúdo de música oculta e ajustar os caminhos encontrados; verificar que repertório, detalhe e show não expõem letra ou observações por rotas alternativas.
- [ ] 3.3 Criar estado administrativo de suspensão e integrar sua verificação às políticas e funções do app, junto ao banimento no Supabase Auth; verificar que nova autenticação e requisições com sessão anterior são negadas.
- [ ] 3.4 Documentar comandos restritos de aplicação e reversão de ocultação/suspensão, identificação do responsável e registro da decisão; verificar execução do procedimento em ambiente controlado sem permitir que integrante da banda reverta a medida.

## 4. Cliente, cache e documentos públicos

- [ ] 4.1 Ajustar repertório, detalhes, shows e sincronização para remover conteúdo ocultado das cópias locais após reconexão; verificar reconexão de cliente com música anteriormente sincronizada.
- [ ] 4.2 Atualizar termos de uso, política de privacidade e procedimento de remoção para refletir filtro, contestação, denúncia por e-mail, acesso operacional e medidas manuais; verificar coerência entre os documentos e os fluxos existentes.

## 5. Verificação de liberação

- [ ] 5.1 Verificar em conjunto criação e edição aceitas/recusadas, denúncia, ocultação, suspensão, isolamento por banda e recuperação após falha; registrar evidências do checklist de liberação antes de ativar o primeiro corte.
