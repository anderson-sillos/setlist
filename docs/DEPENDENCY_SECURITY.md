# Acompanhamento de segurança das dependências

## Revisão de 7 de outubro de 2026

A revisão parte da `main` após a integração da PR #29, no commit
`23ffc0a3617756f4a21441580f3f5041603c9016`. A
[PR #30](https://github.com/anderson-sillos/setlist/pull/30), aberta pelo Dependabot
durante esta revisão, reúne a correção disponível e o acompanhamento dos demais
avisos na branch `dependabot/npm_and_yarn/shell-quote-1.12.0`. Este registro não
representa aceitação de risco para o release estável.

### Correção disponível

| Pacote        | Versão anterior | Versão no lockfile | Aviso                                                                              | Situação                                                        |
| ------------- | --------------- | ------------------ | ---------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `shell-quote` | `1.10.0`        | `1.12.0`           | [GHSA-pqg4-j6r4-53mv](https://github.com/advisories/GHSA-pqg4-j6r4-53mv) — crítico | Corrigido no lockfile desta branch; aguarda integração à `main` |

O aviso descreve injeção de comandos em `quote()` quando uma string com quebra
de linha segue um token de comentário. A versão corrigida indicada pelo aviso é
`1.11.0`; a revisão usa `1.12.0`, publicada no npm. O pacote entra por
`react-native` → `react-devtools-core` → `shell-quote`.

`react-devtools-core` aceita `shell-quote@^1.6.1`, portanto a atualização cabe no
intervalo já declarado. A comparação do lockfile confirmou alteração apenas em
`node_modules/shell-quote`: versão, URL de distribuição e integridade. A versão
do aplicativo continua `1.0.0`. Para instalar a árvore corrigida, usar `npm ci`;
uma instalação anterior em `node_modules` não é atualizada pela edição do lockfile.

O GitHub passou a registrar esta vulnerabilidade no
[alerta #12](https://github.com/anderson-sillos/setlist/security/dependabot/12).
O estado no GitHub deve ser conferido novamente após a integração da correção à
branch principal e a atualização do grafo de dependências.

### Avisos ainda sem versão corrigida

| Alerta                                                                   | Pacote no lockfile | Severidade | Intervalo afetado | Entrada na árvore                                                       | Próxima ação                                                                                                |
| ------------------------------------------------------------------------ | ------------------ | ---------- | ----------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| [#9](https://github.com/anderson-sillos/setlist/security/dependabot/9)   | `node-forge@1.4.0` | Alta       | `<=1.4.0`         | `@expo/cli` e `@expo/code-signing-certificates`                         | Acompanhar a correção oficial e revisar as entradas dos fluxos de certificados/assinaturas antes do release |
| [#10](https://github.com/anderson-sillos/setlist/security/dependabot/10) | `braces@3.0.3`     | Alta       | `<=3.0.3`         | `micromatch`, usado pela cadeia Expo/Metro e Jest                       | Acompanhar a correção oficial e revisar a origem dos padrões de busca processados pelas ferramentas         |
| [#11](https://github.com/anderson-sillos/setlist/security/dependabot/11) | `sprintf-js@1.0.3` | Moderada   | `<=1.1.3`         | `argparse@1`, via `@istanbuljs/load-nyc-config` na cadeia Jest/Istanbul | Acompanhar a correção oficial ou uma atualização compatível da cadeia que retire esse pacote                |

Fontes dos avisos:

- [node-forge — GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv): falha na validação da estrutura de assinaturas RSA PKCS#1 v1.5.
- [braces — GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm): esgotamento da pilha com padrões profundamente aninhados.
- [sprintf-js — GHSA-hp3w-g68c-fv3c](https://github.com/advisories/GHSA-hp3w-g68c-fv3c): negação de serviço com precisão de formatação sem limite.

Na conferência, as versões mais recentes publicadas no npm eram `node-forge@1.4.0`,
`braces@3.0.3` e `sprintf-js@1.1.3`; todas permaneciam nos intervalos afetados.
Atualizar `sprintf-js` para `1.1.3` não resolve o aviso.

Não foram encontrados imports diretos desses pacotes em `src` ou `scripts`.
Isso não demonstra ausência de exposição nas ferramentas: o código instalado de
`@expo/code-signing-certificates` chama verificações RSA do `node-forge`. O
alcance dessas entradas ainda requer análise; os três alertas continuam abertos.

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

- Conferir os checks da PR de segurança, que instalam a árvore com `npm ci` e
  executam as verificações de qualidade, banco e smoke test Web existentes.
- Integrar a correção de `shell-quote` após revisão e conferir o encerramento
  automático do alerta #12 no GitHub.
- Manter os alertas #9, #10 e #11 abertos até haver correção, remoção comprovada
  da cadeia vulnerável ou análise documentada que justifique outra classificação.
- Antes do release estável, repetir a auditoria e concluir a avaliação de
  exposição/mitigação das pendências. Esta PR não resolve os três avisos sem patch.
- Revisar atualizações centrais junto da compatibilidade do Expo 57. A sugestão
  de `npm audit fix --force` pode instalar outra versão principal de React Native
  ou Jest sem resolver todos os avisos.

As atualizações automáticas de segurança do Dependabot foram conferidas como
habilitadas e não pausadas. Elas dependem de uma atualização corrigida que possa
ser resolvida no grafo de dependências. A ausência de `dependabot.yml` não
desabilita esse recurso. Consulte a
[documentação das atualizações de segurança](https://docs.github.com/en/code-security/concepts/supply-chain-security/dependabot-security-updates).
