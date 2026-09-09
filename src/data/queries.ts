import { useQuery } from '@tanstack/react-query';

import type { EntityId } from '@/domain';
import { useAppData } from '@/providers/AppProviders';

export function useUserBands() {
  const { currentUserId, repositories } = useAppData();

  return useQuery({
    queryKey: ['bands', 'user', currentUserId],
    queryFn: () => repositories.bands.listForUser(currentUserId),
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

export function useSongs(bandId: EntityId, includeArchived = false) {
  const { repositories } = useAppData();

  return useQuery({
    queryKey: ['bands', bandId, 'songs', { includeArchived }],
    queryFn: () => repositories.songs.listByBandId(bandId, { includeArchived }),
  });
}

export function useSong(bandId: EntityId, songId: EntityId) {
  const { repositories } = useAppData();

  return useQuery({
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
