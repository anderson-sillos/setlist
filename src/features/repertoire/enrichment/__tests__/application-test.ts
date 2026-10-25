import type { LyricDocument } from '@/domain';

import { applyEnrichmentToDraft } from '../application';
import type { EnrichmentCandidate } from '../types';
import { emptySongEditorValues } from '../../songEditorForm';
import { convertEnrichmentLyrics } from '../lyrics';

function candidate(
  overrides: Partial<EnrichmentCandidate> = {},
): EnrichmentCandidate {
  return {
    recordId: 42,
    title: 'Tempo Perdido',
    artist: 'Legião Urbana',
    album: 'Dois',
    durationMs: 241_000,
    plainLyrics: 'Verso importado',
    syncedLyrics: '[00:01.00]Verso importado',
    ...overrides,
  };
}

function convertedLyrics(item = candidate()) {
  return convertEnrichmentLyrics(
    {
      plainLyrics: item.plainLyrics,
      recordingDurationMs: item.durationMs,
      syncedLyrics: item.syncedLyrics,
    },
    () => 'new-id',
  );
}

function emptyLyrics(): LyricDocument {
  return { blocks: [] };
}

describe('applyEnrichmentToDraft', () => {
  it('preenche artista e letra, mantém duração próxima e os demais campos', () => {
    const result = applyEnrichmentToDraft({
      candidate: candidate(),
      currentValues: {
        ...emptySongEditorValues,
        duration: '4:00',
        musicalKey: 'Am',
        notes: 'Observação da banda',
        title: 'Tempo Perdido',
      },
      currentLyrics: emptyLyrics(),
      convertedLyrics: convertedLyrics(),
      importedAt: '2026-10-24T12:00:00.000Z',
    });

    expect(result.kind).toBe('applied');
    if (result.kind !== 'applied') return;
    expect(result.values).toMatchObject({
      duration: '4:00',
      musicalKey: 'Am',
      notes: 'Observação da banda',
      originalArtist: 'Legião Urbana',
      title: 'Tempo Perdido',
    });
    expect(result.lyrics.blocks[0]?.lines[0]?.startTimeMs).toBe(1_000);
    expect(result.lyrics.source).toMatchObject({
      provider: 'lrclib',
      recordId: 42,
      format: 'lrc',
      recordingDurationMs: 241_000,
    });
    expect(result.changedFields).toEqual(['artist', 'lyrics']);
  });

  it('substitui título e artista pelo resultado escolhido em capitalização de título', () => {
    const currentLyrics: LyricDocument = {
      blocks: [
        {
          id: 'existing-block',
          name: null,
          lines: [
            { id: 'existing-line', text: 'Letra da banda', startTimeMs: null },
          ],
        },
      ],
    };
    const result = applyEnrichmentToDraft({
      candidate: candidate({
        title: "AIN'T NO SUNSHINE",
        artist: 'bANDA mÓVEL',
      }),
      currentValues: {
        ...emptySongEditorValues,
        duration: '4:00',
        musicalKey: 'Am',
        notes: 'Observação da banda',
        originalArtist: 'Artista anterior',
        title: 'Título anterior',
      },
      currentLyrics,
      convertedLyrics: convertedLyrics(),
      importedAt: '2026-10-24T12:00:00.000Z',
    });

    expect(result.kind).toBe('applied');
    if (result.kind !== 'applied') return;
    expect(result.values).toMatchObject({
      duration: '4:00',
      musicalKey: 'Am',
      notes: 'Observação da banda',
      originalArtist: 'bANDA mÓVEL',
      title: "Ain't No Sunshine",
    });
    expect(result.lyrics).toBe(currentLyrics);
    expect(result.changedFields).toEqual(['title', 'artist']);
  });

  it('pede decisão quando a duração diverge e respeita cada escolha explícita', () => {
    const input = {
      candidate: candidate(),
      currentValues: {
        ...emptySongEditorValues,
        duration: '3:58',
        title: 'Tempo Perdido',
      },
      currentLyrics: emptyLyrics(),
      convertedLyrics: convertedLyrics(),
      importedAt: '2026-10-24T12:00:00.000Z',
    };

    expect(applyEnrichmentToDraft(input).kind).toBe('duration-choice-required');

    const synchronized = applyEnrichmentToDraft({
      ...input,
      durationDecision: 'use-recording-duration-and-sync',
    });
    expect(synchronized.kind).toBe('applied');
    if (synchronized.kind === 'applied') {
      expect(synchronized.values.duration).toBe('4:01');
      expect(synchronized.lyrics.blocks[0]?.lines[0]?.startTimeMs).toBe(1_000);
    }

    const staticResult = applyEnrichmentToDraft({
      ...input,
      durationDecision: 'keep-current-duration-and-import-static',
    });
    expect(staticResult.kind).toBe('applied');
    if (staticResult.kind === 'applied') {
      expect(staticResult.values.duration).toBe('3:58');
      expect(staticResult.lyrics.blocks[0]?.lines[0]?.startTimeMs).toBeNull();
    }
  });

  it('preserva letra e duração editadas enquanto a busca aguardava', () => {
    const currentLyrics: LyricDocument = {
      blocks: [
        {
          id: 'manual-block',
          name: null,
          lines: [
            {
              id: 'manual-line',
              text: 'Letra digitada durante a busca',
              startTimeMs: null,
            },
          ],
        },
      ],
    };
    const result = applyEnrichmentToDraft({
      candidate: candidate(),
      currentValues: {
        ...emptySongEditorValues,
        duration: '4:20',
        title: 'Tempo Perdido',
      },
      currentLyrics,
      convertedLyrics: convertedLyrics(),
      importedAt: '2026-10-24T12:00:00.000Z',
    });

    expect(result.kind).toBe('applied');
    if (result.kind === 'applied') {
      expect(result.values.duration).toBe('4:20');
      expect(result.values.originalArtist).toBe('Legião Urbana');
      expect(result.lyrics).toBe(currentLyrics);
      expect(result.changedFields).toEqual(['artist']);
    }
  });

  it('trata letra composta somente por espaços como vazia', () => {
    const whitespaceLyrics: LyricDocument = {
      blocks: [
        {
          id: 'blank',
          name: null,
          lines: [{ id: 'blank-line', text: '  ', startTimeMs: null }],
        },
      ],
    };
    const result = applyEnrichmentToDraft({
      candidate: candidate({ syncedLyrics: null }),
      currentValues: { ...emptySongEditorValues, title: 'Tempo Perdido' },
      currentLyrics: whitespaceLyrics,
      convertedLyrics: convertEnrichmentLyrics(
        {
          plainLyrics: 'Letra simples',
          recordingDurationMs: null,
          syncedLyrics: null,
        },
        () => 'replacement-id',
      ),
      importedAt: '2026-10-24T12:00:00.000Z',
    });

    expect(result.kind).toBe('applied');
    if (result.kind === 'applied') {
      expect(result.lyrics.blocks[0]?.lines[0]?.text).toBe('Letra simples');
      expect(result.lyrics.source?.format).toBe('plain');
    }
  });

  it('preenche apenas lacunas e nunca inventa campos sem suporte', () => {
    const item = candidate({
      artist: '',
      durationMs: null,
      plainLyrics: null,
      syncedLyrics: null,
    });
    const result = applyEnrichmentToDraft({
      candidate: item,
      currentValues: { ...emptySongEditorValues, title: 'Tempo Perdido' },
      currentLyrics: emptyLyrics(),
      convertedLyrics: convertedLyrics(item),
      importedAt: '2026-10-24T12:00:00.000Z',
    });

    expect(result.kind).toBe('nothing-to-fill');
  });

  it('não substitui uma duração já digitada se ela ainda está inválida', () => {
    const result = applyEnrichmentToDraft({
      candidate: candidate(),
      currentValues: {
        ...emptySongEditorValues,
        duration: '4:99',
        title: 'Tempo Perdido',
      },
      currentLyrics: emptyLyrics(),
      convertedLyrics: convertedLyrics(),
      importedAt: '2026-10-24T12:00:00.000Z',
    });

    expect(result.kind).toBe('applied');
    if (result.kind === 'applied') {
      expect(result.values.duration).toBe('4:99');
      expect(result.lyrics.blocks[0]?.lines[0]?.startTimeMs).toBeNull();
    }
  });
});
