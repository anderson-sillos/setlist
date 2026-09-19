import { render, waitFor } from '@testing-library/react-native';

import { OAuthCallbackHandler } from '@/features/auth/OAuthCallbackHandler';

const mockReplace = jest.fn();
const mockSetSession = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock('@/features/auth/AuthLoadingScreen', () => ({
  AuthLoadingScreen: ({ label }: { readonly label: string }) => {
    const { Text } =
      jest.requireActual<typeof import('react-native')>('react-native');

    return <Text>{label}</Text>;
  },
}));

jest.mock('@/features/auth/AuthSessionProvider', () => ({
  useAuthSession: () => ({ setSession: mockSetSession }),
}));

jest.mock('@/features/auth/authService', () => ({
  completeOAuthCallback: jest.fn(),
}));

const mockComplete = jest.requireMock('@/features/auth/authService')
  .completeOAuthCallback as jest.Mock;

describe('handler do retorno OAuth', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('troca o código e redireciona diretamente para o convite', async () => {
    const session = { user: { email: 'cantora@example.com' } };
    mockComplete.mockResolvedValue({
      inviteToken: 'invite-demo',
      session,
    });

    render(
      <OAuthCallbackHandler
        code="code"
        inviteToken="invite-demo"
        state="state"
      />,
    );

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith('/invite/invite-demo?resumed=1'),
    );
    expect(mockSetSession).toHaveBeenCalledWith(session);
    expect(mockComplete).toHaveBeenCalledWith({
      code: 'code',
      error: undefined,
      errorDescription: undefined,
      flowId: undefined,
      inviteToken: 'invite-demo',
      state: 'state',
    });
  });

  it('retorna ao login com aviso quando a troca falha', async () => {
    mockComplete.mockRejectedValue(new Error('invalid state'));

    render(<OAuthCallbackHandler state="wrong" />);

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: '/auth',
        params: { auth_error: 'oauth' },
      }),
    );
  });
});
