import { sveltekit } from '@sveltejs/kit/vite';
import { optimizeCss } from 'carbon-preprocess-svelte';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';
import type { UserConfig, Plugin } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
// import basicSsl from '@vitejs/plugin-basic-ssl';
import replace from '@rollup/plugin-replace';
import backloopHttpsOptions from 'backloop.dev';

import Icons from 'unplugin-icons/vite';
import { FileSystemIconLoader } from 'unplugin-icons/loaders';

import { SvelteKitPWA } from '@vite-pwa/sveltekit';

import { pwaConfigurationFnc } from './pwa-configuration.js';
import assets from './assets.js';

export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  const { pwaConfiguration, replaceOptions } = await pwaConfigurationFnc(env);

  const plugins = [
    // see below: basicSsl(),
    sveltekit(),
    SvelteKitPWA(pwaConfiguration),
    Icons({
      // experimental
      autoInstall: true,
      compiler: 'svelte',
      customCollections: {
        // Add your custom collection here
        images: FileSystemIconLoader(
          './src/lib/images',
          (svg) => svg // No processing
          // To do any processing: (svg) => svg.replace(/^<svg /, '<svg fill="currentColor" ')
        )
      }
    }),

    replace(replaceOptions) as Plugin, // Convert rollup.Plugin into vite.Plugin
    optimizeCss(),

    // copy is needed for vite to work in dev (especially under "tauri:dev")
    // All copy commands are duplicated in package.json:scripts.svelte:prebuild, for dev to work correctly.
    viteStaticCopy({
      targets: assets
    })
  ];
  // Playwright does not handle https, see https://github.com/microsoft/playwright/issues/16460
  // if (!process.env.NO_HTTPS) plugins.unshift([basicSsl()]);

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
    optimizeDeps: {
      // To prebundle:
      include: [
        // 'carbon-components-svelte', // carbon-components-svelte is large, good to prebundle (if in `include`, remove from `exclude`)
      ],

      // Optional: since we use the `optimizeImports` preprocessor, we can exclude
      // `carbon-components-svelte` and `carbon-pictograms-svelte` from the
      // `optimizeDeps` configuration for even faster cold starts.
      exclude: [
        // Obsoltete: '@carbon/telemetry', // Disable IBM telemetry (not sure if this has any effect, see .env.EXAMPLE file)
        '@ibm/telemetry-js', // Disable IBM telemetry (also see .env.EXAMPLE file)
        'carbon-components-svelte',
        'carbon-pictograms-svelte',
        // carbon-icons-svelte is huge and takes 12s to prebundle, better use deep imports for the icons you need
        'carbon-icons-svelte'
      ]
    },
    test: {
      include: ['src/**/*.{test,spec}.{js,ts}']
    },
    server: process.env.NO_HTTPS
      ? {}
      : {
          // Use valid HTTPS certs for localhost
          port: 4443,
          // port: 3000,
          host: 'total-app.backloop.dev',
          https: backloopHttpsOptions
        }
  };
  return config;
});
