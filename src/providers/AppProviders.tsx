import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createContext,
  type PropsWithChildren,
  useEffect,
  useMemo,
  useContext,
  useState,
} from 'react';

import { createDemoRepositories, demoIds } from '@/data/demo';
import { createSupabaseBandRepository } from '@/data/supabase';
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

export function AppProviders({
  children,
  currentUserId = demoIds.currentUser,
  repositories,
}: AppProvidersProps) {
  const { session } = useAuthSession();
  const demoRepositories = useState(() => createDemoRepositories())[0];
  const remoteBandRepository = useMemo(
    () =>
      createSupabaseBandRepository(demoRepositories.bands, demoIds.currentUser),
    [demoRepositories],
  );
  const sessionUserId = session?.user.id;
  const resolvedRepositories = useMemo(
    () =>
      repositories ??
      (sessionUserId
        ? { ...demoRepositories, bands: remoteBandRepository }
        : demoRepositories),
    [demoRepositories, remoteBandRepository, repositories, sessionUserId],
  );
  const resolvedUserId = sessionUserId ?? currentUserId;
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
  }, [queryClient, session, sessionUserId]);

  return (
    <AppDataContext.Provider
      value={{
        currentUserId: resolvedUserId,
        repositories: resolvedRepositories,
      }}
    >
      <QueryClientProvider client={queryClient}>
        <LastBandSelectionProvider>
          <NavigationMemoryProvider>{children}</NavigationMemoryProvider>
        </LastBandSelectionProvider>
      </QueryClientProvider>
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
