import { fireEvent, render } from '@testing-library/react-native';

import { demoRepositoryData } from '@/data/demo';
import { ShowBlockEditorDialog } from '@/features/shows/ShowBlockEditorDialog';

describe('<ShowBlockEditorDialog />', () => {
  it('pede confirmação antes de sair com a setlist alterada', async () => {
    const onClose = jest.fn();
    const view = await render(
      <ShowBlockEditorDialog
        errorMessage={null}
        initialBlocks={[{ id: 'block-1', items: [], name: 'Principal' }]}
        isSubmitting={false}
        onClose={onClose}
        onSubmit={jest.fn()}
        songs={[]}
        visible
      />,
    );

    await fireEvent.changeText(
      view.getByLabelText('Nome do bloco 1'),
      'Abertura',
    );
    await fireEvent.press(view.getByText('Cancelar'));

    expect(onClose).not.toHaveBeenCalled();
    expect(view.getByTestId('show-block-editor-discard-sheet')).toBeTruthy();

    await fireEvent.press(view.getByText('Continuar editando'));

    expect(onClose).not.toHaveBeenCalled();
  });
  it('permite excluir um bloco, mas preserva o último bloco', async () => {
    const view = await render(
      <ShowBlockEditorDialog
        errorMessage={null}
        initialBlocks={[
          { id: 'block-1', items: [], name: 'Principal' },
          { id: 'block-2', items: [], name: 'Bis' },
        ]}
        isSubmitting={false}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        songs={[]}
        visible
      />,
    );

    await fireEvent.press(view.getByLabelText('Excluir bloco Bis'));
    expect(
      view.getByTestId('show-block-editor-delete-block-sheet'),
    ).toBeTruthy();
    await fireEvent.press(view.getByLabelText('Confirmar exclusão do bloco'));

    expect(view.queryByLabelText('Nome do bloco 2')).toBeNull();
    expect(view.getByLabelText('Nome do bloco 1')).toHaveDisplayValue(
      'Principal',
    );
  });

  it('exibe a exclusão à esquerda e o arraste no próprio item', async () => {
    const song = demoRepositoryData.songs[0];
    const view = await render(
      <ShowBlockEditorDialog
        errorMessage={null}
        initialBlocks={[
          {
            id: 'block-1',
            items: [
              {
                id: 'item-1',
                notes: null,
                songId: song.id,
                type: 'song',
              },
            ],
            name: 'Principal',
          },
        ]}
        isSubmitting={false}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        songs={[song]}
        visible
      />,
    );

    expect(view.getByLabelText('Remover música 1')).toBeTruthy();
    expect(view.getByLabelText('Arrastar música 1')).toBeTruthy();
    expect(view.queryByText('Reordenar item')).toBeNull();
  });
});
