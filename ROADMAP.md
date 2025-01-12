# ROADMAP

## Plan

1. Organize app common stuff: settings manager (localStorage/cookie/session/db), toast interface, layout API - show/hide footer, global drawer(?)
2. Push Notifications?
3. Explore turborepo <https://www.npmjs.com/package/turbo> and `concurrently` for faster builds
4. Github actions for CI/CD
5. Explore Histoire <https://histoire.dev/guide/svelte3/getting-started.html> instead of Storybook
6. SVG icons, see src/lib/components/image/\* and <https://www.npmjs.com/package/@poppanator/sveltekit-svg>, <https://joshuatz.com/posts/2021/using-svg-files-in-svelte/>

## Package Updates

## Ideas

### Auth

SvelteKit-Auth <https://www.npmjs.com/package/sk-auth> is dead as of 2022-06, all latest SvelteKit breaking changes killed it.

See progress in <https://github.com/nextauthjs/next-auth/tree/main/apps/playground-sveltekit> (yes, @next-auth/sveltekit).
