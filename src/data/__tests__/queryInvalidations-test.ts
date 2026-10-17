import { QueryClient } from '@tanstack/react-query';

import { invalidateBandReadData } from '@/data/queryInvalidations';
import { queryKeys } from '@/data/queryKeys';

const bandId = 'band-invalidation-test';
const showId = 'show-invalidation-test';
const userId = 'user-invalidation-test';

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Number.POSITIVE_INFINITY },
    },
  });
}

describe('invalidações dos resumos da banda', () => {
  it('marca vínculos de coleção sem invalidar nem recarregar músicas', async () => {
    const queryClient = createQueryClient();
    const listSongs = jest.fn().mockResolvedValue([{ id: 'song-1' }]);
    const songsKey = queryKeys.songs.documentsByBand(bandId, {
      includeArchived: true,
    });
    const collectionRecordsKey =
      queryKeys.repertoireCollections.recordsByBand(bandId);
    const membershipsKey =
      queryKeys.repertoireCollections.membershipsByBand(bandId);

    await queryClient.fetchQuery({ queryKey: songsKey, queryFn: listSongs });
    queryClient.setQueryData(collectionRecordsKey, [{ id: 'collection-1' }]);
    queryClient.setQueryData(membershipsKey, [{ songId: 'song-1' }]);

    await invalidateBandReadData(queryClient, { type: 'collection', bandId });

    expect(queryClient.getQueryState(collectionRecordsKey)?.isInvalidated).toBe(
      true,
    );
    expect(queryClient.getQueryState(membershipsKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(songsKey)?.isInvalidated).toBe(false);
    expect(listSongs).toHaveBeenCalledTimes(1);

    await queryClient.fetchQuery({ queryKey: songsKey, queryFn: listSongs });
    expect(listSongs).toHaveBeenCalledTimes(1);
    queryClient.clear();
  });

  it('invalida resumos de shows quando muda a duração da música', async () => {
    const queryClient = createQueryClient();
    const songsKey = queryKeys.songs.documentsByBand(bandId, {
      includeArchived: true,
    });
    const songSummariesKey = queryKeys.songs.summariesByBand(bandId, {
      includeArchived: true,
    });
    const songDocumentsByIdKey = queryKeys.songs.documentsByIds(bandId, [
      'song-1',
    ]);
    const userSongSummariesKey = queryKeys.songs.summariesForUser(userId);
    const showSummariesKey = queryKeys.shows.summariesByBand(bandId);
    const contextKey = queryKeys.bands.context('current-user', bandId);
    const collectionKey = queryKeys.repertoireCollections.recordsByBand(bandId);

    queryClient.setQueryData(songsKey, []);
    queryClient.setQueryData(songSummariesKey, []);
    queryClient.setQueryData(songDocumentsByIdKey, []);
    queryClient.setQueryData(userSongSummariesKey, []);
    queryClient.setQueryData(showSummariesKey, []);
    queryClient.setQueryData(contextKey, {});
    queryClient.setQueryData(collectionKey, []);

    await invalidateBandReadData(queryClient, {
      type: 'song-metadata',
      bandId,
      durationChanged: true,
      availabilityChanged: false,
    });

    expect(queryClient.getQueryState(songsKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(songDocumentsByIdKey)?.isInvalidated).toBe(
      true,
    );
    expect(queryClient.getQueryState(songSummariesKey)?.isInvalidated).toBe(
      true,
    );
    expect(queryClient.getQueryState(userSongSummariesKey)?.isInvalidated).toBe(
      true,
    );
    expect(queryClient.getQueryState(showSummariesKey)?.isInvalidated).toBe(
      true,
    );
    expect(queryClient.getQueryState(contextKey)?.isInvalidated).toBe(false);
    expect(queryClient.getQueryState(collectionKey)?.isInvalidated).toBe(false);
    queryClient.clear();
  });

  it('atualiza contexto e coleções após mudança no ciclo de vida da música', async () => {
    const queryClient = createQueryClient();
    const contextKey = queryKeys.bands.context(userId, bandId);
    const collectionLinksKey =
      queryKeys.repertoireCollections.membershipsByBand(bandId);
    const showSummariesKey = queryKeys.shows.summariesByBand(bandId);

    queryClient.setQueryData(contextKey, {});
    queryClient.setQueryData(collectionLinksKey, []);
    queryClient.setQueryData(showSummariesKey, []);

    await invalidateBandReadData(queryClient, {
      type: 'song-lifecycle',
      bandId,
    });

    expect(queryClient.getQueryState(contextKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(collectionLinksKey)?.isInvalidated).toBe(
      true,
    );
    expect(queryClient.getQueryState(showSummariesKey)?.isInvalidated).toBe(
      false,
    );
    queryClient.clear();
  });

  it('atualiza próximo show e cartões quando muda a agenda', async () => {
    const queryClient = createQueryClient();
    const showsKey = queryKeys.shows.summariesByBand(bandId);
    const bandSummaryKey = queryKeys.bands.userSummaries(userId);
    const songsKey = queryKeys.songs.documentsByBand(bandId);

    queryClient.setQueryData(showsKey, []);
    queryClient.setQueryData(bandSummaryKey, []);
    queryClient.setQueryData(songsKey, []);

    await invalidateBandReadData(queryClient, {
      type: 'show-schedule',
      bandId,
    });

    expect(queryClient.getQueryState(showsKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(bandSummaryKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(songsKey)?.isInvalidated).toBe(false);
    queryClient.clear();
  });

  it('invalida dados de papel e integrantes sem forçar busca em área inativa', async () => {
    const queryClient = createQueryClient();
    const membersKey = queryKeys.bands.members(bandId);
    const contextKey = queryKeys.bands.context(userId, bandId);
    const bandsKey = queryKeys.bands.userSummaries(userId);
    const refetchInactive = jest.fn().mockResolvedValue([]);

    await queryClient.fetchQuery({
      queryKey: bandsKey,
      queryFn: refetchInactive,
    });
    queryClient.setQueryData(membersKey, []);
    queryClient.setQueryData(contextKey, {});

    await invalidateBandReadData(queryClient, { type: 'membership', bandId });

    expect(queryClient.getQueryState(membersKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(contextKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(bandsKey)?.isInvalidated).toBe(true);
    expect(refetchInactive).toHaveBeenCalledTimes(1);

    await queryClient.fetchQuery({
      queryKey: bandsKey,
      queryFn: refetchInactive,
    });
    expect(refetchInactive).toHaveBeenCalledTimes(2);
    queryClient.clear();
  });

  it('atualiza somente os resumos e o detalhe do show salvo', async () => {
    const queryClient = createQueryClient();
    const showKey = queryKeys.shows.byId(bandId, showId);
    const showListKey = queryKeys.shows.byBand(bandId);
    const summariesKey = queryKeys.shows.summariesByBand(bandId);
    const bandSummaryKey = queryKeys.bands.userSummaries(userId);

    queryClient.setQueryData(showKey, {});
    queryClient.setQueryData(showListKey, []);
    queryClient.setQueryData(summariesKey, []);
    queryClient.setQueryData(bandSummaryKey, []);

    await invalidateBandReadData(queryClient, {
      type: 'show-setlist',
      bandId,
    });

    expect(queryClient.getQueryState(showKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(showListKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(summariesKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(bandSummaryKey)?.isInvalidated).toBe(
      false,
    );
    queryClient.clear();
  });
});
