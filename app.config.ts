import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const webBaseUrl = process.env.EXPO_WEB_BASE_URL?.trim();
  const enableAndroidNativeGoogle =
    process.env.SETLIST_NATIVE_GOOGLE_ANDROID === '1' ||
    process.env.EAS_BUILD_PLATFORM === 'android';
  const plugins = [...(config.plugins ?? [])];

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
    experiments: {
      ...config.experiments,
      ...(webBaseUrl ? { baseUrl: webBaseUrl } : {}),
    },
    plugins,
  };
};
