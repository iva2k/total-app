import type { LayoutServerLoad } from './$types';

export const load = (({ url }) => {
  console.log(`+layout.server:load() url.pathname=${url.pathname}`);
  return {
    ssrPathname: url.pathname
  };
}) satisfies LayoutServerLoad;
