import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';
import { Platform } from 'react-native';

import { sendContentReport } from '@/data/supabase/contentReports';
import type {
  AppRepositories,
  BandRole,
  RepertoireCollection,
  RepertoireCollectionSong,
  Song,
} from '@/domain';
import { RepertoireCollectionError } from '@/domain';
import { SongDetailScreen } from '@/features/repertoire/SongDetailScreen';
import { SongLyricsScreen } from '@/features/repertoire/SongLyricsScreen';
import {
  createLyricBlock,
  createLyricDocument,
  createLyricLine,
  createRepertoireCollection,
  createRepertoireCollectionSong,
  createSong,
} from '@/testing/factories';
import { createBandScenario } from '@/testing/scenarios';
import { TestAppProviders } from '@/testing/TestAppProviders';

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: object }) => children,
  useFocusEffect: jest.fn(),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useNavigation: () => mockNavigation,
}));

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
}));

const mockSetUnsavedPromptVisible = jest.fn();

jest.mock('@/components/feedback/UnsavedChangesPrompt', () => ({
  UnsavedChangesPrompt: ({ visible }: { readonly visible: boolean }) => {
    mockSetUnsavedPromptVisible(visible);
    return null;
  },
}));

jest.mock('@/data/supabase/contentReports', () => ({
  sendContentReport: jest.fn(),
}));

const mockSendContentReport = jest.mocked(sendContentReport);
let mockBeforeRemove:
  | ((event: {
      preventDefault: () => void;
      data: { action: { type: string } };
    }) => void)
  | undefined;
const mockDispatch = jest.fn();
const mockNavigation = {
  addListener: (_type: string, callback: typeof mockBeforeRemove) => {
    mockBeforeRemove = callback;
    return jest.fn();
  },
  dispatch: mockDispatch,
};

const BAND_ID = 'band-song-detail';
const OWNER_USER_ID = 'user-song-detail-owner';
const MEMBER_USER_ID = 'user-song-detail-member';
const LIGHTS_SONG = createSong({
  bandId: BAND_ID,
  bpm: 118,
  estimatedDurationMs: 218_000,
  id: 'song-luzes-detail',
  lyrics: createLyricDocument({
    blocks: [
      createLyricBlock({
        id: 'block-luzes-verse',
        name: 'Verso',
        lines: [
          createLyricLine({
            id: 'line-luzes-first',
            text: 'A rua acende devagar',
          }),
          createLyricLine({
            id: 'line-luzes-second',
            text: 'Nosso caminho ganha cor',
          }),
        ],
      }),
    ],
  }),
  lyricStatus: 'static',
  musicalKey: 'G',
  notes: 'Abrir com guitarra limpa.',
  originalArtist: 'Banda Horizonte',
  title: 'Luzes da Cidade',
  updatedAt: '2026-09-06T12:00:00.000Z',
  youtubeReference: 'https://www.youtube.com/watch?v=M7lc1UVf-VE',
});
const INSTRUMENTAL_SONG = createSong({
  bandId: BAND_ID,
  id: 'song-instrumental-detail',
  originalArtist: 'Banda Horizonte',
  title: 'Instrumental de Abertura',
});
const OTHER_SONGS = [
  createSong({
    bandId: BAND_ID,
    id: 'song-ceu-outubro',
    title: 'Céu de Outubro',
  }),
  createSong({
    bandId: BAND_ID,
    id: 'song-depois-chuva',
    title: 'Depois da Chuva',
  }),
  createSong({ bandId: BAND_ID, id: 'song-mare-neon', title: 'Maré de Neon' }),
] satisfies readonly Song[];
const REPERTOIRE_SONGS = [LIGHTS_SONG, INSTRUMENTAL_SONG, ...OTHER_SONGS];
const ACUSTICO_COLLECTION = createRepertoireCollection({
  bandId: BAND_ID,
  id: 'collection-demo-acustico',
  name: 'Acústico',
});
const FESTA_COLLECTION = createRepertoireCollection({
  bandId: BAND_ID,
  id: 'collection-demo-festa',
  name: 'Festa',
});
const REPERTOIRE_COLLECTIONS = [ACUSTICO_COLLECTION, FESTA_COLLECTION];
const REPERTOIRE_COLLECTION_SONGS = [
  createRepertoireCollectionSong({
    bandId: BAND_ID,
    collectionId: ACUSTICO_COLLECTION.id,
    position: 0,
    songId: OTHER_SONGS[0].id,
  }),
  createRepertoireCollectionSong({
    bandId: BAND_ID,
    collectionId: ACUSTICO_COLLECTION.id,
    position: 1,
    songId: OTHER_SONGS[1].id,
  }),
  createRepertoireCollectionSong({
    bandId: BAND_ID,
    collectionId: FESTA_COLLECTION.id,
    position: 0,
    songId: LIGHTS_SONG.id,
  }),
  createRepertoireCollectionSong({
    bandId: BAND_ID,
    collectionId: FESTA_COLLECTION.id,
    position: 1,
    songId: OTHER_SONGS[2].id,
  }),
] satisfies readonly RepertoireCollectionSong[];

interface SongDetailScenarioOptions {
  readonly userId?: string;
  readonly role?: BandRole;
  readonly songs?: readonly Song[];
  readonly collections?: readonly RepertoireCollection[];
  readonly collectionSongs?: readonly RepertoireCollectionSong[];
}

function createRepositories({
  userId = OWNER_USER_ID,
  role = 'owner',
  songs = REPERTOIRE_SONGS,
  collections = REPERTOIRE_COLLECTIONS,
  collectionSongs = REPERTOIRE_COLLECTION_SONGS,
}: SongDetailScenarioOptions = {}): AppRepositories {
  return createBandScenario({
    bandId: BAND_ID,
    collections,
    collectionSongs,
    role,
    songs,
    userId,
  }).repositories;
}

interface SongDetailTestProvidersProps extends PropsWithChildren {
  readonly currentUserId: string;
  readonly repositories: AppRepositories;
}

function AppProviders({
  children,
  currentUserId,
  repositories,
}: SongDetailTestProvidersProps) {
  return (
    <TestAppProviders currentUserId={currentUserId} repositories={repositories}>
      {children}
    </TestAppProviders>
  );
}

describe('<SongDetailScreen />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSendContentReport.mockResolvedValue();
    mockBeforeRemove = undefined;
  });

  it.each([
    {
      height: 844,
      mode: 'phone',
      width: 390,
    },
    {
      height: 1180,
      mode: 'tablet',
      width: 820,
    },
    {
      height: 900,
      mode: 'desktop',
      width: 1440,
    },
  ])('adapta os detalhes ao modo $mode', async ({ height, mode, width }) => {
    const repositories = createRepositories();
    const view = await render(
      <AppProviders currentUserId={OWNER_USER_ID} repositories={repositories}>
        <SongDetailScreen
          bandId={BAND_ID}
          now={new Date('2026-09-09T12:00:00-03:00')}
          songId={LIGHTS_SONG.id}
          viewportHeight={height}
          viewportWidth={width}
        />
      </AppProviders>,
    );

    expect(await view.findByText('A rua acende devagar')).toBeTruthy();
    expect(view.getByTestId(`song-detail-${mode}`)).toBeTruthy();
    expect(view.getByText('Duração · 3min38s')).toBeTruthy();
    expect(view.getByLabelText('Duração 3min38s')).toBeTruthy();
    expect(view.getByText('Atualizada há 3 dias')).toBeTruthy();
    expect(view.getByText('Tom · G')).toBeTruthy();
    expect(view.getByLabelText('Abrir letra em tela cheia')).toBeTruthy();
    expect(view.getByText('BPM · 118')).toBeTruthy();
    expect(view.getByTestId('song-detail-context')).toBeTruthy();
    expect(view.getByLabelText('Editar música')).toBeTruthy();
    expect(view.getByLabelText('Abrir referência no YouTube')).toBeTruthy();
    expect(
      view.getByRole('button', {
        name: 'Abrir referência no YouTube',
      }),
    ).toBeTruthy();
  });

  it('não renderiza o cartão contextual quando não há notas nem referência', async () => {
    const repositories = createRepositories({
      songs: REPERTOIRE_SONGS.map((song) =>
        song.id === LIGHTS_SONG.id
          ? { ...song, notes: null, youtubeReference: null }
          : song,
      ),
    });
    const view = await render(
      <AppProviders currentUserId={OWNER_USER_ID} repositories={repositories}>
        <SongDetailScreen bandId={BAND_ID} songId={LIGHTS_SONG.id} />
      </AppProviders>,
    );

    expect(await view.findByText('A rua acende devagar')).toBeTruthy();
    expect(view.queryByTestId('song-detail-context')).toBeNull();
  });

  it('mostra as coleções vinculadas, incluindo nomes longos', async () => {
    const longCollectionName =
      'Festival independente ao ar livre com repertório acústico';
    const repertoireCollections = REPERTOIRE_COLLECTIONS.map((collection) =>
      collection.id === FESTA_COLLECTION.id
        ? { ...collection, name: longCollectionName }
        : collection,
    );
    const repertoireCollectionSongs = [
      ...REPERTOIRE_COLLECTION_SONGS,
      createRepertoireCollectionSong({
        bandId: BAND_ID,
        collectionId: ACUSTICO_COLLECTION.id,
        songId: LIGHTS_SONG.id,
        position: 2,
      }),
    ];
    const repositories = createRepositories({
      collections: repertoireCollections,
      collectionSongs: repertoireCollectionSongs,
    });
    const view = await render(
      <AppProviders currentUserId={OWNER_USER_ID} repositories={repositories}>
        <SongDetailScreen bandId={BAND_ID} songId={LIGHTS_SONG.id} />
      </AppProviders>,
    );

    expect(await view.findByTestId('song-detail-collections')).toBeTruthy();
    expect(view.getByText('Acústico')).toBeTruthy();
    expect(view.getByText(longCollectionName)).toBeTruthy();
    expect(
      view.getByTestId('song-collection-collection-demo-acustico'),
    ).toBeTruthy();
    expect(
      view.getByTestId('song-collection-collection-demo-festa'),
    ).toBeTruthy();
    expect(
      view.getByRole('link', {
        name: `Ver músicas da coleção ${longCollectionName}`,
      }).props.accessibilityHint,
    ).toBe('Abre o repertório filtrado por esta coleção.');
  });

  it('não mostra seção vazia nem convite quando a música não tem coleção', async () => {
    const repositories = createRepositories({
      collectionSongs: REPERTOIRE_COLLECTION_SONGS.filter(
        ({ songId }) => songId !== LIGHTS_SONG.id,
      ),
    });
    const view = await render(
      <AppProviders currentUserId={OWNER_USER_ID} repositories={repositories}>
        <SongDetailScreen bandId={BAND_ID} songId={LIGHTS_SONG.id} />
      </AppProviders>,
    );

    expect(await view.findByText('A rua acende devagar')).toBeTruthy();
    expect(view.queryByTestId('song-detail-collections')).toBeNull();
    expect(view.queryByText('Coleções')).toBeNull();
    expect(view.queryByText(/adicionar.*coleção/i)).toBeNull();
    expect(view.getByLabelText('Organizar coleções da música')).toBeTruthy();

    await fireEvent.press(view.getByLabelText('Organizar coleções da música'));
    expect(view.getByTestId('song-collection-membership-dialog')).toBeTruthy();
    expect(
      view.getByTestId('song-collection-option-collection-demo-festa').props
        .accessibilityState,
    ).toEqual({ checked: false });
  });

  it('salva as participações em conjunto e preserva a ordem das outras músicas', async () => {
    const repositories = createRepositories();
    const view = await render(
      <AppProviders currentUserId={OWNER_USER_ID} repositories={repositories}>
        <SongDetailScreen bandId={BAND_ID} songId={LIGHTS_SONG.id} />
      </AppProviders>,
    );

    await view.findByText('Luzes da Cidade');
    await fireEvent.press(view.getByLabelText('Organizar coleções da música'));
    expect(
      view.getByTestId('song-collection-option-collection-demo-festa').props
        .accessibilityState,
    ).toEqual({ checked: true });
    await fireEvent.press(
      view.getByTestId('song-collection-option-collection-demo-festa'),
    );
    await fireEvent.press(
      view.getByTestId('song-collection-option-collection-demo-acustico'),
    );
    await fireEvent.press(view.getByLabelText('Salvar coleções da música'));

    await waitFor(() =>
      expect(
        view.queryByTestId('song-collection-membership-dialog'),
      ).toBeNull(),
    );
    const routeEvent = {
      preventDefault: jest.fn(),
      data: { action: { type: 'GO_BACK' } },
    };
    await act(async () => mockBeforeRemove?.(routeEvent));
    expect(routeEvent.preventDefault).not.toHaveBeenCalled();
    const memberships =
      await repositories.repertoireCollections.listSongsByBandId(BAND_ID);
    expect(
      memberships
        .filter(({ songId }) => songId === LIGHTS_SONG.id)
        .map(({ collectionId }) => collectionId),
    ).toEqual(['collection-demo-acustico']);
    expect(
      memberships
        .filter(
          ({ collectionId }) => collectionId === 'collection-demo-acustico',
        )
        .sort((left, right) => left.position - right.position)
        .map(({ songId, position }) => ({ songId, position })),
    ).toEqual([
      { position: 0, songId: OTHER_SONGS[0].id },
      { position: 1, songId: OTHER_SONGS[1].id },
      { position: 2, songId: LIGHTS_SONG.id },
    ]);
    expect(
      memberships.find(
        ({ collectionId, songId }) =>
          collectionId === FESTA_COLLECTION.id && songId === OTHER_SONGS[2].id,
      )?.position,
    ).toBe(1);
  });

  it('preserva as alterações ao pedir confirmação para cancelar o gerenciador', async () => {
    const originalPlatform = Platform.OS;
    const repositories = createRepositories();
    const setSongCollections = jest.spyOn(
      repositories.repertoireCollections,
      'setSongCollections',
    );
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });

    try {
      const view = await render(
        <AppProviders currentUserId={OWNER_USER_ID} repositories={repositories}>
          <SongDetailScreen bandId={BAND_ID} songId={LIGHTS_SONG.id} />
        </AppProviders>,
      );

      await view.findByText('Luzes da Cidade');
      await fireEvent.press(
        view.getByLabelText('Organizar coleções da música'),
      );
      await fireEvent.press(
        view.getByTestId('song-collection-option-collection-demo-acustico'),
      );
      await fireEvent.press(view.getByText('Cancelar'));
      expect(mockSetUnsavedPromptVisible).toHaveBeenLastCalledWith(true);
      expect(
        view.getByTestId('song-collection-membership-dialog'),
      ).toBeTruthy();
      expect(
        view.getByTestId('song-collection-option-collection-demo-acustico')
          .props.accessibilityState,
      ).toEqual({ checked: true });
      expect(setSongCollections).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(Platform, 'OS', {
        configurable: true,
        value: originalPlatform,
      });
    }
  });

  it('mantém as escolhas após falha e permite tentar salvar novamente', async () => {
    const repositories = createRepositories();
    const originalSetSongCollections =
      repositories.repertoireCollections.setSongCollections.bind(
        repositories.repertoireCollections,
      );
    const setSongCollections = jest
      .spyOn(repositories.repertoireCollections, 'setSongCollections')
      .mockRejectedValueOnce(
        new RepertoireCollectionError(
          'stale_revision',
          'As coleções mudaram. Atualize e tente novamente.',
        ),
      )
      .mockImplementation(originalSetSongCollections);
    const view = await render(
      <AppProviders currentUserId={OWNER_USER_ID} repositories={repositories}>
        <SongDetailScreen bandId={BAND_ID} songId={LIGHTS_SONG.id} />
      </AppProviders>,
    );

    await view.findByText('Luzes da Cidade');
    await fireEvent.press(view.getByLabelText('Organizar coleções da música'));
    await fireEvent.press(
      view.getByTestId('song-collection-option-collection-demo-acustico'),
    );
    await fireEvent.press(view.getByLabelText('Salvar coleções da música'));

    expect(
      await view.findByText('As coleções mudaram. Atualize e tente novamente.'),
    ).toBeTruthy();
    expect(view.getByTestId('song-collection-membership-dialog')).toBeTruthy();
    expect(
      view.getByTestId('song-collection-option-collection-demo-acustico').props
        .accessibilityState,
    ).toEqual({ checked: true });

    await fireEvent.press(view.getByLabelText('Salvar coleções da música'));

    await waitFor(() =>
      expect(
        view.queryByTestId('song-collection-membership-dialog'),
      ).toBeNull(),
    );
    expect(setSongCollections).toHaveBeenCalledTimes(2);
    expect(view.getByTestId('temporary-feedback')).toBeTruthy();
  });

  it('apresenta a edição da música como ação contextual acessível', async () => {
    const repositories = createRepositories();
    const view = await render(
      <AppProviders currentUserId={OWNER_USER_ID} repositories={repositories}>
        <SongDetailScreen bandId={BAND_ID} songId={LIGHTS_SONG.id} />
      </AppProviders>,
    );

    expect(await view.findByText('A rua acende devagar')).toBeTruthy();

    await fireEvent.press(view.getByLabelText('Editar música'));

    expect(view.queryByTestId('demo-action-notice')).toBeNull();
  });

  it('permite denunciar a música exibida e envia o identificador correto', async () => {
    const repositories = createRepositories();
    const view = await render(
      <AppProviders currentUserId={OWNER_USER_ID} repositories={repositories}>
        <SongDetailScreen bandId={BAND_ID} songId={LIGHTS_SONG.id} />
      </AppProviders>,
    );

    await view.findByText('A rua acende devagar');
    await fireEvent.press(view.getByLabelText('Denunciar música'));
    await fireEvent.changeText(
      await view.findByLabelText('Motivo da denúncia'),
      'Conteúdo indevido nesta música',
    );
    await fireEvent.press(
      view.getByRole('button', { name: 'Enviar denúncia' }),
    );

    await waitFor(() =>
      expect(mockSendContentReport).toHaveBeenCalledWith({
        bandId: BAND_ID,
        description: 'Conteúdo indevido nesta música',
        kind: 'song',
        targetId: LIGHTS_SONG.id,
      }),
    );
  });

  it('abre a referência do YouTube em uma nova janela no web', async () => {
    const originalPlatform = Platform.OS;
    const originalOpen = Object.getOwnPropertyDescriptor(window, 'open');
    const openWindow = jest.fn(() => null);

    Object.defineProperty(window, 'open', {
      configurable: true,
      value: openWindow,
      writable: true,
    });

    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: 'web',
    });

    try {
      const repositories = createRepositories();
      const view = await render(
        <AppProviders currentUserId={OWNER_USER_ID} repositories={repositories}>
          <SongDetailScreen bandId={BAND_ID} songId={LIGHTS_SONG.id} />
        </AppProviders>,
      );

      await view.findByText('A rua acende devagar');
      await fireEvent.press(view.getByLabelText('Abrir referência no YouTube'));

      expect(openWindow).toHaveBeenCalledWith(
        'https://www.youtube.com/watch?v=M7lc1UVf-VE',
        '_blank',
        'noopener,noreferrer',
      );
    } finally {
      if (originalOpen) {
        Object.defineProperty(window, 'open', originalOpen);
      } else {
        delete (window as { open?: unknown }).open;
      }
      Object.defineProperty(Platform, 'OS', {
        configurable: true,
        value: originalPlatform,
      });
    }
  });

  it('renderiza os blocos e os formatos cadastrados na letra', async () => {
    const formattedSong = createSong({
      bandId: BAND_ID,
      id: 'song-with-formatted-lyrics',
      lyrics: createLyricDocument({
        blocks: [
          createLyricBlock({
            id: 'formatted-verse',
            name: 'Verso',
            lines: [
              createLyricLine({
                bold: true,
                id: 'bold-line',
                text: 'Linha em destaque',
              }),
              createLyricLine({
                id: 'separator-line',
                kind: 'separator',
                text: '',
              }),
              createLyricLine({ id: 'blank-line', text: '' }),
            ],
          }),
        ],
      }),
      lyricStatus: 'static',
      title: 'Música com letra formatada',
    });
    const repositories = createRepositories({
      songs: [formattedSong],
      collections: [],
      collectionSongs: [],
    });
    const view = await render(
      <AppProviders currentUserId={OWNER_USER_ID} repositories={repositories}>
        <SongDetailScreen bandId={BAND_ID} songId={formattedSong.id} />
      </AppProviders>,
    );

    const boldLine = await view.findByText('Linha em destaque');

    const blockName = view.getByText('Verso');

    expect(blockName).toBeTruthy();
    expect(blockName.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ opacity: 0.55 })]),
    );
    expect(view.getByTestId('lyric-separator-separator-line')).toBeTruthy();
    expect(boldLine.props.style).toEqual(
      expect.arrayContaining([
        expect.arrayContaining([
          expect.objectContaining({ fontWeight: '800' }),
        ]),
      ]),
    );
  });

  it('oculta ações de edição dos detalhes para integrante', async () => {
    const repositories = createRepositories({
      role: 'member',
      userId: MEMBER_USER_ID,
    });
    const view = await render(
      <AppProviders currentUserId={MEMBER_USER_ID} repositories={repositories}>
        <SongDetailScreen bandId={BAND_ID} songId={LIGHTS_SONG.id} />
      </AppProviders>,
    );

    expect(await view.findByText('A rua acende devagar')).toBeTruthy();
    expect(view.queryByText('Editar')).toBeNull();
    expect(view.queryByLabelText('Editar música')).toBeNull();
    expect(view.queryByLabelText('Mais opções da música')).toBeNull();
    expect(view.queryByLabelText('Organizar coleções da música')).toBeNull();
  });

  it('trata música sem letra e conteúdo não encontrado', async () => {
    const repositories = createRepositories();
    const instrumentalView = await render(
      <AppProviders currentUserId={OWNER_USER_ID} repositories={repositories}>
        <SongDetailScreen bandId={BAND_ID} songId={INSTRUMENTAL_SONG.id} />
      </AppProviders>,
    );

    expect(
      await instrumentalView.findByText('Sem letra cadastrada'),
    ).toBeTruthy();
    await instrumentalView.unmount();
    expect(
      instrumentalView.queryByLabelText('Abrir letra em tela cheia'),
    ).toBeNull();

    const emptyRepositories = createRepositories({
      songs: [],
      collections: [],
      collectionSongs: [],
    });
    const missingSongView = await render(
      <AppProviders
        currentUserId={OWNER_USER_ID}
        repositories={emptyRepositories}
      >
        <SongDetailScreen bandId={BAND_ID} songId="unknown" />
      </AppProviders>,
    );

    expect(
      await missingSongView.findByText('Música indisponível'),
    ).toBeTruthy();
  });

  it('apresenta a letra em uma tela imersiva', async () => {
    const repositories = createRepositories();
    const view = await render(
      <AppProviders currentUserId={OWNER_USER_ID} repositories={repositories}>
        <SongLyricsScreen bandId={BAND_ID} songId={LIGHTS_SONG.id} />
      </AppProviders>,
    );

    expect(await view.findByTestId('song-lyrics-screen')).toBeTruthy();
    expect(view.getByText('Letra em tela cheia')).toBeTruthy();
    expect(await view.findByText('A rua acende devagar')).toBeTruthy();
    expect(view.getByLabelText('Voltar para detalhes da música')).toBeTruthy();
  });

  it('informa quando a música não possui letra em tela cheia', async () => {
    const repositories = createRepositories();
    const view = await render(
      <AppProviders currentUserId={OWNER_USER_ID} repositories={repositories}>
        <SongLyricsScreen bandId={BAND_ID} songId={INSTRUMENTAL_SONG.id} />
      </AppProviders>,
    );

    expect(await view.findByText('Sem letra cadastrada')).toBeTruthy();
  });

  it('informa quando a música não está disponível em tela cheia', async () => {
    const repositories = createRepositories({
      songs: [],
      collections: [],
      collectionSongs: [],
    });
    const view = await render(
      <AppProviders currentUserId={OWNER_USER_ID} repositories={repositories}>
        <SongLyricsScreen bandId={BAND_ID} songId="unknown" />
      </AppProviders>,
    );

    expect(await view.findByText('Música indisponível')).toBeTruthy();
  });
});
