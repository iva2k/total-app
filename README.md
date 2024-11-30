# Total App | Blank SvelteKit Starter App

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
            <td align=center>
<a href="https://github.com/iva2k/total-app/issues"><img src="https://img.shields.io/github/issues/iva2k/total-app.svg" alt="Github"></a>
            </td>
            <td align=center>
<a href="https://github.com/iva2k/total-app/pulls"><img src="https://img.shields.io/github/issues-pr/iva2k/total-app.svg" ="Github"></a>
            </td>
            <td align=center><a href="https://discord.gg/CnCM2EvSW8"><img src="https://discord.com/api/guilds/1264001379853406270/widget.png" alt="Discord Shield"></a></td>
        </tr>
        <tr>
            <td align=center><a href=https://www.chromatic.com/builds?appId=65a02a765c0010e653425b30>Chromatic</a></td>
            <td align=center><a href="https://total-app.netlify.app">App Demo</a></td>
            <td align=center><a href="https://total-app.vercel.app">App Demo</a></td>
            <td align=center colspan=2><a href="https://github.com/iva2k/total-app">Github
               <!-- <img src="https://img.shields.io/badge/GitHub--181717?style=for-the-badge&logo=github&logoColor=white" alt="Github"> -->
            </a></td>
            <td align=center><a href="https://discord.gg/CnCM2EvSW8">Discord</a></td>
        </tr>
    </tbody>
</table>
<!-- markdownlint-enable MD033 -->

<!-- ![Total App](static/logotype-hor.svg) -->

A cross-platform Desktop / Mobile / Web application starter.

**License:** MIT License

## Introduction

Total App is a versatile starter app designed to streamline the development process. Out of the box it provides a full technology stack to deploy from a single codebase to any device across all major platforms:

- iOS
- Android
- Windows
- MacOS
- Linux
- Web

## Key Features

- **SEO and Social Integration:** Optimized for search engines and social networks.
- **Flexible Rendering:** Supports SSR, SPA, and PWA (mix & match as needed) for various use cases.
- **Native Features:** Includes support for camera, GPS, and other native capabilities via Capacitor.
- **Great Developer Experience (DX):** Built with SvelteKit with linting, formatting, and comprehensive testing, isolated component development.
- **Ready for Deployment:** Configured for quick deployment on Netlify, Vercel, or building standalone apps for AppStore/PlayStore and more.

## Technology Stack

Built with:

- [Svelte](https://svelte.dev)
- [Svelte Kit](https://kit.svelte.dev)
- [Tauri](https://tauri.studio)
- [Capacitor](https://capacitorjs.com)
- [Prettier](https://prettier.io/)
- [ESLint](https://eslint.org)
- [Stylelint](https://stylelint.io/)
- [Postcss](https://postcss.org/)
- [Playwright](https://playwright.dev)
- [Vitest](https://vitest.dev)
- [Storybook](https://storybook.js.org) and [Histoire](https://histoire.dev/) | [(choose a branch)](#styling--ui-components)
- UI Components | [choose a branch](#styling--ui-components)

## Start TotalApp from Github

To try this app locally, clone it from Github, execute in your terminal (need `git` and `nodejs` installed):

```bash
git clone https://github.com/iva2k/total-app.git my-new-total-app
cd my-new-total-app
pnpm install
cp .env.EXAMPLE .env
pnpm run dev -- --open
```

## Start Your App

To start your app from `TotalApp` as a template, choose UI framework branch to use (after '#') and execute in your terminal:

```bash
MY_APP="my-app"  # Any name you like for the app (will be a folder name)
# Any UI branch you like to use, choose one:
UI_BRANCH="ui-agnostic"
UI_BRANCH="ui-bootstrap"
UI_BRANCH="ui-bulma"
# (see other UI framework branches below)

cd ~ && mkdir "$MY_APP" && cd "$MY_APP"
npx degit "iva2k/total-app#${UI_BRANCH}"

# Then you can make a new repo and push the folder to your Guthub account (google it to learn how)
```

### Or Fork the Repo on Github

Visit [Github](https://github.com/iva2k/total-app/fork) and follow instructions.

### Setup Configuration File

Copy provided `.env.EXAMPLE` to `.env` (may also create `.env.production` and `.env.dev` as needed) and modify it for your site.

`.env.*` files are listed in .gitignore to be never committed to the repo.

```bash
cp .env.EXAMPLE .env
```

When deploying your website to any provider (Netlify, Vercel), make sure to set all the variables listed in `.env.EXAMPLE` with the provider's UI to keep them secure. DO NOT COMMIT .env files to repo!

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

To deploy the app, you will need to install an [adapter](https://kit.svelte.dev/docs/adapters) for the target environment. Netlify and Vercel adapters are already installed and automatically selected when deploying to these providers.

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

This project has few of the top UI frameworks integrated in separate git branches.

Currently there are no plans to implement additional frameworks (either listed below or not). It is not too hard to add a new UI framework, as long as it supports Svelte 5 - just look at minimal changes in the existing framework branches.

Note that there are 2 branches for Isolated component development - Histoire and Storybook, which can be merged into UI branch of choice for your app.

<!-- markdownlint-disable MD033 -->
<!-- prettier-ignore -->
| Status | Git Branch | UI Framework | Dark Theme | Svelte 5 | Notes [Legend: ⬤ Yes / ⭘ No / ❌ Fail] |
|-|-|-|:-:|:-:|-|
| [![Vercel](https://total-app.vercel.app/api/getDeployment?w=svg&b=main)](https://total-app.vercel.app/api/getDeployment?w=url&b=main)                     | main                                      | (none) | ⬤ | ⬤ | |
| [![Vercel](https://total-app.vercel.app/api/getDeployment?w=svg&b=histoire)](https://total-app.vercel.app/api/getDeployment?w=url&b=histoire)             | [histoire](../../tree/histoire)           | (none) | ⬤ | ⭘ | Isolated component development. |
| [![Vercel](https://total-app.vercel.app/api/getDeployment?w=svg&b=storybook)](https://total-app.vercel.app/api/getDeployment?w=url&b=storybook)           | [storybook](../../tree/storybook)         | (none) | ⬤ | ⬤ | Isolated component development. |
| [![Vercel](https://total-app.vercel.app/api/getDeployment?w=svg&b=ui-agnostic)](https://total-app.vercel.app/api/getDeployment?w=url&b=ui-agnostic)       | [ui-agnostic](../../tree/ui-agnostic)     | [AgnosticUI](https://github.com/AgnosticUI/agnosticui) | ⬤ | ❌ | ❌ Build fails  |
| [![Vercel](https://total-app.vercel.app/api/getDeployment?w=svg&b=ui-bootstrap)](https://total-app.vercel.app/api/getDeployment?w=url&b=ui-bootstrap)     | [ui-bootstrap](../../tree/ui-bootstrap)   | [Bootstrap](https://github.com/twbs/bootstrap) | ⬤ | ⭘ | [Sveltestrap](https://github.com/sveltestrap/sveltestrap), Themes from [Bootswatch](https://github.com/thomaspark/bootswatch).<br>⭘ [[sveltestrap#79]](https://github.com/sveltestrap/sveltestrap/issues/79) |
| [![Vercel](https://total-app.vercel.app/api/getDeployment?w=svg&b=ui-bulma)](https://total-app.vercel.app/api/getDeployment?w=url&b=ui-bulma)             | [ui-bulma](../../tree/ui-bulma)           | [Bulma](https://bulma.io/)                     | ⬤ | ⬤ | |
| [![Vercel](https://total-app.vercel.app/api/getDeployment?w=svg&b=ui-carbon)](https://total-app.vercel.app/api/getDeployment?w=url&b=ui-carbon)           | [ui-carbon](../../tree/ui-carbon)         | [Carbon](https://carbon-components-svelte.onrender.com/) | ⬤ | ⬤ | |
| [![Vercel](https://total-app.vercel.app/api/getDeployment?w=svg&b=ui-framework7)](https://total-app.vercel.app/api/getDeployment?w=url&b=ui-framework7)   | [ui-framework7](../../tree/ui-framework7) | [Framework7](https://framework7.io/svelte/introduction.html) | ⭘ | ❌ | ❌ Build fails |
| [![Vercel](https://total-app.vercel.app/api/getDeployment?w=svg&b=ui-shoelace)](https://total-app.vercel.app/api/getDeployment?w=url&b=ui-shoelace)       | [ui-shoelace](../../tree/ui-shoelace)     | [Shoelace](https://shoelace.style/)            | ⬤ | ⬤ | |
| [![Vercel](https://total-app.vercel.app/api/getDeployment?w=svg&b=ui-svelteui)](https://total-app.vercel.app/api/getDeployment?w=url&b=ui-svelteui)       | [ui-svelteui](../../tree/ui-svelteui)     | [SvelteUI](https://www.svelteui.dev)           | ⬤ | ⭘ | ⭘ [[svelteuidev#491]](https://github.com/svelteuidev/svelteui/issues/491) |
| [![Vercel](https://total-app.vercel.app/api/getDeployment?w=svg&b=ui-tailwindcss)](https://total-app.vercel.app/api/getDeployment?w=url&b=ui-tailwindcss) | [ui-tailwindcss](../../tree/ui-tailwindcss) | [TailwindCSS](https://tailwindcss.com)       | ⬤ | ⬤ | May use components, e.g. [Flowbite](https://flowbite.com/docs/getting-started/introduction/) |
| [![Vercel](https://total-app.vercel.app/api/getDeployment?w=svg&b=ui-konsta)](https://total-app.vercel.app/api/getDeployment?w=url&b=ui-konsta)           | [ui-konsta](../../tree/ui-konsta)         | [Konsta](https://konstaui.com/svelte)          | ⬤ | ⬤\|⭘ | (Requires TailwindCSS)<br>⬤ `pnpm build/dev` \| ⭘ `pnpm check` |
| [![Vercel](https://total-app.vercel.app/api/getDeployment?w=svg&b=ui-svelteux)](https://total-app.vercel.app/api/getDeployment?w=url&b=ui-svelteux)       | [ui-svelteux](../../tree/ui-svelteux)     | [svelte-ux](https://svelte-ux.techniq.dev)     | ⬤ | ⬤ | (Requires TailwindCSS) |
| [![Vercel](https://total-app.vercel.app/api/getDeployment?w=svg&b=ui-flowbite)](https://total-app.vercel.app/api/getDeployment?w=url&b=ui-flowbite)       | [ui-flowbite](../../tree/ui-flowbite)     | [Flowbite-Svelte](https://flowbite-svelte.com) | ⬤ | ⬤ | (Requires TailwindCSS) |
| | | [Skeleton](https://github.com/skeletonlabs/skeleton)   |  | ⬤ | (Requires TailwindCSS)<br>⬤ Note [[skeleton#2640]](https://github.com/skeletonlabs/skeleton/discussions/2640) |
| | | [Smelte](https://smeltejs.com/)                        |  | ⭘ | (Requires TailwindCSS) Material + TailwindCSS |
| | | [Ionic](https://ionicframework.com)                    |  | ⭘ | See good [example](https://github.com/Tommertom/svelte-ionic-app). Note: No SSR! |
| | | [Chota](https://jenil.github.io/chota/)                |  | ⭘ | [SvelteChota](https://alexxnb.github.io/svelte-chota/why_chota) |
| | | [Tachyons](https://tachyons.io)                        |  | ⭘ | |
| | | [Svelte Material](https://sveltematerialui.com/)       |  | ⬤ | [`pnpm i -D @smui/\*\*@alpha`](https://github.com/hperrin/svelte-material-ui/tree/v8#readme) |
| | | [Svelte Flat UI](https://svelteui.js.org/#/)           |  | ⭘ | |
| | | [Attractions](https://github.com/illright/attractions) |  | ⭘ | |
| | | [Melt UI](https://melt-ui.com)                         |  | ⭘ | ⭘ [[melt-ui#1001]](https://github.com/melt-ui/melt-ui/issues/1001) |
| | | [Bits UI](https://bits-ui.com)                         |  | ⭘ | ⭘ [[bits-ui#287]](https://github.com/huntabyte/bits-ui/issues/287) |
| | | [shadcn-svelte](https://www.shadcn-svelte.com)         |  | ⭘ | ⭘ [[shadcn-svelte#1182]](https://github.com/huntabyte/shadcn-svelte/pull/1182) |

<!-- markdownlint-enable MD033 -->

## Conclusion

This repository was initiated using early preview releases of Svelte 5. As Svelte 5 is still in the release candidate stage, there are some incompatibilities and broken features in both Svelte 5 and various UI framework packages used here. Some upstream packages are also lagging in updates, and many UI frameworks are not yet fully compatible with Svelte 5.

If you are interested in a stable version with Svelte 3/4, please refer to the earlier [Svelte 3/4 version of this project](https://github.com/iva2k/svelte-blank-20221125) at commit [#64eb11a](https://github.com/iva2k/svelte-blank-20221125/tree/64eb11af86cc81931d21e3f7c8851c2094044574). This version includes fully functional UI frameworks.

As updates and fixes for Svelte 5 and the UI frameworks are released, they will be incorporated into this project.

See Q & A below and file issues and submit PRs on [Github](https://github.com/iva2k/total-app/issues)!

[![GitHub issues](https://img.shields.io/github/issues/iva2k/total-app.svg)](https://github.com/iva2k/total-app/issues)
[![GitHub issues](https://img.shields.io/github/issues-pr/iva2k/total-app.svg)](https://github.com/iva2k/total-app/pulls)
[![GitHub issues](https://img.shields.io/badge/GitHub-YourText-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/iva2k/total-app/pulls)

## Questions?

See [Q & A](./QANDA.md) for more or reach out on Discord:

[![Discord Banner](https://discord.com/api/guilds/1264001379853406270/widget.png?style=banner2)](https://discord.gg/CnCM2EvSW8)

## Enjoy! \\\_/

![Total App](static/icon-txr-512x512.png)
