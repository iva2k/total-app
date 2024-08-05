import path from 'path';
// import adapter from '@sveltejs/adapter-auto';
import netlify from '@sveltejs/adapter-netlify';
import vercel from '@sveltejs/adapter-vercel';
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { loadEnv } from 'vite';
import { pwaConfigurationFnc } from './pwa-configuration.js';

const mode = process.env.NODE_ENV || 'development';
const env = loadEnv(mode, process.cwd());
const { pwaConfiguration } = await pwaConfigurationFnc(env);

import websiteFnc from './src/lib/config/websiteFnc.js';
const { websiteUrl } = websiteFnc(process.env);

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://github.com/sveltejs/svelte-preprocess
  // for more information about preprocessors
  preprocess: [
    vitePreprocess({
      preserve: ['ld+json'], // For SEO header meta tags
      postcss: true,
      scss: { includePaths: ['src', 'node_modules'] }
    })
  ],

  prerender: {
    default: true,
    onError: 'continue',
    origin: websiteUrl
  },

  kit: {
    // base: '',
    // outDir: './.svelte-kit',
    // ? adapterFallback: 'index.html',
    adapter: process.env.VERCEL
      ? vercel()
      : process.env.NETLIFY
        ? netlify()
        : adapter({
            // default options are shown:
            // pages: 'build',
            // assets: 'build',
            // fallback: null,
            // precompress: false
            fallback: 'index.html'
          }),
    // prerender: { entries: [] },

    // Form submissions do not function in `vite preview` with https (due to cookie)
    // @see https://github.com/sveltejs/kit/issues/7277
    csrf: {
      checkOrigin: !!process.env.VERCEL || !!process.env.NETLIFY
    },

    alias: {
      // Place to add all aliases. Run 'svelte-kit sync' (or pnpm run postinstall) to update paths in '.svelte-kit/tsconfig.json'.
      // $components: resolve('./src/lib/components')
    },
    files: {
      serviceWorker: path.join(
        pwaConfiguration.srcDir || 'src',
        pwaConfiguration.filename || 'sw.js'
      )
    },
    serviceWorker: {
      register: false // Disable SvelteKit service worker to use virtual:pwa-register/svelte
    }
  },

  vitePlugin: {
    // exclude: ['./node_modules/**']
    // experimental options
    // experimental: {}
  }
};

export default config;
