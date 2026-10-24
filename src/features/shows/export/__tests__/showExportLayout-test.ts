import {
  createShow,
  createShowSetlistBlock,
  createShowSongSetlistItem,
} from '@/testing/factories';

import { buildShowExportPages } from '../showExportLayout';
import { prepareShowExportDocument } from '../showExportModel';

const measure = (value: string, size: number) =>
  Array.from(value).length * size * 0.52;

describe('paginação da exportação do show', () => {
  it('mantém todo o conteúdo longo em páginas enumeradas sem reduzir a fonte', () => {
    const longNote =
      'observação extensa com acentuação e conteúdo completo '.repeat(1_300);
    const show = createShow({
      name: 'Show com observação longa',
      notes: longNote,
      blocks: [
        createShowSetlistBlock({
          name: 'Parte principal',
          items: [createShowSongSetlistItem({ songId: 'song-one' })],
        }),
      ],
    });
    const document = prepareShowExportDocument(
      show,
      { bandName: 'Banda teste' },
      new Map(),
    );
    const pages = buildShowExportPages(
      document,
      {
        includeArtist: true,
        includeKey: true,
        includeBpm: false,
        includeDurations: true,
        includePlanning: true,
        includeShowNotes: true,
        includeOccurrenceNotes: false,
      },
      measure,
    );
    const noteContent = pages
      .flatMap((page) => page.lines)
      .filter((line) => line.style === 'note')
      .map((line) => line.text)
      .join(' ');

    expect(pages.length).toBeGreaterThan(1);
    expect(pages.every((page) => page.pageCount === pages.length)).toBe(true);
    expect(pages.map((page) => page.pageNumber)).toEqual(
      pages.map((_, index) => index + 1),
    );
    expect(
      noteContent.match(
        /observação extensa com acentuação e conteúdo completo/g,
      ),
    ).toHaveLength(1_300);
    expect(
      new Set(pages.flatMap((page) => page.lines.map((line) => line.fontSize))),
    ).toEqual(new Set([9, 10, 10.5, 11]));
  });

  it('repete cabeçalhos, preserva títulos longos e mantém o título do bloco com a primeira música', () => {
    const longShowTitle =
      'Festival de música independente com repertório especial '
        .repeat(4)
        .trim();
    const songs = Array.from({ length: 34 }, (_, index) =>
      createShowSongSetlistItem({
        id: `first-block-song-${index}`,
        songId: 'shared-song',
      }),
    );
    const show = createShow({
      name: longShowTitle,
      blocks: [
        createShowSetlistBlock({ name: 'Primeiro bloco', items: songs }),
        createShowSetlistBlock({
          name: 'Encerramento',
          items: [
            createShowSongSetlistItem({
              id: 'closing-song',
              songId: 'shared-song',
            }),
          ],
        }),
      ],
    });
    const document = prepareShowExportDocument(
      show,
      { bandName: 'Banda teste' },
      new Map(),
    );
    const pages = buildShowExportPages(
      document,
      {
        includeArtist: false,
        includeKey: false,
        includeBpm: false,
        includeDurations: false,
        includePlanning: false,
        includeShowNotes: false,
        includeOccurrenceNotes: false,
      },
      measure,
    );

    expect(pages.length).toBeGreaterThan(1);
    expect(pages[1]?.header.map((line) => line.text)).toContain(
      'Continuação do setlist',
    );
    expect(
      pages[0]?.header
        .filter((line) => line.style === 'title')
        .map((line) => line.text)
        .join(' '),
    ).toBe(longShowTitle);
    expect(
      pages[1]?.header
        .filter((line) => line.style === 'title')
        .map((line) => line.text)
        .join(' '),
    ).toBe(longShowTitle);

    const allLines = pages.flatMap((page) => page.lines);
    const secondBlockPage = pages.find((page) =>
      page.lines.some((line) => line.text === 'II. Encerramento'),
    );
    const secondBlockHeadingIndex = secondBlockPage?.lines.findIndex(
      (line) => line.text === 'II. Encerramento',
    );
    expect(secondBlockPage).toBeDefined();
    expect(
      secondBlockPage?.lines
        .slice((secondBlockHeadingIndex ?? -1) + 1)
        .some((line) => line.style === 'song'),
    ).toBe(true);
    expect(
      allLines.filter((line) => line.style === 'song').map((line) => line.text),
    ).toEqual(
      Array.from(
        { length: 35 },
        (_, index) => `${index + 1}. Música indisponível`,
      ),
    );
  });
});
