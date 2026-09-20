import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

import { getPublicEnvironment } from '@/config/environment';

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

/**
 * Retorna o endereço compartilhável do convite. Em produção e em builds
 * móveis, o endereço HTTPS configurado mantém o link abrível no app associado
 * ou na versão web. No navegador local, a origem atual continua sendo útil
 * para validar o fluxo sem duplicar configuração.
 */
export function getShareableInviteUrl(token: string): string {
  const path = getInvitePath(token);

  if (Platform.OS === 'web') {
    return getRuntimeUrl(path);
  }

  const webBaseUrl = getPublicEnvironment().webBaseUrl;

  return webBaseUrl
    ? `${webBaseUrl}/${path.replace(/^\/+/, '')}`
    : getRuntimeUrl(path);
}

export function getRuntimeUrl(path: string): string {
  const normalizedPath = path.replace(/^\/+/, '');

  // No navegador, a origem atual é a autoridade para o callback. Não use o
  // scheme do app (`setlist://`) nem a configuração do Expo para montar uma
  // URL web: isso pode transformar o host publicado em `https://setlist`.
  // Em runtimes nativos, o Expo Go pode expor um `window.location` parcial
  // apontando para o túnel HTTP. A origem do navegador só é válida no web;
  // Android/iOS precisam do deep link gerado pelo `expo-linking`.
  if (
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    window.location?.origin
  ) {
    const basePath = getWebBasePath();
    const pathWithBase = [basePath, normalizedPath]
      .filter(Boolean)
      .join('/')
      .replace(/\/+/g, '/');

    return `${window.location.origin.replace(/\/+$/, '')}/${pathWithBase.replace(/^\/+/, '')}`;
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
  const source =
    typeof HTMLScriptElement !== 'undefined' &&
    script instanceof HTMLScriptElement
      ? script.src
      : script?.getAttribute('src');

  if (!source || typeof window === 'undefined' || !window.location?.origin) {
    return '';
  }

  const pathname = getPathname(source);
  const expoPathIndex = pathname.indexOf('/_expo/');

  return expoPathIndex >= 0 ? pathname.slice(0, expoPathIndex) : '';
}

function getPathname(source: string): string {
  const withoutQuery = source.split(/[?#]/, 1)[0] ?? '';
  const schemeIndex = withoutQuery.indexOf('://');

  if (schemeIndex >= 0) {
    const pathStart = withoutQuery.indexOf('/', schemeIndex + 3);
    return pathStart >= 0 ? withoutQuery.slice(pathStart) : '/';
  }

  return withoutQuery.startsWith('/') ? withoutQuery : `/${withoutQuery}`;
}

export function getSingleRouteParam(
  value: string | readonly string[] | undefined,
): string | undefined {
  return typeof value === 'string' ? value : value?.[0];
}
