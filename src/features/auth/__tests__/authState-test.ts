import { Platform } from 'react-native';

import {
  clearOAuthState,
  consumeOAuthState,
  createOAuthState,
} from '@/features/auth/authState';

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'state-generated'),
}));

describe('estado de proteção do retorno OAuth', () => {
  const platform = Platform.OS;
  const originalWindow = (globalThis as { window?: unknown }).window;

  afterEach(() => {
    clearOAuthState();
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: platform,
    });
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: originalWindow,
    });
  });

  it('cria e consome um state apenas uma vez em memória', () => {
    expect(createOAuthState()).toBe('state-generated');
    expect(consumeOAuthState('state-generated')).toBe(true);
    expect(consumeOAuthState('state-generated')).toBe(false);
  });

  it('usa sessionStorage no navegador e rejeita state diferente', () => {
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

    createOAuthState();
    expect(window.sessionStorage.getItem('setlist.oauth.state')).toBe(
      'state-generated',
    );
    expect(consumeOAuthState('outro-state')).toBe(false);
    expect(window.sessionStorage.getItem('setlist.oauth.state')).toBeNull();
  });
});
