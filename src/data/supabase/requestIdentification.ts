import { Platform } from 'react-native';

import { getAppReleaseInfo } from '@/config/appRelease';

interface SetlistRequestIdentity {
  readonly version: string;
  readonly build: string | null;
  readonly platform: 'ios' | 'android' | 'web';
  readonly operatingSystemVersion: string | null;
  readonly environment: 'production' | 'development';
  readonly commit: string | null;
}

function getRequestIdentity(): SetlistRequestIdentity {
  const release = getAppReleaseInfo();
  const platform =
    Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'web';
  const operatingSystemVersion =
    platform === 'ios'
      ? String(Platform.Version)
      : platform === 'android'
        ? (Platform.constants as unknown as { Release?: string }).Release
        : null;

  return {
    version: release.version,
    build: release.build,
    platform,
    operatingSystemVersion: operatingSystemVersion || null,
    environment:
      release.environment === 'Produção' ? 'production' : 'development',
    commit: release.commit?.slice(0, 7) ?? null,
  };
}

export function formatSetlistClientInfo(
  identity: SetlistRequestIdentity,
): string {
  return [
    `setlist/${identity.version}`,
    identity.build ? `build=${identity.build}` : null,
    `platform=${identity.platform}`,
    identity.operatingSystemVersion
      ? `os=${identity.operatingSystemVersion}`
      : null,
    `env=${identity.environment}`,
    identity.commit ? `commit=${identity.commit}` : null,
  ]
    .filter((value): value is string => value !== null)
    .join('; ');
}

export function formatSetlistUserAgent(
  identity: SetlistRequestIdentity,
): string | null {
  if (identity.platform === 'web') return null;

  const platformName = identity.platform === 'ios' ? 'iOS' : 'Android';
  const systemVersion = identity.operatingSystemVersion
    ? ` ${identity.operatingSystemVersion}`
    : '';
  const build = identity.build ? `; build ${identity.build}` : '';

  return `Setlist/${identity.version} (${platformName}${systemVersion}${build})`;
}

/**
 * Appends Setlist release metadata to Supabase requests while preserving the
 * SDK client info and any headers supplied by the request or its init object.
 */
export function createSupabaseRequestFetch(
  fetchImplementation: typeof fetch = globalThis.fetch.bind(globalThis),
): typeof fetch {
  const identity = getRequestIdentity();
  const clientInfo = formatSetlistClientInfo(identity);
  const userAgent = formatSetlistUserAgent(identity);

  return (input, init) => {
    const headers = init?.headers
      ? new Headers(init.headers)
      : typeof Request !== 'undefined' && input instanceof Request
        ? new Headers(input.headers)
        : new Headers();

    const existingClientInfo = headers.get('X-Client-Info')?.trim();
    if (!existingClientInfo?.includes('setlist/')) {
      headers.set(
        'X-Client-Info',
        existingClientInfo
          ? `${existingClientInfo}; ${clientInfo}`
          : clientInfo,
      );
    }

    if (userAgent) headers.set('User-Agent', userAgent);

    return fetchImplementation(input, { ...init, headers });
  };
}
