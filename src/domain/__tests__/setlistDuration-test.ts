import {
  createShow,
  createShowPlanningSetlistItem,
  createShowSeparatorSetlistItem,
  createShowSetlistBlock,
  createShowSongSetlistItem,
  createSong,
} from '@/testing/factories';
import {
  getBlockDurationBreakdown,
  getShowDurationBreakdown,
  getShowDurationMs,
} from '@/domain/setlistDuration';

const BAND_ID = 'band-setlist-duration';
const OPENING_SONG = createSong({
  bandId: BAND_ID,
  estimatedDurationMs: 120_000,
  id: 'song-opening',
});
const ANTHEM_SONG = createSong({
  bandId: BAND_ID,
  estimatedDurationMs: 193_000,
  id: 'song-anthem',
});
const SECOND_PART_SONG = createSong({
  bandId: BAND_ID,
  estimatedDurationMs: 320_000,
  id: 'song-second-part',
});
const CLOSING_SONG = createSong({
  bandId: BAND_ID,
  estimatedDurationMs: 334_000,
  id: 'song-closing',
});
const SHOW = createShow({
  bandId: BAND_ID,
  id: 'show-duration',
  blocks: [
    createShowSetlistBlock({
      id: 'block-opening',
      name: 'Abertura',
      items: [
        createShowSongSetlistItem({
          id: 'item-opening',
          songId: OPENING_SONG.id,
        }),
        createShowPlanningSetlistItem({
          id: 'item-interval-one',
          description: 'Troca de instrumentos',
          estimatedDurationMs: 90_000,
        }),
        createShowSongSetlistItem({
          id: 'item-anthem',
          songId: ANTHEM_SONG.id,
        }),
      ],
    }),
    createShowSetlistBlock({
      id: 'block-middle',
      name: 'Meio do show',
      items: [
        createShowSongSetlistItem({
          id: 'item-second-part',
          songId: SECOND_PART_SONG.id,
        }),
        createShowPlanningSetlistItem({
          id: 'item-interval-two',
          description: 'Interação com o público',
          estimatedDurationMs: 60_000,
        }),
      ],
    }),
    createShowSetlistBlock({
      id: 'block-closing',
      name: 'Encerramento',
      items: [
        createShowSongSetlistItem({
          id: 'item-closing',
          songId: CLOSING_SONG.id,
        }),
        createShowPlanningSetlistItem({
          id: 'item-bow',
          description: 'Agradecimentos',
          estimatedDurationMs: 60_000,
        }),
      ],
    }),
  ],
});
const SONGS_BY_ID = new Map(
  [OPENING_SONG, ANTHEM_SONG, SECOND_PART_SONG, CLOSING_SONG].map((song) => [
    song.id,
    song,
  ]),
);

describe('duração planejada da setlist', () => {
  it('separa músicas e planejamento no bloco e no total do show', () => {
    expect(getBlockDurationBreakdown(SHOW.blocks[0]!, SONGS_BY_ID)).toEqual({
      hasDuration: true,
      musicMs: 313_000,
      planningMs: 90_000,
      totalMs: 403_000,
    });
    expect(getShowDurationBreakdown(SHOW, SONGS_BY_ID)).toEqual({
      hasDuration: true,
      musicMs: 967_000,
      planningMs: 210_000,
      totalMs: 1_177_000,
    });
    expect(getShowDurationMs(SHOW, SONGS_BY_ID)).toBe(1_177_000);
  });

  it('ignora separadores e tempos ausentes sem avisar duração parcial', () => {
    const show = createShow({
      id: 'show-without-duration',
      bandId: BAND_ID,
      name: 'Show sem tempo',
      startsAt: '2026-09-20T18:00:00-03:00',
      venue: 'Local',
      blocks: [
        createShowSetlistBlock({
          id: 'block-without-duration',
          name: 'Principal',
          items: [
            createShowPlanningSetlistItem({
              id: 'planning-without-duration',
              description: 'Pausa sem previsão',
            }),
            createShowSeparatorSetlistItem({
              id: 'separator-without-duration',
            }),
            createShowSongSetlistItem({
              id: 'song-without-duration',
              songId: 'song-unknown',
            }),
          ],
        }),
      ],
    });

    expect(getShowDurationBreakdown(show, new Map())).toEqual({
      hasDuration: false,
      musicMs: 0,
      planningMs: 0,
      totalMs: null,
    });
  });
});
