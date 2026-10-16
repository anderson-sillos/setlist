import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useQueryClient } from '@tanstack/react-query';

import {
  useAppendRepertoireCollectionSongs,
  repertoireCollectionQueryKeys,
  useRepertoireCollections,
  useSongs,
} from '@/data/queries';
import { queryKeys } from '@/data/queryKeys';
import { createInMemoryRepositories } from '@/testing/repositories';
import {
  createBand,
  createRepertoireCollection,
  createRepertoireCollectionSong,
  createSong,
} from '@/testing/factories';
import { TestAppProviders as AppProviders } from '@/testing/TestAppProviders';

const bandId = 'band-collection-query-test';
const currentUserId = 'user-collection-query-test';
const collectionId = 'collection-query-test';
const emptyCollectionId = 'collection-query-empty-test';
const firstSong = createSong({
  bandId,
  estimatedDurationMs: 180_000,
  id: 'song-query-active',
  title: 'Primeira música',
});
const archivedSong = createSong({
  bandId,
  archivedAt: '2026-10-01T12:00:00.000Z',
  estimatedDurationMs: null,
  id: 'song-query-archived',
  title: 'Música arquivada',
});

function createRepositories() {
  return createInMemoryRepositories({
    bands: [createBand({ id: bandId })],
    bandMembers: [],
    songs: [firstSong, archivedSong],
    shows: [],
    repertoireCollections: [
      createRepertoireCollection({
        bandId,
        id: emptyCollectionId,
        name: 'Acústico',
        createdAt: '2026-10-01T11:55:00.000Z',
        updatedAt: '2026-10-01T11:55:00.000Z',
      }),
      createRepertoireCollection({
        bandId,
        id: collectionId,
        name: 'Festa',
        createdAt: '2026-10-01T12:00:00.000Z',
        updatedAt: '2026-10-01T12:00:00.000Z',
      }),
    ],
    repertoireCollectionSongs: [
      createRepertoireCollectionSong({
        bandId,
        collectionId,
        position: 0,
        songId: firstSong.id,
      }),
      createRepertoireCollectionSong({
        bandId,
        collectionId,
        position: 1,
        songId: archivedSong.id,
      }),
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
          <AppProviders
            currentUserId={currentUserId}
            repositories={repositories}
          >
            {children}
          </AppProviders>
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
    const listSongs = jest.spyOn(repositories.songs, 'listByBandId');
    const { result } = await renderHook(
      () => ({
        append: useAppendRepertoireCollectionSongs(bandId),
        collections: useRepertoireCollections(bandId),
      }),
      {
        wrapper: ({ children }) => (
          <AppProviders
            currentUserId={currentUserId}
            repositories={repositories}
          >
            {children}
          </AppProviders>
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
    expect(listSongs).toHaveBeenCalledTimes(1);
  });

  it('compartilha consulta de músicas entre Repertório e Coleções na abertura e no refresh', async () => {
    const repositories = createRepositories();
    const listSongs = jest.spyOn(repositories.songs, 'listByBandId');
    const { result } = await renderHook(
      () => ({
        collections: useRepertoireCollections(bandId),
        songs: useSongs(bandId, true),
      }),
      {
        wrapper: ({ children }) => (
          <AppProviders
            currentUserId={currentUserId}
            repositories={repositories}
          >
            {children}
          </AppProviders>
        ),
      },
    );

    await waitFor(() => {
      expect(result.current.collections.data).toHaveLength(2);
      expect(result.current.songs.data).toHaveLength(2);
    });
    expect(listSongs).toHaveBeenCalledTimes(1);
    expect(listSongs).toHaveBeenCalledWith(bandId, { includeArchived: true });

    await act(async () => {
      await result.current.collections.refetch();
    });
    expect(listSongs).toHaveBeenCalledTimes(2);
    expect(
      queryKeys.songs.documentsByBand(bandId, { includeArchived: true }),
    ).not.toEqual(
      queryKeys.songs.summariesByBand(bandId, { includeArchived: true }),
    );
  });

  it('usa a dependência mais antiga como referência do frescor do resumo', async () => {
    const repositories = createRepositories();
    const { result } = await renderHook(
      () => ({
        collections: useRepertoireCollections(bandId),
        queryClient: useQueryClient(),
      }),
      {
        wrapper: ({ children }) => (
          <AppProviders
            currentUserId={currentUserId}
            repositories={repositories}
          >
            {children}
          </AppProviders>
        ),
      },
    );

    await waitFor(() =>
      expect(result.current.collections.data).toHaveLength(2),
    );

    const oldTimestamp = Date.now() - 120_000;
    const freshTimestamp = Date.now();
    const queryClient = result.current.queryClient;
    const songKey = queryKeys.songs.documentsByBand(bandId, {
      includeArchived: true,
    });
    const songs = queryClient.getQueryData(songKey);

    await act(async () => {
      queryClient.setQueryData(
        repertoireCollectionQueryKeys.recordsByBand(bandId),
        queryClient.getQueryData(
          repertoireCollectionQueryKeys.recordsByBand(bandId),
        ),
        { updatedAt: freshTimestamp },
      );
      queryClient.setQueryData(
        repertoireCollectionQueryKeys.membershipsByBand(bandId),
        queryClient.getQueryData(
          repertoireCollectionQueryKeys.membershipsByBand(bandId),
        ),
        { updatedAt: freshTimestamp },
      );
      queryClient.setQueryData(songKey, songs, { updatedAt: oldTimestamp });
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(result.current.collections.dataUpdatedAt).toBe(oldTimestamp),
    );
  });
});
