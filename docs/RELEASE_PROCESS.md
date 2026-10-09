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

Os comandos npm de início do Expo, abertura de plataformas, exportação Web e
builds de desenvolvimento/preview executam essa conferência automaticamente
antes de continuar. Todos os perfis EAS também executam `eas-build-pre-install`,
que recusa versões divergentes antes de instalar dependências. O CI mantém a
mesma verificação. Essas conferências comparam os arquivos do checkout; elas
não atualizam um aplicativo já instalado nem comprovam sua compatibilidade nativa.

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

## Rotina de desenvolvimento e manifestos

No desenvolvimento, o Metro pode fornecer código atual a um client instalado
anteriormente. A versão do produto continua definida somente em `app.json`;
manifestos e metadados nativos são cópias geradas ou recebidas pelos clients.
Não editar essas cópias manualmente para fazer os números coincidirem.

1. Alterar a versão com `npm run release:version -- X.Y.Z`, mantendo os
   registros npm sincronizados.
2. Ao mudar de branch ou alterar a configuração/versão, reiniciar o Metro e
   reabrir o projeto pelo launcher/QR atual nos dois clients. Manter uma única
   instância do Metro deste checkout, na porta 8081:

   ```sh
   npm start -- --dev-client --port 8081 --clear
   ```

3. Conferir no console de desenvolvimento o registro `[Setlist: versão]`.
   Ele informa plataforma, versão do código, versão do manifesto, versão
   instalada e build. Divergências vêm acompanhadas de orientação; dados
   indisponíveis aparecem como `null`, sem usar o manifesto como versão nativa.
   O registro é deduplicado para a mesma combinação de dados, não abre LogBox
   nem bloqueia a navegação, e é desativado nos bundles sem `__DEV__`.
4. Se apenas o manifesto estiver antigo, encerrar e reabrir o app pelo Metro
   atual. Se continuar antigo, reconstruir e instalar o development client.
   O iOS incorpora uma configuração em `EXConstants.bundle/app.config`, que
   permanece a do build instalado; recarregar o JavaScript não a modifica.
5. Antes de validar uma nova versão como entrega, instalar clients atualizados
   em Android/iOS ou usar os artefatos fechados do candidato. Verificar no Sobre
   que a versão instalada corresponde à entrega e que o build está disponível.
   Para a Web, verificar versão do código e commit do export.

Alterações somente em JavaScript podem continuar usando o client existente
durante o desenvolvimento. Bibliotecas nativas, plugins ou configuração nativa
exigem reconstrução. Igualdade de versão não comprova compatibilidade nativa:
o número do produto também não substitui a validação dos módulos e do artefato.
Expo Go identifica o código, sem apresentar sua própria versão como Setlist.

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

Os atalhos abaixo passam pelo mesmo script e também exigem `--tag`, checkout
limpo no commit da tag e versões sincronizadas:

```sh
npm run build:production:android -- --tag v1.0.0-rc.1
npm run build:production:ios -- --tag v1.0.0-rc.1
npm run build:validation:android -- --tag v1.0.0-rc.1
```

Não usar `eas build` direto para gerar uma entrega oficial: o hook remoto
confere os arquivos de versão, mas não substitui a conferência local de tag,
commit e checkout limpo. Os comandos npm usam a mesma versão fixa do EAS CLI.

O script solicita no EAS um AAB Android (`production-android`) e um IPA iOS
(`production`). Esses artefatos serão usados na distribuição pelas lojas.
`--apk` usa `production-android-validation` para instalação direta. O envio do
build ao EAS não faz submissão automática às lojas.
As credenciais existentes são congeladas durante o comando; se faltar assinatura,
prepará-la explicitamente antes de repetir. Para usar um EAS CLI já instalado,
definir `EAS_CLI` com seu caminho. Dados resumidos dos jobs ficam em
`release-output/`, ignorado pelo Git; os logs com URLs temporárias não vão à Release.

Os builds podem receber contadores diferentes e continuam na mesma entrega
quando versão e commit são iguais. O retorno do EAS deve conter exatamente um
build identificado para a plataforma/perfil solicitados e com a versão/commit
esperados; qualquer divergência interrompe o script. Conferir também estado
`FINISHED`, assinatura e destino antes de disponibilizar cada arquivo.

Exportar também a Web da mesma tag usando as variáveis públicas de produção:
`SETLIST_RELEASE_COMMIT` deve ser o SHA da tag e `SETLIST_RELEASE_TAG`, seu nome.
Depois, `npm run export:web`. A publicação oficial continua na versão anterior
durante a avaliação do candidato. Não alterar o Supabase de desenvolvimento.

Para validar a primeira versão Web, uma pré-release publicada pode ser enviada
ao domínio público por um disparo manual do workflow `Publicar GitHub Pages`,
informando a tag `vX.Y.Z-rc.N`. O workflow exige a Release não rascunho, a tag
exata, o manifesto correspondente ao commit e builds EAS Android/iOS completos
da mesma versão e commit. As validações nativas podem continuar pendentes nesse
deploy; o manifesto Web permanece como `pending` até a conferência manual. Esse
procedimento substitui o conteúdo público imediatamente pela candidata. A
publicação automática de pré-release continua desativada.

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

O Pages publica automaticamente uma Release estável aprovada, ou pode ser
disparado manualmente com uma tag estável publicada e validada. Para a validação
Web da primeira versão, também aceita disparo manual para uma pré-release
publicada, após conferir o manifesto e os builds móveis; esse deploy coloca a
candidata no domínio público mesmo enquanto as validações nativas estão
pendentes. O deploy estável sempre exige `--ready`, com todas as validações
aprovadas. Um push na `main`, uma Release em rascunho ou a publicação automática
de uma pré-release não atualiza o Pages. O ambiente GitHub `github-pages` deve
permitir tags `v*`. Reexecuções usam a mesma tag e não modificam o release.

## Sobre o Setlist

A tela fica no menu geral, com apresentação do app, identificação da versão,
links legais, notas de versões e acesso ao código-fonte público em
https://github.com/anderson-sillos/setlist. Termos e privacidade continuam
acessíveis no menu e antes do login. A composição usa logo de 40, nome de 20,
títulos e texto de 14 e informações de 13, com margens de 12 e links de pelo
menos 48 de altura. Em telas usuais, o conteúdo cabe sem precisar rolar; a
rolagem permanece disponível quando a tela for menor ou a fonte for ampliada.

### Origem dos dados apresentados

| Campo              | Origem                                                                                                                                                                                                                                                                        |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Versão instalada   | `ExpoApplication.nativeApplicationVersion` do binário Setlist: `versionName` no Android e `CFBundleShortVersionString` no iOS. Só é identificada como instalada quando o módulo nativo e o identificador do Setlist estão disponíveis.                                        |
| Versão do código   | `expo.version` do `app.json` incorporado ao bundle em execução. É o fallback em clients antigos e a identificação do export Web.                                                                                                                                              |
| Código em execução | A mesma versão do `app.json`, exibida adicionalmente quando a versão instalada informada pelo módulo nativo for diferente.                                                                                                                                                    |
| Build              | `ExpoApplication.nativeBuildVersion`: `versionCode` Android ou `CFBundleVersion` iOS. Os perfis de produção recebem o contador do EAS remoto. Sem o módulo, mostrar “Não disponível”.                                                                                         |
| Plataforma         | `Platform.OS`.                                                                                                                                                                                                                                                                |
| Ambiente           | `EXPO_PUBLIC_APP_ENV`: “Produção” quando igual a `production`; “Desenvolvimento” nos demais casos.                                                                                                                                                                            |
| Release            | `Constants.expoConfig.extra.release.tag`, preenchida em `app.config.ts` por `SETLIST_RELEASE_TAG`. Omitida quando ausente.                                                                                                                                                    |
| Commit             | `Constants.expoConfig.extra.release.commit`, preenchido em `app.config.ts` por `EAS_BUILD_GIT_COMMIT_HASH` ou `SETLIST_RELEASE_COMMIT`. Exibir sete caracteres de um SHA válido de 40; omitir quando ausente/inválido. Não representa alterações locais posteriores ao build. |

O manifesto do development client pode manter uma configuração anterior durante
o Fast Refresh. Por isso, `Constants.expoConfig.version` não é usado como versão
do código: o `app.json` faz parte do bundle atual. A identificação do binário
permanece prioritária quando disponível; o fallback não inventa a versão
instalada nem o contador nativo. Expo Go não fornece números do host como se
fossem do Setlist. Os detalhes nativos de um build novo exigem instalar o novo
binário; recarregar o Metro atualiza somente o código em teste.

Referências: [Expo: versões](https://docs.expo.dev/build-reference/app-versions/),
[Expo: hooks de build](https://docs.expo.dev/build-reference/npm-hooks/),
[GitHub: Releases](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases).
