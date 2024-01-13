# ROADMAP

## Plan

1. UI framework branches - port from 2022-1125
2. Organize app common stuff: settings manager (localStorage/cookie/session/db), toast interface, layout API - show/hide footer, global drawer(?)
3. Auth?
4. Backend Server (non-SvelteKit)?
5. Push Notifications?
6. Explore turborepo <https://www.npmjs.com/package/turbo>
7. Explore Histoire <https://histoire.dev/guide/svelte3/getting-started.html> instead of Storybook
8. SVG icons, see src/lib/components/image/\* and <https://www.npmjs.com/package/@poppanator/sveltekit-svg>, <https://joshuatz.com/posts/2021/using-svg-files-in-svelte/>

## Package Updates

## Ideas

### Auth

SvelteKit-Auth <https://www.npmjs.com/package/sk-auth> is dead as of 2022-06, all latest SvelteKit breaking changes killed it.

See progress in <https://github.com/nextauthjs/next-auth/tree/main/apps/playground-sveltekit> (yes, @next-auth/sveltekit).
