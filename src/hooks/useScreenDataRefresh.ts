import { useFocusEffect } from 'expo-router';
import type { QueryKey } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';

export const SCREEN_DATA_FRESHNESS_MS = 60_000;

export interface RefreshableQuery {
  readonly dataUpdatedAt: number;
  readonly isFetching: boolean;
  readonly refreshKeys?: readonly QueryKey[];
  readonly refetch: () => Promise<unknown>;
}

function serializeQueryKey(queryKey: QueryKey): string {
  return JSON.stringify(queryKey);
}

function isCoveredBy(
  candidateKeys: readonly string[],
  coveringKeys: readonly string[],
): boolean {
  return candidateKeys.every((key) => coveringKeys.includes(key));
}

function uniqueRefreshQueries(
  queries: readonly RefreshableQuery[],
): readonly RefreshableQuery[] {
  const keyedQueries = queries.map((query, index) => ({
    index,
    keys: (query.refreshKeys ?? []).map(serializeQueryKey),
    query,
  }));

  return keyedQueries
    .filter(({ index, keys }) => {
      if (keys.length === 0) {
        return true;
      }

      return !keyedQueries.some((other) => {
        if (other.index === index || other.keys.length === 0) {
          return false;
        }

        if (!isCoveredBy(keys, other.keys)) {
          return false;
        }

        return (
          other.keys.length > keys.length ||
          (other.keys.length === keys.length && other.index < index)
        );
      });
    })
    .map(({ query }) => query);
}

export function useScreenDataRefresh(
  queries: readonly RefreshableQuery[],
  enabled = true,
) {
  const queriesRef = useRef(queries);
  const refreshInProgressRef = useRef(false);

  useEffect(() => {
    queriesRef.current = queries;
  }, [queries]);

  const onRefresh = useCallback(async () => {
    if (!enabled || refreshInProgressRef.current) {
      return;
    }

    refreshInProgressRef.current = true;
    try {
      const availableQueries = uniqueRefreshQueries(queriesRef.current).filter(
        ({ isFetching }) => !isFetching,
      );
      await Promise.all(availableQueries.map(({ refetch }) => refetch()));
    } finally {
      refreshInProgressRef.current = false;
    }
  }, [enabled]);

  useFocusEffect(
    useCallback(() => {
      if (!enabled) {
        return;
      }

      const now = Date.now();
      const staleQueries = uniqueRefreshQueries(queriesRef.current).filter(
        ({ dataUpdatedAt, isFetching }) =>
          !isFetching && now - dataUpdatedAt >= SCREEN_DATA_FRESHNESS_MS,
      );

      void Promise.all(staleQueries.map(({ refetch }) => refetch()));
    }, [enabled]),
  );

  return {
    onRefresh,
    refreshing: queries.some(({ isFetching }) => isFetching),
  };
}
