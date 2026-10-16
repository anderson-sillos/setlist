import { act, renderHook } from '@testing-library/react-native';

import {
  SCREEN_DATA_FRESHNESS_MS,
  useScreenDataRefresh,
} from '@/hooks/useScreenDataRefresh';

let mockFocusCallback: (() => void) | undefined;

jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void) => {
    mockFocusCallback = callback;
  },
}));

describe('useScreenDataRefresh', () => {
  beforeEach(() => {
    mockFocusCallback = undefined;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('atualiza apenas consultas antigas da tela focada', async () => {
    const now = 1_800_000_000_000;
    jest.spyOn(Date, 'now').mockReturnValue(now);
    const oldQuery = {
      dataUpdatedAt: now - SCREEN_DATA_FRESHNESS_MS,
      isFetching: false,
      refetch: jest.fn().mockResolvedValue(undefined),
    };
    const currentQuery = {
      dataUpdatedAt: now - SCREEN_DATA_FRESHNESS_MS + 1,
      isFetching: false,
      refetch: jest.fn().mockResolvedValue(undefined),
    };
    const fetchingQuery = {
      dataUpdatedAt: now - SCREEN_DATA_FRESHNESS_MS * 2,
      isFetching: true,
      refetch: jest.fn().mockResolvedValue(undefined),
    };

    await renderHook(() =>
      useScreenDataRefresh([oldQuery, currentQuery, fetchingQuery]),
    );

    await act(async () => {
      mockFocusCallback?.();
      await Promise.resolve();
    });

    expect(oldQuery.refetch).toHaveBeenCalledTimes(1);
    expect(currentQuery.refetch).not.toHaveBeenCalled();
    expect(fetchingQuery.refetch).not.toHaveBeenCalled();
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
    const { result } = await renderHook(() =>
      useScreenDataRefresh([
        { dataUpdatedAt: Date.now(), isFetching: false, refetch },
        alreadyFetching,
      ]),
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
    const { result } = await renderHook(() =>
      useScreenDataRefresh([songQuery, collectionQuery]),
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
    const { result } = await renderHook(() =>
      useScreenDataRefresh([firstQuery, secondQuery]),
    );

    await act(async () => {
      await result.current.onRefresh();
    });

    expect(firstQuery.refetch).toHaveBeenCalledTimes(1);
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

    await renderHook(() => useScreenDataRefresh([query, aggregateQuery]));

    await act(async () => {
      mockFocusCallback?.();
      await Promise.resolve();
    });

    expect(query.refetch).not.toHaveBeenCalled();
    expect(aggregateQuery.refetch).toHaveBeenCalledTimes(1);
  });
});
