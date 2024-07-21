<script lang="ts">
  import { onMount, setContext, type Snippet, type ComponentProps } from 'svelte';

  import { Theme, RadioButtonGroup, RadioButton } from 'carbon-components-svelte';

  import Favicon from '$lib/components/favicon/Favicon.svelte';
  import Offline from '$lib/components/offline/Offline.svelte';
  import DarkMode from '$lib/components/darkmode/DarkMode.svelte';
  import Header from '$lib/components/header/Header.svelte';
  import './styles.css';
  import { loadIonicPWAElements } from '$lib/utils/ionicUtils.cjs';
  import { BRIGHT_ENTITY, CRESCENT_MOON_ENTITY } from '$lib/constants/entities';

  import website from '$lib/config/website';
  const { githubRepo } = website;
  import GithubLogo from '$lib/images/github.svelte';
  import svelte_logo from '$lib/images/svelte-logo.svg';

  import type { LayoutData } from './$types';
  import type { LayoutContext } from '$lib/types';

  let { data, children } = $props<{ data: LayoutData; children: Snippet }>();

  onMount(async () => {
    await loadIonicPWAElements(window);
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

  const themes = ['white', 'g10', 'g80', 'g90', 'g100'];
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
  <Favicon {pngFavicons} {svgFavicon} {icoFavicon} {touchFavicons} />

  <Header --corner-right-width="8em">
    {#snippet content()}
      <DarkMode htmlDarkClass="dark">
        {#snippet content(data)}
          <label>
            <input
              id="cb1"
              type="checkbox"
              checked={data.isDarkMode}
              onchange={(e) => {
                data.onChange(e, !(data.isDarkMode ?? false));
                theme = (data.isDarkMode ?? false) ? 'g90' : 'g10';
                return;
              }}
              aria-label="Dark mode {data.isDarkMode ? 'on' : 'off'}"
            />
            {data.isDarkMode ? CRESCENT_MOON_ENTITY : BRIGHT_ENTITY}
          </label>

          <RadioButtonGroup
            legendText="Carbon theme"
            bind:selected={theme}
            onchange={(e) => {
              if (theme) {
                // const theme1 = theme;
                if (['white', 'g10'].includes(theme)) {
                  data.onChange(e, false);
                } else {
                  data.onChange(e, true);
                }
                // theme = theme1;
              }
            }}
          >
            {#each themes as value}
              <RadioButton labelText={value} {value} />
            {/each}
          </RadioButtonGroup>
        {/snippet}
      </DarkMode>
    {/snippet}
  </Header>

  <main>
    {@render children()}
  </main>

  <Offline />

  <footer>
    <p>
      visit
      <a href={githubRepo}>
        <GithubLogo />
        <span>App GitHub Repo</span>
      </a>
      for details | visit
      <a href="https://kit.svelte.dev">
        <img src={svelte_logo} alt="SvelteKit" aria-hidden="true" role="presentation" />
        <span>kit.svelte.dev</span>
      </a>
      to learn SvelteKit
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
