import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import type { UserConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import basicSsl from '@vitejs/plugin-basic-ssl';

import assets from './assets.js';

// TODO: (when needed) Remove eslint-disable
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default defineConfig(async ({ mode }) => {
  const plugins = [
    sveltekit(),

    // copy is needed for vite to work in dev (especially under "tauri:dev")
    // All copy commands are duplicated in package.json:scripts.svelte:prebuild, for dev to work correctly.
    viteStaticCopy({
      targets: assets
    })
  ];
  // Playwright does not handle https, see https://github.com/microsoft/playwright/issues/16460
  if (!process.env.NO_HTTPS) plugins.unshift([basicSsl()]);

  const config: UserConfig = {
    plugins,
    test: {
      include: ['src/**/*.{test,spec}.{js,ts}']
    }
  };
  return config;
});
