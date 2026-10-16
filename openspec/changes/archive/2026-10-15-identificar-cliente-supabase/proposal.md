# Proposal

## Why

Os logs do Supabase não identificam de forma consistente a versão e a plataforma do Setlist em chamadas feitas pelos aplicativos iOS e Android. Essa informação ajuda a relacionar acessos e falhas à compilação correta sem depender de inferências frágeis do user-agent nativo.

## What Changes

- Acrescentar aos cabeçalhos das chamadas Supabase a identificação do Setlist, incluindo versão, número do build, plataforma e versão do sistema operacional quando disponível.
- Preservar a identificação original da biblioteca `supabase-js` em `X-Client-Info`.
- Enviar um `User-Agent` que identifique a versão e plataforma nos aplicativos nativos; na web, manter o user-agent fornecido pelo navegador.
- Usar a identificação apenas como metadado diagnóstico, sem substituir autenticação ou autorização.

## Capabilities

### New Capabilities
- `identificacao-cliente`: identifica nos pedidos ao Supabase a versão e a plataforma do cliente Setlist para diagnóstico.

### Modified Capabilities

## Impact

- `src/data/supabase/client.ts` e `src/config/appRelease.ts`.
- Registros do API Gateway e do serviço Auth do Supabase.
- Nenhuma dependência ou alteração de esquema do banco prevista.
