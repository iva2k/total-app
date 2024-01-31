module.exports = {
  overrides: [{ files: '*.svelte', options: { parser: 'svelte' } }],
  plugins: ['prettier-plugin-svelte'],
  printWidth: 100,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'none',
  useTabs: false,
  svelteSortOrder: 'options-scripts-markup-styles'
};
