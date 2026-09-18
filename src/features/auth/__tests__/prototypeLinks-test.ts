import {
  getDevelopmentUrl,
  getInvitePath,
  getOAuthCallbackPath,
  getSingleRouteParam,
} from '@/features/auth/prototypeLinks';

jest.mock('expo-linking', () => ({
  createURL: (path: string) => `setlist://${path}`,
}));

describe('rotas do protótipo de convite e OAuth', () => {
  it('codifica o token no caminho do convite e permite marcar retomada', () => {
    expect(getInvitePath('convite com espaço')).toBe(
      '/invite/convite%20com%20espa%C3%A7o',
    );
    expect(getInvitePath('convite-demo', { resumed: true })).toBe(
      '/invite/convite-demo?resumed=1',
    );
  });

  it('preserva code, state e token da banda no retorno OAuth', () => {
    expect(
      getOAuthCallbackPath({
        code: 'code/demo',
        inviteToken: 'invite/demo',
        state: 'state demo',
      }),
    ).toBe(
      '/auth/callback?code=code%2Fdemo&state=state%20demo&invite_token=invite%2Fdemo',
    );
  });

  it('aceita tanto parâmetro único quanto repetido do Expo Router', () => {
    expect(getSingleRouteParam('token')).toBe('token');
    expect(getSingleRouteParam(['token', 'outro'])).toBe('token');
    expect(getSingleRouteParam(undefined)).toBeUndefined();
  });

  it('gera uma URL de desenvolvimento a partir do caminho da rota', () => {
    expect(getDevelopmentUrl('/invite/demo')).toContain('invite/demo');
  });
});
