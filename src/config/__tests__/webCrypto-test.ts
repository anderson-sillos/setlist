import { Platform } from 'react-native';
import { installWebCryptoPolyfill } from '@/config/webCrypto';

jest.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  digest: jest.fn(async () => Uint8Array.from([1, 2, 3]).buffer),
  getRandomValues: jest.fn(<T extends ArrayBufferView>(values: T) => {
    new Uint8Array(values.buffer, values.byteOffset, values.byteLength).fill(7);
    return values;
  }),
}));

jest.mock('expo-standard-web-crypto', () => ({
  __esModule: true,
  default: {
    getRandomValues: jest.fn(<T extends ArrayBufferView>(values: T) => {
      new Uint8Array(values.buffer, values.byteOffset, values.byteLength).fill(
        9,
      );
      return values;
    }),
  },
}));

type TestGlobals = typeof globalThis & {
  crypto?: {
    getRandomValues?: <T extends ArrayBufferView>(values: T) => T;
    subtle?: { digest?: (...args: never[]) => Promise<ArrayBuffer> };
  };
  TextEncoder?: typeof TextEncoder;
  btoa?: (value: string) => string;
};

const testGlobals = globalThis as TestGlobals;
const platform = Platform.OS;
const originalDescriptors = {
  btoa: Object.getOwnPropertyDescriptor(testGlobals, 'btoa'),
  crypto: Object.getOwnPropertyDescriptor(testGlobals, 'crypto'),
  TextEncoder: Object.getOwnPropertyDescriptor(testGlobals, 'TextEncoder'),
};

function restoreGlobal(name: keyof typeof originalDescriptors): void {
  const descriptor = originalDescriptors[name];
  if (descriptor) {
    Object.defineProperty(testGlobals, name, descriptor);
  } else {
    delete (testGlobals as Record<string, unknown>)[name];
  }
}

describe('polyfill WebCrypto do Expo', () => {
  afterEach(() => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: platform,
    });
    restoreGlobal('btoa');
    restoreGlobal('crypto');
    restoreGlobal('TextEncoder');
  });

  it('mantém PKCE compatível quando o runtime nativo não oferece WebCrypto', async () => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: 'android',
    });
    Object.defineProperty(testGlobals, 'crypto', {
      configurable: true,
      value: {},
      writable: true,
    });
    delete (testGlobals as Record<string, unknown>).TextEncoder;
    delete (testGlobals as Record<string, unknown>).btoa;

    installWebCryptoPolyfill();

    const encoder = new testGlobals.TextEncoder!();
    expect(Array.from(encoder.encode('Aç𝄞'))).toEqual([
      0x41, 0xc3, 0xa7, 0xf0, 0x9d, 0x84, 0x9e,
    ]);
    const destination = new Uint8Array(2);
    expect(encoder.encodeInto('ok', destination)).toEqual({
      read: 2,
      written: 2,
    });
    expect(Array.from(destination)).toEqual([0x6f, 0x6b]);
    expect(testGlobals.btoa!(String.fromCharCode(1, 2, 3))).toBe('AQID');
    expect(testGlobals.btoa!(String.fromCharCode(1))).toBe('AQ==');
    expect(testGlobals.btoa!(String.fromCharCode(1, 2))).toBe('AQI=');

    const digest = await testGlobals.crypto!.subtle!.digest!(
      'SHA-256',
      new Uint8Array([1]),
    );
    expect(Array.from(new Uint8Array(digest))).toEqual([1, 2, 3]);
    const values = new Uint8Array(3);
    expect(testGlobals.crypto!.getRandomValues!(values)).toBe(values);
    expect(Array.from(values)).toEqual([9, 9, 9]);
  });

  it('aceita o identificador de algoritmo no formato de objeto e rejeita outros hashes', async () => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: 'ios',
    });
    Object.defineProperty(testGlobals, 'crypto', {
      configurable: true,
      value: {},
      writable: true,
    });

    installWebCryptoPolyfill();

    await expect(
      testGlobals.crypto!.subtle!.digest!(
        { name: 'SHA-256' },
        new Uint8Array(),
      ),
    ).resolves.toBeInstanceOf(ArrayBuffer);
    await expect(
      testGlobals.crypto!.subtle!.digest!('SHA-1', new Uint8Array()),
    ).rejects.toThrow('somente SHA-256');
  });

  it('não altera os globais na web', () => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: 'web',
    });
    const existingCrypto = { subtle: {} };
    Object.defineProperty(testGlobals, 'crypto', {
      configurable: true,
      value: existingCrypto,
      writable: true,
    });

    installWebCryptoPolyfill();

    expect(testGlobals.crypto).toBe(existingCrypto);
  });
});
