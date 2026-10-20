# Backup diário do Supabase para Google Drive

## Estado atual

O destino é uma conta dedicada do Google Drive. O backup é produzido em um
runner efêmero do GitHub Actions e enviado como fluxo, comprimido e cifrado no
cliente pelo `rclone crypt`. O dump não é gravado em arquivo, artefato do
Actions nem log. O runner usa somente arquivos temporários de configuração do
rclone e os remove ao final.

O workflow `.github/workflows/supabase-backup.yml` agenda a rotina diariamente
às 06:17 UTC (03:17 em São Paulo) e permite disparo manual somente na `main`.
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
O dump foi transmitido em fluxo e não foi salvo localmente. Ainda falta testar
uma restauração isolada; não marcar a tarefa OpenSpec 11.8.4 como concluída até
realizar esse ensaio.

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

## Execução e retenção

1. Integrar os arquivos por PR após conferir o diff e os checks. Nunca atualizar
   `main` por push direto.
2. Em Actions, executar `Backup diário do Supabase` manualmente na branch
   `main` para validar a primeira cópia; execuções posteriores seguem o horário
   diário.
3. Conferir no resumo do job o resultado de integridade e retenção. O conteúdo
   SQL é enviado por pipe para o remote criptográfico, sem ser impresso.
4. O script valida a cópia ainda em staging por descriptografia e `gzip -t`,
   publica o nome diário após a validação e mantém até 84 cópias diárias, o que
   preserva uma janela de 12 semanas.
5. Se a rotina falhar ou detectar objetos de Storage, não tratar como backup
   concluído; investigar o erro sem copiar dados ou segredos para logs.

## Ensaio de restauração

Antes de concluir a tarefa 11.8.4, validar uma recuperação em um projeto Supabase
isolado. A conexão de destino deve ser diferente de `setlist-prod` e não deve
ser adicionada ao workflow de backup:

1. Criar um projeto de recuperação descartável e preparar extensões e opções
   necessárias.
2. Usar um runner temporário com o mesmo remote crypt e transmitir
   `rclone cat` para `gzip -dc` e então para `psql` apontado à URL de recuperação,
   com `ON_ERROR_STOP=1` e `--single-transaction`. Não salvar o dump no Mac nem
   no runner.
3. Conferir schemas e funções, contagens de linhas, chaves estrangeiras,
   registros de usuários/identidades e acesso com uma conta de teste. Reaplicar
   separadamente configurações gerenciadas e serviços externos que não fazem
   parte da exportação.
4. Registrar data, commit do workflow e resultado sem incluir dados pessoais,
   URLs com senha, tokens ou senhas crypt.

Não declarar a restauração validada até o ensaio isolado terminar com sucesso.
