import * as ExpoConstants from 'expo-constants';
import * as ExpoCrypto from 'expo-crypto';
import { Platform } from 'react-native';
import type { Session } from '@supabase/supabase-js';

import { getPublicEnvironment } from '@/config/environment';
import { getSupabaseClient } from '@/data/supabase/client';
import { loadNativeGoogleModule } from '@/features/auth/nativeGoogleModule';

export type NativeGoogleSignInResult = Readonly<{
  readonly inviteToken?: string;
  readonly session?: Session;
  readonly status: 'authenticated' | 'cancelled' | 'failed' | 'unsupported';
  readonly errorMessage?: string;
}>;

function isExpoGo(): boolean {
  const constants =
    (
      ExpoConstants as typeof ExpoConstants & {
        default?: typeof ExpoConstants;
      }
    ).default ?? ExpoConstants;

  return (
    constants.appOwnership === 'expo' ||
    constants.executionEnvironment === 'storeClient'
  );
}

type NativeGoogleAvailability =
  | Readonly<{
      readonly available: false;
      readonly reason:
        | 'environment_unavailable'
        | 'expo_go'
        | 'missing_web_client_id'
        | 'not_android';
    }>
  | Readonly<{
      readonly available: true;
      readonly webClientId: string;
    }>;

function isNativeAuthDebugEnabled(): boolean {
  try {
    return getPublicEnvironment().appEnvironment === 'development';
  } catch {
    return typeof __DEV__ !== 'undefined' && __DEV__;
  }
}

function nativeGoogleLog(
  event: string,
  details?: Readonly<Record<string, boolean | number | string | undefined>>,
): void {
  if (!isNativeAuthDebugEnabled()) {
    return;
  }

  if (details) {
    console.info(`[auth:native-google] ${event}`, details);
    return;
  }

  console.info(`[auth:native-google] ${event}`);
}

function getSafeErrorDetails(error: unknown): Readonly<{
  readonly errorName?: string;
  readonly errorCode?: string;
  readonly errorMessage: string;
}> {
  if (error instanceof Error) {
    return {
      errorMessage: error.message.slice(0, 240),
      errorName: error.name,
    };
  }

  if (typeof error === 'object' && error !== null) {
    const candidate = error as {
      readonly code?: unknown;
      readonly message?: unknown;
    };

    return {
      ...(typeof candidate.code === 'string'
        ? { errorCode: candidate.code }
        : {}),
      errorMessage:
        typeof candidate.message === 'string'
          ? candidate.message.slice(0, 240)
          : 'Erro nativo sem mensagem.',
    };
  }

  return { errorMessage: 'Erro nativo sem detalhes.' };
}

function getNativeGoogleAvailability(): NativeGoogleAvailability {
  if (Platform.OS !== 'android') {
    return { available: false, reason: 'not_android' };
  }

  if (isExpoGo()) {
    return { available: false, reason: 'expo_go' };
  }

  let webClientId: string | undefined;
  try {
    webClientId = getPublicEnvironment().googleWebClientId;
  } catch {
    return { available: false, reason: 'environment_unavailable' };
  }

  if (!webClientId) {
    return { available: false, reason: 'missing_web_client_id' };
  }

  return { available: true, webClientId };
}

type GoogleNonce = Readonly<{
  /** Nonce in its original form, supplied to Supabase for verification. */
  readonly raw: string;
  /** SHA-256 hexadecimal nonce supplied to Google's native SDK. */
  readonly hashed: string;
}>;

/**
 * Supabase expects the original nonce and hashes it while validating the ID
 * Token. Google receives the SHA-256 representation in the native request.
 * Keeping both values in one attempt prevents the token from being accepted
 * without nonce verification or from failing with a mismatched nonce.
 */
async function createGoogleNonce(): Promise<GoogleNonce> {
  const raw = ExpoCrypto.randomUUID();
  const hashed = await ExpoCrypto.digestStringAsync(
    ExpoCrypto.CryptoDigestAlgorithm.SHA256,
    raw,
    { encoding: ExpoCrypto.CryptoEncoding.HEX },
  );

  return { hashed, raw };
}

export function isNativeGoogleSignInAvailable(): boolean {
  return getNativeGoogleAvailability().available;
}

/**
 * Tenta o Google nativo somente quando o binário contém o módulo configurado.
 * Qualquer indisponibilidade do runtime nativo retorna `unsupported` para que
 * o serviço de autenticação possa continuar pelo OAuth no navegador.
 */
export async function tryNativeGoogleSignIn(
  inviteToken?: string,
): Promise<NativeGoogleSignInResult> {
  const availability = getNativeGoogleAvailability();
  nativeGoogleLog('availability_checked', {
    available: availability.available,
    reason: availability.available ? undefined : availability.reason,
  });

  if (!availability.available) {
    nativeGoogleLog('browser_fallback_recommended', {
      reason: availability.reason,
    });
    return { inviteToken, status: 'unsupported' };
  }

  const webClientId = availability.webClientId;

  let response: Awaited<
    ReturnType<
      typeof import('react-native-nitro-google-signin').GoogleOneTapSignIn.signIn
    >
  >;
  let nonce: GoogleNonce;

  try {
    nativeGoogleLog('module_loading');
    const google = await loadNativeGoogleModule();

    nativeGoogleLog('module_loaded');
    nonce = await createGoogleNonce();
    google.GoogleOneTapSignIn.configure({
      nonce: nonce.hashed,
      webClientId,
    });
    nativeGoogleLog('configured', { hasWebClientId: true });
    await google.GoogleOneTapSignIn.checkPlayServices();
    nativeGoogleLog('play_services_available');
    response = await google.GoogleOneTapSignIn.signIn();
    nativeGoogleLog('sign_in_response', {
      responseType: response.type,
    });

    if (google.isNoSavedCredentialFoundResponse(response)) {
      nativeGoogleLog('no_saved_credential_found');
      response = await google.GoogleOneTapSignIn.createAccount();
      nativeGoogleLog('account_creation_response', {
        responseType: response.type,
      });
    }

    if (google.isCancelledResponse(response)) {
      nativeGoogleLog('cancelled');
      return { inviteToken, status: 'cancelled' };
    }

    if (!google.isSuccessResponse(response)) {
      nativeGoogleLog('unsupported_response', {
        responseType: response.type,
      });
      nativeGoogleLog('browser_fallback_recommended');
      return { inviteToken, status: 'unsupported' };
    }
  } catch (error) {
    nativeGoogleLog('runtime_unavailable', getSafeErrorDetails(error));
    nativeGoogleLog('browser_fallback_recommended');
    return { inviteToken, status: 'unsupported' };
  }

  const idToken = response.data.idToken;
  if (!idToken) {
    nativeGoogleLog('id_token_missing');
    nativeGoogleLog('browser_fallback_recommended');
    return { inviteToken, status: 'unsupported' };
  }

  nativeGoogleLog('supabase_exchange_started', { hasIdToken: true });
  const { data, error } = await getSupabaseClient().auth.signInWithIdToken({
    nonce: nonce.raw,
    provider: 'google',
    token: idToken,
  });

  if (error) {
    nativeGoogleLog('supabase_exchange_failed', {
      ...getSafeErrorDetails(error),
    });
    return {
      errorMessage: error.message,
      inviteToken,
      status: 'failed',
    };
  }

  nativeGoogleLog('supabase_exchange_succeeded', {
    hasSession: Boolean(data.session),
  });
  return {
    inviteToken,
    session: data.session ?? undefined,
    status: 'authenticated',
  };
}
