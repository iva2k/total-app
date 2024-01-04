# Creating: Total App | Blank SvelteKit App

This file describes how this app was created.

It is not a tutorial per se, and uses a dense step-by-step language without too much explanation and expects the reader to dive deeper on their own. Making it into a tutorial will yield a thick book, which is not the goal here.

## Technology Stack

Built with:

- [Svelte](https://svelte.dev) - Truly reactive Javascript/TypeScript App UI framework
- [Svelte Kit](https://kit.svelte.dev) - Javascript/TypeScript App build system

## Software Mantra

### DRY

DRY - Don't-Repeat-Yourself. Knowledge should always reside in a single place. If code of more than 3 steps is repeated twice, maybe... if thrice - for sure refactor it so it resides in a single place and used from there. DRY is avoiding knowledge duplication (and splintering) and reducing the repetition of code patterns in favor of abstractions and avoiding redundancy. It also can be explained as SST - Single-SourceOf-Truth principle - "every piece of knowledge must have a single, unambiguous, authoritative representation within a system". Code can still be duplicated - it is sometimes a judgement call for balancing with other principles.

### KISS

KISS - Keep-It-Simple,Stupid. Keep the code simple and clear, making it easy to understand. If code needs comments, think hard - the code can probably be simplified by renaming, restructuring, breaking up.

## Prerequisites

Please follow the [Tauri Getting Started Guide](https://tauri.studio/en/docs/getting-started/intro#steps) to setup your system with the required Rust toolchain.

## create-svelte

Svelte scaffolding is set up by [`create-svelte`](https://github.com/sveltejs/kit/tree/master/packages/create-svelte).

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

> **Note:** You may use `yarn` or `npm`, but only a `pnpm` lockfile is included.

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
