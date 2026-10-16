import type { QueryClient, QueryKey } from '@tanstack/react-query';

export interface RefreshableScreenQuery {
  readonly dataUpdatedAt: number;
  readonly isFetching: boolean;
  readonly isStale?: boolean;
  readonly refreshKeys?: readonly QueryKey[];
  readonly refetch: () => Promise<unknown>;
}

type ScreenQuerySource = () => readonly RefreshableScreenQuery[];

const activeScreenQuerySources = new Map<QueryClient, Set<ScreenQuerySource>>();

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

  await Promise.all(queries.map(({ refetch }) => refetch()));
}
