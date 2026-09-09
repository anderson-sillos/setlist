# Primeira revisão funcional — Incremento 2

## Identificação

- Data: 9 de setembro de 2026.
- Escopo: tarefas 2.1 a 2.6 do change `definir-mvp-setlist`.
- Branch revisada: `feat/reviewable-app`.
- Status: revisão em andamento até a discussão e o registro dos ajustes e melhorias observados.
- Prévia web: [anderson-sillos.github.io/setlist/app/](https://anderson-sillos.github.io/setlist/app/).
- Publicação: [workflow Publicar GitHub Pages](https://github.com/anderson-sillos/setlist/actions/runs/34299605998).
- Projeto EAS: [@anderson-silloss-team/setlist](https://expo.dev/accounts/anderson-silloss-team/projects/setlist).
- Android: [build interno `5b090592`](https://expo.dev/accounts/anderson-silloss-team/projects/setlist/builds/5b090592-0a81-4118-827a-23e9216d3fa7) concluído, instalado e navegado com sucesso.
- iOS: build e acesso remoto pelo Expo Go com a conta do revisor adiados para uma etapa futura.

## Objetivo da revisão

Confirmar que a primeira versão navegável permite avaliar a estrutura do produto antes das integrações externas. Nesta etapa, todos os dados permanecem em memória e nenhuma operação depende de Supabase, YouTube ou armazenamento offline.

## Cenários avaliados

| Cenário                                                       | Plataforma ou evidência                     | Resultado |
| ------------------------------------------------------------- | ------------------------------------------- | --------- |
| Abrir `Minhas bandas` e carregar duas bandas sem backend      | Pré-renderização web e testes de componente | Aprovado  |
| Navegar entre Shows, Repertório e Banda                       | Testes de rotas e componentes               | Aprovado  |
| Consultar listas responsivas em celular, tablet e computador  | Testes dos três modos de layout             | Aprovado  |
| Abrir detalhes de show e música sem controles de edição       | Testes de componente                        | Aprovado  |
| Exibir show com blocos, músicas, observações e item arquivado | Dados demonstrativos e testes               | Aprovado  |
| Abrir o modo palco de show disponível                         | Teste de componente e exportação web        | Aprovado  |
| Bloquear o modo palco para show cancelado                     | Teste de componente                         | Aprovado  |
| Iniciar, pausar, retomar e reiniciar o cronômetro             | Teste do hook com relógio controlado        | Aprovado  |
| Manter dois cronômetros independentes                         | Teste com duas instâncias do hook           | Aprovado  |
| Acessar e navegar pelas telas pelo endereço web público       | Revisão funcional no navegador              | Aprovado  |
| Gerar, instalar e navegar pelo build interno Android          | EAS Build e aparelho Android físico         | Aprovado  |
| Gerar e instalar build interno iOS                            | EAS Build e aparelho iOS físico             | Adiado    |
| Abrir remotamente no Expo Go iOS com a conta do revisor       | Expo Go em aparelho iOS físico              | Adiado    |

## Evidências automatizadas

- `npm run validate`: formatação, lint e tipos aprovados; 8 suítes e 53 testes aprovados.
- Cobertura: 99,6% de statements, 99,58% de linhas, 100% de funções e 83,24% de branches.
- `npx expo export --platform all --output-dir dist`: configuração de Android, iOS e web exportada sem erro.
- `npm run export:web -- --output-dir dist`: nove rotas estáticas geradas, incluindo detalhes e modo palco.
- `openspec validate definir-mvp-setlist --type change --strict`: artefatos OpenSpec válidos.
- O endereço público retornou a tela `Minhas bandas`, e o bundle JavaScript referenciado retornou HTTP 200.

## Observações da revisão

- O conteúdo é propositalmente demonstrativo e reinicia ao recarregar a aplicação.
- Listas e detalhes são somente leitura; criação e edição pertencem aos incrementos posteriores.
- A tela de palco exibe letra estática e não sugere sincronização temporal inexistente.
- O cronômetro é local e não compartilha estado entre músicos ou abas.
- O fallback do GitHub Pages permite que o Expo Router recupere rotas dinâmicas no navegador; a URL raiz da apresentação continua inalterada.
- O build Android foi concluído pelo EAS com status `FINISHED`, instalado em um aparelho físico e validado quanto à navegação entre as telas disponíveis.
- No iOS físico, o Expo Go exige correspondência exata entre a conta autenticada na Expo CLI e a conta conectada no aparelho. O acesso remoto usando a conta individual do revisor não foi validado.
- A geração de um build interno iOS também não foi concluída e será retomada futuramente, sem retirar iOS do escopo do produto.
- Foram observados pontos de ajuste e melhoria durante a revisão. A discussão está pendente na subtarefa 2.6.5; os itens de UX/UI serão encaminhados para priorização na tarefa 2.7.
- A revisão não valida ainda player do YouTube, retomada do relógio após interrupções do sistema, OAuth, Supabase ou pacotes offline. Esses riscos continuam planejados a partir do Incremento 3.

## Parecer

O acesso e a navegação pela versão web foram aprovados. O build interno Android foi gerado, instalado e navegado com sucesso. Build e acesso remoto no iOS permanecem explicitamente adiados para uma etapa futura e continuam como risco conhecido, sem alterar a compatibilidade iOS definida para o produto.

As subtarefas 2.6.1 a 2.6.4 estão concluídas. A discussão das melhorias e a consolidação deste relatório permanecem abertas nas subtarefas 2.6.5 e 2.6.6. A revisão de UX/UI correspondente está prevista na tarefa 2.7.
