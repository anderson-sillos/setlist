import * as AppleAuthentication from 'expo-apple-authentication';
import * as ExpoCrypto from 'expo-crypto';

import { getSupabaseClient } from '@/data/supabase/client';
import { tryNativeAppleSignIn } from '@/features/auth/nativeAppleSignIn';

jest.mock('expo-apple-authentication', () => ({
  AppleAuthenticationScope: { EMAIL: 0, FULL_NAME: 1 },
  isAvailableAsync: jest.fn(),
  signInAsync: jest.fn(),
}));

jest.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  CryptoEncoding: { HEX: 'hex' },
  digestStringAsync: jest.fn(),
  randomUUID: jest.fn(),
}));

jest.mock('@/data/supabase/client', () => ({
  getSupabaseClient: jest.fn(),
}));

const mockAppleAuthentication = jest.mocked(AppleAuthentication);
const mockExpoCrypto = jest.mocked(ExpoCrypto);
const mockGetSupabaseClient = jest.mocked(getSupabaseClient);
const mockConsoleInfo = jest
  .spyOn(console, 'info')
  .mockImplementation(() => undefined);

function createAuthMock() {
  return {
    signInWithIdToken: jest.fn().mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    }),
    updateUser: jest.fn().mockResolvedValue({ error: null }),
  };
}

describe('login nativo com Apple', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAppleAuthentication.isAvailableAsync.mockResolvedValue(true);
    mockAppleAuthentication.signInAsync.mockResolvedValue({
      identityToken: 'identity-token',
      fullName: null,
    } as never);
    mockExpoCrypto.randomUUID.mockReturnValue('raw-nonce');
    mockExpoCrypto.digestStringAsync.mockResolvedValue('hashed-nonce');
    mockGetSupabaseClient.mockReturnValue({ auth: createAuthMock() } as never);
  });

  afterAll(() => {
    mockConsoleInfo.mockRestore();
  });

  it('retorna unsupported quando a Apple não está disponível', async () => {
    mockAppleAuthentication.isAvailableAsync.mockResolvedValue(false);

    await expect(tryNativeAppleSignIn('invite-1')).resolves.toEqual({
      inviteToken: 'invite-1',
      status: 'unsupported',
    });
    expect(mockAppleAuthentication.signInAsync).not.toHaveBeenCalled();
  });

  it('retorna unsupported se a verificação de disponibilidade falha', async () => {
    mockAppleAuthentication.isAvailableAsync.mockRejectedValue(
      new Error('native module unavailable'),
    );

    await expect(tryNativeAppleSignIn()).resolves.toEqual({
      status: 'unsupported',
    });
  });

  it('troca o token Apple no Supabase usando nonce e preserva o convite', async () => {
    const auth = createAuthMock();
    mockGetSupabaseClient.mockReturnValue({ auth } as never);
    mockAppleAuthentication.signInAsync.mockResolvedValue({
      identityToken: 'identity-token',
      fullName: {
        givenName: 'Ada',
        middleName: null,
        familyName: 'Lovelace',
      },
    } as never);

    await expect(tryNativeAppleSignIn('invite-1')).resolves.toEqual({
      inviteToken: 'invite-1',
      session: { user: { id: 'user-1' } },
      status: 'authenticated',
    });
    expect(mockExpoCrypto.digestStringAsync).toHaveBeenCalledWith(
      ExpoCrypto.CryptoDigestAlgorithm.SHA256,
      'raw-nonce',
      { encoding: ExpoCrypto.CryptoEncoding.HEX },
    );
    expect(mockAppleAuthentication.signInAsync).toHaveBeenCalledWith({
      nonce: 'hashed-nonce',
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      ],
    });
    expect(auth.signInWithIdToken).toHaveBeenCalledWith({
      nonce: 'raw-nonce',
      provider: 'apple',
      token: 'identity-token',
    });
    expect(auth.updateUser).toHaveBeenCalledWith({
      data: { full_name: 'Ada Lovelace' },
    });
  });

  it('retorna falha se a Apple não devolve identity token', async () => {
    mockAppleAuthentication.signInAsync.mockResolvedValue({
      identityToken: null,
      fullName: null,
    } as never);

    await expect(tryNativeAppleSignIn()).resolves.toMatchObject({
      status: 'failed',
      errorMessage: expect.stringContaining('token de identidade'),
    });
    expect(mockGetSupabaseClient).not.toHaveBeenCalled();
  });

  it('retorna falha quando o Supabase rejeita a troca do token', async () => {
    const auth = createAuthMock();
    auth.signInWithIdToken.mockResolvedValue({
      data: { session: null },
      error: new Error('provider error'),
    });
    mockGetSupabaseClient.mockReturnValue({ auth } as never);

    await expect(tryNativeAppleSignIn()).resolves.toMatchObject({
      status: 'failed',
      errorMessage: expect.stringContaining('Verifique a configuração'),
    });
  });

  it('trata cancelamento e exceções inesperadas sem perder o contexto', async () => {
    mockAppleAuthentication.signInAsync.mockRejectedValue({
      code: 'ERR_REQUEST_CANCELED',
      message: 'cancelled',
    });
    await expect(tryNativeAppleSignIn('invite-1')).resolves.toEqual({
      inviteToken: 'invite-1',
      status: 'cancelled',
    });

    mockAppleAuthentication.signInAsync.mockRejectedValue(
      new Error('native failure'),
    );
    await expect(tryNativeAppleSignIn('invite-2')).resolves.toMatchObject({
      inviteToken: 'invite-2',
      status: 'failed',
    });
    expect(mockConsoleInfo).toHaveBeenCalledWith(
      '[auth:native-apple] failed',
      expect.objectContaining({ message: 'native failure' }),
    );
  });

  it('usa detalhe seguro quando a exceção não tem uma mensagem textual', async () => {
    mockAppleAuthentication.signInAsync.mockRejectedValue({
      code: 42,
      message: 42,
    });

    await expect(tryNativeAppleSignIn()).resolves.toMatchObject({
      status: 'failed',
    });
    expect(mockConsoleInfo).toHaveBeenCalledWith('[auth:native-apple] failed', {
      message: 'Erro nativo sem mensagem.',
    });
  });

  it('não emite logs de depuração em produção ao capturar um valor não textual', async () => {
    Object.defineProperty(globalThis, '__DEV__', {
      configurable: true,
      value: false,
    });
    mockAppleAuthentication.signInAsync.mockRejectedValue(null);

    try {
      await expect(tryNativeAppleSignIn()).resolves.toMatchObject({
        status: 'failed',
        errorMessage: expect.stringContaining('Tente novamente'),
      });
      expect(mockConsoleInfo).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(globalThis, '__DEV__', {
        configurable: true,
        value: true,
      });
    }
  });

  it('conclui sem nome na credencial e aceita sessão ausente do Supabase', async () => {
    const auth = createAuthMock();
    auth.signInWithIdToken.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    mockGetSupabaseClient.mockReturnValue({ auth } as never);
    mockAppleAuthentication.signInAsync.mockResolvedValue({
      identityToken: 'identity-token',
      fullName: null,
    } as never);

    await expect(tryNativeAppleSignIn()).resolves.toEqual({
      session: undefined,
      status: 'authenticated',
    });
    expect(auth.updateUser).not.toHaveBeenCalled();
  });

  it('mantém a sessão válida mesmo se não conseguir salvar o nome Apple', async () => {
    const auth = createAuthMock();
    auth.updateUser.mockResolvedValue({ error: new Error('profile error') });
    mockGetSupabaseClient.mockReturnValue({ auth } as never);
    mockAppleAuthentication.signInAsync.mockResolvedValue({
      identityToken: 'identity-token',
      fullName: {
        givenName: 'Ada',
        middleName: null,
        familyName: 'Lovelace',
      },
    } as never);

    await expect(tryNativeAppleSignIn()).resolves.toMatchObject({
      session: { user: { id: 'user-1' } },
      status: 'authenticated',
    });
    expect(mockConsoleInfo).toHaveBeenCalledWith(
      '[auth:native-apple] profile_name_save_failed',
    );
  });
});
