import {
  getShowExportLines,
  sanitizeDocumentText,
  type ExportLineStyle,
  type ShowExportDocument,
  type ShowExportLine,
  type ShowExportOptions,
} from './showExportModel';

export const PAGE_WIDTH_PT = 595.28;
export const PAGE_HEIGHT_PT = 841.89;
export const PAGE_SCALE = 150 / 72;
export const PAGE_PNG_WIDTH = Math.round(PAGE_WIDTH_PT * PAGE_SCALE);
export const PAGE_PNG_HEIGHT = Math.round(PAGE_HEIGHT_PT * PAGE_SCALE);

export interface LaidOutTextLine {
  readonly text: string;
  readonly style: ExportLineStyle;
  readonly x: number;
  readonly top: number;
  readonly fontSize: number;
  readonly lineHeight: number;
}

export interface ShowExportPage {
  readonly width: number;
  readonly height: number;
  readonly header: readonly LaidOutTextLine[];
  readonly lines: readonly LaidOutTextLine[];
  readonly pageNumber: number;
  readonly pageCount: number;
}

export type TextMeasure = (
  value: string,
  fontSize: number,
  bold: boolean,
) => number;

interface Row {
  readonly style: ExportLineStyle;
  readonly textLines: readonly string[];
  readonly indent: number;
  readonly keepWithNext: boolean;
  readonly before: number;
  readonly after: number;
  readonly fontSize: number;
  readonly lineHeight: number;
}

const PAGE_LEFT = 42;
const PAGE_RIGHT = 42;
const CONTENT_BOTTOM = PAGE_HEIGHT_PT - 42;

const styleMetrics: Record<
  ExportLineStyle,
  {
    readonly size: number;
    readonly lineHeight: number;
    readonly bold?: boolean;
  }
> = {
  brand: { size: 9, lineHeight: 13, bold: true },
  title: { size: 17, lineHeight: 22, bold: true },
  meta: { size: 9, lineHeight: 13 },
  section: { size: 11, lineHeight: 16, bold: true },
  song: { size: 10.5, lineHeight: 15, bold: true },
  detail: { size: 9, lineHeight: 13 },
  note: { size: 9, lineHeight: 13 },
  planning: { size: 10, lineHeight: 15 },
  separator: { size: 9, lineHeight: 15 },
  empty: { size: 10, lineHeight: 16 },
  total: { size: 10, lineHeight: 15, bold: true },
};

function splitLongWord(
  word: string,
  width: number,
  fontSize: number,
  bold: boolean,
  measure: TextMeasure,
): string[] {
  const characters = Array.from(word);
  const segments: string[] = [];
  let segment = '';
  characters.forEach((character) => {
    if (segment && measure(segment + character, fontSize, bold) > width) {
      segments.push(segment);
      segment = character;
    } else {
      segment += character;
    }
  });
  if (segment) segments.push(segment);
  return segments.length ? segments : [''];
}

function wrapParagraph(
  paragraph: string,
  width: number,
  fontSize: number,
  bold: boolean,
  measure: TextMeasure,
): string[] {
  if (!paragraph) return [''];
  const words = paragraph.trim().split(/\s+/u).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  words.forEach((word) => {
    const parts =
      measure(word, fontSize, bold) <= width
        ? [word]
        : splitLongWord(word, width, fontSize, bold, measure);
    parts.forEach((part) => {
      const candidate = line ? `${line} ${part}` : part;
      if (line && measure(candidate, fontSize, bold) > width) {
        lines.push(line);
        line = part;
      } else {
        line = candidate;
      }
    });
  });
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

function wrapText(
  value: string,
  width: number,
  fontSize: number,
  bold: boolean,
  measure: TextMeasure,
): string[] {
  const paragraphs = sanitizeDocumentText(value).split('\n');
  return paragraphs.flatMap((paragraph) =>
    wrapParagraph(paragraph, width, fontSize, bold, measure),
  );
}

function createRows(
  lines: readonly ShowExportLine[],
  measure: TextMeasure,
): Row[] {
  return lines.map((line) => {
    const metrics = styleMetrics[line.style];
    const indent = line.indent ?? 0;
    const width = PAGE_WIDTH_PT - PAGE_LEFT - PAGE_RIGHT - indent;
    return {
      style: line.style,
      textLines:
        line.style === 'separator'
          ? ['']
          : wrapText(
              line.text,
              width,
              metrics.size,
              Boolean(metrics.bold),
              measure,
            ),
      indent,
      keepWithNext: Boolean(line.keepWithNext),
      before:
        line.style === 'section' || line.style === 'total'
          ? 8
          : line.style === 'separator'
            ? 4
            : 1,
      after: line.style === 'separator' ? 3 : 2,
      fontSize: metrics.size,
      lineHeight: metrics.lineHeight,
    };
  });
}

function makeHeader(
  document: ShowExportDocument,
  measure: TextMeasure,
  continuation: boolean,
): { readonly lines: readonly LaidOutTextLine[]; readonly bottom: number } {
  const source: ShowExportLine[] = continuation
    ? [
        { style: 'brand', text: document.bandName },
        { style: 'title', text: document.showName },
        { style: 'meta', text: 'Continuação do setlist' },
      ]
    : [
        { style: 'brand', text: document.bandName },
        { style: 'title', text: document.showName },
        { style: 'meta', text: `Início: ${document.startLabel}` },
        { style: 'meta', text: `Fuso: ${document.timeZone}` },
        { style: 'meta', text: `Local: ${document.venue || 'Não informado'}` },
        { style: 'meta', text: `Estado: ${document.statusLabel}` },
        { style: 'meta', text: `Preparado em: ${document.generatedLabel}` },
      ];
  let top = 30;
  const result: LaidOutTextLine[] = [];
  source.forEach((line) => {
    const metrics = styleMetrics[line.style];
    const wrapped = wrapText(
      line.text,
      PAGE_WIDTH_PT - PAGE_LEFT - PAGE_RIGHT,
      metrics.size,
      Boolean(metrics.bold),
      measure,
    );
    wrapped.forEach((text) => {
      result.push({
        text,
        style: line.style,
        x: PAGE_LEFT,
        top,
        fontSize: metrics.size,
        lineHeight: metrics.lineHeight,
      });
      top += metrics.lineHeight;
    });
    top += line.style === 'title' ? 3 : 0;
  });
  return { lines: result, bottom: top + (continuation ? 16 : 10) };
}

function createPage(
  document: ShowExportDocument,
  measure: TextMeasure,
  pageNumber: number,
): { header: readonly LaidOutTextLine[]; y: number; lines: LaidOutTextLine[] } {
  const header = makeHeader(document, measure, pageNumber > 1);
  return { header: header.lines, y: header.bottom, lines: [] };
}

export function buildShowExportPages(
  document: ShowExportDocument,
  options: ShowExportOptions,
  measure: TextMeasure,
): ShowExportPage[] {
  const allLines = getShowExportLines(document, options);
  const headerLines = allLines.slice(0, 7);
  const contentLines = allLines.slice(headerLines.length);
  const rows = createRows(contentLines, measure);
  const pages: ReturnType<typeof createPage>[] = [];
  pages.push(createPage(document, measure, 1));

  rows.forEach((row, index) => {
    const page = pages[pages.length - 1];
    const rowHeight =
      row.before + row.textLines.length * row.lineHeight + row.after;
    const nextRow = rows[index + 1];
    const nextHeight = nextRow
      ? nextRow.before +
        nextRow.textLines.length * nextRow.lineHeight +
        nextRow.after
      : 0;
    const remaining = CONTENT_BOTTOM - page.y;
    const pageCapacity = CONTENT_BOTTOM - page.y;

    if (
      (row.keepWithNext && rowHeight + nextHeight > remaining) ||
      (rowHeight <= pageCapacity && rowHeight > remaining)
    ) {
      pages.push(createPage(document, measure, pages.length + 1));
    }

    let lineIndex = 0;
    let firstPart = true;
    while (lineIndex < row.textLines.length) {
      const currentPage = pages[pages.length - 1];
      const before = firstPart ? row.before : 0;
      const availableLines = Math.floor(
        (CONTENT_BOTTOM - currentPage.y - before - row.after) / row.lineHeight,
      );
      if (availableLines <= 0) {
        pages.push(createPage(document, measure, pages.length + 1));
        continue;
      }
      const take = Math.min(availableLines, row.textLines.length - lineIndex);
      currentPage.y += before;
      for (let offset = 0; offset < take; offset += 1) {
        currentPage.lines.push({
          text: row.textLines[lineIndex + offset],
          style: row.style,
          x: PAGE_LEFT + row.indent,
          top: currentPage.y,
          fontSize: row.fontSize,
          lineHeight: row.lineHeight,
        });
        currentPage.y += row.lineHeight;
      }
      lineIndex += take;
      if (lineIndex < row.textLines.length) {
        pages.push(createPage(document, measure, pages.length + 1));
      } else {
        currentPage.y += row.after;
      }
      firstPart = false;
    }
  });

  return pages.map((page, index) => ({
    width: PAGE_WIDTH_PT,
    height: PAGE_HEIGHT_PT,
    header: page.header,
    lines: page.lines,
    pageNumber: index + 1,
    pageCount: pages.length,
  }));
}

export function getPageLineColor(style: ExportLineStyle): string {
  if (style === 'section') return '#5527a8';
  if (
    style === 'brand' ||
    style === 'meta' ||
    style === 'detail' ||
    style === 'note'
  ) {
    return '#475569';
  }
  if (style === 'separator') return '#94a3b8';
  return '#111827';
}

export function isPageLineBold(style: ExportLineStyle): boolean {
  return ['brand', 'title', 'section', 'song', 'total'].includes(style);
}
