const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);
const schemasRoot = path.resolve(__dirname, '../../packages/schemas/src');
const i18nRoot = path.resolve(__dirname, '../../packages/i18n');

// Append, don't replace: getDefaultConfig() already auto-detects this monorepo
// and fills watchFolders with the workspace root + sibling apps (needed for
// hoisted node_modules resolution). Overwriting it here breaks that.
config.watchFolders = [...config.watchFolders, schemasRoot, i18nRoot];
config.resolver.extraNodeModules = {
  '@kropi/schemas': schemasRoot,
  '@kropi/i18n': i18nRoot,
  zod: path.resolve(__dirname, 'node_modules/zod'),
};

module.exports = withNativeWind(config, { input: './global.css' });
