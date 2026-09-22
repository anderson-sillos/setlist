import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { getInvitationPreview } from '@/data/supabase/invitationMutations';
import { InviteScreen } from '@/features/auth/InviteScreen';
import { LastBandSelectionProvider } from '@/features/bands/LastBandSelection';

const mockReplace = jest.fn();
const mockInvalidateQueries = jest.fn().mockResolvedValue(undefined);

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

jest.mock('@/providers/AppProviders', () => ({
  useAppData: () => ({ currentUserId: 'user-demo' }),
}));

jest.mock('@/data/supabase/invitationMutations', () => ({
  ...jest.requireActual('@/data/supabase/invitationMutations'),
  acceptInvitation: jest.fn(),
  getInvitationPreview: jest.fn(),
}));

const mockAcceptInvitation = jest.requireMock(
  '@/data/supabase/invitationMutations',
).acceptInvitation as jest.Mock;
const mockGetInvitationPreview = jest.mocked(getInvitationPreview);

function renderInvite(element: React.ReactElement) {
  return render(
    <LastBandSelectionProvider>{element}</LastBandSelectionProvider>,
  );
}

describe('tela de convite real', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('informa quando o token não chegou', async () => {
    const view = await renderInvite(<InviteScreen />);

    expect(view.getByTestId('invite-invalid')).toBeTruthy();
  });

  it('oferece login e indica quando o retorno foi autenticado', async () => {
    const pending = await renderInvite(<InviteScreen token="invite-demo" />);
    expect(
      pending.getByRole('button', { name: 'Entrar para continuar' }),
    ).toBeTruthy();

    mockGetInvitationPreview.mockResolvedValue({
      alreadyAccepted: false,
      bandId: 'band-demo',
      bandName: 'Banda Demo',
      expiresAt: '2099-01-01T00:00:00.000Z',
      label: null,
    });
    const resumed = await renderInvite(
      <InviteScreen authenticated="1" token="invite-demo" />,
    );
    await waitFor(() => {
      expect(resumed.getByText('Banda Demo')).toBeTruthy();
    });
  });

  it('informa quando o convite expirou após o login', async () => {
    mockGetInvitationPreview.mockRejectedValueOnce(
      new Error('INVITATION_NOT_AVAILABLE'),
    );
    const view = await renderInvite(
      <InviteScreen resumed="1" token="invite-expired" />,
    );

    await waitFor(() => {
      expect(view.getByText(/não está mais disponível/)).toBeTruthy();
    });
  });

  it('remove a rota restaurada de um convite já aceito pela mesma pessoa', async () => {
    mockGetInvitationPreview.mockResolvedValue({
      alreadyAccepted: true,
      bandId: 'band-demo',
      bandName: 'Banda Demo',
      expiresAt: '2099-01-01T00:00:00.000Z',
      label: null,
    });
    const view = await renderInvite(
      <InviteScreen resumed="1" token="invite-already-used" />,
    );

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/'));
    expect(view.queryByText(/não está mais disponível/)).toBeNull();
  });

  it('atualiza a lista de bandas após aceitar o convite', async () => {
    mockAcceptInvitation.mockResolvedValue('band-demo');
    mockGetInvitationPreview.mockResolvedValue({
      alreadyAccepted: false,
      bandId: 'band-demo',
      bandName: 'Banda Demo',
      expiresAt: '2099-01-01T00:00:00.000Z',
      label: null,
    });
    const view = await renderInvite(
      <InviteScreen authenticated="1" token="invite-demo" />,
    );

    await fireEvent.press(
      await view.findByRole('button', { name: 'Aceitar convite' }),
    );

    await waitFor(() => {
      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ['bands', 'user', 'user-demo'],
        refetchType: 'all',
      });
      expect(mockReplace).toHaveBeenCalledWith('/bands/band-demo/band');
    });
    expect(mockAcceptInvitation).toHaveBeenCalledWith('invite-demo');
  });
});
