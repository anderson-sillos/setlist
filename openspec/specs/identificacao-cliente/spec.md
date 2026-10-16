# identificacao-cliente Specification

## Purpose

Permite identificar nos registros técnicos do Supabase a versão e a plataforma do cliente Setlist que originaram cada chamada, facilitando diagnóstico de falhas e suporte.

## Requirements

### Requirement: Chamadas Supabase identificam a versão do cliente Setlist
O cliente SHALL incluir em suas chamadas HTTP ao Supabase metadados diagnósticos consistentes com a versão executada do Setlist, a plataforma e a versão do sistema operacional quando disponível. Essa identificação MUST NOT conter dados pessoais nem substituir credenciais ou controles de autorização.

#### Scenario: Aplicativo nativo envia identificação ao Supabase
- **WHEN** o app iOS ou Android envia uma chamada HTTP ao Supabase
- **THEN** os registros do API Gateway permitem identificar Setlist, versão, build, plataforma e versão do sistema quando disponível
- **AND** o `User-Agent` nativo também identifica Setlist, versão e plataforma

#### Scenario: Web envia identificação sem substituir o navegador
- **WHEN** a versão web envia uma chamada HTTP ao Supabase
- **THEN** o `X-Client-Info` permite identificar Setlist, versão e plataforma web
- **AND** o `User-Agent` original do navegador é preservado

#### Scenario: Identificação não altera a identificação do SDK
- **WHEN** o cliente Supabase constrói uma chamada com seus próprios metadados
- **THEN** a identificação Setlist é acrescentada sem remover a identificação e a versão do SDK Supabase

#### Scenario: Metadado indisponível
- **WHEN** um metadado opcional como build, sistema operacional, ambiente ou commit não estiver disponível
- **THEN** o cliente omite esse valor sem impedir ou alterar a chamada Supabase
