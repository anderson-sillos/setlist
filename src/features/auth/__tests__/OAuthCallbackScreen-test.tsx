import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { OAuthCallbackScreen } from '@/features/auth/OAuthCallbackScreen';

const mockReplace = jest.fn();
const mockRouter = { replace: mockReplace };

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
}));

jest.mock('@/features/auth/authService', () => ({
  AuthFlowError: class MockAuthFlowError extends Error {
    readonly code = 'mock';
  },
  completeOAuthCallback: jest.fn(),
}));

const mockComplete = jest.requireMock('@/features/auth/authService')
  .completeOAuthCallback as jest.Mock;

describe('tela de retorno OAuth', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('encaminha para o convite quando a troca de sessão conclui', async () => {
    mockComplete.mockResolvedValue({ inviteToken: 'invite-demo' });
    await render(
      <OAuthCallbackScreen
        code="code"
        inviteToken="invite-demo"
        state="state"
      />,
    );

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith('/invite/invite-demo?resumed=1'),
    );
    expect(mockComplete).toHaveBeenCalledWith({
      code: 'code',
      error: undefined,
      errorDescription: undefined,
      inviteToken: 'invite-demo',
      state: 'state',
    });
  });

  it('mostra falha e oferece novo login', async () => {
    mockComplete.mockRejectedValue(new Error('invalid state'));
    const view = await render(<OAuthCallbackScreen state="wrong" />);

    expect(await view.findByText('Não foi possível entrar')).toBeTruthy();
    await fireEvent.press(
      view.getByRole('button', { name: 'Tentar novamente' }),
    );
    expect(mockReplace).toHaveBeenCalledWith('/auth');
  });
});
