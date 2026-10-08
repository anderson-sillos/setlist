import { getCurrentBandTermAcceptance } from '@/data/supabase/legalTermMutations';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
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
import { listInvitations } from '@/data/supabase/invitationMutations';
import { useAppData } from '@/providers/AppProviders';

export function useCurrentBandTermAcceptance(
  bandId: EntityId,
  termVersion: string,
  enabled = true,
) {
  const { currentUserId } = useAppData();

  return useQuery({
    enabled,
    queryKey: ['bands', bandId, 'term-acceptance', currentUserId, termVersion],
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

  return useQuery({
    queryKey: ['bands', 'user', currentUserId],
    queryFn: () => repositories.bands.listForUser(currentUserId),
  });
}

export function useUserBandSummaries() {
  const { currentUserId, repositories } = useAppData();

  return useQuery({
    queryKey: ['bands', 'user', currentUserId, 'summaries'],
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

  return useQuery({
    queryKey: ['songs', 'user', currentUserId],
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

  return useQuery({
    queryKey: ['bands', bandId],
    queryFn: () => repositories.bands.findById(bandId),
  });
}

export function useBandMembers(bandId: EntityId | undefined) {
  const { repositories } = useAppData();

  return useQuery({
    enabled: Boolean(bandId),
    queryKey: ['bands', bandId, 'members'],
    queryFn: () => {
      if (!bandId) {
        throw new Error('A banda é necessária para carregar os integrantes.');
      }

      return repositories.bands.listMembers(bandId);
    },
  });
}

export function useBandInvitations(bandId: EntityId, enabled = true) {
  return useQuery({
    enabled,
    queryKey: ['bands', bandId, 'invitations'],
    queryFn: () => listInvitations(bandId),
  });
}

export function useSongs(bandId: EntityId, includeArchived = false) {
  const { repositories } = useAppData();

  return useQuery({
    queryKey: ['bands', bandId, 'songs', { includeArchived }],
    queryFn: () => repositories.songs.listByBandId(bandId, { includeArchived }),
  });
}

export function useSong(bandId: EntityId, songId: EntityId, enabled = true) {
  const { repositories } = useAppData();

  return useQuery({
    enabled,
    queryKey: ['bands', bandId, 'songs', songId],
    queryFn: () => repositories.songs.findById(bandId, songId),
  });
}

export function useShows(bandId: EntityId) {
  const { repositories } = useAppData();

  return useQuery({
    queryKey: ['bands', bandId, 'shows'],
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

export const repertoireCollectionQueryKeys = {
  byBand: (bandId: EntityId) =>
    ['bands', bandId, 'repertoire-collections'] as const,
};

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

  return useQuery({
    queryKey: repertoireCollectionQueryKeys.byBand(bandId),
    queryFn: async () => {
      const [collections, memberships, songs] = await Promise.all([
        repositories.repertoireCollections.listByBandId(bandId),
        repositories.repertoireCollections.listSongsByBandId(bandId),
        repositories.songs.listByBandId(bandId, { includeArchived: true }),
      ]);

      return deriveRepertoireCollectionSummaries(
        collections,
        memberships,
        songs,
      );
    },
  });
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
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: repertoireCollectionQueryKeys.byBand(bandId),
    }),
    queryClient.invalidateQueries({
      queryKey: ['bands', bandId, 'songs'],
    }),
  ]);
}

export function useSaveRepertoireCollection(bandId: EntityId) {
  const { repositories } = useAppData();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Omit<SaveRepertoireCollectionInput, 'bandId'>) =>
      repositories.repertoireCollections.save({ ...input, bandId }),
    onSuccess: () => invalidateRepertoireCollectionData(queryClient, bandId),
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
  });
}

export function useShow(bandId: EntityId, showId: EntityId) {
  const { repositories } = useAppData();

  return useQuery({
    queryKey: ['bands', bandId, 'shows', showId],
    queryFn: () => repositories.shows.findById(bandId, showId),
  });
}
