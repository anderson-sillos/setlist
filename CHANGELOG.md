# Histórico de versões

## 1.0.0 — candidato em preparação

Primeira versão pública planejada para Web, Android e iOS. O candidato inicial
será identificado por `v1.0.0-rc.1`; a versão exibida no aplicativo será `1.0.0`
nas três plataformas. A tag e o commit serão registrados após a integração da
preparação do release.

### Funcionalidades

- Login Google/Apple, perfil, bandas, papéis e convites.
- Repertório, músicas e letras estáticas compartilhadas.
- Shows, calendário, blocos e edição de setlists.
- Interface Content-First Darkness, navegação responsiva e proteção de alterações
  não salvas.
- Tela Sobre o Setlist com versão, build, ambiente e links legais.

### Distribuição

- Versão comum controlada no `app.json` e conferida no CI.
- Contadores Android/iOS gerenciados pelo EAS com incremento automático.
- Builds vinculados ao commit de uma tag e registro em GitHub Releases.
- Publicação Web a partir da tag estável aprovada, com manifesto do release.

### Conferências pendentes

- Gerar e validar os novos candidatos Android, iOS e Web com a tela Sobre.
- Concluir as conferências operacionais, legais e das lojas descritas no grupo 11
  de `openspec/changes/definir-mvp-setlist/tasks.md`.

O modo palco completo, a sincronização manual com YouTube e os pacotes offline
permanecem fora desta primeira entrega. O APK histórico `0.1.0`, baseado em
`b7dc8b2`, foi validado pelo responsável e não contém a nova tela Sobre.
