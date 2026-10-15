import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren, ReactElement } from 'react';
import { Platform } from 'react-native';

import { createInMemoryRepositories } from '@/testing/repositories';
import type {
  AppRepositories,
  BandRole,
  RepertoireCollection,
  RepertoireCollectionSong,
  Song,
} from '@/domain';
import { RepertoireCollectionError } from '@/domain';
import { RepertoireScreen } from '@/features/repertoire/RepertoireScreen';
import {
  createBand,
  createBandMember,
  createRepertoireCollection,
  createRepertoireCollectionSong,
  createSong,
  createLyricsForStatus,
} from '@/testing/factories';
import { createBandScenario } from '@/testing/scenarios';
import { TestAppProviders } from '@/testing/TestAppProviders';

const mockRouter = { push: jest.fn(), replace: jest.fn() };

jest.mock('expo-router', () => ({
  Link: ({
    children,
    href,
    onPress,
  }: {
    children: ReactElement<{
      onPress?: (event: MockLinkEvent) => void;
    }>;
    href?: string;
    onPress?: (event: MockLinkEvent) => void;
  }) => {
    const React = jest.requireActual<typeof import('react')>('react');
    return React.cloneElement(children, {
      onPress: (event: MockLinkEvent) => {
        const preventDefault = event.preventDefault.bind(event);
        event.preventDefault = () => {
          event.defaultPrevented = true;
          preventDefault();
        };
        children.props.onPress?.(event);
        onPress?.(event);
        if (!event.defaultPrevented && href) mockRouter.push(href);
      },
    });
  },
  useFocusEffect: jest.fn(),
  useNavigation: () => ({
    addListener: jest.fn(() => jest.fn()),
    dispatch: jest.fn(),
  }),
  useRouter: () => mockRouter,
}));

interface MockLinkEvent {
  readonly nativeEvent?: {
    readonly altKey?: boolean;
    readonly button?: number;
    readonly ctrlKey?: boolean;
    readonly detail?: number;
    readonly metaKey?: boolean;
    readonly shiftKey?: boolean;
  };
  defaultPrevented?: boolean;
  preventDefault: () => void;
}

const BAND_ID = 'band-repertoire-screen';
const SECOND_BAND_ID = 'band-repertoire-other';
const OWNER_USER_ID = 'user-repertoire-owner';
const MEMBER_USER_ID = 'user-repertoire-member';

const LIGHTS_SONG = createSong({
  bandId: BAND_ID,
  estimatedDurationMs: 218_000,
  id: 'song-luzes-da-cidade',
  lyrics: createLyricsForStatus('static'),
  lyricStatus: 'static',
  musicalKey: 'G',
  originalArtist: 'Banda Horizonte',
  title: 'Luzes da Cidade',
});
const BRIDGES_SONG = createSong({
  bandId: BAND_ID,
  estimatedDurationMs: 204_000,
  id: 'song-entre-pontes',
  lyrics: createLyricsForStatus('synchronized'),
  lyricStatus: 'synchronized',
  originalArtist: 'Banda Horizonte',
  title: 'Entre Pontes',
});
const NEON_SONG = createSong({
  bandId: BAND_ID,
  estimatedDurationMs: 252_000,
  id: 'song-mare-de-neon',
  lyrics: createLyricsForStatus('synchronized'),
  lyricStatus: 'synchronized',
  originalArtist: 'Coletivo Atlântico',
  title: 'Maré de Neon',
});
const INCOMPLETE_SONG = createSong({
  bandId: BAND_ID,
  estimatedDurationMs: 232_000,
  id: 'song-depois-da-chuva',
  lyrics: createLyricsForStatus('incomplete'),
  lyricStatus: 'incomplete',
  originalArtist: 'Banda Horizonte',
  title: 'Depois da Chuva',
});
const OPENING_SONG = createSong({
  bandId: BAND_ID,
  estimatedDurationMs: 95_000,
  id: 'song-instrumental-abertura',
  originalArtist: 'Banda Horizonte',
  title: 'Instrumental de Abertura',
});
const ARCHIVED_SONG = createSong({
  archivedAt: '2026-10-01T12:00:00.000Z',
  bandId: BAND_ID,
  estimatedDurationMs: 190_000,
  id: 'song-rota-antiga',
  originalArtist: 'Banda Horizonte',
  title: 'Rota Antiga',
});
const REPERTOIRE_SONGS = [
  LIGHTS_SONG,
  BRIDGES_SONG,
  NEON_SONG,
  INCOMPLETE_SONG,
  OPENING_SONG,
  ARCHIVED_SONG,
] satisfies readonly Song[];
const FESTA_COLLECTION = createRepertoireCollection({
  bandId: BAND_ID,
  createdAt: '2026-10-01T12:00:00.000Z',
  id: 'collection-repertoire-festa',
  name: 'Festa',
  updatedAt: '2026-10-01T12:00:00.000Z',
});
const ACUSTICO_COLLECTION = createRepertoireCollection({
  bandId: BAND_ID,
  createdAt: '2026-10-01T11:55:00.000Z',
  id: 'collection-repertoire-acustico',
  name: 'Acústico',
  updatedAt: '2026-10-01T11:55:00.000Z',
});
const FESTA_MEMBERSHIPS = [
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
    songId: NEON_SONG.id,
  }),
] satisfies readonly RepertoireCollectionSong[];

interface RepertoireScenarioOptions {
  readonly bandId?: string;
  readonly role?: BandRole;
  readonly userId?: string;
  readonly songs?: readonly Song[];
  readonly collections?: readonly RepertoireCollection[];
  readonly collectionSongs?: readonly RepertoireCollectionSong[];
}

function createRepositories({
  bandId = BAND_ID,
  role = 'owner',
  userId = OWNER_USER_ID,
  songs = REPERTOIRE_SONGS,
  collections = [ACUSTICO_COLLECTION, FESTA_COLLECTION],
  collectionSongs = FESTA_MEMBERSHIPS,
}: RepertoireScenarioOptions = {}): AppRepositories {
  return createBandScenario({
    bandId,
    collections,
    collectionSongs,
    role,
    songs,
    userId,
  }).repositories;
}

interface RepertoireTestProvidersProps extends PropsWithChildren {
  readonly currentUserId: string;
  readonly repositories: AppRepositories;
}

function AppProviders({
  children,
  currentUserId,
  repositories,
}: RepertoireTestProvidersProps) {
  return (
    <TestAppProviders currentUserId={currentUserId} repositories={repositories}>
      {children}
    </TestAppProviders>
  );
}

async function pressActionMenu(
  view: Awaited<ReturnType<typeof render>>,
  triggerLabel: string,
  label: string,
) {
  await fireEvent.press(view.getByLabelText(triggerLabel));
  let parent = view.getByTestId('repertoire-action-menu').parent;
  while (parent && typeof parent.props.onDismiss !== 'function')
    parent = parent.parent;
  if (!parent) throw new Error('Modal de ações do repertório não encontrado');
  const dismiss = parent.props.onDismiss as () => void;
  await fireEvent.press(view.getByLabelText(label));
  if (dismiss) await act(async () => dismiss());
}

async function pressCollectionAction(
  view: Awaited<ReturnType<typeof render>>,
  label: string,
) {
  if (label.startsWith('Adicionar ') && label.includes('selecionada')) {
    await fireEvent.press(view.getByLabelText(label));
    return;
  }

  const selectionMenu = view.queryByLabelText('Abrir opções da seleção');
  await pressActionMenu(
    view,
    selectionMenu ? 'Abrir opções da seleção' : 'Abrir coleções do repertório',
    label,
  );
}

describe('<RepertoireScreen />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('apresenta o repertório e os metadados em modo somente leitura', async () => {
    const repositories = createRepositories();
    const view = await render(
      <AppProviders currentUserId={OWNER_USER_ID} repositories={repositories}>
        <RepertoireScreen bandId={BAND_ID} viewportWidth={820} />
      </AppProviders>,
    );

    expect(await view.findByText('Luzes da Cidade')).toBeTruthy();
    expect(view.getByTestId('repertoire-list')).toBeTruthy();
    expect(
      view.getAllByRole('link', { name: /Status da letra: Letra estática$/ })
        .length,
    ).toBeGreaterThan(0);
    expect(
      view.getAllByRole('link', {
        name: /Status da letra: Sincronização incompleta$/,
      }).length,
    ).toBeGreaterThan(0);
    expect(view.getByText('3min38s')).toBeTruthy();
    expect(view.queryByText('Duração')).toBeNull();
    expect(view.queryByText(/Tom G · BPM/)).toBeNull();
  });

  it('busca, filtra e ordena o repertório sem tirar os controles da tela', async () => {
    const repositories = createRepositories();
    const view = await render(
      <AppProviders currentUserId={OWNER_USER_ID} repositories={repositories}>
        <RepertoireScreen bandId={BAND_ID} viewportWidth={390} />
      </AppProviders>,
    );

    await view.findByText('Luzes da Cidade');
    expect(
      view.getByLabelText('Alterar filtros do repertório').props
        .accessibilityState?.selected,
    ).toBeUndefined();
    expect(
      view.getByLabelText('Alterar ordenação do repertório').props
        .accessibilityState?.selected,
    ).toBeUndefined();
    await fireEvent.changeText(
      view.getByLabelText('Buscar música por título ou artista'),
      'pontes',
    );

    expect(view.getByText('Entre Pontes')).toBeTruthy();
    expect(view.queryByText('Luzes da Cidade')).toBeNull();

    await fireEvent.changeText(
      view.getByLabelText('Buscar música por título ou artista'),
      '',
    );
    await fireEvent.changeText(
      view.getByLabelText('Buscar música por título ou artista'),
      'coletivo atlantico',
    );

    expect(view.getByText('Maré de Neon')).toBeTruthy();
    expect(view.queryByText('Entre Pontes')).toBeNull();

    await fireEvent.changeText(
      view.getByLabelText('Buscar música por título ou artista'),
      '',
    );
    await fireEvent.press(view.getByLabelText('Alterar filtros do repertório'));
    await fireEvent.press(view.getByText('Arquivadas'));
    await fireEvent.press(view.getByLabelText('Aplicar filtros'));
    expect(
      view.getByLabelText('Alterar filtros do repertório').props
        .accessibilityState,
    ).toEqual({ selected: true });

    expect(view.getByText('Rota Antiga')).toBeTruthy();
    expect(view.queryByText('Entre Pontes')).toBeNull();

    await fireEvent.press(
      view.getByLabelText('Alterar ordenação do repertório'),
    );
    await fireEvent.press(view.getByText('Maior duração'));
    expect(
      view.getByLabelText('Alterar ordenação do repertório').props
        .accessibilityState,
    ).toEqual({ selected: true });

    expect(view.getByLabelText('Alterar ordenação do repertório')).toBeTruthy();
  });

  it('combina coleção, status e busca sem duplicar músicas e preserva a ordenação', async () => {
    const repositories = createRepositories({
      collectionSongs: [
        ...FESTA_MEMBERSHIPS,
        createRepertoireCollectionSong({
          bandId: BAND_ID,
          collectionId: FESTA_COLLECTION.id,
          songId: LIGHTS_SONG.id,
          position: 2,
        }),
      ],
    });
    const view = await render(
      <AppProviders currentUserId={OWNER_USER_ID} repositories={repositories}>
        <RepertoireScreen bandId={BAND_ID} />
      </AppProviders>,
    );

    await view.findByText('Luzes da Cidade');
    await fireEvent.press(view.getByLabelText('Alterar filtros do repertório'));
    expect(view.getByLabelText('Coleção das músicas')).toBeTruthy();
    await fireEvent.press(view.getByLabelText('Festa'));
    await fireEvent.press(view.getByLabelText('Sincronizadas'));
    await fireEvent.press(view.getByLabelText('Aplicar filtros'));
    expect(view.getByText('Maré de Neon')).toBeTruthy();
    expect(view.queryByText('Luzes da Cidade')).toBeNull();
    expect(view.queryByText('Entre Pontes')).toBeNull();

    await fireEvent.press(view.getByLabelText('Alterar filtros do repertório'));
    await fireEvent.press(view.getByLabelText('Todas'));
    await fireEvent.press(view.getByLabelText('Aplicar filtros'));
    await fireEvent.press(
      view.getByLabelText('Alterar ordenação do repertório'),
    );
    await fireEvent.press(view.getByLabelText('Maior duração'));
    expect(
      view
        .getAllByText(/^(Luzes da Cidade|Maré de Neon)$/)
        .map((element) => element.props.children),
    ).toEqual(['Maré de Neon', 'Luzes da Cidade']);

    await fireEvent.changeText(
      view.getByLabelText('Buscar música por título ou artista'),
      'pontes',
    );
    expect(view.getByText('Nenhuma música encontrada')).toBeTruthy();

    await fireEvent.press(view.getByLabelText('Alterar filtros do repertório'));
    await fireEvent.press(view.getByLabelText('Sem coleção'));
    await fireEvent.press(view.getByLabelText('Aplicar filtros'));
    expect(view.getByText('Entre Pontes')).toBeTruthy();
    expect(view.queryByText('Maré de Neon')).toBeNull();
  });

  it('mantém o espaço da toolbar fixo ao aplicar coleção e ocultar os controles na rolagem', async () => {
    const repositories = createRepositories();
    const view = await render(
      <AppProviders currentUserId={OWNER_USER_ID} repositories={repositories}>
        <RepertoireScreen bandId={BAND_ID} />
      </AppProviders>,
    );
    await view.findByText('Luzes da Cidade');
    const list = view.getByTestId('repertoire-list');
    const spacer = view.getByTestId('repertoire-list-header-spacer');
    const reservedHeight = spacer.props.style.height;
    const areControlsHidden = () =>
      view.getByTestId('list-controls-collapse', {
        includeHiddenElements: true,
      }).props.accessibilityElementsHidden;

    await fireEvent.press(view.getByLabelText('Alterar filtros do repertório'));
    await fireEvent.press(view.getByLabelText('Festa'));
    await fireEvent.press(view.getByLabelText('Aplicar filtros'));
    expect(spacer.props.style.height).toBe(reservedHeight);

    await fireEvent(list, 'scrollBeginDrag', {});
    await fireEvent.scroll(list, {
      nativeEvent: {
        contentOffset: { x: 0, y: 60 },
        contentSize: { height: 1600, width: 380 },
        layoutMeasurement: { height: 700, width: 380 },
      },
    });
    expect(areControlsHidden()).toBe(true);
    expect(spacer.props.style.height).toBe(reservedHeight);

    await fireEvent(list, 'scrollBeginDrag', {});
    await fireEvent.scroll(list, {
      nativeEvent: {
        contentOffset: { x: 0, y: 30 },
        contentSize: { height: 1600, width: 380 },
        layoutMeasurement: { height: 700, width: 380 },
      },
    });
    expect(areControlsHidden()).toBe(false);
    expect(spacer.props.style.height).toBe(reservedHeight);
  });

  it('não apresenta opções de coleção no filtro quando a banda não tem coleções', async () => {
    const repositories = createRepositories({
      collections: [],
      collectionSongs: [],
    });
    const view = await render(
      <AppProviders currentUserId={OWNER_USER_ID} repositories={repositories}>
        <RepertoireScreen bandId={BAND_ID} />
      </AppProviders>,
    );

    await view.findByText('Luzes da Cidade');
    await fireEvent.press(view.getByLabelText('Alterar filtros do repertório'));

    expect(view.getByLabelText('Status das músicas')).toBeTruthy();
    expect(view.queryByLabelText('Coleção das músicas')).toBeNull();
    expect(view.queryByLabelText('Todas as coleções')).toBeNull();
    expect(view.queryByLabelText('Sem coleção')).toBeNull();
  });

  it('abre com a coleção indicada pela rota e preserva o filtro ao retornar', async () => {
    const repositories = createRepositories();
    function RepertoireHarness({
      visible = true,
    }: {
      readonly visible?: boolean;
    }) {
      return (
        <AppProviders currentUserId={OWNER_USER_ID} repositories={repositories}>
          {visible ? (
            <RepertoireScreen
              bandId={BAND_ID}
              initialCollectionId={FESTA_COLLECTION.id}
            />
          ) : null}
        </AppProviders>
      );
    }

    const view = await render(<RepertoireHarness />);

    expect(await view.findByText('Maré de Neon')).toBeTruthy();
    expect(view.getByText('Luzes da Cidade')).toBeTruthy();
    expect(view.queryByText('Entre Pontes')).toBeNull();
    await fireEvent.press(view.getByLabelText('Alterar filtros do repertório'));
    expect(view.getByLabelText('Festa').props.accessibilityState).toEqual({
      checked: true,
    });

    await view.rerender(<RepertoireHarness visible={false} />);
    await view.rerender(<RepertoireHarness />);

    expect(await view.findByText('Maré de Neon')).toBeTruthy();
    expect(view.queryByText('Entre Pontes')).toBeNull();
  });

  it('restaura o filtro ao voltar do detalhe e mantém estado separado por banda durante o refresh', async () => {
    const secondarySong = createSong({
      bandId: SECOND_BAND_ID,
      id: 'song-mare-serena',
      originalArtist: 'Coletivo Continental',
      title: 'Maré Serena',
    });
    const repositories = createInMemoryRepositories({
      bands: [createBand({ id: BAND_ID }), createBand({ id: SECOND_BAND_ID })],
      bandMembers: [
        createBandMember({
          bandId: BAND_ID,
          role: 'owner',
          userId: OWNER_USER_ID,
        }),
        createBandMember({
          bandId: SECOND_BAND_ID,
          role: 'owner',
          userId: OWNER_USER_ID,
        }),
      ],
      songs: [...REPERTOIRE_SONGS, secondarySong],
      shows: [],
      repertoireCollections: [ACUSTICO_COLLECTION, FESTA_COLLECTION],
      repertoireCollectionSongs: FESTA_MEMBERSHIPS,
    });
    const listCollections = jest.spyOn(
      repositories.repertoireCollections,
      'listByBandId',
    );
    function RepertoireHarness({
      bandId,
      visible = true,
    }: {
      readonly bandId: string;
      readonly visible?: boolean;
    }) {
      return (
        <AppProviders currentUserId={OWNER_USER_ID} repositories={repositories}>
          {visible ? <RepertoireScreen bandId={bandId} /> : null}
        </AppProviders>
      );
    }

    const view = await render(<RepertoireHarness bandId={BAND_ID} />);
    await view.findByText('Luzes da Cidade');
    await fireEvent.press(view.getByLabelText('Alterar filtros do repertório'));
    await fireEvent.press(view.getByLabelText('Festa'));
    await fireEvent.press(view.getByLabelText('Aplicar filtros'));
    expect(view.getByText('Maré de Neon')).toBeTruthy();
    expect(view.queryByText('Entre Pontes')).toBeNull();

    const list = view.getByTestId('repertoire-list');
    const callsBeforeRefresh = listCollections.mock.calls.length;
    await fireEvent.scroll(list, {
      nativeEvent: {
        contentOffset: { x: 0, y: 240 },
        contentSize: { height: 1600, width: 380 },
        layoutMeasurement: { height: 700, width: 380 },
      },
    });
    const refreshControl = list.props.refreshControl;
    expect(refreshControl).toBeTruthy();
    refreshControl.props.onRefresh();
    await waitFor(() =>
      expect(listCollections).toHaveBeenCalledTimes(callsBeforeRefresh + 1),
    );
    expect(view.getByText('Maré de Neon')).toBeTruthy();

    await view.rerender(<RepertoireHarness bandId={BAND_ID} visible={false} />);
    await view.rerender(<RepertoireHarness bandId={BAND_ID} visible />);
    expect(await view.findByText('Maré de Neon')).toBeTruthy();
    expect(view.queryByText('Entre Pontes')).toBeNull();
    expect(view.getByTestId('repertoire-list').props.contentOffset).toEqual({
      x: 0,
      y: 240,
    });
    await fireEvent.press(view.getByLabelText('Alterar filtros do repertório'));
    expect(view.getByLabelText('Festa').props.accessibilityState).toEqual({
      checked: true,
    });
    await fireEvent.press(view.getByLabelText('Aplicar filtros'));

    await view.rerender(<RepertoireHarness bandId={SECOND_BAND_ID} />);
    expect(await view.findByText('Maré Serena')).toBeTruthy();
    expect(
      view.getByLabelText('Alterar filtros do repertório').props
        .accessibilityState?.selected,
    ).toBeUndefined();
    await fireEvent.press(view.getByLabelText('Alterar filtros do repertório'));
    expect(view.queryByLabelText('Coleção das músicas')).toBeNull();
    await fireEvent.press(view.getByLabelText('Fechar filtros'));

    await view.rerender(<RepertoireHarness bandId={BAND_ID} />);
    expect(await view.findByText('Maré de Neon')).toBeTruthy();
    expect(view.queryByText('Entre Pontes')).toBeNull();
  }, 15_000);

  it('remove o filtro da coleção excluída após confirmar a consulta e preserva os outros critérios', async () => {
    const repositories = createRepositories();
    const listCollections = jest.spyOn(
      repositories.repertoireCollections,
      'listByBandId',
    );
    const collection = FESTA_COLLECTION;
    const view = await render(
      <AppProviders currentUserId={OWNER_USER_ID} repositories={repositories}>
        <RepertoireScreen bandId={BAND_ID} />
      </AppProviders>,
    );

    await view.findByText('Luzes da Cidade');
    await fireEvent.press(view.getByLabelText('Alterar filtros do repertório'));
    await fireEvent.press(view.getByLabelText('Festa'));
    await fireEvent.press(view.getByLabelText('Sincronizadas'));
    await fireEvent.press(view.getByLabelText('Aplicar filtros'));
    await fireEvent.changeText(
      view.getByLabelText('Buscar música por título ou artista'),
      'maré',
    );
    expect(view.getByText('Maré de Neon')).toBeTruthy();

    await repositories.repertoireCollections.delete({
      bandId: BAND_ID,
      collectionId: collection.id,
      expectedUpdatedAt: collection.updatedAt,
    });
    const callsBeforeRefresh = listCollections.mock.calls.length;
    view.getByTestId('repertoire-list').props.refreshControl.props.onRefresh();
    await waitFor(() =>
      expect(listCollections).toHaveBeenCalledTimes(callsBeforeRefresh + 1),
    );

    expect(
      await view.findByTestId('collection-filter-removal-notice'),
    ).toBeTruthy();
    expect(view.getByText('Maré de Neon')).toBeTruthy();
    expect(view.queryByText('Luzes da Cidade')).toBeNull();
    expect(
      view.getByLabelText('Buscar música por título ou artista').props.value,
    ).toBe('maré');

    await fireEvent.press(view.getByLabelText('Alterar filtros do repertório'));
    expect(
      view.getByLabelText('Todas as coleções').props.accessibilityState,
    ).toEqual({ checked: true });
    expect(
      view.getByLabelText('Sincronizadas').props.accessibilityState,
    ).toEqual({ checked: true });
  });

  it('mantém critério e músicas em caso de falha ao atualizar as coleções', async () => {
    const repositories = createRepositories();
    const listCollections = jest
      .spyOn(repositories.repertoireCollections, 'listByBandId')
      .mockResolvedValue([ACUSTICO_COLLECTION, FESTA_COLLECTION]);
    const view = await render(
      <AppProviders currentUserId={OWNER_USER_ID} repositories={repositories}>
        <RepertoireScreen bandId={BAND_ID} />
      </AppProviders>,
    );

    await view.findByText('Luzes da Cidade');
    await fireEvent.press(view.getByLabelText('Alterar filtros do repertório'));
    await fireEvent.press(view.getByLabelText('Festa'));
    await fireEvent.press(view.getByLabelText('Aplicar filtros'));
    await fireEvent.changeText(
      view.getByLabelText('Buscar música por título ou artista'),
      'maré',
    );
    expect(view.getByText('Maré de Neon')).toBeTruthy();

    listCollections.mockRejectedValue(new Error('Falha de conexão'));
    await act(async () => {
      await view
        .getByTestId('repertoire-list')
        .props.refreshControl.props.onRefresh();
    });
    expect(view.queryByTestId('feedback-error')).toBeNull();

    expect(view.getByText('Maré de Neon')).toBeTruthy();
    expect(view.queryByTestId('collection-filter-removal-notice')).toBeNull();
    await fireEvent.press(view.getByLabelText('Alterar filtros do repertório'));
    expect(view.getByLabelText('Festa').props.accessibilityState).toEqual({
      checked: true,
    });
  });

  it('apresenta estados vazios e permite limpar uma busca sem resultado', async () => {
    const emptyRepositories = createRepositories({
      songs: [],
      collections: [],
      collectionSongs: [],
    });
    const emptyView = await render(
      <AppProviders
        currentUserId={OWNER_USER_ID}
        repositories={emptyRepositories}
      >
        <RepertoireScreen bandId={BAND_ID} />
      </AppProviders>,
    );

    expect(await emptyView.findByText('Comece pelo repertório')).toBeTruthy();
    await emptyView.unmount();

    const searchRepositories = createRepositories();
    const searchView = await render(
      <AppProviders
        currentUserId={OWNER_USER_ID}
        repositories={searchRepositories}
      >
        <RepertoireScreen bandId={BAND_ID} />
      </AppProviders>,
    );

    await searchView.findByText('Luzes da Cidade');
    await fireEvent.changeText(
      searchView.getByLabelText('Buscar música por título ou artista'),
      'música que não existe',
    );
    expect(searchView.getByText('Nenhuma música encontrada')).toBeTruthy();

    await fireEvent.press(searchView.getByText('Limpar filtros'));
    expect(await searchView.findByText('Luzes da Cidade')).toBeTruthy();
  });

  it('oferece a inclusão ao editor de uma banda conectada', async () => {
    const repositories = createRepositories();
    const view = await render(
      <AppProviders currentUserId={OWNER_USER_ID} repositories={repositories}>
        <RepertoireScreen bandId={BAND_ID} />
      </AppProviders>,
    );

    await view.findByText('Luzes da Cidade');
    await fireEvent.press(
      view.getByLabelText('Adicionar música ao repertório'),
    );

    expect(mockRouter.push).toHaveBeenCalledWith(
      `/bands/${BAND_ID}/repertoire/new`,
    );
  });

  it('não oferece inclusão para uma pessoa Member', async () => {
    const repositories = createRepositories({
      role: 'member',
      userId: MEMBER_USER_ID,
    });
    const view = await render(
      <AppProviders currentUserId={MEMBER_USER_ID} repositories={repositories}>
        <RepertoireScreen bandId={BAND_ID} />
      </AppProviders>,
    );

    await view.findByText('Luzes da Cidade');
    expect(view.queryByLabelText('Adicionar música ao repertório')).toBeNull();
  });

  it('oferece acesso opcional às coleções também para pessoas Member', async () => {
    const repositories = createRepositories({
      role: 'member',
      userId: MEMBER_USER_ID,
    });
    const view = await render(
      <AppProviders currentUserId={MEMBER_USER_ID} repositories={repositories}>
        <RepertoireScreen bandId={BAND_ID} />
      </AppProviders>,
    );

    await view.findByText('Luzes da Cidade');
    await pressCollectionAction(view, 'Ver coleções');

    expect(mockRouter.push).toHaveBeenCalledWith(
      `/bands/${BAND_ID}/repertoire/collections`,
    );
    expect(view.queryByLabelText('Adicionar música ao repertório')).toBeNull();
  });

  it('oferece letra em tela cheia no menu apenas para músicas com letra', async () => {
    const repositories = createRepositories();
    const view = await render(
      <AppProviders currentUserId={OWNER_USER_ID} repositories={repositories}>
        <RepertoireScreen bandId={BAND_ID} />
      </AppProviders>,
    );

    await view.findByText('Luzes da Cidade');
    await pressActionMenu(
      view,
      'Ações da música Luzes da Cidade',
      'Exibir letra',
    );
    expect(mockRouter.push).toHaveBeenCalledWith(
      `/bands/${BAND_ID}/repertoire/${LIGHTS_SONG.id}/lyrics`,
    );

    await fireEvent.press(
      view.getByLabelText('Ações da música Instrumental de Abertura'),
    );
    expect(view.queryByLabelText('Exibir letra')).toBeNull();
  });

  it('distingue clique simples e duplo no Repertório Web', async () => {
    const originalPlatform = Platform.OS;
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
    jest.useFakeTimers();

    try {
      const repositories = createRepositories();
      const view = await render(
        <AppProviders currentUserId={OWNER_USER_ID} repositories={repositories}>
          <RepertoireScreen bandId={BAND_ID} />
        </AppProviders>,
      );
      await view.findByText('Luzes da Cidade');
      const songCard = view.getByRole('link', {
        name: /Abrir música Luzes da Cidade/,
      });

      await fireEvent.press(songCard, {
        nativeEvent: { button: 0, detail: 1 },
      });
      expect(mockRouter.push).not.toHaveBeenCalled();
      await fireEvent.press(songCard, {
        nativeEvent: { button: 0, detail: 2 },
      });
      expect(mockRouter.push).toHaveBeenCalledWith(
        `/bands/${BAND_ID}/repertoire/${LIGHTS_SONG.id}/lyrics`,
      );

      mockRouter.push.mockClear();
      await fireEvent.press(songCard, {
        nativeEvent: { button: 0, detail: 1 },
      });
      await act(async () => jest.advanceTimersByTime(320));
      expect(mockRouter.push).toHaveBeenCalledWith(
        `/bands/${BAND_ID}/repertoire/${LIGHTS_SONG.id}`,
      );
    } finally {
      jest.useRealTimers();
      Object.defineProperty(Platform, 'OS', {
        configurable: true,
        value: originalPlatform,
      });
    }
  });

  it('preserva busca e filtros durante a seleção múltipla', async () => {
    const repositories = createRepositories();
    const view = await render(
      <AppProviders currentUserId={OWNER_USER_ID} repositories={repositories}>
        <RepertoireScreen bandId={BAND_ID} />
      </AppProviders>,
    );

    await view.findByText('Luzes da Cidade');
    await fireEvent.press(view.getByLabelText('Alterar filtros do repertório'));
    await fireEvent.press(view.getByText('Arquivadas'));
    await fireEvent.changeText(
      view.getByLabelText('Buscar música por título ou artista'),
      'rota',
    );
    expect(view.getByText('Rota Antiga')).toBeTruthy();
    await fireEvent.press(view.getByLabelText('Aplicar filtros'));

    await pressCollectionAction(view, 'Selecionar músicas do repertório');

    expect(
      view.getByLabelText('Buscar música por título ou artista').props.value,
    ).toBe('rota');
    expect(
      view.getByLabelText('Alterar filtros do repertório').props
        .accessibilityState,
    ).toEqual({ selected: true });
    expect(view.getByLabelText('Selecionar Rota Antiga')).toBeTruthy();
    expect(view.getByText('0 selecionadas')).toBeTruthy();
    await pressCollectionAction(
      view,
      'Selecionar todas as músicas visíveis (1)',
    );
    expect(view.getByText('1 selecionada')).toBeTruthy();
  });

  it('retorna ao toque habitual e não grava ao cancelar a seleção', async () => {
    const repositories = createRepositories();
    const save = jest.spyOn(repositories.repertoireCollections, 'save');
    const appendSongs = jest.spyOn(
      repositories.repertoireCollections,
      'appendSongs',
    );
    const setSongCollections = jest.spyOn(
      repositories.repertoireCollections,
      'setSongCollections',
    );
    const deleteCollection = jest.spyOn(
      repositories.repertoireCollections,
      'delete',
    );
    const view = await render(
      <AppProviders currentUserId={OWNER_USER_ID} repositories={repositories}>
        <RepertoireScreen bandId={BAND_ID} />
      </AppProviders>,
    );

    await view.findByText('Luzes da Cidade');
    await pressCollectionAction(view, 'Selecionar músicas do repertório');
    await fireEvent.changeText(
      view.getByLabelText('Buscar música por título ou artista'),
      'pontes',
    );
    await fireEvent.press(view.getByLabelText('Selecionar Entre Pontes'));
    expect(view.getByText('1 selecionada')).toBeTruthy();

    await fireEvent.changeText(
      view.getByLabelText('Buscar música por título ou artista'),
      'luzes',
    );
    expect(view.getByText('1 selecionada')).toBeTruthy();
    await fireEvent.press(view.getByLabelText('Selecionar Luzes da Cidade'));
    expect(view.getByText('2 selecionadas')).toBeTruthy();

    await fireEvent.press(view.getByLabelText('Cancelar seleção de músicas'));
    expect(view.getByLabelText('Abrir coleções do repertório')).toBeTruthy();
    expect(
      view.queryByLabelText('Selecionar músicas do repertório'),
    ).toBeNull();
    expect(
      view.getByLabelText('Buscar música por título ou artista').props.value,
    ).toBe('luzes');
    expect(
      view.queryByLabelText('Remover seleção de Luzes da Cidade'),
    ).toBeNull();
    expect(
      view.getByRole('link', { name: /Abrir música Luzes da Cidade/ }),
    ).toBeTruthy();
    expect(save).not.toHaveBeenCalled();
    expect(appendSongs).not.toHaveBeenCalled();
    expect(setSongCollections).not.toHaveBeenCalled();
    expect(deleteCollection).not.toHaveBeenCalled();
  });

  it('não oferece seleção múltipla para pessoas Member', async () => {
    const repositories = createRepositories({
      role: 'member',
      userId: MEMBER_USER_ID,
    });
    const view = await render(
      <AppProviders currentUserId={MEMBER_USER_ID} repositories={repositories}>
        <RepertoireScreen bandId={BAND_ID} />
      </AppProviders>,
    );

    await view.findByText('Luzes da Cidade');

    expect(
      view.queryByLabelText('Selecionar músicas do repertório'),
    ).toBeNull();
  });

  it('abre a criação da coleção com as músicas selecionadas', async () => {
    const repositories = createRepositories();
    const view = await render(
      <AppProviders currentUserId={OWNER_USER_ID} repositories={repositories}>
        <RepertoireScreen bandId={BAND_ID} />
      </AppProviders>,
    );
    const lightsSong = LIGHTS_SONG;
    const bridgesSong = BRIDGES_SONG;

    await view.findByText('Luzes da Cidade');
    await pressCollectionAction(view, 'Selecionar músicas do repertório');
    await fireEvent.press(view.getByLabelText('Selecionar Luzes da Cidade'));
    await fireEvent.press(view.getByLabelText('Selecionar Entre Pontes'));
    await pressCollectionAction(
      view,
      'Adicionar 2 músicas selecionadas a uma coleção',
    );
    let parent = view.getByTestId('repertoire-collection-picker').parent;
    while (parent && typeof parent.props.onDismiss !== 'function') {
      parent = parent.parent;
    }
    if (!parent) throw new Error('Modal de inclusão em coleção não encontrado');
    const dismiss = parent.props.onDismiss as () => void;
    await fireEvent.press(await view.findByText('Nova coleção'));
    await act(async () => dismiss());

    expect(mockRouter.push).toHaveBeenCalledWith(
      `/bands/${BAND_ID}/repertoire/collections/new?songId=${lightsSong.id}&songId=${bridgesSong.id}&returnTo=repertoire`,
    );
  });

  it('acrescenta somente músicas novas ao final da coleção escolhida', async () => {
    const repositories = createRepositories();
    const appendSpy = jest.spyOn(
      repositories.repertoireCollections,
      'appendSongs',
    );
    const bridgeSong = BRIDGES_SONG;
    const lightsSong = LIGHTS_SONG;
    const neonSong = NEON_SONG;

    const view = await render(
      <AppProviders currentUserId={OWNER_USER_ID} repositories={repositories}>
        <RepertoireScreen
          bandId={BAND_ID}
          initialAppendCollectionId={FESTA_COLLECTION.id}
        />
      </AppProviders>,
    );

    await view.findByText('Luzes da Cidade');
    await fireEvent.press(view.getByLabelText('Selecionar Entre Pontes'));
    await fireEvent.press(view.getByLabelText('Selecionar Luzes da Cidade'));
    await fireEvent.press(view.getByLabelText('Selecionar Maré de Neon'));
    expect(view.getByText('3 selecionadas')).toBeTruthy();
    await pressCollectionAction(
      view,
      'Adicionar 3 músicas selecionadas a uma coleção',
    );
    expect(
      view.getByLabelText('Selecionar coleção Festa').props.accessibilityState,
    ).toEqual({ selected: true });

    expect(
      view.getByText(
        '1 música nova será adicionada. 2 já pertencem à coleção.',
      ),
    ).toBeTruthy();
    await fireEvent.press(
      view.getByLabelText('Confirmar inclusão na coleção Festa'),
    );
    expect(
      await view.findByText(
        '1 música adicionada à coleção Festa. 2 já faziam parte da coleção.',
      ),
    ).toBeTruthy();
    expect(appendSpy).toHaveBeenCalledWith({
      bandId: BAND_ID,
      collectionId: FESTA_COLLECTION.id,
      songIds: [bridgeSong.id, lightsSong.id, neonSong.id],
    });

    expect(view.queryByTestId('repertoire-collection-picker')).toBeNull();
    expect(view.queryByText('3 selecionadas')).toBeNull();
    const finalCollectionSongs = (
      await repositories.repertoireCollections.listSongsByBandId(BAND_ID)
    )
      .filter(({ collectionId }) => collectionId === FESTA_COLLECTION.id)
      .sort((left, right) => left.position - right.position);
    expect(finalCollectionSongs).toEqual([
      {
        bandId: BAND_ID,
        collectionId: FESTA_COLLECTION.id,
        position: 0,
        songId: LIGHTS_SONG.id,
      },
      {
        bandId: BAND_ID,
        collectionId: FESTA_COLLECTION.id,
        position: 1,
        songId: neonSong.id,
      },
      {
        bandId: BAND_ID,
        collectionId: FESTA_COLLECTION.id,
        position: 2,
        songId: bridgeSong.id,
      },
    ]);
  });

  it('mantém a coleção sem alterações quando a inclusão falha', async () => {
    const repositories = createRepositories();
    const originalSongs =
      await repositories.repertoireCollections.listSongsByBandId(BAND_ID);
    jest
      .spyOn(repositories.repertoireCollections, 'appendSongs')
      .mockRejectedValue(
        new RepertoireCollectionError(
          'request_failed',
          'Não foi possível atualizar a coleção agora.',
        ),
      );
    const view = await render(
      <AppProviders currentUserId={OWNER_USER_ID} repositories={repositories}>
        <RepertoireScreen bandId={BAND_ID} />
      </AppProviders>,
    );

    await view.findByText('Luzes da Cidade');
    await pressCollectionAction(view, 'Selecionar músicas do repertório');
    await fireEvent.press(view.getByLabelText('Selecionar Entre Pontes'));
    await pressCollectionAction(
      view,
      'Adicionar 1 música selecionada a uma coleção',
    );
    await fireEvent.press(view.getByLabelText('Selecionar coleção Festa'));
    await fireEvent.press(
      view.getByLabelText('Confirmar inclusão na coleção Festa'),
    );

    expect(
      await view.findByText('Não foi possível atualizar a coleção agora.'),
    ).toBeTruthy();
    expect(
      await repositories.repertoireCollections.listSongsByBandId(BAND_ID),
    ).toEqual(originalSongs);
    expect(
      view.getByText('1 selecionada', { includeHiddenElements: true }),
    ).toBeTruthy();
  });

  it('leva Owner de uma banda conectada à criação online', async () => {
    const bandId = 'band-repertoire-connected';
    const repositories = createRepositories({
      bandId,
      userId: OWNER_USER_ID,
      role: 'owner',
      songs: [],
      collections: [],
      collectionSongs: [],
    });
    const view = await render(
      <AppProviders currentUserId={OWNER_USER_ID} repositories={repositories}>
        <RepertoireScreen bandId={bandId} />
      </AppProviders>,
    );

    await view.findByText('Comece pelo repertório');
    expect(view.getByLabelText('Adicionar música ao repertório')).toBeTruthy();
    await fireEvent.press(
      view.getByLabelText('Adicionar música ao repertório'),
    );

    expect(mockRouter.push).toHaveBeenCalledWith(
      `/bands/${bandId}/repertoire/new`,
    );
  });
});
