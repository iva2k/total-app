# Creating: Total App | Blank SvelteKit App

This file describes how this app was created.

It is not a tutorial per se, and uses a dense step-by-step language without too much explanation and expects the reader to dive deeper on their own. Making it into a tutorial will yield a thick book, which is not the goal here.

## Technology Stack

Built with:

- [Svelte](https://svelte.dev) - Truly reactive Javascript/TypeScript App UI framework
- [Svelte Kit](https://kit.svelte.dev) - Javascript/TypeScript App build system
- [Prettier](https://prettier.io/) - Opinionated Code Formatter
- [ESLint](https://eslint.org) - Pluggable JavaScript linter
- [Playwright](https://playwright.dev) - Fast and reliable end-to-end testing for modern web apps
- [Vitest](https://vitest.dev) - A blazing fast unit test framework powered by Vite

## Software Mantra

### DRY

DRY - Don't-Repeat-Yourself. Knowledge should always reside in a single place. If code of more than 3 steps is repeated twice, maybe... if thrice - for sure refactor it so it resides in a single place and used from there. DRY is avoiding knowledge duplication (and splintering) and reducing the repetition of code patterns in favor of abstractions and avoiding redundancy. It also can be explained as SST - Single-SourceOf-Truth principle - "every piece of knowledge must have a single, unambiguous, authoritative representation within a system". Code can still be duplicated - it is sometimes a judgement call for balancing with other principles.

### KISS

KISS - Keep-It-Simple,Stupid. Keep the code simple and clear, making it easy to understand. If code needs comments, think hard - the code can probably be simplified by renaming, restructuring, breaking up.

## Prerequisites

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

```bash
pnpm i -D @vitejs/plugin-basic-ssl
```

Add plugin to vite.config.ts (see source).

Run the server with a self-signed cert:

```bash
pnpm run dev:https --host
```

### Add Tooling

```bash
pnpm install -D cross-env glob rimraf minimist @types/minimist sass shx vite-plugin-static-copy cpy @types/node @types/glob
pnpm install -D ts-node tsx
```

Add assets copying to svelte.config.js (see source file).

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

TBD

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

### Organize template components into `src/lib/components`

Move `src/routes/Counter.svelte` to `src/lib/components/counter/` and change paths to match in `src/routes/+page.svelte` file where it is used.

Move `src/routes/Header.svelte` to `src/lib/components/header/` and change paths to match in `src/routes/+layout.svelte` file where it is used.

(See sources).

### Website Config Files

Config files help organize site-wide settings. SvelteKit and Vite use .env files underneath, and we will build a helper file `$lib/config/website.js` to collect the relevant settings into one abstraction, similar to <https://rodneylab.com/sveltekit-blog-starter/#src-lib>.

Adding such a config would have been an easy task, if not for the Service Worker in the following section, which needs access to the config file from within `vite.config.js` which is loaded during build time, before vite builder and SvelteKit load `.env` files into the environment, because it first determines the settings that choose which environment files to load. Luckily, there is a mechanism in Vite to access the .env settings from `vite.config.js`.

To achieve that, we will convert static config assignments to an async function in `vite.config.js`, so it could use [`loadEnv()`](https://vitejs.dev/config/#environment-variables) and [`defineConfig( async () /> {...})`](https://vitejs.dev/config/#async-config) (see the source of `vite.config.js`) and then make an async wrapper `$lib/src/websiteAsync.js` over sync function in `$lib/src/websiteFnc.js`. The async is needed for await of the import of `$lib/src/websiteFnc.js` inside the function. We will use the async wrapper in the next section for the Service Worker.

This solution creates a small overhead for using `$lib/config/websiteFnc.js`, but we can wrap it in `$lib/config/website.js` which can be simply imported into all other files and desructured to get the needed setting variables:

```js
// Use `$lib/config/website.js`
import website from '$lib/config/website.js';
const { author, ... } = website;
```

See source file `src/routes/about/+page.svelte` that uses `siteTitle` from the config.

This setup involves 4 files: `.env` (it is listed in .gitignore and is never committed to the repo, see `.env.EXAMPLE`, make a copy and modify it for your site), and 3 files in `$lib/config/`: `website.js`, `websiteFnc.js`, `websiteAsync.js`.

The source of truth / relevant variables are spread between 2 files: `.env` and `$lib/config/websiteFnc.js`. The `.env` file should never be committed to repository since it is intended to contain website secrets. It is more involved to reproduce that file on the server / hosting provider. Most variables for the website are public anyway, and they should be defined in `$lib/config/websiteFnc.js` and commited to the repository. It will limit how many variables will need to be configured on hosting provider, since all variables set in `.env` will need to be configured securely in provider UI.

One more hurdle to overcome is fixing the ESLint rule 'import/no-unresolved' for `$env/static/public` used in `$lib/config/website.js`. But for now the ESLint is shut down with `// eslint-disable-next-line import/no-unresolved`.

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

See package addressing the issue in the most simple to use way: `@svelte-kits/store` <https://github.com/svelte-kits/store>

```bash
pnpm install -D @svelte-kits/store
```

Then just replace `svelte/store` with `@svelte-kits/store`, for all store uses (though only `writable` store is affected by SSR).

Also see <https://dev.to/jdgamble555/the-correct-way-to-use-stores-in-sveltekit-3h6i>.

For upcoming v5.0 Svelte runes, see <https://dev.to/jdgamble555/create-the-perfect-sharable-rune-in-svelte-ij8>.

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
# What is your frontend build command? - pnpm run build
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

### Add DarkMode Component

See sources - "src/components/darkmode/\*" and edits to "src/routes/+layout.svelte".

Note: DarkMode toggles 'color-scheme' property on \<html\> tag between 'light' and 'dark'/. However, there's no effect visible, as there's no support for dark mode in current "/src/routes/style.css".

There is an unresolved "ParseError" issue <https://github.com/sveltejs/eslint-plugin-svelte3/issues/137> in eslint-plugin-svelte3 which is wrongly closed, causing Lint to fail on ColorSchemeManager class in DarkMode.svelte.

See "patches/eslint-plugin-svelte3@4.0.0.patch" for a hot-fix.

See open issue <https://github.com/sveltejs/kit/issues/8081>

### Add Github and Svelte icons to Footer links

See `src/routes/+layout.svelte` source file.
