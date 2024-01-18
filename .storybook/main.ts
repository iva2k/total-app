import type { StorybookConfig } from '@storybook/sveltekit';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx|svelte)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-svelte-csf',
    '@storybook/addon-a11y'
  ],
  framework: {
    name: '@storybook/sveltekit',
    options: {}
  },
  core: {
    disableTelemetry: true
  },
  docs: {
    autodocs: 'tag'
  }
};
export default config;
