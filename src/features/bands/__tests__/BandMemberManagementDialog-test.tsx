import { fireEvent, render } from '@testing-library/react-native';

import { BandMemberManagementDialog } from '@/features/bands/BandMemberManagementDialog';

const editor = {
  bandId: 'band-1',
  displayName: 'Bruno Lima',
  id: 'membership-1',
  joinedAt: '2026-09-20T10:00:00.000Z',
  role: 'editor' as const,
  userId: 'user-2',
};

describe('<BandMemberManagementDialog />', () => {
  it('oferece promoção para Editor e exige confirmação', async () => {
    const onConfirm = jest.fn();
    const view = await render(
      <BandMemberManagementDialog
        errorMessage={null}
        isSubmitting={false}
        member={{ ...editor, role: 'member' }}
        onClose={jest.fn()}
        onConfirm={onConfirm}
      />,
    );

    await fireEvent.press(
      view.getByLabelText('Promover Bruno Lima para editor'),
    );
    expect(
      view.getByText(
        'Alterar Bruno Lima para Editor? As permissões de acesso serão atualizadas.',
      ),
    ).toBeTruthy();
    await fireEvent.press(
      view.getByLabelText('Confirmar alteração para Editor de Bruno Lima'),
    );
    expect(onConfirm).toHaveBeenCalledWith({
      role: 'editor',
      type: 'set-role',
    });
  });

  it('oferece rebaixamento de proprietário quando outro proprietário permanece', async () => {
    const onConfirm = jest.fn();
    const view = await render(
      <BandMemberManagementDialog
        errorMessage={null}
        isSubmitting={false}
        member={{ ...editor, role: 'owner' }}
        onClose={jest.fn()}
        onConfirm={onConfirm}
      />,
    );

    await fireEvent.press(
      view.getByLabelText('Rebaixar Bruno Lima para editor'),
    );
    expect(
      view.getByText(
        'Alterar Bruno Lima para Editor? As permissões de acesso serão atualizadas.',
      ),
    ).toBeTruthy();
    await fireEvent.press(
      view.getByLabelText('Confirmar alteração para Editor de Bruno Lima'),
    );
    expect(onConfirm).toHaveBeenCalledWith({
      role: 'editor',
      type: 'set-role',
    });
  });

  it('oferece as transições disponíveis para um proprietário', async () => {
    const view = await render(
      <BandMemberManagementDialog
        errorMessage={null}
        isSubmitting={false}
        member={{ ...editor, role: 'owner' }}
        onClose={jest.fn()}
        onConfirm={jest.fn()}
      />,
    );

    expect(view.getByLabelText('Rebaixar Bruno Lima para editor')).toBeTruthy();
    expect(
      view.getByLabelText('Rebaixar Bruno Lima para integrante'),
    ).toBeTruthy();
    expect(view.getByLabelText('Remover Bruno Lima')).toBeTruthy();
  });

  it('exige confirmação para remover e mostra falhas do servidor', async () => {
    const onConfirm = jest.fn();
    const view = await render(
      <BandMemberManagementDialog
        errorMessage="Só um Proprietário pode administrar integrantes desta banda."
        isSubmitting={false}
        member={editor}
        onClose={jest.fn()}
        onConfirm={onConfirm}
      />,
    );

    expect(
      view.getByText(
        'Só um Proprietário pode administrar integrantes desta banda.',
      ),
    ).toBeTruthy();
    await fireEvent.press(view.getByLabelText('Remover Bruno Lima'));
    expect(
      view.getByText(
        'Remover Bruno Lima da banda? Essa pessoa perderá o acesso ao conteúdo.',
      ),
    ).toBeTruthy();
    await fireEvent.press(
      view.getByLabelText('Confirmar remoção de Bruno Lima'),
    );
    expect(onConfirm).toHaveBeenCalledWith({ type: 'remove' });
  });
});
