import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { AuthScreen } from '@/features/auth/AuthScreen';
import { colors } from '@/theme/tokens';

jest.mock('@/features/auth/AppleSignInButton', () => {
  const { Pressable, Text } = jest.requireActual(
    'react-native',
  ) as typeof import('react-native');

  return {
    AppleSignInButton: ({
      disabled,
      onPress,
      testID,
    }: {
      disabled?: boolean;
      onPress: () => void;
      testID?: string;
    }) => (
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={onPress}
        testID={testID}
      >
        <Text>Continuar com Apple</Text>
      </Pressable>
    ),
  };
});

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

  it('apresenta a identidade do app e orienta o acesso por provedor', async () => {
    const view = await render(<AuthScreen />);

    expect(view.getByLabelText('Logo do Setlist')).toBeTruthy();
    expect(view.getByText('Setlist')).toBeTruthy();
    expect(
      view.getByText(
        'Organize repertórios, prepare seus shows e leve as letras com você.',
      ),
    ).toBeTruthy();
    expect(
      view.getByText(
        'Entre com sua conta Google ou Apple. Se ainda não tiver banda, você pode aceitar um convite depois.',
      ),
    ).toBeTruthy();
    expect(
      view.getByText(
        'Ao prosseguir com o login, você concorda com os Termos de uso do Setlist.',
      ),
    ).toBeTruthy();

    const buttonStyle = (testID: string) => {
      const button = view.getByTestId(testID);
      const style = button.props.style;
      return StyleSheet.flatten(
        typeof style === 'function' ? style({ pressed: false }) : style,
      );
    };

    expect(buttonStyle('auth-google')).toMatchObject({
      backgroundColor: colors.surface,
      borderColor: colors.violet,
    });
    expect(
      view.getByRole('button', { name: 'Continuar com Apple' }),
    ).toBeEnabled();
  });

  it('retorna diretamente ao convite ao concluir o login', async () => {
    mockSignIn.mockResolvedValue({ status: 'authenticated' });
    const view = await render(<AuthScreen />);

    await fireEvent.press(
      view.getByRole('button', { name: 'Continuar com Google' }),
    );

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith('/invite/invite-demo?resumed=1'),
    );
    expect(view.queryByText('Login concluído')).toBeNull();
    expect(mockSignIn).toHaveBeenCalledWith('google', 'invite-demo');
  });

  it('mostra cancelamento e falha do provedor', async () => {
    mockSignIn.mockResolvedValueOnce({ status: 'cancelled' });
    const view = await render(<AuthScreen />);

    await fireEvent.press(
      view.getByRole('button', { name: 'Continuar com Google' }),
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

  it('retorna diretamente à raiz quando entra sem convite', async () => {
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
    expect(view.queryByText('Login concluído')).toBeNull();
    expect(mockSignIn).toHaveBeenCalledWith('google', undefined);
  });

  it('mostra o provedor em carregamento enquanto abre a autenticação', async () => {
    mockSignIn.mockImplementation(() => new Promise(() => undefined));
    const view = await render(<AuthScreen />);

    await fireEvent.press(
      view.getByRole('button', { name: 'Continuar com Google' }),
    );

    expect(
      await view.findByRole('progressbar', { name: 'Abrindo Google…' }),
    ).toBeTruthy();
    expect(
      view.getByRole('button', { name: 'Continuar com Google' }),
    ).toBeDisabled();
    expect(
      view.getByRole('button', { name: 'Continuar com Apple' }),
    ).toBeDisabled();
  });
});
