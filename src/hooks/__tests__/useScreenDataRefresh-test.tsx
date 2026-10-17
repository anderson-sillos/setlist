import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { refetchScreenQueries } from '@/data/screenQueryRegistry';
import {
  SCREEN_DATA_FRESHNESS_MS,
  useScreenDataRefresh,
} from '@/hooks/useScreenDataRefresh';

let mockFocusCallback: (() => void | (() => void)) | undefined;
let mockFocusCleanup: (() => void) | undefined;

jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void | (() => void)) => {
    mockFocusCallback = () => {
      mockFocusCleanup?.();
      mockFocusCleanup = callback() ?? undefined;
    };
  },
}));

const queryClient = new QueryClient();

function QueryProvider({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useScreenDataRefresh', () => {
  beforeEach(() => {
    mockFocusCallback = undefined;
    mockFocusCleanup = undefined;
  });

  afterEach(() => {
    mockFocusCleanup?.();
    mockFocusCleanup = undefined;
    jest.restoreAllMocks();
  });

  it('atualiza apenas consultas antigas da tela focada', async () => {
    const now = 1_800_000_000_000;
    jest.spyOn(Date, 'now').mockReturnValue(now);
    const oldQuery = {
      dataUpdatedAt: now - SCREEN_DATA_FRESHNESS_MS,
      isFetching: false,
      isStale: false,
      refetch: jest.fn().mockResolvedValue(undefined),
    };
    const currentQuery = {
      dataUpdatedAt: now - SCREEN_DATA_FRESHNESS_MS + 1,
      isFetching: false,
      isStale: false,
      refetch: jest.fn().mockResolvedValue(undefined),
    };
    const fetchingQuery = {
      dataUpdatedAt: now - SCREEN_DATA_FRESHNESS_MS * 2,
      isFetching: true,
      isStale: false,
      refetch: jest.fn().mockResolvedValue(undefined),
    };

    await renderHook(
      () => useScreenDataRefresh([oldQuery, currentQuery, fetchingQuery]),
      { wrapper: QueryProvider },
    );

    await act(async () => {
      mockFocusCallback?.();
      await Promise.resolve();
    });

    expect(oldQuery.refetch).toHaveBeenCalledTimes(1);
    expect(currentQuery.refetch).not.toHaveBeenCalled();
    expect(fetchingQuery.refetch).not.toHaveBeenCalled();
  });

  it('revalida uma consulta invalidada mesmo que ainda tenha cache recente', async () => {
    const now = 1_800_000_000_000;
    jest.spyOn(Date, 'now').mockReturnValue(now);
    const invalidatedQuery = {
      dataUpdatedAt: now - 1,
      isFetching: false,
      isStale: true,
      refetch: jest.fn().mockResolvedValue(undefined),
    };
    const currentQuery = {
      dataUpdatedAt: now - 1,
      isFetching: false,
      isStale: false,
      refetch: jest.fn().mockResolvedValue(undefined),
    };

    await renderHook(
      () => useScreenDataRefresh([invalidatedQuery, currentQuery]),
      { wrapper: QueryProvider },
    );

    await act(async () => {
      mockFocusCallback?.();
      await Promise.resolve();
    });

    expect(invalidatedQuery.refetch).toHaveBeenCalledTimes(1);
    expect(currentQuery.refetch).not.toHaveBeenCalled();
  });

  it('evita pedidos duplicados e limita o gesto aos dados recebidos pela tela', async () => {
    let finishRefresh: (() => void) | undefined;
    const refetch = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          finishRefresh = resolve;
        }),
    );
    const alreadyFetching = {
      dataUpdatedAt: Date.now(),
      isFetching: true,
      refetch: jest.fn().mockResolvedValue(undefined),
    };
    const { result } = await renderHook(
      () =>
        useScreenDataRefresh([
          { dataUpdatedAt: Date.now(), isFetching: false, refetch },
          alreadyFetching,
        ]),
      { wrapper: QueryProvider },
    );

    const firstRefresh = result.current.onRefresh();
    await Promise.resolve();
    await result.current.onRefresh();

    expect(refetch).toHaveBeenCalledTimes(1);
    expect(alreadyFetching.refetch).not.toHaveBeenCalled();

    finishRefresh?.();
    await act(async () => {
      await firstRefresh;
    });
  });

  it('usa a consulta composta quando ela já atualiza todas as dependências', async () => {
    const songQuery = {
      dataUpdatedAt: Date.now(),
      isFetching: false,
      refreshKeys: [['bands', 'band-1', 'songs']],
      refetch: jest.fn().mockResolvedValue(undefined),
    };
    const collectionQuery = {
      dataUpdatedAt: Date.now(),
      isFetching: false,
      refreshKeys: [
        ['bands', 'band-1', 'repertoire-collections', 'items'],
        ['bands', 'band-1', 'repertoire-collections', 'song-links'],
        ['bands', 'band-1', 'songs'],
      ],
      refetch: jest.fn().mockResolvedValue(undefined),
    };
    const { result } = await renderHook(
      () => useScreenDataRefresh([songQuery, collectionQuery]),
      { wrapper: QueryProvider },
    );

    await act(async () => {
      await result.current.onRefresh();
    });

    expect(songQuery.refetch).not.toHaveBeenCalled();
    expect(collectionQuery.refetch).toHaveBeenCalledTimes(1);
  });

  it('mantém consultas parcialmente sobrepostas para atualizar as dependências exclusivas', async () => {
    const firstQuery = {
      dataUpdatedAt: Date.now(),
      isFetching: false,
      refreshKeys: [['first'], ['shared']],
      refetch: jest.fn().mockResolvedValue(undefined),
    };
    const secondQuery = {
      dataUpdatedAt: Date.now(),
      isFetching: false,
      refreshKeys: [['shared'], ['second']],
      refetch: jest.fn().mockResolvedValue(undefined),
    };
    const { result } = await renderHook(
      () => useScreenDataRefresh([firstQuery, secondQuery]),
      { wrapper: QueryProvider },
    );

    await act(async () => {
      await result.current.onRefresh();
    });

    expect(firstQuery.refetch).toHaveBeenCalledTimes(1);
    expect(secondQuery.refetch).toHaveBeenCalledTimes(1);
  });

  it('não reinicia a mesma consulta enquanto outro consumidor já a atualiza', async () => {
    let finishRefresh: (() => void) | undefined;
    const sharedRefreshKey = [['bands', 'band-1', 'context', 'user-1']];
    const firstQuery = {
      dataUpdatedAt: 0,
      isFetching: false,
      refreshKeys: sharedRefreshKey,
      refetch: jest.fn(
        () =>
          new Promise<void>((resolve) => {
            finishRefresh = resolve;
          }),
      ),
    };
    const secondQuery = {
      dataUpdatedAt: 0,
      isFetching: false,
      refreshKeys: sharedRefreshKey,
      refetch: jest.fn().mockResolvedValue(undefined),
    };

    const firstRefresh = refetchScreenQueries(queryClient, [firstQuery]);
    await refetchScreenQueries(queryClient, [secondQuery]);

    expect(firstQuery.refetch).toHaveBeenCalledTimes(1);
    expect(secondQuery.refetch).not.toHaveBeenCalled();

    finishRefresh?.();
    await firstRefresh;
    await refetchScreenQueries(queryClient, [secondQuery]);

    expect(secondQuery.refetch).toHaveBeenCalledTimes(1);
  });

  it('aplica a mesma deduplicação ao retornar à tela após o período de frescor', async () => {
    const now = 1_800_000_000_000;
    jest.spyOn(Date, 'now').mockReturnValue(now);
    const query = {
      dataUpdatedAt: now - SCREEN_DATA_FRESHNESS_MS,
      isFetching: false,
      refreshKeys: [['bands', 'band-1', 'songs']],
      refetch: jest.fn().mockResolvedValue(undefined),
    };
    const aggregateQuery = {
      dataUpdatedAt: now - SCREEN_DATA_FRESHNESS_MS,
      isFetching: false,
      refreshKeys: [
        ['bands', 'band-1', 'songs'],
        ['bands', 'band-1', 'repertoire-collections', 'items'],
      ],
      refetch: jest.fn().mockResolvedValue(undefined),
    };

    await renderHook(() => useScreenDataRefresh([query, aggregateQuery]), {
      wrapper: QueryProvider,
    });

    await act(async () => {
      mockFocusCallback?.();
      await Promise.resolve();
    });

    expect(query.refetch).not.toHaveBeenCalled();
    expect(aggregateQuery.refetch).toHaveBeenCalledTimes(1);
  });
});
