import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { layout } from '@/theme/tokens';
import {
  ShowMutationError,
  renameShowBlock,
  reorderShowBlocks,
  replaceShowBlockItems,
} from '@/data/supabase';

import { demoIds } from '@/data/demo';
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
  useRouter: () => ({ back: jest.fn(), push: jest.fn(), replace: jest.fn() }),
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
