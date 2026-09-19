import { useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, type PropsWithChildren } from 'react';

import { AuthLoadingScreen } from '@/features/auth/AuthLoadingScreen';
import { AuthScreen } from '@/features/auth/AuthScreen';
import { useAuthSession } from '@/features/auth/AuthSessionProvider';

export function isPublicAuthRoute(segment: string | undefined): boolean {
  return segment === 'auth' || segment === 'invite';
}

export function AuthGate({ children }: PropsWithChildren) {
  const segments = useSegments();
  const { status } = useAuthSession();
  const publicRoute = isPublicAuthRoute(segments[0]);

  useEffect(() => {
    if (status !== 'loading') {
      void SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [status]);

  if (status === 'loading') {
    return <AuthLoadingScreen label="Conferindo seu acesso…" />;
  }

  if (status !== 'authenticated' && !publicRoute) {
    return <AuthScreen />;
  }

  return children;
}
