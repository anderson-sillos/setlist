# Guia de tom e voz do Setlist

## Objetivo

O Setlist deve conversar como alguém da equipe de palco: próximo, direto, calmo e capaz de aliviar pequenos contratempos sem esconder o que aconteceu. A informalidade deve facilitar a ação, não competir com ela.

## Personalidade

- Usar português brasileiro simples e frases curtas.
- Preferir referências leves a música, ensaio, palco e bastidores.
- Tratar erros recuperáveis sem culpar o usuário.
- Informar primeiro o resultado relevante e a ação disponível.
- Evitar excesso de exclamações, gírias regionais, ironia ou humor depreciativo.
- Manter nomes de ações previsíveis: `Salvar`, `Cancelar`, `Tentar novamente`, `Limpar filtros` e `Desfazer`.

## Estrutura das mensagens

Quando houver uma ação necessária, a mensagem deve combinar personalidade e orientação objetiva:

```text
[frase informal breve]. [o que aconteceu ou o que fazer agora].
```

Exemplo:

```text
Essa nota saiu do tom. Não conseguimos salvar; tente novamente.
```

## Onde usar informalidade

- Carregamentos.
- Estados vazios.
- Buscas ou filtros sem resultado.
- Confirmações de sucesso.
- Perda e recuperação de conexão sem impacto irreversível.
- Erros recuperáveis que preservam o conteúdo.

## Onde não usar humor

A linguagem deve ser direta e neutra quando a situação envolver:

- Exclusão de conta ou banda.
- Remoção de integrante ou alteração de permissão.
- Termos legais, responsabilidade por letras e privacidade.
- Perda, descarte ou corrupção de conteúdo.
- Falta de autorização, segurança ou sessão inválida.
- Qualquer consequência irreversível.

## Variações controladas

- Cada situação pode ter duas ou três mensagens aprovadas com o mesmo significado.
- A mensagem não deve mudar enquanto o mesmo estado permanecer visível.
- A ação, a gravidade e a informação essencial devem ser idênticas entre as variações.
- Testes devem validar o identificador semântico do estado e os controles disponíveis, sem depender de uma única frase quando houver variação.
- Mensagens anunciadas por TalkBack ou VoiceOver devem transmitir o mesmo significado da versão visual, sem criar sons ou diálogos adicionais.

## Catálogo inicial

| Situação                            | Exemplos aprovados                                                                   | Ação                                |
| ----------------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------- |
| Carregamento geral                  | `Afinando os instrumentos...` / `Preparando o palco...`                              | Nenhuma                             |
| Repertório vazio                    | `O palco está silencioso por aqui. Que tal adicionar a primeira música?`             | `Adicionar música` quando permitido |
| Shows vazios                        | `A agenda ainda está em silêncio. Que tal marcar o próximo show?`                    | `Criar show` quando permitido       |
| Calendário sem show no dia          | `Agenda livre. Até o amplificador pode descansar.`                                   | Nenhuma                             |
| Busca sem resultado                 | `Nem o roadie encontrou essa. Tente outra busca.`                                    | `Limpar filtros` quando aplicável   |
| Salvamento concluído                | `Tudo no compasso. Alterações salvas.` / `Pronto, ficou redondo. Alterações salvas.` | Nenhuma                             |
| Erro recuperável ao salvar          | `Essa nota saiu do tom. Não conseguimos salvar; tente novamente.`                    | `Tentar novamente`                  |
| Sem conexão com conteúdo disponível | `A internet saiu para tomar uma água. Você continua com o que já foi carregado.`     | Nenhuma                             |
| Conexão necessária                  | `A conexão ainda não voltou para o palco. Reconecte para continuar.`                 | `Tentar novamente` quando aplicável |
| Conexão restabelecida               | `A internet voltou para o bis.` / `Conexão de volta. Podemos continuar.`             | Nenhuma                             |
| Remoção reversível                  | `Item removido da setlist.`                                                          | `Desfazer`                          |

## Mensagens sensíveis

Mensagens sensíveis não terão variação cômica. Exemplos:

- `Excluir esta banda removerá permanentemente repertório, shows e convites.`
- `Você precisa promover outro Proprietário antes de sair da banda.`
- `Este conteúdo está indisponível ou você não possui autorização para acessá-lo.`
- `O pacote do show está corrompido e precisa ser baixado novamente.`

## Manutenção

Novas mensagens devem reutilizar este vocabulário e registrar variações aprovadas junto ao código responsável pela situação. Se uma piada tornar a consequência ou a ação menos clara, a versão objetiva deve prevalecer.
