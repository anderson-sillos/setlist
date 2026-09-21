import { fireEvent, render } from '@testing-library/react-native';

import { BandLeaveDialog } from '@/features/bands/BandLeaveDialog';

describe('<BandLeaveDialog />', () => {
  it('não renderiza enquanto estiver fechado', async () => {
    const view = await render(
      <BandLeaveDialog
        bandName="Banda Horizonte"
        errorMessage={null}
        isSubmitting={false}
        onClose={jest.fn()}
        onConfirm={jest.fn()}
        visible={false}
      />,
    );

    expect(view.queryByTestId('band-leave-dialog')).toBeNull();
  });

  it('exige confirmação para sair da banda', async () => {
    const onConfirm = jest.fn();
    const view = await render(
      <BandLeaveDialog
        bandName="Banda Horizonte"
        errorMessage={null}
        isSubmitting={false}
        onClose={jest.fn()}
        onConfirm={onConfirm}
        visible
      />,
    );

    expect(view.getByText(/Sair de/)).toBeTruthy();
    await fireEvent.press(view.getByLabelText('Confirmar saída da banda'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('apresenta a falha do servidor', async () => {
    const view = await render(
      <BandLeaveDialog
        bandName="Banda Horizonte"
        errorMessage="Promova outro Proprietário antes de sair."
        isSubmitting={false}
        onClose={jest.fn()}
        onConfirm={jest.fn()}
        visible
      />,
    );

    expect(
      view.getByText('Promova outro Proprietário antes de sair.'),
    ).toBeTruthy();
  });
});
