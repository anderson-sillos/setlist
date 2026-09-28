import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const webBaseUrl = process.env.EXPO_WEB_BASE_URL?.trim();
  const appLinkHost =
    process.env.SETLIST_APP_LINK_HOST?.trim() || 'setlistbr.app.br';
  const appLinkPathPrefix =
    process.env.SETLIST_APP_LINK_PATH_PREFIX?.trim() || '/invite';
  const googleIosClientId =
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();
  const googleIosUrlScheme =
    process.env.SETLIST_GOOGLE_IOS_URL_SCHEME?.trim() ||
    (googleIosClientId?.endsWith('.apps.googleusercontent.com')
      ? `com.googleusercontent.apps.${googleIosClientId.replace(
          /\.apps\.googleusercontent\.com$/,
          '',
        )}`
      : undefined);
  const plugins = [...(config.plugins ?? [])];
  const androidIntentFilters = config.android?.intentFilters ?? [];
  const associatedDomains = config.ios?.associatedDomains ?? [];

  const hasAppLinkIntentFilter = androidIntentFilters.some((filter) =>
    (filter.data
      ? Array.isArray(filter.data)
        ? filter.data
        : [filter.data]
      : []
    ).some(
      (data) =>
        data.scheme === 'https' &&
        data.host === appLinkHost &&
        data.pathPrefix === appLinkPathPrefix,
    ),
  );

  const hasAssociatedDomain = associatedDomains.includes(
    `applinks:${appLinkHost}`,
  );

  const googleIosUrlSchemePlugin = './plugins/withGoogleIosUrlScheme';
  const hasGoogleIosUrlSchemePlugin = plugins.some((plugin) =>
    Array.isArray(plugin)
      ? plugin[0] === googleIosUrlSchemePlugin
      : plugin === googleIosUrlSchemePlugin,
  );

  if (googleIosClientId && googleIosUrlScheme && !hasGoogleIosUrlSchemePlugin) {
    plugins.push([googleIosUrlSchemePlugin, { urlScheme: googleIosUrlScheme }]);
  }

  return {
    ...config,
    name: config.name ?? 'Setlist',
    slug: config.slug ?? 'setlist',
    android: {
      ...config.android,
      intentFilters: hasAppLinkIntentFilter
        ? androidIntentFilters
        : [
            ...androidIntentFilters,
            {
              action: 'VIEW',
              autoVerify: true,
              category: ['BROWSABLE', 'DEFAULT'],
              data: [
                {
                  scheme: 'https',
                  host: appLinkHost,
                  pathPrefix: appLinkPathPrefix,
                },
              ],
            },
          ],
    },
    ios: {
      ...config.ios,
      associatedDomains: hasAssociatedDomain
        ? associatedDomains
        : [...associatedDomains, `applinks:${appLinkHost}`],
    },
    experiments: {
      ...config.experiments,
      ...(webBaseUrl ? { baseUrl: webBaseUrl } : {}),
    },
    web: {
      ...config.web,
      // The development server serves an empty #root; static hydration there
      // causes React to report a server/client markup mismatch. Keep static
      // rendering for production exports, which include prerendered HTML.
      output:
        process.env.NODE_ENV === 'production'
          ? config.web?.output ?? 'static'
          : 'single',
    },
    plugins,
  };
};
