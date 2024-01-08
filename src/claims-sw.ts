// For type ServiceWorkerGlobalScope:
/// <reference lib="es2020" />
/// <reference lib="webworker" />

import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute
} from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';
import { NavigationRoute, registerRoute } from 'workbox-routing';
// import { NavigationRoute, registerRoute, setDefaultHandler } from 'workbox-routing';
// import { NetworkFirst } from 'workbox-strategies';
// import { offlineFallback } from 'workbox-recipes';

declare let self: ServiceWorkerGlobalScope;

// self:__WB_MANIFEST (replace colon with dot for actual replacement) is default injection point
precacheAndRoute(self.__WB_MANIFEST);

// clean old assets
cleanupOutdatedCaches();

let allowlist: undefined | RegExp[];
if (import.meta.env.DEV) allowlist = [/^\/$/];

// to allow work offline
const url = '/';
registerRoute(new NavigationRoute(createHandlerBoundToURL(url), { allowlist }));

// This allows navigaing to routes like /sverdle in offline:
// setDefaultHandler(new NetworkFirst({ networkTimeoutSeconds: 1 }));

// Unfortunately, this does not intercept uncached routes, such as form submits.
// offlineFallback({ pageFallback: '/amOffline' }); // Needs setDefaultHandler() to work

self.skipWaiting();
clientsClaim();
