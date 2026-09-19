import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import type {
  AuthChangeEvent,
  Provider,
  Session,
  SupabaseClient,
} from '@supabase/supabase-js';

import '@/config/webCrypto';
import { getSupabaseClient } from '@/data/supabase/client';
import {
  getAuthCallbackPath,
  getDevelopmentUrl,
  getSingleRouteParam,
} from '@/features/auth/authLinks';
import { tryNativeGoogleSignIn } from '@/features/auth/nativeGoogleSignIn';

export type SocialAuthProvider = Extract<Provider, 'apple' | 'google'>;

export interface OAuthCallbackParams {
  readonly code?: string;
  readonly error?: string;
  readonly errorDescription?: string;
  readonly flowId?: string;
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

const OAUTH_CODE_CACHE_TTL_MS = 15_000;

/**
 * No Android, o polyfill do `openAuthSessionAsync` usa uma Custom Tab. A
 * `BrowserProxyActivity` mantém essa aba em uma tarefa separada e ela pode
 * permanecer inativa depois que o deep link já voltou para o app. O fluxo de
 * autenticação não precisa preservar a aba no histórico: sem a proxy e sem
 * histórico, o Android remove a Custom Tab quando o retorno abre o app.
 */
const ANDROID_AUTH_BROWSER_OPTIONS = {
  createTask: true,
  showInRecents: false,
  useProxyActivity: false,
} as const;

type OAuthExchange = Readonly<{
  session?: Session;
}>;

type CachedOAuthExchange = Readonly<{
  createdAt: number;
  promise: Promise<OAuthExchange>;
}>;

/**
 * No Android, o retorno de openAuthSessionAsync e a rota /auth/callback podem
 * chegar quase ao mesmo tempo. O código OAuth é de uso único; compartilhar a
 * mesma Promise impede que os dois caminhos tentem trocá-lo em paralelo e
 * produzam o erro "invalid flow state".
 *
 * O cache é associado ao cliente, não apenas ao código, para não contaminar
 * testes ou ambientes que criem clientes isolados. Ele expira rapidamente,
 * servindo somente para absorver a entrega duplicada do deep link.
 */
const oauthExchangeCache = new WeakMap<
  SupabaseClient,
  Map<string, CachedOAuthExchange>
>();

function exchangeOAuthCodeOnce(
  client: SupabaseClient,
  code: string,
  flowId?: string,
): Promise<OAuthExchange> {
  const now = Date.now();
  const clientCache = oauthExchangeCache.get(client) ?? new Map();
  const cached = clientCache.get(code);

  if (cached && now - cached.createdAt < OAUTH_CODE_CACHE_TTL_MS) {
    return cached.promise;
  }

  const exchange = flowId
    ? client.auth.exchangeCodeForSession(code, { flowId })
    : client.auth.exchangeCodeForSession(code);
  const promise = exchange.then(({ data, error }) => {
    if (error) {
      throw new AuthFlowError('oauth_exchange_failed', error.message);
    }

    return { session: data.session ?? undefined };
  });

  clientCache.set(code, { createdAt: now, promise });
  oauthExchangeCache.set(client, clientCache);

  return promise;
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
    flowId: getSingleRouteParam(
      queryParams.sb_flow_id as string | string[] | undefined,
    ),
    state: getSingleRouteParam(
      queryParams.state as string | string[] | undefined,
    ),
  };
}

export async function completeOAuthCallback(
  params: OAuthCallbackParams,
): Promise<SocialAuthResult> {
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

  const client = getSupabaseClient();
  const { session } = await exchangeOAuthCodeOnce(
    client,
    params.code,
    params.flowId,
  );

  return {
    inviteToken: params.inviteToken,
    session,
    status: 'authenticated',
  };
}

async function signInWithBrowserOAuth(
  provider: SocialAuthProvider,
  inviteToken?: string,
): Promise<SocialAuthResult> {
  try {
    const redirectTo = getAuthRedirectUrl(inviteToken);
    const { data, error } = await getSupabaseClient().auth.signInWithOAuth({
      options: {
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

    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      redirectTo,
      Platform.OS === 'android' ? ANDROID_AUTH_BROWSER_OPTIONS : undefined,
    );
    if (result.type !== 'success') {
      return { inviteToken, status: 'cancelled' };
    }

    return completeOAuthCallback(getCallbackParams(result.url));
  } catch (error) {
    if (error instanceof AuthFlowError) {
      throw error;
    }

    console.error('[auth] Falha inesperada no login social.', error);
    throw new AuthFlowError(
      'oauth_unexpected_error',
      'Não foi possível concluir o login agora. Tente novamente.',
    );
  }
}

export async function signInWithSocialProvider(
  provider: SocialAuthProvider,
  inviteToken?: string,
): Promise<SocialAuthResult> {
  if (provider === 'google' && Platform.OS === 'android') {
    const nativeResult = await tryNativeGoogleSignIn(inviteToken);

    if (
      nativeResult.status === 'authenticated' ||
      nativeResult.status === 'cancelled'
    ) {
      return {
        inviteToken: nativeResult.inviteToken,
        session: nativeResult.session,
        status: nativeResult.status,
      };
    }

    if (nativeResult.status === 'failed') {
      throw new AuthFlowError(
        'native_google_exchange_failed',
        nativeResult.errorMessage ??
          'O Google não entregou uma sessão válida ao Supabase.',
      );
    }
  }

  return signInWithBrowserOAuth(provider, inviteToken);
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
