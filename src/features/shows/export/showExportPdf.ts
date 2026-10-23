import { PDFDocument, rgb } from 'pdf-lib';

import {
  isPageLineBold,
  buildShowExportPages,
  getPageLineColor,
} from './showExportLayout';
import {
  documentFontkit,
  loadDocumentFontResources,
} from './documentFonts';
import type { ShowExportDocument, ShowExportOptions } from './showExportModel';

function parseColor(value: string) {
  const red = Number.parseInt(value.slice(1, 3), 16) / 255;
  const green = Number.parseInt(value.slice(3, 5), 16) / 255;
  const blue = Number.parseInt(value.slice(5, 7), 16) / 255;
  return rgb(red, green, blue);
}

export async function createShowExportPdf(
  document: ShowExportDocument,
  options: ShowExportOptions,
): Promise<Uint8Array> {
  const resources = await loadDocumentFontResources();
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(documentFontkit);
  const [regular, bold] = await Promise.all([
    pdf.embedFont(resources.regularBytes, { subset: true }),
    pdf.embedFont(resources.boldBytes, { subset: true }),
  ]);
  const pages = buildShowExportPages(
    document,
    options,
    (value, size, isBold) =>
      ((isBold ? resources.boldFont : resources.regularFont).layout(value)
        .advanceWidth /
        (isBold ? resources.boldFont : resources.regularFont).unitsPerEm) *
      size,
  );

  pages.forEach((layout) => {
    const page = pdf.addPage([layout.width, layout.height]);
    page.drawRectangle({
      x: 0,
      y: 0,
      width: layout.width,
      height: layout.height,
      color: rgb(1, 1, 1),
    });

    [...layout.header, ...layout.lines].forEach((line) => {
      if (line.style === 'separator') {
        page.drawLine({
          start: { x: line.x, y: layout.height - line.top - 6 },
          end: { x: layout.width - 42, y: layout.height - line.top - 6 },
          thickness: 0.7,
          color: parseColor(getPageLineColor(line.style)),
        });
        return;
      }
      page.drawText(line.text, {
        x: line.x,
        y: layout.height - line.top - line.fontSize,
        size: line.fontSize,
        font: isPageLineBold(line.style) ? bold : regular,
        color: parseColor(getPageLineColor(line.style)),
      });
    });

    page.drawLine({
      start: { x: 42, y: layout.height - 814 },
      end: { x: layout.width - 42, y: layout.height - 814 },
      thickness: 0.5,
      color: rgb(0.82, 0.84, 0.88),
    });
    page.drawText(`Página ${layout.pageNumber} de ${layout.pageCount}`, {
      x: 42,
      y: layout.height - 829,
      size: 8,
      font: regular,
      color: rgb(0.35, 0.39, 0.45),
    });
    const generatedAtWidth = regular.widthOfTextAtSize(
      layout.generatedAtLabel,
      8,
    );
    page.drawText(layout.generatedAtLabel, {
      x: layout.width - 42 - generatedAtWidth,
      y: layout.height - 829,
      size: 8,
      font: regular,
      color: rgb(0.35, 0.39, 0.45),
    });
  });

  return pdf.save();
}
