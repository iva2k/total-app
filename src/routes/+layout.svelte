<script lang="ts">
  import './styles.css';

  // import { onMount, type Snippet, type ComponentProps } from 'svelte';
  import { onMount, type Snippet } from 'svelte';

  import Favicon from '$lib/components/favicon/Favicon.svelte';
  import Offline from '$lib/components/offline/Offline.svelte';
  import { loadIonicPWAElements } from '$lib/utils/ionicUtils';

  // import website from '$lib/config/website';
  // const { githubRepo } = website;

  import type { LayoutData } from './$types';
  import { useState } from '$lib/utils/state.svelte';
  // import type { CarbonTheme } from 'carbon-components-svelte/src/Theme/Theme.svelte';
  // import { Dropdown, Theme } from 'carbon-components-svelte';

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

  /* DISABLED
  let select_theme_id = $state(0);
  const themes: { id: number; theme: CarbonTheme; title: string }[] = [
    { id: 0, theme: 'white', title: 'White' },
    { id: 1, theme: 'g10', title: 'Gray 10' },
    { id: 2, theme: 'g80', title: 'Gray 80' },
    { id: 3, theme: 'g90', title: 'Gray 90' },
    { id: 4, theme: 'g100', title: 'Gray 100' }
  ];
  // See <https://github.com/carbon-design-system/carbon-components-svelte/issues/1910>
  // let theme: ComponentProps<Theme>['theme'] = 'g90' as const;
  let theme = $state<ComponentProps<Theme>['theme']>('g90' as const);
  let theme_css = $derived(
    `/vendor/carbon-components-svelte/css/${theme}.css` // see `assets.ts`
    // All themes: "carbon-components-svelte/css/all.css"
    // From CDN: `https://unpkg.com/carbon-components-svelte/css/${theme}.css`
  );
  */
</script>

<!-- DISABLED
<svelte:head>
  <link rel="stylesheet" href={theme_css} />
</svelte:head> 
-->

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
