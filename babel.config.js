const presets = ["module:metro-react-native-babel-preset"]
const plugins = [
  "react-native-reanimated/plugin",
  [
    "module-resolver",
    {
      alias: {
        "@app": "./src",
      },
    },
  ],
]
module.exports = {presets, plugins}
