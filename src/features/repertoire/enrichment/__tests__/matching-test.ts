import {
  normalizeMatchText,
  rankEnrichmentCandidates,
} from '@/features/repertoire/enrichment/matching';
import type { EnrichmentCandidate } from '@/features/repertoire/enrichment/types';

function candidate(
  overrides: Partial<EnrichmentCandidate> = {},
): EnrichmentCandidate {
  return {
    recordId: 1,
    title: 'Tempo Perdido',
    artist: 'Legião Urbana',
    album: 'Dois',
    durationMs: 241_000,
    plainLyrics: 'Versos de demonstração',
    syncedLyrics: null,
    ...overrides,
  };
}

describe('rankEnrichmentCandidates', () => {
  it('normaliza acentos, caixa, pontuação e espaços', () => {
    expect(normalizeMatchText('  LEGião   Urbana! ')).toBe('legiao urbana');
  });

  it('prioriza artistas iguais e não agrupa artistas diferentes', () => {
    const matches = rankEnrichmentCandidates(
      [
        candidate({ recordId: 2, artist: 'Artista convidado' }),
        candidate({ recordId: 3, artist: 'Legião Urbana' }),
      ],
      { title: 'Tempo Perdido', artist: 'Legiao Urbana', durationMs: null },
    );

    expect(matches.map(({ candidate: item }) => item.recordId)).toEqual([3, 2]);
    expect(matches).toHaveLength(2);
  });

  it('mantém versões ao vivo como gravações diferentes da versão de estúdio', () => {
    const matches = rankEnrichmentCandidates(
      [
        candidate({
          recordId: 2,
          title: 'Tempo Perdido (Ao Vivo)',
          syncedLyrics: '[00:01.00]Verso',
        }),
        candidate({
          recordId: 3,
          title: 'Tempo Perdido',
          syncedLyrics: '[00:01.00]Verso',
        }),
      ],
      { title: 'Tempo Perdido', artist: 'Legião Urbana', durationMs: null },
    );

    expect(matches.map(({ candidate: item }) => item.recordId)).toEqual([3, 2]);
    expect(matches).toHaveLength(2);
  });

  it('agrupa compilações com metadados de gravação equivalentes', () => {
    const matches = rankEnrichmentCandidates(
      [
        candidate({ recordId: 9, album: 'Coletânea 2020' }),
        candidate({ recordId: 4, album: 'Dois (Edição especial)' }),
      ],
      { title: 'Tempo Perdido', artist: 'Legião Urbana', durationMs: 241_500 },
    );

    expect(matches).toHaveLength(1);
    expect(matches[0]?.equivalentRecordIds).toEqual([4, 9]);
  });

  it('ordena primeiro pela duração e só então prefere LRC válido', () => {
    const nearerStatic = candidate({ recordId: 2, durationMs: 241_500 });
    const fartherTimed = candidate({
      recordId: 3,
      durationMs: 242_100,
      syncedLyrics: '[00:01.00]Verso',
    });
    const matches = rankEnrichmentCandidates(
      [fartherTimed, nearerStatic],
      { title: 'Tempo Perdido', artist: 'Legião Urbana', durationMs: 241_500 },
      (item) => Boolean(item.syncedLyrics),
    );

    expect(matches.map(({ candidate: item }) => item.recordId)).toEqual([2, 3]);
  });

  it('usa LRC como desempate quando a duração é igual', () => {
    const matches = rankEnrichmentCandidates(
      [
        candidate({ recordId: 2 }),
        candidate({ recordId: 3, syncedLyrics: '[00:01.00]Verso' }),
      ],
      { title: 'Tempo Perdido', artist: 'Legião Urbana', durationMs: 241_000 },
      (item) => Boolean(item.syncedLyrics),
    );

    expect(matches[0]?.candidate.recordId).toBe(3);
  });
});
