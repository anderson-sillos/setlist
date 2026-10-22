import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import * as ExpoCrypto from 'expo-crypto';
import { useEffect, type PropsWithChildren } from 'react';

import type { AppRepositories, BandRole, Song } from '@/domain';
import { queryKeys } from '@/data/queryKeys';
import {
  acceptCurrentBandTerm,
  getCurrentBandTermAcceptance,
} from '@/data/supabase/legalTermMutations';
import {
  createSong,
  SongMutationError,
  updateSong,
} from '@/data/supabase/songMutations';
import { SongEditorScreen } from '@/features/repertoire/SongEditorScreen';
import {
  createBand,
  createBandMember,
  createSong as createSongEntity,
} from '@/testing/factories';
import { createInMemoryRepositories } from '@/testing/repositories';
import { createBandScenario } from '@/testing/scenarios';
import { TestAppProviders } from '@/testing/TestAppProviders';

const mockRouter = {
  back: jest.fn(),
  canGoBack: jest.fn().mockReturnValue(true),
  push: jest.fn(),
  replace: jest.fn(),
};

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: object }) => children,
  useFocusEffect: (effect: () => void | (() => void)) => {
    const React = jest.requireActual<typeof import('react')>('react');
    React.useEffect(effect, [effect]);
  },
  useRouter: () => mockRouter,
  useNavigation: () => ({ addListener: () => jest.fn(), dispatch: jest.fn() }),
}));

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
}));

jest.mock('@/data/supabase/songMutations', () => {
  const actual = jest.requireActual('@/data/supabase/songMutations');

  return {
    ...actual,
    createSong: jest.fn(),
    updateSong: jest.fn(),
  };
});

jest.mock('@/data/supabase/legalTermMutations', () => ({
  acceptCurrentBandTerm: jest.fn(),
  getCurrentBandTermAcceptance: jest.fn(),
}));
jest.mock('@/data/supabase/songLifecycleMutations', () => ({
  archiveSong: jest.fn(),
  removeSong: jest.fn(),
  restoreSong: jest.fn(),
  SongLifecycleMutationError: class MockSongLifecycleMutationError extends Error {},
}));

const mockArchiveSong = (
  jest.requireMock('@/data/supabase/songLifecycleMutations') as {
    archiveSong: jest.Mock;
  }
).archiveSong;
const mockRemoveSong = (
  jest.requireMock('@/data/supabase/songLifecycleMutations') as {
    removeSong: jest.Mock;
  }
).removeSong;
const mockRestoreSong = (
  jest.requireMock('@/data/supabase/songLifecycleMutations') as {
    restoreSong: jest.Mock;
  }
).restoreSong;

const mockCreateSong = jest.mocked(createSong);
const mockUpdateSong = jest.mocked(updateSong);
const mockAcceptCurrentBandTerm = jest.mocked(acceptCurrentBandTerm);
const mockGetCurrentBandTermAcceptance = jest.mocked(
  getCurrentBandTermAcceptance,
);
const mockRandomUUID = jest.mocked(ExpoCrypto.randomUUID);

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(),
}));

const TEST_USER_ID = 'user-live';

function AppProviders({
  children,
  repositories,
}: PropsWithChildren<{ readonly repositories: AppRepositories }>) {
  return (
    <TestAppProviders currentUserId={TEST_USER_ID} repositories={repositories}>
      {children}
    </TestAppProviders>
  );
}

function QueryClientCapture({
  onReady,
}: {
  readonly onReady: (client: QueryClient) => void;
}) {
  const client = useQueryClient();
  useEffect(() => {
    onReady(client);
  }, [client, onReady]);
  return null;
}

function createRepositories(
  role: BandRole = 'owner',
  songOverrides: Partial<Song> = {},
) {
  const bandId = 'band-live';
  const song = createSongEntity({
    ...songOverrides,
    bandId,
    id: 'song-live',
    originalArtist: 'Artista do repertório',
  });
  const scenario = createBandScenario({
    bandId,
    role,
    songs: [song],
    userId: TEST_USER_ID,
  });

  return {
    bandId,
    repositories: scenario.repositories,
    song,
    songId: song.id,
  };
}

describe('<SongEditorScreen />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouter.canGoBack.mockReturnValue(true);
    mockRandomUUID.mockReset();
    mockGetCurrentBandTermAcceptance.mockResolvedValue(true);
  });

  it.each([true, false])(
    'abre a criação ao receber foco sem consultar uma música inexistente (termo aceito: %s)',
    async (accepted) => {
      const { bandId, repositories } = createRepositories('editor');
      const invalidSongIdError = new Error(
        'invalid input syntax for type uuid: ""',
      );
      const findSong = jest
        .spyOn(repositories.songs, 'findById')
        .mockRejectedValue(invalidSongIdError);
      mockGetCurrentBandTermAcceptance.mockResolvedValue(accepted);
      let client: QueryClient | undefined;
      const view = await render(
        <AppProviders repositories={repositories}>
          <QueryClientCapture
            onReady={(value) => {
              client = value;
            }}
          />
          <SongEditorScreen bandId={bandId} />
        </AppProviders>,
      );

      if (accepted) {
        await view.findByLabelText('Título da música *');
      } else {
        await view.findByText('Antes de editar');
        expect(view.queryByLabelText('Título da música *')).toBeNull();
      }
      expect(findSong).not.toHaveBeenCalled();

      // A sessão pode conter o erro de uma consulta indevida feita antes da correção.
      await act(async () => {
        await client!
          .fetchQuery({
            queryKey: queryKeys.songs.documentById(bandId, ''),
            queryFn: () => Promise.reject(invalidSongIdError),
            retry: false,
          })
          .catch(() => undefined);
      });

      if (!accepted) {
        expect(view.getByText('Antes de editar')).toBeTruthy();
        mockGetCurrentBandTermAcceptance.mockResolvedValue(true);
        mockAcceptCurrentBandTerm.mockResolvedValue(undefined);
        await fireEvent.press(
          view.getByLabelText('Aceitar termo de responsabilidade para editar'),
        );
        await fireEvent.press(view.getByText('Aceitar e editar'));
      }

      expect(await view.findByLabelText('Título da música *')).toBeTruthy();
    },
  );

  it('mostra falha real ao carregar uma música para edição e permite tentar novamente', async () => {
    const { bandId, repositories, songId, song } = createRepositories('editor');
    const findSong = jest
      .spyOn(repositories.songs, 'findById')
      .mockRejectedValueOnce(new Error('Falha de conexão.'));
    const view = await render(
      <AppProviders repositories={repositories}>
        <SongEditorScreen bandId={bandId} songId={songId} />
      </AppProviders>,
    );

    await view.findByTestId('feedback-error');
    expect(view.queryByLabelText('Título da música *')).toBeNull();
    await fireEvent.press(view.getByText('Tentar novamente'));

    expect((await view.findByLabelText('Título da música *')).props.value).toBe(
      song.title,
    );
    expect(findSong).toHaveBeenCalledWith(bandId, songId);
  });

  it.each(['criação', 'edição'])(
    'sugere artistas apenas das músicas cadastradas na banda atual na %s',
    async (mode) => {
      const bandId = 'band-artist-suggestions';
      const otherBandId = 'other-band-artists';
      const song = createSongEntity({
        bandId,
        id: 'song-current-artist',
        originalArtist: 'Artista da banda',
      });
      const repositories = createInMemoryRepositories({
        bands: [createBand({ id: bandId }), createBand({ id: otherBandId })],
        bandMembers: [bandId, otherBandId].map((id) =>
          createBandMember({
            bandId: id,
            id: `membership-${id}`,
            role: 'owner',
            userId: TEST_USER_ID,
          }),
        ),
        shows: [],
        songs: [
          song,
          createSongEntity({
            bandId,
            id: 'song-same-artist',
            originalArtist: ' Artista da banda ',
          }),
          createSongEntity({
            bandId,
            id: 'song-without-artist',
            originalArtist: null,
          }),
          createSongEntity({
            bandId,
            id: 'song-archived-artist',
            originalArtist: 'Artista arquivado',
            archivedAt: '2026-10-01T00:00:00.000Z',
          }),
          createSongEntity({
            bandId: otherBandId,
            id: 'song-other-band-artist',
            originalArtist: 'Artista de outra banda',
          }),
        ],
      });
      const view = await render(
        <AppProviders repositories={repositories}>
          <SongEditorScreen
            bandId={bandId}
            songId={mode === 'edição' ? song.id : undefined}
          />
        </AppProviders>,
      );

      const artistField = await view.findByLabelText('Artista/Banda');
      await fireEvent.changeText(artistField, '');
      await fireEvent(artistField, 'focus');

      expect(
        await view.findAllByLabelText('Usar Artista da banda'),
      ).toHaveLength(1);
      expect(view.queryByLabelText('Usar Artista de outra banda')).toBeNull();
      await fireEvent.press(view.getByLabelText('Usar Artista arquivado'));
      expect(view.getByLabelText('Artista/Banda').props.value).toBe(
        'Artista arquivado',
      );
      await fireEvent.changeText(
        view.getByLabelText('Artista/Banda'),
        'Novo artista',
      );
      expect(view.getByLabelText('Artista/Banda').props.value).toBe(
        'Novo artista',
      );
    },
  );

  it('carrega sugestões sem depender da consulta das outras bandas do usuário', async () => {
    const { bandId, repositories } = createRepositories();
    const listUserBands = jest
      .spyOn(repositories.bands, 'listUserSummaries')
      .mockRejectedValue(new Error('Outra banda está indisponível.'));
    const view = await render(
      <AppProviders repositories={repositories}>
        <SongEditorScreen bandId={bandId} />
      </AppProviders>,
    );

    const artistField = await view.findByLabelText('Artista/Banda');
    await fireEvent(artistField, 'focus');

    expect(
      await view.findByLabelText('Usar Artista do repertório'),
    ).toBeTruthy();
    expect(listUserBands).not.toHaveBeenCalled();
  });

  it('cria música para Owner e navega aos detalhes após salvar', async () => {
    const { bandId, repositories } = createRepositories('owner');
    const listSongDocuments = jest.spyOn(repositories.songs, 'listByBandId');
    const listSongSummaries = jest.spyOn(
      repositories.songs,
      'listSummariesByBandId',
    );
    const listUserBandSummaries = jest.spyOn(
      repositories.bands,
      'listUserSummaries',
    );
    mockCreateSong.mockResolvedValue('song-created');
    mockRandomUUID
      .mockReturnValueOnce('new-block')
      .mockReturnValueOnce('new-line')
      .mockReturnValueOnce('new-blank-line')
      .mockReturnValueOnce('new-refrain')
      .mockReturnValueOnce('new-refrain-line');
    const view = await render(
      <AppProviders repositories={repositories}>
        <SongEditorScreen bandId={bandId} />
      </AppProviders>,
    );

    await view.findByLabelText('Título da música *');
    await fireEvent.changeText(
      view.getByLabelText('Título da música *'),
      '  Nova faixa  ',
    );
    await fireEvent(view.getByLabelText('Artista/Banda'), 'focus');
    expect(view.getByLabelText('Usar Artista do repertório')).toBeTruthy();
    await fireEvent.press(view.getByLabelText('Usar Artista do repertório'));
    await fireEvent.changeText(view.getByLabelText('BPM'), '110');
    await fireEvent.changeText(view.getByLabelText('Minutos da duração'), '3');
    await fireEvent.changeText(
      view.getByLabelText('Segundos da duração'),
      '45',
    );
    await fireEvent.changeText(
      view.getByLabelText('Letra completa'),
      '# Verso\nA rua acende devagar\n---\n# Refrão\nLevanta a voz',
    );
    await fireEvent.press(view.getByText('Salvar música'));

    expect(listUserBandSummaries).not.toHaveBeenCalled();
    expect(listSongSummaries).toHaveBeenCalledWith(bandId, {
      includeArchived: true,
    });
    expect(listSongDocuments).not.toHaveBeenCalled();

    await waitFor(() =>
      expect(mockCreateSong).toHaveBeenCalledWith({
        bandId,
        song: expect.objectContaining({
          bpm: 110,
          estimatedDurationMs: 225000,
          title: 'Nova faixa',
        }),
        lyrics: {
          blocks: [
            {
              id: 'new-block',
              name: 'Verso',
              lines: [
                {
                  id: 'new-line',
                  startTimeMs: null,
                  text: 'A rua acende devagar',
                },
                {
                  id: 'new-blank-line',
                  startTimeMs: null,
                  text: '',
                },
              ],
            },
            {
              id: 'new-refrain',
              name: 'Refrão',
              lines: [
                {
                  id: 'new-refrain-line',
                  startTimeMs: null,
                  text: 'Levanta a voz',
                },
              ],
            },
          ],
        },
      }),
    );
    expect(mockRouter.replace).toHaveBeenCalledWith(
      `/bands/${bandId}/repertoire/song-created`,
    );
  });

  it('edita metadados existentes para Editor sem sobrescrever a letra', async () => {
    const { bandId, repositories, song, songId } = createRepositories('editor');
    const findSongById = jest.spyOn(repositories.songs, 'findById');
    const listSongDocuments = jest.spyOn(repositories.songs, 'listByBandId');
    mockUpdateSong.mockResolvedValue(undefined);
    const view = await render(
      <AppProviders repositories={repositories}>
        <SongEditorScreen bandId={bandId} songId={songId} />
      </AppProviders>,
    );

    const title = await view.findByLabelText('Título da música *');
    expect(title.props.value).toBe(song.title);
    await fireEvent.changeText(title, 'Título atualizado');
    await fireEvent.press(view.getByText('Salvar música'));

    await waitFor(() =>
      expect(mockUpdateSong).toHaveBeenCalledWith({
        bandId,
        lyrics: song.lyrics,
        songId,
        song: expect.objectContaining({ title: 'Título atualizado' }),
      }),
    );
    expect(findSongById).toHaveBeenCalledWith(bandId, songId);
    expect(listSongDocuments).not.toHaveBeenCalled();
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it('orienta sobre recusa do filtro e permite corrigir e reenviar a edição', async () => {
    const { bandId, repositories, songId } = createRepositories('editor');
    mockUpdateSong
      .mockRejectedValueOnce(
        new SongMutationError(
          'content_rejected',
          'O conteúdo foi recusado pelo filtro preventivo. Revise a música ou solicite uma análise em contato@setlistbr.app.br.',
        ),
      )
      .mockResolvedValueOnce(undefined);
    const view = await render(
      <AppProviders repositories={repositories}>
        <SongEditorScreen bandId={bandId} songId={songId} />
      </AppProviders>,
    );

    const title = await view.findByLabelText('Título da música *');
    await fireEvent.changeText(title, 'Título sinalizado');
    await fireEvent.press(view.getByText('Salvar música'));

    expect(
      await view.findByText(
        'O conteúdo foi recusado pelo filtro preventivo. Revise a música ou solicite uma análise em contato@setlistbr.app.br.',
      ),
    ).toBeTruthy();
    expect(view.getByLabelText('Título da música *').props.value).toBe(
      'Título sinalizado',
    );

    await fireEvent.changeText(
      view.getByLabelText('Título da música *'),
      'Título ajustado',
    );
    await fireEvent.press(view.getByText('Salvar música'));

    await waitFor(() => expect(mockUpdateSong).toHaveBeenCalledTimes(2));
    expect(mockUpdateSong).toHaveBeenLastCalledWith(
      expect.objectContaining({
        bandId,
        songId,
        song: expect.objectContaining({ title: 'Título ajustado' }),
      }),
    );
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it('usa os detalhes da música como fallback quando a edição foi aberta diretamente', async () => {
    const { bandId, repositories, songId } = createRepositories('editor');
    mockRouter.canGoBack.mockReturnValue(false);

    const view = await render(
      <AppProviders repositories={repositories}>
        <SongEditorScreen bandId={bandId} songId={songId} />
      </AppProviders>,
    );

    await view.findByLabelText('Título da música *');
    await fireEvent.press(view.getByText('Cancelar'));

    expect(mockRouter.replace).toHaveBeenCalledWith(
      `/bands/${bandId}/repertoire/${songId}`,
    );
  });

  it('mantém os campos e as ações roláveis e valida título obrigatório', async () => {
    const { bandId, repositories } = createRepositories();
    const view = await render(
      <AppProviders repositories={repositories}>
        <SongEditorScreen bandId={bandId} />
      </AppProviders>,
    );

    await view.findByTestId('song-editor-keyboard-layout');
    expect(view.getByTestId('song-editor-scroll')).toBeTruthy();
    expect(view.getByText('Cancelar')).toBeTruthy();
    await fireEvent.press(view.getByText('Salvar música'));

    expect(await view.findByText('Informe o título da música.')).toBeTruthy();
    expect(mockCreateSong).not.toHaveBeenCalled();
  });

  it('preserva os dados do formulário se a gravação falhar', async () => {
    const { bandId, repositories } = createRepositories();
    mockCreateSong.mockRejectedValue(
      new SongMutationError('request_failed', 'Falha ao salvar no servidor.'),
    );
    const view = await render(
      <AppProviders repositories={repositories}>
        <SongEditorScreen bandId={bandId} />
      </AppProviders>,
    );

    const title = await view.findByLabelText('Título da música *');
    await fireEvent.changeText(title, 'Faixa que não pode sumir');
    await fireEvent.press(view.getByText('Salvar música'));

    expect(await view.findByText('Falha ao salvar no servidor.')).toBeTruthy();
    expect(view.getByLabelText('Título da música *').props.value).toBe(
      'Faixa que não pode sumir',
    );
  });

  it('exige aceite do termo vigente antes de liberar a criação para Editor', async () => {
    const { bandId, repositories } = createRepositories('editor');
    mockGetCurrentBandTermAcceptance
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);
    mockAcceptCurrentBandTerm.mockResolvedValue(undefined);
    const view = await render(
      <AppProviders repositories={repositories}>
        <SongEditorScreen bandId={bandId} />
      </AppProviders>,
    );

    expect(await view.findByText('Antes de editar')).toBeTruthy();
    expect(view.queryByLabelText('Título da música *')).toBeNull();
    await fireEvent.press(
      view.getByLabelText('Aceitar termo de responsabilidade para editar'),
    );
    await fireEvent.press(view.getByText('Aceitar e editar'));

    await waitFor(() =>
      expect(mockAcceptCurrentBandTerm).toHaveBeenCalledWith({
        bandId,
        termVersion: '2026-10',
      }),
    );
    expect(await view.findByLabelText('Título da música *')).toBeTruthy();
  });

  it('oferece as opções de ciclo de vida no cabeçalho da edição', async () => {
    const { bandId, repositories, songId } = createRepositories('owner');
    mockArchiveSong.mockResolvedValue(undefined);
    const view = await render(
      <AppProviders repositories={repositories}>
        <SongEditorScreen bandId={bandId} songId={songId} />
      </AppProviders>,
    );

    await view.findByLabelText('Título da música *');
    await fireEvent.press(view.getByLabelText('Mais opções da música'));
    await fireEvent.press(view.getByLabelText('Arquivar música'));

    expect(mockArchiveSong).toHaveBeenCalledWith({
      bandId,
      songId,
    });
    expect(await view.findByText('Música arquivada')).toBeTruthy();
    expect(
      view.getByText(
        'Ela não aparecerá em novas setlists, mas os shows existentes continuam intactos.',
      ),
    ).toBeTruthy();
  });

  it('permite restaurar uma música arquivada pela edição', async () => {
    const { bandId, repositories, songId } = createRepositories('owner', {
      archivedAt: '2026-09-24T12:00:00.000Z',
    });
    mockRestoreSong.mockResolvedValue(undefined);
    const view = await render(
      <AppProviders repositories={repositories}>
        <SongEditorScreen bandId={bandId} songId={songId} />
      </AppProviders>,
    );

    await view.findByLabelText('Título da música *');
    await fireEvent.press(view.getByLabelText('Mais opções da música'));
    await fireEvent.press(view.getByLabelText('Restaurar música'));

    expect(mockRestoreSong).toHaveBeenCalledWith({
      bandId,
      songId,
    });
    expect(await view.findByText('Música restaurada')).toBeTruthy();
  });

  it('remove definitivamente uma música sem referências em shows', async () => {
    const { bandId, repositories, songId } = createRepositories('owner');
    mockRemoveSong.mockResolvedValue('deleted');
    const view = await render(
      <AppProviders repositories={repositories}>
        <SongEditorScreen bandId={bandId} songId={songId} />
      </AppProviders>,
    );

    await view.findByLabelText('Título da música *');
    await fireEvent.press(view.getByLabelText('Mais opções da música'));
    await fireEvent.press(view.getByLabelText('Excluir música'));
    await fireEvent.press(view.getByLabelText('Confirmar exclusão da música'));

    expect(mockRemoveSong).toHaveBeenCalledWith({
      bandId,
      songId,
    });
    expect(mockRouter.replace).toHaveBeenCalledWith(
      `/bands/${bandId}/repertoire`,
    );
  });

  it('bloqueia a edição de Member', async () => {
    const { bandId, repositories } = createRepositories('member');
    const view = await render(
      <AppProviders repositories={repositories}>
        <SongEditorScreen bandId={bandId} />
      </AppProviders>,
    );

    expect(
      await view.findByText(
        'Seu papel permite consultar o repertório, não editá-lo',
      ),
    ).toBeTruthy();
    expect(view.queryByText('Salvar música')).toBeNull();
    expect(mockGetCurrentBandTermAcceptance).not.toHaveBeenCalled();
  });
});
