import * as Linking from 'expo-linking';

export const PROTOTYPE_INVITE_TOKEN = 'convite-demo-2026';
export const PROTOTYPE_OAUTH_CODE = 'oauth-code-demo';
export const PROTOTYPE_OAUTH_STATE = 'oauth-state-demo';

export function getAuthCallbackPath(inviteToken?: string): string {
  return appendQuery('/auth/callback', [['invite_token', inviteToken]]);
}

export interface OAuthCallbackPrototypeParams {
  readonly code?: string;
  readonly error?: string;
  readonly inviteToken?: string;
  readonly state?: string;
}

function appendQuery(
  path: string,
  params: readonly (readonly [string, string | undefined])[],
): string {
  const query = params
    .filter(([, value]) => value !== undefined)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value ?? '')}`,
    )
    .join('&');

  return query ? `${path}?${query}` : path;
}

export function getInvitePath(
  token: string,
  options?: { readonly resumed?: boolean },
): string {
  return appendQuery(`/invite/${encodeURIComponent(token)}`, [
    ['resumed', options?.resumed ? '1' : undefined],
  ]);
}

export function getOAuthCallbackPath({
  code = PROTOTYPE_OAUTH_CODE,
  error,
  inviteToken,
  state = PROTOTYPE_OAUTH_STATE,
}: OAuthCallbackPrototypeParams = {}): string {
  return appendQuery('/auth/callback', [
    ['code', code],
    ['state', state],
    ['invite_token', inviteToken],
    ['error', error],
  ]);
}

export function getDevelopmentUrl(path: string): string {
  return Linking.createURL(path.replace(/^\/+/, ''));
}

export function getSingleRouteParam(
  value: string | readonly string[] | undefined,
): string | undefined {
  return typeof value === 'string' ? value : value?.[0];
}
