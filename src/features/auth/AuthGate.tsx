import { useSegments } from 'expo-router';
import type { PropsWithChildren } from 'react';

import { Screen } from '@/components/ui/Screen';
import { AuthLoadingState } from '@/features/auth/AuthLoadingState';
import { AuthScreen } from '@/features/auth/AuthScreen';
import { useAuthSession } from '@/features/auth/AuthSessionProvider';

export function isPublicAuthRoute(segment: string | undefined): boolean {
  return segment === 'auth' || segment === 'invite';
}

export function AuthGate({ children }: PropsWithChildren) {
  const segments = useSegments();
  const { status } = useAuthSession();
  const publicRoute = isPublicAuthRoute(segments[0]);

  if (status === 'loading') {
    return (
      <Screen testID="auth-gate-loading">
        <AuthLoadingState label="Conferindo seu acesso…" />
      </Screen>
    );
  }

  if (status !== 'authenticated' && !publicRoute) {
    return <AuthScreen />;
  }

  return children;
}
