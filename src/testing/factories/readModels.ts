import type {
  BandContext,
  ShowSummary,
  SongSummary,
  UserBandSummary,
} from '@/domain';

const DEFAULT_TIMESTAMP = '2026-01-01T12:00:00.000Z';

export function createBandContext(
  overrides: Partial<BandContext> = {},
): BandContext {
  return {
    bandId: 'band-test',
    bandName: 'Banda de teste',
    hasActiveSongs: true,
    role: 'member',
    ...overrides,
  };
}

export function createUserBandSummary(
  overrides: Partial<UserBandSummary> = {},
): UserBandSummary {
  return {
    bandId: 'band-test',
    bandName: 'Banda de teste',
    nextShowStartsAt: null,
    role: 'member',
    ...overrides,
  };
}

export function createSongSummary(
  overrides: Partial<SongSummary> = {},
): SongSummary {
  return {
    archivedAt: null,
    bandId: 'band-test',
    bpm: null,
    createdAt: DEFAULT_TIMESTAMP,
    estimatedDurationMs: null,
    id: 'song-test',
    lyricStatus: 'missing',
    musicalKey: null,
    originalArtist: null,
    title: 'Música de teste',
    updatedAt: DEFAULT_TIMESTAMP,
    ...overrides,
  };
}

export function createShowSummary(
  overrides: Partial<ShowSummary> = {},
): ShowSummary {
  return {
    bandId: 'band-test',
    estimatedDurationMs: null,
    id: 'show-test',
    name: 'Show de teste',
    startsAt: DEFAULT_TIMESTAMP,
    status: 'draft',
    venue: 'Casa de shows',
    ...overrides,
  };
}
