# Exportação de shows e cópia para calendário

## Exportar setlist

Em **Shows**, abra os detalhes do show, selecione **Mais opções** e depois
**Exportar setlist**. A ação está disponível para quem pode consultar o show na
banda.

A prévia reúne os dados do show e os resumos de músicas já usados pelo app. Ela
permanece estável enquanto é revisada. Se os dados mudarem, use **Atualizar
prévia com os dados atuais** antes de gerar outro arquivo.

Escolha PDF, Texto, Imagem ou Imprimir e revise as informações incluídas. Imagem
gera um arquivo PNG por página; Imprimir prepara o roteiro sem criar um arquivo
para compartilhar. Artista, tom, durações e planejamento começam selecionados.
BPM e observações do show ou de cada ocorrência começam desmarcados. Nenhum
formato inclui letras. A data e o horário do show seguem a apresentação do
Setlist, sem um campo separado de fuso. A situação do show aparece identificada
como **Situação**. PDF, Imagem e impressão mostram a data e hora de geração no
rodapé, alinhadas à direita e sem rótulo, no formato `dd/mm/yyyy HH:MM`. No
Texto, essa data fica como última linha.

A pré-visualização começa ajustada à largura disponível. Use `−` e `+` para
reduzir ou ampliar em passos de 25 pontos percentuais, ou selecione **Ajustar à
largura** para voltar ao tamanho que cabe na área. Quando ampliada, a página
pode ser percorrida horizontalmente. A escala escolhida permanece ao mudar de
página e afeta somente a pré-visualização; PDF e Imagem mantêm o layout A4.

PDF e PNG usam páginas A4. O PDF contém texto selecionável e pode ser impresso.
Cada página PNG é gerada separadamente, em aproximadamente 150 dpi, e recebe
seu próprio arquivo numerado. Navegue entre as páginas para gerar e entregar
cada imagem. O TXT contém a mesma seleção de conteúdo em sequência, sem
numeração de páginas.

### Entrega dos arquivos

- **Web:** o navegador inicia o download. O compartilhamento de arquivo só é
  oferecido quando o próprio navegador confirma suporte; a impressão abre uma
  janela isolada com o roteiro.
- **iOS e Android:** o seletor de compartilhamento do sistema permite escolher
  um destino disponível. O Setlist não recebe confirmação de que um destino
  salvou ou enviou o arquivo. Se o seletor não estiver disponível, a interface
  informa a limitação.
- Arquivos temporários nativos ficam no cache do app e podem ser removidos após
  24 horas. Arquivos já copiados para outro destino ficam sob controle do
  usuário.

## Adicionar uma cópia ao calendário

Nos detalhes de um show, abra **Mais opções** e selecione **Adicionar ao
calendário**. Shows Cancelados não podem ser adicionados como novos eventos
ativos. Rascunhos, shows Prontos e shows passados podem ser preparados.

O início vem do instante salvo no show e é apresentado no fuso
`America/Sao_Paulo`. O término é calculado a partir das durações registradas no
setlist. Se não houver duração positiva, o Setlist usa uma estimativa padrão de
duas horas. A prévia identifica a estimativa; o término pode ser ajustado no
formulário do calendário e não é gravado no show. A duração cadastrada pode ser
parcial, então o término real pode ser diferente.

O evento usa o título `<banda> — <show>`, local e status do show. Observações
gerais só são incluídas se forem selecionadas. A descrição identifica o
**status** do show, o fuso de referência e que o término é estimado. A cópia não
contém setlist, letras, integrantes, convidados ou lembretes do Setlist. No iOS
e Android, **Adicionar ao calendário** abre o formulário de criação do sistema
para revisão e confirmação. O Android pode retornar sem informar se o evento
foi salvo; nesse caso, confira o calendário pessoal.

**Compartilhar** gera um arquivo `.ics` e abre automaticamente o seletor do
sistema. Na Web, se o navegador não aceitar compartilhamento de arquivos, o
download começa automaticamente. O arquivo contém um único evento. Uma adição
posterior é uma nova cópia; mudanças no Setlist não atualizam eventos já
criados, e o Setlist não consegue garantir que calendários externos evitarão
duplicatas. Ao voltar do seletor, a prévia permanece na tela enquanto os dados
do show podem ser atualizados.

## Validação da entrega

Os development builds usados na validação foram:

- [iOS Simulator, versão 1.0.0 (7)](https://expo.dev/accounts/anderson-silloss-team/projects/setlist/builds/37c4713b-a895-412d-9fa2-71062e75b91c)
- [Android, versão 1.0.0 (9)](https://expo.dev/accounts/anderson-silloss-team/projects/setlist/builds/c530cb70-af90-4fd3-91e9-9fd160ff8af5)

Em 23/10/2026, o responsável confirmou a conclusão das validações funcionais,
de acessibilidade e de calendários reais nas plataformas previstas. O registro
detalhado de dispositivos, navegadores e calendários usados não foi fornecido
nesta atualização. Os builds de produção e a exportação Web da versão candidata
devem ser gerados do mesmo commit final identificado pela tag; os development
builds acima não substituem esses artefatos. O andamento está em
`openspec/changes/exportar-setlist-e-adicionar-show-calendario/tasks.md`.
