import { useFocusEffect } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

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
  const pendingRefreshesRef = useRef(0);
  const [refreshing, setRefreshing] = useState(false);
  const isFetching = queries.some((query) => query.isFetching);

  useLayoutEffect(() => {
    queriesRef.current = queries;
  }, [queries]);

  useEffect(() => {
    // A refresh can share requests that were already running.
    if (!isFetching && pendingRefreshesRef.current === 0) {
      setRefreshing(false);
    }
  }, [isFetching]);

  const refreshQueries = useCallback(
    async (
      selectedQueries: readonly RefreshableQuery[],
      showIndicator: boolean,
    ) => {
      pendingRefreshesRef.current += 1;
      if (showIndicator) {
        setRefreshing(true);
      }

      try {
        await refetchScreenQueries(
          queryClient,
          selectedQueries.filter(({ isFetching }) => !isFetching),
        );
      } finally {
        pendingRefreshesRef.current -= 1;
        if (
          pendingRefreshesRef.current === 0 &&
          !queriesRef.current.some((query) => query.isFetching)
        ) {
          setRefreshing(false);
        }
      }
    },
    [queryClient],
  );

  const onRefresh = useCallback(async () => {
    if (!enabled || refreshInProgressRef.current) {
      return;
    }

    refreshInProgressRef.current = true;
    try {
      await refreshQueries(uniqueRefreshQueries(queriesRef.current), true);
    } finally {
      refreshInProgressRef.current = false;
    }
  }, [enabled, refreshQueries]);

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
        ({ dataUpdatedAt, isStale }) =>
          Boolean(isStale) || now - dataUpdatedAt >= SCREEN_DATA_FRESHNESS_MS,
      );

      if (staleQueries.length > 0) {
        // Initial loads have their own feedback; only revalidation uses the circle.
        void refreshQueries(
          staleQueries,
          staleQueries.some(({ dataUpdatedAt }) => dataUpdatedAt > 0),
        );
      }
      return unregister;
    }, [enabled, queryClient, refreshQueries]),
  );

  return {
    onRefresh,
    refreshing,
  };
}
