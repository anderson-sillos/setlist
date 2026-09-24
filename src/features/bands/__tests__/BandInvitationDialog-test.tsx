import { fireEvent, render, waitFor } from '@testing-library/react-native';

import type { BandInvitation } from '@/domain';
import type { CreatedInvitation } from '@/data/supabase/invitationMutations';
import { BandInvitationDialog } from '@/features/bands/BandInvitationDialog';

const created: CreatedInvitation = {
  id: 'invite-new',
  token: 'token-new',
  url: 'https://example.com/invite/token-new',
};

const invitations: readonly BandInvitation[] = [
  {
    bandId: 'band-1',
    createdAt: '2026-09-20T10:00:00.000Z',
    expiresAt: '2099-09-20T10:00:00.000Z',
    id: 'invite-active',
    label: 'Baixista',
    revokedAt: null,
    status: 'active',
    usedAt: null,
  },
  {
    bandId: 'band-1',
    createdAt: '2026-09-20T10:00:00.000Z',
    expiresAt: '2020-09-20T10:00:00.000Z',
    id: 'invite-expired',
    label: null,
    revokedAt: null,
    status: 'expired',
    usedAt: null,
  },
  {
    bandId: 'band-1',
    createdAt: '2026-09-20T10:00:00.000Z',
    expiresAt: '2099-09-20T10:00:00.000Z',
    id: 'invite-used',
    label: null,
    revokedAt: null,
    status: 'used',
    usedAt: '2026-09-20T11:00:00.000Z',
  },
];

describe('<BandInvitationDialog />', () => {
  it('cria e apresenta o link, permite compartilhar e administrar estados', async () => {
    const onCreate = jest.fn(async () => created);
    const onRenew = jest.fn(async () => created);
    const onRevoke = jest.fn();
    const view = await render(
      <BandInvitationDialog
        errorMessage={null}
        invitations={invitations}
        isSubmitting={false}
        onClose={jest.fn()}
        onCreate={onCreate}
        onRenew={onRenew}
        onRevoke={onRevoke}
        visible
      />,
    );

    expect(view.getByTestId('band-invitation-keyboard-layout')).toBeTruthy();
    expect(view.getByLabelText('Compartilhar convite novamente')).toBeTruthy();
    expect(view.getByLabelText('Revogar convite')).toBeTruthy();
    expect(view.getByLabelText('Renovar convite')).toBeTruthy();

    await fireEvent.changeText(
      view.getByLabelText('Rótulo do convite'),
      '  Vocalista  ',
    );
    await fireEvent.press(view.getByLabelText('Criar convite'));
    expect(onCreate).toHaveBeenCalledWith('  Vocalista  ');
    expect(await view.findByText(created.url)).toBeTruthy();
    expect(view.getByTestId('band-invitation-link-dialog')).toBeTruthy();
    await fireEvent.press(view.getByLabelText('Fechar link pronto'));
    expect(view.queryByTestId('band-invitation-link-dialog')).toBeNull();

    await fireEvent.press(view.getByLabelText('Revogar convite'));
    expect(onRevoke).toHaveBeenCalledWith('invite-active');
    await fireEvent.press(view.getByLabelText('Renovar convite'));
    await waitFor(() => expect(onRenew).toHaveBeenCalledWith('invite-expired'));
    expect(view.getByText('Utilizado · aceito em 20/09/2026')).toBeTruthy();
    expect(view.getByText(/Ativo · válido até 20\/09\/2099/)).toBeTruthy();
  });

  it('não mostra datas de convites utilizados sem data de aceite', async () => {
    const usedInvitation = { ...invitations[2], usedAt: null };
    const view = await render(
      <BandInvitationDialog
        errorMessage={null}
        invitations={[usedInvitation]}
        isSubmitting={false}
        onClose={jest.fn()}
        onCreate={jest.fn(async () => null)}
        onRenew={jest.fn(async () => null)}
        onRevoke={jest.fn()}
        visible
      />,
    );

    expect(view.getByText('Utilizado')).toBeTruthy();
    expect(view.queryByText(/aceito em|válido até/)).toBeNull();
    expect(view.queryByText(/2099/)).toBeNull();
  });

  it('mostra estado vazio e erro sem expor ações quando está submetendo', async () => {
    const view = await render(
      <BandInvitationDialog
        errorMessage="Falha de rede"
        invitations={[]}
        isSubmitting
        onClose={jest.fn()}
        onCreate={jest.fn(async () => null)}
        onRenew={jest.fn(async () => null)}
        onRevoke={jest.fn()}
        visible
      />,
    );

    expect(view.getByText(/Nenhum convite ainda/)).toBeTruthy();
    expect(view.getByText('Falha de rede')).toBeTruthy();
    expect(
      view.getByLabelText('Criar convite').props.accessibilityState,
    ).toEqual(expect.objectContaining({ disabled: true }));
  });
});
