# decode-uri-component 0.5.0 — compatibilidade CommonJS

Esta pasta contém a implementação corrigida de `decode-uri-component@0.5.0`
adaptada somente no formato de exportação para CommonJS.

O Expo Router 57 depende de `query-string@7`, que carrega
`decode-uri-component` com `require()`. A versão oficial corrigida passou a ser
somente ESM, enquanto a atualização direta para `query-string@9` altera a API
consumida pelo Expo Router. O override local preserva a API esperada e incorpora
a correção do alerta `GHSA-vcc3-ghjq-m6fr`.

A implementação e a licença foram mantidas a partir da versão oficial 0.5.0.
Este pacote temporário deve ser removido quando o Expo Router adotar uma cadeia
de dependências compatível com `decode-uri-component@0.5.0` sem adaptação.
