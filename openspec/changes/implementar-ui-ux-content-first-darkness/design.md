# Design

## Context

Consulte `proposal.md` e as capacidades `application-ui` e `screen-navigation`. A direção visual e os valores de referência estão em `docs/PROPOSTA_UI_CONTENT_FIRST_DARKNESS.md`; aplicações/figuras estão em `docs/CATALOGO_ICONES_CONTENT_FIRST_DARKNESS.md` e miniaturas adjacentes.

O projeto já compartilha `src/theme/tokens.ts`, `AppText`, `AppButton`, `AppIcon`, `AppNavigationShell` e os layouts do Expo Router. Os tokens atuais misturam papéis: `surface` é fundo e também cor do texto “inverse”; o Stack raiz define animação `none`; layouts internos deixam opções padrão; drawer abre por faixa de 16 px na borda esquerda; memória de navegação guarda rota e rolagem por banda/seção; editores locais usam estados próprios para valores alterados. A mudança deve migrar consumidores sem quebrar os temas, fluxos e testes existentes.

`shared-data-refresh` já exige preservação dos dados exibidos, ação Web e gesto móvel sem conflito. Pull-to-refresh validado e disponibilidade atual de Palco devem permanecer como estão.

## Goals / Non-Goals

**Goals:**

- Aplicar uma linguagem semântica e responsiva sem trocar valores de cor em massa enquanto tokens ainda têm significados conflitantes.
- Migrar shell, componentes comuns e telas de forma incremental, revisando o resultado nas três plataformas.
- Tornar retorno, estado da navegação e saída de edição consistentes com botão, histórico, sistema e tecnologia assistiva.
- Usar movimentos breves, cancelar transições interativas e reagir à preferência de redução de movimento.
- Adiar a habilitação da troca de seção por deslize até validar que ela melhora as tarefas sem interferir com gestos existentes.

**Non-Goals:**

- Alterar regras de domínio, dados do Supabase, RLS, moderação, permissões ou sincronização.
- Criar funções de reprodução, modo Palco, player integrado, funcionamento offline, novos destinos ou tutorial obrigatório.
- Alterar o contrato de atualização compartilhada ou substituir os fluxos e componentes nativos de cada plataforma sem evidência técnica.
- Tornar animação, pressão longa ou gesto de caminho necessários para descobrir ou completar uma ação.

## Decisions

### 1. Migrar tokens por função e por etapas

Adicionar primeiro tokens semânticos (`background`, `text`, `action`, `border`, `semantic`, `brand`, `focus`, `disabled`) e tokens de geometria/duração propostos. Manter temporariamente aliases atuais; migrar `AppText`, `AppButton`, menus, inputs e estados para os novos papéis antes de remover aliases obsoletos. Não alterar o significado de `surface` sem migrar todo uso identificado.

Usar as cores e medidas da proposta visual como base e conferir pares de texto/controle com os verificadores de contraste já existentes. Para marca, distinguir logo Setlist de violeta de ação. Evitar estilos literais locais que recriem um tema paralelo.

**Alternativa considerada:** substituir diretamente os valores em `tokens.ts`. Rejeitada por alterar simultaneamente fundo, textos inversos, status e navegação; o uso atual de `surface` torna a troca global arriscada.

### 2. Tratar componentes compartilhados como referência da migração

Atualizar tokens, texto, botões, cartões, ícones, status, inputs, busca, filtros, refresh e feedback compartilhados antes da migração tela a tela. Cada consumidor passa a expressar função e estado, não uma cor ou tamanho copiado. Preservar alvos de toque, expansão de conteúdo, mensagens em popup já definidas e o comportamento específico dos provedores de login.

Migrar shell/autenticação/Minhas bandas; em seguida repertório/detalhe/editor/leitura; depois shows/calendário/setlist; por fim banda/convites/perfil, denúncia, telas indisponíveis e estados menos comuns. Fazer uma revisão responsiva por etapa para limitar regressões de listas e cabeçalhos.

Depois de criar uma banda, persistir sua seleção e abrir diretamente o Repertório para que a pessoa comece pelo conteúdo musical. Em estados vazios, indicar o próximo passo de acordo com os dados disponíveis: cadastrar a primeira música quando o repertório não tiver músicas, ou criar o primeiro show quando já houver músicas ativas e nenhum show cadastrado. As ações de criação aparecem apenas para proprietário/editor; integrante sem permissão recebe a orientação correspondente. Busca e filtros sem resultados continuam oferecendo a recuperação de limpar esses controles, sem serem confundidos com uma lista ainda não iniciada.

### 3. Manter uma única fonte semântica para ícones e marca

Revisar o mapa do `AppIcon` contra os 43 identificadores atuais e o catálogo proposto. Trocar a figura segundo o contexto sem renomear rotas ou alterar ações do domínio. Não distorcer vetores nem compor badges decorativos para ações comuns; usar texto visível onde o símbolo não for inequívoco. Preservar nomes acessíveis nos controles.

Arredondar o fundo do logo em 25% do lado (raio 6 na arte vetorial de 24; 7–8 em 28–32; 12–16 em 48–64), preservando desenho, cor, proporção e área segura para as máscaras de ícone iOS/Android. Gerar/atualizar derivados a partir da fonte canônica aprovada pelo repositório e conferir favicon/ícones exportados, sem aplicar raio duas vezes à máscara da plataforma.

**Alternativa considerada:** redesenhar o símbolo ou usar o mesmo `Music` em todas as ações. Não atende à proposta de manter a identidade reconhecível nem diferencia música, repertório, leitura e palco.

### 4. Configurar transições por navegador e tipo de rota

Rever `screenOptions` do Stack raiz e dos layouts aninhados. Usar apresentação do navegador em detalhe/retorno nativo. No nativo, o botão Voltar substitui a rota atual pelo destino contextual em vez de depender de outras telas no histórico; a rota de destino usa animação `pop`, para a tela correta entrar pela esquerda. A leitura de letra em tela cheia usa `dismissTo` para retornar ao detalhe da mesma música no Stack aninhado; o detalhe usa `pop` para entrar pela esquerda, inclusive quando a letra foi aberta diretamente. Na Web, navegar ao destino contextual e manter a integração com o histórico e o fade curto. Na troca de seção pelos controles nativos, avançar Shows → Repertório → Banda com substituição `push` e retroceder com `pop`, preservando a direção natural da pilha no iOS e aplicando `slide_from_right` nativo no Android. A rota raiz de Minhas bandas sempre usa `pop` ao ser substituída, para entrar pela esquerda como primeiro nível da pilha. Drawer e popup continuam camadas, com abertura/fechamento próprios. Centralizar durações de efeitos próprios em tokens; preservar tempos e gestos interativos nativos quando a preferência do sistema exigir.

Começar a transição sem aguardar consulta remota; loading/erro/sucesso refletem o estado dos dados. Não animar a tela inteira em refresh, cada letra ou cada linha. Observar a estrutura de `ScrollView`, refresh control e `NavigationMemory` ao inserir animadores para não desmontar listas, perder posição ou reabrir telas em branco.

Em listas com controles fixos sobre a área de rolagem, posicionar o indicador nativo de pull-to-refresh abaixo do overlay usando sua altura medida (`progressViewOffset`). O overlay continua fixo e a lista mantém a área de rolagem integral.

**Alternativa considerada:** configurar uma animação global para todo push/pop. Rejeitada porque troca de seção, detalhe, popup e drawer expressam níveis diferentes e porque o Stack raiz atualmente desativa movimento enquanto stacks internos não estão explicitamente alinhados.

### 5. Reutilizar estado de navegação e preservar contexto

Manter `NavigationMemory` como estado efêmero por banda/seção. Fazer controles visíveis e qualquer gesto aceito chamarem a mesma resolução de rota. Não usar push para cada troca entre destinos principais; preservar histórico de detalhe de forma que Voltar retorne à origem. Validar links diretos sem histórico e rotas protegidas depois de expiração de sessão ou perda de participação.

No Android, usar o retorno fornecido pelo navegador/sistema e verificar animação preditiva em development/preview builds; não consumir ou simular o gesto de voltar dentro do conteúdo. No iOS, deixar o retorno de Stack acompanhar/cancelar o gesto nativo. Na Web, preservar teclado Escape para camadas e histórico do navegador; ação Voltar interna mantém rótulo/destino acessível.

### 6. Centralizar proteção de saída em estado explícito do editor

Derivar estado alterado dos valores iniciais e atuais, inclusive blocos/linhas de letra e setlist; sucesso de gravação sincroniza o estado inicial. Antes de remover a rota, trocar seção ou descartar via botão, solicitar uma decisão compartilhada de continuar editando/descartar. Durante submissão, não permitir segundo envio ou descarte silencioso. Mensagem de saída usa o popup do projeto.

Integrar a proteção ao mecanismo de prevenção de remoção compatível com Expo Router e limitar interceptores ao editor ativo. Tratar popups/camadas primeiro. Navegadores podem limitar diálogo personalizado ao fechar aba, recarregar ou sair do app: proteger navegação interna e descrever/validar o comportamento externo suportado.

Na Web, a navegação interna usa o aviso visual do Setlist; fechar ou recarregar a aba usa o diálogo nativo do navegador, cujo texto é controlado pelo navegador e pode variar por plataforma.

**Alternativas consideradas:** alerta apenas no botão Cancelar; proteção apenas por um `beforeRemove` global; trocar toda edição para formulário controlado novo. O primeiro deixa Voltar/gestos desprotegidos; o segundo pode interceptar saídas sem edição e esconder intenção; o terceiro eleva risco. Escolher a proteção por rota, ligada ao estado dirty/submitting dos fluxos existentes.

### 7. Fazer do deslize entre seções um recurso condicionado, nativo e cancelável

Preservar navegação por barra e menu. O piloto considera apenas Shows → Repertório → Banda em área que não capture controles. Swipe permanece desabilitado até a avaliação definida na change. Se aprovado, reconhecimento exige dominância horizontal, não ocorre em bordas do sistema, alça, campo, seleção, teclado, camada modal, scroll vertical ou leitor de tela e acompanha o dedo até confirmar/cancelar. No cancelamento, não muda rota, memória, busca, seleção ou rolagem. Palco não entra nessa sequência; segue abrindo o aviso por ação explícita.

Evitar dois PanResponders sobrepostos: arbitrar a região dedicada no shell/gesto único e coordenar com drawer, pull-to-refresh e arraste da setlist. Se um conflito não puder ser resolvido sem prejudicar uma interação existente, não ativar o gesto e manter os controles atuais.

**Alternativa considerada:** captura horizontal global em toda a área de conteúdo. Rejeitada por interferir em letras roláveis, campos, gestos do sistema, atualização de lista e ordenação de itens.

### 8. Responder a redução de movimento sem perder foco ou feedback

Detectar preferência nativa de movimento reduzido e `prefers-reduced-motion` na Web; fazer a preferência mudar sem reiniciar. Remover deslocamento/escala decorativa ou reduzir a fade breve; manter estado, foco, cancelamento e feedback textual. Indicador de carregamento pode usar forma estática acompanhada por texto. Evitar animação automática ornamental.

**Alternativa considerada:** só reduzir duração em poucos milissegundos. Rejeitada como insuficiente para quem desativa movimento. Também não presumir suporte a preferência apenas pelos efeitos Reanimated: conferir transições nativas, React Native e CSS.

### 9. Validar comportamento, aparência e acessibilidade por plataforma

Cobrir componentes e fluxos com testes automatizados existentes, checagem de tokens/contraste e inspeção visual em Web, Android e iOS. Fazer usabilidade moderada em protótipo/build para descobrir ações e avaliar o gesto antes de habilitá-lo; registrar a decisão e condição real de lançamento. Validar toque, teclado, VoiceOver/TalkBack, texto ampliado, landscape/tablet e redução de movimento. A preferência estética não substitui sucesso das tarefas.

## Risks / Trade-offs

- [Mudar tokens afeta telas que usam estilos literais ou significados antigos] → migrar por componentes/telas, procurar usos remanescentes e revisar estados claros/escuros por plataforma.
- [Novo detector de swipe disputa com scroll/drag/refresh ou retorno do sistema] → deixar desligado antes da avaliação; limitar região, arbitrar gestos e não ativar se as tarefas regredirem.
- [Proteção de edição deixa sair do fluxo preso em alerta ou perde conteúdo] → interceptar apenas rotas dirty, bloquear descarte no envio e verificar continuar, descartar, sucesso e falha.
- [Animações tornam listas lentas ou escondem refresh] → animar somente as superfícies necessárias, manter listas montadas e conferir conteúdo/rolagem em aparelhos.
- [Ícone de instalação recebe arredondamento duplicado] → separar logo em tela de máscara da plataforma e revisar SVG fonte e assets exportados.
- [Um estado visual depende somente de cor ou movimento] → combinar forma/texto/foco, nome acessível e alternativa operável sem gesto.
- [Mudanças visuais extensas dificultam identificar regressão] → entregas por etapa com inspeção e fluxo de regressão dedicado em Web, Android e iOS.

## Migration Plan

1. Estabilizar o sistema semântico e sua cobertura de componentes.
2. Migrar shell, login, Minhas bandas e navegação compartilhada; conferir login e troca de bandas.
3. Migrar repertório, detalhe/editor/leitura e então shows/calendário/setlist.
4. Migrar banda/convites/conta/denúncia e estados vazios/de erro; revisar a marca e assets de plataforma.
5. Integrar proteção de saída, retorno, preservação de estado, transições nativas e preferência de redução de movimento.
6. Validar a suíte automatizada pertinente e fazer revisão visual/acessível manual por plataforma.
7. Realizar o piloto de usabilidade. Manter swipe desativado até aprovação; habilitar apenas após cumprir critérios e validar build. Se reprovado, registrar resultado e concluir sem o recurso.

**Rollback:** reverter por etapa de tela/componente; aliases antigos de token só são removidos após zero consumidores. Transição e gesto próprios podem ser desligados sem alterar rotas, APIs ou dados. Manter controles de navegação visíveis durante rollback; o estado de edição não deve depender de animação.

## Open Questions

Nenhuma decisão bloqueadora permanece. A ativação do gesto de deslize está condicionada à avaliação especificada, não a uma decisão de design pendente.
