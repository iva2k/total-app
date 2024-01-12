# Total App | Blank SvelteKit App

<!-- markdownlint-disable MD033 -->
<!-- prettier-ignore -->
<table>
    <tbody>
        <tr>
            <td rowspan=2 style="vertical-align:bottom;">
                <img src="static/logotype-hor.svg" alt="Total App" />
            </td>
            <td align=center>Storybook</td>
            <td align=center><a href="https://app.netlify.com/sites/total-app/deploys"><img src="https://api.netlify.com/api/v1/badges/1efdc5eb-be6d-422f-8131-dce6f7b58068/deploy-status" alt="Netlify shield"/></a></td>
            <td align=center><a href="https://vercel.com/iva2k/total-app"><img src="https://shields.io/github/deployments/iva2k/total-app/production?style=flat&label=vercel&logo=vercel" alt="Vercel shield"/></a></td>
        </tr>
        <tr>
            <td align=center><a href=https://www.chromatic.com/builds?appId=65a02a765c0010e653425b30>Chromatic</a></td>
            <td align=center><a href="https://total-app.netlify.app">App Demo</a></td>
            <td align=center><a href="https://total-app.vercel.app">App Demo</a></td>
        </tr>
    </tbody>
</table>
<!-- markdownlint-enable MD033 -->

<!-- ![Total App](static/logotype-hor.svg) -->

A cross-platform Desktop / Mobile / Web application starter.

License: MIT License

This app has very little functionality. Huh? Why? - It is a starter app and it demonstrates the technology stack, main point is it can be deployed from a single codebase to any platform. Yes, ANY platform:

- iOS
- Android
- Windows
- MacOS
- Linux
- Web

Is it Native? - No. It uses JavaScript / TypeScript and modern tooling to create blazingly fast websites, web apps, and allow installation as apps on any of the major platforms.

Out of the box features:

- SEO and integration with Social Networks
- SSR / Server-Side Rendering
- Offline mode / can work without Internet connection (after the user visits the app when connected, the app's service worker caches all files for offline operation).
- Support native features (camera, GPS, etc.) - Capacitor included. Check Geolocation and QR Scanner tabs.
- Support deep links, in online and in offline modes.
- Codebase support features - Linting, Formatting, Unit Testing, End-to-End testing.
- Prepared for Isolated Component Development (Storybook).
- Instrumented for quick deployment - Netlify, Vercel, NGINX, etc.

<!-- prettier-ignore -- >
|Storybook| [![Netlify Status](https://api.netlify.com/api/v1/badges/1efdc5eb-be6d-422f-8131-dce6f7b58068/deploy-status)](https://app.netlify.com/sites/total-app/deploys) |  [![Vercel Status](https://shields.io/github/deployments/iva2k/total-app/production?style=flat&label=vercel&logo=vercel)](https://vercel.com/iva2k/total-app) |
|:-:|:-:|:-:|
|[Chromatic](https://www.chromatic.com/builds?appId=65a02a765c0010e653425b30)| [App Demo](https://total-app.netlify.app) | [App Demo](https://total-app.vercel.app)  |
<!-- -->

## Technology Stack

Built with:

- [Svelte](https://svelte.dev) - Truly reactive Javascript/TypeScript App UI framework
- [Svelte Kit](https://kit.svelte.dev) - Javascript/TypeScript App build system
- [Tauri](https://tauri.studio) - Desktop Application framework
- [Capacitor](https://capacitorjs.com) - Building crossplatform apps
- [Storybook](https://storybook.js.org) - Tool for building UI components and pages in isolation
- [Prettier](https://prettier.io/) - Opinionated Code Formatter
- [ESLint](https://eslint.org) - Pluggable JavaScript linter
- [Stylelint](https://stylelint.io/) - A mighty, modern CSS linter
- [Postcss](https://postcss.org/) - Transforming styles with JS plugins
- [Playwright](https://playwright.dev) - Fast and reliable end-to-end testing for modern web apps
- [Vitest](https://vitest.dev) - A blazing fast unit test framework powered by Vite

Continuous Integrations and Deployments:

- [Chromatic](https://www.chromatic.com) - Storybook Github CI
- [Netlify](https://total-app.netlify.app) - App Demo
- [Vercel](https://total-app.vercel.app) - App Demo

Enhancements not found in the foundational packages and templates:

- HTTPS support in development
- Vitest coverage
- Playwright reports
- ESLint imports
- SSR-safe Svelte stores
- Consolidated website configuration
- Organized Favicon resolutions with notification badges support

## Install

### Quick Start

To start with this app as a template:

```bash
git clone https://github.com/iva2k/total-app.git my-new-total-app
cd my-new-total-app
pnpm install
cp .env.EXAMPLE .env
pnpm run dev -- --open
```

... or do the steps in [Start Your App](#start-your-app)

### Start Your App

To start your app from this project as a template:

```bash
mkdir my-app && cd my-app
npx degit iva2k/total-app
```

### Or Clone the Repo

```bash
git clone https://github.com/iva2k/total-app.git
cd total-app
```

### Setup Configuration File

Copy provided `.env.EXAMPLE` to `.env` (may also create `.env.production` and `.env.dev` as needed) and modify it for your site.

`.env.*` files are listed in .gitignore to be never committed to the repo.

```bash
cp .env.EXAMPLE .env
```

When deploying your website to any provider (Netlify, Vercel), make sure to set all the variables listed in `.env.EXAMPLE` with the provider's UI to keep them secure.

## Developing Locally

Please follow the [Tauri Getting Started Guide](https://tauri.app/v1/guides/getting-started/prerequisites) to setup your system with the required [Rust](https://www.rust-lang.org/) toolchain.

This application is built like a typical Node.js application. However, instead of `npm`, [`pnpm`](https://pnpm.io/) is used for package management.

> **Note:** You may use `yarn` or `npm`, but only a `pnpm` lockfile is included, and some scripts call `pnpm` directly and need to be changed to your package manager.

```bash
pnpm install # or npm install
```

### Start development server

```bash
pnpm run dev

# or start the development server and open the app in a new browser tab
pnpm run dev -- --open
```

## Building

To create a production version of the web app (to be hosted on a server):

```bash
pnpm run build
```

To preview the production build of the web app, execute `pnpm run preview`.

To deploy the app, need to install an [adapter](https://kit.svelte.dev/docs/adapters) for the target environment. Netlify and Vercel adapters are already installed and automatically selected when deploying to these providers.

## Desktop App

To run desktop app (using Tauri)

```bash
pnpm run tauri:dev
# The app window will open
```

To create desktop executable:

```bash
pnpm run tauri:build
```

## Mobile App

To update mobile app project (Android):

```bash
pnpm run build
cap open android
```

iOS platform is installed but not fully scripted in this repo, custom scripts can easily be added. See [CREATING](./CREATING.md)

## Customizing

Check file `src/lib/config/websiteFnc.js` for setting all information about the App / Website.

Many variables are also set in `.env` file.

## How This App Was Created

See [CREATING](./CREATING.md) for step-by-step instructions.

## Styling / UI Components

This template has DarkMode component in the header to allow switching the color scheme between 'light' and 'dark'. It changes the theme using `<html color-scheme>` (see src/routes/styles.css).

There are many UI frameworks that work with Svelte / SvelteKit, and choice can be daunting.

<https://bestofsvelte.com/t/ui-library>

<https://sveltesociety.dev/components/>

This project has few of the top UI frameworks integrated in separate git branches:

<!-- prettier-ignore -->
| Git Branch | UI Framework | Dark Theme Switch | Notes |
|-|-|:-:|-|
| main                                      | (none) | Y | |

## Enjoy! \\\_/

![Total App](static/icon-txr-512x512.png)
