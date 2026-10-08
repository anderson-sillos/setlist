import { fireEvent, render, waitFor } from '@testing-library/react-native';
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
        `show-add-collection-${demoRepositoryData.repertoireCollections[1].id}`,
      ),
    ).toBeTruthy();
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
