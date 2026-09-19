import { useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState, type PropsWithChildren } from 'react';

import { AuthLoadingScreen } from '@/features/auth/AuthLoadingScreen';
import { AuthScreen } from '@/features/auth/AuthScreen';
import { useAuthSession } from '@/features/auth/AuthSessionProvider';
import { getAuthPreviewDelays } from '@/features/auth/authPreview';

export function isPublicAuthRoute(segment: string | undefined): boolean {
  return segment === 'auth' || segment === 'invite';
}

export function AuthGate({ children }: PropsWithChildren) {
  const segments = useSegments();
  const { status } = useAuthSession();
  const publicRoute = isPublicAuthRoute(segments[0]);
  const { authGateMs, splashMs } = getAuthPreviewDelays();
  const [splashPreviewTimerElapsed, setSplashPreviewTimerElapsed] =
    useState(false);
  const [authGatePreviewTimerElapsed, setAuthGatePreviewTimerElapsed] =
    useState(false);
  const authGatePreviewStarted = useRef(false);

  useEffect(() => {
    if (splashMs === 0) {
      return;
    }

    const timer = setTimeout(() => {
      setSplashPreviewTimerElapsed(true);
    }, splashMs);

    return () => clearTimeout(timer);
  }, [splashMs]);

  const splashPreviewElapsed = splashMs === 0 || splashPreviewTimerElapsed;
  const authGatePreviewElapsed =
    authGateMs === 0 || authGatePreviewTimerElapsed;

  useEffect(() => {
    if (
      authGateMs === 0 ||
      status === 'loading' ||
      authGatePreviewStarted.current
    ) {
      return;
    }

    authGatePreviewStarted.current = true;
    const timer = setTimeout(() => {
      setAuthGatePreviewTimerElapsed(true);
    }, authGateMs);

    return () => clearTimeout(timer);
  }, [authGateMs, status]);

  useEffect(() => {
    if (splashPreviewElapsed && (status !== 'loading' || splashMs > 0)) {
      void SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [splashMs, splashPreviewElapsed, status]);

  if (status === 'loading' || !authGatePreviewElapsed) {
    return <AuthLoadingScreen label="Conferindo seu acesso…" />;
  }

  if (status !== 'authenticated' && !publicRoute) {
    return <AuthScreen />;
  }

  return children;
}
