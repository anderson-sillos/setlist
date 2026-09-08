## Why

Bandas precisam organizar repertórios e shows e, durante uma apresentação, acompanhar letras no tempo correto sem depender de folhas, arquivos dispersos ou áudio armazenado no aparelho. O Setlist propõe reunir esse fluxo em uma aplicação compartilhada para celulares, tablets e computadores, simples de preparar e confiável no palco, inclusive sem conexão nos dispositivos móveis.

## What Changes

- Criar uma aplicação Setlist com uma única base Expo compatível com celulares e tablets Android e iOS e com navegadores em computadores.
- Oferecer na versão web os mesmos fluxos principais de administração, ensaio e modo palco, exigindo conexão; o funcionamento offline ficará restrito aos aplicativos móveis.
- Permitir que usuários autenticados com Google ou Apple participem de uma ou mais bandas com papéis de Owner, Editor ou Member.
- Permitir que o usuário permaneça autenticado sem ter ou selecionar uma banda e aceite posteriormente um convite recebido.
- Organizar o repertório compartilhado de cada banda, mantendo uma única versão de cada música e permitindo seu arquivamento.
- Cadastrar letras estruturadas em blocos e linhas, com sincronização manual por marcação do início de cada linha durante a reprodução de um vídeo de referência do YouTube.
- Criar shows com informações gerais, status, blocos nomeados e uma setlist ordenada que possa ser duplicada de outro show.
- Disponibilizar um modo palco com cronômetro manual e independente por aparelho, destaque da linha atual e controles de execução.
- Permitir baixar previamente shows Prontos nos aplicativos móveis para consulta e execução offline, sem edição offline.
- Informar quando músicas ou pacotes baixados possuem atualizações disponíveis, sem manter histórico ou múltiplas versões de uma música.
- Exigir, na criação da banda e antes da primeira edição por cada Owner ou Editor, o aceite de um termo de responsabilidade sobre os direitos das letras cadastradas.
- Manter o reconhecimento automático da música e a sincronização automática entre aparelhos fora do MVP.

## Capabilities

### New Capabilities

- `band-access`: autenticação social, bandas, participações, papéis, convites, exclusão de conta e aceite do termo de responsabilidade por conteúdo.
- `song-repertoire`: cadastro, organização, atualização e arquivamento das músicas pertencentes a uma banda.
- `lyric-timing`: estruturação da letra e marcação manual dos tempos das linhas com referência do YouTube.
- `show-setlists`: cadastro de shows, estados, blocos e ordenação das músicas da setlist.
- `stage-mode`: apresentação da letra sincronizada com cronômetro manual independente em cada aparelho.
- `offline-shows`: download, atualização e remoção de pacotes de shows para uso offline nos aplicativos móveis.

### Modified Capabilities

Nenhuma. O projeto ainda não possui capacidades funcionais existentes.

## Impact

- Nova aplicação em React Native com Expo para Android, iOS e web, com interface responsiva compartilhada.
- Backend hospedado no Supabase para autenticação, banco PostgreSQL e controle de acesso com RLS.
- Integração com Google e Apple para login social e com o player incorporado do YouTube durante a preparação da sincronização.
- Uso do SecureStore somente para manter a sessão autenticada nos aplicativos móveis e do armazenamento do navegador para a sessão web.
- Uso de arquivos JSON locais para pacotes de shows, letras, tempos e preferências nos aplicativos móveis; SQLite, pacotes offline no navegador e armazenamento local de áudio não fazem parte do MVP.
