const {getDefaultConfig, mergeConfig} = require("@react-native/metro-config")

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {}

let defaultConfig = getDefaultConfig(__dirname)

// Can't use the mergeConfig mechanism below because it doesn't merge lists, it just replaces them.
defaultConfig.resolver.assetExts.push("sqlite")

module.exports = mergeConfig(defaultConfig, config)
