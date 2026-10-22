import { Directory, File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import type {
  DocumentDeliveryResult,
  PreparedDocumentFile,
} from './documentFileTypes';
import type { ShowExportPage } from './showExportLayout';

const cacheDirectory = new Directory(Paths.cache, 'setlist-show-exports');
const activeFiles = new Set<string>();
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

async function ensureCacheDirectory() {
  cacheDirectory.create({ idempotent: true, intermediates: true });
}

export async function cleanupExpiredDocumentFiles(
  now = Date.now(),
): Promise<void> {
  await ensureCacheDirectory();
  cacheDirectory.list().forEach((entry) => {
    if (!(entry instanceof File) || activeFiles.has(entry.uri)) return;
    const lastModified = entry.lastModified;
    if (lastModified !== null && now - lastModified > MAX_AGE_MS) {
      try {
        entry.delete();
      } catch {
        // Cache cleanup is best-effort; it must not block a new export.
      }
    }
  });
}

export async function prepareDocumentFile(
  name: string,
  mimeType: string,
  bytes: Uint8Array,
): Promise<PreparedDocumentFile> {
  await ensureCacheDirectory();
  const uniqueName = `${Date.now()}-${name}`;
  const file = new File(cacheDirectory, uniqueName);
  file.create({ intermediates: true });
  file.write(bytes);
  return {
    name,
    mimeType,
    nativeUri: file.uri,
    uri: file.uri,
    size: file.size,
  };
}

export async function canShareDocumentFile(
  _file: PreparedDocumentFile,
): Promise<boolean> {
  return Sharing.isAvailableAsync();
}

export async function shareDocumentFile(
  file: PreparedDocumentFile,
): Promise<DocumentDeliveryResult> {
  if (!file.nativeUri || !(await Sharing.isAvailableAsync())) {
    return { status: 'unsupported' };
  }
  activeFiles.add(file.nativeUri);
  try {
    await Sharing.shareAsync(file.nativeUri, {
      dialogTitle: `Compartilhar ${file.name}`,
      mimeType: file.mimeType,
      UTI:
        file.mimeType === 'application/pdf'
          ? 'com.adobe.pdf'
          : file.mimeType === 'image/png'
            ? 'public.png'
            : file.mimeType.startsWith('text/calendar')
              ? 'com.apple.ical.ics'
              : 'public.plain-text',
    });
    // A API fecha junto com o seletor; não confirma entrega ao destinatário.
    return { status: 'opened' };
  } finally {
    activeFiles.delete(file.nativeUri);
  }
}

export async function downloadDocumentFile(
  file: PreparedDocumentFile,
): Promise<DocumentDeliveryResult> {
  return shareDocumentFile(file);
}

export async function printShowDocument(
  file: PreparedDocumentFile,
  _pages: readonly ShowExportPage[],
): Promise<void> {
  if (!file.nativeUri) throw new Error('O PDF preparado não está disponível.');
  activeFiles.add(file.nativeUri);
  try {
    await Print.printAsync({ uri: file.nativeUri });
  } finally {
    activeFiles.delete(file.nativeUri);
  }
}

export function releaseDocumentFile(_file: PreparedDocumentFile): void {
  // Arquivos em cache expiram após 24 horas; o seletor externo pode continuar usando-os.
}
