import type { LyricDocument } from '@/domain';
import {
  clampLyricPositionMs,
  getActiveTimedLyricGroup,
  getLyricProgressRatio,
  getLyricPositionFromTrackX,
  getUsableLyricDurationMs,
  projectTimedLyrics,
} from '@/features/repertoire/timedLyrics';

function lyrics(
  entries: readonly {
    readonly id: string;
    readonly text: string;
    readonly startTimeMs: number | null;
    readonly kind?: 'separator';
  }[],
): LyricDocument {
  return {
    blocks: [
      {
        id: 'block-1',
        name: 'Refrão',
        lines: entries,
      },
    ],
  };
}

describe('projectTimedLyrics', () => {
  it('preserva a ordem e agrupa linhas com marcações simultâneas', () => {
    const document = lyrics([
      { id: 'line-1', text: 'Primeira', startTimeMs: 0 },
      { id: 'line-2', text: 'Eco', startTimeMs: 0 },
      { id: 'line-3', text: 'Segunda', startTimeMs: 4_000 },
    ]);

    const projection = projectTimedLyrics(document);

    expect(projection.isValid).toBe(true);
    expect(
      projection.groups.map(({ startTimeMs, lines }) => ({
        startTimeMs,
        ids: lines.map(({ id }) => id),
      })),
    ).toEqual([
      { startTimeMs: 0, ids: ['line-1', 'line-2'] },
      { startTimeMs: 4_000, ids: ['line-3'] },
    ]);
    expect(document.blocks[0]?.lines.map(({ id }) => id)).toEqual([
      'line-1',
      'line-2',
      'line-3',
    ]);
  });

  it('ignora títulos, linhas vazias e separadores como destinos', () => {
    const projection = projectTimedLyrics(
      lyrics([
        { id: 'blank', text: '  ', startTimeMs: null },
        {
          id: 'separator',
          text: '',
          startTimeMs: null,
          kind: 'separator',
        },
        { id: 'verse', text: 'Verso', startTimeMs: 1_000 },
      ]),
    );

    expect(projection.isValid).toBe(true);
    expect(projection.lines.map(({ id }) => id)).toEqual(['verse']);
  });

  it.each([
    ['sem marcação', null],
    ['marcação negativa', -1],
    ['marcação infinita', Number.POSITIVE_INFINITY],
    ['marcação NaN', Number.NaN],
  ])('recusa uma sequência com %s', (_label, invalidTime) => {
    const projection = projectTimedLyrics(
      lyrics([
        { id: 'valid', text: 'Válida', startTimeMs: 1_000 },
        { id: 'invalid', text: 'Inválida', startTimeMs: invalidTime },
      ]),
    );

    expect(projection).toEqual({ groups: [], isValid: false, lines: [] });
  });

  it('recusa marcações fora de ordem sem reordenar as linhas', () => {
    const projection = projectTimedLyrics(
      lyrics([
        { id: 'late', text: 'Mais tarde', startTimeMs: 4_000 },
        { id: 'early', text: 'Mais cedo', startTimeMs: 2_000 },
      ]),
    );

    expect(projection.isValid).toBe(false);
    expect(projection.groups).toEqual([]);
  });

  it('não cria destinos temporais quando não há linha com texto', () => {
    expect(
      projectTimedLyrics(lyrics([{ id: 'blank', text: '', startTimeMs: 0 }])),
    ).toEqual({ groups: [], isValid: false, lines: [] });
  });
});

describe('getActiveTimedLyricGroup', () => {
  const groups = projectTimedLyrics(
    lyrics([
      { id: 'first', text: 'Primeira', startTimeMs: 0 },
      { id: 'second', text: 'Segunda', startTimeMs: 5_000 },
      { id: 'last', text: 'Última', startTimeMs: 9_000 },
    ]),
  ).groups;

  it('usa início inclusivo e o próximo horário distinto como limite exclusivo', () => {
    expect(getActiveTimedLyricGroup(groups, 0, null)?.id).toBe('first');
    expect(getActiveTimedLyricGroup(groups, 4_999, null)?.id).toBe('first');
    expect(getActiveTimedLyricGroup(groups, 5_000, null)?.id).toBe('second');
    expect(getActiveTimedLyricGroup(groups, 9_000, null)?.id).toBe('last');
  });

  it('não destaca antes da primeira marca nem no fim conhecido', () => {
    const delayedGroups = projectTimedLyrics(
      lyrics([{ id: 'delayed', text: 'Primeira', startTimeMs: 1_000 }]),
    ).groups;

    expect(getActiveTimedLyricGroup(delayedGroups, 999, null)).toBeNull();
    expect(getActiveTimedLyricGroup(groups, 10_000, 10_000)).toBeNull();
    expect(getActiveTimedLyricGroup(groups, -1, null)).toBeNull();
    expect(getActiveTimedLyricGroup(groups, Number.NaN, null)).toBeNull();
  });

  it('mantém a última linha ativa sem um fim conhecido', () => {
    expect(getActiveTimedLyricGroup(groups, 60_000, null)?.id).toBe('last');
  });
});

describe('limites da duração e do progresso da letra', () => {
  it.each([
    ['duração ausente', null, 9_000, null],
    ['duração zero', 0, 9_000, null],
    ['duração negativa', -1, 9_000, null],
    ['duração não finita', Number.POSITIVE_INFINITY, 9_000, null],
    ['igual ao início do último verso', 9_000, 9_000, null],
    ['anterior ao início do último verso', 8_999, 9_000, null],
    ['maior que o início do último verso', 10_000, 9_000, 10_000],
    ['sem último horário conhecido', 10_000, null, 10_000],
  ])('avalia %s', (_label, estimatedDurationMs, lastTimestampMs, expected) => {
    expect(getUsableLyricDurationMs(estimatedDurationMs, lastTimestampMs)).toBe(
      expected,
    );
  });

  it('limita saltos explícitos a zero e à duração utilizável', () => {
    expect(clampLyricPositionMs(-5_000, 10_000)).toBe(0);
    expect(clampLyricPositionMs(15_000, 10_000)).toBe(10_000);
    expect(clampLyricPositionMs(15_000, null)).toBe(15_000);
    expect(clampLyricPositionMs(Number.NaN, null)).toBeNull();
  });

  it('limita somente a proporção visual, mantendo tempos além da duração', () => {
    expect(getLyricProgressRatio(5_000, 10_000)).toBe(0.5);
    expect(getLyricProgressRatio(-1, 10_000)).toBe(0);
    expect(getLyricProgressRatio(15_000, 10_000)).toBe(1);
    expect(getLyricProgressRatio(5_000, null)).toBeNull();
  });

  it('converte posição da trilha em tempo e limita os extremos', () => {
    expect(getLyricPositionFromTrackX(50, 200, 40_000)).toBe(10_000);
    expect(getLyricPositionFromTrackX(-1, 200, 40_000)).toBe(0);
    expect(getLyricPositionFromTrackX(201, 200, 40_000)).toBe(40_000);
    expect(getLyricPositionFromTrackX(50, 0, 40_000)).toBeNull();
    expect(getLyricPositionFromTrackX(50, 200, 0)).toBeNull();
  });
});
