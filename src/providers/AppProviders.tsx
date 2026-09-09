import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useState,
} from 'react';

import { createDemoRepositories, demoIds } from '@/data/demo';
import type { AppRepositories, EntityId } from '@/domain';

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
  repositories = createDemoRepositories(),
}: AppProvidersProps) {
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

  return (
    <AppDataContext.Provider value={{ currentUserId, repositories }}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
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
