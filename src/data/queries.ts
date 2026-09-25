import { getCurrentBandTermAcceptance } from '@/data/supabase/legalTermMutations';
import { useQuery } from '@tanstack/react-query';

import type { EntityId, Song } from '@/domain';
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

export function useBandMembers(bandId: EntityId) {
  const { repositories } = useAppData();

  return useQuery({
    queryKey: ['bands', bandId, 'members'],
    queryFn: () => repositories.bands.listMembers(bandId),
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

export function useShow(bandId: EntityId, showId: EntityId) {
  const { repositories } = useAppData();

  return useQuery({
    queryKey: ['bands', bandId, 'shows', showId],
    queryFn: () => repositories.shows.findById(bandId, showId),
  });
}
