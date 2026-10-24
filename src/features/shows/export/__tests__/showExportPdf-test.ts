import { PDFDocument } from 'pdf-lib';

import {
  buildShowExportPages,
  getPageLineColor,
  isPageLineBold,
} from '../showExportLayout';
import { loadDocumentFontResources } from '../documentFonts';
import { createShowExportPdf } from '../showExportPdf';

jest.mock('pdf-lib', () => ({
  PDFDocument: { create: jest.fn() },
  rgb: jest.fn((red: number, green: number, blue: number) => ({
    red,
    green,
    blue,
  })),
}));

jest.mock('../showExportLayout', () => ({
  buildShowExportPages: jest.fn(),
  getPageLineColor: jest.fn(() => '#336699'),
  isPageLineBold: jest.fn((style: string) => style === 'title'),
}));

jest.mock('../documentFonts', () => ({
  documentFontkit: { create: jest.fn() },
  loadDocumentFontResources: jest.fn(),
}));

describe('createShowExportPdf', () => {
  it('renders separators, regular and bold text, and the page footer', async () => {
    const page = {
      drawLine: jest.fn(),
      drawRectangle: jest.fn(),
      drawText: jest.fn(),
    };
    const regular = { widthOfTextAtSize: jest.fn(() => 42) };
    const bold = {};
    const pdf = {
      addPage: jest.fn(() => page),
      embedFont: jest
        .fn()
        .mockResolvedValueOnce(regular)
        .mockResolvedValueOnce(bold),
      registerFontkit: jest.fn(),
      save: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
    };
    const document = { showName: 'Ensaio' } as never;
    const options = {} as never;
    const layouts = [
      {
        width: 595,
        height: 842,
        header: [
          { style: 'title', text: 'Ensaio', x: 42, top: 40, fontSize: 18 },
        ],
        lines: [
          { style: 'separator', text: '', x: 42, top: 80, fontSize: 1 },
          { style: 'body', text: 'Músicas: 2', x: 42, top: 100, fontSize: 10 },
        ],
        pageNumber: 1,
        pageCount: 1,
        generatedAtLabel: '23/10/2026 12:00',
      },
    ];
    const font = {
      layout: jest.fn(() => ({ advanceWidth: 500 })),
      unitsPerEm: 1000,
    };
    jest.mocked(PDFDocument.create).mockResolvedValue(pdf as never);
    jest.mocked(loadDocumentFontResources).mockResolvedValue({
      regularBytes: new Uint8Array([1]),
      boldBytes: new Uint8Array([2]),
      regularFont: font as never,
      boldFont: font as never,
      regularUri: 'regular.ttf',
      boldUri: 'bold.ttf',
    });
    jest
      .mocked(buildShowExportPages)
      .mockImplementation((_doc, _opts, measure) => {
        expect(measure('sample', 12, false)).toBe(6);
        expect(measure('sample', 12, true)).toBe(6);
        return layouts as never;
      });

    await expect(createShowExportPdf(document, options)).resolves.toEqual(
      new Uint8Array([1, 2, 3]),
    );

    expect(pdf.registerFontkit).toHaveBeenCalledTimes(1);
    expect(pdf.addPage).toHaveBeenCalledWith([595, 842]);
    expect(page.drawRectangle).toHaveBeenCalledTimes(1);
    expect(page.drawLine).toHaveBeenCalledTimes(2);
    expect(page.drawText).toHaveBeenCalledWith(
      'Ensaio',
      expect.objectContaining({ font: bold }),
    );
    expect(page.drawText).toHaveBeenCalledWith(
      'Músicas: 2',
      expect.objectContaining({ font: regular }),
    );
    expect(isPageLineBold).toHaveBeenCalledWith('title');
    expect(getPageLineColor).toHaveBeenCalledWith('separator');
  });
});
