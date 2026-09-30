import type { Session } from '@supabase/supabase-js';

export type NativeAppleSignInResult = Readonly<{
  readonly inviteToken?: string;
  readonly session?: Session;
  readonly status: 'authenticated' | 'cancelled' | 'failed' | 'unsupported';
  readonly errorMessage?: string;
}>;

/**
 * Non-iOS platforms keep Apple authentication on the existing Supabase OAuth
 * flow, which opens the browser on Android and redirects on web.
 */
export async function tryNativeAppleSignIn(
  _inviteToken?: string,
): Promise<NativeAppleSignInResult> {
  return { status: 'unsupported' };
}
