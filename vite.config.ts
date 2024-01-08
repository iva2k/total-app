import { sveltekit } from '@sveltejs/kit/vite';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';
import type { UserConfig, Plugin } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import basicSsl from '@vitejs/plugin-basic-ssl';
import replace from '@rollup/plugin-replace';

import { SvelteKitPWA } from '@vite-pwa/sveltekit';

import { pwaConfigurationFnc } from './pwa-configuration.js';
import assets from './assets.js';

// TODO: (when needed) Remove eslint-disable
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  const { pwaConfiguration, replaceOptions } = await pwaConfigurationFnc(env);

  const plugins = [
    // basicSsl(),
    sveltekit(),
    SvelteKitPWA(pwaConfiguration),
    replace(replaceOptions) as Plugin, // Convert rollup.Plugin into vite.Plugin

    // copy is needed for vite to work in dev (especially under "tauri:dev")
    // All copy commands are duplicated in package.json:scripts.svelte:prebuild, for dev to work correctly.
    viteStaticCopy({
      targets: assets
    })
  ];
  // Playwright does not handle https, see https://github.com/microsoft/playwright/issues/16460
  if (!process.env.NO_HTTPS) plugins.unshift([basicSsl()]);

  const config: UserConfig = {
    logLevel: 'info',
    build: {
      minify: false
    },
    define: {
      __DATE__: JSON.stringify(new Date().toISOString()),
      __RELOAD_SW__: JSON.stringify(false),
      __UPDATE_CHECK_PERIOD_MS__: JSON.stringify(20000) // in milli-seconds, 20s for testing purposes
    },
    plugins,
    test: {
      include: ['src/**/*.{test,spec}.{js,ts}']
    }
  };
  return config;
});
