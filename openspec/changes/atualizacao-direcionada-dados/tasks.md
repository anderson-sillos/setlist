# Tasks

## 1. Infraestrutura de atualização

- [x] 1.1 Criar controles compartilhados para pull-to-refresh nativo, botão web e detalhes sem lista; verificar carregamento, acessibilidade e preservação dos dados existentes por revisão de uso nas plataformas suportadas.
- [ ] 1.2 Criar revalidação ao foco limitada às queries da tela atual e à janela de 60 segundos; verificar que foco recente não busca e foco com cache antigo busca uma vez.

## 2. Aplicação às telas de dados compartilhados

- [ ] 2.1 Aplicar atualização direcionada a Minhas bandas, Banda/integrantes, Repertório e detalhes de música; verificar que papel e integrante novo aparecem após atualizar e que filtros/rolagem permanecem.
- [ ] 2.2 Aplicar atualização direcionada às listas e detalhes de shows, incluindo dados de setlist; verificar que mudanças externas aparecem sem recarregar outras bandas.
- [ ] 2.3 Revalidar papel e opções de repertório ao focar telas de edição sem substituir rascunhos locais; excluir o gesto de puxar do editor de setlist e verificar que arrastar e alterações não salvas permanecem intactos.

## 3. Integração

- [x] 3.1 Revisar os fluxos web e nativos para garantir ausência de polling, atualização em andamento duplicada e consultas a telas inativas; verificar por inspeção das chaves e callbacks das queries.
- [ ] 3.2 Executar a validação estática configurada para o projeto e revisar visualmente a disponibilidade do gesto e botão web nas telas aplicadas.
