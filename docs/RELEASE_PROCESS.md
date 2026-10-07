# Processo de versões e Releases do Setlist

## Identificação comum

`app.json` → `expo.version` é a fonte da versão do produto para Android, iOS e Web.
Usar três números (`X.Y.Z`): correção incrementa `Z`, funcionalidade incrementa
`Y` e uma mudança incompatível incrementa `X`. A primeira versão pública é
`1.0.0`. Os sufixos de validação pertencem às tags (`v1.0.0-rc.1`), mantendo
`expo.version` como `1.0.0` para as lojas.

```sh
npm run release:version -- 1.0.0
npm run release:check
```

O primeiro comando atualiza `app.json`, `package.json` e as duas entradas de
versão do `package-lock.json`, preservando as dependências. O CI rejeita versões
divergentes. Registrar a entrega no `CHANGELOG.md` e abrir uma PR; a `main` exige
alterações por PR, com os checks aprovados. Fazer commit, push e operações GitHub
com acesso elevado, conforme `AGENTS.md`.

Os contadores técnicos são independentes: `android.versionCode` e
`ios.buildNumber` são mantidos pelo EAS (`appVersionSource: remote`). Os perfis
de produção incrementam automaticamente; o perfil de simulador não incrementa.
Conferir e inicializar os contadores acima das versões já usadas nas lojas antes
do primeiro build. Nunca reduzir um contador para igualar as plataformas.

```sh
npx --yes eas-cli@23.2.0 build:version:get --platform all --profile production --json
npx --yes eas-cli@23.2.0 build:version:set --platform android --profile production
npx --yes eas-cli@23.2.0 build:version:set --platform ios --profile production
```

## Candidato de validação

1. Integrar a PR da preparação com o CI aprovado.
2. Escolher o commit da `main` que contém a entrega e criar uma tag anotada
   `vX.Y.Z-rc.N`. Confirmar o SHA remoto; nunca mover uma tag já usada.
3. Abrir um checkout isolado e limpo da tag. Gerar todos os builds a partir dele,
   usando o ambiente EAS `production`.

```sh
git fetch origin main --tags
git tag -a v1.0.0-rc.1 origin/main -m 'Setlist 1.0.0 — candidato 1'
git push origin refs/tags/v1.0.0-rc.1
git worktree add /private/tmp/setlist-v1.0.0-rc.1 v1.0.0-rc.1
```

Instalar as dependências no checkout isolado com `npm ci`. Nele:

```sh
npm run release:check -- --tag v1.0.0-rc.1
npm run release:build -- --tag v1.0.0-rc.1 --platform all
npm run release:build -- --tag v1.0.0-rc.1 --platform android --apk
```

O script solicita no EAS um AAB Android (`production-android`) e um IPA iOS
(`production`). Esses artefatos serão usados na distribuição pelas lojas.
`--apk` usa `production-android-validation` para instalação direta. O envio do
build ao EAS não faz submissão automática às lojas.
As credenciais existentes são congeladas durante o comando; se faltar assinatura,
prepará-la explicitamente antes de repetir. Para usar um EAS CLI já instalado,
definir `EAS_CLI` com seu caminho. Dados resumidos dos jobs ficam em
`release-output/`, ignorado pelo Git; os logs com URLs temporárias não vão à Release.

Os builds podem receber contadores diferentes e continuam na mesma entrega
quando versão e commit são iguais. Conferir estado `FINISHED`, versão, commit,
perfil, assinatura e destino antes de disponibilizar cada arquivo.

Exportar também a Web da mesma tag usando as variáveis públicas de produção:
`SETLIST_RELEASE_COMMIT` deve ser o SHA da tag e `SETLIST_RELEASE_TAG`, seu nome.
Depois, `npm run export:web`. A publicação oficial continua na versão anterior
durante a avaliação do candidato. Não alterar o Supabase de desenvolvimento.

## Registro da Release

Criar inicialmente uma Release em rascunho com a tag do candidato. Incluir:

- Versão, commit, resumo das mudanças e limitações conhecidas.
- Builds EAS Android/iOS, respectivos contadores, perfis e links.
- APK de instalação direta quando disponível; arquivo Web de validação quando
  distribuído. O AAB e IPA são os candidatos efetivos das lojas.
- `release-manifest.json`, checksums SHA-256 dos arquivos anexados e evidências
  de validação de cada plataforma.
- Migrações da entrega e estado dos canais de distribuição: preparação,
  validação, enviado para revisão ou disponível.

```sh
npx --yes eas-cli@23.2.0 build:view ID_ANDROID --json > /private/tmp/android-build.json
npx --yes eas-cli@23.2.0 build:view ID_IOS --json > /private/tmp/ios-build.json
npm run release:manifest -- --tag v1.0.0-rc.1 --android /private/tmp/android-build.json --ios /private/tmp/ios-build.json
```

O manifesto elimina os logs temporários do EAS e recusa código, versão, perfil
ou estado incompatíveis. Inicialmente, cada `validation` é `pending`. Alterar
para `passed` somente após conferir o artefato efetivo, registrando responsável,
data e evidências nas notas da Release. Se só existir APK, o registro parcial é
permitido, mas o fechamento da distribuição Android exigirá o AAB validado.

```sh
gh release create v1.0.0-rc.1 --verify-tag --draft --prerelease --title 'Setlist 1.0.0 — candidato 1' --notes-file /private/tmp/release-notes.md
gh release upload v1.0.0-rc.1 release-output/release-manifest.json
```

Publicar uma pré-release apenas quando ela estiver pronta para os participantes
da validação. Não registrar como versão final uma entrega com pendências.

## Aprovação e publicação estável

Concluir as validações funcionais Android/iOS/Web e os itens operacionais, legais
e de preparação das lojas do grupo 11. Criar `v1.0.0` apontando ao mesmo commit
do candidato aprovado. Uma correção de código exige outro candidato, novos
builds e novas conferências; preservar os candidatos anteriores.

```sh
npm run release:manifest -- --tag v1.0.0 --manifest release-output/release-manifest.json --ready
```

O fechamento confere AAB Android, IPA iOS e validação Web com a mesma versão e
commit. Anexar o manifesto e os artefatos aprovados à Release estável em rascunho,
então publicá-la. As lojas têm processos de distribuição próprios; atualizar as
notas com seu estado real, sem declarar disponibilidade antes da confirmação.

O Pages de produção reage somente a uma Release estável publicada ou ao disparo
manual com uma tag estável já publicada. Ele obtém o código pela tag, confere o
manifesto e publica `release.json` no site. Um push na `main`, um rascunho ou uma
pré-release não publica produção. O ambiente GitHub `github-pages` deve permitir
tags `v*`. Reexecuções usam a mesma tag e não modificam o release.

## Sobre o Setlist

A nova tela fica no menu geral, com apresentação do app, versão, build nativo,
plataforma, ambiente e commit quando registrado. O binário fornece seus números
reais; Expo Go e clients antigos não exibem o número do host como versão Setlist.
Na Web, versão e commit vêm do export daquela tag. Termos e privacidade continuam
acessíveis no menu, antes do login e na tela Sobre. Os detalhes de um build novo
exigem instalar o novo binário.

Referências: [Expo: versões](https://docs.expo.dev/build-reference/app-versions/),
[GitHub: Releases](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases).
