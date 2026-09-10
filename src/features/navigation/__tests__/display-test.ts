import { demoIds, demoRepositoryData } from '@/data/demo';
import type { Show, Song } from '@/domain';
import {
  getBlockDurationBreakdown,
  getShowDurationBreakdown,
  getShowDurationMs,
} from '@/features/navigation/display';

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
