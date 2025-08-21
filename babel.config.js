module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    'react-native-worklets/plugin',
    [
      'module-resolver',
      {
        alias: {
          '@app': './src',
        },
      },
    ],
    // NOTE: react-native-reanimated plugin MUST be listed last
    'react-native-reanimated/plugin',
  ],
}
