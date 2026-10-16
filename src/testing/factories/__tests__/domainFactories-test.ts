import { deriveLyricStatus } from '@/domain';
import {
  createBandContext,
  createBand,
  createBandMember,
  createLyricBlock,
  createLyricDocument,
  createLyricLine,
  createLyricsForStatus,
  createRepertoireCollection,
  createRepertoireCollectionSong,
  createShowSummary,
  createShow,
  createShowPlanningSetlistItem,
  createShowSeparatorSetlistItem,
  createShowSetlistBlock,
  createShowSongSetlistItem,
  createSong,
  createSongSummary,
  createUserBandSummary,
} from '@/testing/factories';

describe('factories for domain entities', () => {
  it('creates independent nested lyric structures for each song', () => {
    const lyrics = createLyricDocument({
      blocks: [
        createLyricBlock({
          lines: [createLyricLine()],
        }),
      ],
    });
    const first = createSong({ lyrics });
    const second = createSong({ lyrics });

    expect(first.lyrics).not.toBe(second.lyrics);
    expect(first.lyrics.blocks).not.toBe(second.lyrics.blocks);
    expect(first.lyrics.blocks[0]).not.toBe(second.lyrics.blocks[0]);
    expect(first.lyrics.blocks[0]?.lines).not.toBe(
      second.lyrics.blocks[0]?.lines,
    );
    expect(first.lyrics.blocks[0]?.lines[0]).not.toBe(
      second.lyrics.blocks[0]?.lines[0],
    );
  });

  it.each(['missing', 'static', 'incomplete', 'synchronized'] as const)(
    'creates a coherent %s lyric document',
    (status) => {
      expect(deriveLyricStatus(createLyricsForStatus(status))).toBe(status);
    },
  );

  it('uses neutral identities and lets a scenario state relationships explicitly', () => {
    const band = createBand({ id: 'band-live' });
    const membership = createBandMember({
      bandId: band.id,
      role: 'editor',
      userId: 'user-live',
    });
    const song = createSong({ bandId: band.id, id: 'song-live' });

    expect(membership.bandId).toBe(band.id);
    expect(song.bandId).toBe(band.id);
    expect(createLyricBlock()).toEqual({
      id: 'block-test',
      name: 'Verso',
      lines: [],
    });
  });

  it('creates collection memberships with explicit domain relationships', () => {
    const collection = createRepertoireCollection({
      bandId: 'band-live',
      id: 'collection-live',
      name: 'Acústico',
    });
    const membership = createRepertoireCollectionSong({
      bandId: collection.bandId,
      collectionId: collection.id,
      position: 2,
      songId: 'song-live',
    });

    expect(membership).toEqual({
      bandId: 'band-live',
      collectionId: 'collection-live',
      position: 2,
      songId: 'song-live',
    });
  });

  it('creates independent show blocks and setlist item variants', () => {
    const block = createShowSetlistBlock({
      id: 'block-live',
      items: [
        createShowSongSetlistItem({
          id: 'setlist-song-live',
          songId: 'song-live',
        }),
        createShowPlanningSetlistItem({
          id: 'setlist-planning-live',
          estimatedDurationMs: 30_000,
        }),
        createShowSeparatorSetlistItem({ id: 'setlist-separator-live' }),
      ],
    });
    const show = createShow({
      bandId: 'band-live',
      id: 'show-live',
      blocks: [block],
    });

    expect(show.blocks[0]).not.toBe(block);
    expect(show.blocks[0]?.items).not.toBe(block.items);
    expect(show.blocks[0]?.items[0]).not.toBe(block.items[0]);
    expect(show.blocks[0]?.items).toEqual(block.items);
  });

  it('creates list read models without full song lyrics or show setlists', () => {
    const song = createSongSummary();
    const show = createShowSummary();

    expect(createBandContext()).toMatchObject({
      hasActiveSongs: true,
      role: 'member',
    });
    expect(song).not.toHaveProperty('lyrics');
    expect(show).not.toHaveProperty('blocks');
    expect(createUserBandSummary()).toMatchObject({
      nextShowStartsAt: null,
      role: 'member',
    });
  });

  it('keeps unknown and zero show durations distinct in read models', () => {
    expect(createShowSummary().estimatedDurationMs).toBeNull();
    expect(
      createShowSummary({ estimatedDurationMs: 0 }).estimatedDurationMs,
    ).toBe(0);
  });
});
