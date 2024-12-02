# Creating: Total App | Blank SvelteKit Starter App

This file describes how this app was created.

It is not a tutorial per se, and uses a dense step-by-step language without too much explanation and expects the reader to dive deeper on their own. Making it into a tutorial will yield a thick book, which is not the goal here.

## Technology Stack

Built with:

- [Svelte + Svelte Kit](https://svelte.dev) - Truly reactive Javascript/TypeScript App UI framework + Javascript/TypeScript App build system
- [Tauri](https://tauri.app) - Desktop Application framework
- [Capacitor](https://capacitorjs.com) - Building crossplatform apps
- [Prettier](https://prettier.io/) - Opinionated Code Formatter
- [ESLint](https://eslint.org) - Pluggable JavaScript linter
- [Stylelint](https://stylelint.io/) - A mighty, modern CSS linter
- [Postcss](https://postcss.org/) - Transforming styles with JS plugins
- [Playwright](https://playwright.dev) - Fast and reliable end-to-end testing for modern web apps
- [Vitest](https://vitest.dev) - A blazing fast unit test framework powered by Vite

Continuous Integrations and Deployments:

- [Netlify](https://total-app.netlify.app) - App Demo
- [Vercel](https://total-app.vercel.app) - App Demo

## Software Mantra

### DRY

DRY - Don't-Repeat-Yourself. Knowledge should always reside in a single place. If code of more than 3 steps is repeated twice, maybe... if thrice - for sure refactor it so it resides in a single place and used from there. DRY is avoiding knowledge duplication (and splintering) and reducing the repetition of code patterns in favor of abstractions and avoiding redundancy. It also can be explained as SST - Single-SourceOf-Truth principle - "every piece of knowledge must have a single, unambiguous, authoritative representation within a system". Code can still be duplicated - it is sometimes a judgement call for balancing with other principles.

### KISS

KISS - Keep-It-Simple,Stupid. Keep the code simple and clear, making it easy to understand. If code needs comments, think hard - the code can probably be simplified by renaming, restructuring, breaking up.

## Prerequisites

Note: For developing on Windows, enable "Developer Mode" by opening "Settings" > "For developers" > "Developer Mode" = On. It will allow symlink creation (required for pnpm) without elevating as administrator. If you see "EPERM" error associated with SymLinks in any of the build tools, make sure that "Developer Mode" is turned on.

Install [Git](https://git-scm.com/).

Install [NodeJS](https://nodejs.org/en).

Recommended [VSCode](https://code.visualstudio.com/) for IDE.

Please follow the [Tauri Getting Started Guide](https://tauri.app/v1/guides/getting-started/prerequisites) to setup your system with the required [Rust](https://www.rust-lang.org/) toolchain.

## create-svelte

SvelteKit scaffolding is set up by [`create-svelte`](https://github.com/sveltejs/kit/tree/master/packages/create-svelte).

```bash
# create a new project in my-app, use demo app, TypeScript syntax, ESLint, Prettier, Playwright, Vitest, Svelte 5
npm create svelte@latest my-app
cd my-app
pnpm install
git init && git add -A && git commit -m "Initial commit" # (optional)
pnpm exec playwright install
```

## Developing Locally

This application is built like a typical Node.js application. However, instead of `npm`, [`pnpm`](https://pnpm.io/) is used for package management.

> **Note:** You may use `yarn` or `npm`, but only a `pnpm` lockfile is included, as well as package.json:scripts rely on `pnpm`.

### Developing in TypeScript

Good collection of helpful tips: <https://github.com/ivanhofer/sveltekit-typescript-showcase>

And this article [Typing Components in Svelte](https://www.viget.com/articles/typing-components-in-svelte/) gives good overview on built-in tools for typing Svelte components.

### Start development server

```bash
pnpm run dev

# or start the development server and open the app in a new browser tab
pnpm run dev -- --open
```

## Add Tooling and Fix Issues That Might Come Up

Run `pnpm run XXX` replacing XXX for each of the scripts in `package.json`. It's a good idea to fix all errors and warnings that might come up, and re-check after each major addition.

### Add HTTPS

Install one of the https options below and run the dev server in https mode:

```bash
pnpm run dev:https --host
```

#### Use `@vitejs/plugin-basic-ssl` (Legacy)

`@vitejs/plugin-basic-ssl` uses self-signed cert that browser will reject (need to accept it to let browser load the dev website).

```bash
pnpm i -D @vitejs/plugin-basic-ssl
```

Add plugin to `vite.config.ts`:

```js
...
import basicSsl from '@vitejs/plugin-basic-ssl';
const plugins = [
  ...
];
if (!process.env.NO_HTTPS) plugins.unshift([basicSsl()]);
```

#### Use backloop.dev

Note: Remove `basicSsl` from `vite.config.ts` and uninstall `@vitejs/plugin-basic-ssl`.

```bash
pnpm install -D backloop.dev
```

Add code to `vite.config.ts` (see source in repo).

### Add Tooling

```bash
pnpm install -D cross-env glob rimraf minimist @types/minimist sass shx vite-plugin-static-copy cpy @types/node @types/glob
pnpm install -D ts-node tsx
```

Add assets copying scripts `scripts/assets-copy.ts` and `scripts/assets-clean.ts` to `package.json`.

Add assets copying during dev using 'vite-plugin-static-copy' to svelte.config.js (see source file).

### Add Icons & SVG loader

```bash
pnpm install -D unplugin-icons
```

Package `unpligin-icons` internally uses `@iconify/svelte`, but generates icons on the server during build.

Add setup for `unplugin-icons` plugin into `vite.config.ts`, add types to `src/app.d.ts` and add types to `tsconfig.json` (see sources in repo).

`unplugin-icons` plugin creates Svelte component for any icon, and automatically maintains used icon libraries.

With `Iconify IntelliSense` VSCode extension (see `.vscode/extensions.json`) can preview the selected icon and can quickly locate icons from within the VSCode IDE.

Example icon use:

```js
<script>
...
import CustomIcon from 'virtual:icons/<set>/<icon>'; // <- this will show icon preview inline, and IntelliSense will show auto-complete dropdown.
</script>
<CustomIcon />
```

### Lint Error "illegal variable name"

```bash
$ pnpm run lint
...\total-app\src\routes\Header.svelte
  19:25  error  $page is an illegal variable name. To reference a global variable called $page, use globalThis.$page(illegal-global)  svelte/valid-compile
...\total-app\src\routes\sverdle\+page.svelte
  189:22  error  $reduced_motion is an illegal variable name. To reference a global variable called $reduced_motion, use globalThis.$reduced_motion(illegal-global)  svelte/valid-compile

✖ 2 problems (2 errors, 0 warnings)
```

To resolve (temporarily), added eslint-disable comments to the affected lines.

### Issue with imports linting

#### Update 2024

Updating ESLint to v9 and flat configs.

1. Use `typescript-eslint-parser-for-extra-files` to fix problems with `.svelte` files when using `project: './tsconfig.json'`.

2. Plugin `eslint-plugin-import` is not compatible, and there's lack of progress in the ongoing discussions, see:

- <https://github.com/eslint/eslint/issues/17953>
- <https://github.com/import-js/eslint-plugin-import/pull/2873>
- <https://github.com/import-js/eslint-plugin-import/pull/2996> (show comments marked as spam and off-topic, review "eslint-plugin-import-x")

Decided to try `eslint-plugin-import-x`, see discussion in <https://github.com/un-ts/eslint-plugin-import-x/issues/29>.

```bash
pnpm install -D eslint-plugin-import-x
```

```js
// This is a first appoximation. See eslint.config.mjs source for the actual.
import eslintImportX from 'eslint-plugin-import-x'
...

export default [
  {
    ...
    plugins: {
-     import: eslintImport,
+     'import-x': eslintImportX,
    },
    settings: {
      'import-x/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx'],
      },
      'import-x/resolver': {
        // Load <rootdir>/tsconfig.json
        typescript: true,
        node: true,
      },
    },
    rules: {
      // Error on imports that don't match the underlying file system
-     // https://github.com/import-js/eslint-plugin-import/blob/master/docs/rules/no-unresolved.md
-     'import/no-unresolved': 'error',
+     // https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/no-unresolved.md
+     'import-x/no-unresolved': 'error',
    },
  },
...
]
```

#### Legacy

<https://github.com/sveltejs/kit/issues/1560>

Fix:

Install `eslint-plugin-import` package for checking imports, and install `eslint-import-resolver-typescript` package for resolving aliases set by "path" in `tsconfig.json`:

```bash
pnpm i -D eslint-plugin-import eslint-import-resolver-typescript
```

Add to `.eslintrc.cjs` file:

```cjs
{
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
+    'plugin:import/recommended',
    'prettier'
  ],
  plugins: [
    ...
+    'import'
  ],
  settings: {
+    'import/resolver': {
+      typescript: {}
+    }
    ...
  },
  parserOptions: {
+    project: ['./tsconfig.json', './tsconfig.lint.json'],
+    tsconfigRootDir: './',
    ...
  }
}
```

Create file `tsconfig.lint.json` with:

```json
{
  "extends": "./tsconfig.json",
  "include": ["./playwright.config.ts", "./svelte.config.js", "./tests/**/*.ts"]
}
```

Add few lines to tsconfig.json (see the source for details):

```json
{
  "extends": "./.svelte-kit/tsconfig.json",
  "compilerOptions": {
    ...
+    "outDir": ".types",
+    "paths": {
+      "$app/*": ["./node_modules/@sveltejs/kit/src/runtime/app/*"],
+      "$lib": ["./src/lib"],
+      "$lib/*": ["./src/lib/*"]
+    }
  },
+  "exclude": ["./node_modules/**", ".svelte-kit/**", ".types"]
}
```

Some background info on these changes:

- SvelteKit generates `.svelte-kit/tsconfig.json` which is called by "extend" in `./tsconfig.json`.
- TypeScript does not have a true extend mechanism (it is really just an override).
- `paths` in `.svelte-kit/tsconfig.json` is incomplete (no `$app`), but we need to let ESLint somehow resolve those aliases, so we expplicitly list all aliases in our `./tsconfig.json`.
- There are `include` and `exclude` in `.svelte-kit/tsconfig.json`, so we can't add to those. `include` is generated, and `exclude` is static, so we can replace `exclude` with a low risk of it breaking later (there is still some risk, just keep in mind where to look should anything break after an update).
- This fix uncovers a hidden issue in @sveltejs/kit - there are some missing types in the published package. Run `pnpm run check` or `tsc` to see the "type not found" errors ("outDir" addition above just redirects the files generated by `tsc` command so they don't clash with existing .js files). Filed issue <https://github.com/sveltejs/kit/issues/5114>. Seems to not be happening anymore with @sveltejs/kit@1.0.0-next.561 due to runtime/app stashed under node_modules.

This modification triggers a message in SvelteKit v2.0:

```bash
You have specified a baseUrl and/or paths in your tsconfig.json which interferes with SvelteKit's auto-generated tsconfig.json. Remove it to
avoid problems with intellisense. For path aliases, use `kit.alias` instead: https://kit.svelte.dev/docs/configuration#alias
```

We ignore it for now.

### Issue "Could not detect a supported production environment" when running `pnpm run build`

> Could not detect a supported production environment. See <https://kit.svelte.dev/docs/adapters> to learn how to configure your app to run on the platform of your choosing

Fix:

See [Set Svelte SPA mode](#set-svelte-spa-mode) below.

## Additions

### Vitest Coverage

When creating SvelteKit project, choose vitest to be added.

For coverage, add '@vitest/coverage-v8' package:

```bash
pnpm i -D @vitest/coverage-v8
```

Add '/coverage' to .gitignore, .eslintignore, .prettierignore (see sources).

Add some scripts:

```json
// package.json
{
  ...
  "scripts": {
    ...
+    "test:unit": "echo RUN test:unit && vitest run",
+    "test:unit:watch": "echo RUN test:unit:watch && vitest",
+    "test:unit:coverage": "echo RUN test:unit:coverage && vitest run --coverage",
  }
}
```

The recommended VSCode extension Vitest "zixuanchen.vitest-explorer" provides control of unit tests in VSCode side-panel.

#### Issue with Vitest VSCode extension

As of 2024-0210, extension Vitest "zixuanchen.vitest-explorer" is not showing any of the tests. Of all other vitest extensions in the marketplace, none show the tests in the panel, and the ones that insert shortcuts in the source editor fail to run vitest. So there is no working integration with VSCode (tested on Windows).

TODO: (now) file issue(s) for "zixuanchen.vitest-explorer".

### Playwright Reports

Add few lines to `playwright.config.ts` file so HTML and .json reports are generated:

```js
// playwright.config.ts

...
const config: PlaywrightTestConfig = {
+  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
+  reporter: process.env.CI
+    ? [['dot'], ['json', { outputFile: 'test-results.json' }]]
+    : [['list'], ['json', { outputFile: 'test-results.json' }], ['html', { open: 'on-failure' }]],
  ...
```

The recommended VSCode extension Microsoft Playwright Test for VSCode "ms-playwright.playwright" provides control of integration tests in VSCode side-panel.

### Organize template components into `src/lib/components`

Move `src/routes/Counter.svelte` to `src/lib/components/counter/` and change paths to match in `src/routes/+page.svelte` file where it is used.

Move `src/routes/Header.svelte` to `src/lib/components/header/` and change paths to match in `src/routes/+layout.svelte` file where it is used.

(See sources).

### Website Config Files

Config files help organize site-wide settings. SvelteKit and Vite use .env files underneath, and we will build a helper file `$lib/config/website.js` to collect the relevant settings into one abstraction, similar to <https://rodneylab.com/sveltekit-blog-starter/#src-lib>.

Adding such a config would have been an easy task, if not for the Service Worker in the following section, which needs access to the config file from within `vite.config.ts` which is loaded during build time, before vite builder and SvelteKit load `.env` files into the environment, because it first determines the settings that choose which environment files to load. Luckily, there is a mechanism in Vite to access the .env settings from `vite.config.ts`.

To achieve that, we will convert static config assignments to an async function in `vite.config.ts`, so it could use [`loadEnv()`](https://vitejs.dev/config/#environment-variables) and [`defineConfig( async () /> {...})`](https://vitejs.dev/config/#async-config) (see the source of `vite.config.ts`) and then make an async wrapper `$lib/src/websiteAsync.js` over sync function in `$lib/config/websiteFnc.js`. The async is needed for await of the import of `$lib/config/websiteFnc.js` inside the function. We will use the async wrapper in the next section for the Service Worker.

This solution creates a small overhead for using `$lib/config/websiteFnc.js`, but we can wrap it in `$lib/config/website.js` which can be simply imported into all other files and desructured to get the needed setting variables:

```js
// Use `$lib/config/website.js`
import website from '$lib/config/website.js';
const { author, ... } = website;
```

See source file `src/routes/about/+page.svelte` that uses `siteTitle` from the config.

This setup involves 4 files: `.env` (it is listed in .gitignore and is never committed to the repo, see `.env.EXAMPLE`, make a copy and modify it for your site), and 3 files in `$lib/config/`: `website.js`, `websiteFnc.js`, `websiteAsync.js`.

The source of truth / relevant variables are spread between 2 files: `.env` and `$lib/config/websiteFnc.js`. The `.env` file should never be committed to repository since it is intended to contain website secrets. It is more involved to reproduce that file on the server / hosting provider. Most variables for the website are public anyway, and they should be defined in `$lib/config/websiteFnc.js` and commited to the repository. It will limit how many variables will need to be configured on hosting provider, since all variables set in `.env` will need to be configured securely in provider UI.

One more hurdle to overcome is fixing the ESLint rule 'import-x/no-unresolved' for `$env/static/public` used in `$lib/config/website.js`. But for now the ESLint is shut down with `// eslint-disable-next-line import-x/no-unresolved`.

### Add SEO

TODO: (soon) Revisit <https://github.com/artiebits/svelte-seo>, maybe it is worth using that idea? Has reasonable object data types, has keywords & tags. Downside is common params have to be repeated across objects.

If your app or website does not appear in the top search results, very few people will visit it, because 90% of users will not go beyond the first page of search results [[source]](https://www.forbes.com/sites/forbesagencycouncil/2017/10/30/the-value-of-search-results-rankings/). 33% of users will click the first result and 17% the second. You need Google to rank your website high for the users to click on it.

Search Engine Optimisation (SEO) is all about getting your website to appear at the top of search engine results. This SEO component adds some metadata and makes optimizations to get higher search rankings.

Other optimizations are getting higher speed / better UX. SvelteKit provides the fastest performance with PWA/SSR/SSG done right, and no slowdowns from virtual DOM of other popular frameworks. One thing is important for UX and fast loads are lazy loading, so we will add it as an example to the large images. TODO.

```bash
pnpm i -D @types/object-hash object-hash vanilla-lazyload
```

Create `src/lib/components/seo/SEO.svelte` component and few sub-components for generating meta-data for SEO (see sources). SEO component is used on each page, and relies on the configuration information from `src/lib/config/website.js`.

It is worth stressing that there's no way to determine hosting website URL during build / prerendering phase. PUBLIC_SITE_URL variable must be configured so the SEO canonical URL is generated correctly. Site URL's for Netlify and Vercel can be also set in `prerender.origin` in `svelte.config.js`, but they seem to not work as expected (SEO.svelte does not receive `$page.url.origin` other than `http://sveltekit-prerender`).

Credits: [Rodney Lab: SvelteKit SEO](https://rodneylab.com/sveltekit-seo/)

To add more Schemas, lookup the types on <https://schema.org/docs/full.html> and check what types other sites use.

See the following tools for checking the structured data on your deployed website:

- <https://validator.schema.org>
- <https://developers.google.com/search/docs/appearance/structured-data>
- <https://search.google.com/test/rich-results>
- <https://search.google.com/search-console/welcome>
- <https://developers.facebook.com/tools/debug/> (Must login to use it)

TODO: (soon) Fix FB issue:
Missing Properties | The following required properties are missing: fb:app_id

### Add SSR-Safe Store Services

SvelteKit provides good server/client support for stores. They are easy to use, but have some mines to avoid when using SSR (see <https://kit.svelte.dev/docs/state-management#avoid-shared-state-on-the-server> and <https://github.com/sveltejs/kit/discussions/4339>).

See `src/lib/util/state.svelte.ts` for handy helper functions that wrap rune `$state()` and readable & writable stores in a context, that are safe across server and client components and modules (adopted from <https://dev.to/jdgamble555/using-sharable-runes-with-typescript-in-svelte5-5hcp>).

#### Usage

```ts
// Component 1
<script>
  import { useUser } from '$lib/utils/state.svelte';
  let user = new User();
  const _user = useState('user', user); // Initializes 'user' context, creates writable `_user` var
  ...
  onLogin() {
    ...
    _user.value = new User(); // when user changes
  }
</script>
```

```ts
// Component 2
<script>
  import { useUser } from '$lib/utils/state.svelte';
  const user = $derived<User>(useState('user').value); // Observes 'user' context, creates observable `user` var that can be consumed directly, e.g. `if (user.loggedIn) {...}`
</script>
```

### Add Service Worker for Offline Operation

Service Worker will allow the app to work in offline mode. See <https://kit.svelte.dev/docs/service-workers> and <https://vite-pwa-org.netlify.app/frameworks/sveltekit.html> / <https://vite-pwa-org.netlify.app/frameworks/svelte.html>.

In order for the application to work offline, `csr` should NOT be set to false on any of the pages since it will prevent injecting JavaScript into the layout for offline support.

The app has to satisfy PWA Minimal Requirements, see <https://vite-pwa-org.netlify.app/guide/pwa-minimal-requirements.html>.

If your application has forms, we recommend you to change the behavior of automatic reload to use default `prompt` option to allow the user decide when to update the content of the application, otherwise automatic update may clear form data if it decides to update when the user is filling the form.

```bash
pnpm i -D @vite-pwa/sveltekit vite-plugin-pwa@^0.13.3 workbox-core workbox-build workbox-window workbox-precaching workbox-routing @rollup/plugin-replace
```

Create files and make some changes (see sources):

- Add /dev-dist to .gitignore, .eslintignore, .prettierignore
- Add SvelteKitPWA to "vite.config.ts"
- Create "src/lib/components/offline/Offline.svelte"
- Create "src/lib/components/reloadprompt/ReloadPrompt.svelte"
- Create "src/claims-sw.ts"
- Create "src/prompt-sw.ts"
- Create "pwa-configuration.js" (no typescript!)
- Add Offline component to "src/routes/+layout.svelte"
- Make `prerender = true` the default in "src/routes/+layout.svelte" - offline precaching needs all routes prerenderd. Dynamic routes won't work offline.
- Remove `csr = false` and `csr = dev` from all "src/routes/\*\*/+page.ts" files
- Add service worker scripts to `package.json`

### Add Favicon Component

To encapsulate all favicon-related stuff (and keep the mess out of app.html), create `src/lib/components/favicon/Favicon.svelte` component. Use it from `src/routes/+layout.svelte` file.

Add `badge.ts` to all png favicons so they dynamically display number of new notifications.

See source files.

### Add Drawer Component

A slide-out drawer is a must-have functionality for most modern apps and many websites.

Let's create one, with animations, accessibility, SSR-friendly.

See `src/lib/components/drawer/Drawer.svelte` and `src/lib/actions/FocusTrap/focusTrap.ts` sources.

Credits:

- <https://github.com/rsdavis/svelte-drawer/blob/main/src/Drawer.svelte>
- <https://github.com/skeletonlabs/skeleton/blob/master/src/lib/utilities/Drawer/Drawer.svelte>
- <https://github.com/skeletonlabs/skeleton/blob/master/src/lib/actions/FocusTrap/focusTrap.ts>

Modifications include:

- Elements remain mounted (no `{#if ...} that remove elements from DOM).
- Use CSS `visibility: hidden` so no interference with layout and other elements.
- Keyboard handling of 'Escape' to close and 'Tab' to move focus between elements.

The Drawer component is not used yet, but will be needed later.

### Add Tauri

Add desktop support using Tauri (version 2.0.0-alpha.20 as of writing time).

Why not Electron? - Tauri is way way better.

TODO: (now) Check out Tauri mobile support:

Note: iOS and Android support is promised in Tauri discussions, 2.0.0-alpha seems to bring it.

```bash
pnpm i -D @tauri-apps/api@next @tauri-apps/cli@next
rustc --version
# If needed, update to rustc 1.70 or newer:
rustup update
```

Add scripts to package.json (see source for exact changes, these are the essence):

```json
   {
     scripts {
-      "dev": "vite dev",
+      "dev": "vite dev --port 3000",
       "build": "vite build",
+      "tauri:dev": "tauri dev",
+      "tauri:build": "tauri build",
+      "tauri": "tauri",
     }
   }
```

```bash
pnpm run tauri init
# What is your app name? - total-app
# What should the window title be? - total-app
# Where are your web assets (HTML/CSS/JS) located, relative to the "<current dir>/src-tauri/tauri.conf.json" file that will be created? - ../build
# What is the url of your dev server? - http://localhost:3000
# What is your frontend dev command? - pnpm run dev
# What is your frontend build command? - pnpm run build:base
```

Add some .gitignore/.eslintignore/.prettierignore patterns (see source files).

#### Change bundle identifier

To remove the issue:

> "Error: You must change the bundle identifier in `tauri.conf.json > tauri > bundle > identifier`. The default value `com.tauri.dev` is not allowed as it must be unique across applications."

Edit file `src-tauri/tauri.conf.json`:

```json
// src-tauri/tauri.conf.json
{
  ...
  "tauri": {
    ...
    "bundle": {
      ...
-      "identifier": "com.tauri.dev",
+      "identifier": "com.iva2k.total-app",
      ...
```

#### Fix Tauri Issues

TODO: (soon):

```bash
pnpm tauri:dev
Warn Invalid target triple: x86_64-pc-windows-msvc
```

### Set Svelte SPA mode

For using Tauri and Capacitor (standalone app) - SvelteKit should be set to SPA mode and explicitly opt out of SvelteKit's assumption needing a server.

SPA mode is set by using adapter-static and setting `fallback` option, see <https://github.com/sveltejs/kit/tree/master/packages/adapter-static#spa-mode>.

There are errors in many online sources that give wrong information about `prerender` and `ssr` for SPA mode (including SvelteKit's own documentation).

Note: Tauri and Capacitor -based app could still use a server if needed, but they cannot rely on SvelteKit server-side endpoints.

For deploying web apps, we can add and setup necessary adapters as needed (see below).

```bash
pnpm i -D @sveltejs/adapter-static
```

SvelteKit dynamic routes don't work with adapter-static, unless a fallback is set.

```js
// svelte.config.js
- import adapter from '@sveltejs/adapter-auto';
+ import adapter from '@sveltejs/adapter-static';
...
export default {
  kit: {
    ...
+    adapter: adapter({
+      // default options are shown:
+      // pages: 'build',
+      // assets: 'build',
+      // fallback: null,
+      // precompress: false
+      fallback: 'index.html'
+    }),
+    // prerender: { entries: [] },
  }
};
```

Create `src/routes/+layout.ts` to set `prerender` and `ssr`:

```js
// src/routes/+layout.ts

// Let SvelteKit decide to prerender for each page by default:
export const prerender = true;
// As of @sveltejs/kit 1.0.0-next.563, pages with actions (e.g. sub-routes) throw error in `vite build`.
// Each such route should set prerender = false if needed in `src/routes/**/+page.ts`.

// Setting ssr = false (which is recommended for SPA in docs) breaks all server-side routes
// (generated pages have no content, therefore SPA does not load).
// We let SvelteKit render all routes on server, so deep links will still work:
export const ssr = true;
```

Adjust all `src/routes/**+page.ts` files - set prerender = false for pages with action (i.e. having a sub-route), in SvelteKit demo app it is /sverdle:

```js
// src/routes/sverdle/+page.ts

// This page has action (sub-route), so we need to explicitly disable prerender here;
export const prerender = false;
```

### Deploy on Netlify and Vercel

Though it is recommended to use adapter-auto to choose between adapter-netlify and adapter-vercel, it does not fall back to adapter-static, which we need. So we will do it ourselves.

```bash
pnpm i -D @sveltejs/adapter-netlify @sveltejs/adapter-vercel
```

Load adapters in svelte.config.js:

```js
+ import netlify from '@sveltejs/adapter-netlify';
+ import vercel from '@sveltejs/adapter-vercel';
...
const config = {
  ...
  kit: {
    adapter:
+      process.env.VERCEL ? vercel() :
+      process.env.NETLIFY ? netlify() :
      adapter({
        ...
```

See netlify.toml and vercel.json files for other deploy settings.

Add '.netlify' and '.vercel' to .gitignore, .eslintignore, .prettierignore (see sources).

### Rework Header into Header + PureHeader

Non-pure Header loads $page from $app/store, and it makes it hard to use in Histoire/Storybook - it will need mocking of $app/stores which is a lot of work without benefits. Instead we will make PureHeader.

In "src/lib/components/header" copy Header.svelte to PureHeader.svelte, remove `import { page } from '$app/stores';` and replace all usages of $page.pathname with a component parameter `pathname` in PureHeader. PureHeader will be usable in Histoire/Storybook below.

Rework Header.svelte to use PureHeader and pass it the $page.pathname (see sources).

### Rework PureHeader Corners

Add classes "corner-left" and "corner-right" to left and right corners and split their styling, adding "--corner-left-width" and "--corner-right-width" variables, so their sizes can be changed as needed.

Add `<slot />` to the right corner of PureHeader, and move github logo to be slotted into Header>PureHeader in "+layout.svelte".

For styling to apply into the slot elements, add `:global()` clauses to some of styles on PureHeader.

(See sources).

### Rework PureHeader to use Site Pages List

Add `siteLinks` (a hierarchical list of Site Pages for various sections) to `$lib/config/websiteFnc.js` file, use it in PureHeader.svelte and in `src/routes/(demo)/+layout.svelte`.

### Add DarkMode Component

See sources - "src/components/darkmode/\*" and edits to "src/routes/+layout.svelte".

Note: DarkMode toggles 'color-scheme' property on \<html\> tag between 'light' and 'dark'/.

Add dark mode styles to "/src/routes/styles.css" (see source).

### Add Github and Svelte icons to Footer links

See `src/routes/+layout.svelte` source file.

### Add Prettier & ESLint Rules, Stylelint, Postcss and Autoprefixer

ESLint and Prettier is already part of Svelte Kit installation, so some of the packages below are already present, we will add some useful configuration to them.

#### Additional ESLint rules

Edit `.eslintrc.cjs` file:

```js
// .eslintrc.cjs
module.exports = {
  ...
  parserOptions: {
     project: ['./tsconfig.json', './tsconfig.lint.json'],
     tsconfigRootDir: './',
     sourceType: 'module',
     ecmaVersion: 2020,
+    extraFileExtensions: ['.svelte']
  },
  ...
+  rules: {
+    'import/no-mutable-exports': 'off'
+  }
};
```

#### Postcss, Autoprefixer

Autoprefixer is a PostCSS plugin to parse CSS and add vendor prefixes to CSS rules using values from [Can I Use](https://caniuse.com/). It is recommended by Google and used in Twitter and Alibaba.

```bash
pnpm install -D postcss postcss-cli postcss-import postcss-nesting postcss-html autoprefixer
```

Add file `postcss.config.cjs` with the following contents:

```js
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: [
    require('postcss-import'), // Process @import
    require('postcss-nesting'), // For CSS Nesting Specification https://www.w3.org/TR/css-nesting-1/
    require('autoprefixer')
    //  require('postcss-nested'), // For sass syntax nesting
  ]
};

module.exports = config;
```

Enable postcss & scss in svelte.config.js:

```js
import preprocess from 'svelte-preprocess';
const config = {
  preprocess: preprocess({
+    postcss: true,
+    scss: { includePaths: ['src', 'node_modules'] }
  }),
  ...
```

Change all `<style>` tags in `*.svelte` files to `<style lang="scss">` to use `sass` preprocessor (it handles both `sass` and `scss` formats).

Note: Using `<style lang="scss">` will pass the styles through `sass` preprocessor, which will be BEFORE `postcss`. If you plan to use `postcss` plugins for special syntax extensions (like TailwindCSS), do not use `<style lang="scss">`, as `sass` preprocessor will not understand those special syntax extensions.

#### Prettier

```bash
pnpm install -D prettier
```

#### Stylelint

```bash
pnpm install -D stylelint @double-great/stylelint-a11y stylelint-config-standard stylelint-config-recommended stylelint-config-html
```

Note: stylelint-a11y original creator / maintainer is AWOL, using an updated and maintained fork `@double-great/stylelint-a11y` that is compatible with stylelint v16. Another fork `@double-great/stylelint-a11y` is also maintained, but does not look like wt will be updated to stylelint v16.

Add file `.stylelintrc.json` (see source file in repo):

#### VSCode formatOnSave

VSCode can format all documents on save, and it should match Stylelint & Prettier.

Some issues can be with VSCode user settings that are not visible right away. If saving any files and then running `pnpm format` shows those files as changed in the process, check "editor.defaultFormatter" for that file type.

For example, VSCode would re-format .json files differently. It turns out VSCode was using different JSON formatter set in user settings, and ignored top-level "editor.defaultFormatter". To fix that, add `jsonc` and `json` settings to `.vscode/settings.json` file as shown below.

Add the following to `.vscode/settings.json` file (if not already there):

```json
// .vscode/settings.json
{
+  "editor.defaultFormatter": "esbenp.prettier-vscode",
+  "editor.formatOnSave": true,
+  "editor.formatOnPaste": true,
+  "editor.formatOnType": false,
+  "editor.codeActionsOnSave": {
+    "source.fixAll.eslint": true,
+    "source.fixAll.html": true
+  },
+  "eslint.validate": ["svelte"],
+  "editor.tokenColorCustomizations": {
+    "[Svelte]": {
+      "textMateRules": [
+        {
+          "settings": {
+            "foreground": "#569CD6" // any color you like
+          },
+          "scope": "support.class.component.svelte" // scope name you want to adjust highlighting for
+        }
+      ]
+    }
+  },
+  "svelte.enable-ts-plugin": true,
+  "javascript.format.enable": false,
+  "files.insertFinalNewline": true,
+  "files.trimFinalNewlines": false,
+  "[json]": {
+    "editor.defaultFormatter": "esbenp.prettier-vscode"
+  },
+  "[jsonc]": {
+    "editor.defaultFormatter": "esbenp.prettier-vscode"
+  },
+  "[svelte]": {
+    "editor.defaultFormatter": "svelte.svelte-vscode"
+  },
+  "[html]": {
+    "editor.defaultFormatter": "vscode.html-language-features"
+  }
}
```

See `package.json` file for "scripts.format" change and new "scripts.lint:css".

### Add Histoire

See `histoire` branch.

### Add Storybook

See `storybook` branch.

### Add Capacitor

Capacitor has 2 largely independent parts that we could use:

1. Plugins to use native functionality on various platforms
2. Build apps for mobile platforms - iOS, Android

Use of Capacitor \#1 native functionality (like Camera, GPS, etc.) can be very handy for some apps.

TODO: (now) Check Tauri iOS/Android build support (it's in development). Meanwhile we can use Capacitor \#2 to bridge that gap. Once Tauri implements iOS/Android build support, we can revisit \#2, and keep Capacitor just for \#1.

We will target Geolocation example as a very usefull feature for \#1.

#### Setup

The following setup is based on `@sveltejs/adapter-static` which puts output to 'build' folder by default (beware that other adapters place output files into different location).

First, install pre-requisites per <https://capacitorjs.com/docs/getting-started/environment-setup>.

Then, install VSCode extension:

```bash
code --install-extension ionic.ionic
```

Add Capacitor to the project:

```bash
pnpm install @capacitor/core
pnpm install -D @capacitor/cli
# use npx vs. pnpx with cap as pnpx won't run cap (or call cap directly, without npx):
npx cap init total-app com.iva2k.totalapp --web-dir=build
```

Add few scripts for convenince:

```json
// package.json
{
  ...
  "scripts": {
     ...
+    "android:open": "cap open android",
+    "android:dev": "cap run android",
```

Add "capacitor.config.ts" to `tsconfig.lint.json` file.

##### Add Android platform

```bash
pnpm install @capacitor/android
npx cap add android
```

Add `cap sync android` to the "build" script in `package.json`.

Add "/android" to `.eslintignore`, `.prettierignore`, `.stylelintrc.json` and "excludes" section of `tsconfig.json` files.

##### Add iOS platform

```bash
pnpm install @capacitor/ios
npx cap add ios
```

Add `cap sync ios` to the "build" script in `package.json`.

Add "/ios" to `.eslintignore`, `.prettierignore`, `.stylelintrc.json` and "excludes" section of `tsconfig.json` files.

Now we can use Capacitor plugins for native functionality.

#### Add Geolocation

For a quick example, add Geolocation:

```bash
pnpm install @capacitor/geolocation
npx cap sync
```

Create `src/routes/geolocation/+page.svelte` (see source file in repo)

Add the page to the `siteLinks` pages array in `$lib/config/websiteFnc.js`:

```js
  ...
  const siteLinks = [
    { title: 'Demo App',
      ...
      items: [
        ...
+       { href: '/geolocation', title: 'Geolocation', displayInHeader: true, dispayInSidebar: true },
```

For Android, add permissions to "android/app/src/main/AndroidManifest.xml" file:

```xml
<manifest ...>
  ...
+  <!-- Geolocation API -->
+  <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
+  <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
+  <uses-feature android:name="android.hardware.location.gps" />
</manifest>
```

For iOS, add usage description to "ios/App/App/Info.plist" file:

```xml
<dict>
+  <key>NSLocationAlwaysUsageDescription</key>
+  <string>To be able to use location services when app is in the background</string>
+  <key>NSLocationWhenInUseUsageDescription</key>
+  <string>To be able to use location services when app is running</string>
</dict>
```

#### Add QR Code Scanner

For the QR Code scanner feature, we could use [@capacitor-community/barcode-scanner](https://github.com/capacitor-community/barcode-scanner) plugin, but web platform is not yet supported [#31](https://github.com/capacitor-community/barcode-scanner/issues/31).

Web browsers have good support for the camera, and there are few QR scanner plugins with web platform support:

- see <https://github.com/xulihang/capacitor-plugin-dynamsoft-barcode-reader/tree/main/example>
- see <https://www.npmjs.com/package/qr-scanner>
- see <https://github.com/zxing-js/library>

We will use <https://www.npmjs.com/package/qr-scanner> and create a multi-platform QR Code Scanner. Note that it does not support formats other than QR (see [issue#63](https://github.com/nimiq/qr-scanner/issues/63#issuecomment-1029940019)), but it is a solid performer and feature-rich.

If we used a capacitor / native plugin, then the Scanner View will be rendered behind the WebView, and we have to call `hideBackground()` to make the WebView and the \<html\> element transparent. Every other element that needs transparency, we will have to handle ourselves.

The elements are made transparent by adding `background: 'transparent';` in the \<style\> section.

```bash
pnpm install qr-scanner
```

Create `src/routes/qrscanner/+page.svelte` (see source file in repo).

Add the page to the `siteLinks` pages array in `$lib/config/websiteFnc.js`:

```js
  ...
  const siteLinks = [
    { title: 'Demo App',
      ...
      items: [
        ...
+       { path: '/qrscanner', title: 'QR Scanner', displayInHeader: true, dispayInSidebar: true },
  ];
```

For Android, add permissions to "android/app/src/main/AndroidManifest.xml" file:

```xml
<manifest
  xmlns:android="http://schemas.android.com/apk/res/android"
+  xmlns:tools="http://schemas.android.com/tools"
  package="com.example">

  <application
    ...
+    android:hardwareAccelerated="true"
  >
  </application>
  ...
+  <!-- QR Scanner -->
+  <uses-permission android:name="android.permission.CAMERA" />
+  <uses-sdk tools:overrideLibrary="com.google.zxing.client.android" />
</manifest>
```

For iOS, add usage description to "ios/App/App/Info.plist" file:

```xml
<dict>
+  <key>NSCameraUsageDescription</key>
+  <string>To be able to scan barcodes</string>
</dict>
```

#### Using PWA Elements

Some Capacitor plugins (such as Camera, Toast) need custom UI elements (even though @capacitor-community/barcode-scanner seems to be working just fine without it).

In preparation to use various Capacitor plugins, we add @ionic/pwa-elements to the project:

```bash
pnpm install @ionic/pwa-elements
```

A typical installation involves importing the package and registering the elements, or adding a script tag to the \<head\> of the index.html for the app.

There is an issue with TypeScript types, so we use `src/lib/utils/ionicUtils.ts` that avoids this issue.

```js
// src/routes/+layout.svelte
<script lang="ts">
  ...
+  import { onMount } from 'svelte';
+  import { loadIonicPWAElements } from '$lib/utils/ionicUtils.ts';
+  onMount(async () => {
+    await loadIonicPWAElements(window);
+  });
  ...
```

Note: `svelte-check` throws error for no type definition in `import loader ...`. See `src/lib/utils/ionicUtils.ts` that shuts this error up.

#### Interesting Capacitor Community Plugins

- @capacitor-community/bluetooth-le
- @capacitor-community/camera-preview
- @capacitor-community/keep-awake

#### Fix Issues With Capacitor

None to fix.

### Lighthouse metrics

Run Lighthouse and other web tests at <https://www.webpagetest.org>

TODO: (now) Improve Lighthouse: Content is not sized correctly for the viewport The viewport size of 541px does not match the window size of 360px.
If the width of your app's content doesn't match the width of the viewport, your app might not be optimized for mobile screens.
<https://developer.chrome.com/docs/lighthouse/pwa/content-width/?utm_source=lighthouse&utm_medium=wpt>

## References

- Svelte components: <https://www.shadcn-svelte.com/docs>

## Add UI : Tailwind CSS

Tailwind CSS is a utility-first CSS framework packed with classes like flex, pt-4, text-center and rotate-90 that can be composed to build any design, directly in your markup.

It is a terrible idea for production websites and accessibility (see Jason Knight's [Tailwind: The New King](https://medium.com/codex/tailwind-the-new-king-6a9908097da8)), but developers love it for quick results. There are a number of UI frameworks on top of Tailwind CSS. For those that require it, we will add Tailwind CSS, and cross fingers hoping that it will only be used for development.

See <https://tailwindcss.com/docs/guides/sveltekit>

```bash
pnpm install -D tailwindcss postcss autoprefixer prettier-plugin-tailwindcss
pnpx tailwindcss init tailwind.config.cjs -p
```

Rename ".prettierrc" to "prettier.config.сjs" and modify contents to employ `module.exports = {...};` syntax. Then add `require('prettier-plugin-tailwindcss')` to `plugins: [...]` (see source in repo).

Add "tailwindcss: {}," to `plugins` in `postcss.config.cjs` (see source in repo).

Add tailwind to src/routes/styles.css (see source in repo).

For dark mode to work in tailwind, add htmlDarkClass="dark" property to DarkMode component in `src/routes/+layout.svelte`, so component `src/lib/components/darkmode/DarkMode.svelte` will set class "dark" on `<body>` tag (see source in repo).

## Add UI : Konsta

[Konsta](https://konstaui.com/svelte)

First, install required Tailwind CSS (see [Add UI : Tailwind CSS](#add-ui--tailwind-css)). Then, install Konsta:

```bash
pnpm i konsta @fontsource/roboto
```

Modify `tailwind.config.cjs` file to use konsta (see source in repo).

Add example page `src/routes/konsta/+page.svelte` and add route to `siteLinks` in `src/lib/config/websiteFnc.js` (see sources in repo).

For dark mode to work in Konsta components, add code into `src/lib/components/darkmode/DarkMode.svelte` that sets class "dark" on `<body>` tag (see source in repo).

### Issue in `pnpm check`

```bash
Error: Argument of type 'typeof App' is not assignable to parameter of type 'ConstructorOfATypedSvelteComponent'.
(and many other like that, for all Konsta components)
```

See <https://github.com/konstaui/konsta/issues/151>

### Issue in `pnpm test:unit`

See <https://github.com/iva2k/total-app/issues/1>

`vitest run` fails on first run and shows an error:

```bash
⎯⎯ Unhandled Rejection ⎯⎯
Error: Failed to resolve entry for package "konsta". The package may have incorrect main/module/exports specified in its package.json: Missing "." specifier in "konsta" package
 ❯ packageEntryFailure node_modules/.pnpm/vite@5.0.10_@types+node@20.10.6_sass@1.69.7/node_modules/vite/dist/node/chunks/dep-R0I0XnyH.js:29450:17
 ❯ resolvePackageEntry node_modules/.pnpm/vite@5.0.10_@types+node@20.10.6_sass@1.69.7/node_modules/vite/dist/node/chunks/dep-R0I0XnyH.js:29445:9
 ❯ tryNodeResolve node_modules/.pnpm/vite@5.0.10_@types+node@20.10.6_sass@1.69.7/node_modules/vite/dist/node/chunks/dep-R0I0XnyH.js:29217:20
 ❯ Context.resolveId node_modules/.pnpm/vite@5.0.10_@types+node@20.10.6_sass@1.69.7/node_modules/vite/dist/node/chunks/dep-R0I0XnyH.js:28985:28
 ❯ Object.resolveId node_modules/.pnpm/vite@5.0.10_@types+node@20.10.6_sass@1.69.7/node_modules/vite/dist/node/chunks/dep-R0I0XnyH.js:63629:64
 ❯ async file:/C:/dev/svelte/total-app/node_modules/.pnpm/vite@5.0.10_@types+node@20.10.6_sass@1.69.7/node_modules/vite/dist/node/chunks/dep-R0I0XnyH.js:67637:21
 ❯ async file:/C:/dev/svelte/total-app/node_modules/.pnpm/vite@5.0.10_@types+node@20.10.6_sass@1.69.7/node_modules/vite/dist/node/chunks/dep-R0I0XnyH.js:64286:20
 ❯ addManuallyIncludedOptimizeDeps node_modules/.pnpm/vite@5.0.10_@types+node@20.10.6_sass@1.69.7/node_modules/vite/dist/node/chunks/dep-R0I0XnyH.js:65479:31
 ❯ optimizeServerSsrDeps node_modules/.pnpm/vite@5.0.10_@types+node@20.10.6_sass@1.69.7/node_modules/vite/dist/node/chunks/dep-R0I0XnyH.js:65070:5
 ❯ createDevSsrDepsOptimizer node_modules/.pnpm/vite@5.0.10_@types+node@20.10.6_sass@1.69.7/node_modules/vite/dist/node/chunks/dep-R0I0XnyH.js:64988:22

⎯⎯Serialized Error: { code: 'ERR_RESOLVE_PACKAGE_ENTRY_FAIL' }
```

On second run, `vitest run` does not show any errors and hangs up. Deleting "node_modules/.vitest" resets the error:

```bash
rm -rf node_modules/.vitest
```

- See (closed, no solution) <https://github.com/vitest-dev/vitest/issues/3913>
- See (closed, no solution) <https://github.com/sveltejs/vite-plugin-svelte/issues/710>
- See (closed, no solution) <https://github.com/vitejs/vite/issues/1505>
- See <https://github.com/vitejs/vite/issues/15868>

Workaround monkey-patch: `patches/konsta@3.1.2.patch`, adds "." entry to konsta/package.json.
