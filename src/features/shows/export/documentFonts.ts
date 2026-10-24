import { Asset } from 'expo-asset';
import * as Font from 'expo-font';
import { File } from 'expo-file-system';
import { Platform } from 'react-native';
import * as fontkitModule from '@pdf-lib/fontkit';
import type { Font as FontkitFont } from '@pdf-lib/fontkit';

type FontkitApi = typeof fontkitModule;

export const documentFontkit = ((
  fontkitModule as unknown as { default?: FontkitApi }
).default ?? fontkitModule) as FontkitApi;

const regularFontModule =
  require('../../../../assets/fonts/Roboto-Regular.ttf') as number;
const boldFontModule =
  require('../../../../assets/fonts/Roboto-Bold.ttf') as number;

export interface DocumentFontResources {
  readonly regularBytes: Uint8Array;
  readonly boldBytes: Uint8Array;
  readonly regularFont: FontkitFont;
  readonly boldFont: FontkitFont;
  readonly regularUri: string;
  readonly boldUri: string;
}

let resourcesPromise: Promise<DocumentFontResources> | null = null;

async function readAssetBytes(asset: Asset): Promise<Uint8Array> {
  if (Platform.OS === 'web') {
    const response = await fetch(asset.uri);
    if (!response.ok) {
      throw new Error(
        `Não foi possível carregar a fonte (${response.status}).`,
      );
    }
    return new Uint8Array(await response.arrayBuffer());
  }

  await asset.downloadAsync();
  if (!asset.localUri) {
    throw new Error('O arquivo local da fonte não está disponível.');
  }
  return new File(asset.localUri).bytes();
}

export function loadDocumentFontResources(): Promise<DocumentFontResources> {
  if (!resourcesPromise) {
    resourcesPromise = (async () => {
      const [regularAsset, boldAsset] = await Asset.loadAsync([
        regularFontModule,
        boldFontModule,
      ]);
      await Font.loadAsync({
        SetlistRobotoBold: boldFontModule,
        SetlistRobotoRegular: regularFontModule,
      });
      const [regularBytes, boldBytes] = await Promise.all([
        readAssetBytes(regularAsset),
        readAssetBytes(boldAsset),
      ]);
      const regularFont = documentFontkit.create(regularBytes);
      const boldFont = documentFontkit.create(boldBytes);
      return {
        regularBytes,
        boldBytes,
        regularFont,
        boldFont,
        regularUri: regularAsset.localUri ?? regularAsset.uri,
        boldUri: boldAsset.localUri ?? boldAsset.uri,
      };
    })().catch((error) => {
      resourcesPromise = null;
      throw error;
    });
  }

  return resourcesPromise;
}

export function measureDocumentText(
  text: string,
  fontSize: number,
  bold = false,
  font?: FontkitFont,
): number {
  if (!font) return Array.from(text).length * fontSize * 0.52;
  return (font.layout(text).advanceWidth / font.unitsPerEm) * fontSize;
}
