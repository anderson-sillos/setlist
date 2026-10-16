import type { QueryClient, QueryKey } from '@tanstack/react-query';

import type { EntityId } from '@/domain';
import { queryKeys } from '@/data/queryKeys';

export type BandReadChange =
  | {
      readonly type: 'song-metadata';
      readonly bandId: EntityId;
      readonly durationChanged: boolean;
      readonly availabilityChanged: boolean;
    }
  | { readonly type: 'song-lifecycle'; readonly bandId: EntityId }
  | { readonly type: 'show-schedule'; readonly bandId: EntityId }
  | { readonly type: 'show-setlist'; readonly bandId: EntityId }
  | { readonly type: 'collection'; readonly bandId: EntityId }
  | { readonly type: 'band-name'; readonly bandId: EntityId }
  | { readonly type: 'membership'; readonly bandId: EntityId }
  | { readonly type: 'band-deleted'; readonly bandId: EntityId }
  | { readonly type: 'band-created'; readonly bandId: EntityId };

interface QueryInvalidationTarget {
  readonly exact?: boolean;
  readonly queryKey: QueryKey;
}

function getAffectedQueries(
  change: BandReadChange,
): readonly QueryInvalidationTarget[] {
  switch (change.type) {
    case 'song-metadata':
      return [
        { queryKey: ['bands', change.bandId, 'songs'] },
        { queryKey: queryKeys.songs.summariesPrefixByBand(change.bandId) },
        { queryKey: queryKeys.songs.forUserPrefix() },
        ...(change.durationChanged
          ? [{ queryKey: queryKeys.shows.summariesByBand(change.bandId) }]
          : []),
        ...(change.availabilityChanged
          ? [{ queryKey: queryKeys.bands.contextByBand(change.bandId) }]
          : []),
      ];
    case 'song-lifecycle':
      return [
        { queryKey: ['bands', change.bandId, 'songs'] },
        { queryKey: queryKeys.songs.summariesPrefixByBand(change.bandId) },
        { queryKey: queryKeys.songs.forUserPrefix() },
        { queryKey: queryKeys.bands.contextByBand(change.bandId) },
        { queryKey: queryKeys.repertoireCollections.byBand(change.bandId) },
      ];
    case 'show-schedule':
      return [
        { queryKey: queryKeys.shows.byBand(change.bandId) },
        { queryKey: queryKeys.shows.summariesByBand(change.bandId) },
        { queryKey: queryKeys.bands.userPrefix() },
      ];
    case 'show-setlist':
      return [
        { queryKey: queryKeys.shows.byBand(change.bandId) },
        { queryKey: queryKeys.shows.summariesByBand(change.bandId) },
      ];
    case 'collection':
      return [
        { queryKey: queryKeys.repertoireCollections.byBand(change.bandId) },
      ];
    case 'band-name':
      return [
        { exact: true, queryKey: queryKeys.bands.byId(change.bandId) },
        { queryKey: queryKeys.bands.contextByBand(change.bandId) },
        { queryKey: queryKeys.bands.userPrefix() },
      ];
    case 'membership':
      return [
        { queryKey: queryKeys.bands.members(change.bandId) },
        { queryKey: queryKeys.bands.contextByBand(change.bandId) },
        { queryKey: queryKeys.bands.userPrefix() },
      ];
    case 'band-created':
      return [
        { queryKey: queryKeys.bands.userPrefix() },
        { exact: true, queryKey: queryKeys.bands.byId(change.bandId) },
        { queryKey: queryKeys.bands.contextByBand(change.bandId) },
      ];
    case 'band-deleted':
      return [{ queryKey: queryKeys.bands.userPrefix() }];
  }
}

export async function invalidateBandReadData(
  queryClient: QueryClient,
  change: BandReadChange,
): Promise<void> {
  const uniqueTargets = new Map<string, QueryInvalidationTarget>();
  getAffectedQueries(change).forEach((target) => {
    const mapKey = `${JSON.stringify(target.queryKey)}:${target.exact === true}`;
    uniqueTargets.set(mapKey, target);
  });

  await Promise.all(
    [...uniqueTargets.values()].map(({ exact, queryKey }) =>
      queryClient.invalidateQueries({
        exact,
        queryKey,
        refetchType: 'active',
      }),
    ),
  );
}
