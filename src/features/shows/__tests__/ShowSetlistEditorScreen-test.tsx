import {
  act,
  fireEvent,
  render,
  waitFor,
  within,
} from '@testing-library/react-native';
import type { ReactNode } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { Platform, StyleSheet } from 'react-native';
import { layout } from '@/theme/tokens';
import {
  ShowMutationError,
  renameShowBlock,
  reorderShowBlocks,
  replaceShowBlockItems,
} from '@/data/supabase';

import { createInMemoryRepositories } from '@/testing/repositories';
import type {
  AppRepositories,
  BandRole,
  EntityId,
  RepertoireCollection,
  RepertoireCollectionSong,
  Show,
  Song,
} from '@/domain';
import { ShowSetlistEditorScreen } from '@/features/shows/ShowSetlistEditorScreen';
import {
  createBand,
  createBandMember,
  createRepertoireCollection,
  createRepertoireCollectionSong,
  createShow,
  createShowSetlistBlock,
  createShowSongSetlistItem,
  createSong,
} from '@/testing/factories';
import { TestAppProviders as AppProviders } from '@/testing/TestAppProviders';

const BAND_ID = 'band-setlist-editor';
const OWNER_USER_ID = 'user-setlist-editor-owner';
const MEMBER_USER_ID = 'user-setlist-editor-member';
const CLUB_SHOW_ID = 'show-noite-no-clube';
const READY_SHOW_ID = 'show-ready';
const COLLECTION_ID = 'collection-acustico';
const LIGHTS_SONG_ID = 'song-luzes-da-cidade';
const NEON_SONG_ID = 'song-mare-de-neon';
const BRIDGES_SONG_ID = 'song-entre-pontes';
const RAIN_SONG_ID = 'song-depois-da-chuva';
const LIGHTS_SONG = createSong({
  id: LIGHTS_SONG_ID,
  bandId: BAND_ID,
  title: 'Luzes da Cidade',
  originalArtist: 'Banda Horizonte',
  estimatedDurationMs: 218_000,
});
const NEON_SONG = createSong({
  id: NEON_SONG_ID,
  bandId: BAND_ID,
  title: 'Maré de Neon',
  originalArtist: 'Coletivo Atlântico',
  estimatedDurationMs: 252_000,
});
const BRIDGES_SONG = createSong({
  id: BRIDGES_SONG_ID,
  bandId: BAND_ID,
  title: 'Entre Pontes',
  originalArtist: 'Banda Horizonte',
  estimatedDurationMs: 204_000,
});
const RAIN_SONG = createSong({
  id: RAIN_SONG_ID,
  bandId: BAND_ID,
  title: 'Depois da Chuva',
  originalArtist: 'Banda Horizonte',
  estimatedDurationMs: 232_000,
});
const SONGS = [LIGHTS_SONG, NEON_SONG, BRIDGES_SONG, RAIN_SONG];
const ACOUSTIC_COLLECTION = createRepertoireCollection({
  id: COLLECTION_ID,
  bandId: BAND_ID,
  name: 'Acústico',
});
const COLLECTION_SONGS = [
  createRepertoireCollectionSong({
    bandId: BAND_ID,
    collectionId: COLLECTION_ID,
    position: 0,
    songId: LIGHTS_SONG_ID,
  }),
  createRepertoireCollectionSong({
    bandId: BAND_ID,
    collectionId: COLLECTION_ID,
    position: 1,
    songId: NEON_SONG_ID,
  }),
];
const CLUB_SHOW = createShow({
  id: CLUB_SHOW_ID,
  bandId: BAND_ID,
  name: 'Noite no Clube',
  startsAt: '2027-03-14T20:30:00-03:00',
  venue: 'Clube das Artes',
  status: 'draft',
  blocks: [
    createShowSetlistBlock({
      id: 'show-block-clube-principal',
      name: 'Principal',
      items: [
        createShowSongSetlistItem({
          id: 'show-item-clube-pontes',
          songId: BRIDGES_SONG_ID,
        }),
        createShowSongSetlistItem({
          id: 'show-item-clube-luzes',
          songId: LIGHTS_SONG_ID,
        }),
      ],
    }),
  ],
});
const READY_SHOW = createShow({
  id: READY_SHOW_ID,
  bandId: BAND_ID,
  name: 'Show pronto',
  status: 'ready',
});
const DEFAULT_REPOSITORY_DATA = {
  bands: [createBand({ id: BAND_ID })],
  bandMembers: [
    createBandMember({
      id: 'membership-setlist-editor',
      bandId: BAND_ID,
      role: 'owner',
      userId: OWNER_USER_ID,
    }),
  ],
  repertoireCollections: [ACOUSTIC_COLLECTION],
  repertoireCollectionSongs: COLLECTION_SONGS,
  songs: SONGS,
  shows: [CLUB_SHOW, READY_SHOW],
};

function createRepositories({
  role = 'owner',
  bands = DEFAULT_REPOSITORY_DATA.bands,
  bandMembers = [
    createBandMember({
      id: 'membership-setlist-editor',
      bandId: BAND_ID,
      role,
      userId: role === 'member' ? MEMBER_USER_ID : OWNER_USER_ID,
    }),
  ],
  repertoireCollections = DEFAULT_REPOSITORY_DATA.repertoireCollections,
  repertoireCollectionSongs = DEFAULT_REPOSITORY_DATA.repertoireCollectionSongs,
  songs = DEFAULT_REPOSITORY_DATA.songs,
  shows = DEFAULT_REPOSITORY_DATA.shows,
  createId,
}: {
  role?: BandRole;
  bands?: readonly ReturnType<typeof createBand>[];
  bandMembers?: ReturnType<typeof createBandMember>[];
  repertoireCollections?: readonly RepertoireCollection[];
  repertoireCollectionSongs?: readonly RepertoireCollectionSong[];
  songs?: readonly Song[];
  shows?: readonly Show[];
  createId?: () => string;
} = {}): AppRepositories {
  return createInMemoryRepositories(
    {
      bands,
      bandMembers,
      repertoireCollections,
      repertoireCollectionSongs,
      songs,
      shows,
    },
    { createId },
  );
}

function TestProviders({
  children,
  currentUserId = OWNER_USER_ID,
  repositories = createRepositories(),
}: {
  children: ReactNode;
  currentUserId?: EntityId;
  repositories?: AppRepositories;
}) {
  return (
    <AppProviders currentUserId={currentUserId} repositories={repositories}>
      {children}
    </AppProviders>
  );
}

jest.mock('@/data/supabase', () => ({
  ...jest.requireActual('@/data/supabase'),
  renameShowBlock: jest.fn().mockResolvedValue(undefined),
  reorderShowBlocks: jest.fn().mockResolvedValue(undefined),
  replaceShowBlockItems: jest.fn().mockResolvedValue(undefined),
}));

const mockRouter = {
  back: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
};

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: object }) => children,
  useFocusEffect: jest.fn(),
  useRouter: () => mockRouter,
  useNavigation: () => ({ addListener: () => jest.fn(), dispatch: jest.fn() }),
}));

function getNativeDismiss(
  view: Awaited<ReturnType<typeof render>>,
  testID: string,
) {
  let parent = view.getByTestId(testID).parent;
  while (parent && typeof parent.props.onDismiss !== 'function') {
    parent = parent.parent;
  }
  if (!parent) throw new Error('Modal de confirmação não encontrado');
  return parent.props.onDismiss as () => void;
}

async function openCollectionPreview(
  view: Awaited<ReturnType<typeof render>>,
  collectionId = COLLECTION_ID,
) {
  await fireEvent.press(view.getByLabelText('Adicionar à setlist'));
  await fireEvent.press(view.getByTestId('show-add-collection-action'));
  await fireEvent.press(
    view.getByTestId(`show-preview-collection-${collectionId}`),
  );
  return view.getByTestId('show-collection-preview-sheet');
}

describe('<ShowSetlistEditorScreen />', () => {
  beforeEach(() => jest.clearAllMocks());

  it('monta o editor em tela própria para um show em rascunho', async () => {
    const repositories = createRepositories();
    const listSongDocuments = jest.spyOn(repositories.songs, 'listByBandId');
    const listSongSummaries = jest.spyOn(
      repositories.songs,
      'listSummariesByBandId',
    );
    const view = await render(
      <TestProviders repositories={repositories}>
        <ShowSetlistEditorScreen bandId={BAND_ID} showId={CLUB_SHOW_ID} />
      </TestProviders>,
    );

    expect(await view.findByTestId('show-block-editor-dialog')).toBeTruthy();
    expect(listSongSummaries).toHaveBeenCalledWith(BAND_ID, {
      includeArchived: true,
    });
    expect(listSongDocuments).not.toHaveBeenCalled();
    const editorRoot = view.getByTestId('show-block-editor-dialog').parent;
    if (!editorRoot) throw new Error('Container do editor não encontrado');
    expect(StyleSheet.flatten(editorRoot.props.style).maxWidth).toBe(
      layout.contentMaxWidth,
    );
    expect(view.getByLabelText('Nome do bloco 1')).toBeTruthy();

    expect(view.getByLabelText('Adicionar à setlist')).toBeTruthy();
    await fireEvent.press(view.getByLabelText('Adicionar à setlist'));
    expect(view.getByTestId('show-add-collection-action')).toBeTruthy();
    await fireEvent.press(view.getByTestId('show-add-collection-action'));
    expect(view.getByTestId('show-collection-picker-sheet')).toBeTruthy();
    expect(
      view.getByTestId(`show-preview-collection-${COLLECTION_ID}`),
    ).toBeTruthy();
    await fireEvent.press(
      view.getByTestId(`show-preview-collection-${COLLECTION_ID}`),
    );

    const preview = view.getByTestId('show-collection-preview-sheet');
    const previewSongs = within(
      view.getByTestId('show-collection-preview-songs'),
    );
    expect(within(preview).getByText('Principal')).toBeTruthy();
    expect(within(preview).getByText('2 músicas elegíveis')).toBeTruthy();
    expect(within(preview).getByText('Duração estimada: 7min50s')).toBeTruthy();
    expect(
      within(preview).getByTestId('show-collection-preview-repeat-summary'),
    ).toBeTruthy();
    expect(
      previewSongs
        .getAllByTestId(/^show-collection-preview-song-/)
        .map(({ props }) => props.testID),
    ).toEqual([
      `show-collection-preview-song-${LIGHTS_SONG_ID}`,
      `show-collection-preview-song-${NEON_SONG_ID}`,
    ]);
    expect(
      view.getByTestId('show-collection-preview-repeat-' + LIGHTS_SONG_ID),
    ).toBeTruthy();
    expect(
      view.getByTestId('show-confirm-add-collection').props.accessibilityState
        ?.disabled,
    ).toBe(false);
  });

  it('mantém as opções habituais quando a banda não tem coleções', async () => {
    const repositories = createInMemoryRepositories({
      ...DEFAULT_REPOSITORY_DATA,
      repertoireCollections: [],
      repertoireCollectionSongs: [],
    });
    const view = await render(
      <TestProviders repositories={repositories}>
        <ShowSetlistEditorScreen bandId={BAND_ID} showId={CLUB_SHOW_ID} />
      </TestProviders>,
    );

    await view.findByTestId('show-block-editor-dialog');
    await fireEvent.press(view.getByLabelText('Adicionar à setlist'));

    expect(view.getByTestId('show-add-songs-action')).toBeTruthy();
    expect(view.getByLabelText('Adicionar anotação')).toBeTruthy();
    expect(view.queryByTestId('show-add-collection-action')).toBeNull();
  });

  it('mantém músicas arquivadas já no show, mas não oferece novas inclusões', async () => {
    const repositories = createInMemoryRepositories({
      ...DEFAULT_REPOSITORY_DATA,
      songs: SONGS.map((song) =>
        song.id === LIGHTS_SONG_ID
          ? { ...song, archivedAt: '2026-09-09T12:00:00.000Z' }
          : song,
      ),
    });
    const view = await render(
      <TestProviders repositories={repositories}>
        <ShowSetlistEditorScreen bandId={BAND_ID} showId={CLUB_SHOW_ID} />
      </TestProviders>,
    );

    await view.findByTestId('show-block-editor-dialog');
    const existingArchivedSong = view.getByTestId(
      'setlist-item-row-show-item-clube-luzes',
    );
    expect(
      within(existingArchivedSong).getByText('Luzes da Cidade'),
    ).toBeTruthy();

    await fireEvent.press(view.getByLabelText('Adicionar à setlist'));
    await fireEvent.press(view.getByTestId('show-add-songs-action'));
    const picker = within(view.getByTestId('show-song-picker-sheet'));

    expect(
      await picker.findByLabelText('Selecionar Maré de Neon'),
    ).toBeTruthy();
    expect(picker.queryByLabelText('Selecionar Luzes da Cidade')).toBeNull();
  });

  it('mantém a cópia no show após reordenar e excluir a coleção, usando os dados atuais', async () => {
    const updatedSongTitle = 'Luzes da Cidade (versão atual)';
    const repositories = createInMemoryRepositories({
      ...DEFAULT_REPOSITORY_DATA,
      songs: SONGS.map((song) =>
        song.id === LIGHTS_SONG_ID
          ? {
              ...song,
              estimatedDurationMs: 240_000,
              originalArtist: 'Banda Horizonte Atual',
              title: updatedSongTitle,
            }
          : song,
      ),
    });
    const view = await render(
      <TestProviders repositories={repositories}>
        <ShowSetlistEditorScreen bandId={BAND_ID} showId={CLUB_SHOW_ID} />
      </TestProviders>,
    );

    await view.findByTestId('show-block-editor-dialog');
    const preview = await openCollectionPreview(view);
    expect(within(preview).getByText(updatedSongTitle)).toBeTruthy();
    await fireEvent.press(view.getByTestId('show-confirm-add-collection'));

    await waitFor(() => {
      expect(view.getAllByTestId(/^setlist-item-row-/)).toHaveLength(4);
    });
    const primaryBlock = within(
      view.getByTestId('setlist-block-show-block-clube-principal'),
    );
    const rowsBeforeCollectionRemoval =
      primaryBlock.getAllByTestId(/^setlist-item-row-/);
    expect(
      within(rowsBeforeCollectionRemoval[2]!).getByText(updatedSongTitle),
    ).toBeTruthy();
    expect(
      within(rowsBeforeCollectionRemoval[3]!).getByText('Maré de Neon'),
    ).toBeTruthy();

    const collection = await repositories.repertoireCollections.findById(
      BAND_ID,
      COLLECTION_ID,
    );
    expect(collection).not.toBeNull();
    const reorderedCollection = await repositories.repertoireCollections.save({
      bandId: BAND_ID,
      collectionId: COLLECTION_ID,
      expectedUpdatedAt: collection!.updatedAt,
      name: collection!.name,
      orderedSongIds: [NEON_SONG_ID, LIGHTS_SONG_ID],
    });
    await repositories.repertoireCollections.delete({
      bandId: BAND_ID,
      collectionId: COLLECTION_ID,
      expectedUpdatedAt: reorderedCollection.updatedAt,
    });
    expect(
      await repositories.repertoireCollections.findById(BAND_ID, COLLECTION_ID),
    ).toBeNull();

    const rowsAfterCollectionRemoval =
      primaryBlock.getAllByTestId(/^setlist-item-row-/);
    expect(
      within(rowsAfterCollectionRemoval[2]!).getByText(updatedSongTitle),
    ).toBeTruthy();
    expect(
      within(rowsAfterCollectionRemoval[3]!).getByText('Maré de Neon'),
    ).toBeTruthy();

    await fireEvent.press(view.getByLabelText('Salvar setlist'));
    await waitFor(() => {
      expect(replaceShowBlockItems).toHaveBeenCalledWith(
        expect.objectContaining({
          blockId: 'show-block-clube-principal',
          items: expect.arrayContaining([
            expect.objectContaining({ songId: LIGHTS_SONG_ID }),
            expect.objectContaining({ songId: NEON_SONG_ID }),
          ]),
        }),
      );
    });
  });

  it('oferece o descarte padrão após adicionar uma coleção ao rascunho', async () => {
    const view = await render(
      <TestProviders>
        <ShowSetlistEditorScreen bandId={BAND_ID} showId={CLUB_SHOW_ID} />
      </TestProviders>,
    );

    await view.findByTestId('show-block-editor-dialog');
    await openCollectionPreview(view);
    await fireEvent.press(view.getByTestId('show-confirm-add-collection'));
    await waitFor(() => {
      expect(view.getAllByTestId(/^setlist-item-row-/)).toHaveLength(4);
    });
    await fireEvent.press(view.getByText('Cancelar', { exact: true }));
    expect(view.getByTestId('show-block-editor-discard-sheet')).toBeTruthy();

    const dismiss = getNativeDismiss(view, 'show-block-editor-discard-sheet');
    await fireEvent.press(view.getByLabelText('Descartar alterações'));
    if (Platform.OS === 'ios') {
      await act(async () => dismiss());
    }
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
    expect(view.queryByTestId('show-block-editor-discard-sheet')).toBeNull();
  });

  it('desabilita a confirmação quando a coleção está vazia', async () => {
    const repositories = createInMemoryRepositories({
      ...DEFAULT_REPOSITORY_DATA,
      repertoireCollections: [
        DEFAULT_REPOSITORY_DATA.repertoireCollections.find(
          ({ id }) => id === COLLECTION_ID,
        )!,
      ],
      repertoireCollectionSongs: [],
    });
    const view = await render(
      <TestProviders repositories={repositories}>
        <ShowSetlistEditorScreen bandId={BAND_ID} showId={CLUB_SHOW_ID} />
      </TestProviders>,
    );

    await view.findByTestId('show-block-editor-dialog');
    await fireEvent.press(view.getByLabelText('Adicionar à setlist'));
    await fireEvent.press(view.getByTestId('show-add-collection-action'));
    await fireEvent.press(
      view.getByTestId(`show-preview-collection-${COLLECTION_ID}`),
    );

    const preview = view.getByTestId('show-collection-preview-sheet');
    expect(
      within(preview).getByText(
        'Esta coleção ainda não tem músicas para incluir.',
      ),
    ).toBeTruthy();
    expect(
      view.getByTestId('show-confirm-add-collection').props.accessibilityState
        ?.disabled,
    ).toBe(true);
  });

  it('informa quando todas as músicas elegíveis estão arquivadas', async () => {
    const collectionSongIds = new Set<string>(
      COLLECTION_SONGS.filter(
        ({ collectionId }) => collectionId === COLLECTION_ID,
      ).map(({ songId }) => songId),
    );
    const repositories = createInMemoryRepositories({
      ...DEFAULT_REPOSITORY_DATA,
      repertoireCollections: [
        DEFAULT_REPOSITORY_DATA.repertoireCollections.find(
          ({ id }) => id === COLLECTION_ID,
        )!,
      ],
      repertoireCollectionSongs: COLLECTION_SONGS.filter(
        ({ collectionId }) => collectionId === COLLECTION_ID,
      ),
      songs: SONGS.map((song) =>
        collectionSongIds.has(song.id)
          ? { ...song, archivedAt: '2026-09-09T12:00:00.000Z' }
          : song,
      ),
    });
    const view = await render(
      <TestProviders repositories={repositories}>
        <ShowSetlistEditorScreen bandId={BAND_ID} showId={CLUB_SHOW_ID} />
      </TestProviders>,
    );

    await view.findByTestId('show-block-editor-dialog');
    await fireEvent.press(view.getByLabelText('Adicionar à setlist'));
    await fireEvent.press(view.getByTestId('show-add-collection-action'));
    await fireEvent.press(
      view.getByTestId(`show-preview-collection-${COLLECTION_ID}`),
    );

    const preview = view.getByTestId('show-collection-preview-sheet');
    expect(
      within(preview).getByText('2 músicas arquivadas ficarão de fora.'),
    ).toBeTruthy();
    expect(
      within(preview).getByText(
        'Esta coleção não tem músicas ativas para incluir.',
      ),
    ).toBeTruthy();
    expect(
      view.getByTestId('show-confirm-add-collection').props.accessibilityState
        ?.disabled,
    ).toBe(true);
  });

  it('não revela músicas não consultáveis na prévia da coleção', async () => {
    const hiddenSongId = NEON_SONG_ID;
    const repositories = createInMemoryRepositories({
      ...DEFAULT_REPOSITORY_DATA,
      repertoireCollections: [
        DEFAULT_REPOSITORY_DATA.repertoireCollections.find(
          ({ id }) => id === COLLECTION_ID,
        )!,
      ],
      repertoireCollectionSongs: COLLECTION_SONGS.filter(
        ({ collectionId }) => collectionId === COLLECTION_ID,
      ),
      songs: SONGS.filter(({ id }) => id !== hiddenSongId),
    });
    const view = await render(
      <TestProviders repositories={repositories}>
        <ShowSetlistEditorScreen bandId={BAND_ID} showId={CLUB_SHOW_ID} />
      </TestProviders>,
    );

    await view.findByTestId('show-block-editor-dialog');
    await fireEvent.press(view.getByLabelText('Adicionar à setlist'));
    await fireEvent.press(view.getByTestId('show-add-collection-action'));
    await fireEvent.press(
      view.getByTestId(`show-preview-collection-${COLLECTION_ID}`),
    );

    const preview = view.getByTestId('show-collection-preview-sheet');
    expect(within(preview).getByText('1 música elegível')).toBeTruthy();
    expect(within(preview).queryByText('Maré de Neon')).toBeNull();
  });

  it('atualiza a prévia e não inclui parcialmente se a coleção mudou', async () => {
    const repositories = createRepositories();
    const view = await render(
      <TestProviders repositories={repositories}>
        <ShowSetlistEditorScreen bandId={BAND_ID} showId={CLUB_SHOW_ID} />
      </TestProviders>,
    );

    await view.findByTestId('show-block-editor-dialog');
    await openCollectionPreview(view);
    await repositories.repertoireCollections.appendSongs({
      bandId: BAND_ID,
      collectionId: COLLECTION_ID,
      songIds: [RAIN_SONG_ID],
    });

    await fireEvent.press(view.getByTestId('show-confirm-add-collection'));

    await waitFor(() => {
      expect(
        view.getByTestId('show-collection-validation-message'),
      ).toBeTruthy();
      expect(view.getByText('3 músicas elegíveis')).toBeTruthy();
    });
    expect(view.getAllByTestId(/^setlist-item-row-/)).toHaveLength(2);
    expect(
      within(view.getByTestId('show-collection-preview-songs')).getAllByTestId(
        /^show-collection-preview-song-/,
      ),
    ).toHaveLength(3);
  });

  it('exige conexão para confirmar a inclusão', async () => {
    const networkFetch = jest.mocked(NetInfo.fetch);
    networkFetch.mockResolvedValueOnce({
      isConnected: false,
      isInternetReachable: false,
    } as Awaited<ReturnType<typeof NetInfo.fetch>>);
    const view = await render(
      <TestProviders>
        <ShowSetlistEditorScreen bandId={BAND_ID} showId={CLUB_SHOW_ID} />
      </TestProviders>,
    );

    await view.findByTestId('show-block-editor-dialog');
    await openCollectionPreview(view);
    await fireEvent.press(view.getByTestId('show-confirm-add-collection'));

    expect(
      await view.findByText(
        'É necessária uma conexão à internet para confirmar a inclusão da coleção.',
      ),
    ).toBeTruthy();
    expect(view.getAllByTestId(/^setlist-item-row-/)).toHaveLength(2);

    await fireEvent.press(view.getByTestId('show-confirm-add-collection'));
    await waitFor(() => {
      expect(view.getAllByTestId(/^setlist-item-row-/)).toHaveLength(4);
    });
    expect(view.queryByTestId('show-collection-validation-message')).toBeNull();
  });

  it('revalida o papel de edição antes de confirmar', async () => {
    const inMemoryRepositories = createRepositories();
    let accessRevoked = false;
    const repositories: AppRepositories = {
      ...inMemoryRepositories,
      bands: {
        getContext: async (userId, bandId) => {
          const userBands =
            await inMemoryRepositories.bands.listForUser(userId);
          const userBand = userBands.find(({ band }) => band.id === bandId);
          if (!userBand) return null;

          return {
            bandId: userBand.band.id,
            bandName: userBand.band.name,
            hasActiveSongs: true,
            role:
              accessRevoked && bandId === BAND_ID
                ? 'member'
                : userBand.membership.role,
          };
        },
        findById: (bandId) => inMemoryRepositories.bands.findById(bandId),
        listMembers: (bandId) => inMemoryRepositories.bands.listMembers(bandId),
        listForUser: async (userId: EntityId) => {
          const userBands =
            await inMemoryRepositories.bands.listForUser(userId);
          if (!accessRevoked) return userBands;
          return userBands.map((userBand) =>
            userBand.band.id === BAND_ID
              ? {
                  ...userBand,
                  membership: { ...userBand.membership, role: 'member' },
                }
              : userBand,
          );
        },
        listUserSummaries: (userId) =>
          inMemoryRepositories.bands.listUserSummaries(userId),
      },
    };
    const view = await render(
      <TestProviders repositories={repositories}>
        <ShowSetlistEditorScreen bandId={BAND_ID} showId={CLUB_SHOW_ID} />
      </TestProviders>,
    );

    await view.findByTestId('show-block-editor-dialog');
    await openCollectionPreview(view);
    accessRevoked = true;
    await fireEvent.press(view.getByTestId('show-confirm-add-collection'));

    expect(
      await view.findByText('Você não pode editar esta setlist'),
    ).toBeTruthy();
    expect(view.queryByTestId('show-block-editor-dialog')).toBeNull();
    expect(replaceShowBlockItems).not.toHaveBeenCalled();
  });

  it('inclui a coleção uma vez ao fim do bloco ativo e só grava ao salvar', async () => {
    const repositories = createInMemoryRepositories({
      ...DEFAULT_REPOSITORY_DATA,
      shows: DEFAULT_REPOSITORY_DATA.shows.map((show) =>
        show.id === CLUB_SHOW_ID
          ? {
              ...show,
              blocks: [
                {
                  id: 'show-block-collection-primary',
                  name: 'Principal',
                  items: [
                    {
                      id: 'show-item-preserved-song',
                      notes: null,
                      songId: BRIDGES_SONG_ID,
                      type: 'song' as const,
                    },
                    {
                      description: 'Troca de instrumento',
                      estimatedDurationMs: 60_000,
                      id: 'show-item-preserved-planning',
                      type: 'planning' as const,
                    },
                    {
                      id: 'show-item-preserved-separator',
                      type: 'separator' as const,
                    },
                  ],
                },
                {
                  id: 'show-block-collection-bis',
                  name: 'Bis',
                  items: [
                    {
                      id: 'show-item-bis-luzes',
                      notes: null,
                      songId: LIGHTS_SONG_ID,
                      type: 'song' as const,
                    },
                  ],
                },
              ],
            }
          : show,
      ),
    });
    const view = await render(
      <TestProviders repositories={repositories}>
        <ShowSetlistEditorScreen bandId={BAND_ID} showId={CLUB_SHOW_ID} />
      </TestProviders>,
    );

    await view.findByTestId('show-block-editor-dialog');
    await openCollectionPreview(view);
    let resolveNetwork!: (
      state: Awaited<ReturnType<typeof NetInfo.fetch>>,
    ) => void;
    const networkPromise = new Promise<
      Awaited<ReturnType<typeof NetInfo.fetch>>
    >((resolve) => {
      resolveNetwork = resolve;
    });
    const networkFetch = jest.mocked(NetInfo.fetch);
    networkFetch.mockReturnValueOnce(networkPromise);
    const confirmButton = view.getByTestId('show-confirm-add-collection');

    await fireEvent.press(confirmButton);
    expect(confirmButton.props.accessibilityState?.disabled).toBe(true);
    await fireEvent.press(confirmButton);
    expect(networkFetch).toHaveBeenCalledTimes(1);
    await act(async () => {
      resolveNetwork({
        isConnected: true,
        isInternetReachable: true,
      } as Awaited<ReturnType<typeof NetInfo.fetch>>);
    });

    const primaryBlock = within(
      view.getByTestId('setlist-block-show-block-collection-primary'),
    );
    const primaryRows = primaryBlock.getAllByTestId(/^setlist-item-row-/);
    expect(primaryRows.map(({ props }) => props.testID)).toEqual([
      'setlist-item-row-show-item-preserved-song',
      'setlist-item-row-show-item-preserved-planning',
      'setlist-item-row-show-item-preserved-separator',
      expect.stringMatching(/^setlist-item-row-draft-collection-/),
      expect.stringMatching(/^setlist-item-row-draft-collection-/),
    ]);
    expect(within(primaryRows[3]!).getByText('Luzes da Cidade')).toBeTruthy();
    expect(within(primaryRows[4]!).getByText('Maré de Neon')).toBeTruthy();
    expect(
      within(
        view.getByTestId('setlist-block-show-block-collection-bis'),
      ).getByTestId('setlist-item-row-show-item-bis-luzes'),
    ).toBeTruthy();
    expect(replaceShowBlockItems).not.toHaveBeenCalled();
    await view.unmount();
  });

  it('não permite editar setlist de show que já saiu de rascunho', async () => {
    const view = await render(
      <TestProviders>
        <ShowSetlistEditorScreen bandId={BAND_ID} showId={READY_SHOW_ID} />
      </TestProviders>,
    );
    expect(
      await view.findByText(
        'Este show só pode ser editado enquanto estiver em Rascunho',
      ),
    ).toBeTruthy();
    expect(view.queryByTestId('show-block-editor-dialog')).toBeNull();
  });

  it('mostra indisponibilidade quando o usuário não tem permissão de edição', async () => {
    const repositories = createRepositories({ role: 'member' });
    const view = await render(
      <TestProviders currentUserId={MEMBER_USER_ID} repositories={repositories}>
        <ShowSetlistEditorScreen bandId={BAND_ID} showId={CLUB_SHOW_ID} />
      </TestProviders>,
    );

    expect(
      await view.findByText('Você não pode editar esta setlist'),
    ).toBeTruthy();
    expect(view.queryByTestId('show-block-editor-dialog')).toBeNull();
  });

  it('não oferece inclusão de coleção para integrante sem papel de edição', async () => {
    const repositories = createRepositories({ role: 'member' });
    const view = await render(
      <TestProviders currentUserId={MEMBER_USER_ID} repositories={repositories}>
        <ShowSetlistEditorScreen bandId={BAND_ID} showId={CLUB_SHOW_ID} />
      </TestProviders>,
    );

    expect(
      await view.findByText('Você não pode editar esta setlist'),
    ).toBeTruthy();
    expect(view.queryByTestId('show-block-editor-dialog')).toBeNull();
    expect(view.queryByTestId('show-add-collection-action')).toBeNull();
  });
  it('salva setlist sem mudanças de bloco e sincroniza seus itens', async () => {
    const view = await render(
      <TestProviders>
        <ShowSetlistEditorScreen bandId={BAND_ID} showId={CLUB_SHOW_ID} />
      </TestProviders>,
    );

    await view.findByTestId('show-block-editor-dialog');
    await fireEvent.press(view.getByLabelText('Salvar setlist'));

    await waitFor(() => {
      expect(reorderShowBlocks).toHaveBeenCalledWith(
        expect.objectContaining({ showId: CLUB_SHOW_ID }),
      );
      expect(replaceShowBlockItems).toHaveBeenCalled();
    });
  });

  it('persiste renomeação de bloco durante o salvamento da setlist', async () => {
    const view = await render(
      <TestProviders>
        <ShowSetlistEditorScreen bandId={BAND_ID} showId={CLUB_SHOW_ID} />
      </TestProviders>,
    );

    await view.findByTestId('show-block-editor-dialog');
    await fireEvent.changeText(
      view.getByLabelText('Nome do bloco 1'),
      'Abertura atualizada',
    );
    await fireEvent.press(view.getByLabelText('Salvar setlist'));

    await waitFor(() => {
      expect(renameShowBlock).toHaveBeenCalledWith(
        expect.objectContaining({
          blockId: expect.any(String),
          name: 'Abertura atualizada',
        }),
      );
    });
  });

  it('apresenta mensagem de falha inesperada ao salvar', async () => {
    jest.mocked(reorderShowBlocks).mockRejectedValueOnce(new Error('falha'));

    const view = await render(
      <TestProviders>
        <ShowSetlistEditorScreen bandId={BAND_ID} showId={CLUB_SHOW_ID} />
      </TestProviders>,
    );

    await view.findByTestId('show-block-editor-dialog');
    await fireEvent.press(view.getByLabelText('Salvar setlist'));

    await waitFor(() => {
      expect(
        view.getByText(
          'Não foi possível salvar a setlist agora. Tente novamente.',
        ),
      ).toBeTruthy();
    });
  });

  it('preserva a mensagem da mutation ao falhar o salvamento', async () => {
    jest
      .mocked(reorderShowBlocks)
      .mockRejectedValueOnce(
        new ShowMutationError('permission_denied', 'Acesso negado.'),
      );

    const view = await render(
      <TestProviders>
        <ShowSetlistEditorScreen bandId={BAND_ID} showId={CLUB_SHOW_ID} />
      </TestProviders>,
    );

    await view.findByTestId('show-block-editor-dialog');
    await fireEvent.press(view.getByLabelText('Salvar setlist'));

    await waitFor(() => {
      expect(view.getByText('Acesso negado.')).toBeTruthy();
    });
  });
});
