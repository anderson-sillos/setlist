import type { RepertoireCollection, RepertoireCollectionSong } from '@/domain';

const DEFAULT_TIMESTAMP = '2026-01-01T12:00:00.000Z';

export function createRepertoireCollection(
  overrides: Partial<RepertoireCollection> = {},
): RepertoireCollection {
  return {
    id: 'collection-test',
    bandId: 'band-test',
    name: 'Coleção de teste',
    createdAt: DEFAULT_TIMESTAMP,
    updatedAt: DEFAULT_TIMESTAMP,
    ...overrides,
  };
}

export function createRepertoireCollectionSong(
  overrides: Partial<RepertoireCollectionSong> = {},
): RepertoireCollectionSong {
  return {
    bandId: 'band-test',
    collectionId: 'collection-test',
    songId: 'song-test',
    position: 0,
    ...overrides,
  };
}
