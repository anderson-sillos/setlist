import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const webBaseUrl = process.env.EXPO_WEB_BASE_URL?.trim();
  const appLinkHost =
    process.env.SETLIST_APP_LINK_HOST?.trim() || 'setlistbr.app.br';
  const appLinkPathPrefix =
    process.env.SETLIST_APP_LINK_PATH_PREFIX?.trim() || '/invite';
  const enableAndroidNativeGoogle =
    process.env.SETLIST_NATIVE_GOOGLE_ANDROID === '1' ||
    process.env.EAS_BUILD_PLATFORM === 'android';
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

  if (
    enableAndroidNativeGoogle &&
    !plugins.some((plugin) => plugin === 'react-native-nitro-google-signin')
  ) {
    plugins.push([
      'react-native-nitro-google-signin',
      {
        // O plugin exige o esquema reverso mesmo quando o build desta etapa é
        // somente Android. O fluxo nativo do iOS será configurado depois.
        iosUrlScheme:
          process.env.SETLIST_GOOGLE_IOS_URL_SCHEME ??
          'com.googleusercontent.apps.setlist.android',
      },
    ]);
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
    plugins,
  };
};
