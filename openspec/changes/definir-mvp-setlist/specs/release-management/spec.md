## Purpose

Definir identificação comum e rastreabilidade de entregas Android, iOS e Web,
registro de Releases e consulta da versão instalada.

## ADDED Requirements

### Requirement: Versão comum do produto

O projeto SHALL usar `expo.version` em `app.json` como versão comum no formato
`X.Y.Z` para Android, iOS e Web, SHALL sincronizar `package.json` e
`package-lock.json` por um comando único e MUST recusar divergências no CI.

#### Scenario: Preparar a primeira versão pública

- **WHEN** o responsável prepara a primeira versão pública
- **THEN** Android, iOS e Web são identificados por `1.0.0` e os candidatos usam
  tags `v1.0.0-rc.N` sem inserir o sufixo na versão exigida pelas lojas

### Requirement: Contadores nativos gerenciados

O projeto SHALL manter contadores Android/iOS remotos no EAS com incremento
automático nos perfis de produção e SHALL preservar os valores já usados.

#### Scenario: Gerar outro candidato

- **WHEN** o EAS gera outro build de produção
- **THEN** ele incrementa o contador daquela plataforma sem alterar a versão
  comum do produto e sem reduzir o contador para igualá-lo a outra plataforma

### Requirement: Código comum da entrega

Os builds e o export Web de uma entrega MUST usar o commit exato da mesma tag.
O processo SHALL rejeitar um checkout alterado ou um build com versão, commit,
perfil ou estado incompatíveis ao registrar artefatos concluídos.

#### Scenario: Registrar build de outro commit

- **WHEN** o responsável tenta incluir no manifesto um build de outro commit
- **THEN** o processo rejeita o registro e preserva a identidade da entrega

### Requirement: Registro verificável da Release

O processo SHALL preparar Releases em rascunho, registrar versão, tag, commit,
builds, artefatos e validação por plataforma e SHALL exigir AAB Android, IPA iOS
e Web validados antes de encerrar a distribuição estável.

#### Scenario: Candidato incompleto

- **WHEN** uma plataforma ainda não tem artefato concluído ou validação
- **THEN** o registro permanece parcial e não declara a versão estável pronta

### Requirement: Publicação Web por Release

O Pages de produção SHALL obter o código da tag estável de uma Release
publicada, SHALL conferir o manifesto e MUST NOT publicar um push da `main`,
rascunho ou pré-release como versão final.

#### Scenario: Integrar código sem publicar uma Release

- **WHEN** a `main` recebe uma alteração e nenhuma Release estável é publicada
- **THEN** o Pages preserva a versão de produção já publicada

### Requirement: Sobre o Setlist

O app SHALL oferecer no menu a tela Sobre o Setlist com apresentação breve,
versão, plataforma, ambiente e identificação disponível do build e commit.
Os números nativos SHALL corresponder ao binário Setlist instalado, sem usar
a identificação do Expo Go. Termos e privacidade SHALL continuar diretamente
no menu e antes do login, além de serem acessíveis na tela Sobre.

#### Scenario: Consultar a identificação instalada

- **WHEN** a pessoa abre Sobre o Setlist
- **THEN** o app apresenta sua versão e os dados disponíveis sem expor
  credenciais e permite abrir os documentos legais e as notas das versões
