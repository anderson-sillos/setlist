# Integração contínua

Os checks obrigatórios da `main` mantêm os nomes `Formato, lint, tipos e testes`, `Smoke test Web (Playwright)` e `Migrações e testes pgTAP`. Eles continuam concluindo em cada PR. Em pushes na `main`, a validação completa sempre executa.

## Seleção de etapas

Cada job compara o commit de merge da PR com seu primeiro pai, usando o checkout com profundidade 2. Assim a decisão considera a PR inteira contra a base efetivamente testada. Renomes são tratados como remoção e adição para impedir que código removido passe por alteração documental.

Uma PR dispensa as etapas pesadas somente quando todos os caminhos pertencem à lista documental de `scripts/ci-scope.mjs`: Markdown na raiz, Markdown/texto em `docs/`, Markdown e metadados de changes em `openspec/` e arquivos `README.md` em `src/`. HTML/CSS dos documentos públicos, configurações, scripts, dependências, código, testes e caminhos desconhecidos exigem a validação completa.

Em PRs documentais, o check de qualidade executa os testes de classificação, a formatação com a versão de Prettier do lockfile e a conferência das versões do app. Os outros dois jobs registram a dispensa no resumo, sem instalar o app, o Chromium ou o Supabase. Falha ao determinar o diff falha o check; não equivale a dispensa.

## Caches

| Conteúdo            | Chave e limite                                                                                                                                                                                      |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Downloads npm       | `setup-node` usa o lockfile; `npm ci --prefer-offline` continua montando uma instalação limpa.                                                                                                      |
| Jest e ESLint       | OS, arquitetura, Node e configurações/lockfile; uma chave por commit pode restaurar a versão compatível mais recente. ESLint compara conteúdo, preservando utilidade após novo checkout.            |
| Metro               | Chaves separadas de desenvolvimento e produção, com OS, arquitetura, Node, configurações/lockfile e hash das variáveis públicas Expo. A chave final identifica o commit testado ou a tag exportada. |
| Imagens do Supabase | CLI, OS, arquitetura, configuração e script de exportação. Guarda somente imagens de serviços em um arquivo Docker; não guarda volumes, containers nem dados do banco.                              |

Todas as execuções do banco criam a base do zero e aplicam migrações e seed. O cache de imagens só dispensa o download das versões já utilizadas. A preparação e o carregamento são medidos para comparar o custo de exportar/restaurar o cache com o download direto.

O cache de Metro contém transformações, não a aplicação exportada em `dist/`. O cache de desenvolvimento não é restaurado pelo Pages. O workflow Pages mantém os comandos necessários inline para continuar publicando tags anteriores que não contêm os novos auxiliares de CI.

Não há cache de `node_modules` ou dos navegadores. O smoke test instala apenas o Chromium Headless Shell utilizado. O cliente `psql` é aproveitado do runner quando disponível, com instalação apt como fallback.

## Medição e cadência

Os passos de instalação npm, lint, Jest, exportação Web, inicialização do banco e exportação/carregamento de imagens usam `/usr/bin/time -v`, registrando tempo, CPU e pico de memória no log. Os tempos de etapas e jobs ficam disponíveis no GitHub Actions.

Referência da auditoria em 15/10/2026, antes desta manutenção:

| Etapa                            | Tempo observado                                                       |
| -------------------------------- | --------------------------------------------------------------------- |
| Job qualidade                    | 139–146 s                                                             |
| Jest                             | 71–73 s                                                               |
| Lint                             | 19 s                                                                  |
| Exportação Web do smoke          | 45–70 s                                                               |
| Preparação do banco              | 74–79 s, dos quais cerca de 55 s foram downloads no exemplo analisado |
| Instalação do cliente PostgreSQL | 8–18 s                                                                |

Referências: [qualidade e smoke](https://github.com/anderson-sillos/setlist/actions/runs/38681270065), [banco](https://github.com/anderson-sillos/setlist/actions/runs/38681270144) e [Pages](https://github.com/anderson-sillos/setlist/actions/runs/38008639720). Caches novos precisam ser comparados entre execução inicial e reexecução do mesmo commit antes de atribuir ganhos a eles.

Manter commits locais por tarefa e fazer push após o grupo validado, exceto se houver pedido explícito de checkpoint remoto. O cancelamento automático preserva o head mais recente, mas não recupera o tempo já gasto pelos jobs anteriores.
