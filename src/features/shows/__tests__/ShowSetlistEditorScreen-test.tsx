import {
  act,
  fireEvent,
  render,
  waitFor,
  within,
} from '@testing-library/react-native';
import NetInfo from '@react-native-community/netinfo';
import { Platform, StyleSheet } from 'react-native';
import { layout } from '@/theme/tokens';
import {
  ShowMutationError,
  renameShowBlock,
  reorderShowBlocks,
  replaceShowBlockItems,
} from '@/data/supabase';

import { demoIds, demoRepositoryData } from '@/data/demo';
import { createInMemoryRepositories } from '@/data/in-memory';
import type { AppRepositories, EntityId } from '@/domain';
import { ShowSetlistEditorScreen } from '@/features/shows/ShowSetlistEditorScreen';
import { AppProviders } from '@/providers/AppProviders';

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
  collectionId = 'collection-demo-festa',
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
    const view = await render(
      <AppProviders>
        <ShowSetlistEditorScreen
          bandId={demoIds.primaryBand}
          showId="show-demo-clube"
        />
      </AppProviders>,
    );

    expect(await view.findByTestId('show-block-editor-dialog')).toBeTruthy();
    expect(
      StyleSheet.flatten(
        view.getByTestId('show-block-editor-dialog').props.style,
      ).maxWidth,
    ).toBe(layout.contentMaxWidth);
    expect(view.getByLabelText('Nome do bloco 1')).toBeTruthy();

    expect(view.getByLabelText('Adicionar à setlist')).toBeTruthy();
    await fireEvent.press(view.getByLabelText('Adicionar à setlist'));
    expect(view.getByTestId('show-add-collection-action')).toBeTruthy();
    await fireEvent.press(view.getByTestId('show-add-collection-action'));
    expect(view.getByTestId('show-collection-picker-sheet')).toBeTruthy();
    expect(
      view.getByTestId(
        `show-preview-collection-${demoRepositoryData.repertoireCollections[1].id}`,
      ),
    ).toBeTruthy();
    await fireEvent.press(
      view.getByTestId(
        `show-preview-collection-${demoRepositoryData.repertoireCollections[1].id}`,
      ),
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
      `show-collection-preview-song-${demoIds.stageSong}`,
      'show-collection-preview-song-song-demo-mare-neon',
    ]);
    expect(
      view.getByTestId('show-collection-preview-repeat-' + demoIds.stageSong),
    ).toBeTruthy();
    expect(
      view.getByTestId('show-confirm-add-collection').props.accessibilityState
        ?.disabled,
    ).toBe(false);
  });

  it('mantém as opções habituais quando a banda não tem coleções', async () => {
    const repositories = createInMemoryRepositories({
      ...demoRepositoryData,
      repertoireCollections: [],
      repertoireCollectionSongs: [],
    });
    const view = await render(
      <AppProviders repositories={repositories}>
        <ShowSetlistEditorScreen
          bandId={demoIds.primaryBand}
          showId="show-demo-clube"
        />
      </AppProviders>,
    );

    await view.findByTestId('show-block-editor-dialog');
    await fireEvent.press(view.getByLabelText('Adicionar à setlist'));

    expect(view.getByTestId('show-add-songs-action')).toBeTruthy();
    expect(view.getByLabelText('Adicionar anotação')).toBeTruthy();
    expect(view.queryByTestId('show-add-collection-action')).toBeNull();
  });

  it('mantém músicas arquivadas já no show, mas não oferece novas inclusões', async () => {
    const repositories = createInMemoryRepositories({
      ...demoRepositoryData,
      songs: demoRepositoryData.songs.map((song) =>
        song.id === demoIds.stageSong
          ? { ...song, archivedAt: '2026-09-09T12:00:00.000Z' }
          : song,
      ),
    });
    const view = await render(
      <AppProviders repositories={repositories}>
        <ShowSetlistEditorScreen
          bandId={demoIds.primaryBand}
          showId="show-demo-clube"
        />
      </AppProviders>,
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
      ...demoRepositoryData,
      songs: demoRepositoryData.songs.map((song) =>
        song.id === demoIds.stageSong
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
      <AppProviders repositories={repositories}>
        <ShowSetlistEditorScreen
          bandId={demoIds.primaryBand}
          showId="show-demo-clube"
        />
      </AppProviders>,
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
      demoIds.primaryBand,
      'collection-demo-festa',
    );
    expect(collection).not.toBeNull();
    const reorderedCollection = await repositories.repertoireCollections.save({
      bandId: demoIds.primaryBand,
      collectionId: 'collection-demo-festa',
      expectedUpdatedAt: collection!.updatedAt,
      name: collection!.name,
      orderedSongIds: ['song-demo-mare-neon', demoIds.stageSong],
    });
    await repositories.repertoireCollections.delete({
      bandId: demoIds.primaryBand,
      collectionId: 'collection-demo-festa',
      expectedUpdatedAt: reorderedCollection.updatedAt,
    });
    expect(
      await repositories.repertoireCollections.findById(
        demoIds.primaryBand,
        'collection-demo-festa',
      ),
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
            expect.objectContaining({ songId: demoIds.stageSong }),
            expect.objectContaining({ songId: 'song-demo-mare-neon' }),
          ]),
        }),
      );
    });
  });

  it('oferece o descarte padrão após adicionar uma coleção ao rascunho', async () => {
    const view = await render(
      <AppProviders>
        <ShowSetlistEditorScreen
          bandId={demoIds.primaryBand}
          showId="show-demo-clube"
        />
      </AppProviders>,
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
      ...demoRepositoryData,
      repertoireCollections: [
        demoRepositoryData.repertoireCollections.find(
          ({ id }) => id === 'collection-demo-festa',
        )!,
      ],
      repertoireCollectionSongs: [],
    });
    const view = await render(
      <AppProviders repositories={repositories}>
        <ShowSetlistEditorScreen
          bandId={demoIds.primaryBand}
          showId="show-demo-clube"
        />
      </AppProviders>,
    );

    await view.findByTestId('show-block-editor-dialog');
    await fireEvent.press(view.getByLabelText('Adicionar à setlist'));
    await fireEvent.press(view.getByTestId('show-add-collection-action'));
    await fireEvent.press(
      view.getByTestId('show-preview-collection-collection-demo-festa'),
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
      demoRepositoryData.repertoireCollectionSongs
        .filter(({ collectionId }) => collectionId === 'collection-demo-festa')
        .map(({ songId }) => songId),
    );
    const repositories = createInMemoryRepositories({
      ...demoRepositoryData,
      repertoireCollections: [
        demoRepositoryData.repertoireCollections.find(
          ({ id }) => id === 'collection-demo-festa',
        )!,
      ],
      repertoireCollectionSongs:
        demoRepositoryData.repertoireCollectionSongs.filter(
          ({ collectionId }) => collectionId === 'collection-demo-festa',
        ),
      songs: demoRepositoryData.songs.map((song) =>
        collectionSongIds.has(song.id)
          ? { ...song, archivedAt: '2026-09-09T12:00:00.000Z' }
          : song,
      ),
    });
    const view = await render(
      <AppProviders repositories={repositories}>
        <ShowSetlistEditorScreen
          bandId={demoIds.primaryBand}
          showId="show-demo-clube"
        />
      </AppProviders>,
    );

    await view.findByTestId('show-block-editor-dialog');
    await fireEvent.press(view.getByLabelText('Adicionar à setlist'));
    await fireEvent.press(view.getByTestId('show-add-collection-action'));
    await fireEvent.press(
      view.getByTestId('show-preview-collection-collection-demo-festa'),
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
    const hiddenSongId = 'song-demo-mare-neon';
    const repositories = createInMemoryRepositories({
      ...demoRepositoryData,
      repertoireCollections: [
        demoRepositoryData.repertoireCollections.find(
          ({ id }) => id === 'collection-demo-festa',
        )!,
      ],
      repertoireCollectionSongs:
        demoRepositoryData.repertoireCollectionSongs.filter(
          ({ collectionId }) => collectionId === 'collection-demo-festa',
        ),
      songs: demoRepositoryData.songs.filter(({ id }) => id !== hiddenSongId),
    });
    const view = await render(
      <AppProviders repositories={repositories}>
        <ShowSetlistEditorScreen
          bandId={demoIds.primaryBand}
          showId="show-demo-clube"
        />
      </AppProviders>,
    );

    await view.findByTestId('show-block-editor-dialog');
    await fireEvent.press(view.getByLabelText('Adicionar à setlist'));
    await fireEvent.press(view.getByTestId('show-add-collection-action'));
    await fireEvent.press(
      view.getByTestId('show-preview-collection-collection-demo-festa'),
    );

    const preview = view.getByTestId('show-collection-preview-sheet');
    expect(within(preview).getByText('1 música elegível')).toBeTruthy();
    expect(within(preview).queryByText('Maré de Neon')).toBeNull();
  });

  it('atualiza a prévia e não inclui parcialmente se a coleção mudou', async () => {
    const repositories = createInMemoryRepositories(demoRepositoryData);
    const view = await render(
      <AppProviders repositories={repositories}>
        <ShowSetlistEditorScreen
          bandId={demoIds.primaryBand}
          showId="show-demo-clube"
        />
      </AppProviders>,
    );

    await view.findByTestId('show-block-editor-dialog');
    await openCollectionPreview(view);
    await repositories.repertoireCollections.appendSongs({
      bandId: demoIds.primaryBand,
      collectionId: 'collection-demo-festa',
      songIds: ['song-demo-chuva'],
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
      <AppProviders>
        <ShowSetlistEditorScreen
          bandId={demoIds.primaryBand}
          showId="show-demo-clube"
        />
      </AppProviders>,
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
    const inMemoryRepositories = createInMemoryRepositories(demoRepositoryData);
    let accessRevoked = false;
    const repositories: AppRepositories = {
      ...inMemoryRepositories,
      bands: {
        findById: (bandId) => inMemoryRepositories.bands.findById(bandId),
        listMembers: (bandId) => inMemoryRepositories.bands.listMembers(bandId),
        listForUser: async (userId: EntityId) => {
          const userBands =
            await inMemoryRepositories.bands.listForUser(userId);
          if (!accessRevoked) return userBands;
          return userBands.map((userBand) =>
            userBand.band.id === demoIds.primaryBand
              ? {
                  ...userBand,
                  membership: { ...userBand.membership, role: 'member' },
                }
              : userBand,
          );
        },
      },
    };
    const view = await render(
      <AppProviders repositories={repositories}>
        <ShowSetlistEditorScreen
          bandId={demoIds.primaryBand}
          showId="show-demo-clube"
        />
      </AppProviders>,
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
      ...demoRepositoryData,
      shows: demoRepositoryData.shows.map((show) =>
        show.id === 'show-demo-clube'
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
                      songId: 'song-demo-pontes',
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
                      songId: demoIds.stageSong,
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
      <AppProviders repositories={repositories}>
        <ShowSetlistEditorScreen
          bandId={demoIds.primaryBand}
          showId="show-demo-clube"
        />
      </AppProviders>,
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
      <AppProviders>
        <ShowSetlistEditorScreen
          bandId={demoIds.primaryBand}
          showId={demoIds.readyShow}
        />
      </AppProviders>,
    );
    expect(
      await view.findByText(
        'Este show só pode ser editado enquanto estiver em Rascunho',
      ),
    ).toBeTruthy();
    expect(view.queryByTestId('show-block-editor-dialog')).toBeNull();
  });

  it('mostra indisponibilidade quando o usuário não tem permissão de edição', async () => {
    const view = await render(
      <AppProviders>
        <ShowSetlistEditorScreen
          bandId={demoIds.secondaryBand}
          showId="show-demo-aurora-dezembro"
        />
      </AppProviders>,
    );

    expect(
      await view.findByText('Você não pode editar esta setlist'),
    ).toBeTruthy();
    expect(view.queryByTestId('show-block-editor-dialog')).toBeNull();
  });

  it('não oferece inclusão de coleção para integrante sem papel de edição', async () => {
    const view = await render(
      <AppProviders currentUserId="user-demo-carla">
        <ShowSetlistEditorScreen
          bandId={demoIds.primaryBand}
          showId="show-demo-clube"
        />
      </AppProviders>,
    );

    expect(
      await view.findByText('Você não pode editar esta setlist'),
    ).toBeTruthy();
    expect(view.queryByTestId('show-block-editor-dialog')).toBeNull();
    expect(view.queryByTestId('show-add-collection-action')).toBeNull();
  });
  it('salva setlist sem mudanças de bloco e sincroniza seus itens', async () => {
    const view = await render(
      <AppProviders>
        <ShowSetlistEditorScreen
          bandId={demoIds.primaryBand}
          showId="show-demo-clube"
        />
      </AppProviders>,
    );

    await view.findByTestId('show-block-editor-dialog');
    await fireEvent.press(view.getByLabelText('Salvar setlist'));

    await waitFor(() => {
      expect(reorderShowBlocks).toHaveBeenCalledWith(
        expect.objectContaining({ showId: 'show-demo-clube' }),
      );
      expect(replaceShowBlockItems).toHaveBeenCalled();
    });
  });

  it('persiste renomeação de bloco durante o salvamento da setlist', async () => {
    const view = await render(
      <AppProviders>
        <ShowSetlistEditorScreen
          bandId={demoIds.primaryBand}
          showId="show-demo-clube"
        />
      </AppProviders>,
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
      <AppProviders>
        <ShowSetlistEditorScreen
          bandId={demoIds.primaryBand}
          showId="show-demo-clube"
        />
      </AppProviders>,
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
      <AppProviders>
        <ShowSetlistEditorScreen
          bandId={demoIds.primaryBand}
          showId="show-demo-clube"
        />
      </AppProviders>,
    );

    await view.findByTestId('show-block-editor-dialog');
    await fireEvent.press(view.getByLabelText('Salvar setlist'));

    await waitFor(() => {
      expect(view.getByText('Acesso negado.')).toBeTruthy();
    });
  });
});
