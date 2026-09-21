import { fireEvent, render } from '@testing-library/react-native';

import { AccountDeletionDialog } from '@/features/account/AccountDeletionDialog';

describe('<AccountDeletionDialog />', () => {
  it('não renderiza enquanto estiver fechado', async () => {
    const view = await render(
      <AccountDeletionDialog
        errorMessage={null}
        isSubmitting={false}
        onClose={jest.fn()}
        onConfirm={jest.fn()}
        visible={false}
      />,
    );

    expect(view.queryByTestId('account-deletion-dialog')).toBeNull();
  });

  it('exige confirmação reforçada antes de excluir', async () => {
    const onConfirm = jest.fn();
    const view = await render(
      <AccountDeletionDialog
        errorMessage={null}
        isSubmitting={false}
        onClose={jest.fn()}
        onConfirm={onConfirm}
        visible
      />,
    );

    const confirm = view.getByLabelText('Confirmar exclusão da conta');
    expect(confirm.props.accessibilityState?.disabled).toBe(true);

    await fireEvent.changeText(
      view.getByLabelText('Confirmação da exclusão da conta'),
      'excluir',
    );
    expect(confirm.props.accessibilityState?.disabled).toBe(false);
    await fireEvent.press(confirm);

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('apresenta o erro retornado pelo servidor', async () => {
    const view = await render(
      <AccountDeletionDialog
        errorMessage="Promova outro Proprietário antes de excluir sua conta."
        isSubmitting={false}
        onClose={jest.fn()}
        onConfirm={jest.fn()}
        visible
      />,
    );

    expect(
      view.getByText('Promova outro Proprietário antes de excluir sua conta.'),
    ).toBeTruthy();
  });
});
