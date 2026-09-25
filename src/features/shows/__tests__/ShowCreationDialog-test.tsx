import { fireEvent, render } from '@testing-library/react-native';

import { ShowCreationDialog } from '@/features/shows/ShowCreationDialog';

describe('<ShowCreationDialog />', () => {
  const baseProps = {
    errorMessage: null,
    isSubmitting: false,
    onClose: jest.fn(),
    onSubmit: jest.fn(),
    visible: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fecha sem confirmação quando não há alterações', async () => {
    const view = await render(<ShowCreationDialog {...baseProps} />);

    await fireEvent.press(view.getByText('Cancelar'));

    expect(baseProps.onClose).toHaveBeenCalledTimes(1);
    expect(view.queryByText('Descartar alterações?')).toBeNull();
  });

  it('pede confirmação antes de descartar alterações', async () => {
    const view = await render(<ShowCreationDialog {...baseProps} />);

    await fireEvent.changeText(
      view.getByLabelText('Nome do show'),
      'Show novo',
    );
    await fireEvent.press(view.getByText('Cancelar'));

    expect(baseProps.onClose).not.toHaveBeenCalled();
    expect(view.getByText('Descartar alterações?')).toBeTruthy();

    await fireEvent.press(view.getByLabelText('Descartar alterações'));

    expect(baseProps.onClose).toHaveBeenCalledTimes(1);
  });
});
