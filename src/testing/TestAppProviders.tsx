import type { PropsWithChildren } from 'react';

import type { AppRepositories, EntityId } from '@/domain';
import { AppProviders } from '@/providers/AppProviders';

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
    <AppProviders currentUserId={currentUserId} repositories={repositories}>
      {children}
    </AppProviders>
  );
}
