# Proposal

## Why

O manifesto de release atual inclui URLs de download do EAS, que podem carregar tokens temporários capazes de liberar o AAB ou IPA. Como o manifesto também é copiado para os arquivos públicos do GitHub Pages, precisamos separar a validação privada dos builds dos metadados publicados antes de disponibilizar a candidata RC.4.

## What Changes

- Remover URLs de download e outros tokens dos manifestos, notas e arquivos publicados no Pages.
- Registrar referências estáveis à página de detalhes de cada build EAS, junto aos metadados necessários para identificar versão, commit, perfil e contador.
- Manter a validação dos arquivos nativos e a conferência do AAB/IPA no fluxo privado de release, sem publicar esses arquivos nem seus endereços assinados.
- Atualizar o workflow do Pages para validar e exportar uma candidata existente usando a versão segura do processo, sem mover a tag nem quebrar a relação entre o código publicado e seus builds.
- Documentar a separação entre registros públicos e artefatos distribuídos pelas lojas ou pelo EAS com acesso controlado.

## Capabilities

### New Capabilities

- `release-management`: registrar e publicar metadados de builds sem expor endereços de download ou credenciais temporárias.

### Modified Capabilities

Nenhuma. A capacidade de release está definida como delta dentro da change `definir-mvp-setlist`, mas ainda não existe em `openspec/specs/` como especificação principal.

## Impact

Afeta `scripts/release-manifest.mjs`, seus testes, `.github/workflows/pages.yml`, `docs/RELEASE_PROCESS.md` e os arquivos públicos `release.json` gerados pelo Pages. O processamento manual da candidata deve usar o workflow atualizado da branch principal e exportar o código da tag exata. A Release RC.4 permanece imutável; se a validação segura dessa candidata não puder ser feita sem alterar seu código ou seus builds, será necessário preparar outro candidato com nova tag e novos builds.
