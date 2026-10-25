import type { PropsWithChildren } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { AppRepositories, EntityId } from '@/domain';
import { AppProviders } from '@/providers/AppProviders';

const TEST_SAFE_AREA_METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, right: 0, bottom: 0, left: 0 },
};

interface TestAppProvidersProps extends PropsWithChildren {
  readonly currentUserId: EntityId;
  readonly repositories: AppRepositories;
}

/** Requires tests to supply their user and repositories explicitly. */
export function TestAppProviders({
  children,
  currentUserId,
  repositories,
}: TestAppProvidersProps) {
  return (
    <SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>
      <AppProviders currentUserId={currentUserId} repositories={repositories}>
        {children}
      </AppProviders>
    </SafeAreaProvider>
  );
}
