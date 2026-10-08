import {
  fireEvent,
  render,
  waitFor,
  within,
} from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { layout } from '@/theme/tokens';
import {
  ShowMutationError,
  renameShowBlock,
  reorderShowBlocks,
  replaceShowBlockItems,
} from '@/data/supabase';

import { demoIds, demoRepositoryData } from '@/data/demo';
import { createInMemoryRepositories } from '@/data/in-memory';
import { ShowSetlistEditorScreen } from '@/features/shows/ShowSetlistEditorScreen';
import { AppProviders } from '@/providers/AppProviders';

jest.mock('@/data/supabase', () => ({
  ...jest.requireActual('@/data/supabase'),
  renameShowBlock: jest.fn().mockResolvedValue(undefined),
  reorderShowBlocks: jest.fn().mockResolvedValue(undefined),
  replaceShowBlockItems: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: object }) => children,
  useFocusEffect: jest.fn(),
  useRouter: () => ({ back: jest.fn(), push: jest.fn(), replace: jest.fn() }),
  useNavigation: () => ({ addListener: () => jest.fn(), dispatch: jest.fn() }),
}));

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
