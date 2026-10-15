import type { Song } from '@/domain';
import { createLyricDocument } from './lyrics';

const DEFAULT_TIMESTAMP = '2026-01-01T12:00:00.000Z';

export function createSong(overrides: Partial<Song> = {}): Song {
  const { lyrics, ...fields } = overrides;

  return {
    id: 'song-test',
    bandId: 'band-test',
    title: 'Música de teste',
    originalArtist: null,
    musicalKey: null,
    bpm: null,
    estimatedDurationMs: null,
    youtubeReference: null,
    lyricStatus: 'missing',
    notes: null,
    archivedAt: null,
    createdAt: DEFAULT_TIMESTAMP,
    updatedAt: DEFAULT_TIMESTAMP,
    ...fields,
    lyrics: createLyricDocument(lyrics),
  };
}
