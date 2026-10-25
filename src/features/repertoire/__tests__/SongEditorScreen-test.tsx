import { QueryClient, useQueryClient } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  render,
  waitFor,
  within,
} from '@testing-library/react-native';
import * as ExpoCrypto from 'expo-crypto';
import { useEffect, type PropsWithChildren } from 'react';
import { Animated, Keyboard, Platform, StyleSheet } from 'react-native';

import { LrclibRequestError, searchLrclibTracks } from '@/data/lrclib/client';
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

jest.mock('@/data/lrclib/client', () => ({
  ...jest.requireActual('@/data/lrclib/client'),
  searchLrclibTracks: jest.fn(),
}));

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
const mockSearchTracks = jest.mocked(searchLrclibTracks);
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
    mockSearchTracks.mockReset();
    mockGetCurrentBandTermAcceptance.mockResolvedValue(true);
  });

  it.each(['ios', 'android'] as const)(
    'conecta a rolagem diretamente ao driver nativo no %s',
    async (platform) => {
      const originalPlatform = Platform.OS;
      Object.defineProperty(Platform, 'OS', {
        configurable: true,
        value: platform,
      });
      const configureScroll = jest.spyOn(Animated, 'event');
      try {
        const { bandId, repositories } = createRepositories();
        const view = await render(
          <AppProviders repositories={repositories}>
            <SongEditorScreen bandId={bandId} />
          </AppProviders>,
        );
        await view.findByLabelText('Título da música *');
        expect(configureScroll).toHaveBeenCalledWith(expect.any(Array), {
          useNativeDriver: true,
        });
        await view.unmount();
      } finally {
        configureScroll.mockRestore();
        Object.defineProperty(Platform, 'OS', {
          configurable: true,
          value: originalPlatform,
        });
      }
    },
  );

  it.each([
    ['celular', 390, 0, 390, 24, true, 64],
    ['tela ampla', 1366, 123, 1120, 147, true, 64],
    ['navegador com barra de rolagem', 390, 0, 375, 39, true, 64],
    ['edição com header ampliado', 390, 0, 390, 24, true, 80],
    ['criação com header ampliado', 390, 0, 390, 24, false, 80],
  ] as const)(
    'fixa a varinha no limite seguro do header sem desvio à esquerda em %s',
    async (
      _screen,
      viewportWidth,
      contentX,
      contentWidth,
      titleRight,
      editing,
      headerHeight,
    ) => {
      const { bandId, repositories, songId, song } = createRepositories();
      mockSearchTracks.mockResolvedValue([]);
      const dismissKeyboard = jest.spyOn(Keyboard, 'dismiss');
      const originalPlatform = Platform.OS;
      Object.defineProperty(Platform, 'OS', {
        configurable: true,
        value: 'web',
      });
      const configureScroll = jest.spyOn(Animated, 'event');
      const originalAddEventListener = window.addEventListener;
      const originalRemoveEventListener = window.removeEventListener;
      window.addEventListener = jest.fn();
      window.removeEventListener = jest.fn();
      let unmount: (() => Promise<void>) | undefined;

      try {
        const view = await render(
          <AppProviders repositories={repositories}>
            <SongEditorScreen
              bandId={bandId}
              songId={editing ? songId : undefined}
            />
          </AppProviders>,
        );
        unmount = () => view.unmount();
        await view.findByLabelText('Título da música *');
        expect(configureScroll).toHaveBeenCalledWith(expect.any(Array), {
          useNativeDriver: false,
        });
        const expectButtonPosition = (position: {
          top: number;
          right?: number;
        }) => {
          const style = StyleSheet.flatten(
            view.getByTestId('song-enrichment-position').props.style,
          );
          const transforms = style.transform as readonly {
            translateX?: number;
            translateY?: number;
          }[];
          const translateX = transforms.reduce(
            (total, transform) => total + (transform.translateX ?? 0),
            0,
          );
          const translateY = transforms.reduce(
            (total, transform) => total + (transform.translateY ?? 0),
            0,
          );
          // Layout stays fixed; only native-compatible transforms follow scroll.
          expect(style.top).toBe(headerHeight + 44);
          expect(style.right).toBe(titleRight);
          expect(style.top + translateY).toBeCloseTo(position.top);
          if (position.right !== undefined) {
            expect(style.right - translateX).toBeCloseTo(position.right);
          }
        };
        if (!editing) {
          await fireEvent.changeText(
            view.getByLabelText('Título da música *'),
            song.title,
          );
        }
        const titleField = view.getByTestId('song-editor-title-field');
        expect(
          within(titleField).getByLabelText('Completar música'),
        ).toBeTruthy();

        await fireEvent(view.getByTestId('screen-static-area'), 'layout', {
          nativeEvent: {
            layout: {
              x: 0,
              y: headerHeight,
              width: viewportWidth,
              height: 680,
            },
          },
        });
        if (editing) {
          const menu = view.getByLabelText('Mais opções da música');
          await fireEvent(menu, 'layout', {
            nativeEvent: {
              layout: {
                x: viewportWidth - 64,
                y: (headerHeight - 48) / 2,
                width: 48,
                height: 48,
              },
            },
          });
          expect(menu).toHaveStyle({ width: 48, height: 48 });
          expect(menu.props.hitSlop.bottom).toBe(0);
        }

        await fireEvent(
          view.getByTestId('song-editor-form-viewport'),
          'layout',
          {
            nativeEvent: {
              layout: { x: 0, y: 0, width: viewportWidth, height: 600 },
            },
          },
        );
        await fireEvent(
          view.getByTestId('song-editor-form-content'),
          'layout',
          {
            nativeEvent: {
              layout: { x: contentX, y: 0, width: contentWidth, height: 900 },
            },
          },
        );
        await fireEvent(titleField, 'layout', {
          nativeEvent: { layout: { x: 24, y: 24, width: 342, height: 68 } },
        });
        await fireEvent(
          view.getByTestId('song-editor-title-field-input-row'),
          'layout',
          {
            nativeEvent: { layout: { x: 0, y: 20, width: 342, height: 48 } },
          },
        );

        expectButtonPosition({
          top: headerHeight + 44,
          right: titleRight,
        });
        const trigger = view.getByTestId('song-enrichment-trigger');
        expect(
          within(titleField).queryByLabelText('Completar música'),
        ).toBeNull();

        await fireEvent.scroll(view.getByTestId('song-editor-scroll'), {
          nativeEvent: { contentOffset: { x: 0, y: -12 } },
        });
        expectButtonPosition({ top: headerHeight + 56, right: titleRight });

        // The menu's presence limits how far the button can rise.
        await fireEvent.scroll(view.getByTestId('song-editor-scroll'), {
          nativeEvent: { contentOffset: { x: 0, y: 44 } },
        });
        expectButtonPosition({
          top: headerHeight,
        });

        await fireEvent.scroll(view.getByTestId('song-editor-scroll'), {
          nativeEvent: { contentOffset: { x: 0, y: 160 } },
        });
        expectButtonPosition({
          top: editing ? (headerHeight + 48) / 2 : headerHeight - 24,
          right: 8,
        });
        expect(view.getByTestId('screen-content-overlay')).toHaveStyle({
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          pointerEvents: 'box-none',
          zIndex: 5,
        });
        expect(view.getAllByLabelText('Completar música')).toHaveLength(1);
        expect(view.getByTestId('song-enrichment-trigger')).toBe(trigger);

        await fireEvent.press(trigger);
        expect(dismissKeyboard).toHaveBeenCalled();
        expect(await view.findByTestId('song-enrichment-popup')).toBeTruthy();
        expect(mockSearchTracks.mock.calls[0]?.[0].title).toBe(song.title);
        await fireEvent.press(view.getByTestId('song-enrichment-close'));

        await fireEvent.scroll(view.getByTestId('song-editor-scroll'), {
          nativeEvent: { contentOffset: { x: 0, y: 0 } },
        });
        expectButtonPosition({
          top: headerHeight + 44,
          right: titleRight,
        });
        expect(view.getByTestId('song-enrichment-trigger')).toBe(trigger);
        expect(view.getByText('Cancelar')).toBeTruthy();
        expect(view.getByText('Salvar música')).toBeTruthy();
      } finally {
        await unmount?.();
        window.addEventListener = originalAddEventListener;
        window.removeEventListener = originalRemoveEventListener;
        configureScroll.mockRestore();
        Object.defineProperty(Platform, 'OS', {
          configurable: true,
          value: originalPlatform,
        });
        dismissKeyboard.mockRestore();
      }
    },
  );

  it('dispara a busca ao lado do título, mostra um popup e completa o rascunho sem salvar', async () => {
    const { bandId, repositories } = createRepositories('owner');
    mockSearchTracks.mockResolvedValue([
      {
        recordId: 412,
        trackName: 'Tempo Perdido',
        artistName: 'Legião Urbana',
        albumName: 'Dois',
        durationMs: 180_000,
        plainLyrics: 'Primeiro verso',
        syncedLyrics: '[00:01.00]Primeiro verso',
      },
    ]);
    const view = await render(
      <AppProviders repositories={repositories}>
        <SongEditorScreen bandId={bandId} />
      </AppProviders>,
    );

    const titleInput = await view.findByLabelText('Título da música *');
    expect(
      view.getByTestId('song-enrichment-trigger').props.accessibilityState
        .disabled,
    ).toBe(true);
    await fireEvent.changeText(titleInput, 'Tempo Perdido');
    expect(
      view.getByTestId('song-enrichment-trigger').props.accessibilityState
        .disabled,
    ).toBe(false);
    expect(view.getByLabelText('Completar música')).toBeTruthy();
    await fireEvent.press(view.getByTestId('song-enrichment-trigger'));

    expect(await view.findByTestId('song-enrichment-popup')).toBeTruthy();
    expect(mockSearchTracks).toHaveBeenCalledWith(
      { title: 'Tempo Perdido', artist: '' },
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    await fireEvent.press(
      await view.findByTestId('song-enrichment-candidate-412'),
    );

    await waitFor(() =>
      expect(view.getByLabelText('Artista/Banda').props.value).toBe(
        'Legião Urbana',
      ),
    );
    expect(view.getByLabelText('Minutos da duração').props.value).toBe('3');
    expect(view.getByLabelText('Segundos da duração').props.value).toBe('00');
    expect(view.getByLabelText('Letra completa').props.value).toContain(
      'Primeiro verso',
    );
    expect(
      view.getByText(/Preenchidos: artista, duração e letra/),
    ).toBeTruthy();
    expect(view.getByText('OK')).toBeTruthy();
    expect(view.getByTestId('song-enrichment-close')).toBeTruthy();
    expect(mockCreateSong).not.toHaveBeenCalled();
    expect(mockUpdateSong).not.toHaveBeenCalled();

    await fireEvent.press(view.getByTestId('song-enrichment-close'));
    await waitFor(() =>
      expect(view.queryByTestId('song-enrichment-popup')).toBeNull(),
    );
  });

  it('permite pesquisar novamente com o rascunho editado e aplica título e artista formatados', async () => {
    const { bandId, repositories } = createRepositories('owner');
    mockSearchTracks
      .mockResolvedValueOnce([
        {
          recordId: 701,
          trackName: 'MÚSICA INICIAL',
          artistName: 'BANDA INICIAL',
          albumName: null,
          durationMs: 180_000,
          plainLyrics: 'Letra do primeiro resultado',
          syncedLyrics: '[00:01.00]Letra do primeiro resultado',
        },
      ])
      .mockResolvedValueOnce([
        {
          recordId: 702,
          trackName: 'NOVA CANÇÃO',
          artistName: 'BANDA NOVA',
          albumName: null,
          durationMs: 180_000,
          plainLyrics: 'Letra do segundo resultado',
          syncedLyrics: '[00:01.00]Letra do segundo resultado',
        },
      ]);

    const view = await render(
      <AppProviders repositories={repositories}>
        <SongEditorScreen bandId={bandId} />
      </AppProviders>,
    );
    const titleInput = await view.findByLabelText('Título da música *');
    await fireEvent.changeText(titleInput, 'musica inicial');
    await fireEvent.press(view.getByTestId('song-enrichment-trigger'));
    expect(await view.findByText('Música Inicial')).toBeTruthy();
    await fireEvent.press(
      await view.findByTestId('song-enrichment-candidate-701'),
    );

    await waitFor(() =>
      expect(view.getByLabelText('Título da música *').props.value).toBe(
        'Música Inicial',
      ),
    );
    expect(view.getByLabelText('Artista/Banda').props.value).toBe(
      'Banda Inicial',
    );

    await fireEvent.press(
      view.getByLabelText('Fechar popup de completar música'),
    );
    await fireEvent.changeText(
      view.getByLabelText('Título da música *'),
      'nova consulta',
    );
    await fireEvent.press(view.getByTestId('song-enrichment-trigger'));

    await waitFor(() => expect(mockSearchTracks).toHaveBeenCalledTimes(2));
    expect(mockSearchTracks.mock.calls[1]?.[0]).toEqual({
      title: 'nova consulta',
      artist: 'Banda Inicial',
    });
    await fireEvent.press(
      await view.findByTestId('song-enrichment-candidate-702'),
    );

    await waitFor(() =>
      expect(view.getByLabelText('Título da música *').props.value).toBe(
        'Nova Canção',
      ),
    );
    expect(view.getByLabelText('Artista/Banda').props.value).toBe('Banda Nova');
    expect(view.getByLabelText('Letra completa').props.value).toContain(
      'Letra do primeiro resultado',
    );
  });

  it('cancela a busca ao fechar o popup e ignora uma resposta tardia', async () => {
    const { bandId, repositories } = createRepositories('owner');
    let resolveSearch:
      | ((
          value: readonly {
            recordId: number;
            trackName: string;
            artistName: string;
            albumName: string | null;
            durationMs: number | null;
            plainLyrics: string | null;
            syncedLyrics: string | null;
          }[],
        ) => void)
      | undefined;
    mockSearchTracks.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSearch = resolve;
        }),
    );
    const view = await render(
      <AppProviders repositories={repositories}>
        <SongEditorScreen bandId={bandId} />
      </AppProviders>,
    );

    await fireEvent.changeText(
      await view.findByLabelText('Título da música *'),
      'Tempo Perdido',
    );
    await fireEvent.press(view.getByTestId('song-enrichment-trigger'));
    await view.findByTestId('song-enrichment-progress');
    expect(
      view.getByTestId('song-enrichment-trigger').props.accessibilityState
        .disabled,
    ).toBe(true);
    expect(
      view.getByTestId('song-editor-save').props.accessibilityState.disabled,
    ).toBe(true);
    await fireEvent.press(
      view.getByLabelText('Fechar popup de completar música'),
    );

    await act(async () => {
      resolveSearch?.([
        {
          recordId: 413,
          trackName: 'Tempo Perdido',
          artistName: 'Legião Urbana',
          albumName: 'Dois',
          durationMs: 180_000,
          plainLyrics: 'Resposta tardia',
          syncedLyrics: '[00:01.00]Resposta tardia',
        },
      ]);
      await Promise.resolve();
    });

    expect(view.queryByTestId('song-enrichment-popup')).toBeNull();
    expect(view.getByLabelText('Artista/Banda').props.value).toBe('');
    expect(view.getByLabelText('Letra completa').props.value).toBe('');
    expect(mockSearchTracks.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
    expect(mockCreateSong).not.toHaveBeenCalled();
  });

  it.each([
    ['título', 'Título da música *', 'Título corrigido'],
    ['artista', 'Artista/Banda', 'Artista corrigido'],
    ['duração', 'Minutos da duração', '4'],
  ] as const)(
    'invalida o resultado atrasado quando o rascunho muda no campo %s',
    async (_field, label, nextValue) => {
      const { bandId, repositories } = createRepositories('owner');
      let resolveSearch:
        | ((
            value: readonly {
              recordId: number;
              trackName: string;
              artistName: string;
              albumName: string | null;
              durationMs: number | null;
              plainLyrics: string | null;
              syncedLyrics: string | null;
            }[],
          ) => void)
        | undefined;
      mockSearchTracks.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveSearch = resolve;
          }),
      );
      const view = await render(
        <AppProviders repositories={repositories}>
          <SongEditorScreen bandId={bandId} />
        </AppProviders>,
      );
      await fireEvent.changeText(
        await view.findByLabelText('Título da música *'),
        'Título inicial',
      );
      await fireEvent.press(view.getByTestId('song-enrichment-trigger'));
      const signal = mockSearchTracks.mock.calls[0]?.[1]?.signal;

      await fireEvent.changeText(view.getByLabelText(label), nextValue);
      expect(signal?.aborted).toBe(true);

      await act(async () => {
        resolveSearch?.([
          {
            recordId: 416,
            trackName: 'Título inicial',
            artistName: 'Artista antigo',
            albumName: null,
            durationMs: 180_000,
            plainLyrics: 'Não aplicar',
            syncedLyrics: '[00:01.00]Não aplicar',
          },
        ]);
        await Promise.resolve();
      });

      expect(view.queryByTestId('song-enrichment-popup')).toBeNull();
      expect(view.getByLabelText(label).props.value).toBe(nextValue);
      expect(view.getByLabelText('Artista/Banda').props.value).not.toBe(
        'Artista antigo',
      );
      expect(view.getByLabelText('Letra completa').props.value).toBe('');
    },
  );

  it('preserva a letra digitada enquanto a pesquisa está em andamento', async () => {
    const { bandId, repositories } = createRepositories('owner');
    let resolveSearch:
      | ((
          value: readonly {
            recordId: number;
            trackName: string;
            artistName: string;
            albumName: string | null;
            durationMs: number | null;
            plainLyrics: string | null;
            syncedLyrics: string | null;
          }[],
        ) => void)
      | undefined;
    mockSearchTracks.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSearch = resolve;
        }),
    );
    const view = await render(
      <AppProviders repositories={repositories}>
        <SongEditorScreen bandId={bandId} />
      </AppProviders>,
    );
    await fireEvent.changeText(
      await view.findByLabelText('Título da música *'),
      'Título inicial',
    );
    await fireEvent.changeText(
      view.getByLabelText('Artista/Banda'),
      'Artista inicial',
    );
    await fireEvent.press(view.getByTestId('song-enrichment-trigger'));
    await fireEvent.changeText(
      view.getByLabelText('Letra completa'),
      'Letra escrita pela banda',
    );

    await act(async () => {
      resolveSearch?.([
        {
          recordId: 417,
          trackName: 'Título inicial',
          artistName: 'Artista inicial',
          albumName: null,
          durationMs: 180_000,
          plainLyrics: 'Letra da busca',
          syncedLyrics: '[00:01.00]Letra da busca',
        },
      ]);
      await Promise.resolve();
    });

    expect(view.getByLabelText('Letra completa').props.value).toContain(
      'Letra escrita pela banda',
    );
    expect(view.getByLabelText('Minutos da duração').props.value).toBe('3');
    expect(mockCreateSong).not.toHaveBeenCalled();
  });

  it('permite uma nova tentativa manual sem exibir detalhes técnicos', async () => {
    const { bandId, repositories } = createRepositories('owner');
    mockSearchTracks
      .mockRejectedValueOnce(
        new LrclibRequestError({ reason: 'unavailable', attemptCount: 3 }),
      )
      .mockResolvedValueOnce([
        {
          recordId: 414,
          trackName: 'Tempo Perdido',
          artistName: 'Legião Urbana',
          albumName: 'Dois',
          durationMs: 180_000,
          plainLyrics: 'Verso',
          syncedLyrics: '[00:01.00]Verso',
        },
      ]);
    const view = await render(
      <AppProviders repositories={repositories}>
        <SongEditorScreen bandId={bandId} />
      </AppProviders>,
    );
    await fireEvent.changeText(
      await view.findByLabelText('Título da música *'),
      'Tempo Perdido',
    );
    await fireEvent.press(view.getByTestId('song-enrichment-trigger'));
    await view.findByTestId('song-enrichment-retry');
    expect(view.queryByText(/lrclib|https?:|HTTP 5\d\d/i)).toBeNull();

    await fireEvent.press(view.getByTestId('song-enrichment-retry'));
    expect(
      await view.findByTestId('song-enrichment-candidate-414'),
    ).toBeTruthy();
    expect(mockSearchTracks).toHaveBeenCalledTimes(2);
  });

  it('respeita Retry-After mesmo se a popup for fechada e reaberta', async () => {
    const { bandId, repositories } = createRepositories('owner');
    mockSearchTracks.mockRejectedValueOnce(
      new LrclibRequestError({
        reason: 'rate-limited',
        httpStatus: 429,
        retryAfterMs: 60_000,
        attemptCount: 1,
      }),
    );
    const view = await render(
      <AppProviders repositories={repositories}>
        <SongEditorScreen bandId={bandId} />
      </AppProviders>,
    );
    await fireEvent.changeText(
      await view.findByLabelText('Título da música *'),
      'Título inicial',
    );
    await fireEvent.press(view.getByTestId('song-enrichment-trigger'));
    const retryButton = await view.findByTestId('song-enrichment-retry');
    expect(retryButton.props.accessibilityState.disabled).toBe(true);
    await fireEvent.press(
      view.getByLabelText('Fechar popup de completar música'),
    );

    await fireEvent.press(view.getByTestId('song-enrichment-trigger'));

    expect(await view.findByTestId('song-enrichment-retry')).toBeTruthy();
    expect(mockSearchTracks).toHaveBeenCalledTimes(1);
  });

  it('mantém tudo no mesmo popup quando a pessoa escolhe importar a letra estática', async () => {
    const { bandId, repositories } = createRepositories('owner');
    mockCreateSong.mockResolvedValue('song-created');
    mockSearchTracks.mockResolvedValue([
      {
        recordId: 415,
        trackName: 'Tempo Perdido',
        artistName: 'Legião Urbana',
        albumName: 'Dois',
        durationMs: 241_000,
        plainLyrics: 'Verso importado',
        syncedLyrics: '[00:01.00]Verso importado',
      },
    ]);
    const view = await render(
      <AppProviders repositories={repositories}>
        <SongEditorScreen bandId={bandId} />
      </AppProviders>,
    );
    await fireEvent.changeText(
      await view.findByLabelText('Título da música *'),
      'Tempo Perdido',
    );
    await fireEvent.changeText(
      view.getByLabelText('Artista/Banda'),
      'Legião Urbana',
    );
    await fireEvent.changeText(view.getByLabelText('Minutos da duração'), '3');
    await fireEvent.changeText(
      view.getByLabelText('Segundos da duração'),
      '58',
    );
    await fireEvent.press(view.getByTestId('song-enrichment-trigger'));
    await fireEvent.press(
      await view.findByTestId('song-enrichment-candidate-415'),
    );

    expect(
      await view.findByText(/a diferença passa de dois segundos/i),
    ).toBeTruthy();
    expect(view.getByTestId('song-enrichment-popup')).toBeTruthy();
    await fireEvent.press(view.getByText('Manter 3:58 e importar texto'));
    expect(view.getByLabelText('Segundos da duração').props.value).toBe('58');
    expect(view.getByLabelText('Letra completa').props.value).toContain(
      'Verso importado',
    );

    await fireEvent.press(
      view.getByLabelText('Fechar popup de completar música'),
    );
    await fireEvent.press(view.getByText('Salvar música'));
    await waitFor(() => expect(mockCreateSong).toHaveBeenCalled());
    expect(mockCreateSong).toHaveBeenCalledWith(
      expect.objectContaining({
        lyrics: {
          blocks: [
            expect.objectContaining({
              lines: [
                expect.objectContaining({
                  text: 'Verso importado',
                  startTimeMs: null,
                }),
              ],
            }),
          ],
          source: expect.objectContaining({ format: 'plain' }),
        },
      }),
    );
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
