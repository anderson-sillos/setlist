import { deriveLyricStatus } from '@/domain';
import {
  createBand,
  createBandMember,
  createLyricBlock,
  createLyricDocument,
  createLyricLine,
  createLyricsForStatus,
  createRepertoireCollection,
  createRepertoireCollectionSong,
  createSong,
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
});
