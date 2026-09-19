import { useRouter, type Href } from 'expo-router';
import { useEffect } from 'react';

import { AuthLoadingScreen } from '@/features/auth/AuthLoadingScreen';
import { useAuthSession } from '@/features/auth/AuthSessionProvider';
import {
  completeOAuthCallback,
  type OAuthCallbackParams,
} from '@/features/auth/authService';
import { getInvitePath } from '@/features/auth/authLinks';

type OAuthCallbackHandlerProps = OAuthCallbackParams;

export function OAuthCallbackHandler({
  code,
  error,
  errorDescription,
  flowId,
  inviteToken,
  state,
}: OAuthCallbackHandlerProps) {
  const router = useRouter();
  const { setSession } = useAuthSession();

  useEffect(() => {
    let active = true;

    void completeOAuthCallback({
      code,
      error,
      errorDescription,
      flowId,
      inviteToken,
      state,
    })
      .then((result) => {
        if (!active) {
          return;
        }

        setSession(result.session ?? null);
        router.replace(
          (result.inviteToken
            ? getInvitePath(result.inviteToken, { resumed: true })
            : '/') as Href,
        );
      })
      .catch(() => {
        if (!active) {
          return;
        }

        router.replace({
          pathname: '/auth',
          params: {
            ...(inviteToken ? { invite_token: inviteToken } : {}),
            auth_error: 'oauth',
          },
        } as Href);
      });

    return () => {
      active = false;
    };
  }, [
    code,
    error,
    errorDescription,
    flowId,
    inviteToken,
    router,
    setSession,
    state,
  ]);

  return <AuthLoadingScreen label="Conferindo acesso…" />;
}
