# Publicação dos documentos legais

As páginas candidatas estão em `docs/termos.html` e
`docs/privacidade.html`. O workflow de GitHub Pages copia esses arquivos para
`/termos/` e `/privacidade/`. O aplicativo aponta para os endereços canônicos
`https://setlistbr.app.br/termos/` e
`https://setlistbr.app.br/privacidade/` no login e no menu lateral.

Antes de publicar uma versão:

1. Conferir os textos finais com o responsável, inclusive afirmações sobre
   moderação, retenção, fornecedores, avisos e exclusão de conta. A revisão
   jurídica informada pelo responsável foi feita sobre as minutas; confirmar
   que a versão pública condensada preserva as decisões aprovadas. A comparação
   factual das páginas candidatas com as minutas e com o fluxo de aceite foi
   feita em 02/10/2026; ainda falta a aprovação da redação pública final pelo
   responsável.
2. Decisão do responsável: os termos gerais serão disponibilizados antes do
   login e no aplicativo, sem aceite explícito registrado. O disclaimer do
   login informa que prosseguir significa concordar com os Termos de uso; a
   Política de privacidade permanece para consulta, sem ser apresentada como
   consentimento geral. O aceite separado do termo de responsabilidade da
   banda continua existindo.
3. Fixar a data efetiva de vigência nas duas páginas. A indicação atual,
   “a partir da publicação”, não substitui o registro da data de publicação.
4. Conferir a configuração efetiva em produção antes de fixar a descrição
   final dos prazos de retenção. As migrações de convites e de frequência de
   denúncias foram aplicadas; falta conferir a primeira execução e o efeito dos
   jobs. Auditoria de login, backup semanal próprio e configurações de retenção
   do Brevo permanecem pendentes.
5. Publicar a versão aprovada e abrir ambas as URLs sem autenticação na Web e
   nos navegadores de Android e iOS. Confirmar conteúdo, título, versão,
   data, links cruzados, contato e acesso pelo login e pelo menu do app.

O procedimento de remoção continua como documento operacional interno. O
canal público para denúncias e contestações está nos termos.

## Conferência de `setlist-prod` em 02/10/2026

Consulta de leitura pelo Supabase CLI, em cópia temporária da configuração
vinculada a `setlist-prod`, encontrou 12 versões em
`supabase_migrations.schema_migrations`, até `20260920160000`. As migrações
posteriores deste repositório ainda não constam do histórico de produção.
Uma consulta direta ao catálogo confirmou que `public.invitations` existe, mas
`public.report_rate_limits`, `public.moderated_songs`,
`public.suspended_accounts`, o gatilho `songs_filter_content`, as funções de
limpeza em `private` e a extensão `pg_cron` ainda não existem. A lista de Edge
Functions de `setlist-prod` está vazia, inclusive sem `report-content`.
O `supabase db push --dry-run`, feito somente na cópia temporária vinculada a
produção, enumerou 14 migrações pendentes, de `20260922120000` a
`20261002101000`, sem aplicá-las.
O backup anterior à implantação ainda depende da identificação do disco
externo criptografado. A tentativa de `supabase db dump --linked` não conseguiu
usar a conexão direta por ausência de IPv6 nesta rede; para a exportação,
conferir a conexão pelo pooler de sessão indicada pelo Supabase, sem registrar
a senha do banco em arquivos do repositório ou em comandos expostos no histórico.

Antes da aplicação, o responsável autorizou dispensar o backup dessa etapa,
pois não havia dados a preservar. Uma consulta de contagem confirmou zero
contas, bandas, participações, músicas, shows, convites e aceites em produção.
As 14 migrações foram aplicadas em 02/10/2026. O histórico agora contém 26
versões; filtro, tabelas de moderação, funções de limpeza e `pg_cron` existem.
Os jobs `setlist-prune-invitations` e `setlist-prune-report-rate-limits` estão
ativos. A Edge Function `report-content` foi implantada e aparece como ativa.

Em 02/10/2026, a lista de segredos de `setlist-prod` passou a mostrar
`BREVO_API_KEY` e `BREVO_SENDER_EMAIL`; a função `report-content` continua
ativa. A presença dos nomes não confirma a validade da chave nem a entrega de
e-mail. A consulta de produção ainda mostrou zero contas e bandas, portanto
não há como confirmar uma denúncia autenticada com alvo existente sem criar
dados de ensaio. Os dois jobs estavam ativos, mas ainda sem execução registrada.
Antes da publicação, conferir o envio, a ocultação, a suspensão, a resposta do
filtro e a primeira execução dos jobs. A dispensa do backup antes da migração não altera a decisão de
implantar backup semanal próprio antes de receber dados da distribuição pública.
