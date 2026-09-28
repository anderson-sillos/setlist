const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// lucide-react-native 1.46.0 exposes its React Native entry as an .mjs file.
// Metro 0.76 (Expo SDK 49) does not include .mjs in sourceExts by default.
config.resolver.sourceExts.push('mjs');

module.exports = config;
