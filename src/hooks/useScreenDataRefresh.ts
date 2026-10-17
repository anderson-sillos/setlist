import { useFocusEffect } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useLayoutEffect, useRef } from 'react';

import {
  registerActiveScreenQueries,
  refetchScreenQueries,
  uniqueRefreshQueries,
  type RefreshableScreenQuery,
} from '@/data/screenQueryRegistry';

export const SCREEN_DATA_FRESHNESS_MS = 60_000;

export type RefreshableQuery = RefreshableScreenQuery;

export function useScreenDataRefresh(
  queries: readonly RefreshableQuery[],
  enabled = true,
) {
  const queryClient = useQueryClient();
  const queriesRef = useRef(queries);
  const refreshInProgressRef = useRef(false);

  useLayoutEffect(() => {
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
      await refetchScreenQueries(queryClient, availableQueries);
    } finally {
      refreshInProgressRef.current = false;
    }
  }, [enabled, queryClient]);

  useFocusEffect(
    useCallback(() => {
      if (!enabled) {
        return;
      }

      const unregister = registerActiveScreenQueries(
        queryClient,
        () => queriesRef.current,
      );
      const now = Date.now();
      const staleQueries = uniqueRefreshQueries(queriesRef.current).filter(
        ({ dataUpdatedAt, isFetching, isStale }) =>
          !isFetching &&
          (Boolean(isStale) || now - dataUpdatedAt >= SCREEN_DATA_FRESHNESS_MS),
      );

      void refetchScreenQueries(queryClient, staleQueries);
      return unregister;
    }, [enabled, queryClient]),
  );

  return {
    onRefresh,
    refreshing: queries.some(({ isFetching }) => isFetching),
  };
}
