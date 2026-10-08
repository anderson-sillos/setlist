import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';

import { demoIds, demoRepositoryData } from '@/data/demo';
import { createInMemoryRepositories } from '@/data/in-memory';
import { sendContentReport } from '@/data/supabase/contentReports';
import { RepertoireCollectionError } from '@/domain';
import { SongDetailScreen } from '@/features/repertoire/SongDetailScreen';
import { AppProviders } from '@/providers/AppProviders';
import { SongLyricsScreen } from '@/features/repertoire/SongLyricsScreen';

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: object }) => children,
  useFocusEffect: jest.fn(),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useNavigation: () => ({
    addListener: (_type: string, callback: typeof mockBeforeRemove) => {
      mockBeforeRemove = callback;
      return jest.fn();
    },
    dispatch: mockDispatch,
  }),
}));

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
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

function getPromptNativeDismiss(
  view: Awaited<ReturnType<typeof render>>,
): () => void {
  let parent = view.getByTestId('unsaved-changes-prompt').parent;
  while (parent && typeof parent.props.onDismiss !== 'function') {
    parent = parent.parent;
  }
  if (!parent) throw new Error('Modal de alterações não salvas não encontrado');
  return parent.props.onDismiss as () => void;
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
    const view = await render(
      <AppProviders>
        <SongDetailScreen
          bandId={demoIds.primaryBand}
          now={new Date('2026-09-09T12:00:00-03:00')}
          songId={demoIds.stageSong}
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
    const songs = demoRepositoryData.songs.map((song) =>
      song.id === demoIds.stageSong
        ? { ...song, notes: null, youtubeReference: null }
        : song,
    );
    const repositories = createInMemoryRepositories({
      ...demoRepositoryData,
      songs,
    });
    const view = await render(
      <AppProviders repositories={repositories}>
        <SongDetailScreen
          bandId={demoIds.primaryBand}
          songId={demoIds.stageSong}
        />
      </AppProviders>,
    );

    expect(await view.findByText('A rua acende devagar')).toBeTruthy();
    expect(view.queryByTestId('song-detail-context')).toBeNull();
  });

  it('mostra as coleções vinculadas, incluindo nomes longos', async () => {
    const longCollectionName =
      'Festival independente ao ar livre com repertório acústico';
    const repertoireCollections = demoRepositoryData.repertoireCollections.map(
      (collection) =>
        collection.id === 'collection-demo-festa'
          ? { ...collection, name: longCollectionName }
          : collection,
    );
    const repertoireCollectionSongs = [
      ...demoRepositoryData.repertoireCollectionSongs,
      {
        bandId: demoIds.primaryBand,
        collectionId: 'collection-demo-acustico',
        songId: demoIds.stageSong,
        position: 2,
      },
    ];
    const repositories = createInMemoryRepositories({
      ...demoRepositoryData,
      repertoireCollections,
      repertoireCollectionSongs,
    });
    const view = await render(
      <AppProviders repositories={repositories}>
        <SongDetailScreen
          bandId={demoIds.primaryBand}
          songId={demoIds.stageSong}
        />
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
    const repositories = createInMemoryRepositories({
      ...demoRepositoryData,
      repertoireCollectionSongs:
        demoRepositoryData.repertoireCollectionSongs.filter(
          ({ songId }) => songId !== demoIds.stageSong,
        ),
    });
    const view = await render(
      <AppProviders repositories={repositories}>
        <SongDetailScreen
          bandId={demoIds.primaryBand}
          songId={demoIds.stageSong}
        />
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
    const repositories = createInMemoryRepositories(demoRepositoryData);
    const view = await render(
      <AppProviders repositories={repositories}>
        <SongDetailScreen
          bandId={demoIds.primaryBand}
          songId={demoIds.stageSong}
        />
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
      await repositories.repertoireCollections.listSongsByBandId(
        demoIds.primaryBand,
      );
    expect(
      memberships
        .filter(({ songId }) => songId === demoIds.stageSong)
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
      { position: 0, songId: 'song-demo-ceu-outubro' },
      { position: 1, songId: 'song-demo-chuva' },
      { position: 2, songId: demoIds.stageSong },
    ]);
    expect(
      memberships.find(
        ({ collectionId, songId }) =>
          collectionId === 'collection-demo-festa' &&
          songId === 'song-demo-mare-neon',
      )?.position,
    ).toBe(1);
  });

  it('pede confirmação para continuar ou descartar mudanças no gerenciador', async () => {
    const originalPlatform = Platform.OS;
    const repositories = createInMemoryRepositories(demoRepositoryData);
    const setSongCollections = jest.spyOn(
      repositories.repertoireCollections,
      'setSongCollections',
    );
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });

    try {
      const view = await render(
        <AppProviders repositories={repositories}>
          <SongDetailScreen
            bandId={demoIds.primaryBand}
            songId={demoIds.stageSong}
          />
        </AppProviders>,
      );

      await view.findByText('Luzes da Cidade');
      await fireEvent.press(
        view.getByLabelText('Organizar coleções da música'),
      );
      await fireEvent.press(
        view.getByTestId('song-collection-option-collection-demo-acustico'),
      );
      const routeEvent = {
        preventDefault: jest.fn(),
        data: { action: { type: 'GO_BACK' } },
      };

      await act(async () => mockBeforeRemove?.(routeEvent));
      expect(routeEvent.preventDefault).toHaveBeenCalledTimes(1);
      expect(view.getByTestId('unsaved-changes-prompt')).toBeTruthy();
      const continueButtons = view.getAllByLabelText('Continuar editando');
      await fireEvent.press(continueButtons[continueButtons.length - 1]);
      expect(
        view.getByTestId('song-collection-membership-dialog'),
      ).toBeTruthy();
      expect(
        view.getByTestId('song-collection-option-collection-demo-acustico')
          .props.accessibilityState,
      ).toEqual({ checked: true });

      await fireEvent.press(view.getByText('Cancelar'));
      expect(view.getByTestId('unsaved-changes-prompt')).toBeTruthy();
      const dismissPrompt = getPromptNativeDismiss(view);
      await fireEvent.press(view.getByLabelText('Descartar alterações'));
      await act(async () => dismissPrompt());

      expect(
        view.queryByTestId('song-collection-membership-dialog'),
      ).toBeNull();
      expect(setSongCollections).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(Platform, 'OS', {
        configurable: true,
        value: originalPlatform,
      });
    }
  });

  it('mantém as escolhas após falha e permite tentar salvar novamente', async () => {
    const repositories = createInMemoryRepositories(demoRepositoryData);
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
      <AppProviders repositories={repositories}>
        <SongDetailScreen
          bandId={demoIds.primaryBand}
          songId={demoIds.stageSong}
        />
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
    const view = await render(
      <AppProviders>
        <SongDetailScreen
          bandId={demoIds.primaryBand}
          songId={demoIds.stageSong}
        />
      </AppProviders>,
    );

    expect(await view.findByText('A rua acende devagar')).toBeTruthy();

    await fireEvent.press(view.getByLabelText('Editar música'));

    expect(view.queryByTestId('demo-action-notice')).toBeNull();
  });

  it('permite denunciar a música exibida e envia o identificador correto', async () => {
    const view = await render(
      <AppProviders>
        <SongDetailScreen
          bandId={demoIds.primaryBand}
          songId={demoIds.stageSong}
        />
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
        bandId: demoIds.primaryBand,
        description: 'Conteúdo indevido nesta música',
        kind: 'song',
        targetId: demoIds.stageSong,
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
      const view = await render(
        <AppProviders>
          <SongDetailScreen
            bandId={demoIds.primaryBand}
            songId={demoIds.stageSong}
          />
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
    const formattedSong = {
      ...demoRepositoryData.songs[0],
      id: 'song-with-formatted-lyrics',
      lyrics: {
        blocks: [
          {
            id: 'formatted-verse',
            name: 'Verso',
            lines: [
              {
                bold: true,
                id: 'bold-line',
                startTimeMs: null,
                text: 'Linha em destaque',
              },
              {
                id: 'separator-line',
                kind: 'separator' as const,
                startTimeMs: null,
                text: '',
              },
              { id: 'blank-line', startTimeMs: null, text: '' },
            ],
          },
        ],
      },
    };
    const repositories = createInMemoryRepositories({
      ...demoRepositoryData,
      songs: [formattedSong],
    });
    const view = await render(
      <AppProviders repositories={repositories}>
        <SongDetailScreen
          bandId={demoIds.primaryBand}
          songId={formattedSong.id}
        />
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
    const view = await render(
      <AppProviders currentUserId="user-demo-carla">
        <SongDetailScreen
          bandId={demoIds.primaryBand}
          songId={demoIds.stageSong}
        />
      </AppProviders>,
    );

    expect(await view.findByText('A rua acende devagar')).toBeTruthy();
    expect(view.queryByText('Editar')).toBeNull();
    expect(view.queryByLabelText('Editar música')).toBeNull();
    expect(view.queryByLabelText('Mais opções da música')).toBeNull();
    expect(view.queryByLabelText('Organizar coleções da música')).toBeNull();
  });

  it('trata música sem letra e conteúdo não encontrado', async () => {
    const instrumentalView = await render(
      <AppProviders>
        <SongDetailScreen
          bandId={demoIds.primaryBand}
          songId="song-demo-instrumental"
        />
      </AppProviders>,
    );

    expect(
      await instrumentalView.findByText('Sem letra cadastrada'),
    ).toBeTruthy();
    await instrumentalView.unmount();
    expect(
      instrumentalView.queryByLabelText('Abrir letra em tela cheia'),
    ).toBeNull();

    const emptyRepositories = createInMemoryRepositories({
      ...demoRepositoryData,
      shows: [],
      songs: [],
    });
    const missingSongView = await render(
      <AppProviders repositories={emptyRepositories}>
        <SongDetailScreen bandId={demoIds.primaryBand} songId="unknown" />
      </AppProviders>,
    );

    expect(
      await missingSongView.findByText('Música indisponível'),
    ).toBeTruthy();
  });

  it('apresenta a letra em uma tela imersiva', async () => {
    const view = await render(
      <AppProviders>
        <SongLyricsScreen
          bandId={demoIds.primaryBand}
          songId={demoIds.stageSong}
        />
      </AppProviders>,
    );

    expect(await view.findByTestId('song-lyrics-screen')).toBeTruthy();
    expect(view.getByText('Letra em tela cheia')).toBeTruthy();
    expect(await view.findByText('A rua acende devagar')).toBeTruthy();
    expect(view.getByLabelText('Voltar para detalhes da música')).toBeTruthy();
  });

  it('informa quando a música não possui letra em tela cheia', async () => {
    const view = await render(
      <AppProviders>
        <SongLyricsScreen
          bandId={demoIds.primaryBand}
          songId="song-demo-instrumental"
        />
      </AppProviders>,
    );

    expect(await view.findByText('Sem letra cadastrada')).toBeTruthy();
  });

  it('informa quando a música não está disponível em tela cheia', async () => {
    const repositories = createInMemoryRepositories({
      ...demoRepositoryData,
      songs: [],
    });
    const view = await render(
      <AppProviders repositories={repositories}>
        <SongLyricsScreen bandId={demoIds.primaryBand} songId="unknown" />
      </AppProviders>,
    );

    expect(await view.findByText('Música indisponível')).toBeTruthy();
  });
});
