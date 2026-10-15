# Design

## Context

Consulte `proposal.md` para a motivação e o escopo. A inspeção identificou 23 arquivos de teste que importam `src/data/demo/` diretamente, além de `TestAppProviders`, que fornece o catálogo completo quando `repositories` não é informado. Outros consumidores dependem indiretamente desse padrão. Em `SongEditorScreen-test.tsx` e `repertoireCollectionQueries-test.tsx`, registros são construídos por cópia de músicas demonstrativas, herdando conteúdo e estados não declarados no cenário.

`AppProviders` já aceita `repositories` e `currentUserId`, portanto a migração pode usar a injeção existente. Os contratos estão em `src/domain/`. Os repositórios em memória estão em `src/data/in-memory/` e incluem consultas simples e uma implementação extensa das mutações de coleções, com validações e controle de revisão próprios.

O projeto já testa os adaptadores Supabase com respostas simuladas e executa migrações, testes pgTAP e uma verificação de concorrência em banco local no CI. `jest.config.js` coleta cobertura de `src/**/*.{ts,tsx}`, incluindo atualmente dados e auxiliares exclusivos de teste. Nenhuma alteração de requisito funcional é necessária; `specs` foi dispensado por `skip_specs: true`.

## Goals / Non-Goals

**Goals:**

- Fazer com que os dados relevantes ao comportamento verificado sejam identificáveis na preparação de cada teste.
- Impedir que catálogo, usuário ou conteúdo apareçam por fallback implícito do provedor.
- Manter independência entre testes e resultados previsíveis de datas, identificadores e mutações simuladas.
- Usar o mesmo contrato de domínio do produto sem transformar os auxiliares em outra implementação completa do backend.
- Preservar a proteção funcional das suítes e tornar comparável a cobertura de código de produto.

**Non-Goals:**

- Criar geração aleatória, um framework genérico de construção de dados ou uma nova camada de persistência do produto.
- Unificar representações de domínio, linhas do Supabase e registros SQL em uma única fábrica.
- Usar o seed promocional como fonte de dados dos testes automatizados.
- Condicionar a migração a uma quantidade fixa de testes ou manter verificações exclusivas de um catálogo que deixará de existir.

## Decisions

### 1. Fábricas tipadas com valores mínimos e objetos novos

As fábricas ficarão em `src/testing/factories/`, agrupadas por domínio. Serão criadas somente as necessárias aos consumidores existentes: bandas e integrantes, músicas e letras, coleções e vínculos, shows e itens da setlist.

Cada fábrica retornará uma entidade do contrato vigente, sem casts que escondam campos obrigatórios. Identificadores e vínculos necessários à relação serão explícitos; demais campos terão valores neutros válidos e poderão ser sobrescritos pelo teste. Uma música básica terá letra vazia e estado `missing`, sem artista, duração ou anotações adicionais.

Cada chamada criará também novas listas e estruturas internas. Não haverá entidades mutáveis exportadas, contador global nem dependência do relógio real para construir o cenário. Quando a execução precisar gerar IDs ou revisões, o contexto daquele cenário fornecerá uma sequência e um relógio determinísticos.

**Alternativas consideradas:** copiar objetos completos em cada teste aumenta a repetição e dificulta acompanhar mudanças do modelo; copiar o catálogo para `src/testing` preserva dependências ocultas; geração aleatória adiciona variabilidade desnecessária. Fábricas pequenas reutilizam apenas os detalhes estruturais comuns.

### 2. Cenários compõem somente entidades declaradas

`src/testing/scenarios/` conterá composições pequenas que tenham reutilização real, como uma banda acessível a um usuário com papel informado. O cenário retornará as referências criadas e os repositórios, permitindo ao teste usar `band.id`, `song.id` e `userId` sem procurar registros por posição ou nome em um catálogo.

Um cenário de edição de música terá uma banda, um integrante e a música em edição. Um cenário de isolamento entre bandas declarará duas bandas e seus vínculos. Shows, coleções e letras adicionais existirão somente quando a verificação precisar deles. Listas omitidas na composição serão vazias, sem inclusão de conteúdo demonstrativo.

O teste poderá usar diretamente uma fábrica, um objeto literal ou um mock quando isso for suficiente. Não será criado um helper central com dezenas de flags para representar todos os casos do aplicativo.

**Alternativas consideradas:** um cenário universal torna a preparação curta, mas esconde dependências; obrigar todas as unidades a montar repositórios adiciona trabalho sem valor para funções puras. A composição será usada somente nas integrações que precisem de relações e estado.

### 3. Provedor de teste com dependências explícitas

`TestAppProviders` exigirá `repositories` e `currentUserId`; uma string vazia representará explicitamente o caso sem usuário quando pertinente. O provedor repassará os valores ao mecanismo existente de `AppProviders` e não escolherá uma banda, criará conteúdo ou acessará Supabase como fallback de dados ausentes.

Cada cenário terá instâncias próprias de repositório. A suíte continuará isolando cache, sessão, memória de navegação, relógios e mocks de acordo com o fluxo que exercita. Testes específicos do provedor de produção continuarão verificando seu uso dos adaptadores Supabase.

**Alternativa considerada:** fornecer um repositório vazio por padrão ainda permite omissões silenciosas. Dependências obrigatórias tornam a ausência de preparação verificável pelo TypeScript.

### 4. Repositórios em memória como auxiliares de teste

A implementação em memória será realocada para `src/testing/repositories/`, com imports atualizados e sem reexports nos módulos de dados de produção. Seus contratos continuarão sendo `AppRepositories` e os tipos de domínio existentes.

Serão preservadas consultas e transições de estado necessárias para verificar telas, hooks, atualização e invalidação de cache. Erros como conflito de revisão, falta de permissão e nome duplicado serão preparados explicitamente nos métodos simulados quando o objetivo for verificar a reação da interface.

As verificações que hoje apenas demonstram regras da réplica de coleções serão relacionadas às suítes reais de adaptadores e banco. Uma validação redundante do simulador poderá ser removida depois de confirmar a proteção correspondente no local adequado. Qualquer lacuna relevante será coberta na suíte responsável antes de retirar essa verificação. Não haverá tentativa de simular integralmente RLS, transações ou concorrência em JavaScript.

**Alternativas consideradas:** mocks individuais para todos os métodos tornam fluxos com releitura de estado mais trabalhosos; preservar a réplica completa amplia a manutenção de regras que não são executadas em produção. A solução mantém estado mínimo compartilhado dentro do cenário e respostas de erro específicas no teste.

### 5. Verificações independentes da construção dos dados

| Camada | Preparação | Garantia esperada |
| --- | --- | --- |
| Domínio | Objetos mínimos ou fábricas | Resultado da função e casos de borda |
| Telas e hooks | Cenários pequenos e repositórios injetados | Exibição, interação, requisições e atualização de cache |
| Adaptadores Supabase | Respostas de consultas e RPCs simuladas | Mapeamento, argumentos e propagação de erros |
| Banco | Dados isolados nos testes pgTAP e de concorrência existentes | Permissões, integridade, revisão e atomicidade |

As letras terão construções explícitas para os quatro estados previstos. Ao testar a derivação de estado, o resultado esperado será declarado no teste, sem chamar a própria função sob teste para preparar esse resultado. Testes de mapeamento continuarão declarando a representação remota independentemente da representação de domínio esperada. Entradas propositalmente inválidas poderão ser descritas no próprio teste.

**Alternativa considerada:** derivar automaticamente todo resultado esperado a partir da mesma regra executada pelo produto pode deixar o teste passar com um erro compartilhado entre preparação e execução.

### 6. Cobertura limitada ao produto, com comparação explícita

Após a realocação dos auxiliares, `collectCoverageFrom` excluirá `src/testing/**`. Permanecerão os limites de 80% para statements, branches, functions e lines e as exclusões já justificadas pelo projeto. Módulos de domínio, adaptadores e telas não serão excluídos para acomodar o resultado da refatoração.

A referência inicial e o resultado final serão comparados usando o mesmo conjunto de arquivos de produto, desconsiderando o catálogo removido e os auxiliares identificados como exclusivos de teste. A preservação dos cenários de comportamento será registrada por grupo, independentemente da mudança na quantidade total de testes.

**Alternativa considerada:** manter código de suporte no indicador mistura a execução de simulações com a proteção do produto; comparar somente percentuais globais antes e depois ocultaria a alteração do denominador.

## Risks / Trade-offs

- [Casos dependem de conteúdo herdado que não está evidente] -> Migrar por domínio, explicitar os dados que sustentam cada expectativa e executar as suítes afetadas antes de remover o catálogo.
- [Fábricas retornam estados semanticamente inconsistentes ou compartilham listas internas] -> Usar valores neutros coerentes, construções específicas de letras e verificações focadas de independência de objetos e contexto.
- [IDs ou datas mudam conforme a ordem de execução] -> Exigir identidades relacionadas e manter geradores e relógios restritos a cada cenário.
- [Simplificação do simulador elimina uma proteção útil] -> Confirmar ou acrescentar a verificação no adaptador ou banco antes de retirar o teste redundante; manter verificações da reação da interface com erros explícitos.
- [Mais preparação local torna os testes extensos] -> Compartilhar fábricas e composições somente quando reutilizadas, mantendo os campos relevantes ao comportamento visíveis no teste.
- [A mudança de cobertura parece ganho funcional] -> Registrar comparação sobre arquivos de produto equivalentes e manter as quatro barreiras de 80%.

## Migration Plan

1. Registrar o resultado de referência e os cenários protegidos pelas suítes afetadas, distinguindo testes de catálogo, comportamento do produto e infraestrutura de teste.
2. Criar as fábricas e a composição mínima de banda; migrar `SongEditorScreen-test.tsx` como referência e validar o padrão com a suíte dessa tela.
3. Migrar domínio, consultas, repertório, coleções, shows, calendário, bandas, navegação e protótipos em grupos verificáveis. Criar contextos novos em cada teste que altere estado.
4. Realocar e simplificar os auxiliares em memória, tornando o provedor estrito depois de atualizar todos os consumidores. Remover imports antigos e dados implícitos.
5. Apagar `src/data/demo/` e os módulos antigos de `src/data/in-memory/` depois que não houver consumidores. Atualizar a cobertura e a documentação do padrão.
6. Executar as verificações afetadas, a suíte completa, formatação, lint e tipos. Conferir no CI os testes de qualidade, banco e smoke test Web antes da integração por PR.

A entrega será uma alteração de código e testes pelo fluxo de PR do repositório, sem execução de seeds ou alterações em bancos remotos. Como não altera schema nem dados persistidos, o rollback consiste em reverter a PR completa, preservando em conjunto as fábricas, os consumidores e a configuração de cobertura compatíveis.
