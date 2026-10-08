import {
  act,
  fireEvent,
  render,
  waitFor,
  within,
} from '@testing-library/react-native';
import { Platform } from 'react-native';
import { demoIds, demoRepositoryData } from '@/data/demo';
import { createInMemoryRepositories } from '@/data/in-memory';
import { RepertoireCollectionError } from '@/domain';
import { RepertoireCollectionEditorScreen } from '@/features/repertoire/RepertoireCollectionEditorScreen';
import { AppProviders } from '@/providers/AppProviders';

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
        <AppProviders>
          <RepertoireCollectionEditorScreen
            bandId={demoIds.primaryBand}
            collectionId="collection-demo-festa"
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
    const repositories = createInMemoryRepositories(demoRepositoryData);
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
      <AppProviders repositories={repositories}>
        <RepertoireCollectionEditorScreen
          bandId={demoIds.primaryBand}
          collectionId="collection-demo-festa"
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
    await waitFor(() =>
      expect(mockRouter.replace).toHaveBeenCalledWith(
        `/bands/${demoIds.primaryBand}/repertoire/collections/collection-demo-festa`,
      ),
    );
    expect(view.queryByText('Descartar alterações?')).toBeNull();
  });

  it('inicia uma coleção com as músicas escolhidas e protege o descarte', async () => {
    const songId = demoRepositoryData.songs.find(
      ({ title }) => title === 'Luzes da Cidade',
    )?.id;
    if (!songId) throw new Error('Música de demonstração não encontrada');

    const view = await render(
      <AppProviders>
        <RepertoireCollectionEditorScreen
          bandId={demoIds.primaryBand}
          initialSongIds={[songId, 'song-inexistente', songId]}
          returnToRepertoire
        />
      </AppProviders>,
    );

    expect(await view.findByText('Músicas escolhidas (1)')).toBeTruthy();
    expect(view.getAllByText('Luzes da Cidade').length).toBeGreaterThan(0);
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
    const songId = demoRepositoryData.songs.find(
      ({ title }) => title === 'Luzes da Cidade',
    )?.id;
    if (!songId) throw new Error('Música de demonstração não encontrada');

    const repositories = createInMemoryRepositories(demoRepositoryData, {
      createId: () => 'collection-from-repertoire',
    });
    const view = await render(
      <AppProviders repositories={repositories}>
        <RepertoireCollectionEditorScreen
          bandId={demoIds.primaryBand}
          initialSongIds={[songId, 'song-inexistente', songId]}
          returnToRepertoire
        />
      </AppProviders>,
    );

    await view.findByText('Músicas escolhidas (1)');
    await fireEvent.changeText(
      view.getByLabelText('Nome da coleção'),
      'Festa via repertório',
    );
    await fireEvent.press(view.getByLabelText('Salvar coleção'));

    await waitFor(() =>
      expect(mockRouter.replace).toHaveBeenCalledWith(
        `/bands/${demoIds.primaryBand}/repertoire/collections/collection-from-repertoire`,
      ),
    );
    const savedCollection = (
      await repositories.repertoireCollections.listByBandId(demoIds.primaryBand)
    ).find(({ name }) => name === 'Festa via repertório');
    expect(savedCollection).toBeTruthy();
    expect(
      (
        await repositories.repertoireCollections.listSongsByBandId(
          demoIds.primaryBand,
        )
      )
        .filter(({ collectionId }) => collectionId === savedCollection?.id)
        .map(({ songId: includedSongId }) => includedSongId),
    ).toEqual([songId]);
  });

  it('valida nome vazio, limite de 120 caracteres e duplicidade', async () => {
    const view = await render(
      <AppProviders>
        <RepertoireCollectionEditorScreen bandId={demoIds.primaryBand} />
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
    const repositories = createInMemoryRepositories(demoRepositoryData, {
      createId: () => 'collection-demo-new',
    });
    const saveSpy = jest.spyOn(repositories.repertoireCollections, 'save');
    const view = await render(
      <AppProviders repositories={repositories}>
        <RepertoireCollectionEditorScreen bandId={demoIds.primaryBand} />
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
        bandId: demoIds.primaryBand,
        name: 'Ensaios',
        orderedSongIds: [],
      });
      expect(mockRouter.replace).toHaveBeenCalledWith(
        `/bands/${demoIds.primaryBand}/repertoire/collections/collection-demo-new`,
      );
    });
  });

  it('renomeia mantendo as músicas e a revisão existente', async () => {
    const repositories = createInMemoryRepositories(demoRepositoryData, {
      createId: () => 'collection-demo-new',
    });
    const saveSpy = jest.spyOn(repositories.repertoireCollections, 'save');
    const view = await render(
      <AppProviders repositories={repositories}>
        <RepertoireCollectionEditorScreen
          bandId={demoIds.primaryBand}
          collectionId="collection-demo-festa"
        />
      </AppProviders>,
    );

    const nameField = await view.findByLabelText('Nome da coleção');
    await fireEvent.changeText(nameField, 'Festa de rua');
    await fireEvent.press(view.getByLabelText('Salvar coleção'));

    await waitFor(() => {
      expect(saveSpy).toHaveBeenCalledWith({
        bandId: demoIds.primaryBand,
        collectionId: 'collection-demo-festa',
        expectedUpdatedAt: '2026-09-08T12:05:00.000Z',
        name: 'Festa de rua',
        orderedSongIds: ['song-demo-luzes', 'song-demo-mare-neon'],
      });
      expect(mockRouter.replace).toHaveBeenCalledWith(
        `/bands/${demoIds.primaryBand}/repertoire/collections/collection-demo-festa`,
      );
    });
  });

  it('reordena e remove participações sem excluir músicas do repertório', async () => {
    const repositories = createInMemoryRepositories(demoRepositoryData);
    const saveSpy = jest.spyOn(repositories.repertoireCollections, 'save');
    const view = await render(
      <AppProviders repositories={repositories}>
        <RepertoireCollectionEditorScreen
          bandId={demoIds.primaryBand}
          collectionId="collection-demo-festa"
        />
      </AppProviders>,
    );

    await view.findByLabelText('Nome da coleção');
    await fireEvent.press(
      view.getByLabelText('Mover Luzes da Cidade para baixo'),
    );
    await fireEvent.press(
      view.getByLabelText('Remover Luzes da Cidade da coleção'),
    );
    await fireEvent.press(view.getByLabelText('Salvar coleção'));

    await waitFor(() => {
      expect(saveSpy).toHaveBeenCalledWith({
        bandId: demoIds.primaryBand,
        collectionId: 'collection-demo-festa',
        expectedUpdatedAt: '2026-09-08T12:05:00.000Z',
        name: 'Festa',
        orderedSongIds: ['song-demo-mare-neon'],
      });
    });
    await expect(
      repositories.songs.listByBandId(demoIds.primaryBand),
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'song-demo-luzes' }),
        expect.objectContaining({ id: 'song-demo-mare-neon' }),
      ]),
    );
  });

  it('só exclui a coleção após confirmação e mantém as músicas', async () => {
    const repositories = createInMemoryRepositories(demoRepositoryData);
    const deleteSpy = jest.spyOn(repositories.repertoireCollections, 'delete');
    const view = await render(
      <AppProviders repositories={repositories}>
        <RepertoireCollectionEditorScreen
          bandId={demoIds.primaryBand}
          collectionId="collection-demo-festa"
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
        bandId: demoIds.primaryBand,
        collectionId: 'collection-demo-festa',
        expectedUpdatedAt: '2026-09-08T12:05:00.000Z',
      });
      expect(mockRouter.replace).toHaveBeenCalledWith(
        `/bands/${demoIds.primaryBand}/repertoire/collections`,
      );
    });
    await expect(
      repositories.songs.listByBandId(demoIds.primaryBand),
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'song-demo-luzes' }),
        expect.objectContaining({ id: 'song-demo-mare-neon' }),
      ]),
    );
  });

  it('preserva a edição e oferece revisar os dados após conflito de revisão', async () => {
    const repositories = createInMemoryRepositories(demoRepositoryData);
    jest
      .spyOn(repositories.repertoireCollections, 'save')
      .mockRejectedValueOnce(
        new RepertoireCollectionError(
          'stale_revision',
          'A coleção foi alterada por outra pessoa. Saia da edição e reabra a coleção para conferir a versão atual.',
        ),
      );
    const view = await render(
      <AppProviders repositories={repositories}>
        <RepertoireCollectionEditorScreen
          bandId={demoIds.primaryBand}
          collectionId="collection-demo-festa"
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
      `/bands/${demoIds.primaryBand}/repertoire/collections/collection-demo-festa`,
    );
  });

  it('permite revisar a versão atual quando a exclusão encontra uma revisão nova', async () => {
    const repositories = createInMemoryRepositories(demoRepositoryData);
    jest
      .spyOn(repositories.repertoireCollections, 'delete')
      .mockRejectedValueOnce(
        new RepertoireCollectionError(
          'stale_revision',
          'A coleção foi alterada por outra pessoa. Saia da edição e reabra a coleção para conferir a versão atual.',
        ),
      );
    const view = await render(
      <AppProviders repositories={repositories}>
        <RepertoireCollectionEditorScreen
          bandId={demoIds.primaryBand}
          collectionId="collection-demo-festa"
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
      `/bands/${demoIds.primaryBand}/repertoire/collections/collection-demo-festa`,
    );
  });

  it('preserva o texto após falha e permite tentar novamente', async () => {
    const repositories = createInMemoryRepositories(demoRepositoryData);
    const saveSpy = jest
      .spyOn(repositories.repertoireCollections, 'save')
      .mockRejectedValueOnce(
        new RepertoireCollectionError(
          'request_failed',
          'Não foi possível atualizar as coleções agora. Tente novamente.',
        ),
      );
    const view = await render(
      <AppProviders repositories={repositories}>
        <RepertoireCollectionEditorScreen bandId={demoIds.primaryBand} />
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

  it('mantém escolhas entre buscas e filtros e seleciona apenas resultados visíveis', async () => {
    const repositories = createInMemoryRepositories(demoRepositoryData, {
      createId: () => 'collection-demo-active-and-archived',
    });
    const view = await render(
      <AppProviders repositories={repositories}>
        <RepertoireCollectionEditorScreen bandId={demoIds.primaryBand} />
      </AppProviders>,
    );

    await view.findByLabelText('Selecionar Luzes da Cidade');
    await fireEvent.press(view.getByLabelText('Selecionar Luzes da Cidade'));
    await fireEvent.changeText(
      view.getByLabelText('Buscar música por título ou artista'),
      'pontes',
    );
    expect(await view.findByText('Entre Pontes')).toBeTruthy();
    await fireEvent.press(
      view.getByRole('button', { name: 'Selecionar resultados (1)' }),
    );

    expect(
      view.getByLabelText('Remover Luzes da Cidade da coleção'),
    ).toBeTruthy();
    expect(view.getByLabelText('Remover Entre Pontes da coleção')).toBeTruthy();
    expect(view.queryByLabelText('Remover Maré de Neon da coleção')).toBeNull();

    await fireEvent.changeText(
      view.getByLabelText('Buscar música por título ou artista'),
      'coletivo atlântico',
    );
    expect(await view.findByText('Maré de Neon')).toBeTruthy();
    expect(view.getByText('2 escolhidas')).toBeTruthy();

    await fireEvent.changeText(
      view.getByLabelText('Buscar música por título ou artista'),
      '',
    );
    await fireEvent.press(
      view.getByLabelText('Alterar filtros da seleção de músicas'),
    );
    await fireEvent.press(view.getByText('Arquivadas'));
    expect(await view.findByText('Rota Antiga')).toBeTruthy();
    expect(view.getByText('2 escolhidas')).toBeTruthy();
    await fireEvent.press(
      view.getByRole('button', { name: 'Selecionar resultados (1)' }),
    );
    expect(view.getByLabelText('Remover Rota Antiga da coleção')).toBeTruthy();

    await fireEvent.press(
      view.getByLabelText('Alterar filtros da seleção de músicas'),
    );
    await fireEvent.press(view.getByText('Todas'));
    await fireEvent.press(view.getByLabelText('Alterar ordenação das músicas'));
    await fireEvent.press(view.getByText('Maior duração'));
    expect(view.getAllByRole('checkbox')[0]?.props.accessibilityLabel).toBe(
      'Selecionar Maré de Neon',
    );
    expect(view.getByText('3 escolhidas')).toBeTruthy();

    await fireEvent.changeText(
      view.getByLabelText('Nome da coleção'),
      'Ativas e arquivadas',
    );
    await fireEvent.press(view.getByLabelText('Salvar coleção'));
    await waitFor(() =>
      expect(mockRouter.replace).toHaveBeenCalledWith(
        `/bands/${demoIds.primaryBand}/repertoire/collections/collection-demo-active-and-archived`,
      ),
    );

    const savedCollection = (
      await repositories.repertoireCollections.listByBandId(demoIds.primaryBand)
    ).find(({ name }) => name === 'Ativas e arquivadas');
    expect(savedCollection).toBeTruthy();
    const savedMemberships = (
      await repositories.repertoireCollections.listSongsByBandId(
        demoIds.primaryBand,
      )
    )
      .filter(({ collectionId }) => collectionId === savedCollection?.id)
      .sort((left, right) => left.position - right.position);
    expect(savedMemberships.map(({ songId }) => songId)).toEqual([
      'song-demo-luzes',
      'song-demo-pontes',
      'song-demo-rota-antiga',
    ]);
    const savedSongs = await repositories.songs.listByBandId(
      demoIds.primaryBand,
      { includeArchived: true },
    );
    expect(
      savedSongs.find(({ id }) => id === 'song-demo-rota-antiga')?.archivedAt,
    ).not.toBeNull();
  });
});
