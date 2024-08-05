<script lang="ts">
  import { onMount, type Snippet } from 'svelte';

  import Favicon from '$lib/components/favicon/Favicon.svelte';
  import Offline from '$lib/components/offline/Offline.svelte';
  import './styles.css';
  import { loadIonicPWAElements } from '$lib/utils/ionicUtils.cjs';

  // import website from '$lib/config/website';
  // const { githubRepo } = website;

  import type { LayoutData } from './$types';
  import { useState } from '$lib/utils/state.svelte';

  let { data, children }: { data: LayoutData; children: Snippet } = $props();

  onMount(async () => {
    await loadIonicPWAElements(window);
  });

  let ssrPathname = $state<string>(data?.ssrPathname ?? '');

  // Make ssrPathname available to child components
  // const _ssrPathname =
  useState('ssrPathname', ssrPathname);

  // Favicon params:
  const pngFavicons = [
    { sizes: '32x32', href: '/favicon-32x32.png', imgSize: 32 },
    { sizes: '16x16', href: '/favicon-16x16.png', imgSize: 16 },
    { sizes: '48x48', href: '/favicon-48x48.png', imgSize: 48 },
    { sizes: '192x192', href: '/icon-192x192.png', imgSize: 192 } // For Android Devices
  ];
  const svgFavicon = undefined; // TODO: '/favicon.svg';
  const icoFavicon = undefined; // TODO: '/favicon.ico';

  const touchFavicons = [
    { sizes: '167x167', href: '/apple-icon-167x167.png', imgSize: 167 }, // For iPad
    { sizes: '180x180', href: '/apple-icon-180x180.png', imgSize: 180 } // For iPhone
  ];
</script>

<!-- <div class="app"> -->
<Favicon {pngFavicons} {svgFavicon} {icoFavicon} {touchFavicons} />

<main>
  {@render children()}
</main>

<Offline />

<!-- </div> -->

<style lang="scss">
  /* Placeholder for styles */
</style>
