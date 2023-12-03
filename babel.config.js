const presets = ["babel-preset-expo"]
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
