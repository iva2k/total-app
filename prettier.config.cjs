module.exports = {
  overrides: [{ files: '*.svelte', options: { parser: 'svelte' } }],
  plugins: [
    'prettier-plugin-svelte',
    'prettier-plugin-tailwindcss' // MUST come last
  ],
  printWidth: 100,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'none',
  useTabs: false,
  svelteSortOrder: 'options-scripts-markup-styles'
};
