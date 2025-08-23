module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        alias: {
          '@app': './src',
        },
      },
    ],
    // NOTE: react-native-worklets plugin MUST be listed last
    'react-native-worklets/plugin',
  ],
}
