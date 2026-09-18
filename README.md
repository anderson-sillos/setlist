# Setlist

> Organize o show. Acompanhe a letra. Toque no tempo certo.

[![Qualidade](https://github.com/anderson-sillos/setlist/actions/workflows/ci.yml/badge.svg)](https://github.com/anderson-sillos/setlist/actions/workflows/ci.yml)

O **Setlist** é uma aplicação para bandas organizarem repertórios e shows e acompanharem letras sincronizadas durante uma apresentação. A proposta combina preparação colaborativa em Android, iOS e web, operação simples no palco e disponibilidade offline nos aplicativos móveis.

[Abrir prévia do aplicativo](https://anderson-sillos.github.io/setlist/app/) · [Visualizar apresentação](https://anderson-sillos.github.io/setlist/) · [Acompanhar tarefas](openspec/changes/definir-mvp-setlist/tasks.md) · [Mapa das telas](docs/ARQUITETURA_DE_TELAS.md) · [Proposta do MVP](openspec/changes/definir-mvp-setlist/proposal.md) · [Decisões de arquitetura](openspec/changes/definir-mvp-setlist/design.md) · [Handoff do Codex](docs/CODEX_HANDOFF.md)

## Status do projeto

O planejamento do MVP está completo no OpenSpec, com proposal, design, seis especificações e um checklist incremental. O incremento 1 está concluído e o incremento 2 está em revisão funcional. A primeira versão demonstrativa está publicada na web e oferece dados em memória, listas e detalhes responsivos e uma tela de palco com setlist, letra estática e cronômetro manual local.

O progresso detalhado pode ser consultado no [checklist de implementação](openspec/changes/definir-mvp-setlist/tasks.md). Cada caixa marcada corresponde a uma atividade implementada, verificada e registrada em commit.

## O problema

Durante a preparação e a execução de um show, músicos frequentemente precisam combinar informações espalhadas entre mensagens, documentos, anotações e diferentes aplicativos. Isso dificulta:

- organizar a ordem e a duração das músicas;
- compartilhar alterações com toda a banda;
- acompanhar a letra no momento correto;
- manter o material disponível quando a conexão do local é instável.

## Objetivos

O Setlist possui dois objetivos centrais:

1. **Organizar as músicas dos shows**, reunindo repertório, blocos e ordem de execução em uma setlist compartilhada.
2. **Apresentar as letras sincronizadas**, destacando cada linha de acordo com um cronômetro controlado pelo músico.

O aplicativo também deverá oferecer controle de acesso por banda, login social e funcionamento offline para shows baixados previamente.

## Escopo do MVP

| Área          | Comportamento inicial                                                                      |
| ------------- | ------------------------------------------------------------------------------------------ |
| Acesso        | Login com Google ou Apple e participação em uma ou mais bandas                             |
| Permissões    | Papéis de Owner, Editor e Member                                                           |
| Repertório    | Uma versão vigente por música, com arquivamento em vez de exclusão destrutiva              |
| Letras        | Texto estruturado em blocos e linhas, sem cifras ou transposição                           |
| Sincronização | Marcação manual do início de cada linha usando um vídeo visível do YouTube como referência |
| Shows         | Data, horário, local, observações, status e duplicação de shows anteriores                 |
| Setlists      | Blocos nomeados, músicas ordenadas e cálculo de duração                                    |
| Modo palco    | Cronômetro manual e independente por aparelho, letra destacada e controles rápidos         |
| Offline       | Download de pacotes de shows para leitura e apresentação, sem edição offline               |
| Atualizações  | Aviso quando uma música ou um pacote baixado estiver desatualizado                         |

## Fluxo principal

1. Um Owner cria a banda e convida os integrantes por link.
2. Owners e Editors cadastram as músicas e estruturam suas letras.
3. Um vídeo do YouTube é usado como referência para marcar o início de cada linha.
4. A banda cria o show, organiza os blocos e ordena a setlist.
5. Cada músico baixa o show no próprio aparelho.
6. No palco, o músico inicia seu cronômetro e acompanha a letra destacada.
7. A passagem para a próxima música acontece manualmente.

## Arquitetura proposta

```mermaid
flowchart LR
    APP[Aplicação Expo\nAndroid, iOS e web]
    API[Supabase hospedado\nAuth + PostgreSQL + RLS]
    AUTH[SecureStore\nSessão autenticada]
    CACHE[Arquivos JSON\nShows baixados]
    YT[YouTube incorporado\nReferência na edição]

    APP <--> API
    APP --> AUTH
    APP --> CACHE
    YT --> APP
```

### Tecnologias previstas

- **React Native com Expo** para compartilhar a base da aplicação entre Android, iOS e web.
- **Supabase hospedado** para autenticação, PostgreSQL e políticas de acesso com Row Level Security.
- **Google e Apple OAuth** para login social, sem senhas mantidas pelo Setlist.
- **Expo SecureStore** somente para persistir a sessão autenticada.
- **Expo Splash Screen** para a tela de abertura nativa com a identidade visual
  do aplicativo.
- **Arquivos JSON locais** para os pacotes de shows disponíveis offline.
- **Player incorporado do YouTube** apenas como referência durante a sincronização da letra.

SQLite e armazenamento local de músicas não fazem parte do MVP. O modo palco funciona com os tempos já preparados e não depende da reprodução do vídeo.

## Ambiente de desenvolvimento

Este roteiro descreve a configuração necessária para executar o estado atual do projeto. Ele deve ser atualizado no mesmo commit sempre que uma atividade alterar versões, dependências, variáveis de ambiente, comandos ou serviços externos.

### 1. Pré-requisitos

Obrigatórios em qualquer sistema:

- Git;
- Node.js 24;
- npm 11;
- um navegador moderno para executar a versão web.

#### Onde obter os componentes

| Componente              | Necessidade                                                          | Download ou instalação oficial                                                                  |
| ----------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Git                     | Obrigatório                                                          | [Downloads do Git](https://git-scm.com/downloads/)                                              |
| GitHub CLI              | Recomendado para criar e acompanhar PRs pelo terminal                | [Instalação do GitHub CLI](https://cli.github.com/)                                             |
| Node.js 24 LTS          | Obrigatório                                                          | [Downloads do Node.js](https://nodejs.org/en/download)                                          |
| npm 11                  | Obrigatório                                                          | Já acompanha a instalação do Node.js; não precisa ser instalado separadamente                   |
| nvm                     | Recomendado em Linux, macOS e WSL                                    | [Instalação do nvm](https://github.com/nvm-sh/nvm#installing-and-updating)                      |
| Navegador               | Obrigatório para web                                                 | [Chrome](https://www.google.com/chrome/) ou [Firefox](https://www.mozilla.org/firefox/new/)     |
| Visual Studio Code      | Editor recomendado                                                   | [Download do VS Code](https://code.visualstudio.com/Download)                                   |
| Expo Go para Android    | Necessário para testar em aparelho Android                           | [Expo Go para Android e SDK 57](https://expo.dev/go?device=true&platform=android&sdkVersion=57) |
| Expo Go para iOS/iPadOS | Necessário para testar em iPhone ou iPad                             | [Expo Go para iOS e SDK 57](https://expo.dev/go?device=true&platform=ios&sdkVersion=57)         |
| Android Studio          | Opcional; necessário para emulador e ferramentas Android             | [Download do Android Studio](https://developer.android.com/studio)                              |
| Xcode                   | Opcional; necessário para simulador e builds locais de iOS em um Mac | [Xcode no Apple Developer](https://developer.apple.com/xcode/)                                  |
| WSL                     | Opcional; ambiente Linux usado neste projeto no Windows              | [Instalação oficial do WSL](https://learn.microsoft.com/windows/wsl/install)                    |
| Conta Expo              | Gratuita; recomendada para o Expo Go e necessária para usar o EAS    | [Criar conta Expo](https://expo.dev/signup)                                                     |
| Apple Developer Program | Necessário para instalar builds Ad Hoc em iPhone ou iPad             | [Apple Developer Program](https://developer.apple.com/programs/)                                |

O arquivo `.nvmrc` fixa a versão principal do Node.js. O uso do [nvm](https://github.com/nvm-sh/nvm) é recomendado, mas não obrigatório; qualquer instalação compatível do Node.js 24 pode ser usada.

Para usar o VS Code com o projeto no WSL:

1. Instale o VS Code no Windows e marque a opção **Add to PATH** durante a instalação.
2. Instale a extensão oficial [WSL](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-wsl).
3. No terminal WSL, entre na pasta do projeto e execute:

```bash
code .
```

Na primeira execução, o VS Code instalará seu servidor no WSL. O arquivo `.vscode/extensions.json` recomenda também as extensões ESLint e Prettier usadas pela automação do projeto. Mais detalhes estão no [guia oficial do VS Code para WSL](https://code.visualstudio.com/docs/remote/wsl).

Para executar em dispositivos móveis, escolha uma ou mais opções:

- **aparelho Android ou iPhone/iPad:** instale o Expo Go e use a mesma rede do computador ou uma conexão por túnel;
- **emulador Android:** instale o Android Studio, o Android SDK e configure um dispositivo virtual;
- **simulador iOS:** use um Mac com Xcode e o iOS Simulator instalados.

O navegador e um aparelho físico com Expo Go são suficientes para o desenvolvimento inicial. Android Studio, Xcode, Docker, banco de dados local e Supabase local não são necessários nesta etapa.

### 2. Obter o código

Para uma primeira instalação:

```bash
git clone https://github.com/anderson-sillos/setlist.git
cd setlist
```

Para atualizar uma cópia existente com o código já integrado ao GitHub, entre na pasta do projeto e confirme primeiro que não há alterações locais pendentes:

```bash
cd setlist
git status --short
```

O resultado esperado do segundo comando é vazio. Se houver arquivos listados, registre ou preserve essas alterações antes de continuar. Em seguida, atualize a branch principal e reinstale exatamente as dependências do lockfile atualizado:

```bash
git switch main
git pull --ff-only origin main
npm ci
npm run validate
```

O uso de `--ff-only` impede que uma atualização rotineira crie um merge local inesperado. O `npm ci` reconstrói `node_modules`, mas não remove o `.env.local`, que permanece ignorado pelo Git. Ao final, `npm run validate` confirma formatação, lint, tipos e testes no código recebido.

Para trabalhar na implementação em andamento, consulte o PR ativo e troque para a branch correspondente. A branch `main` contém apenas os grupos já concluídos.

### 3. Selecionar o Node.js

Com nvm:

```bash
nvm install
nvm use
```

Confirme as versões antes de instalar as dependências:

```bash
node --version
npm --version
```

O resultado esperado é Node.js `v24.x` e npm `11.x`.

### 4. Instalar as dependências

```bash
npm ci
```

Use `npm ci` para reproduzir exatamente o `package-lock.json`. O comando substitui uma instalação anterior e não deve modificar o arquivo de lock.

Na versão atual, o npm informa alertas moderados em dependências transitivas do Expo. Não execute `npm audit fix --force`: a correção sugerida troca componentes centrais por versões incompatíveis. Alertas altos ou críticos devem bloquear a evolução até serem analisados.

### 5. Variáveis de ambiente

Para desenvolvimento local, copie o modelo do ambiente correspondente:

```bash
cp .env.development.example .env.local
```

No PowerShell, use `Copy-Item .env.development.example .env.local`. Para testar produção localmente, substitua pelo modelo `.env.production.example`. Nunca versione o arquivo `.env.local` preenchido.

| Variável                               | Uso                                               |
| -------------------------------------- | ------------------------------------------------- |
| `EXPO_PUBLIC_APP_ENV`                  | Ambiente explícito: `development` ou `production` |
| `EXPO_PUBLIC_SUPABASE_URL`             | URL HTTPS do projeto Supabase do ambiente         |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Chave pública usada pelo cliente                  |

Use dois projetos Supabase hospedados distintos: um para desenvolvimento e outro para produção. Copie de cada painel a **Project URL** e a **Publishable key** para o arquivo do mesmo ambiente. Não use `NODE_ENV` para selecionar arquivos `.env`, pois o Expo também controla essa variável durante exportações.

Para conferir a conexão com o projeto selecionado, execute:

```bash
npm run supabase:check -- development
npm run supabase:check -- production
```

O comando consulta o endpoint de configurações do Supabase usando somente a URL e a chave publicável. Ele não aceita nem procura `service_role`, `sb_secret` ou outra credencial administrativa. As variáveis dos builds EAS devem ser cadastradas no painel do projeto para os ambientes `development` e `production`; o arquivo `eas.json` apenas seleciona o ambiente e fixa `EXPO_PUBLIC_APP_ENV`.

As migrações e os testes de banco ficam em `supabase/`. Com Docker instalado, inicie o banco local, reaplique o schema e execute os testes pgTAP:

```bash
npx --yes supabase@latest start
npx --yes supabase@latest db reset --local
npm run supabase:test
npm run supabase:lint
```

`supabase:test` executa a suíte pgTAP de acesso e integridade. `supabase:lint` verifica somente o schema público da aplicação e falha em erros; a extensão pgTAP local fica fora desse lint porque suas funções auxiliares são específicas da infraestrutura de testes. Alterações de schema devem ser feitas nas migrações, não diretamente no banco remoto.

### Configurar o login social no Supabase

A tarefa 5.1 conecta Google e Apple ao cliente Expo, mas cada projeto Supabase
precisa receber as credenciais dos provedores antes de o login real funcionar.
Faça essa configuração no painel de cada ambiente, sem colocar segredos no Git:

1. Em **Authentication → Providers**, habilite **Google** e **Apple** e informe
   as credenciais emitidas por cada provedor. O endereço de callback cadastrado
   no Google e na Apple é o callback do Supabase:
   `https://<project-ref>.supabase.co/auth/v1/callback`.
2. Em **Authentication → URL Configuration**, defina a URL web do ambiente e
   adicione os retornos permitidos usados no desenvolvimento:
   `http://localhost:8081/auth/callback` e `setlist://auth/callback`.
   O endereço HTTPS definitivo do aplicativo será acrescentado na tarefa 11.5.
3. Mantenha `EXPO_PUBLIC_SUPABASE_URL` e
   `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` no `.env.local` ou nos ambientes EAS
   correspondentes. Client IDs podem ser públicos no aplicativo, mas client
   secrets, chaves privadas Apple e tokens nunca devem ser versionados.

Depois de configurar os provedores, inicie a aplicação e abra **Menu geral →
Entrar**. O fluxo usa PKCE, cria um `state` por tentativa e rejeita retornos
com `state` ausente ou diferente. Ao abrir um link `/invite/<token>`, o token é
levado até o retorno OAuth sem ser salvo como conteúdo do aplicativo. No
navegador, o retorno troca o `code` por uma sessão; no Android e iOS, o
`WebBrowser` abre o provedor e devolve o resultado à aplicação.

Para validar o retorno nativo com o esquema `setlist://`, use um development
build ou build interno. O Expo Go pode abrir as telas, mas não representa todos
os comportamentos de deep link e credenciais nativas dos provedores sociais.

### Publicar as migrações nos projetos hospedados

As migrações em `supabase/migrations/` são a fonte de verdade do banco. Depois de revisar o grupo 4 e validar o banco local, publique primeiro no projeto Supabase de desenvolvimento e somente depois no projeto de produção. O comando `db push` aplica apenas as migrações ainda ausentes no histórico remoto; ele não recria nem apaga o banco.

Autentique a CLI uma vez, usando uma conta com acesso aos projetos, e informe a senha do banco somente quando a CLI solicitar, sem incluí-la em comandos ou arquivos versionados:

```bash
npx --yes supabase@latest login
```

Faça uma prévia e publique no projeto de desenvolvimento:

```bash
npx --yes supabase@latest link --project-ref <PROJECT_REF_DESENVOLVIMENTO>
npx --yes supabase@latest db push --linked --dry-run
npx --yes supabase@latest db push --linked
npx --yes supabase@latest db lint --linked --schema public --fail-on error
```

Após validar o schema e os fluxos no ambiente de desenvolvimento, repita o processo para produção, trocando o projeto vinculado:

```bash
npx --yes supabase@latest link --project-ref <PROJECT_REF_PRODUCAO>
npx --yes supabase@latest db push --linked --dry-run
npx --yes supabase@latest db push --linked
npx --yes supabase@latest db lint --linked --schema public --fail-on error
```

Depois de cada publicação, confira a conexão pública do ambiente correspondente:

```bash
npm run supabase:check -- development
npm run supabase:check -- production
```

Não execute `db reset --local` apontando para um projeto hospedado, não use `--include-seed` nesses ambientes e não aplique alterações manualmente pelo Table Editor. O `seed.sql` habilita pgTAP somente no banco local; produção e desenvolvimento hospedados devem receber apenas as migrações versionadas. Se o `dry-run` indicar divergência de histórico, interrompa a publicação e revise o projeto antes de usar opções como `--include-all`.

Para conferir a conexão usando diretamente as variáveis cadastradas no EAS, sem criar um arquivo local, execute:

```bash
npm run supabase:check:eas -- development
npm run supabase:check:eas -- production
```

O script chama `eas env:exec` e repassa o ambiente ao mesmo verificador local. O EAS CLI precisa estar autenticado na conta que possui o projeto Expo. Para conferir apenas se as variáveis foram cadastradas, use `npx --yes eas-cli@latest env:list --environment development` ou o equivalente para `production`. Não use opções que imprimam valores sensíveis nos logs.

Consulte a [documentação de variáveis de ambiente do Expo](https://docs.expo.dev/guides/environment-variables/) para detalhes sobre carregamento e perfis de build.

A tela inicial ainda pode ser executada sem essa configuração porque não acessa o backend. Quando uma integração remota solicitar as variáveis, `src/config/environment.ts` valida tipos e valores e informa somente os nomes inválidos, sem incluir chaves ou seus conteúdos na mensagem de erro.

Valores `EXPO_PUBLIC_*` ficam visíveis no aplicativo compilado. A URL e a chave publicável do Supabase foram criadas para uso no cliente, mas segredos administrativos — especialmente uma `service_role` — nunca podem usar esse prefixo nem ser incluídos no aplicativo. Não adicione arquivos `.env` reais ao Git; somente exemplos sem valores sensíveis podem ser versionados.

### 6. Executar a aplicação

Inicie o servidor do Expo:

```bash
npm start
```

No terminal interativo do Expo, use `w` para navegador, `a` para Android ou `i` para o simulador iOS. Também é possível abrir diretamente uma plataforma:

```bash
npm run web
npm run android
npm run ios
```

A rota inicial exibe `Minhas bandas` e permite navegar por Shows, Repertório e Banda usando conteúdo demonstrativo local. As listas usam uma coluna em celulares, duas em tablets e três em telas de computador.

O protótipo técnico do player de referência fica separado da navegação principal. Com a versão web em execução, abra [http://localhost:8081/youtube-prototype](http://localhost:8081/youtube-prototype) para validar o IFrame visível do YouTube, os controles de reproduzir, pausar, buscar dez segundos e a leitura do tempo atual. No Android e no iOS, a mesma rota usa o `react-native-webview` para hospedar o IFrame, enviar comandos pela ponte JavaScript e receber tempo, estado e erros. A validação nativa depende de um aparelho ou simulador e de um build que contenha o módulo nativo.

Durante a validação da tarefa 3.2, o menu lateral possui temporariamente a opção **Player YouTube (protótipo)**. Para acessá-la no celular:

1. Inicie o projeto com `npx expo start --go --lan --clear` quando computador e aparelho estiverem na mesma rede Wi-Fi.
2. Se a rede local não funcionar, use `npx expo start --go --tunnel --clear` e leia o novo QR code.
3. Abra o projeto no Expo Go, toque em **Abrir menu geral** e selecione **Player YouTube (protótipo)**.
4. O player deve aparecer dentro de uma WebView no Android ou no iOS. Reproduza, pause e use os controles de `−10 s` e `+10 s`; confira também o tempo atual e a mensagem exibida para um vídeo indisponível.
5. Para retornar ao aplicativo, toque em **Fechar protótipo**; o botão volta para `Minhas bandas`.

Esse item é provisório e será removido do menu depois da validação da WebView. No navegador, a rota continua disponível diretamente em `/youtube-prototype`.

O comando para iOS requer macOS quando usado com o simulador. Em Linux ou Windows, teste iOS em um aparelho físico com Expo Go ou utilize posteriormente um build remoto apropriado.

### 7. Verificar a instalação

Execute toda a automação de qualidade antes de cada commit:

```bash
npm run validate
```

O comando executa, na ordem, as verificações abaixo:

| Comando                | Verificação                                              |
| ---------------------- | -------------------------------------------------------- |
| `npm run format:check` | Formatação consistente com Prettier                      |
| `npm run lint`         | Regras estáticas do ESLint e configuração oficial Expo   |
| `npm run typecheck`    | Tipos TypeScript sem geração de arquivos                 |
| `npm run test:ci`      | Testes Jest em modo CI, cobertura e limite global de 80% |

Durante o desenvolvimento, use `npm test` para uma execução simples, `npm run test:watch` para acompanhar alterações e `npm run format` para aplicar a formatação.

Quando dependências ou configuração do Expo forem alteradas, valide também a árvore, a compatibilidade e a geração dos pacotes:

```bash
npm ls --depth=0
npx expo install --check
npx expo export --platform all --output-dir dist
npm run export:web -- --output-dir dist
```

O workflow [Qualidade](.github/workflows/ci.yml) repete a instalação limpa, formatação, lint, tipos e testes em cada pull request e em cada envio para `main`. O resultado atual também pode ser consultado pelo selo no início deste README.

### 7.1. Criar um commit e abrir uma PR manualmente

O fluxo abaixo reproduz os comandos usados no projeto para registrar uma atividade e enviá-la ao GitHub. Execute tudo dentro da pasta do projeto. A branch `main` deve permanecer estável; cada atividade deve usar uma branch própria.

#### Preparar a branch

Atualize a base antes de começar uma atividade:

```bash
git status --short --branch
git switch main
git pull --ff-only origin main
git switch -c feat/nome-curto-da-atividade
```

Se a branch já existir, use `git switch feat/nome-curto-da-atividade` e atualize-a com `git pull --ff-only origin feat/nome-curto-da-atividade`. Não continue se `git status --short` mostrar alterações de outra atividade sem antes registrá-las ou preservá-las.

#### Validar e criar o commit

Depois de implementar a atividade, revise os arquivos alterados e execute a automação antes de criar o commit:

```bash
npm run validate
git diff --check
git status --short
```

Adicione somente os arquivos da atividade, confira o que entrará no commit e então registre a alteração:

```bash
git add README.md src/caminho/arquivo.tsx
git diff --cached --check
git diff --cached --stat
git commit -m "tipo: descrição curta da atividade"
```

Use mensagens curtas no padrão `feat:`, `fix:`, `docs:`, `refactor:` ou `test:`. Se a atividade também atualizar o handoff ou o checklist OpenSpec, inclua esses arquivos no mesmo commit.

#### Enviar a branch

Na primeira publicação da branch, configure o rastreamento remoto com `-u`:

```bash
git push -u origin feat/nome-curto-da-atividade
```

Para commits adicionais na mesma PR, use:

```bash
git push origin feat/nome-curto-da-atividade
```

#### Criar a PR pelo GitHub CLI

Autentique o GitHub CLI uma vez na máquina:

```bash
gh auth login
gh auth status
```

Abra a PR apontando para `main`:

```bash
gh pr create \
  --repo anderson-sillos/setlist \
  --base main \
  --head feat/nome-curto-da-atividade \
  --title "tipo: título da atividade" \
  --body "Descreva objetivo, alterações, validações e pendências da revisão."
```

O comando retorna a URL da PR. Também é possível criar a PR pelo botão **Compare & pull request** que aparece na página da branch no GitHub. Em ambos os casos, mantenha a PR aberta para revisão e não faça merge automático.

#### Atualizar e acompanhar a PR

Cada novo commit enviado para a mesma branch atualiza a PR automaticamente. Use estes comandos para conferir a situação:

```bash
gh pr view NUMERO --repo anderson-sillos/setlist
gh pr checks NUMERO --repo anderson-sillos/setlist
gh pr checks NUMERO --repo anderson-sillos/setlist --watch --interval 10
```

Para corrigir título ou descrição sem abrir outra PR:

```bash
gh pr edit NUMERO \
  --repo anderson-sillos/setlist \
  --title "novo título" \
  --body "Descrição atualizada da atividade."
```

Depois da revisão, a integração e o fechamento devem ser feitos explicitamente pelo responsável do projeto. Não exclua a branch nem feche a PR antes da aprovação final.

#### Concluir a PR após a aprovação

Antes de integrar, confirme que a PR está aprovada, que os checks passaram e que a cópia local não possui alterações pendentes:

```bash
gh pr view NUMERO \
  --repo anderson-sillos/setlist \
  --json state,reviewDecision,mergeable,url
gh pr checks NUMERO --repo anderson-sillos/setlist --watch --interval 10
git status --short
```

Com a aprovação registrada, troque para `main` e faça o merge usando squash. Essa opção transforma os commits da atividade em um único commit na branch principal e `--delete-branch` remove a branch local e remota após a integração:

```bash
git switch main
git pull --ff-only origin main
gh pr merge NUMERO \
  --repo anderson-sillos/setlist \
  --squash \
  --delete-branch
```

Finalize atualizando a cópia local e confirme o estado do repositório:

```bash
git pull --ff-only origin main
git fetch origin --prune
git status --short --branch
```

Se a branch local ainda existir depois do comando de merge, remova-a somente após confirmar que o merge foi concluído:

```bash
git branch --delete feat/nome-curto-da-atividade
```

Para abandonar uma PR sem integrá-la, use `gh pr close NUMERO --repo anderson-sillos/setlist --delete-branch` somente após confirmar que nenhum trabalho será aproveitado. O comando de merge e suas opções estão descritos no [manual oficial do GitHub CLI](https://cli.github.com/manual/gh_pr_merge).

### 8. Testar em Android e iOS com Expo Go

O Expo Go permite revisar o aplicativo gratuitamente em um aparelho físico, sem gerar um APK ou um build iOS e sem pagar o Apple Developer Program. Ele abre o projeto servido pelo Metro no computador; portanto, mantenha o terminal do Expo em execução durante todo o teste.

#### 8.1. Usar uma conta Expo individual

Cada revisor deve usar sua própria conta Expo; não compartilhe as credenciais da conta responsável pelo projeto. A conta é gratuita e pode ser criada em [expo.dev/signup](https://expo.dev/signup):

1. O revisor informa seus próprios dados, confirma o e-mail e instala o Expo Go no aparelho.
2. No Expo Go, o revisor entra com a conta que acabou de criar.
3. A pessoa responsável pelo ambiente de desenvolvimento autentica separadamente a linha de comando e confere a conta que possui acesso ao projeto:

```bash
npx expo login
npx expo whoami
```

4. A pessoa responsável inicia o servidor conforme as seções 8.3 ou 8.4 e envia o QR code ou link ao revisor.

No Android, foi validado que uma conta individual integrante da Organização Expo consegue abrir o endereço compartilhado mesmo quando outra conta autorizada iniciou a CLI. No iPhone ou iPad físico, o Expo Go do SDK 57 exige que a conta conectada no aparelho corresponda exatamente à conta da Expo CLI que serve o projeto. Participar da mesma organização não substitui essa verificação.

Para revisar pelo Expo Go no iOS com sua própria conta, o revisor deve executar o projeto em seu computador, autenticar a CLI com essa mesma conta e então abrir o QR code gerado. Não compartilhe senhas ou tokens pessoais para contornar essa restrição. A validação remota do iOS por uma conta diferente da usada na CLI permanece adiada neste incremento.

Não é necessário ter uma conta Apple Developer para executar este roteiro no iPhone ou iPad; ela só é exigida para gerar e distribuir determinados builds iOS assinados.

#### 8.2. Preparar o projeto

Atualize o código e instale as dependências conforme as seções 2 a 5. Depois confirme a integridade da cópia local:

```bash
npm run validate
```

Instale no aparelho a edição atual do Expo Go compatível com o SDK 57 usando os links da tabela de pré-requisitos. Computador e aparelho devem estar com data e horário corretos.

#### 8.3. Iniciar pela rede local

Prefira a conexão LAN porque ela é mais rápida. O computador e o aparelho precisam estar na mesma rede Wi-Fi e a rede deve permitir comunicação entre dispositivos:

```bash
npx expo start --go --lan --clear
```

Mantenha esse terminal aberto. Quando o QR code aparecer:

- **Android:** abra o Expo Go, toque em **Scan QR code** e leia o código exibido no terminal.
- **iPhone ou iPad:** abra o aplicativo **Câmera**, leia o QR code e confirme **Abrir no Expo Go**.

Aguarde a transferência inicial do pacote. Na primeira abertura, aceite a permissão de rede local se o iOS a solicitar.

#### 8.4. Iniciar por túnel quando as redes forem diferentes

Não é obrigatório estar na mesma rede quando o modo túnel é usado. Se o celular estiver no 4G/5G, em outro Wi-Fi, ou se LAN/WSL2/firewall impedir a conexão, interrompa o servidor com `Ctrl+C` e execute:

```bash
npx expo start --go --tunnel --clear
```

Leia o novo QR code. Nesse modo, computador e aparelho precisam apenas de acesso à internet. O tráfego passa pelo ngrok, por isso a carga e as atualizações são mais lentas e dependem da disponibilidade desse serviço. Consulte também a seção [Android físico e WSL2](#android-físico-e-wsl2) se ocorrer `Failed to download remote update` ou `failed to start tunnel`.

#### 8.5. Executar a revisão nas duas plataformas

Repita este checklist em pelo menos um aparelho Android e um iPhone ou iPad:

- abrir a tela **Minhas bandas** e selecionar cada banda demonstrativa;
- navegar entre **Shows**, **Repertório** e **Banda**;
- abrir os detalhes de um show e de uma música;
- conferir os estados de show em preparação, pronto e cancelado;
- confirmar que o modo palco abre para um show pronto e permanece bloqueado para um show cancelado;
- iniciar, pausar, retomar e zerar o cronômetro local no modo palco;
- navegar pela setlist e conferir a letra estática da música;
- testar nas orientações vertical e horizontal e observar se textos e controles permanecem legíveis;
- registrar modelo do aparelho, versão do sistema, resultado e defeitos encontrados no PR.

Para recarregar todos os aparelhos conectados, pressione `r` no terminal do Expo. O Fast Refresh também aplica mudanças salvas automaticamente. Ao terminar, encerre o servidor com `Ctrl+C`. Como os dados atuais são demonstrativos e ficam em memória, reiniciar o aplicativo restaura seu estado inicial.

O Expo Go é adequado para esta revisão antecipada, mas não substitui um aplicativo independente assinado: ele depende do Expo Go e do servidor de desenvolvimento. Recursos futuros que exijam configuração nativa não incluída no Expo Go deverão ser testados em um development build ou build interno. O funcionamento offline planejado para shows também ainda não está implementado.

#### 8.6. Validar o login social e o retorno de convite

Com Google e Apple configurados no projeto Supabase conforme a seção de
provedores, abra **Menu geral → Entrar** e repita o fluxo no navegador e em um
development build Android/iOS:

1. Escolha Google ou Apple e conclua o login no provedor.
2. Confirme que o retorno chega à aplicação e abre `Minhas bandas` quando não
   há convite.
3. Abra um link `/invite/<token>`, entre por um provedor e confirme que a tela
   informa que o convite foi preservado após o retorno.
4. Cancele o login e confirme que a aplicação permanece disponível para tentar
   novamente.
5. Repita o fluxo depois de atualizar a sessão e registre no PR a plataforma,
   navegador/provedor, resultado do retorno e qualquer falha de configuração.

O aceite efetivo do convite e a criação de bandas dependem das tarefas 5.4 e
5.6. Nesta etapa a tela confirma a autenticação e preserva o contexto, sem
consumir o convite.

### 9. Publicar a prévia e gerar builds internos

A prévia web é publicada em [anderson-sillos.github.io/setlist/app/](https://anderson-sillos.github.io/setlist/app/). O workflow [Publicar GitHub Pages](.github/workflows/pages.yml) exporta a aplicação para `/setlist/app`, preserva a apresentação na raiz do site e publica ambas após cada envio para `main`. A variável `EXPO_WEB_BASE_URL` é usada somente nessa exportação para ajustar os caminhos do GitHub Pages; não precisa ser criada no ambiente local.

Para gerar builds internos, autentique a CLI pelo navegador e confirme a conta ativa:

```bash
npx --yes eas-cli@latest login --browser
npx --yes eas-cli@latest whoami
```

A configuração versionada em `eas.json` usa o perfil `preview` com distribuição interna. No Android, o resultado é um APK instalável diretamente. Gere uma plataforma ou as duas:

```bash
npm run build:preview:android
npm run build:preview:ios
npm run build:preview:all
```

Na primeira execução, o EAS solicita a vinculação a um projeto Expo e pode criar as credenciais de assinatura. O build Ad Hoc de iOS requer uma assinatura ativa no Apple Developer Program e pelo menos um iPhone ou iPad registrado. Antes de gerar esse build, registre o dispositivo seguindo o link ou QR code fornecido por:

```bash
npx --yes eas-cli@latest device:create
```

A autenticação fica no perfil local do usuário e as credenciais são administradas pelo EAS; não adicione tokens, certificados, perfis ou chaves ao repositório. Consulte a [documentação de distribuição interna do Expo](https://docs.expo.dev/build/internal-distribution/) para instalar e compartilhar os artefatos.

### 10. Problemas comuns

- **Cache do Metro inconsistente:** execute `npx expo start --clear`.
- **Dependência incompatível com o Expo:** execute `npx expo install --check` e instale pacotes nativos com `npx expo install <pacote>`.
- **Aparelho não encontra o servidor:** no modo LAN, confirme que os dois dispositivos estão na mesma rede, desative temporariamente VPNs que interfiram na rota e verifique se o firewall permite a porta exibida pelo Expo; em redes diferentes, use `npx expo start --go --tunnel --clear`.
- **Expo Go informa versão incompatível:** atualize o aplicativo pela loja, confirme que ele suporta o SDK 57 e reinicie o Metro com `npx expo start --go --clear`.
- **iOS não abre o projeto pela LAN:** em **Ajustes**, autorize o acesso do Expo Go à rede local e leia novamente o QR code com o aplicativo Câmera.
- **Emulador Android não abre:** inicialize o dispositivo virtual no Android Studio e confirme que `adb devices` o lista.
- **Atalho de iOS indisponível:** o iOS Simulator e builds locais para iOS exigem macOS e Xcode.
- **Porta do Expo ocupada:** execute `npx expo start --port 8082` ou escolha outra porta livre.

#### Android físico e WSL2

No modo NAT padrão do WSL2, o navegador do Windows consegue abrir o servidor do WSL por `localhost`, mas um celular na rede não alcança diretamente o endereço privado da máquina virtual. O sintoma no Expo Go pode ser `Failed to download remote update`, mesmo quando a versão web funciona.

A solução rápida é usar um túnel:

```bash
npx expo start --tunnel --clear
```

Na primeira execução, o Expo pode instalar `@expo/ngrok`. O túnel depende de um serviço externo, é mais lento e gera uma URL pública aleatória; use-o somente durante o desenvolvimento e encerre o processo ao terminar. Se aparecer `failed to start tunnel` ou `remote gone away`, consulte o [estado do ngrok](https://status.ngrok.com/) e tente novamente quando a conectividade estiver operacional.

No Windows 11 22H2 ou mais recente, a alternativa permanente recomendada é a rede espelhada do WSL2. Adicione estas opções ao arquivo `%USERPROFILE%\.wslconfig`, preservando outras configurações existentes:

```ini
[wsl2]
networkingMode=mirrored
hostAddressLoopback=true
```

Depois, execute no PowerShell como administrador:

```powershell
wsl --shutdown

New-NetFirewallHyperVRule `
  -Name "ExpoMetro8081" `
  -DisplayName "Expo Metro 8081" `
  -Direction Inbound `
  -VMCreatorId "{40E0AC32-46A5-438A-A0B2-2B479E8F2E90}" `
  -Protocol TCP `
  -LocalPorts 8081
```

Reabra o WSL, confirme que o computador e o celular estão na mesma rede e inicie o Expo pela LAN:

```bash
npx expo start --lan --clear
```

Consulte a [documentação de rede do WSL](https://learn.microsoft.com/windows/wsl/networking#mirrored-mode-networking) para requisitos, firewall e limitações do modo espelhado.

Se uma solução exigir uma mudança permanente no projeto, registre-a também neste roteiro.

## Papéis e permissões

| Papel  | Responsabilidades                                           |
| ------ | ----------------------------------------------------------- |
| Owner  | Administrar a banda, integrantes, papéis e todo o conteúdo  |
| Editor | Editar repertório, letras, sincronizações, shows e setlists |
| Member | Consultar conteúdo, baixar shows e utilizar o modo palco    |

Uma banda pode ter vários Owners, mas o último Owner não pode sair ou perder o papel até promover outro integrante.

## Princípios do produto

- **Confiável no palco:** o show baixado continua disponível sem internet.
- **Fonte única:** cada música possui uma única versão vigente dentro da banda.
- **Atualização consciente:** pacotes locais nunca são trocados silenciosamente antes de uma apresentação.
- **Controle local:** cada músico controla o próprio cronômetro e sua navegação.
- **Segurança por banda:** o backend valida a participação e o papel do usuário em cada operação.
- **MVP simples:** preparação online e execução offline evitam conflitos de edição e infraestrutura local adicional.

## Fora do MVP

- reconhecimento automático da música e de sua posição no áudio;
- sincronização dos cronômetros entre aparelhos;
- edição offline;
- armazenamento ou distribuição de arquivos de áudio;
- histórico de versões e arranjos alternativos;
- cifras e transposição;
- integração com Spotify.

## Estrutura atual

```text
.
|-- .nvmrc                              # Versão principal do Node.js
|-- .agents/skills/                      # Skills locais do OpenSpec
|-- .vscode/extensions.json              # Extensões recomendadas do editor
|-- docs/
|   |-- ARQUITETURA_DE_TELAS.md          # Mapa entre rotas e telas
|   |-- apresentacao.html                # Apresentação HTML em slides
|   `-- CODEX_HANDOFF.md                 # Continuidade entre sessões do Codex
|-- openspec/config.yaml                 # Configuração do OpenSpec
|-- openspec/changes/definir-mvp-setlist/
|   |-- proposal.md                      # Motivação e escopo
|   |-- design.md                        # Decisões e arquitetura
|   |-- specs/                           # Contratos de comportamento
|   `-- tasks.md                         # Plano incremental de implementação
|-- supabase/
|   |-- migrations/                      # Migrações SQL versionadas do backend
|   |-- tests/                           # Testes pgTAP do banco local
|   |-- config.toml                      # Configuração da CLI local
|   `-- seed.sql                         # Extensões e dados exclusivos do banco local
|-- src/
|   |-- app/                             # Entradas de rota do Expo Router
|   |-- components/feedback/             # Mensagens e avisos compartilhados
|   |-- components/ui/                   # Componentes visuais reutilizáveis
|   |-- config/environment.ts            # Leitura e validação tipada do ambiente
|   |-- data/demo/                        # Bandas, repertórios e shows demonstrativos
|   |-- data/in-memory/                   # Repositórios locais para testes e demonstração
|   |-- data/supabase/                    # Cliente Supabase configurado por ambiente
|   |-- domain/                          # Entidades e contratos independentes da infraestrutura
|   |-- features/bands/                  # Minhas bandas e integrantes
|   |-- features/calendar/               # Calendário mensal e feriados
|   |-- features/navigation/             # Infraestrutura compartilhada de navegação
|   |-- features/repertoire/             # Lista e detalhes das músicas
|   |-- features/shows/                  # Lista e detalhes dos shows
|   |-- features/stage/                  # Seleção, palco e cronômetro manual
|   |-- providers/                       # Contexto de dados e cache de consultas
|   `-- theme/                           # Tokens e breakpoints responsivos
|-- .env.development.example             # Modelo do projeto Supabase de desenvolvimento
|-- .env.production.example              # Modelo do projeto Supabase de produção
|-- .github/workflows/ci.yml             # Qualidade contínua no GitHub
|-- .github/workflows/pages.yml          # Exportação e publicação do site e da prévia
|-- app.config.ts                        # Base web variável para publicação em subdiretório
|-- app.json                             # Configuração de Android, iOS e web
|-- eas.json                             # Perfil de builds internos Android e iOS
|-- scripts/check-supabase-connection.mjs # Verificação pública por ambiente
|-- scripts/check-supabase-eas.mjs       # Verificação usando variáveis do EAS
|-- eslint.config.js                     # Regras estáticas do projeto Expo
|-- jest.config.js                       # Testes e cobertura mínima
|-- package.json                         # Dependências e comandos do projeto
`-- README.md
```

Para consultar o estado do planejamento pelo OpenSpec instalado no ambiente:

```bash
openspec status --change definir-mvp-setlist
```

## Próximas etapas

- concluir as migrações de músicas, shows, convites e políticas de acesso do Supabase;
- adicionar backend e funcionalidades em incrementos revisáveis;
- conduzir o piloto com uma banda após as validações técnicas e jurídicas.

## Apresentação

A apresentação pode ser aberta pela [visualização publicada no GitHub Pages](https://anderson-sillos.github.io/setlist/). O arquivo-fonte autossuficiente está em [`docs/apresentacao.html`](docs/apresentacao.html) e possui layout responsivo para navegadores de computadores, Android, iPhone e iPad. Use as setas do teclado, os botões na tela ou gestos horizontais para navegar; a impressão do navegador gera uma versão em PDF com um slide por página.
