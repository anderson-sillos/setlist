import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { AuthScreen } from '@/features/auth/AuthScreen';

const mockReplace = jest.fn();
const mockRouter = { replace: mockReplace };

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
  useLocalSearchParams: jest.fn(() => ({ invite_token: 'invite-demo' })),
  useRouter: () => mockRouter,
}));

jest.mock('@/features/auth/authService', () => {
  class MockAuthFlowError extends Error {
    readonly code = 'mock';
  }

  return {
    AuthFlowError: MockAuthFlowError,
    signInWithSocialProvider: jest.fn(),
  };
});

const mockSignIn = jest.requireMock('@/features/auth/authService')
  .signInWithSocialProvider as jest.Mock;

describe('tela de autenticação', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('preserva o convite ao concluir o login', async () => {
    mockSignIn.mockResolvedValue({ status: 'authenticated' });
    const view = await render(<AuthScreen />);

    await fireEvent.press(
      view.getByRole('button', { name: 'Continuar com Google' }),
    );

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith('/invite/invite-demo?resumed=1'),
    );
    expect(mockSignIn).toHaveBeenCalledWith('google', 'invite-demo');
  });

  it('mostra cancelamento e falha do provedor', async () => {
    mockSignIn.mockResolvedValueOnce({ status: 'cancelled' });
    const view = await render(<AuthScreen />);

    await fireEvent.press(
      view.getByRole('button', { name: 'Continuar com Apple' }),
    );
    expect(await view.findByTestId('auth-error')).toHaveTextContent(
      /Login cancelado/,
    );

    mockSignIn.mockRejectedValueOnce(new Error('provider unavailable'));
    await fireEvent.press(
      view.getByRole('button', { name: 'Continuar com Google' }),
    );
    expect(await view.findByTestId('auth-error')).toHaveTextContent(
      /Não foi possível concluir o login agora\./,
    );
  });

  it('volta para a raiz quando entra sem convite', async () => {
    const routerModule = jest.requireMock('expo-router') as {
      useLocalSearchParams: jest.Mock;
    };
    routerModule.useLocalSearchParams.mockReturnValueOnce({});
    mockSignIn.mockResolvedValue({ status: 'authenticated' });
    const view = await render(<AuthScreen />);

    await fireEvent.press(
      view.getByRole('button', { name: 'Continuar com Google' }),
    );

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/'));
    expect(mockSignIn).toHaveBeenCalledWith('google', undefined);
  });
});
