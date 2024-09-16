<script lang="ts">
  // import { onMount, setContext, type Snippet } from 'svelte';
  import { onMount, type Snippet } from 'svelte';
  import { SvelteUIProvider, Switch } from '@svelteuidev/core';
  import type { SvelteUIProviderProps } from '@svelteuidev/core';

  // import Favicon from '$lib/components/favicon/Favicon.svelte';
  // import Offline from '$lib/components/offline/Offline.svelte';
  import DarkMode from '$lib/components/darkmode/DarkMode.svelte';
  import Header from '$lib/components/header/Header.svelte';
  import './styles.css';
  // import { loadIonicPWAElements } from '$lib/utils/ionicUtils.cjs';
  import { BRIGHT_ENTITY, CRESCENT_MOON_ENTITY } from '$lib/constants/entities';

  import website from '$lib/config/website';
  import { loadSiteLinks, prepSiteLinks } from '$lib/config/configUtils';
  import type { SiteLink } from '$lib/types';
  const { siteLinks } = website;

  // import type { LayoutData } from './$types';
  // import type { LayoutContext } from '$lib/types';

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

  // BEGIN load 'vanilla-lazyload' lib
  import lazyload from 'vanilla-lazyload';
  import type { ILazyLoadInstance } from 'vanilla-lazyload';
  let lazyloadInstance: ILazyLoadInstance;
  import { browser } from '$app/environment';
  // END load 'vanilla-lazyload' lib

  let isDarkMode = $state(false);

  onMount(async () => {
    if (browser) {
      lazyloadInstance = new lazyload();
      lazyloadInstance?.update();
    }
    /* DISABLED (see root +layout.svelte)
    await loadIonicPWAElements(window);
    */
    const mypath = import.meta.url;
    // footerLinks =
    await Promise.all(loadSiteLinks(footerLinks, mypath));
    // console.log('DEBUG: footerLinks=%o', footerLinks);
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

  let config: SvelteUIProviderProps = {
    // light: { bg: 'White', color: 'Black' },
    // dark: { bg: '#1A1B1E', color: '#C1C2C5' }
  };

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

<SvelteUIProvider
  {config}
  themeObserver={isDarkMode ? 'dark' : 'light'}
  ssr
  withNormalizeCSS
  withGlobalStyles
>
  <div class="app">
    <!-- DISABLED (see root +layout.svelte)
    <Favicon {pngFavicons} {svgFavicon} {icoFavicon} {touchFavicons} />
    -->

    <Header --corner-right-width="8em">
      {#snippet content()}
        <DarkMode htmlDarkClass="dark">
          {#snippet content(data)}
            <Switch
              size="lg"
              label={data.isDarkMode ? CRESCENT_MOON_ENTITY : BRIGHT_ENTITY}
              on:change={(e) => {
                data.onChange(e, !(data.isDarkMode ?? false));
                isDarkMode = data.isDarkMode; // Mirror in local state for SvelteUIProvider.themeObserver
                return;
              }}
            />
            <label>
              <input
                id="cb1"
                type="checkbox"
                checked={data.isDarkMode}
                onchange={(e) => {
                  data.onChange(e, !(data.isDarkMode ?? false));
                  isDarkMode = data.isDarkMode; // Mirror in local state for SvelteUIProvider.themeObserver
                  return;
                }}
                aria-label="Dark mode {data.isDarkMode ? 'on' : 'off'}"
              />
              {data.isDarkMode ? CRESCENT_MOON_ENTITY : BRIGHT_ENTITY}
            </label>
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
                {@const ImgComponent = link?.img_component}
                <ImgComponent />
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
</SvelteUIProvider>

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
