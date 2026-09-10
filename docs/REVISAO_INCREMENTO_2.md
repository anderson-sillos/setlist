# Primeira revisão funcional — Incremento 2

## Identificação

- Data: 9 de setembro de 2026.
- Escopo: tarefas 2.1 a 2.6 do change `definir-mvp-setlist`.
- Branch revisada: `feat/reviewable-app`.
- Status: parecer consolidado aprovado explicitamente em 9 de setembro de 2026; implementação das melhorias autorizada.
- Prévia web: [anderson-sillos.github.io/setlist/app/](https://anderson-sillos.github.io/setlist/app/).
- Publicação: [workflow Publicar GitHub Pages](https://github.com/anderson-sillos/setlist/actions/runs/34299605998).
- Projeto EAS: [@anderson-silloss-team/setlist](https://expo.dev/accounts/anderson-silloss-team/projects/setlist).
- Android: [build interno `5b090592`](https://expo.dev/accounts/anderson-silloss-team/projects/setlist/builds/5b090592-0a81-4118-827a-23e9216d3fa7) concluído, instalado e navegado com sucesso.
- iOS: build e acesso remoto pelo Expo Go com a conta do revisor adiados para uma etapa futura.

## Objetivo da revisão

Confirmar que a primeira versão navegável permite avaliar a estrutura do produto antes das integrações externas. Nesta etapa, todos os dados permanecem em memória e nenhuma operação depende de Supabase, YouTube ou armazenamento offline.

## Cenários avaliados

| Cenário                                                       | Plataforma ou evidência                     | Resultado |
| ------------------------------------------------------------- | ------------------------------------------- | --------- |
| Abrir `Minhas bandas` e carregar duas bandas sem backend      | Pré-renderização web e testes de componente | Aprovado  |
| Navegar entre Shows, Repertório e Banda                       | Testes de rotas e componentes               | Aprovado  |
| Consultar listas responsivas em celular, tablet e computador  | Testes dos três modos de layout             | Aprovado  |
| Abrir detalhes de show e música sem controles de edição       | Testes de componente                        | Aprovado  |
| Exibir show com blocos, músicas, observações e item arquivado | Dados demonstrativos e testes               | Aprovado  |
| Abrir o modo palco de show disponível                         | Teste de componente e exportação web        | Aprovado  |
| Bloquear o modo palco para show cancelado                     | Teste de componente                         | Aprovado  |
| Iniciar, pausar, retomar e reiniciar o cronômetro             | Teste do hook com relógio controlado        | Aprovado  |
| Manter dois cronômetros independentes                         | Teste com duas instâncias do hook           | Aprovado  |
| Acessar e navegar pelas telas pelo endereço web público       | Revisão funcional no navegador              | Aprovado  |
| Gerar, instalar e navegar pelo build interno Android          | EAS Build e aparelho Android físico         | Aprovado  |
| Gerar e instalar build interno iOS                            | EAS Build e aparelho iOS físico             | Adiado    |
| Abrir remotamente no Expo Go iOS com a conta do revisor       | Expo Go em aparelho iOS físico              | Adiado    |

## Evidências automatizadas

- `npm run validate`: formatação, lint e tipos aprovados; 8 suítes e 53 testes aprovados.
- Cobertura: 99,6% de statements, 99,58% de linhas, 100% de funções e 83,24% de branches.
- `npx expo export --platform all --output-dir dist`: configuração de Android, iOS e web exportada sem erro.
- `npm run export:web -- --output-dir dist`: nove rotas estáticas geradas, incluindo detalhes e modo palco.
- `openspec validate definir-mvp-setlist --type change --strict`: artefatos OpenSpec válidos.
- O endereço público retornou a tela `Minhas bandas`, e o bundle JavaScript referenciado retornou HTTP 200.

## Observações da revisão

- O conteúdo é propositalmente demonstrativo e reinicia ao recarregar a aplicação.
- Listas e detalhes são somente leitura; criação e edição pertencem aos incrementos posteriores.
- A tela de palco exibe letra estática e não sugere sincronização temporal inexistente.
- O cronômetro é local e não compartilha estado entre músicos ou abas.
- O fallback do GitHub Pages permite que o Expo Router recupere rotas dinâmicas no navegador; a URL raiz da apresentação continua inalterada.
- O build Android foi concluído pelo EAS com status `FINISHED`, instalado em um aparelho físico e validado quanto à navegação entre as telas disponíveis.
- No iOS físico, o Expo Go exige correspondência exata entre a conta autenticada na Expo CLI e a conta conectada no aparelho. O acesso remoto usando a conta individual do revisor não foi validado.
- A geração de um build interno iOS também não foi concluída e será retomada futuramente, sem retirar iOS do escopo do produto.
- Os pontos de ajuste e melhoria observados foram discutidos e separados entre requisitos funcionais e diretrizes de UX/UI. A revisão específica do modo palco foi adiada por decisão do responsável pelo produto para a tarefa 8.9.
- A revisão não valida ainda player do YouTube, retomada do relógio após interrupções do sistema, OAuth, Supabase ou pacotes offline. Esses riscos continuam planejados a partir do Incremento 3.

## Melhorias funcionais confirmadas

### Repertório e música

- Mostrar o repertório em lista vertical rolável com busca por título ou artista.
- Usar um seletor compacto para os filtros agrupados Todas, Pendentes, Sincronizadas e Arquivadas. Pendentes reúne Sem letra, Letra estática e Sincronização incompleta.
- Ordenar por Título, padrão A–Z, Artista/Banda, atualização mais recente ou maior duração.
- Mostrar título, artista, duração e estado em linhas alinhadas, sem o rótulo redundante de duração; manter tonalidade e BPM nos detalhes.
- Priorizar a letra nos detalhes, apresentar todos os blocos expandidos e ocultar tempos por linha fora do editor de sincronização.
- Exibir a última atualização em formato relativo e abrir externamente a referência do YouTube na consulta.

### Shows, planejamento e setlist

- Mostrar a duração estimada na lista e no detalhe do show, com composição entre músicas e planejamento e totais por bloco.
- Somar somente durações informadas e não apresentar aviso de duração parcial. Quando nenhum tempo existir, usar traço na lista e `Duração não informada` no detalhe.
- Permitir várias anotações de planejamento independentes, com descrição livre e duração opcional, visualmente distintas das músicas.
- Permitir separadores exclusivamente visuais, sem texto, duração ou participação nos cálculos.
- Manter planejamento e separadores fora das etapas e cronômetros do modo palco.
- Usar uma única ação de inclusão para novo bloco, música, anotação ou separador e aceitar seleção múltipla de músicas.
- Permitir repetição da mesma música, reordenação de blocos e movimentação de itens dentro e entre blocos por alças.
- Manter as alterações locais durante a edição e persistir todas por salvamento explícito, confirmando antes de descartar mudanças pendentes.

### Consulta e calendário de shows

- Mostrar Shows em lista rolável com busca por nome ou local, uma ação compacta agrupando filtros por período e estado, com `Todos` como primeira opção de cada grupo, e ordenação por data, nome ou duração.
- Abrir por padrão os próximos shows em Rascunho ou Pronto, pela data mais próxima, deixando Cancelados acessíveis pelos filtros.
- Oferecer as visões Lista e Calendário dentro de Shows, sem criar outra opção na barra inferior.
- Usar calendário mensal, abrir no mês atual com hoje selecionado por um contorno completo e arredondado e iniciar a semana no domingo.
- Marcar datas com shows por fundo próprio, manter um marcador, indicar quantidade quando houver mais de um e listar os eventos do dia abaixo do mês.
- Exibir filtros e ordenação somente na visão Lista; no Calendário, mostrar todos os shows ativos do mês sem herdar filtros ocultos.
- Usar fundos distintos para finais de semana, hoje e feriados; centralizar os números e mostrar o nome do feriado somente após selecionar a data, mantendo essa informação disponível para tecnologias assistivas.
- Calcular os feriados localmente, sem API, visão semanal ou anual e sem integração com calendários externos no MVP.

### Bandas, integrantes e convites

- Tornar `Minhas bandas` uma lista rolável com busca por nome, sem filtros, destacando a última banda e ordenando as demais alfabeticamente.
- Mostrar o papel do usuário e o próximo show de cada banda; usar `Nenhum próximo show` quando aplicável.
- Oferecer somente `Criar banda`; a entrada por convite ocorrerá exclusivamente ao abrir o link recebido, sem colagem manual nem QR Code.
- Agrupar integrantes por papel, ordenar cada grupo alfabeticamente e não oferecer busca ou filtros.
- Permitir vários convites ativos simultaneamente com rótulo opcional que não identifica nem restringe o destinatário.
- Exigir confirmação para promoção a Proprietário e remoção de integrante.
- Permitir excluir a banda somente quando o Proprietário solicitante for seu único integrante.

## Diretrizes de UX/UI confirmadas

### Navegação responsiva

- Usar cabeçalho fixo em todas as telas administrativas e limitar cada cabeçalho a uma ação contextual principal.
- No celular e no tablet em retrato, usar uma barra inferior compacta e com largura total para Shows, Repertório, Palco e Banda. Manter os botões com largura compacta uniforme, centralizados nos dois eixos e distribuídos horizontalmente com o mesmo espaço livre entre eles e nas duas extremidades, evitando contato com as bordas; Palco abre a seleção de shows antes da execução.
- No tablet em paisagem e no computador, manter o menu lateral visível e ocultar a barra inferior.
- Mostrar o menu nas telas principais e substituí-lo por voltar nos detalhes.
- Manter a barra inferior nos detalhes em consulta e ocultá-la em criação, edição, autenticação, convite e modo palco.
- Preservar a pilha, os filtros, a ordenação e a rolagem de cada seção.
- Fazer as mudanças de rota sem animação automática, mantendo a animação horizontal somente na abertura e no fechamento do menu lateral.
- Fazer o menu entrar horizontalmente pela esquerda e permitir o gesto lateral para abri-lo somente nas telas principais; nos detalhes, reservar o gesto para voltar.

### Estados de interface

- Usar esqueletos no primeiro carregamento e indicadores discretos nas atualizações em segundo plano.
- Diferenciar conteúdo realmente vazio de busca ou filtro sem resultado e oferecer no máximo uma ação permitida pelo papel do usuário.
- Oferecer nova tentativa quando o primeiro carregamento falhar e preservar dados já visíveis quando somente a atualização falhar.
- Preservar edições após falha de salvamento e mostrar a mensagem próxima da ação correspondente.
- Exibir uma faixa compacta de falta de conexão abaixo do cabeçalho, manter conteúdo carregado somente para leitura e atualizar automaticamente ao reconectar.
- Usar mensagens temporárias não bloqueantes para sucesso e desfazer; reservar diálogos para ações destrutivas.
- Comunicar estados por texto e disponibilizar o mesmo significado a leitores de tela.

### Tom de voz

- Adotar linguagem geral informal, breve e bem-humorada, ligada a música, ensaio, palco e bastidores.
- Manter duas ou três variações controladas para mensagens rotineiras, sem alterar seu significado ou a ação indicada.
- Preservar botões com nomes objetivos.
- Não usar humor em exclusões, remoções, termos legais, privacidade, corrupção ou perda de conteúdo, permissões e segurança.
- Manter exemplos e regras editoriais em `docs/GUIA_DE_TOM_E_VOZ.md`.

## Pendências mantidas

- Revisar o modo palco quando sua implementação funcional for iniciada, dentro da tarefa 8.9.
- Retomar build e validação física no iOS em etapa futura.
- Implementar as melhorias aprovadas com dados de demonstração nas tarefas 2.8 a 2.12 antes de avançar para os riscos técnicos.
- Implementar e validar as melhorias aprovadas nas tarefas 2.8 a 2.12, mantendo o PR aberto para revisão antes do encerramento do grupo.

## Parecer

O acesso e a navegação pela versão web foram aprovados. O build interno Android foi gerado, instalado e navegado com sucesso. Build e acesso remoto no iOS permanecem explicitamente adiados para uma etapa futura e continuam como risco conhecido, sem alterar a compatibilidade iOS definida para o produto.

As subtarefas 2.6.1 a 2.6.6 e a revisão de UX/UI 2.7 estão concluídas. Este relatório foi aprovado explicitamente em 9 de setembro de 2026. A revisão do modo palco foi transferida para 8.9, e a implementação das melhorias está organizada nas tarefas 2.8 a 2.12.

Durante a tarefa 2.12, a navegação inferior, os filtros, as linhas das listas e o calendário receberam uma nova rodada de ajustes. A tarefa permanece aberta e essas alterações exigem nova revisão explícita antes de serem consideradas concluídas.
