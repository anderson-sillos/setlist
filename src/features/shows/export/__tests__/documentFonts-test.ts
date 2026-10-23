import { Asset } from 'expo-asset';
import * as Font from 'expo-font';
import { File } from 'expo-file-system';
import { Platform } from 'react-native';

import {
  documentFontkit,
  loadDocumentFontResources,
  measureDocumentText,
} from '../documentFonts';

jest.mock('expo-asset', () => ({ Asset: { loadAsync: jest.fn() } }));
jest.mock('expo-font', () => ({ loadAsync: jest.fn() }));
jest.mock('expo-file-system', () => ({ File: jest.fn() }));
jest.mock('@pdf-lib/fontkit', () => ({ create: jest.fn() }));

describe('document font resources', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retries after a missing local font and caches loaded resources', async () => {
    const missingLocalFile = {
      uri: 'asset://regular',
      localUri: null,
      downloadAsync: jest.fn().mockResolvedValue(undefined),
    };
    const boldAsset = {
      uri: 'asset://bold',
      localUri: '/cache/bold.ttf',
      downloadAsync: jest.fn().mockResolvedValue(undefined),
    };
    const regularWebAsset = {
      uri: 'https://assets.test/regular.ttf',
      localUri: null,
      downloadAsync: jest.fn().mockResolvedValue(undefined),
    };
    const boldWebAsset = {
      uri: 'https://assets.test/bold.ttf',
      localUri: undefined,
      downloadAsync: jest.fn().mockResolvedValue(undefined),
    };
    const font = {
      layout: jest.fn(() => ({ advanceWidth: 600 })),
      unitsPerEm: 1000,
    };
    jest
      .mocked(Asset.loadAsync)
      .mockResolvedValueOnce([missingLocalFile, boldAsset] as never)
      .mockResolvedValueOnce([regularWebAsset, boldWebAsset] as never)
      .mockResolvedValueOnce([regularWebAsset, boldWebAsset] as never);
    jest.mocked(Font.loadAsync).mockResolvedValue(undefined);
    (File as unknown as jest.Mock).mockImplementation((uri: string) => ({
      bytes: jest
        .fn()
        .mockResolvedValue(uri.includes('regular') ? [1, 2] : [3, 4]),
    }));
    jest.mocked(documentFontkit.create).mockReturnValue(font as never);

    await expect(loadDocumentFontResources()).rejects.toThrow(
      'O arquivo local da fonte não está disponível.',
    );

    const previousPlatform = Platform.OS;
    const previousFetch = globalThis.fetch;
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
    globalThis.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => new Uint8Array([3, 4]).buffer,
      })
      .mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => new Uint8Array([1, 2]).buffer,
      })
      .mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => new Uint8Array([3, 4]).buffer,
      }) as unknown as typeof fetch;
    try {
      await expect(loadDocumentFontResources()).rejects.toThrow(
        'Não foi possível carregar a fonte (503).',
      );

      const resourcesPromise = loadDocumentFontResources();
      const resources = await resourcesPromise;

      expect(loadDocumentFontResources()).toBe(resourcesPromise);
      expect(Asset.loadAsync).toHaveBeenCalledTimes(3);
      expect(Font.loadAsync).toHaveBeenCalledTimes(3);
      expect(documentFontkit.create).toHaveBeenCalledTimes(2);
      expect(Array.from(resources.regularBytes)).toEqual([1, 2]);
      expect(Array.from(resources.boldBytes)).toEqual([3, 4]);
      expect(resources.regularUri).toBe(regularWebAsset.uri);
      expect(resources.boldUri).toBe(boldWebAsset.uri);
      expect(measureDocumentText('á🎸', 10)).toBe(10.4);
      expect(measureDocumentText('texto', 10, true, font as never)).toBe(6);
      expect(font.layout).toHaveBeenCalledWith('texto');
    } finally {
      Object.defineProperty(Platform, 'OS', {
        configurable: true,
        value: previousPlatform,
      });
      globalThis.fetch = previousFetch;
    }
  });
});
