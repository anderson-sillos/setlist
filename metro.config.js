const fs = require('node:fs');
const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

function resolveNearestTslibEsm(originModulePath) {
  let directory = path.dirname(originModulePath);

  while (true) {
    const packageDirectory = path.join(directory, 'node_modules', 'tslib');
    const packageJsonPath = path.join(packageDirectory, 'package.json');

    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const exportModule = packageJson.exports?.['.']?.module;
      const entryPoint =
        packageJson.module ??
        (typeof exportModule === 'string'
          ? exportModule
          : exportModule?.default);

      if (entryPoint) {
        return path.resolve(packageDirectory, entryPoint);
      }

      throw new Error(`No ES module entry found for ${packageJsonPath}`);
    }

    const parentDirectory = path.dirname(directory);
    if (parentDirectory === directory) break;
    directory = parentDirectory;
  }

  throw new Error(`Cannot resolve tslib from ${originModulePath}`);
}

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'tslib' && context.isESMImport) {
    return {
      filePath: resolveNearestTslibEsm(context.originModulePath),
      type: 'sourceFile',
    };
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
