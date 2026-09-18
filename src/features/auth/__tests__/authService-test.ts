import { Platform } from 'react-native';

import { getSupabaseClient } from '@/data/supabase/client';
import {
  completeOAuthCallback,
  refreshAuthSession,
  signInWithSocialProvider,
  subscribeToAuthState,
} from '@/features/auth/authService';
import { clearOAuthState, createOAuthState } from '@/features/auth/authState';

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'state-generated'),
}));

jest.mock('expo-linking', () => ({
  createURL: (path: string) => `setlist://${path}`,
  parse: jest.fn(() => ({
    queryParams: {
      code: 'code-from-provider',
      invite_token: 'invite-from-provider',
      state: 'state-generated',
    },
  })),
}));

jest.mock('expo-web-browser', () => ({
  openAuthSessionAsync: jest.fn(),
}));

jest.mock('@/data/supabase/client', () => ({
  getSupabaseClient: jest.fn(),
}));

const mockGetSupabaseClient = jest.mocked(getSupabaseClient);
const mockOpenAuthSessionAsync = jest.requireMock('expo-web-browser')
  .openAuthSessionAsync as jest.Mock;

function createAuthMock() {
  const subscription = { unsubscribe: jest.fn() };
  const auth = {
    exchangeCodeForSession: jest.fn(),
    onAuthStateChange: jest.fn(() => ({ data: { subscription } })),
    refreshSession: jest.fn(),
    signInWithOAuth: jest.fn(),
  };
  const client = { auth };
  mockGetSupabaseClient.mockReturnValue(client as never);
  return { auth, client, subscription };
}

describe('serviço de autenticação social', () => {
  const platform = Platform.OS;

  afterEach(() => {
    clearOAuthState();
    jest.clearAllMocks();
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: platform,
    });
  });

  it('inicia o Google nativo, abre o retorno e preserva o convite', async () => {
    const { auth } = createAuthMock();
    auth.signInWithOAuth.mockResolvedValue({
      data: { url: 'https://accounts.google.com/oauth' },
      error: null,
    });
    auth.exchangeCodeForSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });
    mockOpenAuthSessionAsync.mockResolvedValue({
      type: 'success',
      url: 'setlist://auth/callback',
    });

    const result = await signInWithSocialProvider('google', 'invite-demo');

    expect(result).toMatchObject({
      inviteToken: 'invite-from-provider',
      status: 'authenticated',
    });
    expect(auth.signInWithOAuth).toHaveBeenCalledWith({
      options: {
        queryParams: { state: 'state-generated' },
        redirectTo: 'setlist://auth/callback?invite_token=invite-demo',
        skipBrowserRedirect: true,
      },
      provider: 'google',
    });
    expect(mockOpenAuthSessionAsync).toHaveBeenCalledWith(
      'https://accounts.google.com/oauth',
      'setlist://auth/callback?invite_token=invite-demo',
    );
    expect(auth.exchangeCodeForSession).toHaveBeenCalledWith(
      'code-from-provider',
    );
  });

  it('inicia o Apple na web e deixa o redirecionamento para o navegador', async () => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: 'web',
    });
    const { auth } = createAuthMock();
    auth.signInWithOAuth.mockResolvedValue({
      data: { url: 'https://appleid.apple.com/oauth' },
      error: null,
    });

    await expect(signInWithSocialProvider('apple')).resolves.toEqual({
      status: 'redirecting',
    });
    expect(mockOpenAuthSessionAsync).not.toHaveBeenCalled();
  });

  it('valida state antes de trocar o code por uma sessão', async () => {
    const { auth } = createAuthMock();
    createOAuthState();

    await expect(
      completeOAuthCallback({ code: 'code', state: 'state-wrong' }),
    ).rejects.toMatchObject({ code: 'oauth_state_invalid' });
    expect(auth.exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it('rejeita erro do provedor quando o state não confere', async () => {
    createOAuthState();

    await expect(
      completeOAuthCallback({
        error: 'access_denied',
        errorDescription: 'cancelado',
        state: 'state-wrong',
      }),
    ).rejects.toMatchObject({ code: 'oauth_state_invalid' });
  });

  it('converte falhas de início e de renovação em erro de fluxo', async () => {
    const { auth } = createAuthMock();
    auth.signInWithOAuth.mockResolvedValue({
      data: { url: undefined },
      error: { message: 'provider unavailable' },
    });
    await expect(signInWithSocialProvider('google')).rejects.toMatchObject({
      code: 'oauth_start_failed',
    });

    auth.refreshSession.mockResolvedValue({
      data: { session: null },
      error: { message: 'expired' },
    });
    await expect(refreshAuthSession()).rejects.toMatchObject({
      code: 'session_refresh_failed',
    });
  });

  it('normaliza exceções inesperadas do navegador para o fluxo de login', async () => {
    const { auth } = createAuthMock();
    auth.signInWithOAuth.mockRejectedValue(new Error('network unavailable'));

    await expect(signInWithSocialProvider('google')).rejects.toMatchObject({
      code: 'oauth_unexpected_error',
      message: 'Não foi possível concluir o login agora. Tente novamente.',
    });
  });

  it('expõe renovação e inscrição no ciclo de sessão', async () => {
    const { auth, subscription } = createAuthMock();
    const session = { user: { id: 'user-1' } };
    auth.refreshSession.mockResolvedValue({ data: { session }, error: null });

    await expect(refreshAuthSession()).resolves.toBe(session);
    const callback = jest.fn();
    expect(subscribeToAuthState(callback)).toBe(subscription);
    expect(auth.onAuthStateChange).toHaveBeenCalledWith(callback);
  });
});
