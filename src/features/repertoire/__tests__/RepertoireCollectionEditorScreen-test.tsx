import {
  act,
  fireEvent,
  render,
  waitFor,
  within,
} from '@testing-library/react-native';
import { Platform } from 'react-native';
import { createInMemoryRepositories } from '@/data/in-memory';
import { RepertoireCollectionError } from '@/domain';
import { RepertoireCollectionEditorScreen } from '@/features/repertoire/RepertoireCollectionEditorScreen';
import {
  createBand,
  createBandMember,
  createRepertoireCollection,
  createRepertoireCollectionSong,
  createSong,
} from '@/testing/factories';
import { TestAppProviders as AppProviders } from '@/testing/TestAppProviders';

const BAND_ID = 'band-collection-editor';
const OWNER_USER_ID = 'user-collection-editor-owner';
const COLLECTION_UPDATED_AT = '2026-09-08T12:05:00.000Z';
const LIGHTS_SONG = createSong({
  bandId: BAND_ID,
  estimatedDurationMs: 218_000,
  id: 'song-luzes-da-cidade',
  originalArtist: 'Banda Horizonte',
  title: 'Luzes da Cidade',
});
const NEON_SONG = createSong({
  bandId: BAND_ID,
  estimatedDurationMs: 259_000,
  id: 'song-mare-de-neon',
  originalArtist: 'Coletivo Atlântico',
  title: 'Maré de Neon',
});
const FESTA_COLLECTION = createRepertoireCollection({
  bandId: BAND_ID,
  id: 'collection-festa',
  name: 'Festa',
  updatedAt: COLLECTION_UPDATED_AT,
});
const ACOUSTIC_COLLECTION = createRepertoireCollection({
  bandId: BAND_ID,
  id: 'collection-acustico',
  name: 'Acústico',
});
const COLLECTION_SONGS = [
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
  createRepertoireCollectionSong({
    bandId: BAND_ID,
    collectionId: ACOUSTIC_COLLECTION.id,
    position: 0,
    songId: LIGHTS_SONG.id,
  }),
];

function createRepositories({
  collections = [FESTA_COLLECTION, ACOUSTIC_COLLECTION],
  collectionSongs = COLLECTION_SONGS,
  songs = [LIGHTS_SONG, NEON_SONG],
  createId,
}: {
  collections?: readonly ReturnType<typeof createRepertoireCollection>[];
  collectionSongs?: readonly ReturnType<
    typeof createRepertoireCollectionSong
  >[];
  songs?: readonly ReturnType<typeof createSong>[];
  createId?: () => string;
} = {}) {
  return createInMemoryRepositories(
    {
      bands: [createBand({ id: BAND_ID })],
      bandMembers: [
        createBandMember({
          bandId: BAND_ID,
          id: 'membership-collection-editor-owner',
          role: 'owner',
          userId: OWNER_USER_ID,
        }),
      ],
      repertoireCollections: collections,
      repertoireCollectionSongs: collectionSongs,
      songs,
      shows: [],
    },
    { createId },
  );
}

const mockRouter = {
  back: jest.fn(),
  canGoBack: jest.fn().mockReturnValue(true),
  push: jest.fn(),
  replace: jest.fn(),
};
let mockBeforeRemove:
  | ((event: {
      preventDefault: () => void;
      data: { action: { type: string } };
    }) => void)
  | undefined;
const mockDispatch = jest.fn();

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: object }) => children,
  useFocusEffect: jest.fn(),
  useRouter: () => mockRouter,
  useNavigation: () => ({
    addListener: (_type: string, callback: typeof mockBeforeRemove) => {
      mockBeforeRemove = callback;
      return jest.fn();
    },
    dispatch: mockDispatch,
  }),
}));

jest.mock('react-native-gesture-handler', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const gestureHandler = jest.requireActual<
    typeof import('react-native-gesture-handler')
  >('react-native-gesture-handler');
  const createPanGesture = () => {
    const gesture = {
      callbacks: {} as Record<string, (...args: never[]) => void>,
      activeOffsetX: () => gesture,
      activeOffsetY: () => gesture,
      enabled: () => gesture,
      failOffsetY: () => gesture,
      maxPointers: () => gesture,
      onEnd: (callback: (...args: never[]) => void) => {
        gesture.callbacks.onEnd = callback;
        return gesture;
      },
      onFinalize: (callback: (...args: never[]) => void) => {
        gesture.callbacks.onFinalize = callback;
        return gesture;
      },
      onStart: (callback: (...args: never[]) => void) => {
        gesture.callbacks.onStart = callback;
        return gesture;
      },
      onUpdate: (callback: (...args: never[]) => void) => {
        gesture.callbacks.onUpdate = callback;
        return gesture;
      },
      runOnJS: () => gesture,
      shouldCancelWhenOutside: () => gesture,
      testID: '',
      withTestId: (testID: string) => {
        gesture.testID = testID;
        return gesture;
      },
    };
    return gesture;
  };

  return {
    ...gestureHandler,
    Gesture: { Pan: createPanGesture },
    GestureDetector: ({
      children,
      gesture,
    }: {
      readonly children?: import('react').ReactNode;
      readonly gesture: ReturnType<typeof createPanGesture>;
    }) =>
      React.createElement(
        'GestureDetectorMock',
        {
          onEnd: gesture.callbacks.onEnd,
          onFinalize: gesture.callbacks.onFinalize,
          onStart: gesture.callbacks.onStart,
          onUpdate: gesture.callbacks.onUpdate,
          testID: gesture.testID,
        },
        children,
      ),
  };
});

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

describe('<RepertoireCollectionEditorScreen />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBeforeRemove = undefined;
  });

  it('protege a rota editada e continua ou descarta sem bloquear a navegação', async () => {
    const originalPlatform = Platform.OS;
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
    try {
      const view = await render(
        <AppProviders
          currentUserId={OWNER_USER_ID}
          repositories={createRepositories()}
        >
          <RepertoireCollectionEditorScreen
            bandId={BAND_ID}
            collectionId="collection-festa"
          />
        </AppProviders>,
      );
      await fireEvent.changeText(
        await view.findByLabelText('Nome da coleção'),
        'Festa alterada',
      );
      const event = {
        preventDefault: jest.fn(),
        data: { action: { type: 'GO_BACK' } },
      };

      await act(async () => mockBeforeRemove?.(event));
      expect(event.preventDefault).toHaveBeenCalledTimes(1);
      expect(view.getByTestId('unsaved-changes-prompt')).toBeTruthy();
      await fireEvent.press(view.getByText('Continuar editando'));
      expect(view.getByLabelText('Nome da coleção').props.value).toBe(
        'Festa alterada',
      );
      expect(mockDispatch).not.toHaveBeenCalled();

      await act(async () => mockBeforeRemove?.(event));
      const dismissPrompt = getPromptNativeDismiss(view);
      await fireEvent.press(view.getByLabelText('Descartar alterações'));
      expect(mockDispatch).not.toHaveBeenCalled();
      await act(async () => dismissPrompt());
      expect(mockDispatch).toHaveBeenCalledWith(event.data.action);
      expect(view.queryByText('Descartar alterações?')).toBeNull();
    } finally {
      Object.defineProperty(Platform, 'OS', {
        configurable: true,
        value: originalPlatform,
      });
    }
  });

  it('ignora toques repetidos enquanto a gravação está em andamento', async () => {
    const repositories = createRepositories();
    const originalSave = repositories.repertoireCollections.save.bind(
      repositories.repertoireCollections,
    );
    const deferred = { release: () => {} };
    const saveSpy = jest
      .spyOn(repositories.repertoireCollections, 'save')
      .mockImplementation(async (input) => {
        await new Promise<void>((resolve) => {
          deferred.release = resolve;
        });
        return originalSave(input);
      });
    const view = await render(
      <AppProviders currentUserId={OWNER_USER_ID} repositories={repositories}>
        <RepertoireCollectionEditorScreen
          bandId={BAND_ID}
          collectionId="collection-festa"
        />
      </AppProviders>,
    );

    await fireEvent.changeText(
      await view.findByLabelText('Nome da coleção'),
      'Festa atualizada',
    );
    await fireEvent.press(view.getByLabelText('Salvar coleção'));
    await fireEvent.press(view.getByLabelText('Salvar coleção'));
    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(
      view.getByLabelText('Salvar coleção').props.accessibilityState,
    ).toEqual({ disabled: true });

    await act(async () => deferred.release());
    await waitFor(() => expect(mockRouter.back).toHaveBeenCalledTimes(1));
    expect(view.queryByText('Descartar alterações?')).toBeNull();
  });

  it('inicia uma coleção com as músicas escolhidas e protege o descarte', async () => {
    const songId = LIGHTS_SONG.id;

    const view = await render(
      <AppProviders
        currentUserId={OWNER_USER_ID}
        repositories={createRepositories()}
      >
        <RepertoireCollectionEditorScreen
          bandId={BAND_ID}
          initialSongIds={[songId, 'song-inexistente', songId]}
          returnToRepertoire
        />
      </AppProviders>,
    );

    expect(
      await view.findByText('1 música selecionada será incluída.'),
    ).toBeTruthy();
    expect(view.queryByText('Luzes da Cidade')).toBeNull();
    expect(
      view.queryByLabelText('Buscar música por título ou artista'),
    ).toBeNull();
    await fireEvent.changeText(
      view.getByLabelText('Nome da coleção'),
      'Festa selecionada',
    );
    await fireEvent.press(view.getByText('Cancelar'));
    expect(view.getByTestId('unsaved-changes-prompt')).toBeTruthy();

    const dismissPrompt = getPromptNativeDismiss(view);
    await fireEvent.press(view.getByLabelText('Descartar alterações'));
    await act(async () => dismissPrompt());

    expect(mockRouter.back).toHaveBeenCalledTimes(1);
  });

  it('salva somente as músicas recebidas na criação da coleção', async () => {
    const songId = LIGHTS_SONG.id;

    const repositories = createRepositories({
      createId: () => 'collection-from-repertoire',
    });
    const view = await render(
      <AppProviders currentUserId={OWNER_USER_ID} repositories={repositories}>
        <RepertoireCollectionEditorScreen
          bandId={BAND_ID}
          initialSongIds={[songId, 'song-inexistente', songId]}
          returnToRepertoire
        />
      </AppProviders>,
    );

    await view.findByText('1 música selecionada será incluída.');
    await fireEvent.changeText(
      view.getByLabelText('Nome da coleção'),
      'Festa via repertório',
    );
    await fireEvent.press(view.getByLabelText('Salvar coleção'));

    await waitFor(() =>
      expect(mockRouter.replace).toHaveBeenCalledWith(
        `/bands/${BAND_ID}/repertoire/collections/collection-from-repertoire/edit?returnTo=repertoire`,
      ),
    );
    const savedCollection = (
      await repositories.repertoireCollections.listByBandId(BAND_ID)
    ).find(({ name }) => name === 'Festa via repertório');
    expect(savedCollection).toBeTruthy();
    expect(
      (await repositories.repertoireCollections.listSongsByBandId(BAND_ID))
        .filter(({ collectionId }) => collectionId === savedCollection?.id)
        .map(({ songId: includedSongId }) => includedSongId),
    ).toEqual([songId]);
  });

  it('valida nome vazio, limite de 120 caracteres e duplicidade', async () => {
    const view = await render(
      <AppProviders
        currentUserId={OWNER_USER_ID}
        repositories={createRepositories()}
      >
        <RepertoireCollectionEditorScreen bandId={BAND_ID} />
      </AppProviders>,
    );

    await view.findByLabelText('Nome da coleção');
    await fireEvent.press(view.getByLabelText('Salvar coleção'));
    expect(
      await view.findByText('Informe um nome para a coleção.'),
    ).toBeTruthy();

    await fireEvent.changeText(
      view.getByLabelText('Nome da coleção'),
      'a'.repeat(121),
    );
    await fireEvent.press(view.getByLabelText('Salvar coleção'));
    expect(
      await view.findByText('O nome pode ter até 120 caracteres.'),
    ).toBeTruthy();

    await fireEvent.changeText(
      view.getByLabelText('Nome da coleção'),
      '  ACÚSTICO  ',
    );
    await fireEvent.press(view.getByLabelText('Salvar coleção'));
    expect(
      await view.findByText('Já existe uma coleção com esse nome nesta banda.'),
    ).toBeTruthy();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('permite salvar uma coleção vazia após nome válido', async () => {
    const repositories = createRepositories({
      createId: () => 'collection-new',
    });
    const saveSpy = jest.spyOn(repositories.repertoireCollections, 'save');
    const view = await render(
      <AppProviders currentUserId={OWNER_USER_ID} repositories={repositories}>
        <RepertoireCollectionEditorScreen bandId={BAND_ID} />
      </AppProviders>,
    );

    await view.findByLabelText('Nome da coleção');
    await fireEvent.changeText(
      view.getByLabelText('Nome da coleção'),
      '  Ensaios  ',
    );
    await fireEvent.press(view.getByLabelText('Salvar coleção'));

    await waitFor(() => {
      expect(saveSpy).toHaveBeenCalledWith({
        bandId: BAND_ID,
        name: 'Ensaios',
        orderedSongIds: [],
      });
      expect(mockRouter.replace).toHaveBeenCalledWith(
        `/bands/${BAND_ID}/repertoire/collections/collection-new/edit`,
      );
    });
  });

  it('renomeia mantendo as músicas e a revisão existente', async () => {
    const repositories = createRepositories({
      createId: () => 'collection-new',
    });
    const saveSpy = jest.spyOn(repositories.repertoireCollections, 'save');
    const view = await render(
      <AppProviders currentUserId={OWNER_USER_ID} repositories={repositories}>
        <RepertoireCollectionEditorScreen
          bandId={BAND_ID}
          collectionId="collection-festa"
        />
      </AppProviders>,
    );

    const nameField = await view.findByLabelText('Nome da coleção');
    await fireEvent.changeText(nameField, 'Festa de rua');
    await fireEvent.press(view.getByLabelText('Salvar coleção'));

    await waitFor(() => {
      expect(saveSpy).toHaveBeenCalledWith({
        bandId: BAND_ID,
        collectionId: 'collection-festa',
        expectedUpdatedAt: '2026-09-08T12:05:00.000Z',
        name: 'Festa de rua',
        orderedSongIds: [LIGHTS_SONG.id, NEON_SONG.id],
      });
      expect(mockRouter.back).toHaveBeenCalledTimes(1);
    });
  });

  it('reordena e remove participações sem excluir músicas do repertório', async () => {
    const repositories = createRepositories();
    const saveSpy = jest.spyOn(repositories.repertoireCollections, 'save');
    const view = await render(
      <AppProviders currentUserId={OWNER_USER_ID} repositories={repositories}>
        <RepertoireCollectionEditorScreen
          bandId={BAND_ID}
          collectionId="collection-festa"
        />
      </AppProviders>,
    );

    await view.findByLabelText('Nome da coleção');
    const songRow = view.getByTestId(`collection-song-row-${LIGHTS_SONG.id}`);
    await fireEvent(songRow, 'layout', {
      nativeEvent: { layout: { height: 64, width: 320, x: 0, y: 0 } },
    });
    const initialHandle = view.getByTestId(
      `gesture-collection-song-drag-${LIGHTS_SONG.id}`,
    );
    await act(async () => {
      initialHandle.props.onStart({});
    });
    const activeHandle = view.getByTestId(
      `gesture-collection-song-drag-${LIGHTS_SONG.id}`,
    );
    await act(async () => {
      activeHandle.props.onUpdate({ translationY: 80 });
    });
    expect(view.getByTestId('collection-song-drag-preview')).toBeTruthy();
    await act(async () => {
      activeHandle.props.onEnd({}, true);
    });
    await fireEvent.press(
      view.getByLabelText('Remover Luzes da Cidade da coleção'),
    );
    await fireEvent.press(view.getByLabelText('Salvar coleção'));

    await waitFor(() => {
      expect(saveSpy).toHaveBeenCalledWith({
        bandId: BAND_ID,
        collectionId: 'collection-festa',
        expectedUpdatedAt: '2026-09-08T12:05:00.000Z',
        name: 'Festa',
        orderedSongIds: [NEON_SONG.id],
      });
    });
    await expect(repositories.songs.listByBandId(BAND_ID)).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: LIGHTS_SONG.id }),
        expect.objectContaining({ id: NEON_SONG.id }),
      ]),
    );
  });

  it('só exclui a coleção após confirmação e mantém as músicas', async () => {
    const repositories = createRepositories();
    const deleteSpy = jest.spyOn(repositories.repertoireCollections, 'delete');
    const view = await render(
      <AppProviders currentUserId={OWNER_USER_ID} repositories={repositories}>
        <RepertoireCollectionEditorScreen
          bandId={BAND_ID}
          collectionId="collection-festa"
        />
      </AppProviders>,
    );

    await view.findByLabelText('Nome da coleção');
    await fireEvent.press(view.getByLabelText('Excluir coleção'));
    expect(view.getByTestId('collection-delete-confirmation')).toBeTruthy();
    expect(
      view.getByText(/As músicas e os shows existentes não serão excluídos/),
    ).toBeTruthy();
    await fireEvent.press(
      within(view.getByTestId('collection-delete-confirmation')).getByLabelText(
        'Cancelar exclusão',
      ),
    );
    expect(deleteSpy).not.toHaveBeenCalled();

    await fireEvent.press(view.getByLabelText('Excluir coleção'));
    await fireEvent.press(
      view.getByLabelText('Confirmar exclusão definitiva da coleção'),
    );

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith({
        bandId: BAND_ID,
        collectionId: 'collection-festa',
        expectedUpdatedAt: '2026-09-08T12:05:00.000Z',
      });
      expect(mockRouter.replace).toHaveBeenCalledWith(
        `/bands/${BAND_ID}/repertoire/collections`,
      );
    });
    await expect(repositories.songs.listByBandId(BAND_ID)).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: LIGHTS_SONG.id }),
        expect.objectContaining({ id: NEON_SONG.id }),
      ]),
    );
  });

  it('preserva a edição e oferece revisar os dados após conflito de revisão', async () => {
    const repositories = createRepositories();
    jest
      .spyOn(repositories.repertoireCollections, 'save')
      .mockRejectedValueOnce(
        new RepertoireCollectionError(
          'stale_revision',
          'A coleção foi alterada por outra pessoa. Saia da edição e reabra a coleção para conferir a versão atual.',
        ),
      );
    const view = await render(
      <AppProviders currentUserId={OWNER_USER_ID} repositories={repositories}>
        <RepertoireCollectionEditorScreen
          bandId={BAND_ID}
          collectionId="collection-festa"
        />
      </AppProviders>,
    );

    const nameField = await view.findByLabelText('Nome da coleção');
    await fireEvent.changeText(nameField, 'Festa revisada');
    await fireEvent.press(view.getByLabelText('Salvar coleção'));

    expect(
      await view.findByText(
        'A coleção foi alterada por outra pessoa. Saia da edição e reabra a coleção para conferir a versão atual.',
      ),
    ).toBeTruthy();
    expect(view.getByLabelText('Nome da coleção').props.value).toBe(
      'Festa revisada',
    );
    expect(
      view.getByLabelText('Salvar coleção').props.accessibilityState,
    ).toEqual({ disabled: true });
    await fireEvent.press(
      view.getByRole('button', {
        name: 'Descartar edição e revisar versão atual',
      }),
    );
    expect(mockRouter.replace).toHaveBeenCalledWith(
      `/bands/${BAND_ID}/repertoire/collections/collection-festa/edit`,
    );
  });

  it('permite revisar a versão atual quando a exclusão encontra uma revisão nova', async () => {
    const repositories = createRepositories();
    jest
      .spyOn(repositories.repertoireCollections, 'delete')
      .mockRejectedValueOnce(
        new RepertoireCollectionError(
          'stale_revision',
          'A coleção foi alterada por outra pessoa. Saia da edição e reabra a coleção para conferir a versão atual.',
        ),
      );
    const view = await render(
      <AppProviders currentUserId={OWNER_USER_ID} repositories={repositories}>
        <RepertoireCollectionEditorScreen
          bandId={BAND_ID}
          collectionId="collection-festa"
        />
      </AppProviders>,
    );

    await view.findByLabelText('Nome da coleção');
    await fireEvent.press(view.getByLabelText('Excluir coleção'));
    await fireEvent.press(
      view.getByLabelText('Confirmar exclusão definitiva da coleção'),
    );

    expect(
      await within(
        view.getByTestId('collection-delete-confirmation'),
      ).findByText(
        'A coleção foi alterada por outra pessoa. Saia da edição e reabra a coleção para conferir a versão atual.',
      ),
    ).toBeTruthy();
    expect(
      view.getByLabelText('Confirmar exclusão definitiva da coleção').props
        .accessibilityState,
    ).toEqual({ disabled: true });
    await fireEvent.press(
      view.getByRole('button', { name: 'Sair e revisar coleção atual' }),
    );
    expect(mockRouter.replace).toHaveBeenCalledWith(
      `/bands/${BAND_ID}/repertoire/collections/collection-festa/edit`,
    );
  });

  it('preserva o texto após falha e permite tentar novamente', async () => {
    const repositories = createRepositories();
    const saveSpy = jest
      .spyOn(repositories.repertoireCollections, 'save')
      .mockRejectedValueOnce(
        new RepertoireCollectionError(
          'request_failed',
          'Não foi possível atualizar as coleções agora. Tente novamente.',
        ),
      );
    const view = await render(
      <AppProviders currentUserId={OWNER_USER_ID} repositories={repositories}>
        <RepertoireCollectionEditorScreen bandId={BAND_ID} />
      </AppProviders>,
    );

    const nameField = await view.findByLabelText('Nome da coleção');
    await fireEvent.changeText(nameField, 'Festival');
    await fireEvent.press(view.getByLabelText('Salvar coleção'));

    expect(
      await view.findByText(
        'Não foi possível atualizar as coleções agora. Tente novamente.',
      ),
    ).toBeTruthy();
    expect(view.getByLabelText('Nome da coleção').props.value).toBe('Festival');
    expect(mockRouter.replace).not.toHaveBeenCalled();
    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(
      view.getByLabelText('Salvar coleção').props.accessibilityState,
    ).toEqual({ disabled: false });
  });

  it('pede apenas o nome na criação e deixa a inclusão de músicas para o Repertório', async () => {
    const repositories = createRepositories({
      createId: () => 'collection-name-only',
    });
    const view = await render(
      <AppProviders currentUserId={OWNER_USER_ID} repositories={repositories}>
        <RepertoireCollectionEditorScreen bandId={BAND_ID} />
      </AppProviders>,
    );
    const nameField = await view.findByLabelText('Nome da coleção');
    expect(
      view.queryByLabelText('Buscar música por título ou artista'),
    ).toBeNull();
    expect(view.queryAllByRole('checkbox')).toHaveLength(0);
    expect(view.queryByText(/Músicas escolhidas/)).toBeNull();
    await fireEvent.changeText(nameField, 'Festival');
    await fireEvent.press(view.getByLabelText('Salvar coleção'));
    await waitFor(() =>
      expect(mockRouter.replace).toHaveBeenCalledWith(
        `/bands/${BAND_ID}/repertoire/collections/collection-name-only/edit`,
      ),
    );
    const saved =
      await repositories.repertoireCollections.listByBandId(BAND_ID);
    expect(saved.find(({ id }) => id === 'collection-name-only')?.name).toBe(
      'Festival',
    );
    const memberships =
      await repositories.repertoireCollections.listSongsByBandId(BAND_ID);
    expect(
      memberships.filter(
        ({ collectionId }) => collectionId === 'collection-name-only',
      ),
    ).toEqual([]);
  });
});
