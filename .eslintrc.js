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
    'max-len': [
      'warn',
      {
        code: 100,
        ignoreUrls: true,
        // ignoreStrings: true,
        // ignoreTemplateLiterals: true,
        ignoreRegExpLiterals: true,
        ignoreComments: false,
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
    {
      files: ['*.js'],
      rules: {
        'max-len': [
          'warn',
          {
            code: 100,
            ignoreUrls: true,
            ignoreRegExpLiterals: true,
            ignoreComments: false,
          },
        ],
      },
    },
  ],
}
