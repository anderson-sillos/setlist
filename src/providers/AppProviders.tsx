import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';
import { AppState } from 'react-native';
import {
  createContext,
  type PropsWithChildren,
  useEffect,
  useMemo,
  useContext,
  useState,
} from 'react';

import { createDemoRepositories, demoIds } from '@/data/demo';
import {
  createSupabaseBandRepository,
  createSupabaseSongRepository,
} from '@/data/supabase';
import { createSupabaseShowRepository } from '@/data/supabase/showRepository';
import { createSupabaseRepertoireCollectionRepository } from '@/data/supabase/repertoireCollectionRepository';
import type { AppRepositories, EntityId } from '@/domain';
import { LastBandSelectionProvider } from '@/features/bands/LastBandSelection';
import { useAuthSession } from '@/features/auth/AuthSessionProvider';
import { NavigationMemoryProvider } from '@/features/navigation/NavigationMemory';

interface AppDataContextValue {
  readonly currentUserId: EntityId;
  readonly repositories: AppRepositories;
}

interface AppProvidersProps extends PropsWithChildren {
  readonly currentUserId?: EntityId;
  readonly repositories?: AppRepositories;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

interface SessionQueryProviderProps extends PropsWithChildren {
  readonly sessionUserId?: string;
}

function SessionQueryProvider({
  children,
  sessionUserId,
}: SessionQueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            gcTime: Number.POSITIVE_INFINITY,
            retry: false,
            staleTime: Number.POSITIVE_INFINITY,
          },
        },
      }),
  );

  useEffect(() => {
    if (sessionUserId) {
      void queryClient.invalidateQueries({
        queryKey: ['profiles', sessionUserId],
      });
    }
  }, [queryClient, sessionUserId]);

  useEffect(() => {
    const clearContent = () => {
      // Descarta letras e setlists antigos antes de buscar a versão autorizada.
      void queryClient.resetQueries({
        predicate: ({ queryKey }) =>
          queryKey.includes('songs') ||
          queryKey.includes('shows') ||
          queryKey.includes('repertoire-collections') ||
          queryKey.includes('summaries'),
      });
    };
    let wasOffline = false;
    const unsubscribeNetwork = NetInfo.addEventListener((state) => {
      const isOnline =
        state.isConnected === true && state.isInternetReachable !== false;
      if (wasOffline && isOnline) {
        clearContent();
      }
      wasOffline = !isOnline;
    });
    let lastAppState = AppState.currentState;
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (lastAppState !== 'active' && nextState === 'active') {
        clearContent();
      }
      lastAppState = nextState;
    });
    return () => {
      unsubscribeNetwork();
      subscription.remove();
    };
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

export function AppProviders({
  children,
  currentUserId,
  repositories,
}: AppProvidersProps) {
  const { session } = useAuthSession();
  const isTestEnvironment = process.env.NODE_ENV === 'test';
  const demoRepositories = useState(() =>
    isTestEnvironment ? createDemoRepositories() : null,
  )[0];
  const remoteRepositories = useMemo(
    () => ({
      bands: createSupabaseBandRepository(),
      repertoireCollections: createSupabaseRepertoireCollectionRepository(),
      shows: createSupabaseShowRepository(),
      songs: createSupabaseSongRepository(),
    }),
    [],
  );
  const sessionUserId = session?.user.id;
  const resolvedRepositories = useMemo(
    () =>
      repositories ??
      (sessionUserId || !demoRepositories
        ? remoteRepositories
        : demoRepositories),
    [demoRepositories, repositories, remoteRepositories, sessionUserId],
  );
  const resolvedUserId =
    sessionUserId ??
    currentUserId ??
    (isTestEnvironment ? demoIds.currentUser : '');

  return (
    <AppDataContext.Provider
      value={{
        currentUserId: resolvedUserId,
        repositories: resolvedRepositories,
      }}
    >
      <SessionQueryProvider
        key={sessionUserId ?? 'anonymous'}
        sessionUserId={sessionUserId}
      >
        <LastBandSelectionProvider>
          <NavigationMemoryProvider>{children}</NavigationMemoryProvider>
        </LastBandSelectionProvider>
      </SessionQueryProvider>
    </AppDataContext.Provider>
  );
}

export function useAppData(): AppDataContextValue {
  const value = useContext(AppDataContext);

  if (!value) {
    throw new Error('useAppData deve ser usado dentro de AppProviders.');
  }

  return value;
}
