// Webpack exposes a route twice in require.context: once without the source
// extension and once with it. Expo Router 2 treats those aliases as duplicate
// files, so keep only canonical, extension-bearing route keys.
const appContext = require.context(
  './app',
  true,
  /.*/,
  process.env.EXPO_ROUTER_IMPORT_MODE_WEB,
);

export const ctx = Object.assign((key: string) => appContext(key), {
  id: appContext.id,
  keys: () => appContext.keys().filter((key) => /\.[jt]sx?$/.test(key)),
  resolve: (key: string) => appContext.resolve(key),
});
