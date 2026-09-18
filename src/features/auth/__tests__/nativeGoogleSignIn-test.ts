import { Platform } from 'react-native';

import { getPublicEnvironment } from '@/config/environment';
import { getSupabaseClient } from '@/data/supabase/client';
import {
  isNativeGoogleSignInAvailable,
  tryNativeGoogleSignIn,
} from '@/features/auth/nativeGoogleSignIn';
import { loadNativeGoogleModule } from '@/features/auth/nativeGoogleModule';

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
  loadNativeGoogleModule: jest.fn(),
}));

jest.mock('react-native-nitro-google-signin', () => ({
  GoogleOneTapSignIn: {
    checkPlayServices: jest.fn(),
    configure: jest.fn(),
    createAccount: jest.fn(),
    signIn: jest.fn(),
  },
  isCancelledResponse: jest.fn(
    (response: { type?: string }) => response.type === 'cancelled',
  ),
  isNoSavedCredentialFoundResponse: jest.fn(
    (response: { type?: string }) => response.type === 'noSavedCredentialFound',
  ),
  isSuccessResponse: jest.fn(
    (response: { type?: string }) => response.type === 'success',
  ),
}));

const mockGetPublicEnvironment = jest.mocked(getPublicEnvironment);
const mockGetSupabaseClient = jest.mocked(getSupabaseClient);
const mockLoadNativeGoogleModule = jest.mocked(loadNativeGoogleModule);
const mockConstants = jest.requireMock('expo-constants') as {
  appOwnership: string | null;
  executionEnvironment: string;
};
const mockGoogleModule = jest.requireMock(
  'react-native-nitro-google-signin',
) as {
  GoogleOneTapSignIn: {
    checkPlayServices: jest.Mock;
    configure: jest.Mock;
    createAccount: jest.Mock;
    signIn: jest.Mock;
  };
  isCancelledResponse: jest.Mock;
  isNoSavedCredentialFoundResponse: jest.Mock;
  isSuccessResponse: jest.Mock;
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
    mockGoogleModule.GoogleOneTapSignIn.checkPlayServices.mockResolvedValue(
      undefined,
    );
    mockGoogleModule.GoogleOneTapSignIn.signIn.mockResolvedValue({
      data: { idToken: 'id-token' },
      type: 'success',
    });
    mockGoogleModule.isSuccessResponse.mockImplementation(
      (response: { type?: string }) => response.type === 'success',
    );
    mockGoogleModule.isCancelledResponse.mockImplementation(
      (response: { type?: string }) => response.type === 'cancelled',
    );
    mockGoogleModule.isNoSavedCredentialFoundResponse.mockImplementation(
      (response: { type?: string }) =>
        response.type === 'noSavedCredentialFound',
    );
    mockLoadNativeGoogleModule.mockResolvedValue(mockGoogleModule as never);

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

  it('retorna indisponível e registra o motivo fora do Android', async () => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: 'ios',
    });

    await expect(tryNativeGoogleSignIn()).resolves.toEqual({
      status: 'unsupported',
    });
    expect(JSON.stringify(mockConsoleInfo.mock.calls)).toContain('not_android');
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
    expect(mockGoogleModule.GoogleOneTapSignIn.configure).toHaveBeenCalledWith({
      webClientId: 'web-client-id',
    });
    expect(
      (mockGetSupabaseClient.mock.results[0]?.value as { auth: object }).auth,
    ).toBeDefined();

    const logText = mockConsoleInfo.mock.calls
      .map(([event, details]) => JSON.stringify({ event, details }))
      .join('\n');
    expect(logText).toContain('supabase_exchange_succeeded');
    expect(logText).not.toContain('id-token');
  });

  it('tenta criar uma conta quando não há credencial salva', async () => {
    mockGoogleModule.GoogleOneTapSignIn.signIn.mockResolvedValueOnce({
      type: 'noSavedCredentialFound',
    });
    mockGoogleModule.GoogleOneTapSignIn.createAccount.mockResolvedValueOnce({
      data: { idToken: 'created-id-token' },
      type: 'success',
    });

    await expect(tryNativeGoogleSignIn()).resolves.toMatchObject({
      status: 'authenticated',
    });
    expect(
      mockGoogleModule.GoogleOneTapSignIn.createAccount,
    ).toHaveBeenCalledTimes(1);
  });

  it('preserva o cancelamento sem iniciar o OAuth web', async () => {
    mockGoogleModule.GoogleOneTapSignIn.signIn.mockResolvedValueOnce({
      type: 'cancelled',
    });

    await expect(tryNativeGoogleSignIn()).resolves.toEqual({
      status: 'cancelled',
    });
  });

  it('retorna indisponível para uma resposta nativa inesperada', async () => {
    mockGoogleModule.GoogleOneTapSignIn.signIn.mockResolvedValueOnce({
      type: 'unknown',
    });

    await expect(tryNativeGoogleSignIn()).resolves.toEqual({
      status: 'unsupported',
    });
    expect(mockConsoleInfo.mock.calls.join(' ')).toContain(
      'unsupported_response',
    );
  });

  it('retorna indisponível quando a resposta não contém ID Token', async () => {
    mockGoogleModule.GoogleOneTapSignIn.signIn.mockResolvedValueOnce({
      data: {},
      type: 'success',
    });

    await expect(tryNativeGoogleSignIn()).resolves.toEqual({
      status: 'unsupported',
    });
    expect(mockConsoleInfo.mock.calls.join(' ')).toContain('id_token_missing');
  });

  it('retorna indisponível quando o módulo nativo falha', async () => {
    mockGoogleModule.GoogleOneTapSignIn.checkPlayServices.mockRejectedValueOnce(
      new Error('Play Services ausente'),
    );

    await expect(tryNativeGoogleSignIn()).resolves.toEqual({
      status: 'unsupported',
    });
  });

  it('preserva o diagnóstico quando o runtime rejeita sem um objeto Error', async () => {
    mockGoogleModule.GoogleOneTapSignIn.checkPlayServices.mockRejectedValueOnce(
      'Play Services ausente',
    );

    await expect(tryNativeGoogleSignIn()).resolves.toEqual({
      status: 'unsupported',
    });
    expect(mockConsoleInfo.mock.calls.join(' ')).toContain(
      'runtime_unavailable',
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
