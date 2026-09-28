const { withInfoPlist, withPodfile } = require('@expo/config-plugins');
const { mergeContents } = require('@expo/config-plugins/build/utils/generateCode');

module.exports = function withGoogleIosUrlScheme(config, { urlScheme }) {
  config = withInfoPlist(config, (config) => {
    const urlTypes = config.modResults.CFBundleURLTypes ?? [];
    const alreadyConfigured = urlTypes.some((urlType) =>
      (urlType.CFBundleURLSchemes ?? []).includes(urlScheme),
    );

    if (!alreadyConfigured) {
      config.modResults.CFBundleURLTypes = [
        ...urlTypes,
        { CFBundleURLSchemes: [urlScheme] },
      ];
    }

    return config;
  });

  return withPodfile(config, (config) => {
    const result = mergeContents({
      tag: 'setlist-nitro-google-signin-pods',
      src: config.modResults.contents,
      newSrc: [
        "  pod 'AppCheckCore', :modular_headers => true",
        "  pod 'GoogleUtilities', :modular_headers => true",
        "  pod 'React-jsi', :path => '../node_modules/react-native/ReactCommon/jsi', :modular_headers => true",
        "  pod 'RecaptchaInterop', :modular_headers => true",
      ].join('\n'),
      anchor: /use_native_modules!\s*\n/,
      offset: 1,
      comment: '#',
    });
    config.modResults.contents = result.contents;
    return config;
  });
};
