import { dev } from '$app/environment';
import { type Handle } from '@sveltejs/kit';
import { initializeDatabase } from '$lib/services/db-init';
import { sequence } from '@sveltejs/kit/hooks';
import { sendTestMessages } from '$lib/services/messageService';
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

// Flag to ensure test messages are sent only once
let testMessagesSent = false;

// eslint-disable-next-line @typescript-eslint/unbound-method
const messageTester: Handle = async ({ event, resolve }) => {
  // Check if running in development mode and if test messages haven't been sent yet
  if (dev && !testMessagesSent) {
    testMessagesSent = true; // Set the flag to prevent re-sending

    // Send test messages asynchronously
    sendTestMessages().catch((error) => {
      console.error('Failed to send test messages on server start:', error);
    });
  }

  // Continue with the request
  return resolve(event);
};

export const handle: Handle = sequence(dbInitializer, messageTester);
