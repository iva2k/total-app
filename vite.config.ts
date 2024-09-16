import { sveltekit } from '@sveltejs/kit/vite';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';
import type { PluginOption, UserConfig, Plugin as VitePlugin } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
// import basicSsl from '@vitejs/plugin-basic-ssl';
import replace from '@rollup/plugin-replace';
import rollupCommonjs from '@rollup/plugin-commonjs';
import backloopHttpsOptions from 'backloop.dev';
import { purgeCss } from 'vite-plugin-tailwind-purgecss';

import Icons from 'unplugin-icons/vite';
import { FileSystemIconLoader } from 'unplugin-icons/loaders';

import { SvelteKitPWA } from '@vite-pwa/sveltekit';

import { pwaConfigurationFnc } from './pwa-configuration.js';
import assets from './assets.js';

export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  const { pwaConfiguration, replaceOptions } = await pwaConfigurationFnc(env);
  const PROD_DEBUG = env.VITE_PROD_DEBUG?.toLowerCase() === 'true';

  const plugins: PluginOption[] = [
    // see below: basicSsl(),
    rollupCommonjs() as VitePlugin,
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

    replace(replaceOptions) as VitePlugin, // Convert rollup.Plugin into vite.Plugin
    purgeCss(),

    // copy is needed for vite to work in dev (especially under "tauri:dev")
    // All copy commands are duplicated in package.json:scripts.svelte:prebuild, for build to work correctly.
    viteStaticCopy({
      targets: assets
    })
  ];
  // Playwright does not handle https, see https://github.com/microsoft/playwright/issues/16460
  // if (!process.env.NO_HTTPS) plugins.unshift([basicSsl()]);

  const config: UserConfig = {
    optimizeDeps: {
      include: [
        '@ionic/pwa-elements/loader/index.cjs.js',
        'node_modules/@ionic/pwa-elements/loader/index.cjs.js'
      ]
    },
    logLevel: 'info',
    build: {
      minify: !PROD_DEBUG,
      sourcemap: PROD_DEBUG,
      commonjsOptions: {
        // Options for rollupCommonjs
        include: [], // https://github.com/vitejs/vite/issues/2679#issuecomment-994772493
        requireReturnsDefault: 'auto'
      }
    },
    define: {
      __DATE__: JSON.stringify(new Date().toISOString()),
      __RELOAD_SW__: JSON.stringify(false),
      __UPDATE_CHECK_PERIOD_MS__: JSON.stringify(20000) // in milli-seconds, 20s for testing purposes
    },
    plugins,
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
          https: backloopHttpsOptions,
          proxy: {} // Fixes https://github.com/sveltejs/svelte/issues/12398
        }
  };
  return config;
});
