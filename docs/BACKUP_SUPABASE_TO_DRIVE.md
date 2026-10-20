# Backup diário do Supabase para Google Drive

## Estado atual

O destino é uma conta dedicada do Google Drive. O backup é produzido em um
runner efêmero do GitHub Actions e enviado como fluxo, comprimido e cifrado no
cliente pelo `rclone crypt`. O dump não é gravado em arquivo, artefato do
Actions nem log. O runner usa somente arquivos temporários de configuração do
rclone e os remove ao final.

O workflow `.github/workflows/supabase-backup.yml` agenda uma tentativa principal
diária às 06:17 UTC (03:17 em São Paulo) e uma recuperação às 08:37 UTC (05:37
em São Paulo). A recuperação inspeciona a cópia diária no Drive e só repete o
envio se ela não existir ou falhar na validação de integridade. O workflow
permite disparo manual somente na `main`.
O job exige o Environment `production-backup`, token `contents: read`,
checkout da action fixado por SHA e Docker, usado pelo Supabase CLI para executar
`pg_dump`. O Environment aceita deployments apenas da `main` e não permite
bypass administrativo.

Em 20/10/2026, os nomes `RCLONE_CONFIG_B64` e `SUPABASE_DB_URL` foram conferidos
na lista de Secrets do Environment; os valores não foram lidos nem impressos.
Workflow, script, `.github/CODEOWNERS` e este runbook foram integrados pela PR
#49 no commit `da4543d8eaa211314bf1ec1bc40f25d66e064501`. A primeira execução
manual em 20/10/2026 parou na validação do remote rclone: a versão atual não
oferece mais o comando `rclone config get` usado pelo script. A falha ocorreu
antes da conexão ao banco e antes de qualquer envio ao Drive. A PR #50 corrigiu
essa validação, implantou a recorrência diária e definiu retenção de 84 cópias
(12 semanas). A execução manual seguinte, no commit
`1c8043d09a830e45dc945ea2a7eebc3a563ffc25`, concluiu em 20/10/2026; o job
confirmou o envio cifrado, a validação gzip e 1 cópia retida ([execução do
workflow](https://github.com/anderson-sillos/setlist/actions/runs/39365774924)).
O dump foi transmitido em fluxo e não foi salvo localmente. Em 20/10/2026, o
evento automático esperado às 03:17 em São Paulo iniciou somente às 08:47
(atraso de 5h30) e terminou com sucesso às 08:50 ([execução 39417422417](https://github.com/anderson-sillos/setlist/actions/runs/39417422417)).
A execução manual anterior daquele dia também concluiu com sucesso. O histórico
público do GitHub Status não mostra incidente de Actions em 20/10 que explique
o atraso; o GitHub documenta que eventos `schedule` podem atrasar ou ser
descartados sob carga, mas a causa específica desta ocorrência não foi
confirmada. Esta alteração adiciona um horário posterior de recuperação e
suporte a heartbeat externo; o alerta permanece inativo até cadastrar
`BACKUP_HEARTBEAT_URL`. Ainda falta testar uma restauração isolada; não marcar a
tarefa OpenSpec 11.8.4 como concluída até realizar esse ensaio.

## Escopo e limitações

- O job exporta papéis PostgreSQL, schemas `public`, `private` e
  `supabase_migrations`, dados desses schemas e os dados do schema `auth`.
  O Supabase CLI omite schemas gerenciados por padrão; a exportação de dados de
  `auth` é explícita e exclui sessões e outros registros temporários indicados
  no script.
- O job consulta `storage.objects` antes do dump. Se houver qualquer objeto,
  interrompe a rotina para não criar uma cópia incompleta. O armazenamento
  binário do Supabase Storage ainda não faz parte desta rotina.
- Configurações de projeto, provedores e opções de Auth, Edge Functions,
  configurações do Storage, serviços externos e arquivos binários precisam de
  procedimento de recuperação separado.
- A conta está no plano Free; esta rotina não substitui alta disponibilidade,
  backup gerenciado diário nem PITR.

## Secrets e configuração

Cadastrar apenas no Environment `production-backup`:

- `SUPABASE_DB_URL`: URL PostgreSQL do Session Pooler de `setlist-prod`, com a
  senha percent-encoded conforme exigido pelo CLI. Não armazenar em arquivo,
  variável de repositório, issue, chat ou log.
- `RCLONE_CONFIG_B64`: configuração do rclone codificada em Base64, com o remote
  Google Drive `setlist-drive`, o remote criptográfico `setlist-backup` que
  encapsula `setlist-drive:`, criptografia de nomes ligada e as duas senhas
  crypt. Manter essas senhas também no gerenciador de senhas; sem elas, os dados
  cifrados não podem ser recuperados.

O repositório é público. O Environment restringe os Secrets ao deployment pela
`main`; o workflow não tem gatilho `pull_request` e o job só prossegue quando a
referência é `main`. Os arquivos sensíveis estão em `.github/CODEOWNERS`. A
proteção remota exige PR, checks e histórico linear; force-push e atualização
por escrita direta são bloqueados. O administrador não aprova a própria PR; a
regra configurada permite o bypass de revisão somente ao integrar uma PR, sem
bypass de checks ou da exigência de PR. Enquanto o responsável for o único
usuário com escrita, revisar pessoalmente o diff antes de usar esse bypass é a
etapa de revisão. Ao conceder escrita a outra conta, verificar novamente as
regras e exigir revisão do Code Owner para as alterações protegidas. Não
conceder `Maintain` ou `Admin` como substituto.

Como o repositório público pode desativar workflows agendados após 60 dias sem
atividade, verificar periodicamente se o workflow continua habilitado.

### Monitoramento da ausência ou falha do workflow

O workflow pode enviar sinais `start`, sucesso ou falha ao Healthchecks.io. Para
que o alerta independente funcione:

1. Crie no Healthchecks.io um check diário chamado `Setlist Supabase backup`,
   com período de 24 horas, tolerância (grace) de 6 horas e um canal de alerta
   por e-mail configurado. Consulte a [documentação do ping e dos sinais de
   falha](https://healthchecks.io/docs/http_api/).
2. Copie a Ping URL desse check e cadastre-a como secret
   `BACKUP_HEARTBEAT_URL` em **Settings → Environments → production-backup**.
   Não a coloque no repositório, no chat ou em logs.
3. O job envia `/start` ao começar, o ping normal após concluir o backup e
   `/fail` se alguma etapa do job falhar. Se nenhum job agendado iniciar, o
   monitor alerta quando vencer o período e a tolerância configurados.

Sem esse secret, os backups continuam sendo executados, mas o job avisa no log
que o monitor externo não está configurado. A ausência do secret não deve ser
interpretada como monitoramento ativo.

## Execução e retenção

1. Integrar os arquivos por PR após conferir o diff e os checks. Nunca atualizar
   `main` por push direto.
2. Em Actions, executar `Backup diário do Supabase` manualmente na branch
   `main` para validar uma cópia. Para validar o agendamento, conferir uma
   execução com evento `schedule`; disparos manuais não validam o cron.
3. Conferir no resumo do job o resultado de integridade e retenção. O conteúdo
   SQL é enviado por pipe para o remote criptográfico, sem ser impresso.
4. O script valida a cópia ainda em staging por descriptografia e `gzip -t`,
   publica o nome diário após a validação e mantém até 84 cópias diárias, o que
   preserva uma janela de 12 semanas.
5. Se a rotina falhar ou detectar objetos de Storage, não tratar como backup
   concluído; investigar o erro sem copiar dados ou segredos para logs.

## Procedimento de restauração isolada

Use este procedimento para ensaiar a recuperação sem substituir o banco de
produção. O dump é lido do Drive, descriptografado e enviado em fluxo ao banco
de recuperação; não é salvo no Mac nem como arquivo no runner.

### 1. Preparar o destino e um runner protegido

1. O projeto descartável `setlist-restore` foi criado na região `us-west-2`, ref
   `rksthbddfecjpvoxclgo`, PostgreSQL 17.11. `setlist-prod` usa PostgreSQL 17.6;
   ambos estão na mesma versão principal 17. Use um projeto, não uma branch de
   `setlist-prod`: a branch parte do projeto base e pode trazer schema ou dados
   que conflitam com a restauração integral. Não reutilize produção nem um banco
   que contenha dados que precisem ser preservados.
2. Confirme que o projeto recém-criado não recebeu dados da aplicação nem
   outra restauração e configure nele as extensões necessárias. O Supabase já
   cria objetos gerenciados nos schemas `auth` e `storage`; não copie
   configurações de provedores, chaves ou secrets de produção para ele.
3. O responsável informou que cadastrou o secret `SUPABASE_RECOVERY_DB_URL` no
   GitHub. Confirme que está em **Settings → Environments → production-backup**;
   não leia nem cole seu valor. O workflow `.github/workflows/supabase-restore-recovery.yml` foi preparado
   localmente e executará a restauração somente depois de integrado à `main`.
   Ele usa o Environment `production-backup`, já restrito à `main`, para
   reutilizar a configuração existente do Drive. O workflow não referencia
   `SUPABASE_DB_URL`; portanto, a URL de produção não é passada ao job de
   restauração. Não cole secrets na linha de comando, no workflow, no chat ou
   nos logs.
4. A ação exige a confirmação `RESTAURAR-ISOLADO`, aceita somente uma data UTC
   válida e valida a URI para que a referência seja exatamente
   `rksthbddfecjpvoxclgo`, nunca a de produção `tqijocmmiwistinrjpwl` nem outro
   projeto. Também verifica que as tabelas de aplicação, Auth e Storage estejam
   vazias, que o arquivo exista e que a descriptografia e o gzip estejam
   íntegros. A URI e a senha nunca são impressas; o log mostra somente a
   referência do projeto isolado.
5. O runner efêmero decodifica `RCLONE_CONFIG_B64` em arquivo temporário com
   permissão `600`, cria um arquivo temporário `pgpass` com permissão `600` e
   apaga ambos ao terminar, inclusive se o job falhar. O dump é transmitido
   diretamente do Drive ao `psql` em uma transação; não habilite `set -x`.

### 2. Escolher e validar uma cópia

No formulário manual do workflow, selecione a branch `main`, informe a data UTC
da cópia no formato `AAAA-MM-DD` e selecione `RESTAURAR-ISOLADO`. O nome lógico
é `setlist-prod-AAAA-MM-DD.sql.gz`. O script lista o remote criptográfico,
confirma que o nome existe e lê/descriptografa o arquivo para validar o gzip;
nenhum dump é gravado localmente. A cópia mais recente registrada neste runbook
foi criada em 20/10/2026.

### 3. Restaurar em uma única transação

O workflow faz a importação em uma transação depois de validar destino, cópia e
estado vazio. Não execute uma restauração manual em `setlist-prod`.

`pipefail` faz o job falhar se o download, a descriptografia, a descompressão
ou o `psql` falhar. `ON_ERROR_STOP` interrompe no primeiro erro e
`--single-transaction` desfaz a importação em caso de falha. Não repita a
importação sobre um destino parcialmente restaurado: descarte o projeto de
recuperação e prepare um projeto vazio antes de tentar novamente.

O dump antigo inclui uma seção de papéis globais, que não pode ser reproduzida
integralmente em outro projeto Supabase: a plataforma provisiona os próprios
papéis e reserva `supabase_admin`. O restaurador valida a seção sem gravá-la
localmente, descarta essa parte do fluxo e as instruções de ownership para
`supabase_admin`, e reaplica somente a configuração de `authenticator` usada
pelo Setlist (`pgrst.db_pre_request`). Backups novos não exportam papéis
globais; incluem apenas essa configuração da aplicação.
Senhas de papéis personalizados com `LOGIN` não são recuperadas pelo dump e
devem ser definidas novamente no ambiente isolado, sem reutilizar senhas de
produção.

### 4. Conferir a recuperação e encerrar o ensaio

1. Confirme no projeto de recuperação a presença dos schemas e objetos da
   aplicação, das migrações e dos registros de Auth. Antes da restauração,
   capture no SQL Editor de `setlist-prod` as contagens agregadas abaixo; rode
   a mesma consulta no projeto de recuperação e compare os resultados:

   ```sql
   select 'bands' as object_name, count(*)::bigint as row_count from public.bands
   union all select 'band_members', count(*) from public.band_members
   union all select 'profiles', count(*) from public.profiles
   union all select 'songs', count(*) from public.songs
   union all select 'repertoire_collections', count(*) from public.repertoire_collections
   union all select 'repertoire_collection_songs', count(*) from public.repertoire_collection_songs
   union all select 'shows', count(*) from public.shows
   union all select 'auth.users', count(*) from auth.users
   order by object_name;
   ```

   Confira também constraints e funções essenciais. Registre apenas os nomes
   dos objetos e as contagens, sem exportar linhas de usuários.

2. Faça a validação funcional apenas com uma conta de teste preparada para o
   projeto isolado. Não envie e-mails a usuários reais, não use credenciais de
   provedores de produção e não direcione o app público para esse banco.
3. Registre data do backup, data do ensaio, ref do projeto de recuperação,
   commit do workflow e resultado das verificações. Não registre linhas de
   usuários, tokens, URLs com senha ou valores dos secrets.
4. Depois de guardar as evidências, remova o projeto descartável e os secrets
   temporários do Environment de recuperação, salvo se houver uma decisão
   explícita de manter um ambiente de recuperação protegido. Se o secret foi
   adicionado a `production-backup` somente para este ensaio, remova
   `SUPABASE_RECOVERY_DB_URL` ao terminar.

### Recuperação do projeto de produção

Este ensaio não autoriza importar um dump sobre `setlist-prod`. A rotina cobre
os schemas e dados descritos em **Escopo e limitações**, mas não inclui objetos
binários do Storage, configurações de Auth, Edge Functions ou serviços
externos. Para um incidente real, primeiro restaure em um projeto separado,
valide os dados e planeje a troca de conexão/cutover. Não execute uma
restauração destrutiva no banco ativo sem um plano de recuperação específico.

Os workflows e scripts foram integrados à `main` na PR #52. A primeira
execução, com a cópia de 20/10/2026, parou ao tentar aplicar papéis gerenciados
do Supabase; a transação única foi interrompida. A correção em andamento remove
papéis globais e ownership reservado durante o fluxo e mantém o dump direto do
Drive ao banco. Não marque a tarefa OpenSpec 11.8.4 como concluída até uma nova
execução terminar com sucesso e as contagens serem conferidas.
Para o formato de dump, preparação do projeto, restauração por `psql`
e tratamento de papéis do Supabase, consulte o
[guia oficial de backup e restauração pela CLI](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore).
