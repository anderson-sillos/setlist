import * as AppleAuthentication from 'expo-apple-authentication';
import * as ExpoCrypto from 'expo-crypto';

import { getSupabaseClient } from '@/data/supabase/client';
import type { NativeAppleSignInResult } from '@/features/auth/nativeAppleSignIn';

function isNativeAuthDebugEnabled(): boolean {
  return typeof __DEV__ !== 'undefined' && __DEV__;
}

function nativeAppleLog(event: string): void {
  if (isNativeAuthDebugEnabled()) {
    console.info(`[auth:native-apple] ${event}`);
  }
}

function getSafeErrorDetails(error: unknown): Readonly<{
  readonly code?: string;
  readonly message: string;
}> {
  if (typeof error === 'object' && error !== null) {
    const candidate = error as {
      readonly code?: unknown;
      readonly message?: unknown;
    };

    return {
      ...(typeof candidate.code === 'string' ? { code: candidate.code } : {}),
      message:
        typeof candidate.message === 'string'
          ? candidate.message.slice(0, 240)
          : 'Erro nativo sem mensagem.',
    };
  }

  return { message: 'Erro nativo sem detalhes.' };
}

export async function tryNativeAppleSignIn(
  inviteToken?: string,
): Promise<NativeAppleSignInResult> {
  let isAvailable: boolean;
  try {
    isAvailable = await AppleAuthentication.isAvailableAsync();
  } catch {
    nativeAppleLog('availability_check_failed');
    return { inviteToken, status: 'unsupported' };
  }

  if (!isAvailable) {
    nativeAppleLog('unavailable');
    return { inviteToken, status: 'unsupported' };
  }

  try {
    const rawNonce = ExpoCrypto.randomUUID();
    const hashedNonce = await ExpoCrypto.digestStringAsync(
      ExpoCrypto.CryptoDigestAlgorithm.SHA256,
      rawNonce,
      { encoding: ExpoCrypto.CryptoEncoding.HEX },
    );

    nativeAppleLog('request_started');
    const credential = await AppleAuthentication.signInAsync({
      nonce: hashedNonce,
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      ],
    });

    if (!credential.identityToken) {
      nativeAppleLog('identity_token_missing');
      return {
        errorMessage: 'A Apple não devolveu um token de identidade válido.',
        inviteToken,
        status: 'failed',
      };
    }

    nativeAppleLog('supabase_exchange_started');
    const client = getSupabaseClient();
    const { data, error } = await client.auth.signInWithIdToken({
      nonce: rawNonce,
      provider: 'apple',
      token: credential.identityToken,
    });

    if (error) {
      nativeAppleLog('supabase_exchange_failed');
      return {
        errorMessage:
          'Não foi possível concluir o login com Apple. Verifique a configuração do provedor e tente novamente.',
        inviteToken,
        status: 'failed',
      };
    }

    const fullName = credential.fullName
      ? [
          credential.fullName.givenName,
          credential.fullName.middleName,
          credential.fullName.familyName,
        ]
          .filter((part): part is string => Boolean(part?.trim()))
          .join(' ')
          .trim()
      : '';

    // Apple provides the user's name only on the first authorization. Save it
    // when present; a profile metadata failure must not discard a valid login.
    if (fullName) {
      const { error: profileError } = await client.auth.updateUser({
        data: { full_name: fullName },
      });

      if (profileError) {
        nativeAppleLog('profile_name_save_failed');
      }
    }

    nativeAppleLog('authenticated');
    return {
      inviteToken,
      session: data.session ?? undefined,
      status: 'authenticated',
    };
  } catch (error) {
    const details = getSafeErrorDetails(error);
    if (details.code === 'ERR_REQUEST_CANCELED') {
      nativeAppleLog('cancelled');
      return { inviteToken, status: 'cancelled' };
    }

    if (isNativeAuthDebugEnabled()) {
      console.info('[auth:native-apple] failed', details);
    }
    return {
      errorMessage:
        'Não foi possível concluir o login com Apple. Tente novamente.',
      inviteToken,
      status: 'failed',
    };
  }
}
