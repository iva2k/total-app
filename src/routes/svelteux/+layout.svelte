<script lang="ts">
  // import { onMount, setContext, type Snippet } from 'svelte';
  import { onMount, type Snippet } from 'svelte';
  import { signOut } from '@auth/sveltekit/client';

  import { page } from '$app/stores';
  page; // TODO: (when issue fixed) Replace a hacky patch to fix <https://github.com/sveltejs/eslint-plugin-svelte/issues/652>

  // import { settings } from 'svelte-ux';

  import AppShell from '$lib/components/svelteux/AppShell.svelte';

  // import Favicon from '$lib/components/favicon/Favicon.svelte';
  // import Offline from '$lib/components/offline/Offline.svelte';
  // import { loadIonicPWAElements } from '$lib/utils/ionicUtils.cjs';

  // DISABLED (see root +layout.svelte)

  import { SvelteToast, type SvelteToastOptions } from '@zerodevx/svelte-toast';
  import type { LayoutData } from './$types';
  // import { useState } from '$lib/utils/state.svelte';

  let { data, children }: { data: LayoutData; children: Snippet } = $props();

  const toast_options: SvelteToastOptions = {};

  onMount(async () => {
    /* DISABLED (see root +layout.svelte)
    await loadIonicPWAElements(window);
    */
  });

  /* DISABLED (see root +layout.svelte)
  let ssrPathname = $state<string>(data?.ssrPathname ?? '');

  // useState() uses rune in a context to make ssrPathname available to child components
  // let _ssrPathname =
  useState('ssrPathname', { ssrPathname });
  */

  /* DISABLED (see root +layout.svelte)
  // Favicon params:
  const pngFavicons = [
    { sizes: '32x32', href: '/favicon-32x32.png', imgSize: 32 },
    { sizes: '16x16', href: '/favicon-16x16.png', imgSize: 16 },
    { sizes: '48x48', href: '/favicon-48x48.png', imgSize: 48 },
    { sizes: '192x192', href: '/icon-192x192.png', imgSize: 192 } // For Android Devices
  ];
  const svgFavicon = undefined; // TODO: (now) '/favicon.svg';
  const icoFavicon = undefined; // TODO: (now) '/favicon.ico';

  const touchFavicons = [
    { sizes: '167x167', href: '/apple-icon-167x167.png', imgSize: 167 }, // For iPad
    { sizes: '180x180', href: '/apple-icon-180x180.png', imgSize: 180 } // For iPhone
  ];
  */

  const themes = {
    light: ['light', 'emerald', 'hamlindigo-light'],
    dark: ['dark', 'forest', 'hamlindigo-dark']
  };
</script>

<!-- DISABLED (see root +layout.svelte)
<Favicon {pngFavicons} {svgFavicon} {icoFavicon} {touchFavicons} />
-->

<AppShell
  session={data.session ?? undefined}
  {themes}
  onSignout={() => signOut({ callbackUrl: '/', redirect: true })}
>
  <!-- <div class="app"> -->
  <main class="isolate">
    {@render children()}
  </main>
</AppShell>

<!-- DISABLED (see root +layout.svelte)
<Offline />
-->

<SvelteToast options={toast_options} />

<!-- </div> -->

<style lang="scss">
  /* Placeholder for styles */
</style>
