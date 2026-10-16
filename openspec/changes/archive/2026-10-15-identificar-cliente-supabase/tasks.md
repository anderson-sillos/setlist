# Tasks

## 1. Composição dos metadados de cliente

- [x] 1.1 Criar uma função que formate versão, build, plataforma, sistema operacional, ambiente e commit disponíveis; verificar com testes unitários a presença e omissão de campos opcionais.
- [x] 1.2 Criar um fetch wrapper que acrescente a identificação Setlist a `X-Client-Info` preservando valor e cabeçalhos de `Request` e `init`; verificar que não perde autorização, chave, corpo ou cabeçalhos de trace.

## 2. Integração do cliente Supabase

- [x] 2.1 Configurar o cliente Supabase para usar o wrapper em todos os pedidos HTTP e definir `User-Agent` próprio apenas em iOS/Android; verificar pelos testes que o navegador mantém seu user-agent e os clientes nativos incluem app, versão, build e plataforma.
- [x] 2.2 Verificar formatação e tipagem da integração com lint e typecheck.

## 3. Validação ponta a ponta

- [x] 3.1 Validar que Auth, REST e Edge Functions mantêm os cabeçalhos necessários e que a função de denúncia continua compatível com CORS; verificar testes automatizados relevantes.
- [x] 3.2 Validar nos logs de desenvolvimento do API Gateway os campos `request.headers.x_client_info` e `request.headers.user_agent` após uma chamada real de iOS, Android e web; registrar os valores observados.

### Evidências coletadas para 3.2

Arquivo recebido em 15/10/2026, com chamadas do ambiente `development`:

| Plataforma | `X-Client-Info` observado | `User-Agent` observado | Resultado |
| --- | --- | --- | --- |
| Web | `supabase-js/2.116.0; runtime=web; setlist/1.0.0; platform=web; env=development` | `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36` | Confirmado em chamadas REST, incluindo `/rest/v1/shows`, `/rest/v1/bands`, `/rest/v1/songs` e `/rest/v1/invitations`. |
| iOS | `supabase-js/2.116.0; runtime=react-native; setlist/1.0.0; platform=ios; os=18.3.1; env=development` | `Setlist/1.0.0 (iOS 18.3.1)` | Confirmado em chamadas REST, incluindo `/rest/v1/shows`, `/rest/v1/songs`, `/rest/v1/bands` e `/rest/v1/repertoire_collections`. |
| Android | `supabase-js/2.116.0; runtime=react-native; setlist/1.0.0; platform=android; os=16; env=development` | `Setlist/1.0.0 (Android 16)` | Confirmado em Auth e chamadas REST, incluindo `/auth/v1/token`, `/rest/v1/shows`, `/rest/v1/songs`, `/rest/v1/bands` e `/rest/v1/invitations`. |

Os dois arquivos de evidência também contêm chamadas web sem `X-Client-Info` para alguns caminhos REST e chamadas de navegação OAuth (`/auth/v1/authorize` e `/auth/v1/callback`), ao lado de chamadas identificadas para os mesmos caminhos REST. Como os registros não incluem timestamp ou ID de requisição, não é possível associar as linhas sem cabeçalho a uma execução específica. A validação desta tarefa confirma chamadas identificadas em cada plataforma; se as chamadas REST sem identificação forem reproduzidas em uma sessão web delimitada, investigar sua origem como acompanhamento.
