<script lang="ts">
  import { onMount, setContext, type Snippet } from 'svelte';

  import Favicon from '$lib/components/favicon/Favicon.svelte';
  import Offline from '$lib/components/offline/Offline.svelte';
  // import DarkMode from '$lib/components/darkmode/DarkMode.svelte';
  // import Header from '$lib/components/header/Header.svelte';
  import './styles.css';
  import { loadIonicPWAElements } from '$lib/utils/ionicUtils.cjs';
  // import { BRIGHT_ENTITY, CRESCENT_MOON_ENTITY } from '$lib/constants/entities';

  import website from '$lib/config/website';
  // const { githubRepo } = website;
  // import GithubLogo from '$lib/images/github.svelte';
  // import svelte_logo from '$lib/images/svelte-logo.svg';

  import type { LayoutData } from './$types';
  import type { LayoutContext } from '$lib/types';

  let { data, children } = $props<{ data: LayoutData; children: Snippet }>();

  onMount(async () => {
    await loadIonicPWAElements(window);

    await import('@shoelace-style/shoelace');
  });

  let ssrPathname = $state<string>(data?.ssrPathname ?? '');

  // Use context to make ssrPathname available to child components
  setContext<LayoutContext>('layout', {
    get: () => {
      console.log(`getContext(layout) ssrPathname=${ssrPathname}`);
      return { ssrPathname };
    }
  });

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

  /* for SlSwitch */
  // const onChange = (e: Event) => {
  //   dark = (e.target as SlSwitch).checked;
  // };
</script>

<svelte:head>
  <link rel="stylesheet" href="/vendor/shoelace/themes/light.css" />
  <link rel="stylesheet" href="/vendor/shoelace/themes/dark.css" />
</svelte:head>

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
