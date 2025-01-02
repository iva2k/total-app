import { type Handle } from '@sveltejs/kit';
import { initializeDatabase } from '$lib/services/db-init';
import { sequence } from '@sveltejs/kit/hooks';
import type { DalConfig } from '$lib/dal/dal-types';
import { dbSchema } from '$lib/db-schema';

// eslint-disable-next-line @typescript-eslint/unbound-method
const dbInitializer: Handle = async ({ event, resolve }) => {
  // TODO: (when needed) Figure out a fix for ESLint 'import-x/no-unresolved' error on '$env/static/public'
  // eslint-disable-next-line import-x/no-unresolved
  const env = await import('$env/static/private');
  // const { env } = await import('$env/dynamic/private');
  const dbConfig = {
    implementation: env.DB_IMPLEMENTATION,
    dbFilePath: env.DB_SQLITE_FILE
  } as DalConfig;
  await initializeDatabase(dbConfig, dbSchema);
  return await resolve(event);
};

export const handle: Handle = sequence(dbInitializer);
