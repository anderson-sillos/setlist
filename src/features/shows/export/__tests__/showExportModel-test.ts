import {
  createShow,
  createShowPlanningSetlistItem,
  createShowSeparatorSetlistItem,
  createShowSetlistBlock,
  createShowSongSetlistItem,
} from '@/testing/factories';
import { createSongSummary } from '@/testing/factories/readModels';

import {
  DEFAULT_SHOW_EXPORT_OPTIONS,
  getShowExportLines,
  prepareShowExportDocument,
} from '../showExportModel';
import { createShowExportText } from '../showExportText';
import { buildShowExportPages } from '../showExportLayout';

const SHOW = createShow({
  id: 'private-show-id',
  bandId: 'band-test',
  name: 'Show de verão',
  startsAt: '2026-10-22T22:00:00-03:00',
  venue: 'Casa de música',
  notes: 'Observação geral privada',
  status: 'ready',
  blocks: [
    createShowSetlistBlock({
      id: 'private-block-id',
      name: 'Abertura',
      items: [
        createShowSongSetlistItem({
          id: 'private-occurrence-one',
          songId: 'song-shared',
          notes: 'Começar após a fala',
        }),
        createShowPlanningSetlistItem({
          id: 'private-planning-id',
          description: 'Troca de instrumentos',
          estimatedDurationMs: 60_000,
        }),
        createShowSeparatorSetlistItem({ id: 'private-separator-id' }),
        createShowSongSetlistItem({
          id: 'private-occurrence-two',
          songId: 'song-shared',
          notes: 'Repetir no bis',
        }),
        createShowSongSetlistItem({
          id: 'private-missing-occurrence',
          songId: 'song-hidden',
        }),
      ],
    }),
  ],
});

const measure = (value: string, size: number) =>
  Array.from(value).length * size * 0.52;

const SONGS = new Map([
  [
    'song-shared',
    createSongSummary({
      id: 'song-shared',
      title: 'Canção azul',
      originalArtist: 'Artista exemplo',
      musicalKey: 'Ré',
      bpm: 120,
      estimatedDurationMs: 180_000,
      lyricStatus: 'synchronized',
    }),
  ],
]);

describe('preparação da exportação do show', () => {
  it('mantém ocorrências e ordem sem copiar identificadores ou letras', () => {
    const document = prepareShowExportDocument(
      SHOW,
      { bandName: 'Banda exemplo' },
      SONGS,
      '2026-10-20T12:00:00.000Z',
    );
    const exported = JSON.stringify(document);

    expect(document.songCount).toBe(3);
    expect(document.blocks[0]?.items.map((item) => item.kind)).toEqual([
      'song',
      'planning',
      'separator',
      'song',
      'song',
    ]);
    expect(document.blocks[0]?.items[0]).toMatchObject({
      title: 'Canção azul',
      occurrenceNotes: 'Começar após a fala',
    });
    expect(document.blocks[0]?.items[4]).toMatchObject({
      title: 'Música indisponível',
      artist: null,
    });
    expect(exported).not.toContain('private-show-id');
    expect(exported).not.toContain('private-occurrence-one');
    expect(exported).not.toContain('lyric');
  });

  it('usa defaults sem observações e numera somente músicas, inclusive repetições', () => {
    const document = prepareShowExportDocument(
      SHOW,
      { bandName: 'Banda exemplo' },
      SONGS,
      '2026-10-20T12:00:00.000Z',
    );
    const lines = getShowExportLines(document, DEFAULT_SHOW_EXPORT_OPTIONS);
    const text = createShowExportText(document, DEFAULT_SHOW_EXPORT_OPTIONS);

    expect(DEFAULT_SHOW_EXPORT_OPTIONS).toMatchObject({
      includeArtist: true,
      includeKey: true,
      includeBpm: false,
      includeDurations: true,
      includePlanning: true,
      includeShowNotes: false,
      includeOccurrenceNotes: false,
    });
    expect(
      lines.filter((line) => line.style === 'song').map((line) => line.text),
    ).toEqual(['1. Canção azul', '2. Canção azul', '3. Música indisponível']);
    expect(text).toContain('Artista: Artista exemplo');
    expect(text).toContain('Tom: Ré');
    expect(text).not.toContain('BPM: 120');
    expect(text).not.toContain('Observação geral privada');
    expect(text).not.toContain('Começar após a fala');
    expect(text).not.toContain('lyric');
  });

  it('compartilha as mesmas opções entre TXT e páginas usadas por PDF e PNG', () => {
    const document = prepareShowExportDocument(
      SHOW,
      { bandName: 'Banda exemplo' },
      SONGS,
      '2026-10-20T12:00:00.000Z',
    );
    const options = {
      ...DEFAULT_SHOW_EXPORT_OPTIONS,
      includeArtist: false,
      includeKey: false,
      includeBpm: true,
      includeDurations: false,
      includePlanning: false,
      includeShowNotes: true,
      includeOccurrenceNotes: false,
    };
    const text = createShowExportText(document, options);
    const pages = buildShowExportPages(document, options, measure);
    const paginatedContent = pages
      .flatMap((page) => [...page.header, ...page.lines])
      .map((line) => line.text)
      .join('\n');

    expect(text).toContain('BPM: 120');
    expect(paginatedContent).toContain('BPM: 120');
    expect(text).toContain('Observação geral privada');
    expect(paginatedContent).toContain('Observação geral privada');
    expect(text).not.toContain('Artista: Artista exemplo');
    expect(paginatedContent).not.toContain('Artista: Artista exemplo');
    expect(text).not.toContain('Planejamento: Troca de instrumentos');
    expect(paginatedContent).not.toContain(
      'Planejamento: Troca de instrumentos',
    );
    expect(text).not.toContain('Tom: Ré');
    expect(paginatedContent).not.toContain('Tom: Ré');
  });

  it('mantém uma setlist vazia exportável e diferencia zero de duração ausente', () => {
    const emptyShow = createShow({ blocks: [] });
    const document = prepareShowExportDocument(
      emptyShow,
      { bandName: 'Banda exemplo' },
      new Map(),
    );
    const lines = getShowExportLines(document, DEFAULT_SHOW_EXPORT_OPTIONS);

    expect(document.duration.totalMs).toBeNull();
    expect(lines.some((line) => line.text.includes('não tem músicas'))).toBe(
      true,
    );

    const zeroDurationShow = createShow({
      blocks: [
        createShowSetlistBlock({
          items: [createShowSongSetlistItem({ songId: 'zero-song' })],
        }),
      ],
    });
    const zeroDocument = prepareShowExportDocument(
      zeroDurationShow,
      { bandName: 'Banda exemplo' },
      new Map([['zero-song', createSongSummary({ estimatedDurationMs: 0 })]]),
    );
    expect(zeroDocument.duration.totalMs).toBe(0);
  });
});
