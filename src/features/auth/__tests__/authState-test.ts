import { Platform } from 'react-native';

import {
  clearOAuthState,
  consumeOAuthState,
  createOAuthState,
} from '@/features/auth/authState';

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'state-generated'),
}));

const mockSecureValues = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  deleteItemAsync: jest.fn(async (key: string) => {
    mockSecureValues.delete(key);
  }),
  getItemAsync: jest.fn(
    async (key: string) => mockSecureValues.get(key) ?? null,
  ),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockSecureValues.set(key, value);
  }),
}));

describe('estado de proteção do retorno OAuth', () => {
  const platform = Platform.OS;
  const originalWindow = (globalThis as { window?: unknown }).window;

  afterEach(async () => {
    await clearOAuthState();
    mockSecureValues.clear();
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: platform,
    });
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: originalWindow,
    });
  });

  it('cria e consome um state apenas uma vez em memória e no SecureStore', async () => {
    await expect(createOAuthState()).resolves.toBe('state-generated');
    expect(mockSecureValues.get('setlist.oauth.state')).toBe('state-generated');
    await expect(consumeOAuthState('state-generated')).resolves.toBe(true);
    await expect(consumeOAuthState('state-generated')).resolves.toBe(false);
    expect(mockSecureValues.has('setlist.oauth.state')).toBe(false);
  });

  it('usa sessionStorage no navegador e rejeita state diferente', async () => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: 'web',
    });
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      removeItem: (key: string) => values.delete(key),
      setItem: (key: string, value: string) => values.set(key, value),
    };
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { sessionStorage: storage },
    });

    await createOAuthState();
    expect(window.sessionStorage.getItem('setlist.oauth.state')).toBe(
      'state-generated',
    );
    await expect(consumeOAuthState('outro-state')).resolves.toBe(false);
    expect(window.sessionStorage.getItem('setlist.oauth.state')).toBeNull();
  });
});
