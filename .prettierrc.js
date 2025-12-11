module.exports = {
  arrowParens: 'avoid',
  bracketSpacing: true,
  printWidth: 100,
  plugins: ['prettier-plugin-organize-imports'],
  singleQuote: true,
  trailingComma: 'all',
  semi: false,
  overrides: [
    {
      files: ['scripts/**/*.js'],
      options: {
        plugins: [], // Disable organize-imports for scripts
      },
    },
  ],
}
