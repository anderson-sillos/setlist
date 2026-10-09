# Banda Demo

Seed completo para divulgar o Setlist e testar com pessoas externas. O arquivo
[banda-demo.sql](./banda-demo.sql) cria uma banda pertencente à conta existente
**asillos@gmail.com**. Artistas, músicas, letras, locais e eventos são fictícios;
as letras foram compostas para esta demonstração.

## Conteúdo

| Dados            | Quantidade e variações                                                        |
| ---------------- | ----------------------------------------------------------------------------- |
| Banda            | Banda Demo, com a conta indicada como Owner                                   |
| Repertório       | 72 músicas de 12 artistas; 66 ativas e 6 arquivadas                           |
| Letras           | 60 cadastradas: 24 estáticas, 18 incompletas e 18 sincronizadas; 12 sem letra |
| Coleções         | 12 com 8 a 24 músicas, mais 1 vazia                                           |
| Shows            | 30: 8 passados e 22 nos próximos 88 dias                                      |
| Status dos shows | 14 prontos, 12 rascunhos e 4 cancelados                                       |
| Setlists         | 103 blocos e 883 itens, entre músicas, anotações e separadores                |

Os artistas incluem **Os Boletos Selvagens**, **Dona Wi-Fi e os Sem Sinal**,
**Quarteto dos Cinco** e **Orquestra do Último Ônibus**. O repertório mistura
rock, pop, forró, MPB, reggae, punk, dance, indie, jazz, samba, soul e baladas.

As letras têm versos, pré-refrão, refrões repetidos, ponte e final. Também há
introduções, solos sem texto, blocos sem nome, negrito, linhas em branco e
separadores. As letras incompletas incluem tempos parcialmente preenchidos,
uma última linha sem tempo e tempos fora de ordem. Os tempos sincronizados
são exemplos sintéticos para exercitar a interface.

Há metadados opcionais ausentes, títulos longos, acentos, apóstrofos, tons
maiores/menores, BPMs variados e durações curtas/longas. Seis músicas usam o
vídeo técnico do YouTube já referenciado no protótipo do projeto: **ele não é
uma gravação das composições fictícias, e os tempos das letras não correspondem
ao áudio do vídeo**. As notas dessas músicas identificam essa referência.

As coleções têm ordem própria e músicas compartilhadas; há músicas ativas
sem coleção para testar esse filtro. Exemplos: **Festa no Quintal**, **Ar Livre**,
**Acústico de Apartamento**, **Dançante sem Vergonha**, **Festival do Boleto** e
**Underground de Garagem**.

Todos os shows possuem de dois a cinco blocos, músicas e instruções de palco,
troca de instrumentos, transições e agradecimentos. Há reprises, durações de
anotações ausentes, dois eventos no mesmo dia, referências a músicas arquivadas
em shows passados e shows prontos tanto com letras totalmente sincronizadas
quanto com pendências de letras.

## Carregar os dados

1. Escolha o projeto Supabase que receberá a demonstração e confira seu nome/ref.
2. Aplique as migrações versionadas do projeto, incluindo as de coleções de
   repertório de 8 de outubro de 2026.
3. Entre no app desse ambiente com **asillos@gmail.com**, para que o usuário de
   Auth e seu perfil existam. A conta precisa estar ativa.
4. No **SQL Editor** desse projeto, com a conexão administrativa, execute o
   conteúdo integral de [banda-demo.sql](./banda-demo.sql).
5. Atualize **Minhas bandas** no app e abra **Banda Demo**.

Como alternativa ao SQL Editor, com `psql` e a conexão administrativa do banco
disponível em uma variável local, execute a partir da raiz do repositório:

```bash
psql "$SETLIST_DEMO_DATABASE_URL" -X --set=ON_ERROR_STOP=1 \
  --file=supabase/seeds/banda-demo.sql
```

O arquivo resolve o ID do usuário pelo e-mail. Ele não cria usuários, senhas,
convites ou aceites de termos. Para editar conteúdo, o Owner deve aceitar o
termo vigente pelo fluxo normal do app. Para incluir pessoas externas, use os
convites da banda e escolha seus papéis no app; contas de teste não são
fabricadas pelo seed.

O seed não está configurado em `db.seed.sql_paths` e não faz parte de `db push`.
Seu carregamento é uma ação explícita, separada das migrações. O `supabase/seed.sql`
existente continua destinado ao pgTAP no banco local. A criação deste arquivo
não significa que a Banda Demo já foi carregada em desenvolvimento ou produção.

### Datas dos shows

Na primeira execução, os shows são distribuídos em relação ao dia atual no
fuso **America/Sao_Paulo**: oito apresentações anteriores e 22 entre amanhã e
88 dias depois, dentro dos próximos três meses. Os horários são armazenados
como `timestamptz` e respeitam esse fuso.

Para uma demonstração com data de referência fixa, execute na mesma sessão:

```sql
set setlist.demo_reference_date = '2026-10-09';
-- Executar aqui o conteúdo integral de banda-demo.sql.
reset setlist.demo_reference_date;
```

### Reexecução e integridade

Os IDs são estáveis. Se a Banda Demo deste seed já existir com a conta indicada
como Owner, uma nova execução informa que ela existe e preserva todo o conteúdo,
inclusive alterações feitas no app e as datas originais. **Não há reposição de
itens removidos nem atualização automática do calendário.**

A existência de outra banda chamada Banda Demo para essa conta, com outro ID,
interrompe a criação para evitar duplicidade. O seed também interrompe se não
encontrar exatamente uma conta ativa com perfil, se a conta estiver suspensa
ou se o ID da banda já tiver outro Owner.

Toda a criação ocorre em uma operação atômica: em caso de erro, nenhum dado
parcial é mantido. Uma trava serializa execuções simultâneas. Outros dados do
ambiente são preservados e não há exclusão ou atualização deles. Shows são
montados como rascunho e recebem seu status final depois da inserção dos
blocos, sem desativar gatilhos ou regras do projeto.

| Mensagem                            | O que conferir                                                                       |
| ----------------------------------- | ------------------------------------------------------------------------------------ |
| `DEMO_ADMIN_CONNECTION_REQUIRED`    | Usar SQL Editor/conexão administrativa; não executar pela sessão do app              |
| `DEMO_OWNER_NOT_FOUND_OR_AMBIGUOUS` | Conta asillos@gmail.com existente, não excluída e única no Auth do projeto escolhido |
| `DEMO_OWNER_PROFILE_NOT_FOUND`      | Entrar no app para sincronizar o perfil                                              |
| `DEMO_OWNER_ACCOUNT_SUSPENDED`      | Situação da conta no processo de moderação                                           |
| `DEMO_BAND_NAME_ALREADY_EXISTS`     | Banda já existente para essa conta com o mesmo nome e outro ID                       |
| `DEMO_BAND_OWNER_CONFLICT`          | Propriedade da banda com o ID reservado ao seed                                      |
| `DEMO_LYRIC_STATUS_MISMATCH`        | Catálogo/gerador incompatível com a classificação de letras do banco                 |

## Manutenção do catálogo

- [demo-band-catalog.mjs](../../scripts/demo-band-catalog.mjs): nomes, versos,
  refrões e apresentações.
- [demo-band-data.mjs](../../scripts/demo-band-data.mjs): estruturas de letras,
  estados, vínculos de coleções e composição dos setlists.
- [demo-band-seed.template.sql](../../scripts/demo-band-seed.template.sql):
  verificação do Owner e inserções no banco.
- [generate-demo-band-seed.mjs](../../scripts/generate-demo-band-seed.mjs):
  gera o SQL versionado; evita editar manualmente o JSON do arquivo final.

```bash
npm run seed:demo:generate
npm run seed:demo:check
```

A conferência compara o arquivo gerado com suas fontes e valida o catálogo,
inclusive usando a classificação real de letras do app. Alterar o catálogo e
regenerar o arquivo não modifica uma Banda Demo já carregada: a reexecução
continua preservando os dados existentes.
