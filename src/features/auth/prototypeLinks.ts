import * as Linking from 'expo-linking';

export function getAuthCallbackPath(inviteToken?: string): string {
  return appendQuery('/auth/callback', [['invite_token', inviteToken]]);
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

export function getDevelopmentUrl(path: string): string {
  return Linking.createURL(path.replace(/^\/+/, ''));
}

export function getSingleRouteParam(
  value: string | readonly string[] | undefined,
): string | undefined {
  return typeof value === 'string' ? value : value?.[0];
}
