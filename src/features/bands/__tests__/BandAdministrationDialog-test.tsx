import { fireEvent, render } from '@testing-library/react-native';

import { BandAdministrationDialog } from '@/features/bands/BandAdministrationDialog';

const band = {
  createdAt: '2026-09-20T10:00:00.000Z',
  id: 'band-1',
  name: 'Banda Horizonte',
  updatedAt: '2026-09-20T10:00:00.000Z',
};

describe('<BandAdministrationDialog />', () => {
  it('não renderiza sem banda ou modo selecionado', async () => {
    const view = await render(
      <BandAdministrationDialog
        band={null}
        errorMessage={null}
        isSubmitting={false}
        mode={null}
        onClose={jest.fn()}
        onDelete={jest.fn()}
        onModeChange={jest.fn()}
        onRename={jest.fn()}
      />,
    );

    expect(view.queryByTestId('band-administration-dialog')).toBeNull();
  });

  it('oferece as ações de edição e exclusão no menu do Owner', async () => {
    const onModeChange = jest.fn();
    const view = await render(
      <BandAdministrationDialog
        band={band}
        errorMessage={null}
        isSubmitting={false}
        mode="menu"
        onClose={jest.fn()}
        onDelete={jest.fn()}
        onModeChange={onModeChange}
        onRename={jest.fn()}
      />,
    );

    await fireEvent.press(view.getByLabelText('Editar nome da banda'));
    await fireEvent.press(view.getByLabelText('Excluir banda'));

    expect(onModeChange).toHaveBeenNthCalledWith(1, 'rename');
    expect(onModeChange).toHaveBeenNthCalledWith(2, 'delete');
  });

  it('permite editar o nome da banda', async () => {
    const onRename = jest.fn();
    const view = await render(
      <BandAdministrationDialog
        band={band}
        errorMessage={null}
        isSubmitting={false}
        mode="rename"
        onClose={jest.fn()}
        onDelete={jest.fn()}
        onModeChange={jest.fn()}
        onRename={onRename}
      />,
    );

    await fireEvent.changeText(
      view.getByLabelText('Novo nome da banda'),
      'Banda Aurora',
    );
    await fireEvent.press(view.getByLabelText('Confirmar novo nome da banda'));

    expect(onRename).toHaveBeenCalledWith('Banda Aurora');
  });

  it('exige digitar o nome para confirmar uma exclusão', async () => {
    const onDelete = jest.fn();
    const view = await render(
      <BandAdministrationDialog
        band={band}
        errorMessage={null}
        isSubmitting={false}
        mode="delete"
        onClose={jest.fn()}
        onDelete={onDelete}
        onModeChange={jest.fn()}
        onRename={jest.fn()}
      />,
    );

    expect(
      view.getByLabelText('Confirmar exclusão da banda').props
        .accessibilityState,
    ).toEqual({ disabled: true });
    await fireEvent.changeText(
      view.getByLabelText('Confirmação do nome da banda'),
      'Banda Horizonte',
    );
    await fireEvent.press(view.getByLabelText('Confirmar exclusão da banda'));

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('exibe o erro retornado ao salvar o nome', async () => {
    const view = await render(
      <BandAdministrationDialog
        band={band}
        errorMessage="Não foi possível atualizar a banda agora. Tente novamente."
        isSubmitting={false}
        mode="rename"
        onClose={jest.fn()}
        onDelete={jest.fn()}
        onModeChange={jest.fn()}
        onRename={jest.fn()}
      />,
    );

    expect(
      view.getByText(
        'Não foi possível atualizar a banda agora. Tente novamente.',
      ),
    ).toBeTruthy();
  });
});
