import {
  act,
  render,
  renderHook,
  waitFor,
} from '@testing-library/react-native';
import {
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { AuthSessionContext } from '@/features/auth/AuthSessionProvider';
import { SupabaseBandRepository } from '@/data/supabase/repositories';
import { SupabaseSongRepository } from '@/data/supabase/songRepository';
import { registerActiveScreenQueries } from '@/data/screenQueryRegistry';
import { AppProviders, useAppData } from '@/providers/AppProviders';

let mockNetworkListener:
  | ((state: {
      readonly isConnected: boolean | null;
      readonly isInternetReachable: boolean | null;
    }) => void)
  | null = null;
let mockAppStateListener: ((state: AppStateStatus) => void) | null = null;

const appStateListenerSpy = jest.spyOn(AppState, 'addEventListener');

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn((listener) => {
    mockNetworkListener = listener;
    return jest.fn();
  }),
}));

function DataProbe() {
  const { currentUserId, repositories } = useAppData();

  return (
    <AppText testID="data-probe">
      {`${currentUserId}:${repositories.bands instanceof SupabaseBandRepository}:${repositories.songs instanceof SupabaseSongRepository}`}
    </AppText>
  );
}

function SongCacheProbe({
  queryFn,
  queryKey,
}: {
  readonly queryFn: () => Promise<string[]>;
  readonly queryKey: readonly string[];
}) {
  const query = useQuery({
    queryFn,
    queryKey,
  });
  const queryClient = useQueryClient();

  useEffect(
    () =>
      registerActiveScreenQueries(queryClient, () => [
        { ...query, refreshKeys: [queryKey] },
      ]),
    [query, queryClient, queryKey],
  );

  return <AppText>{query.data?.join(',') ?? 'sem dados'}</AppText>;
}

function InactiveCacheProbe({
  queryFn,
  queryKey,
}: {
  readonly queryFn: () => Promise<string[]>;
  readonly queryKey: readonly string[];
}) {
  const { data } = useQuery({ queryFn, queryKey });
  return <AppText>{data?.join(',') ?? 'cache inativo vazio'}</AppText>;
}

function QueryClientProbe({
  onClient,
}: {
  readonly onClient: (client: QueryClient) => void;
}) {
  const queryClient = useQueryClient();
  useEffect(() => {
    onClient(queryClient);
  }, [onClient, queryClient]);
  return null;
}

describe('<AppProviders />', () => {
  beforeEach(() => {
    mockNetworkListener = null;
    mockAppStateListener = null;
    appStateListenerSpy.mockImplementation(((
      _event: string,
      listener: (state: AppStateStatus) => void,
    ) => {
      mockAppStateListener = listener;
      return { remove: jest.fn() };
    }) as typeof AppState.addEventListener);
  });

  afterAll(() => {
    appStateListenerSpy.mockRestore();
  });

  it('usa o usuário autenticado e o repositório remoto de bandas', async () => {
    const view = await render(
      <AuthSessionContext.Provider
        value={{
          session: { user: { id: 'user-remote' } } as never,
          setSession: jest.fn(),
          status: 'authenticated',
        }}
      >
        <AppProviders>
          <DataProbe />
        </AppProviders>
      </AuthSessionContext.Provider>,
    );

    expect(view.getByTestId('data-probe')).toHaveTextContent(
      'user-remote:true:true',
    );
  });

  it('usa os repositórios remotos também sem sessão autenticada', async () => {
    const view = await render(
      <AppProviders>
        <DataProbe />
      </AppProviders>,
    );

    expect(view.getByTestId('data-probe')).toHaveTextContent(':true:true');
  });

  it('preserva o erro quando o hook é usado fora do provedor', async () => {
    await expect(renderHook(() => useAppData())).rejects.toThrow(
      'useAppData deve ser usado dentro de AppProviders.',
    );
  });

  it('descarta letras antigas da cache quando a conexão volta', async () => {
    const queryFn = jest
      .fn<Promise<string[]>, []>()
      .mockResolvedValueOnce(['LETRA_PRIVADA_ANTIGA'])
      .mockResolvedValueOnce([]);
    const view = await render(
      <AppProviders>
        <SongCacheProbe
          queryFn={queryFn}
          queryKey={['bands', 'cache-test', 'songs']}
        />
      </AppProviders>,
    );

    expect(await view.findByText('LETRA_PRIVADA_ANTIGA')).toBeTruthy();
    expect(mockNetworkListener).not.toBeNull();

    await act(async () => {
      mockNetworkListener?.({ isConnected: false, isInternetReachable: false });
      mockNetworkListener?.({ isConnected: true, isInternetReachable: true });
    });

    await waitFor(() =>
      expect(view.queryByText('LETRA_PRIVADA_ANTIGA')).toBeNull(),
    );
    expect(queryFn).toHaveBeenCalledTimes(2);
  });

  it('descarta coleções antigas quando a conexão volta', async () => {
    const queryFn = jest
      .fn<Promise<string[]>, []>()
      .mockResolvedValueOnce(['FESTA_ANTIGA'])
      .mockResolvedValueOnce([]);
    const view = await render(
      <AppProviders>
        <SongCacheProbe
          queryFn={queryFn}
          queryKey={['bands', 'cache-test', 'repertoire-collections']}
        />
      </AppProviders>,
    );

    expect(await view.findByText('FESTA_ANTIGA')).toBeTruthy();
    await act(async () => {
      mockNetworkListener?.({ isConnected: false, isInternetReachable: false });
      mockNetworkListener?.({ isConnected: true, isInternetReachable: true });
    });

    await waitFor(() => expect(view.queryByText('FESTA_ANTIGA')).toBeNull());
    expect(queryFn).toHaveBeenCalledTimes(2);
  });

  it('descarta conteúdo antigo ao voltar ao app em primeiro plano', async () => {
    const queryFn = jest
      .fn<Promise<string[]>, []>()
      .mockResolvedValueOnce(['SETLIST_ANTIGA'])
      .mockResolvedValueOnce([]);
    const view = await render(
      <AppProviders>
        <SongCacheProbe
          queryFn={queryFn}
          queryKey={['bands', 'cache-test', 'shows']}
        />
      </AppProviders>,
    );

    expect(await view.findByText('SETLIST_ANTIGA')).toBeTruthy();
    expect(mockAppStateListener).not.toBeNull();

    await act(async () => {
      mockAppStateListener?.('background');
    });
    expect(view.getByText('SETLIST_ANTIGA')).toBeTruthy();
    expect(queryFn).toHaveBeenCalledTimes(1);

    await act(async () => {
      mockAppStateListener?.('active');
    });

    await waitFor(() => expect(view.queryByText('SETLIST_ANTIGA')).toBeNull());
    expect(queryFn).toHaveBeenCalledTimes(2);
  });

  it('mantém a tela ativa visível enquanto revalida os dados ao voltar ao app', async () => {
    let finishRefresh!: (value: string[]) => void;
    const pendingRefresh = new Promise<string[]>((resolve) => {
      finishRefresh = resolve;
    });
    const queryFn = jest
      .fn<Promise<string[]>, []>()
      .mockResolvedValueOnce(['CONTEUDO_VISIVEL'])
      .mockReturnValueOnce(pendingRefresh);
    const view = await render(
      <AppProviders>
        <SongCacheProbe
          queryFn={queryFn}
          queryKey={['bands', 'resume-editor-test', 'songs']}
        />
      </AppProviders>,
    );

    expect(await view.findByText('CONTEUDO_VISIVEL')).toBeTruthy();
    await act(async () => {
      mockAppStateListener?.('background');
      mockAppStateListener?.('active');
    });

    await waitFor(() => expect(queryFn).toHaveBeenCalledTimes(2));
    expect(view.getByText('CONTEUDO_VISIVEL')).toBeTruthy();
    expect(view.queryByText('sem dados')).toBeNull();

    await act(async () => {
      finishRefresh(['CONTEUDO_ATUALIZADO']);
    });
    expect(await view.findByText('CONTEUDO_ATUALIZADO')).toBeTruthy();
  });

  it('limpa o conteúdo protegido das rotas inativas sem recarregá-las', async () => {
    const activeQueryFn = jest
      .fn<Promise<string[]>, []>()
      .mockResolvedValueOnce(['LETRA_ATIVA_ANTIGA'])
      .mockResolvedValueOnce(['LETRA_ATIVA_NOVA']);
    const inactiveQueryFn = jest
      .fn<Promise<string[]>, []>()
      .mockResolvedValue(['SETLIST_INATIVA_ANTIGA']);
    const view = await render(
      <AppProviders>
        <SongCacheProbe
          queryFn={activeQueryFn}
          queryKey={['bands', 'active-cache-test', 'songs']}
        />
        <InactiveCacheProbe
          queryFn={inactiveQueryFn}
          queryKey={['bands', 'inactive-cache-test', 'shows']}
        />
      </AppProviders>,
    );

    expect(await view.findByText('LETRA_ATIVA_ANTIGA')).toBeTruthy();
    expect(await view.findByText('SETLIST_INATIVA_ANTIGA')).toBeTruthy();

    await act(async () => {
      mockNetworkListener?.({ isConnected: false, isInternetReachable: false });
      mockNetworkListener?.({ isConnected: true, isInternetReachable: true });
    });

    expect(await view.findByText('LETRA_ATIVA_NOVA')).toBeTruthy();
    expect(view.queryByText('SETLIST_INATIVA_ANTIGA')).toBeNull();
    expect(inactiveQueryFn).toHaveBeenCalledTimes(1);
    expect(activeQueryFn).toHaveBeenCalledTimes(2);
  });

  it('isola o cache de dados entre sessões de usuários diferentes', async () => {
    const clients: QueryClient[] = [];
    const onClient = (client: QueryClient) => clients.push(client);
    const view = await render(
      <AuthSessionContext.Provider
        value={{
          session: { user: { id: 'user-first' } } as never,
          setSession: jest.fn(),
          status: 'authenticated',
        }}
      >
        <AppProviders>
          <QueryClientProbe onClient={onClient} />
        </AppProviders>
      </AuthSessionContext.Provider>,
    );

    await waitFor(() => expect(clients).toHaveLength(1));
    const firstClient = clients[0];
    firstClient.setQueryData(['bands', 'private'], 'DADO_DO_PRIMEIRO_USUARIO');

    view.rerender(
      <AuthSessionContext.Provider
        value={{
          session: { user: { id: 'user-second' } } as never,
          setSession: jest.fn(),
          status: 'authenticated',
        }}
      >
        <AppProviders>
          <QueryClientProbe onClient={onClient} />
        </AppProviders>
      </AuthSessionContext.Provider>,
    );

    await waitFor(() => expect(clients).toHaveLength(2));
    expect(clients[1]).not.toBe(firstClient);
    expect(clients[1].getQueryData(['bands', 'private'])).toBeUndefined();
    firstClient.clear();
    clients[1].clear();
  });
});
