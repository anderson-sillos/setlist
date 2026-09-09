import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const webBaseUrl = process.env.EXPO_WEB_BASE_URL?.trim();

  return {
    ...config,
    name: config.name ?? 'Setlist',
    slug: config.slug ?? 'setlist',
    experiments: {
      ...config.experiments,
      ...(webBaseUrl ? { baseUrl: webBaseUrl } : {}),
    },
  };
};
