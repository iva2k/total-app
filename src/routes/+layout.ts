// `trailingSlash` moved from `svelte.config.js`:
// Enable trailingSlash for favicon links in <head> to be absolute and not throw stray /about/favicon.ico requests
// export const trailingSlash = 'always';
// However, it breaks router: /about/ works, but /about throws 404.
// To compound the problem, in Offline mode /  Service Worker, /about works, which makes it too weird.
// So don't use it for now.
// TODO: (now) File an issue on trailingSlash='always' and /about route not working

// There are errors in many online sources that give wrong information about prerender and ssr.

// Prerender each page by default:
export const prerender = true;
// As of @sveltejs/kit 1.0.0-next.563, pages with actions (e.g. sub-routes) throw error in `vite build`.
// Each such route should set prerender = false if needed in `src/routes/**/+page.ts`.

// Setting ssr = false (which is recommended for SPA in docs) breaks all server-side routes
// (generated pages have no content, therefore SPA does not load).
// We let SvelteKit render all routes on server, so deep links will still work:
export const ssr = true;
