const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');
const webpack = require('webpack');

module.exports = async function (env = {}, argv = {}) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Expo SDK 49's webpack config no longer injects EXPO_PUBLIC_* variables by
  // default. Define only the intentionally public client variables explicitly.
  const publicEnvironmentKeys = [
    'EXPO_PUBLIC_APP_ENV',
    'EXPO_PUBLIC_SUPABASE_URL',
    'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID',
    'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID',
    'EXPO_PUBLIC_WEB_BASE_URL',
  ];
  config.plugins.push(
    new webpack.DefinePlugin(
      Object.fromEntries(
        publicEnvironmentKeys.map((key) => [
          `process.env.${key}`,
          JSON.stringify(process.env[key] ?? ''),
        ]),
      ),
    ),
  );

  // O React Native 0.72 não oferece implementação genérica para web. Use a
  // implementação de cores do react-native-web quando pacotes importarem o
  // helper interno do React Native.
  config.resolve.alias['react-native/Libraries/StyleSheet/processColor$'] =
    require.resolve('react-native-web/dist/exports/processColor');

  const reactNativeStyleSheetPath = path.join(
    path.dirname(require.resolve('react-native/package.json')),
    'Libraries/StyleSheet',
  );
  const expoRouterRoot = path.dirname(
    require.resolve('expo-router/package.json'),
  );
  config.plugins.push(
    new webpack.NormalModuleReplacementPlugin(
      /^\.\/PlatformColorValueTypes$/,
      (resource) => {
        if (resource.context === reactNativeStyleSheetPath) {
          resource.request = path.resolve(
            __dirname,
            'src/shims/PlatformColorValueTypes.web.js',
          );
        }
      },
    ),
    new webpack.NormalModuleReplacementPlugin(/^\.\/_ctx$/, (resource) => {
      if (resource.context === expoRouterRoot) {
        resource.request = path.resolve(__dirname, 'src/routerContext.web.tsx');
      }
    }),
  );

  return config;
};
