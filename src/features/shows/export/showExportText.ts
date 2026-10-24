import {
  getShowExportLines,
  sanitizeDocumentText,
  type ShowExportDocument,
  type ShowExportOptions,
} from './showExportModel';

export function createShowExportText(
  document: ShowExportDocument,
  options: ShowExportOptions,
): string {
  return getShowExportLines(document, options)
    .map(({ style, text }) => {
      if (style === 'separator')
        return '----------------------------------------';
      if (style === 'section')
        return `\n${sanitizeDocumentText(text).toLocaleUpperCase('pt-BR')}`;
      if (style === 'song') return sanitizeDocumentText(text);
      if (style === 'planning') return `• ${sanitizeDocumentText(text)}`;
      if (style === 'note') return sanitizeDocumentText(text);
      if (style === 'total') return `\n${sanitizeDocumentText(text)}`;
      if (style === 'detail') return `   ${sanitizeDocumentText(text)}`;
      if (style === 'empty') return sanitizeDocumentText(text);
      return sanitizeDocumentText(text);
    })
    .filter((line) => line.length > 0)
    .join('\n')
    .concat(`\n${document.generatedAtLabel}\n`);
}
