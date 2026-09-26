import * as ExpoCrypto from 'expo-crypto';
import { Platform } from 'react-native';

type RuntimeCrypto = {
  readonly getRandomValues?: <T extends ArrayBufferView>(values: T) => T;
  readonly subtle?: {
    readonly digest?: (
      algorithm: AlgorithmIdentifier,
      data: BufferSource,
    ) => Promise<ArrayBuffer>;
  };
};

type RuntimeGlobals = typeof globalThis & {
  crypto?: RuntimeCrypto;
  TextEncoder?: typeof TextEncoder;
  btoa?: (value: string) => string;
};

const runtimeGlobals = globalThis as RuntimeGlobals;

class Utf8TextEncoder {
  readonly encoding = 'utf-8';

  encode(value = ''): Uint8Array {
    const bytes: number[] = [];

    for (let index = 0; index < value.length; index += 1) {
      const codePoint = value.codePointAt(index) ?? 0;

      if (codePoint > 0xffff) {
        index += 1;
      }

      if (codePoint <= 0x7f) {
        bytes.push(codePoint);
      } else if (codePoint <= 0x7ff) {
        bytes.push(0xc0 | (codePoint >> 6), 0x80 | (codePoint & 0x3f));
      } else if (codePoint <= 0xffff) {
        bytes.push(
          0xe0 | (codePoint >> 12),
          0x80 | ((codePoint >> 6) & 0x3f),
          0x80 | (codePoint & 0x3f),
        );
      } else {
        bytes.push(
          0xf0 | (codePoint >> 18),
          0x80 | ((codePoint >> 12) & 0x3f),
          0x80 | ((codePoint >> 6) & 0x3f),
          0x80 | (codePoint & 0x3f),
        );
      }
    }

    return Uint8Array.from(bytes);
  }

  encodeInto(
    value: string,
    destination: Uint8Array,
  ): { readonly read: number; readonly written: number } {
    const encoded = this.encode(value);
    const written = Math.min(encoded.length, destination.length);
    destination.set(encoded.subarray(0, written));

    return { read: value.length, written };
  }
}

const BASE64_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function encodeBase64(value: string): string {
  let result = '';

  for (let index = 0; index < value.length; index += 3) {
    const first = value.charCodeAt(index);
    const second = value.charCodeAt(index + 1);
    const third = value.charCodeAt(index + 2);
    const hasSecond = !Number.isNaN(second);
    const hasThird = !Number.isNaN(third);

    result += BASE64_ALPHABET[first >> 2];
    result += BASE64_ALPHABET[((first & 0x03) << 4) | (second >> 4)];
    result += hasSecond
      ? BASE64_ALPHABET[((second & 0x0f) << 2) | (third >> 6)]
      : '=';
    result += hasThird ? BASE64_ALPHABET[third & 0x3f] : '=';
  }

  return result;
}

function normalizeBytes(data: BufferSource): Uint8Array {
  if (data instanceof ArrayBuffer) {
    return new Uint8Array(data);
  }

  return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
}

function hexToArrayBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);

  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }

  return bytes.buffer;
}

async function digestSha256(
  algorithm: AlgorithmIdentifier,
  data: BufferSource,
): Promise<ArrayBuffer> {
  const algorithmName =
    typeof algorithm === 'string' ? algorithm : algorithm.name;

  if (algorithmName.toUpperCase() !== 'SHA-256') {
    throw new Error('O polyfill WebCrypto do Setlist suporta somente SHA-256.');
  }

  // Supabase's PKCE verifier uses the ASCII-only RFC 7636 alphabet. Passing
  // those bytes as a string avoids the ArrayBuffer bridge issue in Expo Go's
  // Android Kotlin module while preserving the exact input to SHA-256.
  const verifier = String.fromCharCode(...normalizeBytes(data));
  const digest = await ExpoCrypto.digestStringAsync(
    ExpoCrypto.CryptoDigestAlgorithm.SHA256,
    verifier,
    { encoding: ExpoCrypto.CryptoEncoding.HEX },
  );

  return hexToArrayBuffer(digest);
}

function installTextEncoder(): void {
  if (typeof runtimeGlobals.TextEncoder === 'function') {
    return;
  }

  Object.defineProperty(runtimeGlobals, 'TextEncoder', {
    configurable: true,
    enumerable: false,
    value: Utf8TextEncoder,
    writable: true,
  });
}

function installBase64Encoder(): void {
  if (typeof runtimeGlobals.btoa === 'function') {
    return;
  }

  Object.defineProperty(runtimeGlobals, 'btoa', {
    configurable: true,
    enumerable: false,
    value: encodeBase64,
    writable: true,
  });
}

/**
 * Expo Crypto exposes native primitives but does not install the browser
 * `crypto.subtle` surface consumed by Supabase Auth's PKCE implementation.
 * Keep the secure SHA-256 challenge available in Expo Go and development
 * builds instead of allowing auth-js to downgrade PKCE to `plain`.
 */
export function installWebCryptoPolyfill(): void {
  if (Platform.OS === 'web') {
    return;
  }

  installTextEncoder();
  installBase64Encoder();

  const currentCrypto = runtimeGlobals.crypto;
  const getRandomValues =
    currentCrypto?.getRandomValues?.bind(currentCrypto) ??
    ExpoCrypto.getRandomValues;
  // Expo Go may expose a partial `crypto.subtle` object. Always route SHA-256
  // through the native Expo implementation on mobile so a partial WebCrypto
  // surface cannot fail midway through the OAuth request.
  const digest = digestSha256;

  Object.defineProperty(runtimeGlobals, 'crypto', {
    configurable: true,
    enumerable: true,
    value: {
      ...currentCrypto,
      getRandomValues,
      subtle: {
        ...currentCrypto?.subtle,
        digest,
      },
    },
    writable: true,
  });
}

installWebCryptoPolyfill();
