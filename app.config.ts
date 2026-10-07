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
  const enableIosNativeGoogle = process.env.SETLIST_NATIVE_GOOGLE_IOS === '1';
  const googleIosClientId =
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();
  const configuredGoogleIosUrlScheme =
    process.env.SETLIST_GOOGLE_IOS_URL_SCHEME?.trim();
  const googleIosUrlScheme =
    configuredGoogleIosUrlScheme ||
    (googleIosClientId?.endsWith('.apps.googleusercontent.com')
      ? `com.googleusercontent.apps.${googleIosClientId.slice(0, -'.apps.googleusercontent.com'.length)}`
      : undefined);
  const iosAppleTeamId = process.env.SETLIST_IOS_TEAM_ID?.trim();
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

  if (enableIosNativeGoogle && !googleIosUrlScheme) {
    throw new Error(
      'O login nativo Google no iOS exige EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ou SETLIST_GOOGLE_IOS_URL_SCHEME no ambiente EAS selecionado.',
    );
  }

  if (
    (enableAndroidNativeGoogle || enableIosNativeGoogle) &&
    !plugins.some((plugin) => plugin === 'react-native-nitro-google-signin')
  ) {
    plugins.push([
      'react-native-nitro-google-signin',
      {
        // Builds Android mantêm um esquema inerte; builds iOS usam o esquema
        // reverso do OAuth Client ID iOS cadastrado no Google Cloud.
        iosUrlScheme:
          googleIosUrlScheme ?? 'com.googleusercontent.apps.setlist.android',
      },
    ]);
  }

  return {
    ...config,
    name: config.name ?? 'Setlist',
    slug: config.slug ?? 'setlist',
    extra: {
      ...config.extra,
      release: {
        version: config.version,
        commit:
          process.env.EAS_BUILD_GIT_COMMIT_HASH ??
          process.env.SETLIST_RELEASE_COMMIT ??
          null,
        tag: process.env.SETLIST_RELEASE_TAG ?? null,
      },
    },
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
      ...(iosAppleTeamId ? { appleTeamId: iosAppleTeamId } : {}),
      usesAppleSignIn: true,
      associatedDomains: hasAssociatedDomain
        ? associatedDomains
        : [...associatedDomains, `applinks:${appLinkHost}`],
    },
    experiments: {
      ...config.experiments,
      ...(webBaseUrl ? { baseUrl: webBaseUrl } : {}),
    },
    plugins: plugins.includes('expo-apple-authentication')
      ? plugins
      : [...plugins, 'expo-apple-authentication'],
  };
};
