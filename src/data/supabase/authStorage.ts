import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { SupportedStorage } from '@supabase/supabase-js';

const PKCE_KEY_SUFFIX = '-code-verifier';
const AUTH_SESSION_KEY_SUFFIX = '-auth-token';
const memoryFallback = new Map<string, string>();

function isPkceKey(key: string): boolean {
  return key.endsWith(PKCE_KEY_SUFFIX);
}

function isAuthSessionKey(key: string): boolean {
  return key.startsWith('sb-') && key.endsWith(AUTH_SESSION_KEY_SUFFIX);
}

function isSupportedKey(key: string): boolean {
  return isPkceKey(key) || isAuthSessionKey(key);
}

function getSecureStoreKey(key: string): string {
  const namespace = isPkceKey(key) ? 'pkce' : 'session';
  return `setlist-${namespace}-${encodeURIComponent(key)}`;
}

/**
 * Persiste a sessão do Supabase e os verificadores temporários do fluxo PKCE
 * no SecureStore dos aplicativos móveis.
 *
 * O verificador precisa sobreviver ao retorno do navegador porque o Android
 * pode recriar o processo antes de entregar o deep link ao Expo Go ou ao
 * development build. O fallback em memória mantém o fluxo funcional quando o
 * SecureStore não estiver disponível, mas não substitui sua persistência entre
 * reinícios.
 */
export const nativeAuthStorage: SupportedStorage = {
  async getItem(key) {
    if (!isSupportedKey(key)) {
      return null;
    }

    const memoryValue = memoryFallback.get(key);

    // Durante o processo atual, o valor em memória é a gravação mais recente
    // e deve vencer um valor antigo que ainda possa estar no SecureStore.
    // Isso evita reutilizar o verifier de uma tentativa anterior do OAuth.
    if (memoryValue !== undefined) {
      return memoryValue;
    }

    try {
      const secureValue = await SecureStore.getItemAsync(
        getSecureStoreKey(key),
      );
      return secureValue ?? null;
    } catch {
      return null;
    }
  },

  async setItem(key, value) {
    if (!isSupportedKey(key)) {
      return;
    }

    memoryFallback.set(key, value);

    try {
      await SecureStore.setItemAsync(getSecureStoreKey(key), value);
    } catch {
      // O fallback em memória mantém o fluxo funcional quando o armazenamento
      // seguro não estiver disponível no ambiente de teste.
    }
  },

  async removeItem(key) {
    if (!isSupportedKey(key)) {
      return;
    }

    memoryFallback.delete(key);

    try {
      await SecureStore.deleteItemAsync(getSecureStoreKey(key));
    } catch {
      // A remoção local já evita que um verificador seja reutilizado no fluxo.
    }
  },
};

/** @deprecated Use `nativeAuthStorage`; kept for existing PKCE consumers. */
export const nativePkceStorage = nativeAuthStorage;

export function getSupabaseAuthStorage(): SupportedStorage | undefined {
  return Platform.OS === 'web' ? undefined : nativeAuthStorage;
}
