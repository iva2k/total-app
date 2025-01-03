// import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

import { getProviders } from '$lib/services/authService';

export const load: PageServerLoad = async ({ locals }) => {
  const providers = await getProviders();
  const providerMap = providers.map((provider) => {
    if (typeof provider === 'function') {
      const providerData = provider();
      return { id: providerData.id, name: providerData.name };
    } else {
      return { id: provider.id, name: provider.name };
    }
  });
  return {
    user: locals.user,
    providerMap
  };
};
