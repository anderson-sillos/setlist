import {
  planCandidateSelection,
  planLyricsImport,
  resolveDurationChoice,
} from '../selection';
import type { RankedCandidateGroup } from '../matching';
import type { EnrichmentCandidate } from '../types';

function candidate(
  overrides: Partial<EnrichmentCandidate> = {},
): EnrichmentCandidate {
  return {
    recordId: 1,
    title: 'Tempo Perdido',
    artist: 'Legião Urbana',
    album: 'Dois',
    durationMs: 241_000,
    plainLyrics: 'Versos',
    syncedLyrics: '[00:01.00]Verso',
    ...overrides,
  };
}

function group(item: EnrichmentCandidate): RankedCandidateGroup {
  return { candidate: item, equivalentRecordIds: [item.recordId] };
}

describe('planCandidateSelection', () => {
  it('aplica uma correspondência exata única sem decisão pendente', () => {
    const item = candidate();
    expect(
      planCandidateSelection([group(item)], {
        title: 'Tempo Perdido',
        artist: 'Legiao Urbana',
        durationMs: null,
        hasExistingLyrics: false,
      }),
    ).toEqual({ kind: 'apply', candidate: item });
  });

  it('mantém artista ausente, título parcial e vários resultados para seleção', () => {
    const item = candidate();
    expect(
      planCandidateSelection([group(item)], {
        title: item.title,
        artist: '',
        durationMs: null,
        hasExistingLyrics: false,
      }).kind,
    ).toBe('select');

    expect(
      planCandidateSelection([group(item)], {
        title: 'Tempo',
        artist: item.artist,
        durationMs: null,
        hasExistingLyrics: false,
      }).kind,
    ).toBe('select');

    expect(
      planCandidateSelection([group(item), group(candidate({ recordId: 2 }))], {
        title: item.title,
        artist: item.artist,
        durationMs: null,
        hasExistingLyrics: false,
      }).kind,
    ).toBe('select');
  });

  it('não aplica automaticamente enquanto a duração aguarda decisão', () => {
    const item = candidate();
    expect(
      planCandidateSelection(
        [group(item)],
        {
          title: item.title,
          artist: item.artist,
          durationMs: 240_000,
          hasExistingLyrics: false,
        },
        () => true,
      ).kind,
    ).toBe('select');
  });
});

describe('planLyricsImport', () => {
  it('preserva letra já existente e não abre decisão de duração', () => {
    expect(planLyricsImport(240_000, 241_000, true, true)).toEqual({
      kind: 'preserve-existing',
    });
  });

  it('sincroniza quando a duração está vazia ou difere até 2.000 ms', () => {
    expect(planLyricsImport(null, 241_000, false, true)).toEqual({
      kind: 'synchronize',
      durationMs: 241_000,
    });
    expect(planLyricsImport(239_001, 241_000, false, true)).toEqual({
      kind: 'synchronize',
      durationMs: 239_001,
    });
    expect(planLyricsImport(239_000, 241_000, false, true)).toEqual({
      kind: 'synchronize',
      durationMs: 239_000,
    });
  });

  it('pede escolha acima de 2.000 ms e importa estática acima de 2.001 ms se não há LRC válido', () => {
    expect(planLyricsImport(238_999, 241_000, false, true)).toEqual({
      kind: 'choose-duration',
      currentDurationMs: 238_999,
      recordingDurationMs: 241_000,
    });
    expect(planLyricsImport(238_999, 241_000, false, false)).toEqual({
      kind: 'import-static',
    });
  });

  it('resolve as duas escolhas sem substituir a duração por padrão', () => {
    expect(
      resolveDurationChoice(
        240_000,
        241_000,
        'use-recording-duration-and-sync',
      ),
    ).toEqual({ durationMs: 241_000, useSynchronizedLyrics: true });
    expect(
      resolveDurationChoice(
        240_000,
        241_000,
        'keep-current-duration-and-import-static',
      ),
    ).toEqual({ durationMs: 240_000, useSynchronizedLyrics: false });
  });

  it('importa estática se não há duração válida para verificar os tempos', () => {
    expect(planLyricsImport(240_000, null, false, true)).toEqual({
      kind: 'import-static',
    });
    expect(planLyricsImport(null, 0, false, true)).toEqual({
      kind: 'import-static',
    });
  });
});
