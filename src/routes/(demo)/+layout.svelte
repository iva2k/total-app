<script lang="ts">
  // import { onMount, setContext, type Snippet } from 'svelte';
  import { onMount, type Snippet } from 'svelte';

  // import Favicon from '$lib/components/favicon/Favicon.svelte';
  // import Offline from '$lib/components/offline/Offline.svelte';
  import DarkMode from '$lib/components/darkmode/DarkMode.svelte';
  import Header from '$lib/components/header/Header.svelte';
  import './styles.css';
  import 'agnostic-svelte/css/common.min.css';
  import { Switch } from 'agnostic-svelte'; // Must assign `id` for Switch to work properly.  import Header from '$lib/header/Header.svelte';
  // import { loadIonicPWAElements } from '$lib/utils/ionicUtils.cjs';
  import { BRIGHT_ENTITY, CRESCENT_MOON_ENTITY } from '$lib/constants/entities';

  import website from '$lib/config/website';
  import { loadSiteLinks, prepSiteLinks } from '$lib/config/configUtils';
  import type { SiteLink } from '$lib/types';
  const { siteLinks } = website;

  // import type { LayoutData } from './$types';
  // import { useState } from '$lib/utils/state.svelte';

  // let { data, children } = $props<{ data: LayoutData; children: Snippet }>();
  let { children } = $props<{ children: Snippet }>();
  let footerLinks = $state<SiteLink[]>(
    prepSiteLinks(
      siteLinks,
      'footer',
      1,
      /* nodeFilter */ true,
      /* flatten */ true,
      /* prune */ true
    )
  );

  onMount(async () => {
    /* DISABLED (see root +layout.svelte)
    await loadIonicPWAElements(window);
    */
    const mypath = import.meta.url;
    // footerLinks =
    await Promise.all(loadSiteLinks(footerLinks, mypath));
    console.log('DEBUG: footerLinks=%o', footerLinks);
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
  const svgFavicon = undefined; // TODO: '/favicon.svg';
  const icoFavicon = undefined; // TODO: '/favicon.ico';

  const touchFavicons = [
    { sizes: '167x167', href: '/apple-icon-167x167.png', imgSize: 167 }, // For iPad
    { sizes: '180x180', href: '/apple-icon-180x180.png', imgSize: 180 } // For iPhone
  ];
  */
</script>

<div class="app">
  <!-- DISABLED (see root +layout.svelte)
  <Favicon {pngFavicons} {svgFavicon} {icoFavicon} {touchFavicons} />
  -->

  <Header --corner-right-width="8em">
    {#snippet rightCorner()}
      <DarkMode htmlDarkClass="dark">
        {#snippet content(data)}
          <Switch
            id="switch-1"
            label={data.isDarkMode ? CRESCENT_MOON_ENTITY : BRIGHT_ENTITY}
            labelPosition="left"
            isChecked={data.isDarkMode}
            onchange={(e) => {
              data.onChange(e, !(data.isDarkMode ?? false));
              return;
            }}
          />
        {/snippet}
      </DarkMode>
    {/snippet}
  </Header>

  <main>
    {@render children()}
  </main>

  <!-- DISABLED (see root +layout.svelte)
  <Offline />
  -->

  <footer>
    <p>
      {#each footerLinks.filter((l) => l?.href) as link, i}
        {#if i > 0}
          <span>&nbsp;| </span>
        {/if}
        <span>
          {link?.prefix ?? ''}
          <a href={link.href} target={link.target ?? '_self'}>
            {#if link?.img_component}
              <svelte:component this={link?.img_component} />
            {:else if link?.img_html}
              <!-- eslint-disable-next-line svelte/no-at-html-tags -->
              {@html link?.img_html}
            {:else if link?.img_src}
              <img
                src={link.img_src}
                alt={link?.img_alt ?? ''}
                aria-hidden="true"
                role="presentation"
              />
            {/if}
            {#if link?.title}
              <span>{link.title}</span>
            {/if}
          </a>
          {link?.suffix ?? ''}
        </span>
      {/each}
    </p>
  </footer>
</div>

<style lang="scss">
  .app {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  main {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 1rem;
    width: 100%;
    max-width: 64rem;
    margin: 0 auto;
    box-sizing: border-box;
  }

  footer {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 12px;
  }

  footer a {
    display: inline-block; /* Place link and image inline */
    text-decoration: none; /* Remove default underline for links */
    font-weight: bold;
  }
  footer a span {
    margin-top: 10px; /* Adjust the margin as needed */
  }

  footer a :global(img),
  footer a :global(svg) {
    vertical-align: middle; /* Aligns image vertically with the text */
    width: 2em;
    height: 3em;
    --fill_color: var(--color-text);
  }

  @media (min-width: 480px) {
    footer {
      padding: 12px 0;
    }
  }
</style>
