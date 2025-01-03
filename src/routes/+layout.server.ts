import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
  const session = await locals.auth();
  console.log(`+layout.server:load() url.pathname=${url.pathname}`);

  return {
    session,
    ssrPathname: url.pathname
  };
};
