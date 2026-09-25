import { fireEvent, render } from '@testing-library/react-native';

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
});
