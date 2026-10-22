# Design

## Context

A motivação está em [proposal.md](proposal.md). O comportamento proposto está em [setlist-export](specs/setlist-export/spec.md) e [show-calendar-export](specs/show-calendar-export/spec.md).

- `src/features/shows/ShowDetailScreen.tsx` já combina `useShow`, `useSongSummaries` e `useBandContext`, monta o mapa de músicas e calcula as durações. O menu do cabeçalho atualmente aparece somente para quem pode editar.
- `Show` contém início, local, estado, observações e blocos ordenados. `SongSummary` fornece título, artista, tom, BPM e duração sem carregar letras. As observações por ocorrência pertencem ao item do show.
- `getShowDurationBreakdown` soma os tempos conhecidos, incluindo cada repetição, e não indica se o total é parcial. Zero conhecido é diferente de ausência.
- `startsAt` representa um instante salvo. A apresentação usa `APP_TIME_ZONE = America/Sao_Paulo`; o show não possui fuso próprio nem término. Existem conversões dos formulários atuais baseadas no fuso do aparelho; os novos fluxos devem partir do instante salvo e não repetir essa interpretação implícita.
- Expo SDK 57, `expo-file-system`, `expo-crypto` e `react-native-svg` já fazem parte do projeto. Geração de PDF, compartilhamento de arquivos e integração com calendário precisam de módulos adicionais. A Web usa exportação estática.
- O calendário mensal de Shows é um filtro interno. O requisito do MVP que exclui integração externa descreve aquele escopo; estas capacidades são uma extensão independente e não mudam o filtro.

## Goals / Non-Goals

**Goals:**

- Compartilhar regras de conteúdo, formatação temporal e paginação entre os formatos, separando a preparação dos dados da entrega por plataforma.
- Gerar arquivos utilizáveis localmente, incluindo PDF para download direto na Web, com consumo de memória limitado por página na geração de PNG.
- Reutilizar consultas e controles existentes e preservar autorização, histórico, foco e fluxo de leitura.
- Entregar somente os dados escolhidos e usar resultados reais das APIs para o feedback.

**Non-Goals:**

- Criar uma nova persistência de shows, de arquivos gerados ou de vínculos com eventos pessoais.
- Transformar a prévia em editor do show ou do repertório, ou acrescentar suporte offline ainda não implementado.
- Tornar o calendário pessoal uma fonte de dados do Setlist. Demais limites de produto estão em `proposal.md`.

## Decisions

### 1. Separar decisões confirmadas e defaults do desenho

Foram confirmados na exploração: PDF, TXT e PNG na primeira entrega; ausência de letras; cópia pontual para a agenda com confirmação do usuário.

Os demais comportamentos abaixo são defaults propostos neste planejamento, sujeitos à revisão dos artefatos: acesso para todos os papéis que consultam o show; campos inicialmente selecionados; A4 e PNG paginado; bloqueio de nova cópia de show Cancelado; término local ajustável. Não são tratados como confirmações adicionais dadas pelo usuário.

### 2. Usar uma cópia imutável dos dados autorizados

Criar uma preparação de documento com o contexto da banda, o show completo e somente os `SongSummary` referenciados. Reutilizar as leituras em cache da tela; se o fluxo for aberto diretamente por rota, usar as mesmas chaves de consulta e carregar as dependências ausentes. Não iniciar buscas de letras nem consultas individuais por música.

O contrato interno de preparação deve conter apenas os campos necessários: identificação pública da banda/show, instante inicial, fuso de apresentação, estado, local, observações selecionáveis, blocos e ocorrências com metadados. Letras, documentos completos de músicas, dados de integrantes e credenciais não pertencem a esse contrato. Identificadores usados para associação interna não são impressos.

Ao abrir a prévia, criar uma cópia estável. Mudanças conhecidas nas consultas disponibilizam `Atualizar prévia`; essa ação reconstrói a cópia e invalida arquivos gerados anteriormente. Os três formatos leem a mesma cópia e as mesmas opções. A geração não usa valores parcialmente carregados ou rascunhos de outro editor.

Música não consultável mantém uma ocorrência com `Música indisponível`. Nenhum valor antigo de uma música ocultada é recuperado de outra fonte. Perda de acesso conhecida encerra a preparação e impede novas entregas. Arquivos já salvos ou recebidos externamente permanecem cópias independentes.

**Alternativas consideradas:** consultar dados separadamente para cada formato produziria documentos divergentes e leituras duplicadas; usar o conteúdo completo de `Song` transferiria letras sem necessidade.

### 3. Abrir telas de preparação com retorno para o mesmo show

Adicionar rotas de preparação sob `src/app/bands/[bandId]/shows/[showId]/`, com telas de recurso para exportação e calendário. Os nomes propostos são `export.tsx` e `calendar.tsx`, apoiados pelos helpers de rotas existentes.

O cabeçalho dos detalhes passa a disponibilizar `Mais opções` também a Member. Dentro dele, as ações existentes de edição mantêm seus testes de papel e estado; os novos comandos dependem do acesso de consulta. Encerrar o menu antes da navegação, respeitando o ciclo de fechamento da plataforma. Não sobrepor dois `Modal` para passar do menu à preparação.

As telas preservam o tema atual nos controles e usam uma região clara apenas para a representação do documento. O retorno por botão, gesto, navegador ou hardware volta ao show de origem, e o fechamento de camadas mantém a ordem prevista em `screen-navigation`. Abrir a criação de evento do sistema a partir de uma tela evita acrescentar um formulário nativo sobre outro modal do Setlist.

**Alternativa considerada:** empilhar o seletor de formato, a prévia e o calendário em modais economizaria rotas, mas aumentaria o risco de conflitos de apresentação e dificultaria retorno, foco e teclado.

### 4. Definir conteúdo selecionável e um modelo de página comum

O cabeçalho sempre contém banda, show, início com fuso, local, estado e geração. A ordem dos blocos e itens é a ordem salva; músicas recebem numeração contínua, inclusive repetições, e planejamento/separadores não consomem números.

Defaults de abertura:

| Campo | Inicialmente selecionado |
| --- | --- |
| Artista | Sim |
| Tom | Sim |
| Durações | Sim |
| Anotações de planejamento | Sim |
| BPM | Não |
| Observações gerais do show | Não |
| Observações por ocorrência | Não |

Observações de `Song.notes` não são incluídas: a exportação representa os dados do show e seus metadados, não o cadastro completo de cada música. Nenhuma opção oferece letras.

Se durações estiverem ligadas, o total usa exatamente a regra atual do show. Retirar descrições de planejamento não recalcula o show: a legenda continua distinguindo músicas e planejamento. Ao desligar durações, retirar tempos individuais e totais. Valores ausentes são traços ou `Duração não informada`, e zero conhecido permanece zero.

Criar um modelo de páginas com linhas de texto já quebradas, caixas e separadores, medido por uma fonte local distribuível com licença incluída no futuro asset. Usar a mesma fonte e suas métricas na paginação e nos renderizadores. Cabeçalhos de bloco acompanham ao menos o primeiro item; itens normalmente ficam juntos; texto maior que uma página continua com identificação. Não reduzir a fonte para fazer o show caber em uma única página.

O TXT apresenta a mesma seleção de conteúdo em sequência, usando títulos de bloco e divisórias textuais, sem inserir números de página artificiais. PDF e PNG seguem o mesmo conjunto de páginas A4, com cabeçalho de continuação e `Página n de N`. PNG usa resolução fixa própria para leitura e impressão, inicialmente equivalente a aproximadamente 150 dpi, independente da largura da tela.

**Alternativas consideradas:** fotografar a tela atual incluiria o tema escuro, poderia omitir conteúdo fora da rolagem e vincularia a qualidade ao aparelho; uma única imagem de altura ilimitada aumentaria o consumo de memória e poderia ficar ilegível nos destinos.

### 5. Gerar PDF em JavaScript e PNG por página

Usar `pdf-lib` e suporte a fonte incorporada com `@pdf-lib/fontkit` para gerar os bytes de PDF nas três plataformas. Essa escolha permite arquivo PDF direto também no navegador, texto selecionável e fonte consistente. Carregar os módulos de geração e os bytes da fonte sob demanda, mantendo-os fora do caminho inicial da tela de Shows.

Renderizar o modelo de página em SVG no nativo, reutilizando `react-native-svg`, e obter PNG por sua exportação nativa de imagem. Na Web, pintar as mesmas linhas, caixas e separadores em Canvas 2D com a fonte carregada. A prévia mantém uma representação textual acessível; a imagem decorativa não substitui os controles nem o acesso ao conteúdo por leitor de tela. Registrar a fonte como dependência explícita via `expo-font` se esse for o mecanismo usado no nativo, sem depender apenas de instalação transitiva.

Gerar uma página por vez e liberar a superfície antes de produzir a próxima. O resultado é uma lista de arquivos numerados; a interface mostra todas as páginas e oferece salvar/compartilhar cada imagem. Compartilhamento em lote só aparece se o adaptador suportar todos os arquivos; a primeira entrega não depende dele para acessar cada página.

Para impressão móvel, usar `expo-print` com o PDF gerado. Para a Web, preparar documento de impressão isolado com o mesmo conteúdo e fonte, sem a navegação do app. A ação de imprimir parte de um novo gesto do usuário quando a preparação estiver pronta. O PDF direto continua disponível mesmo quando o navegador ou visualizador não abre a impressão automaticamente.

**Alternativas consideradas:** somente `expo-print` resolveria PDF móvel, mas na Web seu caminho abre o diálogo de impressão e não entrega o arquivo PDF direto; rasterizar o PDF para obter PNG exigiria outro motor de PDF no aparelho/navegador; acrescentar captura da tela inteira ou conversão HTML genérica traria dependências e diferenças de layout desnecessárias para este documento textual.

### 6. Isolar entrega e ciclo de vida dos arquivos

Um contrato de entrega recebe nome, tipo MIME e bytes/arquivo local e devolve somente o resultado conhecido: preparado, interface externa aberta, salvamento confirmado quando disponível, cancelamento informado ou falha. O retorno de uma API que apenas fecha o seletor não prova recebimento por destinatário.

- Nativo: `expo-file-system` para arquivos em cache e `expo-sharing` para entrega ao seletor do sistema; usar salvamento por seletor de arquivos quando suportado. A indisponibilidade de uma opção mantém o arquivo preparado e permite a alternativa disponível ou nova tentativa, com mensagem específica.
- Web: `Blob`/`File`, download por URL de objeto e `navigator.canShare({ files })` antes de mostrar compartilhamento. A ação de compartilhar é um clique separado após a geração, preservando a ativação exigida pelo navegador. APIs do navegador ficam em adaptadores `.web`, sem execução durante a exportação estática.
- Nomes sanitizados incluem show, data e formato; PNG acrescenta número de página. O conteúdo do documento permanece intacto; a sanitização afeta o nome de arquivo e caracteres de controle incompatíveis com o formato.
- Textos de usuário são tratados como texto, com escapes no renderizador/serializador. Não interpolar observações como HTML, SVG ativo ou propriedades iCalendar.

URLs de objeto são liberadas quando deixam de ser usadas. Temporários nativos ficam em diretório próprio do cache, com limpeza das operações expiradas em momento sem consumidor ativo; usar inicialmente expiração de 24 horas. O sistema não apaga um arquivo antes de o seletor ou a impressão poder consumi-lo e não tenta recolher cópias já salvas pelo usuário.

**Alternativas consideradas:** publicar arquivos em Storage ou gerar links públicos acrescentaria upload, expiração e autorização de compartilhamento desnecessários; presumir suporte de compartilhamento pela plataforma, sem verificar o arquivo, falharia em navegadores e tipos de arquivo específicos.

### 7. Preparar um evento temporário com datas explícitas

Reutilizar os dados já autorizados, mas construir um contrato de evento menor que o documento da setlist. Título proposto: `<banda> — <show>`; local copiado de `venue`; descrição com banda, estado de preparação, fuso de referência e observações gerais somente se selecionadas. Não acrescentar setlist, letras, integrantes, convites ou lembretes próprios.

O início vem do instante de `startsAt`. A prévia usa o fuso atual do produto, obtido de `APP_TIME_ZONE`, sem introduzir outra constante ou armazenar um fuso por show. O término é editável com data e hora explícitas; sua conversão para instante usa esse mesmo fuso, sem `Date` de texto local ambíguo nem offset fixo codificado.

Quando `totalMs > 0`, sugerir início mais o total conhecido e mostrar que o fim é estimado e ajustável. Para duração ausente ou zero, deixar o término pendente e exigir preenchimento. Validar `fim > início`, incluindo virada do dia. Alterar o término da cópia não grava nada em `shows`. O formulário nativo pode permitir outros ajustes pessoais sem retorno desses valores ao Setlist.

Shows Cancelados não iniciam nova cópia ativa. Rascunhos são permitidos com o estado descrito; não mapear `ready` do Setlist para confirmação de contratação ou convite do calendário. Não impedir cópia de evento passado apenas por sua data.

**Alternativas consideradas:** inferir um término definitivo da soma parcial seria impreciso; adotar uma duração arbitrária quando nada foi informado esconderia uma decisão; acrescentar término ao banco ampliaria o cadastro do show para uma necessidade da cópia pessoal.

### 8. Usar formulário nativo e arquivo ICS para entrega pontual

Nos aplicativos, usar o formulário de criação do sistema, com escolha e confirmação no calendário pelo usuário. Para o SDK 57, encapsular o caminho documentado `expo-calendar/legacy` com `createEventInCalendarAsync`, que oferece esse formulário sem exigir leitura da agenda. Não chamar o nome antigo pelo módulo principal, cuja documentação de migração informa mudança de API. A compatibilidade deve ser verificada em development build nas plataformas suportadas antes da integração final.

O adaptador normaliza o resultado: iOS pode confirmar gravação ou cancelamento; Android pode retornar apenas `done`, sem ID e sem prova de gravação. Nesse caso, comunicar que o calendário foi aberto/retornou e sugerir conferir o evento. Nenhum retorno dispara gravação adicional automática.

Oferecer `.ics` na Web e como alternativa móvel. Serialização conforme RFC 5545: `VCALENDAR` com `VERSION:2.0`, `PRODID` e `CALSCALE:GREGORIAN`; um `VEVENT` com `UID`, `DTSTAMP`, `DTSTART`, `DTEND`, `SUMMARY`, `LOCATION` e `DESCRIPTION`. Datas são escritas em UTC com `Z`; texto usa escape próprio, CRLF e divisão de linhas por octetos UTF-8 sem romper caracteres. Não incluir `METHOD:REQUEST`, convidados ou organizador, pois se trata de cópia pessoal e não de convite.

Derivar `UID` estável do identificador do show por hash com namespace do Setlist, usando `expo-crypto` já instalado; imprimir o hash e o domínio, não o identificador interno em texto claro. A estabilidade identifica o evento, mas não oferece garantia de deduplicação ou atualização nos importadores. Informar no fluxo que uma nova adição pode criar outra cópia.

**Alternativas consideradas:** acesso direto de escrita a calendários exigiria permissões e vínculo com registros pessoais; integração por OAuth ou assinatura de feed exigiria outros serviços e sincronização; somente ICS no móvel aumentaria a dependência dos importadores instalados para uma ação pessoal simples.

## Risks / Trade-offs

- **Texto extenso ou muitos itens:** paginação, continuação explícita, PNG por página e geração sequencial; falhas não podem deixar arquivos parciais apresentados como completos.
- **Acentos, glifos e métricas diferentes:** mesma fonte incorporável, quebra de linhas explícita e validação de caracteres reais em PDF e PNG; falha de fonte deve ser comunicada, sem substituir texto silenciosamente.
- **Calendário SDK 57 em transição de APIs:** adaptação isolada para o formulário documentado, versões compatíveis fixadas e testes em development build. A migração futura da API preservará o contrato externo.
- **Fusos dos formulários existentes:** partir do instante salvo e converter somente o término com fuso explícito. Corrigir cadastros antigos ou reformular os editores atuais não faz parte desta change.
- **Cancelamento ou salvamento não observável:** feedback limitado ao resultado retornado; nunca gravar um segundo evento para compensar uma confirmação desconhecida.
- **Observações escolhidas podem conter conteúdo que a pessoa não deseja enviar:** campos inicialmente desmarcados e prévia fiel antes da entrega.
- **Arquivo temporário ainda usado por outro aplicativo:** manter a referência enquanto a entrega está ativa e limpar somente depois da janela de consumo; arquivos de destino já salvos ficam sob controle do usuário.
- **Cópia de dados durante atualização:** preparação imutável e ação explícita de atualizar; a operação não promete sincronização nem revogação de arquivos externos.

## Migration Plan

1. Implementar os módulos e integrar as duas rotas sem alterar contratos do Supabase ou o término do show salvo.
2. Adicionar e fixar dependências compatíveis e a fonte local, incluindo a licença de redistribuição; gerar development builds para validar a apresentação nativa e os arquivos reais.
3. Executar a matriz de validação de conteúdo, arquivos, datas, permissões, retorno e acessibilidade antes de disponibilizar os novos comandos em uma release.
4. Distribuir Web e novos builds iOS/Android pelo fluxo de release existente. As tags e os artefatos de releases anteriores permanecem imutáveis.
5. Em caso de regressão, reverter a integração dos comandos e gerar nova entrega; não há migração de dados a desfazer. Cópias de arquivos e eventos já criadas permanecem externas ao Setlist.

## Validation progress (2026-10-22)

- Runtime versions: Expo `~57.0.26`, Expo Router `~57.0.24`, React Native
  `0.86.3`, `expo-calendar ~57.0.6`, Node `24.21.0`, npm `11.20.0`.
- Production Web static export completed with
  `EXPO_WEB_BASE_URL=.` and `npx expo export --platform web --max-workers 1`.
  Metro bundled the server renderer and Web entry successfully; all 24 static
  routes were emitted, including the new show export and calendar routes. The
  minified Web entry is 7.2 MB and both local Roboto files were copied to the
  output assets.
- The Pages preparation step completed on a temporary copy of the exported
  site, including `404.html`, every route HTML, and the `/setlist/app/` fallback
  loader. This command must use the same relative base path as the Pages
  workflow; omitting `EXPO_WEB_BASE_URL=.` locally produces root-absolute asset
  paths that the Pages helper intentionally does not accept.
- Development builds were generated and installed on 2026-10-22:
  iOS Simulator build `1.0.0 (7)` (`37c4713b-a895-412d-9fa2-71062e75b91c`)
  was opened on an iPhone 16 Pro Simulator running iOS 18.3; Android build
  `1.0.0 (9)` (`c530cb70-af90-4fd3-91e9-9fd160ff8af5`) was installed on
  `SM_S731B`. These builds confirm native compilation and installation only.
  Export-file generation and opening, native sharing/printing, PNG rendering,
  calendar-form behavior, and real `.ics` import still require hands-on
  validation and remain unchecked in `tasks.md`.

## References

- [PDF-LIB: execução JavaScript, React Native e fontes](https://pdf-lib.js.org/).
- [react-native-svg: uso e exportação de imagem](https://github.com/software-mansion/react-native-svg/blob/main/USAGE.md).
- [Expo Print SDK 57: PDF, impressão e comportamento Web](https://docs.expo.dev/versions/v57.0.0/sdk/print/).
- [Expo Sharing SDK 57: entrega de arquivos e limitações Web](https://docs.expo.dev/versions/v57.0.0/sdk/sharing/).
- [Web Share API: arquivos, validação e ativação do usuário](https://www.w3.org/TR/web-share/).
- [Expo Calendar SDK 57: formulário no adaptador legacy e permissões](https://docs.expo.dev/versions/v57.0.0/sdk/calendar-legacy/).
- [Expo Calendar SDK 57: API atual e migração](https://docs.expo.dev/versions/v57.0.0/sdk/calendar/).
- [RFC 5545: formato iCalendar](https://www.rfc-editor.org/info/rfc5545/).
