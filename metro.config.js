const {getDefaultConfig} = require("@react-native/metro-config")
const path = require("path")

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */

const defaultConfig = getDefaultConfig(__dirname)

// Can't use the mergeConfig mechanism below because it doesn't merge lists, it just replaces them.
defaultConfig.resolver.assetExts.push("sqlite")

// Add alias configuration directly to defaultConfig
defaultConfig.resolver.alias = {
  "@app": path.resolve(__dirname, "src"),
}

module.exports = defaultConfig
