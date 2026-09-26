import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { layout } from '@/theme/tokens';

import { demoIds } from '@/data/demo';
import { ShowSetlistEditorScreen } from '@/features/shows/ShowSetlistEditorScreen';
import { AppProviders } from '@/providers/AppProviders';

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: object }) => children,
  useRouter: () => ({ back: jest.fn(), push: jest.fn(), replace: jest.fn() }),
}));

describe('<ShowSetlistEditorScreen />', () => {
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
});
