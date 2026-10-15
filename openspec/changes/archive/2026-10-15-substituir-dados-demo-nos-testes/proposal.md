# Proposal

## Why

O catálogo `demoRepositoryData`, criado para a primeira versão navegável sem Supabase, tornou-se uma dependência compartilhada dos testes. Seu carregamento implícito e a cópia de registros completos escondem os dados relevantes de cada cenário, dificultam mudanças no domínio e mantêm infraestrutura demonstrativa sem finalidade atual no produto.

## What Changes

- Substituir o catálogo por fábricas tipadas de entidades e composições pequenas de cenários, com dados novos por chamada, relações explícitas, IDs previsíveis e relógio controlado quando necessário.
- Tornar obrigatórios os repositórios e a identificação do usuário nos testes que usam `TestAppProviders`, eliminando o carregamento implícito de bandas, integrantes e conteúdo.
- Migrar todos os consumidores diretos e indiretos dos dados demonstrativos, incluindo testes de domínio, consultas, telas, navegação e protótipos preservados no projeto.
- Reorganizar os repositórios em memória como auxiliares exclusivos de teste e simplificar comportamentos que apenas reproduzem regras do banco, preservando os fluxos necessários às telas e aos hooks.
- Manter verificações de permissões, integridade e concorrência nos testes do Supabase; preservar verificações de mapeamento e erros nos testes dos adaptadores.
- Remover `demoRepositoryData`, `demoIds`, `createDemoRepositories`, seus exports e os testes que verificam somente a consistência do catálogo, após migrar as verificações funcionais pertinentes.
- Ajustar a cobertura para medir código de produto, excluindo somente os auxiliares identificados como exclusivos de teste e mantendo o limite de 80% nas quatro métricas.
- Documentar o padrão de criação de cenários e a fronteira entre produto e infraestrutura de teste.

## Capabilities

### New Capabilities

Nenhuma. Esta change é uma refatoração da infraestrutura e dos dados dos testes automatizados.

### Modified Capabilities

Nenhuma. Os requisitos funcionais existentes permanecem vigentes. A change declara `skip_specs: true` para dispensar deltas de especificação.

## Impact

- Inclusão de fábricas, cenários e auxiliares de repositório em `src/testing/`.
- Migração de `src/data/in-memory/` e remoção de `src/data/demo/` após resolver seus consumidores.
- Atualização de `src/testing/TestAppProviders.tsx`, arquivos de teste, `jest.config.js` e documentação de arquitetura e testes.
- Uso dos contratos atuais de `src/domain/` e das suítes existentes em `src/data/supabase/__tests__/` e `supabase/tests/`.
- Sem novas dependências obrigatórias, migrações de banco ou mudanças nas interfaces públicas do aplicativo.

## Non-Goals

- Alterar regras de negócio, navegação, telas ou comportamento de produção.
- Modificar o seed da banda “Banda Demo”, seus geradores ou os dados cadastrados nos ambientes Supabase.
- Exigir acesso a desenvolvimento ou produção para executar testes de unidade e componentes.
- Remover protótipos preservados ou criar um novo framework de testes e uma réplica completa do backend.
