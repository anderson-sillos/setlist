# Design

## Context

Veja `proposal.md` para o escopo do primeiro corte e `specs/content-moderation/spec.md` para os comportamentos exigidos. Hoje o cliente grava músicas diretamente na tabela `songs` do Supabase. RLS limita a leitura aos integrantes da banda, mas não verifica se a música foi ocultada. O arquivamento existente não retira uma música referenciada por shows do acesso dos integrantes. Shows e seus itens também têm políticas de leitura próprias. Não há denúncia dentro do app nem suspensão administrativa efetiva.

## Goals / Non-Goals

**Goals:**

- Impedir a gravação de conteúdo sinalizado por regras preventivas simples no próprio servidor, inclusive quando alguém chama a API diretamente.
- Aceitar denúncias dentro do app e enviá-las ao e-mail operacional, com retorno fiel quando o serviço de envio falhar.
- Dar ao responsável autorizado meios manuais de ocultar música e suspender conta que sejam respeitados pelo servidor e pelo app.
- Manter repertórios privados aos integrantes ativos da banda.

**Non-Goals:**

- Fila de aprovação de envios, armazenamento de candidatos recusados, versionamento de músicas pendentes ou painel administrativo próprio.
- Revisão automática do acervo antigo ou detecção completa de toda infração por regras de texto.
- Envio de letras/observações a serviços externos de classificação.
- Garantir a exclusão instantânea de cópias em dispositivos desconectados.

## Decisions

### 1. Filtro de regras em gatilho do Postgres

Aplicar o filtro em um gatilho `BEFORE INSERT OR UPDATE` de `songs`. Ele examina os campos textuais enviados, incluindo título, artista, letra e observações, após normalização básica. Regras de alta confiança ficam definidas e versionadas por migration. Quando uma regra sinaliza a gravação, o gatilho lança um erro identificável para que o app explique a recusa e mostre o canal de contato. Se o filtro falhar, a transação também falha. A gravação existente continua atômica e não há segundo estado de música.

**Alternativas consideradas:** filtragem apenas no cliente permitiria bypass pela API; uma Edge Function de submissão, fila e versões pendentes exigiria mais infraestrutura para o primeiro corte. O gatilho protege também as gravações diretas já existentes.

### 2. Recusa sem retenção do envio

Não persistir conteúdo recusado. Uma edição recusada reverte a transação inteira e preserva a versão anterior, inclusive seu vínculo com shows. O app informa a recusa e orienta a pessoa a contatar o Setlist; se a regra for corrigida ou o conteúdo for ajustado, a pessoa reenvia a edição. Evitar texto integral da tentativa em logs de erro.

**Alternativa considerada:** reter o conteúdo para aprovação humana permitiria publicação posterior, mas exigiria controle de versão, fila, acesso de moderadores e tratamento de prazo. Essa etapa fica fora do primeiro corte.

### 3. Formulário no app e e-mail como fila operacional

Disponibilizar denúncias na tela de música e na área onde o integrante identifica outros membros. Uma função de servidor autenticada valida o vínculo do denunciante e do alvo com a banda, limita tamanho/frequência e envia a `contato@setlistbr.app.br` IDs, contexto e descrição fornecida, sem anexar a letra automaticamente. Retornar sucesso apenas quando o provedor de e-mail aceitar o envio; em caso de erro, permitir tentativa nova. A caixa de e-mail, com identificador de caso e registro manual de resposta/decisão, é o acompanhamento inicial. Não criar tabelas de denúncias ou tentativas nesta etapa.

**Alternativa considerada:** abrir o aplicativo de e-mail do dispositivo não permite ao Setlist saber se a denúncia foi aceita para entrega e pode falhar quando não há cliente de e-mail configurado. O formulário com função de envio atende ao fluxo dentro do app com menos infraestrutura do que uma fila própria.

### 4. Ocultação manual protegida pelo banco

Criar um registro administrativo de músicas ocultadas, editável somente por credencial administrativa, com motivo, responsável e horário. Uma função de banco restrita consulta esse estado sem expor a tabela aos usuários. Atualizar a política RLS de `songs` e a leitura de `show_items` para não devolver música oculta nem itens que a referenciem. Revisar RPCs e caminhos de consulta que possam retornar letra/observações. O procedimento interno usa o painel/SQL Editor do Supabase; integrantes da banda não podem desfazer a medida.

**Alternativas consideradas:** usar `archived_at` não basta porque uma música arquivada pode continuar legível; ocultar apenas no cliente deixaria consultas diretas expostas; construir painel administrativo próprio agora aumentaria o escopo sem ser necessário para o volume inicial.

### 5. Suspensão manual com bloqueio de sessão existente

O procedimento administrativo registra conta suspensa, motivo, responsável e horário em dados inacessíveis à escrita do usuário e aplica o banimento no Supabase Auth. As políticas RLS e funções privilegiadas do app consultam o estado de suspensão para negar leitura e escrita também a uma sessão com token ainda válido. O procedimento de reversão é igualmente restrito e registrado.

**Alternativa considerada:** usar somente o banimento do Auth não é suficiente para impedir requisições feitas com um token já emitido antes da suspensão.

### 6. Aplicação da ocultação ao cliente e documentos

Consultas online e sincronização deixam de trazer músicas ocultadas. Na reconexão, o app invalida entradas locais que deixaram de constar nas consultas autorizadas e não mostra conteúdo antigo em repertório ou shows. Termos, política de privacidade e procedimento de atendimento passam a descrever o filtro, o e-mail, a decisão manual e o acesso operacional limitado.

**Alternativa considerada:** depender apenas da RLS protegeria o servidor, mas poderia deixar conteúdo antigo visível no cache depois da reconexão.

## Risks / Trade-offs

- **Regras simples erram por falta de contexto, especialmente em letras** → começar por padrões de alta confiança, manter canal de contestação, ajustar regras por migration e não tratar o filtro como detecção completa.
- **O catálogo antigo não será reavaliado automaticamente** → atender denúncias e inspeções, usando a ação manual de ocultação; avaliar varredura futura conforme volume e risco observado.
- **O provedor pode aceitar um e-mail que não chega à caixa** → monitorar a caixa e falhas de entrega; a confirmação exibida significa aceite para envio, não leitura pelo responsável.
- **Tentativa repetida após erro incerto pode gerar e-mail duplicado** → incluir identificador de caso no assunto para permitir conciliação manual; não criar mecanismo de idempotência persistente nesta etapa.
- **Banimento no Auth não invalida imediatamente JWT já emitido** → negar operações também nas políticas e funções do banco por estado de suspensão.
- **Dispositivo offline pode conservar conteúdo anteriormente sincronizado** → invalidar na reconexão e comunicar o limite operacional quando necessário.

## Migration Plan

1. Introduzir gatilho e regras do filtro no banco, com erro identificável e falha segura. Mapear o erro no cliente antes de ativar as regras de recusa.
2. Criar os registros administrativos restritos, as funções de consulta e as mudanças de RLS para ocultação e suspensão. Documentar comandos manuais de aplicação e reversão.
3. Disponibilizar função de envio de denúncia e formulário no app; configurar segredo do provedor de e-mail apenas no servidor e preparar a caixa para acompanhamento.
4. Ajustar consultas, shows e cache para respeitar ocultações; atualizar os documentos de uso, privacidade e atendimento antes do lançamento.
5. Verificar o fluxo completo com perfis de banda, usuário externo, conta suspensa e acesso direto à API. Conferir a caixa de e-mail e os procedimentos administrativos em ambiente controlado.

**Rollback:** desativar temporariamente novas gravações se o filtro ou sua migração falhar, corrigir a regra e reaplicar a migration; não liberar gravações sem filtro. Preservar registros administrativos de ocultação e suspensão e manter as respectivas barreiras de leitura durante qualquer reversão do cliente.

## Open Questions

Nenhuma decisão de arquitetura bloqueia o primeiro corte. O conjunto inicial de regras, o serviço de entrega de e-mail e a escala de atendimento serão definidos na implementação sem mudar o fluxo descrito.
