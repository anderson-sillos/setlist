# Proposal

## Why

Dados compartilhados da banda podem mudar em outro aparelho enquanto o cache local continua válido indefinidamente. Integrantes precisam conseguir atualizar listas e detalhes sem provocar consultas frequentes ou recarregar informações que não estão usando.

## What Changes

- Adicionar atualização manual às telas online de integrantes, repertório, músicas, shows e setlists.
- Usar gesto de puxar para atualizar em listas móveis e uma ação visível equivalente na web e em telas de edição onde o gesto conflitaria com a interação principal.
- Atualizar apenas as consultas relevantes à tela ativa, preservando conteúdo visível durante o carregamento.
- Ao retornar a uma tela, permitir atualização condicionada à idade dos dados, sem polling e sem invalidação ampla do cache.
- Incluir uma janela mínima entre atualizações automáticas para evitar leituras repetidas durante navegação rápida.

## Capabilities

### New Capabilities

- `shared-data-refresh`: atualização sob demanda e direcionada de dados compartilhados em todas as telas online da banda.

### Modified Capabilities

Nenhuma. A capacidade de atualização sob demanda é transversal e será descrita em um contrato próprio.

## Impact

- Telas de banda, repertório e shows que usam TanStack Query.
- Componentes comuns de lista, cabeçalho e atualização para iOS, Android e web.
- Chaves e políticas de cache React Query; nenhuma mudança de schema ou dependência externa.
