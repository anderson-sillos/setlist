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
  const normalizedPath = path.replace(/^\/+/, '');

  // No navegador, a origem atual é a autoridade para o callback. Não use o
  // scheme do app (`setlist://`) nem a configuração do Expo para montar uma
  // URL web: isso pode transformar o host publicado em `https://setlist`.
  // O teste de `window` também mantém o comportamento correto caso o bundler
  // entregue um valor inesperado para `Platform.OS`.
  if (typeof window !== 'undefined' && window.location?.href) {
    const currentUrl = new URL(window.location.href);
    const basePath = getWebBasePath();
    const pathWithBase = [basePath, normalizedPath]
      .filter(Boolean)
      .join('/')
      .replace(/\/+/g, '/');

    return new URL(`/${pathWithBase}`, currentUrl.origin).toString();
  }

  return Linking.createURL(normalizedPath);
}

/**
 * O export web do Expo Router coloca os bundles em `/_expo` dentro do base
 * path configurado. Usar esse caminho como referência mantém o callback no
 * mesmo subdiretório tanto no GitHub Pages quanto em um domínio próprio.
 */
function getWebBasePath(): string {
  if (typeof document === 'undefined') {
    return '';
  }

  const script = document.querySelector('script[src*="/_expo/"]');
  const source = script?.getAttribute('src');

  if (!source || typeof window === 'undefined' || !window.location?.href) {
    return '';
  }

  const pathname = new URL(source, window.location.href).pathname;
  const expoPathIndex = pathname.indexOf('/_expo/');

  return expoPathIndex >= 0 ? pathname.slice(0, expoPathIndex) : '';
}

export function getSingleRouteParam(
  value: string | readonly string[] | undefined,
): string | undefined {
  return typeof value === 'string' ? value : value?.[0];
}
