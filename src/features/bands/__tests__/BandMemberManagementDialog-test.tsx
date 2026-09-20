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
  it('exige confirmação para promover e remover um integrante', async () => {
    const onConfirm = jest.fn();
    const view = await render(
      <BandMemberManagementDialog
        errorMessage={null}
        isSubmitting={false}
        member={editor}
        onClose={jest.fn()}
        onConfirm={onConfirm}
      />,
    );

    await fireEvent.press(
      view.getByLabelText('Promover Bruno Lima a proprietário'),
    );
    expect(
      view.getByText(
        'Promover Bruno Lima para Proprietário? Essa pessoa passará a administrar a banda.',
      ),
    ).toBeTruthy();
    await fireEvent.press(
      view.getByLabelText('Confirmar promoção de Bruno Lima'),
    );
    expect(onConfirm).toHaveBeenCalledWith('promote');
  });

  it('não oferece promoção para quem já é proprietário', async () => {
    const view = await render(
      <BandMemberManagementDialog
        errorMessage={null}
        isSubmitting={false}
        member={{ ...editor, role: 'owner' }}
        onClose={jest.fn()}
        onConfirm={jest.fn()}
      />,
    );

    expect(
      view.queryByLabelText('Promover Bruno Lima a proprietário'),
    ).toBeNull();
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
    expect(onConfirm).toHaveBeenCalledWith('remove');
  });
});
