<script lang="ts">
  // import { onMount, setContext, type Snippet } from 'svelte';
  import { onMount, type Snippet, type ComponentProps } from 'svelte';

  // import Favicon from '$lib/components/favicon/Favicon.svelte';
  // import Offline from '$lib/components/offline/Offline.svelte';
  import DarkMode from '$lib/components/darkmode/DarkMode.svelte';
  import Header from '$lib/components/header/Header.svelte';
  import './styles.css';
  // import { loadIonicPWAElements } from '$lib/utils/ionicUtils.cjs';
  import { BRIGHT_ENTITY, CRESCENT_MOON_ENTITY } from '$lib/constants/entities';

  import website from '$lib/config/website';
  import { prepSiteLinks } from '$lib/config/configUtils';
  import type { SiteLink } from '$lib/types';
  const { siteLinks } = website;

  // import type { LayoutData } from './$types';
  // import type { LayoutContext } from '$lib/types';
  import type { CarbonTheme } from 'carbon-components-svelte/src/Theme/Theme.svelte';
  import { Dropdown, Theme } from 'carbon-components-svelte';

  // let { data, children } = $props<{ data: LayoutData; children: Snippet }>();
  let { children } = $props<{ children: Snippet }>();
  let footerLinks = $state<SiteLink[]>([]);

  onMount(async () => {
    /* DISABLED (see root +layout.svelte)
    await loadIonicPWAElements(window);
    */
    const mypath = import.meta.url;
    footerLinks = await prepSiteLinks(
      siteLinks,
      mypath,
      'footer',
      1,
      /* nodeFilter */ true,
      /* flatten */ true,
      /* prune */ true
    );
    console.log('DEBUG: footerLinks=%o', footerLinks);
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
</script>

<svelte:head>
  <link rel="stylesheet" href={theme_css} />
</svelte:head>

<div class="app">
  <Theme bind:theme persist persistKey="__carbon-theme" />
  <!-- DISABLED (see root +layout.svelte)
  <Favicon {pngFavicons} {svgFavicon} {icoFavicon} {touchFavicons} />
  -->

  <Header --corner-right-width="auto">
    {#snippet content()}
      <DarkMode htmlDarkClass="dark">
        {#snippet content(data)}
          <div class="toolbar-themer">
            <div class="theme-switch">
              <label>
                <input
                  id="cb1"
                  type="checkbox"
                  checked={data.isDarkMode}
                  onchange={(e) => {
                    data.onChange(e, !(data.isDarkMode ?? false));
                    theme = (data.isDarkMode ?? false) ? 'g90' : 'g10';
                    select_theme_id = themes.findIndex((t) => t.theme === theme) ?? 0;
                    return;
                  }}
                  aria-label="Dark mode {data.isDarkMode ? 'on' : 'off'}"
                />
                {data.isDarkMode ? CRESCENT_MOON_ENTITY : BRIGHT_ENTITY}
              </label>
            </div>

            <div class="theme-selector">
              <Dropdown
                class="selector-dropdown"
                label="Theme label"
                type="inline"
                bind:selectedId={select_theme_id}
                items={themes.map((t, i) => ({ id: i, text: t.title }))}
                on:select={(e) => {
                  // const i = event?.detail?.selectedId;
                  const t = themes[select_theme_id]?.theme ?? 'white';
                  if (t) {
                    theme = t;
                    if (['white', 'g10'].includes(theme)) {
                      data.onChange(e, false);
                    } else {
                      data.onChange(e, true);
                    }
                  }
                }}
              />
            </div>
          </div>
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

  .toolbar-themer {
    display: flex;
    justify-content: space-between;
    align-content: flex-end;
    align-items: center;
  }
  .toolbar-themer .theme-switch {
    display: inline-block;
    white-space: nowrap;
  }
  .toolbar-themer .theme-selector {
    display: inline-block;
    white-space: nowrap;
  }
  :global(.toolbar-themer .theme-selector .selector-dropdown) {
    column-gap: 0 !important; /* Reduce shifting to the right out of the container (when width --corner-right-width is limited)*/
    min-width: 7rem;
    max-width: 7rem;
    width: 7rem;
  }
  :global(.toolbar-themer .theme-selector .selector-dropdown .bx--dropdown) {
    width: 100%;
  }
  :global(.toolbar-themer .theme-selector .selector-dropdown .bx--list-box__menu) {
    min-width: 8rem;
    max-width: 8rem;
    left: auto !important; /* Right-align the dropdown menu */
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
