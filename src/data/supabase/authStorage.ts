import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { SupportedStorage } from '@supabase/supabase-js';

const PKCE_KEY_SUFFIX = '-code-verifier';
const AUTH_SESSION_KEY_SUFFIX = '-auth-token';
const SECURE_STORE_VALUE_LIMIT_BYTES = 2048;
const SECURE_STORE_CHUNK_BYTES = 1800;
const CHUNK_MANIFEST_PREFIX = 'setlist-auth-chunks-v1:';
const memoryFallback = new Map<string, string>();

interface ChunkManifest {
  readonly chunkCount: number;
  readonly id: string;
}

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

function getUtf8ByteCount(value: string): number {
  let bytes = 0;
  for (const character of value) {
    const codePoint = character.codePointAt(0) ?? 0;
    bytes +=
      codePoint <= 0x7f
        ? 1
        : codePoint <= 0x7ff
          ? 2
          : codePoint <= 0xffff
            ? 3
            : 4;
  }
  return bytes;
}

function splitIntoSecureStoreChunks(value: string): string[] {
  const chunks: string[] = [];
  let currentChunk = '';
  let currentChunkBytes = 0;

  for (const character of value) {
    const characterBytes = getUtf8ByteCount(character);
    if (currentChunkBytes + characterBytes > SECURE_STORE_CHUNK_BYTES) {
      chunks.push(currentChunk);
      currentChunk = '';
      currentChunkBytes = 0;
    }
    currentChunk += character;
    currentChunkBytes += characterBytes;
  }

  if (currentChunk.length > 0) chunks.push(currentChunk);
  return chunks;
}

function parseChunkManifest(value: string | null): ChunkManifest | null {
  if (!value?.startsWith(CHUNK_MANIFEST_PREFIX)) return null;
  const match = /^setlist-auth-chunks-v1:([a-z0-9]+):(\d+)$/.exec(value);
  if (!match) return null;

  const chunkCount = Number(match[2]);
  if (!Number.isSafeInteger(chunkCount) || chunkCount < 1) return null;
  return { id: match[1], chunkCount };
}

function getChunkKey(
  secureStoreKey: string,
  manifest: ChunkManifest,
  index: number,
) {
  return `${secureStoreKey}-chunk-${manifest.id}-${index}`;
}

async function readSecureStoreValue(
  secureStoreKey: string,
): Promise<string | null> {
  const storedValue = await SecureStore.getItemAsync(secureStoreKey);
  const manifest = parseChunkManifest(storedValue);
  if (!manifest) {
    if (
      storedValue !== null &&
      getUtf8ByteCount(storedValue) > SECURE_STORE_VALUE_LIMIT_BYTES
    ) {
      try {
        await writeSecureStoreValue(secureStoreKey, storedValue);
      } catch {
        // Mantém a sessão legada legível se a migração não puder ser concluída.
      }
    }
    return storedValue;
  }

  const chunks = await Promise.all(
    Array.from({ length: manifest.chunkCount }, (_, index) =>
      SecureStore.getItemAsync(getChunkKey(secureStoreKey, manifest, index)),
    ),
  );
  return chunks.every((chunk): chunk is string => chunk !== null)
    ? chunks.join('')
    : null;
}

async function removeChunkValues(
  secureStoreKey: string,
  manifest: ChunkManifest,
): Promise<void> {
  await Promise.all(
    Array.from({ length: manifest.chunkCount }, (_, index) =>
      SecureStore.deleteItemAsync(getChunkKey(secureStoreKey, manifest, index)),
    ),
  );
}

async function writeSecureStoreValue(
  secureStoreKey: string,
  value: string,
): Promise<void> {
  const previousManifest = parseChunkManifest(
    await SecureStore.getItemAsync(secureStoreKey),
  );

  if (getUtf8ByteCount(value) <= SECURE_STORE_VALUE_LIMIT_BYTES) {
    await SecureStore.setItemAsync(secureStoreKey, value);
    if (previousManifest) {
      await removeChunkValues(secureStoreKey, previousManifest);
    }
    return;
  }

  const chunks = splitIntoSecureStoreChunks(value);
  const manifest: ChunkManifest = {
    chunkCount: chunks.length,
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`,
  };

  await Promise.all(
    chunks.map((chunk, index) =>
      SecureStore.setItemAsync(
        getChunkKey(secureStoreKey, manifest, index),
        chunk,
      ),
    ),
  );
  await SecureStore.setItemAsync(
    secureStoreKey,
    `${CHUNK_MANIFEST_PREFIX}${manifest.id}:${manifest.chunkCount}`,
  );

  if (previousManifest) {
    await removeChunkValues(secureStoreKey, previousManifest);
  }
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
      return await readSecureStoreValue(getSecureStoreKey(key));
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
      await writeSecureStoreValue(getSecureStoreKey(key), value);
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
      const secureStoreKey = getSecureStoreKey(key);
      const manifest = parseChunkManifest(
        await SecureStore.getItemAsync(secureStoreKey),
      );
      await SecureStore.deleteItemAsync(secureStoreKey);
      if (manifest) await removeChunkValues(secureStoreKey, manifest);
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
