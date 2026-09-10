## 1. Fundação executável multiplataforma

- [x] 1.1 Criar a aplicação Expo com TypeScript e Expo Router e verificar a inicialização em web, Android e configuração de build para iOS
- [x] 1.2 Instalar e fixar versões compatíveis das dependências aprovadas e verificar que a instalação limpa termina sem conflitos
- [x] 1.3 Configurar variáveis de ambiente tipadas para desenvolvimento e produção e verificar que valores ausentes produzem erro legível sem expor segredos
- [x] 1.4 Configurar formatação, lint, verificação de tipos e testes unitários e verificar todos os comandos em uma instalação limpa
- [x] 1.5 Criar tokens visuais, componentes básicos e regras responsivas com áreas seguras e verificar uma tela de catálogo em celular, tablet e computador
- [x] 1.6 Configurar integração contínua para tipos, lint e testes e verificar uma execução bem-sucedida no GitHub
- [x] 1.7 Criar no README um roteiro reproduzível do ambiente de desenvolvimento, vincular o acompanhamento das tarefas e verificar as instruções; manter o roteiro atualizado quando a implementação alterar requisitos, configuração ou comandos

## 2. Primeira versão navegável para revisão

- [x] 2.1 Definir contratos de domínio e repositórios desacoplados do Supabase e verificar testes unitários com implementações em memória
- [x] 2.2 Criar dados de demonstração coerentes para banda, repertório, show, setlist e letras e verificar que podem ser carregados sem conexão com backend
- [x] 2.3 Implementar a navegação inicial com `Minhas bandas`, Shows, Repertório e Banda e verificar todos os caminhos usando os dados de demonstração
- [x] 2.4 Implementar listas e detalhes básicos de músicas e shows em modo somente leitura e verificar adaptação para celular, tablet e computador
- [x] 2.5 Implementar uma primeira tela de palco com letra estática, setlist e cronômetro manual local e verificar iniciar, pausar, retomar e reiniciar
- [x] 2.6.1 Publicar a prévia web e verificar acesso e navegação pelas telas em um navegador externo
- [x] 2.6.2 Gerar o build interno Android pelo EAS e verificar que o processamento termina com status `FINISHED`
- [x] 2.6.3 Instalar o build interno em um aparelho Android físico e verificar a navegação pelas telas disponíveis
- [x] 2.6.4 Registrar o adiamento do build e do acesso remoto no iOS, mantendo a plataforma no escopo futuro do produto
- [x] 2.6.5 Discutir os pontos de ajuste e melhoria observados na revisão e separar os itens funcionais daqueles que devem seguir para a revisão de UX/UI da tarefa 2.7
- [x] 2.6.6 Consolidar o relatório da primeira revisão funcional com as decisões tomadas e verificar a aprovação explícita antes de concluir o grupo 2.6
- [x] 2.7 Conduzir uma revisão de UX/UI da primeira versão navegável em celular, tablet e computador e registrar ajustes priorizados de navegação, hierarquia visual, legibilidade, áreas de toque, contraste e estados de interface antes do próximo incremento; manter a revisão específica do modo palco adiada para 8.9
- [x] 2.8 Implementar a navegação responsiva aprovada com cabeçalhos fixos, barra inferior móvel, menu lateral e preservação do estado de cada seção e verificar rotas principais, detalhes e edição nos três modos de layout
- [x] 2.9 Atualizar com dados de demonstração as listas e detalhes de bandas, repertório e shows, incluindo busca, filtros, ordenação, durações e calendário mensal, e verificar rolagem, estados vazios e permissões aparentes
- [ ] 2.10 Evoluir os contratos e dados demonstrativos da setlist para anotações de planejamento, separadores e cálculo de duração e verificar reordenação conceitual, totais e ausência desses itens no modo palco
- [ ] 2.11 Implementar os componentes compartilhados de carregamento, erro, indisponibilidade, conexão e mensagens temporárias e aplicar o guia de tom e voz com testes de acessibilidade e variações controladas
- [ ] 2.12 Validar as melhorias em celular, tablet e computador, publicar nova prévia web e build interno Android e aguardar aprovação antes de encerrar o grupo de UX/UI

## 3. Validação antecipada dos riscos técnicos

- [ ] 3.1 Criar um protótipo mínimo do YouTube IFrame no navegador e verificar player visível, play, pause, busca e leitura do tempo atual
- [ ] 3.2 Executar o mesmo protótipo em WebView Android e iOS e verificar ponte JavaScript, origem/referer, controles e comportamento de vídeos indisponíveis
- [ ] 3.3 Prototipar o relógio baseado em tempo real e verificar retomada após perda de foco, bloqueio e chamada em Android e iOS
- [ ] 3.4 Prototipar rotas de convite e retorno OAuth com URLs de desenvolvimento e verificar preservação de parâmetros no navegador, Android e iOS
- [ ] 3.5 Registrar os resultados dos protótipos no design e verificar que qualquer limitação descoberta foi refletida nas tarefas afetadas antes de continuar

## 4. Fundação do backend e segurança

- [ ] 4.1 Configurar projetos Supabase separados para desenvolvimento e produção e verificar conexão usando apenas URL e chave pública por ambiente
- [ ] 4.2 Criar migrações para perfis, bandas, participações e aceites de termo e verificar chaves, restrições e exclusões previstas
- [ ] 4.3 Criar migrações para músicas com letra JSONB e estados de sincronização e verificar validações de estrutura e timestamps do servidor
- [ ] 4.4 Criar migrações para shows, blocos e itens de setlist de música, planejamento ou separador e verificar tipos, ordem, referências, descrições, durações, observações e estados permitidos
- [ ] 4.5 Criar migrações para vários convites ativos com rótulo opcional e funções transacionais de aceite e verificar uso único, revogação e expiração padrão de sete dias
- [ ] 4.6 Implementar funções e gatilhos para último Owner, estados somente leitura, anonimização e atualização de timestamps e verificar cada regra com testes de integração
- [ ] 4.7 Implementar RLS com negação por padrão para Owner, Editor, Member e pessoa externa e verificar uma matriz automatizada de leitura e escrita por papel
- [ ] 4.8 Executar todas as migrações do zero em ambiente isolado e verificar que o schema e a suíte de segurança são reproduzíveis

## 5. Autenticação, bandas e integrantes

- [ ] 5.1 Integrar autenticação Google e Apple com Supabase e verificar entrada, retorno e renovação de sessão em web, Android e iOS
- [ ] 5.2 Implementar persistência de sessão com SecureStore nos aplicativos e armazenamento do navegador na web e verificar restauração e expiração segura
- [ ] 5.3 Implementar `Minhas bandas`, busca por nome, próximo show, seleção e restauração da última banda autorizada e verificar o fluxo sem banda, a criação e a entrada exclusivamente por link de convite
- [ ] 5.4 Implementar criação de banda condicionada ao aceite explícito do termo e verificar o registro de usuário, banda, versão e horário do servidor
- [ ] 5.5 Implementar integrantes agrupados por papel e administração por Owner e verificar ordenação, identificação do próprio usuário, confirmações e ausência de controles para Editor e Member
- [ ] 5.6 Implementar criação simultânea, rotulagem opcional, compartilhamento, confirmação, revogação e renovação de convites e verificar os fluxos autenticado, não autenticado, expirado e já utilizado
- [ ] 5.7 Implementar promoção e saída de integrantes e verificar que a banda nunca fica sem Owner fora da exceção de exclusão da banda pelo único integrante
- [ ] 5.8 Implementar exclusão de conta e exclusão de banda restrita ao único integrante, anonimização e limpeza local e verificar os casos de integrante comum, Owner substituível, banda com outros integrantes e único integrante
- [ ] 5.9 Executar testes ponta a ponta dos papéis e convites nas três plataformas e publicar uma versão interna para revisão desse incremento

## 6. Repertório e letras estáticas

- [ ] 6.1 Implementar lista rolável, busca, filtros agrupados, ordenações, detalhes orientados à letra, criação e edição online de músicas e verificar metadados, referência externa do YouTube, permissões e campos obrigatórios por papel
- [ ] 6.2 Implementar o editor de letra com blocos e linhas identificáveis e reordenáveis e verificar persistência atômica do documento completo
- [ ] 6.3 Implementar a classificação Sem letra, Letra estática, Sincronização incompleta e Sincronizada e verificar todos os estados com testes unitários
- [ ] 6.4 Exigir aceite do termo vigente antes da primeira edição de cada Owner ou Editor e verificar que leitura e modo palco continuam disponíveis sem aceite
- [ ] 6.5 Implementar arquivamento e restauração de músicas e verificar preservação em shows existentes e exclusão das opções para novas setlists
- [ ] 6.6 Implementar atualização da música com horário gerado pelo servidor e verificar que apenas o conteúdo vigente fica visível
- [ ] 6.7 Validar o repertório com Owner, Editor e Member em celular, tablet e web, incluindo cabeçalho fixo, blocos expandidos, edição indisponível offline e atualização relativa, e publicar uma versão interna para revisão

## 7. Shows e setlists

- [ ] 7.1 Implementar lista rolável, busca, filtros, ordenação, duração, calendário mensal, detalhes, criação e edição online de shows e verificar padrão de próximos eventos, feriados nacionais locais, campos, estado inicial Rascunho e permissões
- [ ] 7.2 Implementar duplicação de show e verificar cópia independente de blocos, músicas, anotações de planejamento, separadores, ordem e observações
- [ ] 7.3 Implementar criação, nomeação e reordenação de blocos por alça e verificar a existência do bloco Principal em novos shows
- [ ] 7.4 Implementar uma única ação de inclusão, seleção múltipla de músicas, anotações de planejamento, separadores e reordenação de itens dentro e entre blocos e verificar observações específicas e repetições sem alterar a música do repertório
- [ ] 7.5 Calcular duração de blocos e do show pela soma dos tempos informados de músicas e planejamento e verificar composição, ausência total de estimativa e atualização imediata durante edição
- [ ] 7.6 Implementar transições Rascunho, Pronto e Cancelado e verificar leitura, edição, prévia, execução e download permitidos em cada estado
- [ ] 7.7 Implementar a lista não bloqueante de problemas ao tornar um show Pronto e verificar músicas sem letra, estáticas, incompletas e sincronizadas
- [ ] 7.8 Atualizar o timestamp do show ao alterar dados ou setlist e verificar as mudanças por testes de integração
- [ ] 7.9 Executar o fluxo completo de preparação de um show nas três plataformas, incluindo salvamento explícito e confirmação de saída com alterações pendentes, e publicar uma versão interna para revisão

## 8. Modo palco conectado ao conteúdo real

- [ ] 8.1 Substituir os dados de demonstração do modo palco pelos repositórios reais e verificar abertura de Rascunho online e Pronto online
- [ ] 8.2 Implementar cronômetro independente com pausa, retomada, mais ou menos cinco segundos e reinício e verificar a máquina de estados com testes unitários
- [ ] 8.3 Implementar destaque e rolagem da linha atual somente para letras Sincronizadas e verificar leitura manual para os demais estados
- [ ] 8.4 Implementar tempo, duração, observação do item, prévia e troca manual de música e verificar que nenhum comando altera a setlist compartilhada
- [ ] 8.5 Implementar preferências de fonte, tema, orientação e tela ativa e verificar aplicação sem reiniciar o cronômetro
- [ ] 8.6 Implementar recuperação após perda de foco e encerramento do processo e verificar os fluxos Retomar e Reiniciar sem início silencioso
- [ ] 8.7 Implementar bloqueio manual contra toques com desbloqueio por pressão prolongada e verificar que cronômetro e rolagem continuam ativos
- [ ] 8.8 Implementar indicadores discretos de conexão e conteúdo e verificar que nenhum diálogo cobre a letra durante a execução
- [ ] 8.9 Realizar a revisão de UX/UI e o ensaio guiado do modo palco em celular, tablet e computador e registrar ajustes antes do próximo incremento

## 9. Sincronização manual com YouTube

- [ ] 9.1 Integrar o player validado à edição da música em web, Android e iOS e verificar visibilidade, controles, origem e indisponibilidade
- [ ] 9.2 Implementar a ponte de estado e amostragem do tempo atual e verificar precisão suficiente em reprodução, pausa e busca
- [ ] 9.3 Implementar marcação do início da linha por toque e verificar gravação do tempo observado em milissegundos
- [ ] 9.4 Implementar correção manual e validação de ordem dos tempos e verificar que inconsistências mantêm Sincronização incompleta
- [ ] 9.5 Garantir que o player pare ao deixar a tela e verificar ausência de download, extração, reprodução oculta ou em segundo plano
- [ ] 9.6 Executar o fluxo completo de sincronizar uma música e reproduzi-la no modo palco nas três plataformas e publicar uma versão interna para revisão

## 10. Pacotes offline em Android e iOS

- [ ] 10.1 Definir e validar o schema do pacote autocontido de show e verificar serialização de dados, setlist, planejamento, separadores, letras, tempos, observações e timestamp
- [ ] 10.2 Implementar geração e download somente para shows Prontos e verificar rejeição de Rascunhos, Cancelados e solicitações na web
- [ ] 10.3 Implementar armazenamento persistente e substituição atômica e verificar preservação do pacote anterior quando download ou gravação falha
- [ ] 10.4 Implementar cálculo e consulta de `content_updated_at` e verificar os estados Conteúdo atualizado, Atualização disponível e Verificação pendente
- [ ] 10.5 Implementar abertura e modo palco sem conexão e verificar um show completo em modo avião no Android e no iOS
- [ ] 10.6 Implementar remoção manual e limpeza por logout, perda de participação ou cancelamento e verificar cada condição após reconexão
- [ ] 10.7 Implementar validação de integridade e descarte de pacote corrompido e verificar bloqueio com orientação para novo download
- [ ] 10.8 Executar um ensaio offline prolongado em Android e iOS e publicar uma versão interna para revisão do fluxo móvel completo

## 11. Consolidação e piloto

- [ ] 11.1 Executar a suíte completa de unidade, componentes, integração RLS, Maestro e Playwright e verificar que todos os cenários críticos passam
- [ ] 11.2 Revisar acessibilidade, responsividade, desempenho e consistência do tom de voz em celular, tablet e computador e registrar e corrigir bloqueios de uso
- [ ] 11.3 Redigir termo de responsabilidade, política de privacidade e procedimento de remoção e verificar revisão jurídica antes de qualquer distribuição pública
- [ ] 11.4 Configurar monitoramento de banco, tráfego e usuários ativos e verificar alertas internos ao atingir 80% das cotas do Supabase
- [ ] 11.5 Configurar ambientes, URLs, associações de links e credenciais definitivas e verificar que nenhum segredo ou chave administrativa está no cliente
- [ ] 11.6 Gerar candidato a piloto para web, distribuição interna Android e TestFlight e verificar instalação, login, preparação e modo palco em cada plataforma
- [ ] 11.7 Conduzir o piloto com uma banda, registrar problemas e decisões e verificar que revisões aprovadas foram incorporadas ou planejadas antes do lançamento seguinte
