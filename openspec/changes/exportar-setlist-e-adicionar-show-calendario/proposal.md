# Proposal

## Why

Integrantes precisam levar o roteiro de um show para impressão ou compartilhar um arquivo fora do Setlist, preservando a ordem das músicas e a identificação do evento. Também precisam copiar os dados do show para a agenda pessoal com uma confirmação, sem cadastrar novamente título, data e local.

## What Changes

- Oferecer `Exportar setlist` e `Adicionar ao calendário` nos detalhes de um show consultável por Owner, Editor ou Member.
- Disponibilizar PDF, texto UTF-8 (`.txt`) e imagem PNG na primeira entrega, sempre sem letras. O documento terá identificação da banda e do show, data, horário, local, estado e blocos com suas músicas na ordem salva, incluindo repetições.
- Apresentar prévia e seleção de metadados, durações, planejamento e observações antes de gerar os arquivos; usar apresentação própria para impressão e paginação legível em PDF e PNG.
- Gerar os arquivos localmente e oferecer compartilhamento, download/salvamento e impressão conforme a plataforma, com recuperação quando o compartilhamento não estiver disponível.
- Criar uma cópia pontual do show para a agenda, com prévia, término ajustável e confirmação do usuário. Usar o formulário de evento do sistema nos aplicativos móveis e oferecer arquivo iCalendar (`.ics`) para importação ou compartilhamento.
- Preservar o instante de início salvo e formatar datas conforme a apresentação do Setlist; a exportação não imprime um campo de fuso, enquanto a preparação do calendário informa o fuso usado. Usar a duração estimada somente como sugestão de término, sujeita à confirmação.
- Registrar o que foi efetivamente gerado ou aberto, distinguindo esses resultados da confirmação de gravação no calendário.

## Capabilities

### New Capabilities

- `setlist-export`: seleção, prévia, geração e entrega local de roteiros de show em PDF, TXT e PNG, com paginação, equivalência de conteúdo e acesso autorizado.
- `show-calendar-export`: preparação e entrega de uma cópia pontual do evento ao calendário pessoal, com datas explícitas, formulário nativo e arquivo `.ics`.

### Modified Capabilities

Nenhuma especificação principal precisa ter seus requisitos substituídos. As novas capacidades respeitam `band-data-summaries`, `screen-navigation` e `application-ui`. A exportação de eventos amplia o escopo além do calendário interno descrito na change `definir-mvp-setlist`; aquele calendário continua sendo um filtro de Shows.

## Impact

- Integração em `ShowDetailScreen`, reutilizando `Show`, `BandContext`, `SongSummary` e os cálculos de duração existentes; novos módulos de preparação de documentos, paginação e adaptadores por plataforma.
- Dependências para geração de PDF, captura/renderização de PNG, compartilhamento de arquivos e abertura do calendário, compatíveis com Expo SDK 57; seleção e limites documentados no desenho técnico.
- Novos builds nativos após a implementação dos módulos necessários. A Web continuará compatível com exportação estática.
- Sem necessidade prevista de migração no Supabase: o término pertence à cópia da agenda e não altera o cadastro do show.
- Validação de conteúdo, paginação, acessibilidade, fusos, cancelamento e entrega dos arquivos em Web, iOS e Android.

## Non-goals

- Exportar letras, vídeos ou áudio; importar setlists; editar o arquivo e sincronizá-lo de volta ao Setlist.
- Sincronizar mudanças ou cancelamentos com calendários externos, publicar calendários por assinatura ou solicitar credenciais de Google Calendar/Outlook.
- Criar links públicos de shows, armazenar os arquivos gerados no backend ou implementar novos pacotes offline.
- Alterar o cadastro de shows para incluir término, endereço estruturado ou fuso individual nesta entrega.
