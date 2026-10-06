# Instruções persistentes do repositório

## Operações GitHub

- Para criar commits destinados ao remoto, fazer `git push`, atualizar branches remotas ou criar, editar e mesclar PRs, use `exec_command` com `sandbox_permissions: "require_escalated"`. Não tente concluir gravações remotas dentro do sandbox. A integração GitHub conectada pode ter acesso somente de leitura e não substitui o caminho Git/`gh` elevado.
- Uma solicitação explícita do usuário para commit, push ou atualização de PR já autoriza a operação; não peça a mesma autorização de novo. Faça a solicitação de acesso elevado quando executar o comando e atenda a aprovação da ferramenta, se apresentada.
- Confirme no remoto o SHA da branch e os metadados/estado da PR depois da operação. Só informe conclusão quando essa conferência passar.
- Se a operação elevada falhar por helper ausente ou credencial inválida, preserve os commits locais, informe o motivo exato e peça apenas a autenticação necessária. Não declare o remoto atualizado até repetir a operação e verificá-la.

Estas instruções também estão registradas em `docs/CODEX_HANDOFF.md` e devem ser seguidas em sessões futuras deste repositório.
