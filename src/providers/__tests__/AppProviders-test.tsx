import {
  act,
  render,
  renderHook,
  waitFor,
} from '@testing-library/react-native';
import { useQuery } from '@tanstack/react-query';

import { AppText } from '@/components/ui/AppText';
import { AuthSessionContext } from '@/features/auth/AuthSessionProvider';
import { SupabaseBandRepository } from '@/data/supabase/repositories';
import { SupabaseSongRepository } from '@/data/supabase/songRepository';
import { AppProviders, useAppData } from '@/providers/AppProviders';

let mockNetworkListener:
  | ((state: {
      readonly isConnected: boolean | null;
      readonly isInternetReachable: boolean | null;
    }) => void)
  | null = null;

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
  const { data } = useQuery({
    queryFn,
    queryKey,
  });

  return <AppText>{data?.join(',') ?? 'sem dados'}</AppText>;
}

describe('<AppProviders />', () => {
  beforeEach(() => {
    mockNetworkListener = null;
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
});
