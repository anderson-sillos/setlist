module.exports = function (api) {
  // Expo Router enables static hydration when `web.output` is static. The
  // development server returns an empty root element, so that transform must
  // only be enabled for production exports that contain prerendered HTML.
  if (process.env.NODE_ENV !== 'production') {
    delete process.env.EXPO_PUBLIC_USE_STATIC;
  }

  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      '@babel/plugin-transform-flow-strip-types',
      ['@babel/plugin-transform-private-methods', { loose: true }],
      ['module-resolver', { alias: { '@': './src' } }],
      'expo-router/babel',
    ],
  };
};
