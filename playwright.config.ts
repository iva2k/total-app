import type { PlaywrightTestConfig } from '@playwright/test';
// TODO: (when needed) use: import type { PlaywrightTestConfig } from '@playwright/experimental-ct-svelte';

const config: PlaywrightTestConfig = {
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI
    ? [['dot'], ['json', { outputFile: 'test-results.json' }]]
    : [['list'], ['json', { outputFile: 'test-results.json' }], ['html', { open: 'on-failure' }]],
  webServer: {
    command: 'pnpm run build:base && pnpm run preview:http',
    port: 4173,
    timeout: 120 * 1000
  },
  testDir: 'tests',
  testMatch: /(.+\.)?(test|spec)\.[jt]s/
  // TODO: (when needed) How to use Vite config? see https://github.com/microsoft/playwright/issues/14295#issuecomment-1132258917
  // use: {
  //   ctViteConfig: { }
  // }
};

export default config;
