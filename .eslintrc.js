module.exports = {
  root: true,
  extends: ['@react-native', 'prettier'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'prettier'],
  ignorePatterns: ['**/__mocks__/**/*.js'],
  rules: {
    'prettier/prettier': ['error'],
    'react/react-in-jsx-scope': 'off',
    'prefer-const': 'error',
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: 'react-native',
            importNames: ['SafeAreaView'],
            message: 'use useSafeAreaInsets instead',
          },
          {
            name: 'react-native-safe-area-context',
            importNames: ['SafeAreaView'],
            message: 'use useSafeAreaInsets instead',
          },
          {
            name: 'react-native-safe-area-view',
            importNames: ['SafeAreaView'],
            message: 'use useSafeAreaInsets instead',
          },
        ],
      },
    ],
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      rules: {
        '@typescript-eslint/no-shadow': ['error'],
        'linebreak-style': 'off',
        'no-shadow': 'off',
        'no-undef': 'off',
        semi: ['error', 'never'],
      },
    },
  ],
}
