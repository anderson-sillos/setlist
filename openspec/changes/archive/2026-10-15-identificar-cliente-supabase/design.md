# Design

## Context

O cliente único do app é criado em `src/data/supabase/client.ts`. `getAppReleaseInfo()` já disponibiliza versão, build, commit, ambiente e plataforma. React Native informa a versão do sistema de forma diferente em iOS e Android; deve-se usar a versão legível do SO, não o número da API Android.

Os logs do API Gateway do Supabase capturam `user-agent` e `x-client-info`; cabeçalhos arbitrários não aparecem nesses registros. O SDK inclui sua própria identificação em `X-Client-Info`, que precisa ser preservada ao anexar os metadados do app.

## Goals / Non-Goals

**Goals:**
- Identificar versão, build e plataforma nas chamadas ao Supabase.
- Incluir versão do sistema operacional em clientes nativos quando disponível.
- Preservar o `User-Agent` do navegador e os metadados existentes do SDK.
- Manter uma única fonte de formatação ligada aos dados de release já usados pelo app.

**Non-Goals:**
- Criar uma tabela própria de auditoria ou armazenar IP no banco da aplicação.
- Usar os metadados para autenticação, autorização, antifraude ou identificação confiável do dispositivo.
- Alterar a retenção/configuração de logs do projeto Supabase.

## Decisions

1. **Acrescentar os dados Setlist a `X-Client-Info` por meio do fetch do cliente.** O SDK mantém seu valor original (incluindo versão e runtime) e o wrapper acrescenta campos curtos como app, versão, build, plataforma, SO, ambiente e commit. `global.headers` sozinho substituiria o valor padrão do mesmo cabeçalho, por isso não será usado para redefini-lo.

2. **Definir um `User-Agent` de produto somente no nativo.** O valor identifica Setlist, versão, build e plataforma. Na web o navegador continua definindo o user-agent; o Setlist ainda será identificável em `X-Client-Info`. O `X-Client-Info` é o campo comum entre as plataformas e consta explicitamente entre os cabeçalhos registrados pelo API Gateway.

3. **Usar metadados disponíveis sem buscar identificadores do aparelho.** Versão e build vêm de `getAppReleaseInfo()`. A plataforma vem do React Native. A versão legível do SO vem de `Platform.Version` no iOS e `Platform.constants.Release` no Android. Modelo, identificador de instalação, email e ID do usuário não serão enviados.

4. **Aplicar a identificação centralmente às chamadas do cliente.** O wrapper deve combinar cabeçalhos tanto de `Request` quanto do argumento `init`, sem remover `Authorization`, `apikey`, `content-type`, cabeçalhos específicos da chamada nem metadados de trace. Os cabeçalhos padrão devem continuar válidos para a Edge Function de denúncia e suas regras CORS existentes.

5. **Tratar os dados como metadados de diagnóstico não confiáveis.** Versão e plataforma vêm do cliente e podem ser simuladas; não podem participar de decisões de acesso.

## Risks / Trade-offs

- [Uma composição incorreta de `Request` e `init` pode descartar cabeçalhos do SDK ou o corpo da chamada] -> Testar o wrapper com ambos os formatos de entrada e confirmar chamadas Auth, REST e Edge Function.
- [Metadados podem faltar em Expo Go ou builds antigos] -> Omitir os campos ausentes e manter a chamada funcionando.
- [User-agent pode ser simulado e varia conforme o ambiente] -> Usar `X-Client-Info` como identificação uniforme e manter os metadados fora de controles de segurança.
- [O nome/forma dos campos aparece nos registros e pode aumentar o volume de metadados] -> Usar valores curtos, sem informação pessoal ou identificadores persistentes.

## Migration Plan

Não há migração de banco. Após incluir a composição central de cabeçalhos, validar uma chamada de autenticação e uma de API no ambiente de desenvolvimento, conferindo `request.headers.x_client_info` e `request.headers.user_agent` nos logs do API Gateway. Builds já publicados continuarão enviando os cabeçalhos anteriores até receberem atualização.

Rollback: remover a composição dos cabeçalhos do cliente central; nenhuma sessão ou dado persistido precisa ser migrado.
