<script lang="ts">
  // import { onMount, setContext, type Snippet } from 'svelte';
  import { onMount, type Snippet } from 'svelte';

  // import Favicon from '$lib/components/favicon/Favicon.svelte';
  // import Offline from '$lib/components/offline/Offline.svelte';
  import DarkMode from '$lib/components/darkmode/DarkMode.svelte';
  import Header from '$lib/components/header/Header.svelte';
  import './styles.css';
  import '../../../node_modules/bootstrap-icons/font/bootstrap-icons.css';
  import { Input } from '@sveltestrap/sveltestrap';
  // import { loadIonicPWAElements } from '$lib/utils/ionicUtils.cjs';
  import { BRIGHT_ENTITY, CRESCENT_MOON_ENTITY } from '$lib/constants/entities';

  import website from '$lib/config/website';
  import { getSiteLinksComponents } from '$lib/config/configUtils';
  const { siteLinks } = website;

  // import type { LayoutData } from './$types';
  // import type { LayoutContext } from '$lib/types';

  // let { data, children } = $props<{ data: LayoutData; children: Snippet }>();
  let { children } = $props<{ children: Snippet }>();
  import { type SiteLink } from '$lib/types';
  let siteLinksLoaded = $state<SiteLink[]>([]);

  let isDarkMode = $state(false);
  const DARK_CSS = '/vendor/bootstrap/themes/darkly/bootstrap.min.css';
  const LIGHT_CSS = '/vendor/bootstrap/themes/flatly/bootstrap.min.css';

  onMount(async () => {
    /* DISABLED (see root +layout.svelte)
    await loadIonicPWAElements(window);
    */
    const mypath = import.meta.url;
    siteLinksLoaded = await getSiteLinksComponents(siteLinks, mypath);
    console.log('DEBUG: siteLinksLoaded=%o', siteLinksLoaded);
  });
  /* DISABLED (see root +layout.svelte)
  let ssrPathname = $state<string>(data?.ssrPathname ?? '');

  // Use context to make ssrPathname available to child components
  setContext<LayoutContext>('layout', {
    get: () => {
      console.log(`getContext(layout) ssrPathname=${ssrPathname}`);
      return { ssrPathname };
    }
  });
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

<svelte:head>
  <!-- <link rel="stylesheet" href="vendor/bootstrap/themes/{isDarkMode ? 'darkly' : 'flatly'}/bootstrap.min.css" /> -->
  {#if isDarkMode}
    <link rel="stylesheet" href={DARK_CSS} />
  {:else}
    <link rel="stylesheet" href={LIGHT_CSS} />
  {/if}
</svelte:head>

<div class="app">
  <!-- DISABLED (see root +layout.svelte)
  <Favicon {pngFavicons} {svgFavicon} {icoFavicon} {touchFavicons} />
  -->

  <Header --corner-right-width="8em">
    {#snippet content()}
      <DarkMode htmlDarkClass="dark">
        {#snippet content(data)}
          <Input
            type="switch"
            label={data.isDarkMode ? CRESCENT_MOON_ENTITY : BRIGHT_ENTITY}
            checked={data.isDarkMode}
            onchange={(e) => {
              data.onChange(e, !(data.isDarkMode ?? false));
              isDarkMode = data.isDarkMode; // For switching the stylesheet in <svelte:head>
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
      {#each siteLinksLoaded as link, i}
        {#if i > 0}
          <span>&nbsp;| </span>
        {/if}
        <span>
          {link?.prefix ?? ''}
          <a href={link.href}>
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
