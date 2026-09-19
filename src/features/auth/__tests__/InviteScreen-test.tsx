import { render } from '@testing-library/react-native';

import { InviteScreen } from '@/features/auth/InviteScreen';

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

describe('tela de convite real', () => {
  it('informa quando o token não chegou', async () => {
    const view = await render(<InviteScreen />);

    expect(view.getByTestId('invite-invalid')).toBeTruthy();
  });

  it('oferece login e indica quando o retorno foi autenticado', async () => {
    const pending = await render(<InviteScreen token="invite-demo" />);
    expect(
      pending.getByRole('button', { name: 'Entrar para continuar' }),
    ).toBeTruthy();

    const resumed = await render(
      <InviteScreen authenticated="1" token="invite-demo" />,
    );
    expect(resumed.getByTestId('invite-authenticated')).toBeTruthy();
  });
});
