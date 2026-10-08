# Acompanhamento de segurança das dependências

## Revisão de 7 de outubro de 2026

A revisão parte da `main` após a integração da PR #30, no commit
`c75e55c88ac52cdd27b80a9048df918882084118`. A PR atualizou
`shell-quote` para corrigir o alerta crítico #12. Os alertas #9, #10 e #11
continuam abertos; nenhum deles tem versão corrigida publicada segundo os
avisos consultados. Este registro não representa aceitação de risco para o
release estável.

### Correção disponível

| Pacote        | Versão anterior | Versão no lockfile | Aviso                                                                              | Situação                                             |
| ------------- | --------------- | ------------------ | ---------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `shell-quote` | `1.10.0`        | `1.12.0`           | [GHSA-pqg4-j6r4-53mv](https://github.com/advisories/GHSA-pqg4-j6r4-53mv) — crítico | Integrado à `main` pela PR #30; alerta #12 encerrado |

O aviso descreve injeção de comandos em `quote()` quando uma string com quebra
de linha segue um token de comentário. A versão corrigida indicada pelo aviso é
`1.11.0`; a revisão usa `1.12.0`, publicada no npm. O pacote entra por
`react-native` → `react-devtools-core` → `shell-quote`.

`react-devtools-core` aceita `shell-quote@^1.6.1`, portanto a atualização cabe no
intervalo já declarado. A comparação do lockfile confirmou alteração apenas em
`node_modules/shell-quote`: versão, URL de distribuição e integridade. A versão
do aplicativo continua `1.0.0`. Para instalar a árvore corrigida, usar `npm ci`;
uma instalação anterior em `node_modules` não é atualizada pela edição do lockfile.

O [alerta #12](https://github.com/anderson-sillos/setlist/security/dependabot/12)
foi conferido como corrigido após a integração da PR #30.

### Avisos ainda sem versão corrigida

| Alerta                                                                   | Pacote no lockfile | Severidade | Intervalo afetado | Entrada na árvore                                                       | Avaliação atual                                                                                 |
| ------------------------------------------------------------------------ | ------------------ | ---------- | ----------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| [#9](https://github.com/anderson-sillos/setlist/security/dependabot/9)   | `node-forge@1.4.0` | Alta       | `<=1.4.0`         | `@expo/cli` e `@expo/code-signing-certificates`                         | Ausente nos source maps dos bundles clientes Android, iOS e Web examinados.                     |
| [#10](https://github.com/anderson-sillos/setlist/security/dependabot/10) | `braces@3.0.3`     | Alta       | `<=3.0.3`         | `micromatch`, usado pela cadeia Expo/Metro e Jest                       | Ausente nos source maps dos bundles clientes Android, iOS e Web examinados.                     |
| [#11](https://github.com/anderson-sillos/setlist/security/dependabot/11) | `sprintf-js@1.0.3` | Moderada   | `<=1.1.3`         | `argparse@1`, via `@istanbuljs/load-nyc-config` na cadeia Jest/Istanbul | Ausente nos source maps dos bundles clientes Android, iOS e Web examinados; sem patch upstream. |

Fontes dos avisos:

- [node-forge — GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv): falha na validação da estrutura de assinaturas RSA PKCS#1 v1.5.
- [braces — GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm): esgotamento da pilha com padrões profundamente aninhados.
- [sprintf-js — GHSA-hp3w-g68c-fv3c](https://github.com/advisories/GHSA-hp3w-g68c-fv3c): negação de serviço com precisão de formatação sem limite.

Os três avisos consultados informam `Patched versions: None`. A versão
`sprintf-js@1.1.3` também está dentro do intervalo afetado; atualizá-la para essa
versão não resolveria o alerta.

### Avaliação de alcance

- `node-forge`: a árvore aponta para `@expo/cli` e
  `@expo/code-signing-certificates`. O CLI usa o pacote em caminhos de
  assinatura de manifests e certificados de desenvolvimento. Não há
  `expo-updates`, configuração `updates` ou uso de assinatura no código do app.
  Os source maps dos bundles clientes das três plataformas confirmam que o
  módulo vulnerável não é incluído nos apps.
- `braces`: chega por `micromatch`, usado por Metro/Expo e Jest para filtrar
  caminhos e globs. Esses consumidores ficam no processo de build/teste; não há
  import direto em `src` ou `scripts`, nem inclusão nos bundles clientes.
  Globs não confiáveis ainda podem afetar processos de ferramenta que os avaliem.
- `sprintf-js`: chega pela cadeia opcional de desenvolvimento
  `jest-expo` → `babel-jest` → `babel-plugin-istanbul` →
  `@istanbuljs/load-nyc-config` → `js-yaml@3` → `argparse@1`. Não é dependência
  direta do app e não é incluído nos bundles clientes. Foi avaliado um override
  para `js-yaml@4.3.2`, já presente na
  árvore, mas o lockfile não foi atualizado; por isso a tentativa foi removida
  do manifesto e não é contabilizada como correção.

### Exposição no CI

- `ci.yml` e `database-tests.yml` são acionados por `pull_request` e declaram
  apenas `contents: read`. Não usam `pull_request_target` nem referenciam
  `secrets.*`. O job Web fornece URL e chave Supabase de placeholder. O código
  da branch é executado por `npm ci`, export, testes e Playwright, então um PR
  ainda pode consumir recursos ou interromper o job; os workflows de PR não
  recebem permissões de escrita ou segredos do projeto.
- `pages.yml` roda após uma Release publicada ou por `workflow_dispatch`, faz
  checkout de uma tag estável e valida tag/manifesto antes do export. Esse fluxo
  tem `pages: write` e `id-token: write`, e usa valores públicos de configuração
  do Supabase. Ele não executa uma branch arbitrária de PR; depende de uma tag
  e ação de release confiáveis.
- A cadeia vulnerável `braces` pode afetar disponibilidade de ferramentas se
  um padrão malicioso chegar a uma operação de glob. `node-forge` requer que um
  fluxo de verificação de assinatura vulnerável seja chamado; nenhum dos
  workflows de CI configura assinatura de código/manifesto. `sprintf-js` fica
  em mensagens de CLI da cadeia de testes, fora do app.

O exame do CI indica impacto possível na disponibilidade de jobs quando
processam conteúdo malicioso de PR, mas não encontrou caminho para incluir esses
pacotes nos clientes nem para expor segredos nos workflows de PR. Isso reduz o
alcance observado; não encerra os alertas nem substitui patch upstream.

Não foram encontrados imports diretos desses três pacotes em `src` ou
`scripts`. Os exports de produção Android/iOS e o bundle cliente Web foram
gerados com source maps em `/private/tmp`; os três source maps não contêm
`node-forge`, `micromatch`, `sprintf-js` ou o caminho `node_modules/braces`. As
únicas ocorrências de `braces` no bundle nativo são nomes de ícones Lucide. O
source map nativo contém um módulo `@expo/cli` de infraestrutura Metro, sem os
módulos de assinatura vulneráveis.

O bundle cliente Web foi gerado com `web.output: "single"` temporariamente para
evitar a renderização HTML estática; `app.json` foi restaurado para
`web.output: "static"`. A exportação estática completa continua pendente, mas a
compilação do bundle cliente e a inspeção do source map foram concluídas. Nenhum
alerta foi fechado manualmente; as dependências continuam no grafo npm e as
ferramentas de build/CI ainda precisam ser consideradas na avaliação de risco.

### Evidência da auditoria

Após a atualização, `npm audit --package-lock-only --json` retornou três avisos
distintos: `braces`, `node-forge` e `sprintf-js`. `shell-quote` deixou de aparecer
no relatório, e a contagem de pacotes críticos passou de 1 para 0.

O relatório ainda contabiliza 51 pacotes com severidade alta e 5 com severidade
moderada, incluindo pacotes dependentes afetados pela mesma cadeia. São 56
registros de pacotes, não 56 avisos independentes. O comando continua retornando
código 1 por causa das vulnerabilidades remanescentes.

Para repetir a consulta:

```bash
npm audit --package-lock-only --json
npm view shell-quote version
npm view node-forge version
npm view braces version
npm view sprintf-js version
```

### Continuidade da tratativa

- A PR #30 foi integrada e seus checks passaram (qualidade/lint/types/tests,
  pgTAP e smoke test Web); o alerta #12 foi encerrado pelo GitHub.
- Manter os alertas #9, #10 e #11 abertos até haver patch oficial ou remoção
  comprovada das dependências vulneráveis. Os bundles clientes não as incluem;
  a revisão dos workflows de CI não encontrou segredos nem permissões de escrita
  nos eventos de PR, mas considerou possível indisponibilidade dos jobs.
- Antes do release estável, repetir `npm audit`, confirmar os bundles do
  candidato de release e revisar a exposição das ferramentas usadas por CI. Se
  não houver patch upstream, registrar uma decisão explícita de aceite de risco
  antes de liberar; esta análise não concede esse aceite.
- Revisar atualizações centrais junto da compatibilidade do Expo 57. A sugestão
  de `npm audit fix --force` pode instalar outra versão principal de React Native
  ou Jest sem resolver todos os avisos.

As atualizações automáticas de segurança do Dependabot foram conferidas como
habilitadas e não pausadas. Elas dependem de uma atualização corrigida que possa
ser resolvida no grafo de dependências. A ausência de `dependabot.yml` não
desabilita esse recurso. Consulte a
[documentação das atualizações de segurança](https://docs.github.com/en/code-security/concepts/supply-chain-security/dependabot-security-updates).
