import {
  createShowExportFilename,
  decodeBase64,
  encodeUtf8,
  sanitizeFilePart,
} from '../documentFileTypes';

describe('show export file types', () => {
  it('normalizes file names and falls back when no usable characters remain', () => {
    expect(sanitizeFilePart('Música / ao vivo')).toBe('musica-ao-vivo');
    expect(sanitizeFilePart('---')).toBe('show');
    expect(sanitizeFilePart('a'.repeat(60))).toBe('a'.repeat(56));
  });

  it('adds a page suffix only for numbered image files', () => {
    expect(createShowExportFilename('Ensaio', '2026-10-23', 'pdf')).toBe(
      'ensaio-2026-10-23.pdf',
    );
    expect(createShowExportFilename('Ensaio', '2026-10-23', 'png', 3)).toBe(
      'ensaio-2026-10-23-pagina-03.png',
    );
  });

  it('decodes base64 while ignoring whitespace and invalid characters', () => {
    expect(Array.from(decodeBase64('aGVs bG8=\n'))).toEqual([
      104, 101, 108, 108, 111,
    ]);
    expect(Array.from(decodeBase64('YQ=='))).toEqual([97]);
    expect(Array.from(decodeBase64('%%%'))).toEqual([]);
  });

  it('encodes UTF-8 code points across all supported byte lengths', () => {
    expect(Array.from(encodeUtf8('Aé漢😀'))).toEqual([
      65, 195, 169, 230, 188, 162, 240, 159, 152, 128,
    ]);
  });
});
