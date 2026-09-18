# Handoff do Codex — Setlist

Este documento preserva o contexto necessário para que uma nova sessão do Codex continue o projeto sem reconstruir decisões já confirmadas. Ele resume o histórico de trabalho; os artefatos OpenSpec continuam sendo a fonte normativa do produto.

## Estado atual

- Repositório: `anderson-sillos/setlist`.
- Branch principal: `main`.
- Branch de trabalho: `feat/ui-improvements-round-2`.
- Change ativo: `definir-mvp-setlist`.
- Workflow OpenSpec: `spec-driven`, com 4/4 artefatos de planejamento concluídos.
- PR #10: segunda rodada de melhorias de UI aberta a partir de `feat/ui-improvements-round-2` e mantida disponível para revisão.
- Implementação: Incrementos 1 e 2 concluídos até a tarefa 2.12; a tarefa 2.13 está em andamento e aguardará nova revisão visual antes de ser concluída.
- Entrega atual: prévia web publicada e build interno Android final `76bdb0d2` concluído; build e acesso remoto no iOS adiados e registrados em `REVISAO_INCREMENTO_2.md`.
- Revisão: o relatório funcional, as decisões de UX/UI e os refinamentos finais foram aprovados explicitamente pelo usuário.
- Próximo passo: revisar a reorganização visual, os ícones, o favicon, a splash, a consulta de Shows e os detalhes do show refinados na tarefa 2.13 em celular, tablet e computador; somente após aprovação explícita integrar o PR e iniciar a tarefa 3.1.

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
7. O PR #5 entregou a aplicação Expo inicial, configuração tipada, qualidade automatizada, catálogo responsivo, CI e roteiro reproduzível do ambiente.
8. Os PRs #6 e #7 ampliaram o roteiro do ambiente e documentaram a atualização segura do código local.
9. O PR #8 implementou a primeira versão navegável, publicou a versão web e entregou um build interno Android validado; a validação iOS foi adiada.
10. A revisão funcional e de UX/UI definiu a navegação móvel, listas compactas, calendário, detalhes orientados à letra, planejamento temporal da setlist e o tom de voz informal; o relatório foi aprovado e a implementação foi autorizada.
11. A tarefa 2.8 substituiu a navegação superior por um shell responsivo com cabeçalho fixo, barra inferior móvel, menu lateral, retorno nos detalhes, cabeçalho de edição e memória de rota e estado por seção.
12. A tarefa 2.9 transformou bandas, repertório e shows em listas compactas e roláveis com busca, filtros, ordenação, durações e permissões aparentes; os detalhes foram reorganizados e Shows ganhou um calendário mensal com fins de semana, feriados nacionais e os destaques solicitados para a terça-feira de Carnaval e Corpus Christi.
13. A tarefa 2.10 evoluiu a setlist para uma união discriminada de músicas, anotações de planejamento e separadores, adicionou movimentação imutável de blocos e itens, incluiu a composição do tempo entre música e planejamento e garantiu que itens não musicais não cheguem ao modo palco.
14. A tarefa 2.11 centralizou esqueletos de carregamento, erros recuperáveis, indisponibilidade, faixas de conexão e mensagens temporárias; o catálogo mantém variações determinísticas, ações objetivas, semântica acessível e textos neutros para situações sensíveis.
15. A tarefa 2.12 refinou a barra inferior e o destino Palco, a animação horizontal do menu, os filtros compactos, o alinhamento e a largura do conteúdo, as linhas das listas, o calendário e as transições de rota. A prévia web e o build Android final foram publicados e o Incremento 2 recebeu aprovação explícita.
16. A tarefa 2.13 abriu uma segunda rodada de refinamentos de UI. A iconografia deixou de usar caracteres tipográficos e passou a ser centralizada pelo componente semântico `AppIcon`, com Lucide React Native e `react-native-svg`, mantendo o mesmo desenho em Android, iOS e web.
17. As entradas de `src/app` passaram a somente encaminhar as rotas, enquanto as telas foram separadas por domínio em `features/bands`, `features/repertoire`, `features/shows` e `features/stage`. O shell de navegação, o menu lateral e os controles de lista também foram divididos em componentes e hooks menores, documentados em `docs/ARQUITETURA_DE_TELAS.md`.
18. As linhas de bandas, músicas e shows foram padronizadas, as datas e durações receberam formatadores compartilhados e os campos de busca ganharam uma ação acessível para limpar o texto. A identidade visual passou a incluir ícones nativos, foreground adaptativo do Android, favicon multirresolução e splash violeta com a nota branca do `brandMark`.
19. A consulta de Shows foi redefinida como uma única lista. O calendário deixou de ser uma visualização concorrente e passou a funcionar como filtro adicional de data aberto por um botão dedicado; a seleção muda período e estado para `Todos`, mostra todos os eventos daquele dia, contabiliza somente a data como `1` e preserva marcadores independentes da busca e ordenação. Remover a data restaura `Próximos` + `Ativo`. Esse padrão conta `2`, `Todos` nos dois grupos sem data conta `0`, e `Limpar` restaura o padrão, remove a data e fecha o painel. Filtros e ordenação usam ícones com rótulos em Shows e Repertório, e a futura criação de show permanece como ação contextual do cabeçalho para Owner e Editor. Os avisos de ações ainda demonstrativas passaram a usar um popup acessível. Ajustes pontuais adicionais alinharam os grupos de integrantes à esquerda, permitiram quebra responsiva nos controles do repertório e impediram novo acionamento do destino já ativo na barra inferior.
20. Os detalhes do show passaram a reutilizar o formato compacto de data e horário da lista, exibir a quantidade de ocorrências de músicas junto ao resumo temporal e diferenciar a precisão das durações: totais de show e bloco em horas e minutos e itens individuais com segundos. Em Rascunhos editáveis, a ação `Editar` com ícone foi movida para o cabeçalho da Setlist. As anotações de planejamento ficaram mais compactas, identificadas visualmente por fundo e ícone menor, sem repetir o rótulo `Planejamento` e mantendo o significado acessível.
21. Os detalhes da música foram alinhados ao mesmo sistema visual: estado e arquivamento usam marcadores compartilhados, a duração segue o formato da lista, a edição secundária ganhou ícone e nome acessível, os títulos das seções receberam semântica de cabeçalho e a referência do YouTube passou a usar um botão secundário com ícone vetorial externo.
22. Os dados demonstrativos foram ampliados para exercitar listas, filtros e calendários com conteúdo mais próximo do uso real: a Banda Horizonte passou a ter 9 músicas ativas e 9 shows, enquanto o Trio Aurora passou a ter 5 músicas e 4 shows. Os dois repertórios incluem músicas de artistas diferentes da banda responsável, e os eventos foram distribuídos por datas e meses distintos.
23. A antiga `features/navigation/display.ts` foi removida. Formatadores de data, duração e busca agora ficam em `src/utils` por assunto; constantes de localização ficam em `src/config/localization.ts`; o cálculo de duração da setlist fica em `src/domain/setlistDuration.ts`; e os rótulos de status ficam nas features de Shows e Repertório. `formatDateFilter` e a conversão de chaves civis de data também foram retirados dos módulos específicos onde estavam indevidamente acoplados.
24. A suíte monolítica `features/navigation/__tests__/navigation-test.tsx` foi dividida por responsabilidade. O diretório de navegação agora cobre apenas shell, integração de rotas, memória e builders de endereço; os testes de bandas, repertório, shows e seleção do palco ficam junto das respectivas features. O comportamento foi preservado e a convenção está documentada em `docs/ARQUITETURA_DE_TELAS.md`.
25. Os nomes com colchetes em `src/app/bands/[bandId]/...` são segmentos dinâmicos oficiais do Expo Router, não uma cópia redundante ou incompatível entre plataformas. Eles foram mantidos para preservar as URLs e o roteamento; comandos de shell que apontarem para esses caminhos devem usar aspas.

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
- Funções puras compartilhadas organizadas em `src/utils` por assunto e regras de negócio em `src/domain`; `features/navigation` fica restrito à estrutura de navegação.
- Lucide React Native sobre `react-native-svg` para ícones vetoriais consistentes nas três plataformas, expostos internamente por `AppIcon`.
- Expo Splash Screen para a abertura nativa com o mesmo ícone e violeta da marca.
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

## UX/UI aprovada para implementação

- No celular e tablet em retrato, usar cabeçalho fixo, barra inferior compacta com Shows, Repertório, Palco e Banda e menu entrando horizontalmente pela esquerda; em tablet paisagem e computador, usar menu lateral permanente sem barra inferior.
- Fazer as mudanças de rota sem animação automática e manter a animação horizontal de abertura e fechamento do menu lateral móvel.
- Preservar pilha, busca, filtros, ordenação e rolagem ao alternar entre as seções principais.
- Usar listas compactas e roláveis para repertório, shows e bandas, com controles fixos conforme a tela.
- Priorizar a letra nos detalhes da música, mantendo todos os blocos expandidos e os tempos ocultos fora do editor de sincronização.
- Disponibilizar em Shows uma única lista com busca, filtros e ordenação; iniciar em `Próximos` + `Ativo`, contar período, estado e data de forma independente e restaurar esse padrão pela ação `Limpar`, fechando o painel. Usar o calendário mensal como filtro adicional de data aberto por um botão dedicado, aplicar o dia imediatamente com período e estado em `Todos` e contagem `1`; ao remover a data, restaurar `Próximos` + `Ativo`. Manter os marcadores independentes da busca e ordenação, usar fundos próprios para datas com eventos, finais de semana, hoje e feriados e mostrar o nome do feriado quando a data for selecionada.
- Nos detalhes do show, reutilizar a data compacta da lista, mostrar a quantidade de ocorrências de músicas junto ao resumo de tempo, usar horas e minutos nos totais e segundos nos itens e manter a ação de edição junto ao cabeçalho da Setlist.
- Nos detalhes da música, reutilizar os marcadores de estado e a duração da lista, manter a edição secundária com ícone junto ao título, preservar a letra como conteúdo principal e usar um botão secundário com ícone vetorial na referência externa do YouTube.
- Apresentar carregamento, vazio, erro, indisponibilidade, conexão e mensagens temporárias de forma consistente e acessível.
- Apresentar mensagens de ações ainda demonstrativas em um popup acessível com título, conteúdo e fechamento explícito ou pelo fundo.
- Usar ícones vetoriais Lucide para navegação, busca, setas, seletores, indicadores e menus; manter rótulos nos controles e tratar o desenho como elemento decorativo para tecnologias assistivas.
- Usar tom informal e bem-humorado em situações gerais e recuperáveis; manter linguagem direta em ações destrutivas, legais, de segurança ou de perda de conteúdo.
- Adiar a revisão específica do modo palco para a tarefa 8.9.

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

- O desenvolvimento ocorre no WSL2; para testar em Android físico, usar o túnel do Expo ou a rede espelhada e a regra restrita à porta 8081 documentadas no README.
- Validar YouTube IFrame, WebView, leitura do tempo e origem/referer nas três plataformas.
- Validar cronômetro após bloqueio, chamada, perda de foco e encerramento do processo.
- Criar e configurar projetos Supabase de desenvolvimento e produção.
- Configurar credenciais Google e Apple e URLs de retorno para web, Android e iOS.
- Validar links universais, App Links e esquema nativo de retorno.
- Testar a matriz RLS e as regras do último Owner, convites, estados do show e timestamps.
- Obter revisão jurídica do termo e da política de privacidade antes da distribuição pública.
- Começar no Supabase Free e avaliar Pro ao atingir 80% de uma cota ou antes de depender de disponibilidade e backups de produção.
- A prévia navegável está em `https://anderson-sillos.github.io/setlist/app/`; a apresentação permanece na raiz do mesmo site.
- A aparência exata dos novos ícones e da splash exige um novo build nativo; o Expo Go não recompila esses recursos de Android e iOS.
- A revisão funcional do Incremento 2, o build Android validado e a pendência do iOS estão registrados em `docs/REVISAO_INCREMENTO_2.md`.
- O relatório funcional consolidado e a revisão de UX/UI foram aprovados; as decisões estão registradas em `docs/REVISAO_INCREMENTO_2.md`, `docs/GUIA_DE_TOM_E_VOZ.md` e nas tarefas 2.8–2.12.

## Convenção de trabalho solicitada

- Criar um commit ao final de cada atividade concluída.
- Manter um PR aberto durante um grupo relacionado de atividades.
- Acrescentar ao mesmo PR os commits daquele grupo.
- Fazer merge e fechar o PR somente ao concluir e validar todo o grupo e, quando houver versão para revisão, após a aprovação explícita do usuário.
- Preferir squash merge, pois o repositório não aceita rebase merge.
- Atualizar este handoff ao final de cada grupo quando estado, decisões, riscos ou próximos passos mudarem.
- Não misturar mudanças não relacionadas no mesmo commit ou PR.

## Histórico de PRs relevante

- PR #1: melhorias da apresentação em dispositivos móveis.
- PR #2: conformidade HTML da apresentação.
- PR #3: planejamento incremental completo do MVP.
- PR #4: handoff do histórico do Codex.
- PR #5: fundação multiplataforma concluída.
- PR #6: complementos do ambiente de desenvolvimento.
- PR #7: roteiro para atualizar o ambiente local.
- PR #8: primeira versão navegável e revisão de UX/UI do Incremento 2, concluídas e aprovadas.
- PR #9: correção das vulnerabilidades de dependências apontadas pelo GitHub e pelo `npm audit`.
- PR #10: segunda rodada de melhorias de UI, reorganização das telas, identidade visual, favicon, splash e consulta de Shows com calendário como filtro de data; aberto para revisão.

## Próxima ação recomendada

Concluir a revisão visual da tarefa 2.13 em celular, tablet e computador, incluindo a lista única de Shows, o filtro direto pelo calendário e a futura ação de criação, mantendo-a aberta até a aprovação explícita. Depois disso, iniciar a tarefa 3.1 com um protótipo mínimo do YouTube IFrame no navegador. A validação iOS permanece adiada para uma etapa futura.
