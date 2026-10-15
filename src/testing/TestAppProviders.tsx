import { useMemo, type PropsWithChildren } from 'react';

import { createDemoRepositories, demoIds } from '@/data/demo';
import type { AppRepositories, EntityId } from '@/domain';
import { AppProviders } from '@/providers/AppProviders';

interface TestAppProvidersProps extends PropsWithChildren {
  readonly currentUserId?: EntityId;
  readonly repositories?: AppRepositories;
}

/** Supplies deterministic repositories only to component and integration tests. */
export function TestAppProviders({
  children,
  currentUserId = demoIds.currentUser,
  repositories,
}: TestAppProvidersProps) {
  const testRepositories = useMemo(
    () => repositories ?? createDemoRepositories(),
    [repositories],
  );

  return (
    <AppProviders currentUserId={currentUserId} repositories={testRepositories}>
      {children}
    </AppProviders>
  );
}
