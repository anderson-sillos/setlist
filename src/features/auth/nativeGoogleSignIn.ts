import * as ExpoConstants from 'expo-constants';
import * as ExpoCrypto from 'expo-crypto';
import { Platform } from 'react-native';
import type { Session } from '@supabase/supabase-js';

import { getPublicEnvironment } from '@/config/environment';
import { getSupabaseClient } from '@/data/supabase/client';
import {
  loadIosNativeGoogleModule,
  loadNativeGoogleModule,
} from '@/features/auth/nativeGoogleModule';

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
        | 'missing_ios_client_id'
        | 'missing_web_client_id'
        | 'unsupported_platform';
    }>
  | Readonly<{
      readonly available: true;
      readonly platform: 'android';
      readonly webClientId: string;
    }>
  | Readonly<{
      readonly available: true;
      readonly iosClientId: string;
      readonly platform: 'ios';
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
    const errorCode = (error as Error & { code?: unknown }).code;
    return {
      errorMessage: error.message.slice(0, 240),
      errorName: error.name,
      ...(typeof errorCode === 'string' ? { errorCode } : {}),
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
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
    return { available: false, reason: 'unsupported_platform' };
  }

  if (isExpoGo()) {
    return { available: false, reason: 'expo_go' };
  }

  let environment: ReturnType<typeof getPublicEnvironment>;
  try {
    environment = getPublicEnvironment();
  } catch {
    return { available: false, reason: 'environment_unavailable' };
  }

  const webClientId = environment.googleWebClientId;
  if (!webClientId) {
    return { available: false, reason: 'missing_web_client_id' };
  }

  if (Platform.OS === 'android') {
    return { available: true, platform: 'android', webClientId };
  }

  if (!environment.googleIosClientId) {
    return { available: false, reason: 'missing_ios_client_id' };
  }

  return {
    available: true,
    iosClientId: environment.googleIosClientId,
    platform: 'ios',
    webClientId,
  };
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

async function tryIosNativeGoogleSignIn(
  availability: Extract<NativeGoogleAvailability, { platform: 'ios' }>,
  inviteToken?: string,
): Promise<NativeGoogleSignInResult> {
  let google: Awaited<ReturnType<typeof loadIosNativeGoogleModule>>;
  let nonce: GoogleNonce;
  let response: { readonly idToken: string | null };
  let cancelledCode: string | undefined;

  try {
    google = await loadIosNativeGoogleModule();
    cancelledCode = google.statusCodes.SIGN_IN_CANCELLED;
    nonce = await createGoogleNonce();
    google.GoogleSignin.configure({
      iosClientId: availability.iosClientId,
      webClientId: availability.webClientId,
    });
    nativeGoogleLog('ios_configured', {
      hasIosClientId: true,
      hasNonce: true,
    });
    await google.GoogleSignin.hasPlayServices();
    response = await google.GoogleSignin.signIn({ nonce: nonce.hashed });
  } catch (error) {
    const errorCode = getSafeErrorDetails(error).errorCode;
    if (errorCode === cancelledCode) {
      nativeGoogleLog('ios_cancelled');
      return { inviteToken, status: 'cancelled' };
    }
    nativeGoogleLog('ios_sign_in_failed', getSafeErrorDetails(error));
    nativeGoogleLog('browser_fallback_recommended');
    return { inviteToken, status: 'unsupported' };
  }

  const idToken = response.idToken;
  if (!idToken) {
    nativeGoogleLog('ios_id_token_missing');
    nativeGoogleLog('browser_fallback_recommended');
    return { inviteToken, status: 'unsupported' };
  }

  const { data, error } = await getSupabaseClient().auth.signInWithIdToken({
    nonce: nonce.raw,
    provider: 'google',
    token: idToken,
  });

  if (error) {
    nativeGoogleLog('ios_supabase_exchange_failed', {
      ...getSafeErrorDetails(error),
    });
    return {
      errorMessage: error.message,
      inviteToken,
      status: 'failed',
    };
  }

  nativeGoogleLog('ios_supabase_exchange_succeeded', {
    hasSession: Boolean(data.session),
  });
  return {
    inviteToken,
    session: data.session ?? undefined,
    status: 'authenticated',
  };
}

async function tryAndroidNativeGoogleSignIn(
  availability: Extract<NativeGoogleAvailability, { platform: 'android' }>,
  inviteToken?: string,
): Promise<NativeGoogleSignInResult> {
  let google: Awaited<ReturnType<typeof loadNativeGoogleModule>>;
  let response: { readonly idToken: string | null };
  let cancelledCode: string | undefined;

  try {
    nativeGoogleLog('android_module_loading');
    google = await loadNativeGoogleModule();
    cancelledCode = google.statusCodes.SIGN_IN_CANCELLED;
    nativeGoogleLog('android_module_loaded');
    google.GoogleSignin.configure({ webClientId: availability.webClientId });
    nativeGoogleLog('android_configured', { hasWebClientId: true });
    await google.GoogleSignin.hasPlayServices({
      showPlayServicesUpdateDialog: true,
    });
    nativeGoogleLog('android_play_services_available');
    // The app's Supabase sign-out does not clear the account cached by the
    // native Google SDK. Clear it first so each explicit login can choose an
    // account instead of silently reusing the previous one.
    await google.GoogleSignin.signOut();
    nativeGoogleLog('android_previous_account_cleared');
    response = await google.GoogleSignin.signIn();
    nativeGoogleLog('android_sign_in_response', {
      hasIdToken: Boolean(response.idToken),
    });
  } catch (error) {
    const details = getSafeErrorDetails(error);
    if (details.errorCode === cancelledCode) {
      nativeGoogleLog('android_cancelled');
      return { inviteToken, status: 'cancelled' };
    }
    nativeGoogleLog('android_sign_in_failed', details);
    nativeGoogleLog('browser_fallback_recommended');
    return { inviteToken, status: 'unsupported' };
  }

  const idToken = response.idToken;
  if (!idToken) {
    nativeGoogleLog('android_id_token_missing');
    nativeGoogleLog('browser_fallback_recommended');
    return { inviteToken, status: 'unsupported' };
  }

  // The vendored Google Sign-In 11 Android API does not accept a nonce.
  // Supabase therefore validates the signed ID token without nonce binding.
  nativeGoogleLog('android_supabase_exchange_started', { hasIdToken: true });
  const { data, error } = await getSupabaseClient().auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  });

  if (error) {
    nativeGoogleLog('android_supabase_exchange_failed', {
      ...getSafeErrorDetails(error),
    });
    return {
      errorMessage: error.message,
      inviteToken,
      status: 'failed',
    };
  }

  nativeGoogleLog('android_supabase_exchange_succeeded', {
    hasSession: Boolean(data.session),
  });
  return {
    inviteToken,
    session: data.session ?? undefined,
    status: 'authenticated',
  };
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

  if (availability.platform === 'ios') {
    return tryIosNativeGoogleSignIn(availability, inviteToken);
  }
  return tryAndroidNativeGoogleSignIn(availability, inviteToken);
}
