import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import type { AuthChangeEvent, Provider, Session } from '@supabase/supabase-js';

import { getSupabaseClient } from '@/data/supabase/client';
import {
  getAuthCallbackPath,
  getDevelopmentUrl,
  getSingleRouteParam,
} from '@/features/auth/prototypeLinks';
import { consumeOAuthState, createOAuthState } from '@/features/auth/authState';

export type SocialAuthProvider = Extract<Provider, 'apple' | 'google'>;

export interface OAuthCallbackParams {
  readonly code?: string;
  readonly error?: string;
  readonly errorDescription?: string;
  readonly inviteToken?: string;
  readonly state?: string;
}

export interface SocialAuthResult {
  readonly inviteToken?: string;
  readonly session?: Session;
  readonly status: 'authenticated' | 'cancelled' | 'redirecting';
}

export class AuthFlowError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'AuthFlowError';
    this.code = code;
  }
}

function getAuthRedirectUrl(inviteToken?: string): string {
  return getDevelopmentUrl(getAuthCallbackPath(inviteToken));
}

function getCallbackParams(url: string): OAuthCallbackParams {
  const parsed = Linking.parse(url);
  const queryParams = parsed.queryParams ?? {};

  return {
    code: getSingleRouteParam(
      queryParams.code as string | string[] | undefined,
    ),
    error: getSingleRouteParam(
      queryParams.error as string | string[] | undefined,
    ),
    errorDescription: getSingleRouteParam(
      queryParams.error_description as string | string[] | undefined,
    ),
    inviteToken: getSingleRouteParam(
      queryParams.invite_token as string | string[] | undefined,
    ),
    state: getSingleRouteParam(
      queryParams.state as string | string[] | undefined,
    ),
  };
}

function assertOAuthState(state?: string): void {
  if (!consumeOAuthState(state)) {
    throw new AuthFlowError(
      'oauth_state_invalid',
      'O retorno do login perdeu a marcação de segurança. Tente de novo.',
    );
  }
}

export async function completeOAuthCallback(
  params: OAuthCallbackParams,
): Promise<SocialAuthResult> {
  assertOAuthState(params.state);

  if (params.error) {
    throw new AuthFlowError(
      params.error,
      params.errorDescription ?? 'O provedor não concluiu o login.',
    );
  }

  if (!params.code) {
    throw new AuthFlowError(
      'oauth_code_missing',
      'O retorno do login chegou sem o código necessário.',
    );
  }

  const { data, error } = await getSupabaseClient().auth.exchangeCodeForSession(
    params.code,
  );

  if (error) {
    throw new AuthFlowError('oauth_exchange_failed', error.message);
  }

  return {
    inviteToken: params.inviteToken,
    session: data.session ?? undefined,
    status: 'authenticated',
  };
}

export async function signInWithSocialProvider(
  provider: SocialAuthProvider,
  inviteToken?: string,
): Promise<SocialAuthResult> {
  const state = createOAuthState();
  const redirectTo = getAuthRedirectUrl(inviteToken);
  const { data, error } = await getSupabaseClient().auth.signInWithOAuth({
    options: {
      queryParams: { state },
      redirectTo,
      skipBrowserRedirect: Platform.OS !== 'web',
    },
    provider,
  });

  if (error) {
    throw new AuthFlowError('oauth_start_failed', error.message);
  }

  if (Platform.OS === 'web') {
    return { inviteToken, status: 'redirecting' };
  }

  if (!data.url) {
    throw new AuthFlowError(
      'oauth_url_missing',
      'O provedor não devolveu um endereço para iniciar o login.',
    );
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') {
    return { inviteToken, status: 'cancelled' };
  }

  return completeOAuthCallback(getCallbackParams(result.url));
}

export async function refreshAuthSession(): Promise<Session | undefined> {
  const { data, error } = await getSupabaseClient().auth.refreshSession();
  if (error) {
    throw new AuthFlowError('session_refresh_failed', error.message);
  }
  return data.session ?? undefined;
}

export function subscribeToAuthState(
  callback: (event: AuthChangeEvent, session: Session | null) => void,
): { unsubscribe: () => void } {
  return getSupabaseClient().auth.onAuthStateChange(callback).data.subscription;
}
