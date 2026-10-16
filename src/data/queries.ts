import { getCurrentBandTermAcceptance } from '@/data/supabase/legalTermMutations';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
  type QueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';

import type {
  DeleteRepertoireCollectionInput,
  EntityId,
  RepertoireCollection,
  RepertoireCollectionSong,
  SaveRepertoireCollectionInput,
  SetSongRepertoireCollectionsInput,
  Song,
} from '@/domain';
import { queryKeys } from '@/data/queryKeys';
import { invalidateBandReadData } from '@/data/queryInvalidations';
import { RepertoireCollectionError } from '@/domain';
import { listInvitations } from '@/data/supabase/invitationMutations';
import { useAppData } from '@/providers/AppProviders';

function useKeyedQuery<
  TQueryFnData,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>) {
  const query = useQuery(options);

  return {
    ...query,
    refreshKeys: [options.queryKey],
  };
}

export function useCurrentBandTermAcceptance(
  bandId: EntityId,
  termVersion: string,
  enabled = true,
) {
  const { currentUserId } = useAppData();

  return useKeyedQuery({
    enabled,
    queryKey: queryKeys.bands.termAcceptance(
      bandId,
      currentUserId,
      termVersion,
    ),
    queryFn: () =>
      getCurrentBandTermAcceptance({
        bandId,
        termVersion,
        userId: currentUserId,
      }),
  });
}

export function useUserBands() {
  const { currentUserId, repositories } = useAppData();

  return useKeyedQuery({
    queryKey: queryKeys.bands.user(currentUserId),
    queryFn: () => repositories.bands.listForUser(currentUserId),
  });
}

export function useUserBandSummaries() {
  const { currentUserId, repositories } = useAppData();

  return useKeyedQuery({
    queryKey: queryKeys.bands.userSummaries(currentUserId),
    queryFn: async () => {
      const userBands = await repositories.bands.listForUser(currentUserId);

      return Promise.all(
        userBands.map(async (userBand) => ({
          ...userBand,
          shows: await repositories.shows.listByBandId(userBand.band.id),
        })),
      );
    },
  });
}

export function useUserRepertoireSongs() {
  const { currentUserId, repositories } = useAppData();

  return useKeyedQuery({
    queryKey: queryKeys.songs.forUser(currentUserId),
    queryFn: async (): Promise<readonly Song[]> => {
      const userBands = await repositories.bands.listForUser(currentUserId);
      const songsByBand = await Promise.all(
        userBands.map(({ band }) => repositories.songs.listByBandId(band.id)),
      );
      const seenSongIds = new Set<EntityId>();

      return songsByBand.flat().filter((song) => {
        if (seenSongIds.has(song.id)) {
          return false;
        }

        seenSongIds.add(song.id);
        return true;
      });
    },
  });
}

export function useBand(bandId: EntityId) {
  const { repositories } = useAppData();

  return useKeyedQuery({
    queryKey: queryKeys.bands.byId(bandId),
    queryFn: () => repositories.bands.findById(bandId),
  });
}

export function useBandMembers(bandId: EntityId | undefined) {
  const { repositories } = useAppData();

  return useKeyedQuery({
    enabled: Boolean(bandId),
    queryKey: queryKeys.bands.members(bandId ?? ''),
    queryFn: () => {
      if (!bandId) {
        throw new Error('A banda é necessária para carregar os integrantes.');
      }

      return repositories.bands.listMembers(bandId);
    },
  });
}

export function useBandInvitations(bandId: EntityId, enabled = true) {
  return useKeyedQuery({
    enabled,
    queryKey: queryKeys.bands.invitations(bandId),
    queryFn: () => listInvitations(bandId),
  });
}

export function useSongs(bandId: EntityId, includeArchived = false) {
  const { repositories } = useAppData();

  return useKeyedQuery({
    queryKey: queryKeys.songs.documentsByBand(bandId, { includeArchived }),
    queryFn: () => repositories.songs.listByBandId(bandId, { includeArchived }),
  });
}

export function useSong(bandId: EntityId, songId: EntityId, enabled = true) {
  const { repositories } = useAppData();

  return useKeyedQuery({
    enabled,
    queryKey: queryKeys.songs.documentById(bandId, songId),
    queryFn: () => repositories.songs.findById(bandId, songId),
  });
}

export function useShows(bandId: EntityId) {
  const { repositories } = useAppData();

  return useKeyedQuery({
    queryKey: queryKeys.shows.byBand(bandId),
    queryFn: () => repositories.shows.listByBandId(bandId),
  });
}

export interface RepertoireCollectionSummary {
  readonly collection: RepertoireCollection;
  readonly songs: readonly Song[];
  readonly songCount: number;
  readonly activeSongCount: number;
  readonly archivedSongCount: number;
  readonly estimatedDurationMs: number | null;
  readonly songsWithoutDurationCount: number;
}

export const repertoireCollectionQueryKeys = queryKeys.repertoireCollections;

function deriveRepertoireCollectionSummaries(
  collections: readonly RepertoireCollection[],
  memberships: readonly RepertoireCollectionSong[],
  songs: readonly Song[],
): readonly RepertoireCollectionSummary[] {
  const songsById = new Map(songs.map((song) => [song.id, song]));

  return collections.map((collection) => {
    const linkedSongs = memberships
      .filter((membership) => membership.collectionId === collection.id)
      .sort((left, right) => left.position - right.position)
      .flatMap((membership) => {
        const song = songsById.get(membership.songId);
        return song ? [song] : [];
      });
    const durationValues = linkedSongs.flatMap((song) =>
      song.estimatedDurationMs === null ? [] : [song.estimatedDurationMs],
    );

    return {
      activeSongCount: linkedSongs.filter((song) => song.archivedAt === null)
        .length,
      archivedSongCount: linkedSongs.filter((song) => song.archivedAt !== null)
        .length,
      collection,
      estimatedDurationMs:
        durationValues.length > 0
          ? durationValues.reduce((total, duration) => total + duration, 0)
          : null,
      songCount: linkedSongs.length,
      songs: linkedSongs,
      songsWithoutDurationCount: linkedSongs.length - durationValues.length,
    };
  });
}

export function useRepertoireCollections(bandId: EntityId) {
  const { repositories } = useAppData();
  const collectionsQuery = useKeyedQuery({
    queryKey: repertoireCollectionQueryKeys.recordsByBand(bandId),
    queryFn: () => repositories.repertoireCollections.listByBandId(bandId),
  });
  const membershipsQuery = useKeyedQuery({
    queryKey: repertoireCollectionQueryKeys.membershipsByBand(bandId),
    queryFn: () => repositories.repertoireCollections.listSongsByBandId(bandId),
  });
  const songsQuery = useSongs(bandId, true);
  const data =
    collectionsQuery.data && membershipsQuery.data && songsQuery.data
      ? deriveRepertoireCollectionSummaries(
          collectionsQuery.data,
          membershipsQuery.data,
          songsQuery.data,
        )
      : undefined;
  const refetch = async () => {
    const [collectionsResult, membershipsResult, songsResult] =
      await Promise.all([
        collectionsQuery.refetch(),
        membershipsQuery.refetch(),
        songsQuery.refetch(),
      ]);
    const refreshedData =
      collectionsResult.data && membershipsResult.data && songsResult.data
        ? deriveRepertoireCollectionSummaries(
            collectionsResult.data,
            membershipsResult.data,
            songsResult.data,
          )
        : undefined;
    const error =
      collectionsResult.error ?? membershipsResult.error ?? songsResult.error;

    return {
      data: refreshedData,
      error,
      isError: Boolean(error),
    };
  };

  return {
    data,
    dataUpdatedAt: Math.min(
      collectionsQuery.dataUpdatedAt,
      membershipsQuery.dataUpdatedAt,
      songsQuery.dataUpdatedAt,
    ),
    error: collectionsQuery.error ?? membershipsQuery.error ?? songsQuery.error,
    isError:
      collectionsQuery.isError ||
      membershipsQuery.isError ||
      songsQuery.isError,
    isFetching:
      collectionsQuery.isFetching ||
      membershipsQuery.isFetching ||
      songsQuery.isFetching,
    isLoading:
      collectionsQuery.isLoading ||
      membershipsQuery.isLoading ||
      songsQuery.isLoading,
    isPending:
      collectionsQuery.isPending ||
      membershipsQuery.isPending ||
      songsQuery.isPending,
    isSuccess:
      collectionsQuery.isSuccess &&
      membershipsQuery.isSuccess &&
      songsQuery.isSuccess,
    refreshKeys: [
      repertoireCollectionQueryKeys.recordsByBand(bandId),
      repertoireCollectionQueryKeys.membershipsByBand(bandId),
      queryKeys.songs.documentsByBand(bandId, { includeArchived: true }),
    ],
    refetch,
  };
}

export function useRepertoireCollection(
  bandId: EntityId,
  collectionId: EntityId,
) {
  const collectionsQuery = useRepertoireCollections(bandId);
  return {
    ...collectionsQuery,
    data: collectionsQuery.data?.find(
      ({ collection }) => collection.id === collectionId,
    ),
  };
}

async function invalidateRepertoireCollectionData(
  queryClient: QueryClient,
  bandId: EntityId,
) {
  await invalidateBandReadData(queryClient, { type: 'collection', bandId });
}

export function useSaveRepertoireCollection(bandId: EntityId) {
  const { repositories } = useAppData();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Omit<SaveRepertoireCollectionInput, 'bandId'>) =>
      repositories.repertoireCollections.save({ ...input, bandId }),
    onSuccess: () => invalidateRepertoireCollectionData(queryClient, bandId),
    onError: (error) =>
      error instanceof RepertoireCollectionError &&
      error.code === 'stale_revision'
        ? invalidateRepertoireCollectionData(queryClient, bandId)
        : undefined,
  });
}

export function useAppendRepertoireCollectionSongs(bandId: EntityId) {
  const { repositories } = useAppData();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      input: Omit<
        Parameters<typeof repositories.repertoireCollections.appendSongs>[0],
        'bandId'
      >,
    ) => repositories.repertoireCollections.appendSongs({ ...input, bandId }),
    onSuccess: () => invalidateRepertoireCollectionData(queryClient, bandId),
  });
}

export function useSetSongRepertoireCollections(bandId: EntityId) {
  const { repositories } = useAppData();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Omit<SetSongRepertoireCollectionsInput, 'bandId'>) =>
      repositories.repertoireCollections.setSongCollections({
        ...input,
        bandId,
      }),
    onSuccess: () => invalidateRepertoireCollectionData(queryClient, bandId),
  });
}

export function useDeleteRepertoireCollection(bandId: EntityId) {
  const { repositories } = useAppData();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Omit<DeleteRepertoireCollectionInput, 'bandId'>) =>
      repositories.repertoireCollections.delete({ ...input, bandId }),
    onSuccess: () => invalidateRepertoireCollectionData(queryClient, bandId),
    onError: (error) =>
      error instanceof RepertoireCollectionError &&
      error.code === 'stale_revision'
        ? invalidateRepertoireCollectionData(queryClient, bandId)
        : undefined,
  });
}

export function useShow(bandId: EntityId, showId: EntityId) {
  const { repositories } = useAppData();

  return useKeyedQuery({
    queryKey: queryKeys.shows.byId(bandId, showId),
    queryFn: () => repositories.shows.findById(bandId, showId),
  });
}
