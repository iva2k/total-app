// import type { SvelteKitPWAOptions, GenerateSWOptions } from '@vite-pwa/sveltekit';
// import type { VitePWAOptions } from 'vite-plugin-pwa';
// import type { RollupReplaceOptions } from '@rollup/plugin-replace';

import websiteAsync from './src/lib/config/websiteAsync.js';

const pwaConfigurationFnc = async (
  /** @type {Record<string, string>} */
  env
) => {
  const { backgroundColor, description, siteShortTitle, siteTitle, themeColor } =
    await websiteAsync(env);

  // const outDir = process.env.VERCEL ? './.vercel/output/static' : './.svelte-kit/output/client';
  // const srcDir = process.env.VERCEL ? './src' : './src';
  // const outDir = './.svelte-kit/output/client';
  const outDir = './.svelte-kit/output'; // Since some rev. @vite-pwa/sveltekit adds '/client' to outDir,
  const srcDir = './src';
  // ? const globDirectory = process.env.VERCEL ? './.vercel/output/static' : 'client';

  const scope = '/';

  // For @sveltejs/adapter-static, @sveltejs/adapter-netlify, @sveltejs/adapter-vercel
  // /** @typedef {import('workbox-build').ManifestEntry} ManifestEntry */
  /** @type {import('workbox-build').ManifestTransform} */
  const manifestTransformStatic = async (manifestEntries) => {
    console.info('Precache Manifest Entries:');
    const manifest = manifestEntries
      .filter(
        ({ url }) =>
          // Remove paths that should not be cached:
          url !== 'client/vite-manifest.json' && url !== 'prerendered/fallback.html'
        // && url !== 'client/manifest.webmanifest' && !url.endsWith('sw.js') && !url.startsWith('workbox-')
      )
      .map((e) => {
        // Adjust paths to match what the adapter server understands:
        const url1 = e.url;
        let url = e.url;
        if (url.startsWith('/')) url = url.slice(1);
        if (url.startsWith('client/')) url = url.slice(7);
        if (url.startsWith('prerendered/pages/')) url = url.slice(18);

        // if (url === 'prerendered/fallback.html') url = 'sw';

        // router paths
        if (url && url.endsWith('.html')) {
          url = url === 'index.html' ? '' : `${url.substring(0, url.lastIndexOf('.'))}`;
        }
        e.url = scope + url; // Canonical URL starts with base
        console.info(`  ${url1.padEnd(100)} => ${JSON.stringify(e)}`);
        return e;
      });
    return { manifest };
  };

  // adapter-netlify creates ./build directory, same contents as adapter-static
  // adapter-vercel creates ./vercel/output/static directory, same contents as adapter-static
  const manifestTransforms = [manifestTransformStatic];

  // /** @type {import('vite-plugin-pwa').VitePWAOptions} */
  /** @type {import('@vite-pwa/sveltekit').SvelteKitPWAOptions & {swSrc?: string | undefined, swDest?: string | undefined}} */
  const pwaConfiguration = {
    srcDir: srcDir,

    // outDir: './.svelte-kit', // broken?
    outDir: outDir,

    mode: 'development',
    // includeManifestIcons: false,
    filename: '', // set programmatically, below
    scope: scope,
    base: scope,

    // For ResolvedVitePWAOptions:
    // swSrc: '',
    // swDest: '',

    // default: selfDestroying: false, // set programmatically, below
    // default: registerType: 'prompt', // safer option than 'autoUpdate', // set programmatically, below

    // default: strategies: 'generateSW', // set programmatically, below
    // for strategies='injectManifest' must include injectManifest: {}, // set programmatically, below
    // for strategies='generateSW'     must include workbox: {}, // set programmatically, below

    // default: injectRegister: 'auto',
    // injectRegister: 'script',
    // default: minify: true,

    devOptions: {
      // enabled: process.env.SW_DEV === 'true',
      enabled: true,
      /* when using generateSW the PWA plugin will switch to classic */
      type: 'module',
      navigateFallback: scope
      // deprecated: webManifestUrl: '/manifest.webmanifest'
    },

    includeAssets: [
      // 'favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'
    ],
    manifest: {
      short_name: siteShortTitle, // set programmatically, below
      name: siteTitle, // set programmatically, below
      description,
      screenshots: [
        { src: '/icon-txr-512x512.png', type: 'image/png', sizes: '512x512', form_factor: 'wide' }, // TODO: (now) Make wide screenshot image
        { src: '/icon-txr-512x512.png', type: 'image/png', sizes: '512x512', form_factor: 'narrow' }
      ],

      start_url: scope,
      scope: scope,
      id: scope, // TODO: (when needed, mid-2023?) It has to match server URL (domain, port, and path)
      // display: 'standalone',
      display: 'fullscreen',
      theme_color: themeColor,
      background_color: backgroundColor,
      icons: [
        {
          // Android
          src: '/icon-192x192.png',
          type: 'image/png',
          sizes: '192x192',
          purpose: 'any'
        },
        {
          src: '/icon-512x512.png',
          type: 'image/png',
          sizes: '512x512',
          purpose: 'any'
        },
        {
          src: '/icon-512x512.png',
          type: 'image/png',
          sizes: '512x512',
          purpose: 'maskable'
        }
      ]
    },
    // useCredentials: true, // Will add `crossorigin="use-credentials"` attribute to <link rel="manifest">, so manifest can be accessed id it sits behind auth
    // if you have shared info in svelte config file put in a separate module and use it also herenr lint
    kit: {
      // base: '',
      // outDir: './.svelte-kit',
      // adapterFallback: 'index.html'
      // trailingSlash: 'never'
    }
  };

  const claims = process.env.CLAIMS === 'true';
  const reload = process.env.RELOAD_SW === 'true';
  const sw = process.env.SW === 'true';
  const selfDestroying = process.env.SW_DESTROY === 'true';

  /** @type {import('@rollup/plugin-replace').RollupReplaceOptions } */
  const replaceOptions = {
    __DATE__: new Date().toISOString(),
    __RELOAD_SW__: reload ? 'true' : 'false',
    __UPDATE_CHECK_PERIOD_MS__: JSON.stringify(
      process.env.SW_DEV === 'true' ? 20 * 1000 : 60 * 60 * 1000
    ),
    __SW_DEV__: process.env.SW_DEV === 'true' ? 'true' : 'false',
    preventAssignment: true
  };

  /** @typedef {import('workbox-build').InjectManifestOptions} InjectManifestOptions */
  /** @typedef {import('workbox-build').GeneratePartial} GeneratePartial */
  // /** @typedef {import('vite-plugin-pwa').CustomInjectManifestOptions} CustomInjectManifestOptions */
  /** @type {Partial<InjectManifestOptions & GeneratePartial>} */
  const workboxOrInjectManifestEntry = {
    // vite and SvelteKit are not aligned: pwa plugin will use /\.[a-f0-9]{8}\./ by default: #164 optimize workbox work
    dontCacheBustURLsMatching: /-[a-f0-9]{8}\./,
    // maximumFileSizeToCacheInBytes: 3000000, // Increase max size of assets in manifest
    // To exclue routes, see <https://vite-pwa-org.netlify.app/guide/faq.html#exclude-routes>
    // For background sync, see <https://vite-pwa-org.netlify.app/workbox/generate-sw.html#background-sync>
    // globDirectory: globDirectory,
    globPatterns: [
      'client/**/*.{js,css,html,ico,json,jpg,jpeg,png,svg,webp,webmanifest,woff,woff2}'
    ],
    // globPatterns: ['client/**/*.{js,css,ico,png,svg,webp,woff,woff2}'], // From @vite-pwa/sveltekit example
    // globIgnores: sw ? (claims ? ['**/claims-sw*'] : ['**/prompt-sw*']) : ['**/sw*', '**/workbox-*'], // Not needed, seems the  plugin takes care of that.
    // Before generating the service worker, manifestTransforms entry will allow us to transform the resulting precache manifest. See the manifestTransforms docs for mode details.
    // Here we use it only to log the precache manifest.
    manifestTransforms: manifestTransforms
  };

  if (sw) {
    // Option to use custom SW files (needs a patch to vite-plugin-pwa):
    const swFile = claims ? 'claims-sw.ts' : 'prompt-sw.ts';
    // pwaConfiguration.swSrc = swFile; // Must be relative to srcDir path. Define swSrc to use custom code. Leave undefined to let workbox generate one.
    // pwaConfiguration.swDest = swFile; // Must be relative to srcDir path.
    pwaConfiguration.filename = swFile;

    pwaConfiguration.strategies = 'injectManifest';
    if (pwaConfiguration.manifest) {
      pwaConfiguration.manifest.name = siteTitle + ' (PWA)';
      pwaConfiguration.manifest.short_name = siteShortTitle + ' (PWA)';
    }
    pwaConfiguration.injectManifest = workboxOrInjectManifestEntry;
  } else {
    workboxOrInjectManifestEntry.mode = 'development';
    workboxOrInjectManifestEntry.sourcemap = process.env.SW_DEV === 'true'; // Enable for service worker during development. No SW sourcemaps for production.
    workboxOrInjectManifestEntry.navigateFallback = scope;
    pwaConfiguration.workbox = workboxOrInjectManifestEntry;
  }

  if (claims) pwaConfiguration.registerType = 'prompt'; // safer option than 'autoUpdate' (which can lose user data entered into a form if update happens);

  if (selfDestroying) {
    pwaConfiguration.selfDestroying = selfDestroying; // `true` will unregister the service worker.
    pwaConfiguration.swSrc = undefined;
    // ? pwaConfiguration.swDest = 'dev-dist';
    pwaConfiguration.filename = 'destroy-sw.ts'; // Undocumented feature, Must provide .filename for .selfDestroying = true.
  }

  // console.log('DEBUG pwa-configuration.js: pwaConfiguration=%o', pwaConfiguration);
  // console.log('DEBUG pwa-configuration.js: replaceOptions=%o', replaceOptions);
  return { pwaConfiguration, replaceOptions };
};

// export { pwaConfiguration, replaceOptions };
export { pwaConfigurationFnc };
