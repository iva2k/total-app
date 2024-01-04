import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://github.com/sveltejs/svelte-preprocess
  // for more information about preprocessors
  preprocess: [
    vitePreprocess({
      preserve: ['ld+json'] // For SEO header meta tags
    })
  ],

  kit: {
    // base: '',
    // outDir: './.svelte-kit',
    // ? adapterFallback: 'index.html',
    adapter: adapter(),
    // prerender: { entries: [] },

    // Form submissions do not function in `vite preview` with https (due to cookie)
    // @see https://github.com/sveltejs/kit/issues/7277
    csrf: {
      checkOrigin: false
    },

    alias: {
      // Place to add all aliases. Run 'svelte-kit sync' (or pnpm run postinstall) to update paths in '.svelte-kit/tsconfig.json'.
      // $components: resolve('./src/lib/components')
    }
  },

  vitePlugin: {
    // exclude: ['./node_modules/**']
    // experimental options
    // experimental: {}
  }
};

export default config;
