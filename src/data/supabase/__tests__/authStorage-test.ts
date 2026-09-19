import * as SecureStore from 'expo-secure-store';

import { nativeAuthStorage } from '@/data/supabase/authStorage';

jest.mock('expo-secure-store', () => ({
  deleteItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

const secureStoreMock = jest.mocked(SecureStore);

describe('armazenamento seguro de autenticação', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('persiste e recupera apenas verificadores no SecureStore', async () => {
    const key = 'sb-setlist-auth-token-flow-demo-code-verifier';
    secureStoreMock.getItemAsync.mockResolvedValue('old-verifier-from-device');

    await nativeAuthStorage.setItem(key, 'verifier-from-auth');
    await expect(nativeAuthStorage.getItem(key)).resolves.toBe(
      'verifier-from-auth',
    );
    await nativeAuthStorage.removeItem(key);

    expect(secureStoreMock.setItemAsync).toHaveBeenCalledWith(
      'setlist-pkce-sb-setlist-auth-token-flow-demo-code-verifier',
      'verifier-from-auth',
    );
    expect(secureStoreMock.deleteItemAsync).toHaveBeenCalledWith(
      'setlist-pkce-sb-setlist-auth-token-flow-demo-code-verifier',
    );
  });

  it('recupera do SecureStore quando o processo não tem o verifier em memória', async () => {
    const key = 'sb-setlist-auth-token-flow-restored-code-verifier';
    secureStoreMock.getItemAsync.mockResolvedValue('verifier-restored');

    await expect(nativeAuthStorage.getItem(key)).resolves.toBe(
      'verifier-restored',
    );
    expect(secureStoreMock.getItemAsync).toHaveBeenCalledWith(
      'setlist-pkce-sb-setlist-auth-token-flow-restored-code-verifier',
    );
  });

  it('ignora chaves que não pertencem ao armazenamento de autenticação', async () => {
    await nativeAuthStorage.setItem('unrelated-storage-key', 'value');

    await expect(
      nativeAuthStorage.getItem('unrelated-storage-key'),
    ).resolves.toBeNull();
    await nativeAuthStorage.removeItem('unrelated-storage-key');

    expect(secureStoreMock.setItemAsync).not.toHaveBeenCalled();
    expect(secureStoreMock.getItemAsync).not.toHaveBeenCalled();
    expect(secureStoreMock.deleteItemAsync).not.toHaveBeenCalled();
  });

  it('usa o fallback em memória quando o SecureStore falha', async () => {
    const key = 'sb-setlist-auth-token-code-verifier';
    secureStoreMock.getItemAsync.mockRejectedValue(new Error('unavailable'));
    secureStoreMock.setItemAsync.mockRejectedValue(new Error('unavailable'));

    await nativeAuthStorage.setItem(key, 'memory-verifier');

    await expect(nativeAuthStorage.getItem(key)).resolves.toBe(
      'memory-verifier',
    );
  });

  it('persiste e restaura a sessão no SecureStore', async () => {
    const key = 'sb-setlist-auth-token';
    const session = JSON.stringify({ access_token: 'redacted' });

    await nativeAuthStorage.setItem(key, session);

    expect(secureStoreMock.setItemAsync).toHaveBeenCalledWith(
      'setlist-session-sb-setlist-auth-token',
      session,
    );

    await nativeAuthStorage.removeItem(key);
    expect(secureStoreMock.deleteItemAsync).toHaveBeenCalledWith(
      'setlist-session-sb-setlist-auth-token',
    );

    secureStoreMock.getItemAsync.mockResolvedValue(session);
    await expect(nativeAuthStorage.getItem(key)).resolves.toBe(session);
    expect(secureStoreMock.getItemAsync).toHaveBeenCalledWith(
      'setlist-session-sb-setlist-auth-token',
    );
  });

  it('usa o fallback em memória para a sessão quando o SecureStore falha', async () => {
    const key = 'sb-setlist-auth-token';
    secureStoreMock.setItemAsync.mockRejectedValue(new Error('unavailable'));

    await nativeAuthStorage.setItem(key, 'session-in-memory');

    await expect(nativeAuthStorage.getItem(key)).resolves.toBe(
      'session-in-memory',
    );
  });
});
