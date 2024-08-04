declare const __DATE__: string;
declare const __RELOAD_SW__: string;
declare const __UPDATE_CHECK_PERIOD_MS__: string;

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

import 'vite-plugin-pwa/svelte'; // virtual:pwa-register/svelte
import 'vite-plugin-pwa/info'; // virtual:pwa-info
// import 'vite-plugin-pwa/pwa-assets'; // virtual:pwa-assets/head, virtual:pwa-assets/icons

import 'unplugin-icons/types/svelte';

export {};
