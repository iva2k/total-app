import { dev } from '$app/environment';
import { redirect, type Handle } from '@sveltejs/kit';
import { initializeDatabase } from '$lib/services/db-init';
import { sequence } from '@sveltejs/kit/hooks';
import { sendTestMessages } from '$lib/services/messageService';
import { authenticationHandle } from '$lib/services/authService';
import type { DalConfig } from '$lib/dal/dal-types';
import { dbSchema } from '$lib/db-schema';
import website from '$lib/config/website';
const { siteProtectedRoutes } = website;

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

// Authorization guard (per-path)
// eslint-disable-next-line @typescript-eslint/unbound-method
const authorizationHandle: Handle = async ({ event, resolve }) => {
  // Protect any routes under /authenticated
  const session = await event.locals.auth();
  const path = event.url.pathname;
  const matchedRoute = Object.keys(siteProtectedRoutes).find((route) => path.startsWith(route));
  if (matchedRoute) {
    const route = siteProtectedRoutes[matchedRoute];
    if (!session) {
      // Redirect to the signin page
      const pathTo = route.redirect ?? '/auth';
      const message = route.message ?? 'Please sign in to access this page.';
      const url = new URL(event.url);
      url.pathname = pathTo;
      url.searchParams.append('message', message);
      redirect(303, url);
    }
    // TODO: (when needed) Check minimum role/permission for authenticated users here.
  }
  // If the request is still here, just proceed as normally
  return resolve(event);
};

export const handle: Handle = sequence(
  dbInitializer,
  messageTester,
  authenticationHandle,
  authorizationHandle
);
