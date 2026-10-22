export interface PreparedDocumentFile {
  readonly name: string;
  readonly mimeType: string;
  readonly uri: string;
  readonly size: number;
  readonly nativeUri?: string;
  readonly blob?: Blob;
}

export type DocumentDeliveryResult =
  | { readonly status: 'opened' }
  | { readonly status: 'cancelled' }
  | { readonly status: 'unsupported' };

export function sanitizeFilePart(value: string): string {
  const result = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 56);
  return result || 'show';
}

export function createShowExportFilename(
  showName: string,
  dateKey: string,
  extension: string,
  pageNumber?: number,
): string {
  const page = pageNumber
    ? `-pagina-${pageNumber.toString().padStart(2, '0')}`
    : '';
  return `${sanitizeFilePart(showName)}-${dateKey}${page}.${extension}`;
}

export function decodeBase64(value: string): Uint8Array {
  const alphabet =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const cleaned = value.replace(/[^A-Za-z0-9+/=]/g, '');
  const outputLength =
    Math.floor((cleaned.length * 3) / 4) -
    (cleaned.endsWith('==') ? 2 : cleaned.endsWith('=') ? 1 : 0);
  const output = new Uint8Array(Math.max(0, outputLength));
  let outputIndex = 0;
  let buffer = 0;
  let bits = 0;
  for (const character of cleaned) {
    if (character === '=') break;
    const valueIndex = alphabet.indexOf(character);
    if (valueIndex < 0) continue;
    buffer = (buffer << 6) | valueIndex;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      if (outputIndex < output.length)
        output[outputIndex++] = (buffer >> bits) & 0xff;
    }
  }
  return output;
}

export function encodeUtf8(value: string): Uint8Array {
  const bytes: number[] = [];
  for (const character of value) {
    const point = character.codePointAt(0) ?? 0;
    if (point <= 0x7f) bytes.push(point);
    else if (point <= 0x7ff) {
      bytes.push(0xc0 | (point >> 6), 0x80 | (point & 0x3f));
    } else if (point <= 0xffff) {
      bytes.push(
        0xe0 | (point >> 12),
        0x80 | ((point >> 6) & 0x3f),
        0x80 | (point & 0x3f),
      );
    } else {
      bytes.push(
        0xf0 | (point >> 18),
        0x80 | ((point >> 12) & 0x3f),
        0x80 | ((point >> 6) & 0x3f),
        0x80 | (point & 0x3f),
      );
    }
  }
  return new Uint8Array(bytes);
}
