# Tasks

## 1. Manifesto público seguro

- [x] 1.1 Atualizar a geração do manifesto para o schema 2 e registrar referências estáveis às páginas de build EAS sem copiar URLs de arquivo; verificar com fixtures Android/iOS que versão, build, commit, perfil e estado permanecem corretos e que nenhuma URL assinada é serializada.
- [x] 1.2 Atualizar a validação do manifesto para rejeitar links de download, tokens, query strings e registros antigos inseguros antes da publicação; verificar cenários aceitos e rejeitados em testes automatizados.
- [x] 1.3 Preservar a checagem privada de plataforma, perfil, commit e tipo de arquivo AAB/IPA antes de marcar `validation` como `passed`; verificar com metadados de build válidos e incompatíveis.

## 2. Deploy seguro no GitHub Pages

- [x] 2.1 Atualizar o workflow manual para executar a partir de `main`, obter separadamente o código da tag candidata e validar tag, SHA, builds e manifesto seguro; conferir sintaxe com `actionlint` e validar que a exportação usa o checkout imutável da candidata.
- [x] 2.2 Atualizar os testes do workflow para assegurar que nenhum manifesto inseguro chega a `release.json` ou `app/release.json`; verificar ambos os arquivos de saída com busca por URL de artefato, token e parâmetros de acesso.
- [x] 2.3 Documentar no `docs/RELEASE_PROCESS.md` o schema público, a validação privada, a seleção de `main` no deploy manual e o uso dos canais de loja para instalação; conferir que os comandos e pré-condições correspondem ao workflow.

## 3. Migrar a candidata RC.4

- [x] 3.1 Gerar um manifesto schema 2 para `v1.0.0-rc.4` a partir dos registros privados EAS e conferir que os IDs, números, perfis, formatos e commits correspondem aos builds existentes, sem gravar URLs de download no arquivo gerado.
- [x] 3.2 Revisar a Release RC.4 em rascunho, retirar qualquer link direto de download das notas/ativos e anexar somente o manifesto seguro; conferir antes da publicação que a tag e o SHA não foram alterados.
- [x] 3.3 Executar o deploy manual do Pages a partir de `main` para `v1.0.0-rc.4` e verificar no site publicado que a versão e o commit correspondem à candidata e que os dois arquivos JSON públicos não contêm endereços de artefato ou credenciais temporárias.
- [x] 3.4 Confirmar que os registros EAS privados comprovam a identidade e o formato dos builds existentes; não é necessário criar nova candidata nem alterar RC.4.
