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
  it('não envia formulário com horário inválido ou sem campos obrigatórios', async () => {
    const onSubmit = jest.fn();
    const view = await render(
      <ShowCreationDialog
        {...baseProps}
        initialValues={{ name: 'Show teste', venue: 'Casa Azul' }}
        onSubmit={onSubmit}
      />,
    );

    await fireEvent.changeText(view.getByLabelText('Hora do show'), '24');
    expect(onSubmit).not.toHaveBeenCalled();
    expect(
      view.getByLabelText('Confirmar criação do show').props.accessibilityState
        ?.disabled,
    ).toBe(true);
  });

  it('exibe o erro e bloqueia o fechamento enquanto salva', async () => {
    const onClose = jest.fn();
    const view = await render(
      <ShowCreationDialog
        {...baseProps}
        errorMessage="Não foi possível criar o show."
        isSubmitting
        onClose={onClose}
      />,
    );

    expect(view.getByText('Não foi possível criar o show.')).toBeTruthy();
    expect(view.getByText('Salvando…')).toBeTruthy();
    await fireEvent.press(view.getByLabelText('Fechar janela de show'));
    await fireEvent.press(view.getByText('Cancelar'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('envia o show quando todos os campos obrigatórios são válidos', async () => {
    const onSubmit = jest.fn();
    const view = await render(
      <ShowCreationDialog
        {...baseProps}
        initialValues={{
          date: '2026-09-25',
          name: 'Show de validação',
          time: '21:30',
          venue: 'Casa Azul',
        }}
        onSubmit={onSubmit}
      />,
    );

    await fireEvent.press(view.getByLabelText('Confirmar criação do show'));

    expect(onSubmit).toHaveBeenCalledWith({
      date: '2026-09-25',
      name: 'Show de validação',
      notes: '',
      time: '21:30',
      venue: 'Casa Azul',
    });
  });
  it('salva a data selecionada no calendário integrado', async () => {
    const onSubmit = jest.fn();
    const selectedDate = new Date();
    selectedDate.setDate(selectedDate.getDate() + 1);
    const dateKey = [
      selectedDate.getFullYear(),
      String(selectedDate.getMonth() + 1).padStart(2, '0'),
      String(selectedDate.getDate()).padStart(2, '0'),
    ].join('-');
    const view = await render(
      <ShowCreationDialog
        {...baseProps}
        initialValues={{ name: 'Show teste', venue: 'Casa Azul' }}
        onSubmit={onSubmit}
      />,
    );

    await fireEvent.press(view.getByLabelText('Selecionar data do show'));
    await fireEvent.press(view.getByTestId('calendar-day-' + dateKey));
    await fireEvent.press(view.getByLabelText('Confirmar criação do show'));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ date: dateKey }),
    );
  });

  it('descarta alterações após confirmação explícita', async () => {
    const onClose = jest.fn();
    const view = await render(
      <ShowCreationDialog {...baseProps} onClose={onClose} />,
    );

    await fireEvent.changeText(
      view.getByLabelText('Nome do show'),
      'Novo nome',
    );
    await fireEvent.press(view.getByText('Cancelar'));
    await fireEvent.press(view.getByLabelText('Descartar alterações'));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(view.queryByText('Descartar alterações?')).toBeNull();
  });
});
