import { Platform } from 'react-native';

import { getPublicEnvironment } from '@/config/environment';
import { getSupabaseClient } from '@/data/supabase/client';
import {
  isNativeGoogleSignInAvailable,
  tryNativeGoogleSignIn,
} from '@/features/auth/nativeGoogleSignIn';
import {
  loadIosNativeGoogleModule,
  loadNativeGoogleModule,
} from '@/features/auth/nativeGoogleModule';

jest.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  CryptoEncoding: { HEX: 'hex' },
  digestStringAsync: jest.fn(async () => 'hashed-nonce'),
  randomUUID: jest.fn(() => 'raw-nonce'),
}));

jest.mock('expo-constants', () => ({
  appOwnership: null,
  executionEnvironment: 'standalone',
}));

jest.mock('@/config/environment', () => ({
  getPublicEnvironment: jest.fn(),
}));

jest.mock('@/data/supabase/client', () => ({
  getSupabaseClient: jest.fn(),
}));

jest.mock('@/features/auth/nativeGoogleModule', () => ({
  loadIosNativeGoogleModule: jest.fn(),
  loadNativeGoogleModule: jest.fn(),
}));

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(),
    signOut: jest.fn(),
    signIn: jest.fn(),
  },
  statusCodes: { SIGN_IN_CANCELLED: '12501' },
}));

const mockGoogleModule = jest.requireMock(
  '@react-native-google-signin/google-signin',
) as {
  GoogleSignin: {
    configure: jest.Mock;
    hasPlayServices: jest.Mock;
    signOut: jest.Mock;
    signIn: jest.Mock;
  };
  statusCodes: { SIGN_IN_CANCELLED: string };
};

const mockGetPublicEnvironment = jest.mocked(getPublicEnvironment);
const mockGetSupabaseClient = jest.mocked(getSupabaseClient);
const mockLoadIosNativeGoogleModule = jest.mocked(loadIosNativeGoogleModule);
const mockLoadNativeGoogleModule = jest.mocked(loadNativeGoogleModule);
const mockConstants = jest.requireMock('expo-constants') as {
  appOwnership: string | null;
  executionEnvironment: string;
};
const mockIosGoogleModule = jest.requireMock(
  '@react-native-google-signin/google-signin',
) as {
  GoogleSignin: {
    configure: jest.Mock;
    hasPlayServices: jest.Mock;
    signOut: jest.Mock;
    signIn: jest.Mock;
  };
  statusCodes: { SIGN_IN_CANCELLED: string };
};

const mockConsoleInfo = jest
  .spyOn(console, 'info')
  .mockImplementation(() => undefined);

function useAndroidRuntime(): void {
  Object.defineProperty(Platform, 'OS', {
    configurable: true,
    value: 'android',
  });
  mockConstants.appOwnership = null;
  mockConstants.executionEnvironment = 'standalone';
}

describe('Google nativo opcional', () => {
  const platform = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    useAndroidRuntime();
    mockGetPublicEnvironment.mockReturnValue({
      appEnvironment: 'development',
      googleWebClientId: 'web-client-id',
      supabase: {
        publishableKey: 'publishable-key',
        url: 'https://example.supabase.co',
      },
    });
    mockGoogleModule.GoogleSignin.hasPlayServices.mockResolvedValue(true);
    mockGoogleModule.GoogleSignin.signOut.mockResolvedValue(null);
    mockGoogleModule.GoogleSignin.signIn.mockResolvedValue({
      idToken: 'id-token',
    });
    mockIosGoogleModule.GoogleSignin.hasPlayServices.mockResolvedValue(true);
    mockIosGoogleModule.GoogleSignin.signIn.mockResolvedValue({
      idToken: 'id-token',
    });
    mockLoadNativeGoogleModule.mockResolvedValue(mockGoogleModule as never);
    mockLoadIosNativeGoogleModule.mockResolvedValue(
      mockIosGoogleModule as never,
    );

    const auth = {
      signInWithIdToken: jest.fn().mockResolvedValue({
        data: { session: { user: { id: 'user-1' } } },
        error: null,
      }),
    };
    mockGetSupabaseClient.mockReturnValue({ auth } as never);
  });

  afterEach(() => {
    mockConsoleInfo.mockClear();
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: platform,
    });
  });

  afterAll(() => {
    mockConsoleInfo.mockRestore();
  });

  it('não anuncia suporte no Expo Go', () => {
    mockConstants.appOwnership = 'expo';

    expect(isNativeGoogleSignInAvailable()).toBe(false);
  });

  it('não anuncia suporte quando não há Client ID público', () => {
    mockGetPublicEnvironment.mockReturnValue({
      appEnvironment: 'development',
      supabase: {
        publishableKey: 'publishable-key',
        url: 'https://example.supabase.co',
      },
    });

    expect(isNativeGoogleSignInAvailable()).toBe(false);
  });

  it('usa o OAuth web no iOS sem Client ID iOS', async () => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: 'ios',
    });

    await expect(tryNativeGoogleSignIn()).resolves.toEqual({
      status: 'unsupported',
    });
    expect(JSON.stringify(mockConsoleInfo.mock.calls)).toContain(
      'missing_ios_client_id',
    );
  });

  it('alinha o nonce do Google iOS com a validação do Supabase', async () => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: 'ios',
    });
    mockGetPublicEnvironment.mockReturnValue({
      appEnvironment: 'development',
      googleIosClientId: 'ios-client-id',
      googleWebClientId: 'web-client-id',
      supabase: {
        publishableKey: 'publishable-key',
        url: 'https://example.supabase.co',
      },
    });

    await expect(tryNativeGoogleSignIn()).resolves.toMatchObject({
      session: { user: { id: 'user-1' } },
      status: 'authenticated',
    });

    expect(mockIosGoogleModule.GoogleSignin.configure).toHaveBeenCalledWith({
      iosClientId: 'ios-client-id',
      webClientId: 'web-client-id',
    });
    expect(mockIosGoogleModule.GoogleSignin.signIn).toHaveBeenCalledWith({
      nonce: 'hashed-nonce',
    });
    expect(
      (
        mockGetSupabaseClient.mock.results[0]?.value as {
          auth: { signInWithIdToken: jest.Mock };
        }
      ).auth.signInWithIdToken,
    ).toHaveBeenCalledWith({
      nonce: 'raw-nonce',
      provider: 'google',
      token: 'id-token',
    });
  });

  it('retorna indisponível quando a configuração do ambiente falha', async () => {
    mockGetPublicEnvironment.mockImplementation(() => {
      throw new Error('variáveis ausentes');
    });

    await expect(tryNativeGoogleSignIn()).resolves.toEqual({
      status: 'unsupported',
    });
    expect(JSON.stringify(mockConsoleInfo.mock.calls)).toContain(
      'environment_unavailable',
    );
  });

  it('não emite logs nativos em produção', async () => {
    mockGetPublicEnvironment.mockReturnValue({
      appEnvironment: 'production',
      googleWebClientId: 'web-client-id',
      supabase: {
        publishableKey: 'publishable-key',
        url: 'https://example.supabase.co',
      },
    });

    await expect(tryNativeGoogleSignIn()).resolves.toMatchObject({
      status: 'authenticated',
    });
    expect(mockConsoleInfo).not.toHaveBeenCalled();
  });

  it('troca o ID Token nativo por uma sessão Supabase', async () => {
    const result = await tryNativeGoogleSignIn('invite-demo');

    expect(result).toMatchObject({
      inviteToken: 'invite-demo',
      session: { user: { id: 'user-1' } },
      status: 'authenticated',
    });
    expect(mockGoogleModule.GoogleSignin.configure).toHaveBeenCalledWith({
      webClientId: 'web-client-id',
    });
    expect(mockGoogleModule.GoogleSignin.signOut).toHaveBeenCalledTimes(1);
    expect(
      mockGoogleModule.GoogleSignin.signOut.mock.invocationCallOrder[0],
    ).toBeLessThan(
      mockGoogleModule.GoogleSignin.signIn.mock.invocationCallOrder[0],
    );
    expect(
      (
        mockGetSupabaseClient.mock.results[0]?.value as {
          auth: { signInWithIdToken: jest.Mock };
        }
      ).auth.signInWithIdToken,
    ).toHaveBeenCalledWith({
      provider: 'google',
      token: 'id-token',
    });

    const logText = mockConsoleInfo.mock.calls
      .map(([event, details]) => JSON.stringify({ event, details }))
      .join('\n');
    expect(logText).toContain('android_supabase_exchange_succeeded');
    expect(logText).not.toContain('id-token');
  });

  it('limpa a conta Google anterior para permitir escolher outra', async () => {
    await expect(tryNativeGoogleSignIn()).resolves.toMatchObject({
      status: 'authenticated',
    });
    expect(mockGoogleModule.GoogleSignin.signOut).toHaveBeenCalledTimes(1);
    expect(mockGoogleModule.GoogleSignin.signIn).toHaveBeenCalledTimes(1);
  });

  it('preserva o cancelamento sem iniciar o OAuth web', async () => {
    mockGoogleModule.GoogleSignin.signIn.mockRejectedValueOnce(
      Object.assign(new Error('login cancelado'), { code: '12501' }),
    );

    await expect(tryNativeGoogleSignIn()).resolves.toEqual({
      status: 'cancelled',
    });
  });

  it('retorna indisponível quando a resposta não contém ID Token', async () => {
    mockGoogleModule.GoogleSignin.signIn.mockResolvedValueOnce({
      idToken: null,
    });

    await expect(tryNativeGoogleSignIn()).resolves.toEqual({
      status: 'unsupported',
    });
    expect(mockConsoleInfo.mock.calls.join(' ')).toContain(
      'android_id_token_missing',
    );
  });

  it('retorna indisponível quando o módulo nativo falha', async () => {
    mockGoogleModule.GoogleSignin.hasPlayServices.mockRejectedValueOnce(
      new Error('Play Services ausente'),
    );

    await expect(tryNativeGoogleSignIn()).resolves.toEqual({
      status: 'unsupported',
    });
  });

  it('preserva o diagnóstico quando o login nativo rejeita sem um Error', async () => {
    mockGoogleModule.GoogleSignin.signIn.mockRejectedValueOnce(
      'Play Services ausente',
    );

    await expect(tryNativeGoogleSignIn()).resolves.toEqual({
      status: 'unsupported',
    });
    expect(mockConsoleInfo.mock.calls.join(' ')).toContain(
      'android_sign_in_failed',
    );
  });

  it('retorna a falha da troca do token para o serviço de autenticação', async () => {
    const auth = {
      signInWithIdToken: jest.fn().mockResolvedValue({
        data: { session: null },
        error: { message: 'token inválido' },
      }),
    };
    mockGetSupabaseClient.mockReturnValue({ auth } as never);

    await expect(tryNativeGoogleSignIn()).resolves.toEqual({
      errorMessage: 'token inválido',
      status: 'failed',
    });
  });
});
