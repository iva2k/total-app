# Q & A - Musings on the "Why?"

## Q: This app has very little functionality. Huh? Why?

A: It is a starter app to quickly get all infrastructure for new apps and start coding and designing pages and user interactions. It brings together cohesive and full technology stack which is mostly invisible, and it is ready to be deployed from a single codebase to any platform. Yes, ANY platform:

- iOS
- Android
- Windows
- MacOS
- Linux
- Web

## Q: Is it Native?

A: It can be relased into Apple AppStore / Google PlayStore / Microsoft Store as any native app, but it is not native - at the core it uses JavaScript / TypeScript (and some Rust) and modern tooling to create blazingly fast websites, web apps, native apps and allow installation from web browser as an offline app on any of the major platforms. It is very powerful to have that flexibility to choose how to deliver your app.

## Q: Is it SPA? SSR? PWA?

A: Yes, Yes, and Yes, and more - it is flexible.

See, each technique on its own is not so great, trading off one improvement or functionality for lower performance in other areas.

SPA (Single Page App) is bad for SEO with no routes for search crawlers and bad for UX / user experience with slow first loads (as the server will only give client an "/index.html" page and all routing is done on the client AFTER a lot of files are done loading - index.html and all framework Javascript and stylesheets, etc.).

SSR (Server-Side Rendering) is slow for navigation after first page load, as each new page transition has to load whole page and its decorations like NavBars.

PWA (Progressive Web App) gives experience similar to native apps with offline mode, but has many tradeoffs when SSR and SPA is not included.

This app allows to mix and match SSR, CSR, SPA, PWA as best serves the purpose. It can be done for the whole app or on each individual page to have a best combination of SSR with background Offline caching for slick UX with very quick deep links / landing pages, and once any route is loaded on the client, all navigation is local as in a SPA for quick transitions without heavy server reloads. PWA offline caching provided by Service Worker allows seamless online / offline app experience when the app can work without Internet as any standalone app would.

## Q: Then how this app Technology can be described?

A: This technology does not have an established name, and parts of this mix were called "Universal Application" (former "Isomorphic Application") and parts are called "Progressive Web App" (PWA) with Server-Side Rendering (SSR) and client-side navigation". Ugh! We need a better name...

## Q: Why is it called "Total App"?

A: That lack of a good name situation (see previous question) gives me freedom to coin a new term: "TotalApp", since it unifies various technolofies to bring the best where it's needed.

Out of the box features:

- SEO and integration with Social Networks.
- SSR / Server-Side Rendering [[1]](https://www.sanity.io/glossary/server-side-rendering) - for fast first load of any route and great SEO.
- SPA / Single Page App [[2]](https://www.sanity.io/glossary/single-page-application) - for fast client-side navigation.
- PWA / Progressive Web App [[3]](https://www.sanity.io/glossary/progressive-web-application) with Offline mode - can work without Internet connection (after the user visits the app when connected, the app's service worker caches all files for offline operation).
- Support native features (camera, GPS, etc.) - Capacitor included. Check Geolocation and QR Scanner tabs for demo.
- Support deep links, in online and in offline modes.
- Great DX (developer experience) with Svelte and Codebase support features - Linting, Formatting, Unit Testing, End-to-End testing.
- Great DDX (designer/developer experience) - Prepared for Isolated Component Development (Storybook).
- Great DevOps - Instrumented for quick deployment - Netlify, Vercel, NGINX, etc. (CI/CD coming).
- Prepared for UDX (UI designer experience) - see UI integrations below.
- All deployment methods are included - build for standalone apps (iOS/Android/Windows), make a Website or a Web App, or Offline Web App, or all of them.

## Q: Why include `.vscode/extensions.json`?

A: Other projects indirectly recommend extensions via the README, but this file `.vscode/extensions.json` allows VS Code to prompt the user to install the recommended extension upon opening the project. It is easy to reject the recommendations for any reason, VSCode won't bother you anymore. Accepting these recommendations puts you in sync with the way this project is designed and makes most of it.

## Q: Why include `.vscode/launch.json`?

A: To preserve various debug configurations. If anything is not working, having a consistent debug configuration helps a lot to get to the root cause much quicker.

## Q: Why include `.vscode/settings.json`?

A: Unfortunately VSCode does not have an easy way to combine or split or inherit settings for the workspace. There are some critical settings that are required for the project tooling to operate properly. Pressure M$ team to implement extension mechanism for workspace settings to make a difference [TODO: (now) Link to the relevant VSCode issue here].

## Q: I found a bug, what shall I do?

A: Please understand that this project currently follows bleeding edge of Svelte 5 development, and gets all the bugs from early release candidate / pre-alpha versions. Once upstream stabilizes and gets released, many things will be fixed, so your patience will be greatly appreciated.

To help this project, file issues and submit PRs on [Github](https://github.com/iva2k/total-app/issues).
