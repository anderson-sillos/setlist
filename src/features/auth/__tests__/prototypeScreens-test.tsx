import { fireEvent, render } from '@testing-library/react-native';

import { AuthPrototypeScreen } from '@/features/auth/AuthPrototypeScreen';
import { InvitePrototypeScreen } from '@/features/auth/InvitePrototypeScreen';
import { OAuthCallbackPrototypeScreen } from '@/features/auth/OAuthCallbackPrototypeScreen';

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('expo-linking', () => ({
  createURL: (path: string) => `setlist://${path}`,
  openURL: jest.fn(),
}));

const mockOpenURL = jest.requireMock('expo-linking').openURL as jest.Mock;

describe('protótipos de convite e OAuth', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('apresenta URLs de desenvolvimento e permite abri-las', async () => {
    const view = await render(<AuthPrototypeScreen />);

    expect(view.getByTestId('auth-prototype')).toBeTruthy();
    expect(
      view.getByText(/setlist:\/\/invite\/convite-demo-2026/),
    ).toBeTruthy();
    expect(view.getByText(/setlist:\/\/auth\/callback/)).toBeTruthy();

    await fireEvent.press(
      view.getByRole('button', { name: 'Abrir URL do convite' }),
    );
    await fireEvent.press(
      view.getByRole('button', { name: 'Abrir URL de retorno' }),
    );

    expect(mockOpenURL).toHaveBeenNthCalledWith(
      1,
      'setlist://invite/convite-demo-2026',
    );
    expect(mockOpenURL).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('setlist://auth/callback'),
    );
  });

  it('preserva o token e indica quando o convite foi retomado', async () => {
    const view = await render(
      <InvitePrototypeScreen resumed="1" token="convite-teste" />,
    );

    expect(view.getByTestId('invite-details')).toBeTruthy();
    expect(view.getByTestId('invite-token')).toHaveTextContent('convite-teste');
    expect(view.getByText('Convite retomado após o login.')).toBeTruthy();
    expect(
      view.getByRole('button', { name: 'Simular login social e retorno' }),
    ).toBeTruthy();
  });

  it('informa quando a rota do convite não recebe token', async () => {
    const view = await render(<InvitePrototypeScreen />);

    expect(view.getByTestId('invite-invalid')).toBeTruthy();
    expect(view.queryByTestId('invite-details')).toBeNull();
  });

  it('mostra os parâmetros preservados no retorno OAuth', async () => {
    const view = await render(
      <OAuthCallbackPrototypeScreen
        code="code-demo"
        inviteToken="convite-teste"
        state="state-demo"
      />,
    );

    expect(view.getByText('Retorno recebido')).toBeTruthy();
    expect(view.getByTestId('oauth-code')).toHaveTextContent('code-demo');
    expect(view.getByTestId('oauth-state')).toHaveTextContent('state-demo');
    expect(view.getByTestId('oauth-invite-token')).toHaveTextContent(
      'convite-teste',
    );
    expect(view.getByRole('button', { name: 'Retomar convite' })).toBeTruthy();
  });

  it('mostra o erro e permite voltar quando não há convite', async () => {
    const view = await render(
      <OAuthCallbackPrototypeScreen error="access_denied" />,
    );

    expect(view.getByText('Retorno com erro: access_denied')).toBeTruthy();
    expect(view.getByTestId('oauth-code')).toHaveTextContent('não informado');
    expect(
      view.getByRole('button', { name: 'Voltar ao protótipo' }),
    ).toBeTruthy();
  });
});
