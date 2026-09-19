import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { AppState, Platform, type AppStateStatus } from 'react-native';
import type { Session } from '@supabase/supabase-js';

import { getSupabaseClient } from '@/data/supabase/client';

export type AuthSessionStatus =
  'authenticated' | 'error' | 'loading' | 'unauthenticated';

export interface AuthSessionContextValue {
  readonly session: Session | null;
  readonly setSession: (session: Session | null) => void;
  readonly status: AuthSessionStatus;
}

const defaultAuthSession: AuthSessionContextValue = {
  session: null,
  setSession: () => undefined,
  status: 'unauthenticated',
};

export const AuthSessionContext =
  createContext<AuthSessionContextValue>(defaultAuthSession);

export function AuthSessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthSessionStatus>('loading');

  const updateSession = useCallback((nextSession: Session | null) => {
    setSession(nextSession);
    setStatus(nextSession ? 'authenticated' : 'unauthenticated');
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    const auth = getSupabaseClient().auth as ReturnType<
      typeof getSupabaseClient
    >['auth'] & {
      startAutoRefresh?: () => void;
      stopAutoRefresh?: () => void;
    };

    if (
      typeof auth.startAutoRefresh !== 'function' ||
      typeof auth.stopAutoRefresh !== 'function'
    ) {
      return;
    }

    const updateRefreshState = (state: AppStateStatus) => {
      if (state === 'active') {
        auth.startAutoRefresh?.();
      } else {
        auth.stopAutoRefresh?.();
      }
    };

    updateRefreshState(AppState.currentState);
    const subscription = AppState.addEventListener(
      'change',
      updateRefreshState,
    );

    return () => {
      subscription?.remove();
      auth.stopAutoRefresh?.();
    };
  }, []);

  useEffect(() => {
    let active = true;
    const client = getSupabaseClient();
    const { data } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (active) {
        updateSession(nextSession);
      }
    });

    void client.auth
      .getSession()
      .then(({ data: sessionData, error }) => {
        if (!active) {
          return;
        }

        if (error) {
          setStatus('error');
          return;
        }

        updateSession(sessionData.session);
      })
      .catch(() => {
        if (active) {
          setStatus('error');
        }
      });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [updateSession]);

  const value = useMemo(
    () => ({ session, setSession: updateSession, status }),
    [session, status, updateSession],
  );

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession(): AuthSessionContextValue {
  return useContext(AuthSessionContext);
}
