## Why

Bandas precisam organizar repertórios e shows e, durante uma apresentação, acompanhar letras no tempo correto sem depender de folhas, arquivos dispersos ou áudio armazenado no aparelho. O Setlist propõe reunir esse fluxo em um aplicativo móvel compartilhado, simples de preparar e confiável no palco, inclusive sem conexão.

## What Changes

- Criar um aplicativo Setlist compatível com celulares e tablets Android e iOS.
- Permitir que usuários autenticados com Google ou Apple participem de uma ou mais bandas com papéis de Owner, Editor ou Member.
- Organizar o repertório compartilhado de cada banda, mantendo uma única versão de cada música e permitindo seu arquivamento.
- Cadastrar letras estruturadas em blocos e linhas, com sincronização manual por marcação do início de cada linha durante a reprodução de um vídeo de referência do YouTube.
- Criar shows com informações gerais, status, blocos nomeados e uma setlist ordenada que possa ser duplicada de outro show.
- Disponibilizar um modo palco com cronômetro manual e independente por aparelho, destaque da linha atual e controles de execução.
- Permitir baixar previamente shows para consulta e execução offline, sem edição offline.
- Informar quando músicas ou pacotes baixados possuem atualizações disponíveis, sem manter histórico ou múltiplas versões de uma música.
- Manter o reconhecimento automático da música e a sincronização automática entre aparelhos fora do MVP.

## Capabilities

### New Capabilities

- `band-access`: autenticação social, bandas, participações, papéis e convites.
- `song-repertoire`: cadastro, organização, atualização e arquivamento das músicas pertencentes a uma banda.
- `lyric-timing`: estruturação da letra e marcação manual dos tempos das linhas com referência do YouTube.
- `show-setlists`: cadastro de shows, estados, blocos e ordenação das músicas da setlist.
- `stage-mode`: apresentação da letra sincronizada com cronômetro manual independente em cada aparelho.
- `offline-shows`: download, atualização e remoção de pacotes de shows para uso offline.

### Modified Capabilities

Nenhuma. O projeto ainda não possui capacidades funcionais existentes.

## Impact

- Novo aplicativo em React Native com Expo para Android e iOS.
- Backend hospedado no Supabase para autenticação, banco PostgreSQL e controle de acesso com RLS.
- Integração com Google e Apple para login social e com o player incorporado do YouTube apenas durante a preparação da sincronização.
- Uso do SecureStore somente para manter a sessão autenticada no aparelho.
- Uso de arquivos JSON locais para pacotes de shows, letras, tempos e preferências; SQLite e armazenamento local de áudio não fazem parte do MVP.
