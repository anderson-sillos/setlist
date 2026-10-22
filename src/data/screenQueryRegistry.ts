import type { QueryClient, QueryKey } from '@tanstack/react-query';

export interface RefreshableScreenQuery {
  readonly dataUpdatedAt: number;
  readonly isEnabled?: boolean;
  readonly isFetching: boolean;
  readonly isStale?: boolean;
  readonly refreshKeys?: readonly QueryKey[];
  readonly refetch: () => Promise<unknown>;
}

type ScreenQuerySource = () => readonly RefreshableScreenQuery[];

const activeScreenQuerySources = new Map<QueryClient, Set<ScreenQuerySource>>();
const inFlightRefreshKeys = new WeakMap<QueryClient, Map<string, number>>();

function serializeQueryKey(queryKey: QueryKey): string {
  return JSON.stringify(queryKey);
}

function isCoveredBy(
  candidateKeys: readonly string[],
  coveringKeys: readonly string[],
): boolean {
  return candidateKeys.every((key) => coveringKeys.includes(key));
}

export function uniqueRefreshQueries(
  queries: readonly RefreshableScreenQuery[],
): readonly RefreshableScreenQuery[] {
  // refetch() ignora enabled: false; consultas sem os parâmetros necessários
  // devem ser excluídas antes da deduplicação e de qualquer atualização.
  const keyedQueries = queries
    .filter(({ isEnabled }) => isEnabled !== false)
    .map((query, index) => ({
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

/** Refetches selected screen queries without restarting an equivalent request. */
export async function refetchScreenQueries(
  queryClient: QueryClient,
  queries: readonly RefreshableScreenQuery[],
): Promise<void> {
  const inFlightKeys = inFlightRefreshKeys.get(queryClient) ?? new Map();
  inFlightRefreshKeys.set(queryClient, inFlightKeys);

  const queriesToRefresh = uniqueRefreshQueries(queries).filter((query) => {
    const keys = (query.refreshKeys ?? []).map(serializeQueryKey);
    return keys.length === 0 || !keys.every((key) => inFlightKeys.has(key));
  });
  const keysByQuery = queriesToRefresh.map((query) =>
    (query.refreshKeys ?? []).map(serializeQueryKey),
  );

  keysByQuery.forEach((keys) => {
    keys.forEach((key) => {
      inFlightKeys.set(key, (inFlightKeys.get(key) ?? 0) + 1);
    });
  });

  try {
    await Promise.all(queriesToRefresh.map(({ refetch }) => refetch()));
  } finally {
    keysByQuery.forEach((keys) => {
      keys.forEach((key) => {
        const activeRefreshCount = inFlightKeys.get(key) ?? 0;
        if (activeRefreshCount <= 1) {
          inFlightKeys.delete(key);
        } else {
          inFlightKeys.set(key, activeRefreshCount - 1);
        }
      });
    });
  }
}

export function registerActiveScreenQueries(
  queryClient: QueryClient,
  getQueries: ScreenQuerySource,
): () => void {
  let sources = activeScreenQuerySources.get(queryClient);
  if (!sources) {
    sources = new Set();
    activeScreenQuerySources.set(queryClient, sources);
  }
  sources.add(getQueries);

  return () => {
    sources?.delete(getQueries);
    if (sources?.size === 0) {
      activeScreenQuerySources.delete(queryClient);
    }
  };
}

/** Refreshes only queries belonging to currently focused screens. */
export async function refreshActiveScreenQueries(
  queryClient: QueryClient,
): Promise<void> {
  const sources = activeScreenQuerySources.get(queryClient);
  if (!sources) {
    return;
  }

  const queries = uniqueRefreshQueries(
    [...sources].flatMap((getQueries) => getQueries()),
  );

  await refetchScreenQueries(queryClient, queries);
}
