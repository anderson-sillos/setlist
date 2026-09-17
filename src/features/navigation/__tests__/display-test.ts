import { demoIds, demoRepositoryData } from '@/data/demo';
import type { Show, Song } from '@/domain';
import {
  formatShowDate,
  formatShowDuration,
  formatShowListDate,
  formatShowTime,
  formatSongDuration,
  getBlockDurationBreakdown,
  getShowDurationBreakdown,
  getShowDurationMs,
} from '@/features/navigation/display';

describe('formatação compacta da lista de shows', () => {
  it('combina dia da semana, data média e horário compacto', () => {
    expect(formatShowListDate('2026-09-19T21:00:00-03:00')).toBe(
      'sáb, 19 de set. de 2026 · 21h',
    );
    expect(formatShowListDate('2026-09-19T21:30:00-03:00')).toBe(
      'sáb, 19 de set. de 2026 · 21h30',
    );
  });

  it('usa horário detalhado na data completa e compacto isoladamente', () => {
    expect(formatShowDate('2026-09-19T21:30:45-03:00')).toBe(
      '19 de set. de 2026, 21:30:45',
    );
    expect(formatShowTime('2026-09-19T21:00:00-03:00')).toBe('21h');
    expect(formatShowTime('2026-09-19T21:30:00-03:00')).toBe('21h30');
  });

  it('apresenta a duração total em horas e minutos sem segundos', () => {
    expect(formatShowDuration(1_177_000)).toBe('19min');
    expect(formatShowDuration(3_661_000)).toBe('1h 1min');
    expect(formatShowDuration(3_600_000)).toBe('1h');
    expect(formatShowDuration(null)).toBe('Não informada');
  });

  it('apresenta a duração da música com horas, minutos e segundos', () => {
    expect(formatSongDuration(218_000)).toBe('3min38s');
    expect(formatSongDuration(5_535_000)).toBe('1h32min15s');
    expect(formatSongDuration(3_605_000)).toBe('1h0min5s');
    expect(formatSongDuration(45_000)).toBe('45s');
    expect(formatSongDuration(null)).toBe('Não informada');
  });
});

describe('duração planejada da setlist', () => {
  it('separa músicas e planejamento no bloco e no total do show', () => {
    const show = demoRepositoryData.shows.find(
      ({ id }) => id === demoIds.readyShow,
    ) as Show;
    const songsById = new Map(
      (demoRepositoryData.songs as readonly Song[]).map((song) => [
        song.id,
        song,
      ]),
    );

    expect(getBlockDurationBreakdown(show.blocks[0], songsById)).toEqual({
      hasDuration: true,
      musicMs: 313_000,
      planningMs: 90_000,
      totalMs: 403_000,
    });
    expect(getShowDurationBreakdown(show, songsById)).toEqual({
      hasDuration: true,
      musicMs: 967_000,
      planningMs: 210_000,
      totalMs: 1_177_000,
    });
    expect(getShowDurationMs(show, songsById)).toBe(1_177_000);
  });

  it('ignora separadores e tempos ausentes sem avisar duração parcial', () => {
    const show: Show = {
      id: 'show-without-duration',
      bandId: demoIds.primaryBand,
      name: 'Show sem tempo',
      startsAt: '2026-09-20T18:00:00-03:00',
      venue: 'Local',
      notes: null,
      status: 'draft',
      blocks: [
        {
          id: 'block',
          name: 'Principal',
          items: [
            {
              id: 'planning',
              type: 'planning',
              description: 'Pausa sem previsão',
              estimatedDurationMs: null,
            },
            { id: 'separator', type: 'separator' },
            {
              id: 'song',
              type: 'song',
              songId: 'unknown',
              notes: null,
            },
          ],
        },
      ],
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    };

    expect(getShowDurationBreakdown(show, new Map())).toEqual({
      hasDuration: false,
      musicMs: 0,
      planningMs: 0,
      totalMs: null,
    });
  });
});
