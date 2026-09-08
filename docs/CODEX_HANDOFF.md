# Handoff do Codex — Setlist

Este documento preserva o contexto necessário para que uma nova sessão do Codex continue o projeto sem reconstruir decisões já confirmadas. Ele resume o histórico de trabalho; os artefatos OpenSpec continuam sendo a fonte normativa do produto.

## Estado atual

- Repositório: `anderson-sillos/setlist`.
- Branch principal: `main`.
- Último grupo concluído: planejamento incremental do MVP, integrado pelo PR #3 no commit `d7036a7`.
- Change ativo: `definir-mvp-setlist`.
- Workflow OpenSpec: `spec-driven`, com 4/4 artefatos de planejamento concluídos.
- Grupo ativo: fundação multiplataforma no PR #5, branch `feat/foundation`.
- Implementação: tarefas 1.1–1.3 e 1.7 concluídas; aplicação Expo inicial, dependências, ambientes tipados e roteiro de desenvolvimento verificados.
- Próximo passo: executar a tarefa 1.4 de `tasks.md` usando `openspec-apply-change`.

## Fontes de verdade

- `openspec/changes/definir-mvp-setlist/proposal.md`: motivação, escopo e capacidades.
- `openspec/changes/definir-mvp-setlist/design.md`: arquitetura, decisões e riscos.
- `openspec/changes/definir-mvp-setlist/specs/`: contratos de comportamento por capacidade.
- `openspec/changes/definir-mvp-setlist/tasks.md`: estratégia incremental e checklist de implementação.

Antes de implementar, executar:

```bash
openspec status --change definir-mvp-setlist
openspec validate definir-mvp-setlist --type change --strict
```

## Histórico resumido

1. O OpenSpec foi inicializado localmente no projeto e a cópia redundante foi removida.
2. A ideia do Setlist foi explorada até fechar o escopo funcional, as regras de acesso, o modo palco, o funcionamento offline e a arquitetura.
3. O repositório GitHub foi configurado, o README inicial foi criado e uma apresentação HTML responsiva foi publicada no GitHub Pages.
4. Os PRs #1 e #2 melhoraram a apresentação móvel e corrigiram sua conformidade HTML.
5. O PR #3 consolidou proposal, design, seis delta specs e o plano incremental em 11 incrementos.
6. O PR #4 adicionou este handoff e o PR #5 iniciou a fundação multiplataforma.

## Visão confirmada do produto

O Setlist atende dois objetivos principais:

1. Organizar repertório, shows, blocos e ordem das músicas de uma banda.
2. Apresentar letras acompanhadas por um cronômetro iniciado manualmente pelo músico.

O reconhecimento automático da música ou da posição do áudio fica fora do MVP. Cada aparelho mantém um cronômetro independente.

## Plataformas e arquitetura

- Uma única aplicação Expo com TypeScript e Expo Router.
- Android e iOS para celulares e tablets, com pacotes offline em JSON.
- Versão web responsiva para computadores, usada somente online.
- Supabase hospedado para Auth, PostgreSQL e RLS; nenhum banco local ou Docker é necessário para executar o projeto.
- SecureStore somente para sessão nos aplicativos móveis; armazenamento de sessão próprio do navegador na web.
- TanStack Query para estado remoto, React Hook Form e Zod para formulários e validação.
- Estado nativo do React inicialmente; Zustand somente se surgir necessidade concreta.
- Jest e React Native Testing Library, com Maestro para fluxos móveis e Playwright para web.

## Acesso e bandas

- Login exclusivamente com Google ou Apple.
- A conta pode existir sem banda selecionada; `Minhas bandas` é o contexto neutro.
- Um usuário pode participar de várias bandas.
- Papéis: Owner, Editor e Member.
- Owner administra integrantes, convites, banda e conteúdo.
- Editor altera conteúdo e consulta integrantes, mas não administra acesso ou a banda.
- Member consulta, baixa shows no aplicativo móvel e usa o modo palco.
- O último Owner não pode sair ou perder o papel, exceto se for o único integrante e excluir a banda com confirmação reforçada.
- Convites são links HTTPS de uso único, revogáveis, não vinculados a e-mail e válidos por padrão durante sete dias.
- Um convite aberto antes do login deve ser retomado depois da autenticação e adiciona o usuário como Member após confirmação.
- Na exclusão de conta, conteúdo das bandas é preservado e a autoria anterior aparece como `Usuário removido`.

## Responsabilidade pelas letras

- A criação da banda exige aceite explícito do termo de responsabilidade pelo conteúdo.
- Cada Owner ou Editor também deve aceitar o termo vigente antes de sua primeira edição.
- O aceite registra usuário, banda, versão do termo e horário do servidor.
- Uma mudança material do termo exige novo aceite para editar, sem bloquear leitura ou modo palco.
- O piloto admite apenas letras autorais da banda, em domínio público ou autorizadas.
- Não haverá busca ou importação automática de sites de letras.
- Termo, política de privacidade e procedimento de remoção precisam de revisão jurídica antes de distribuição pública.

## Repertório e sincronização

- Cada banda possui repertório próprio e uma única versão vigente por música.
- Letras contêm somente texto, sem cifras ou transposição.
- A letra fica em um documento JSONB com blocos e linhas ordenados, identificadores estáveis e tempos em milissegundos.
- Estados: Sem letra, Letra estática, Sincronização incompleta e Sincronizada.
- Músicas usadas por shows são arquivadas em vez de excluídas e podem ser restauradas.
- O YouTube é a única referência de áudio do MVP.
- Em Android e iOS, o player visível usa IFrame em WebView; na web, usa IFrame diretamente.
- O editor toca em cada linha durante a reprodução e pode corrigir os tempos manualmente.
- Não baixar, extrair, ocultar ou reproduzir o áudio do YouTube em segundo plano.

## Shows e modo palco

- Show: nome, data, horário, local, observações, blocos e setlist ordenada.
- Cada item da setlist pode ter uma observação específica do show.
- Estados: Rascunho, Pronto e Cancelado; não há Em andamento ou Finalizado.
- Rascunho aceita edição e prévia online, mas não download.
- Pronto é somente leitura e aceita modo palco online ou offline móvel.
- Cancelado não aceita execução nem novo download e pode voltar a Rascunho.
- Problemas de letra geram avisos ao tornar Pronto, sem bloquear a operação.
- O cronômetro é manual e independente por aparelho, com pausar, mais ou menos cinco segundos e reiniciar.
- A próxima música é sempre acionada manualmente.
- O modo palco oferece fonte, tema, orientação, tela ativa e bloqueio manual contra toques.
- Após interrupção, o tempo em execução é recalculado; após encerramento do processo, o usuário escolhe Retomar ou Reiniciar.
- Letra estática ou incompleta usa leitura manual, sem destaque temporal enganoso.

## Conteúdo offline e atualização

- Offline existe somente nos aplicativos Android e iOS e apenas para shows Prontos.
- Cada pacote é um JSON autocontido na área persistente do aplicativo, sem áudio ou imagens.
- Não há SQLite, expiração por idade ou limite próprio no MVP.
- Atualizações usam substituição atômica e mantêm apenas o pacote atual.
- O servidor gera um `content_updated_at`; o cliente mostra Conteúdo atualizado, Atualização disponível ou Verificação pendente.
- O timestamp serve somente para comparar o conteúdo local com o servidor; não representa versão ou histórico.
- Logout remove todos os pacotes. Perda de participação ou cancelamento remove os pacotes na próxima conexão.
- Não é possível prometer revogação enquanto o aparelho permanece totalmente offline.

## Estratégia incremental

O checklist está dividido nos seguintes incrementos:

1. Fundação executável multiplataforma.
2. Primeira versão navegável com dados demonstrativos e cronômetro.
3. Validação antecipada dos riscos técnicos.
4. Fundação do backend e segurança.
5. Autenticação, bandas e integrantes.
6. Repertório e letras estáticas.
7. Shows e setlists.
8. Modo palco conectado ao conteúdo real.
9. Sincronização manual com YouTube.
10. Pacotes offline em Android e iOS.
11. Consolidação e piloto.

O incremento 2 deve gerar a primeira versão revisável. Cada incremento funcional termina com validação ou versão interna para recolher feedback antes do próximo grupo.

## Validações e dependências externas

- Validar YouTube IFrame, WebView, leitura do tempo e origem/referer nas três plataformas.
- Validar cronômetro após bloqueio, chamada, perda de foco e encerramento do processo.
- Criar e configurar projetos Supabase de desenvolvimento e produção.
- Configurar credenciais Google e Apple e URLs de retorno para web, Android e iOS.
- Validar links universais, App Links e esquema nativo de retorno.
- Testar a matriz RLS e as regras do último Owner, convites, estados do show e timestamps.
- Obter revisão jurídica do termo e da política de privacidade antes da distribuição pública.
- Começar no Supabase Free e avaliar Pro ao atingir 80% de uma cota ou antes de depender de disponibilidade e backups de produção.

## Convenção de trabalho solicitada

- Criar um commit ao final de cada atividade concluída.
- Manter um PR aberto durante um grupo relacionado de atividades.
- Acrescentar ao mesmo PR os commits daquele grupo.
- Fazer merge e fechar o PR somente ao concluir e validar todo o grupo.
- Preferir squash merge, pois o repositório não aceita rebase merge.
- Atualizar este handoff ao final de cada grupo quando estado, decisões, riscos ou próximos passos mudarem.
- Não misturar mudanças não relacionadas no mesmo commit ou PR.

## Histórico de PRs relevante

- PR #1: melhorias da apresentação em dispositivos móveis.
- PR #2: conformidade HTML da apresentação.
- PR #3: planejamento incremental completo do MVP.
- PR #4: handoff do histórico do Codex.
- PR #5: fundação multiplataforma em andamento.

## Próxima ação recomendada

Continuar o incremento 1 no PR #5 e executar as tarefas restantes em ordem com `openspec-apply-change`. Ao concluir cada tarefa, marcar sua caixa em `tasks.md`, validar o resultado e criar o commit correspondente sem fechar o PR até terminar o incremento acordado.
