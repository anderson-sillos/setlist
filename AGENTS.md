# Instruções persistentes do repositório

## Operações GitHub

- Para criar commits destinados ao remoto, fazer `git push`, atualizar branches remotas ou criar, editar e mesclar PRs, use `exec_command` com `sandbox_permissions: "require_escalated"`. Não tente concluir gravações remotas dentro do sandbox. A integração GitHub conectada pode ter acesso somente de leitura e não substitui o caminho Git/`gh` elevado.
- Uma solicitação explícita do usuário para commit, push ou atualização de PR já autoriza a operação; não peça a mesma autorização de novo. Faça a solicitação de acesso elevado quando executar o comando e atenda a aprovação da ferramenta, se apresentada.
- Confirme no remoto o SHA da branch e os metadados/estado da PR depois da operação. Só informe conclusão quando essa conferência passar.
- Preserve commits por tarefa e agrupe o push e a atualização da PR ao final de um grupo validado, salvo quando o usuário solicitar um checkpoint remoto antes disso. Isso evita reiniciar os checks a cada commit local.
- Se a operação elevada falhar por helper ausente ou credencial inválida, preserve os commits locais, informe o motivo exato e peça apenas a autenticação necessária. Não declare o remoto atualizado até repetir a operação e verificá-la.

## Autenticação persistente do GitHub CLI

- Neste Mac há uma única instalação do CLI: `/Users/anderson.martins/.local/bin/gh`. A configuração fica em `~/.config/gh` e o token deve permanecer no Chaves do macOS. O Git usa `gh auth git-credential` como helper para `github.com`.
- Antes de declarar uma credencial inválida, execute `gh auth status --hostname github.com` e `gh api user --jq .login` com `sandbox_permissions: "require_escalated"`. O sandbox pode impedir o acesso ao Chaves e fazer o CLI informar falsamente que o token é inválido.
- Não use `gh auth logout`, não apague `hosts.yml` e não exclua itens do Chaves como tentativa de corrigir falhas de autenticação. Para remover uma sessão a pedido do usuário, confirme primeiro a falha real da credencial pela API com acesso elevado; erros de rede, TLS, permissões ou acesso ao Chaves não comprovam credencial inválida.
- Preserve a autenticação existente durante atualizações do CLI e diagnósticos. Não use `--insecure-storage` nem grave tokens em scripts, arquivos de inicialização do shell, repositório ou logs. Configure o helper com `gh auth setup-git --hostname github.com` e valide a persistência em um shell novo.

Estas instruções também estão registradas em `docs/CODEX_HANDOFF.md` e devem ser seguidas em sessões futuras deste repositório.
