import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';

export const SCREEN_DATA_FRESHNESS_MS = 60_000;

export interface RefreshableQuery {
  readonly dataUpdatedAt: number;
  readonly isFetching: boolean;
  readonly refetch: () => Promise<unknown>;
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
      const availableQueries = queriesRef.current.filter(
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
      const staleQueries = queriesRef.current.filter(
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
