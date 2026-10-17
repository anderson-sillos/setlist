# Histórico de versões

## 1.0.0 — candidato `v1.0.0-rc.3` (em preparação)

Primeira versão pública para Web, Android e iOS. A versão exibida no aplicativo
é `1.0.0` nas três plataformas. O candidato anterior `v1.0.0-rc.2`, no commit
`93c21c397a50e1d0a0c2a9bf572582989f67fa6a`, já foi enviado aos canais de teste
das lojas com contadores `4`. O candidato `v1.0.0-rc.3` será gerado a partir do
merge da PR #41, com novos builds de produção e export Web vinculados ao mesmo
commit.

### Funcionalidades

- Login Google/Apple, perfil, bandas, papéis e convites.
- Repertório, músicas e letras estáticas compartilhadas.
- Shows, calendário, blocos e edição de setlists.
- Interface Content-First Darkness, navegação responsiva e proteção de alterações
  não salvas.
- Tela Sobre o Setlist compacta, com versão do código/instalada, build, ambiente,
  commit quando disponível, links legais e acesso ao código-fonte no GitHub.

### Segurança

- Atualização da dependência transitiva `shell-quote` de `1.10.0` para `1.12.0`,
  corrigindo o alerta crítico `GHSA-pqg4-j6r4-53mv`.
- Registro das dependências `node-forge`, `braces` e `sprintf-js` que continuam
  afetadas por avisos sem versão corrigida publicada, com ações de acompanhamento
  em `docs/DEPENDENCY_SECURITY.md`.

### Correções acumuladas até o candidato `rc.2`

- Ajustado o comportamento do teclado em formulários e editores para manter os
  campos acessíveis durante a rolagem e permitir dispensar o teclado.
- Mantidos acessíveis os botões de ação de diálogos e protegidos rascunhos de
  denúncia contra descarte acidental.
- Corrigida uma corrida de navegação durante o logout e ampliados os diagnósticos
  de sessão.
- Melhorados os layouts de autenticação e conta no iPad.
- Corrigida a rolagem do editor de blocos de shows e modernizados os gestos de
  arrastar dos editores.
- Corrigido o corte dos rótulos de botões no Android.

### Melhorias do candidato `rc.3`

- Identificação das chamadas Supabase por versão do Setlist, plataforma, sistema
  operacional e ambiente nos cabeçalhos de cliente.
- Leituras agregadas para Minhas bandas, contexto da banda e duração dos shows,
  evitando carregar a lista inteira de músicas ao abrir Shows.
- Carregamento sob demanda dos detalhes, reutilização do cache recente e
  deduplicação de revalidações de tela.
- Indicador de atualização somente durante revalidações necessárias e reserva
  estável de espaço para os controles de Shows e Repertório desde a abertura.
- Migrações correspondentes: `20261015100000` e `20261015110000`.

### Distribuição

- Versão comum controlada no `app.json` e conferida no CI.
- Contadores Android/iOS gerenciados pelo EAS com incremento automático.
- Builds vinculados ao commit de uma tag e registro em GitHub Releases.
- Publicação Web a partir da tag estável aprovada, com manifesto do release.
- Conferência de versões antes de iniciar o Expo, exportar Web e executar builds
  EAS; atalhos de produção/validação também exigem a tag e o commit da entrega.
- Diagnóstico no desenvolvimento para manifestos e clients desatualizados,
  preservando a identificação do código a partir do `app.json` do bundle atual.

### Conferências pendentes

- Aplicar em produção as duas migrações antes de distribuir os novos builds.
- Concluir as validações funcionais dos builds Android e iOS do `rc.3` e
  registrar as evidências no manifesto de release.
- Publicar e validar a candidata Web com o manifesto correspondente.
- Concluir as conferências operacionais, legais e das lojas descritas no grupo 11
  de `openspec/changes/definir-mvp-setlist/tasks.md`.

O modo palco completo, a sincronização manual com YouTube e os pacotes offline
permanecem fora desta primeira entrega. O APK histórico `0.1.0`, baseado em
`b7dc8b2`, foi validado pelo responsável e não contém a nova tela Sobre.
