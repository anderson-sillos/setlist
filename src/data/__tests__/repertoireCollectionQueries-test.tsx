import { act, renderHook, waitFor } from '@testing-library/react-native';

import { demoRepositoryData } from '@/data/demo/demoData';
import {
  useAppendRepertoireCollectionSongs,
  useRepertoireCollections,
} from '@/data/queries';
import { createInMemoryRepositories } from '@/data/in-memory';
import { AppProviders } from '@/providers/AppProviders';

const bandId = 'band-collection-query-test';
const collectionId = 'collection-query-test';
const emptyCollectionId = 'collection-query-empty-test';
const firstSong = {
  ...demoRepositoryData.songs[0],
  bandId,
  estimatedDurationMs: 180_000,
  id: 'song-query-active',
};
const archivedSong = {
  ...demoRepositoryData.songs[1],
  archivedAt: '2026-10-01T12:00:00.000Z',
  bandId,
  estimatedDurationMs: null,
  id: 'song-query-archived',
};

function createRepositories() {
  return createInMemoryRepositories({
    bands: [{ ...demoRepositoryData.bands[0], id: bandId }],
    bandMembers: [],
    songs: [firstSong, archivedSong],
    shows: [],
    repertoireCollections: [
      {
        bandId,
        createdAt: '2026-10-01T11:55:00.000Z',
        id: emptyCollectionId,
        name: 'Acústico',
        updatedAt: '2026-10-01T11:55:00.000Z',
      },
      {
        bandId,
        createdAt: '2026-10-01T12:00:00.000Z',
        id: collectionId,
        name: 'Festa',
        updatedAt: '2026-10-01T12:00:00.000Z',
      },
    ],
    repertoireCollectionSongs: [
      {
        bandId,
        collectionId,
        position: 0,
        songId: firstSong.id,
      },
      {
        bandId,
        collectionId,
        position: 1,
        songId: archivedSong.id,
      },
    ],
  });
}

describe('consultas de coleções do repertório', () => {
  it('deriva quantidade, duração e músicas arquivadas em lote', async () => {
    const repositories = createRepositories();
    const listCollections = jest.spyOn(
      repositories.repertoireCollections,
      'listByBandId',
    );
    const listMemberships = jest.spyOn(
      repositories.repertoireCollections,
      'listSongsByBandId',
    );
    const listSongs = jest.spyOn(repositories.songs, 'listByBandId');
    const { result } = await renderHook(
      () => useRepertoireCollections(bandId),
      {
        wrapper: ({ children }) => (
          <AppProviders repositories={repositories}>{children}</AppProviders>
        ),
      },
    );

    await waitFor(() => expect(result.current.data).toHaveLength(2));
    const summary = result.current.data?.find(
      ({ collection }) => collection.id === collectionId,
    );
    expect(summary).toMatchObject({
      activeSongCount: 1,
      archivedSongCount: 1,
      estimatedDurationMs: 180_000,
      songCount: 2,
      songsWithoutDurationCount: 1,
    });
    expect(summary?.songs.map(({ id }) => id)).toEqual([
      firstSong.id,
      archivedSong.id,
    ]);
    expect(summary?.songs[0].title).toBe(firstSong.title);
    expect(listCollections).toHaveBeenCalledTimes(1);
    expect(listMemberships).toHaveBeenCalledTimes(1);
    expect(listSongs).toHaveBeenCalledTimes(1);
    expect(listSongs).toHaveBeenCalledWith(bandId, { includeArchived: true });
    expect(
      result.current.data?.find(
        ({ collection }) => collection.id === emptyCollectionId,
      ),
    ).toMatchObject({
      estimatedDurationMs: null,
      songCount: 0,
    });
  });

  it('atualiza resumo após inclusão e não duplica a música já vinculada', async () => {
    const repositories = createRepositories();
    const { result } = await renderHook(
      () => ({
        append: useAppendRepertoireCollectionSongs(bandId),
        collections: useRepertoireCollections(bandId),
      }),
      {
        wrapper: ({ children }) => (
          <AppProviders repositories={repositories}>{children}</AppProviders>
        ),
      },
    );

    await waitFor(() =>
      expect(result.current.collections.data).toHaveLength(2),
    );
    await act(async () => {
      await result.current.append.mutateAsync({
        collectionId,
        songIds: [firstSong.id, archivedSong.id],
      });
    });

    await waitFor(() =>
      expect(
        result.current.collections.data?.find(
          ({ collection }) => collection.id === collectionId,
        )?.songCount,
      ).toBe(2),
    );
    expect(
      result.current.collections.data
        ?.find(({ collection }) => collection.id === collectionId)
        ?.songs.map(({ id }) => id),
    ).toEqual([firstSong.id, archivedSong.id]);
  });
});
