/** @type { import("eslint").Linter.Config } */
module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended', // Note: This does not include TS type checks.
    // 'plugin:@typescript-eslint/recommended-type-checked', // This does type-checking, but breaks in .svelte files and few .ts places
    'plugin:svelte/recommended',
    'plugin:import/recommended',
    'plugin:storybook/recommended',
    'prettier'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'import'],
  ignorePatterns: ['*.cjs'],
  overrides: [
    {
      files: ['*.svelte'],
      parser: 'svelte-eslint-parser',
      parserOptions: {
        parser: '@typescript-eslint/parser'
      }
    }
  ],
  settings: {
    'import/resolver': {
      typescript: {}
    }
  },
  parserOptions: {
    project: ['./tsconfig.json', './tsconfig.lint.json'],
    tsconfigRootDir: './',
    sourceType: 'module',
    ecmaVersion: 2020,
    extraFileExtensions: ['.svelte']
  },
  env: {
    browser: true,
    es2017: true,
    node: true
  },
  rules: {
    'import/no-mutable-exports': 'off'
  }
};
