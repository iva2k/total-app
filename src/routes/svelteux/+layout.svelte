<script lang="ts">
  import { onMount, setContext, type Snippet } from 'svelte';

  import { page } from '$app/stores';
  page; // TODO: (when issue fixed) Replace a hacky patch to fix <https://github.com/sveltejs/eslint-plugin-svelte/issues/652>

  import {
    settings,
    AppBar,
    AppLayout,
    Button,
    ListItem,
    NavItem,
    ThemeInit,
    ThemeSelect,
    ThemeSwitch
  } from 'svelte-ux';
  import { mdiRefresh } from '@mdi/js';
  //   import { faUser } from '@fortawesome/free-solid-svg-icons';

  // import Favicon from '$lib/components/favicon/Favicon.svelte';
  // import Offline from '$lib/components/offline/Offline.svelte';
  // import DarkMode from '$lib/components/darkmode/DarkMode.svelte';
  // import Header from '$lib/components/header/Header.svelte';
  import './styles.css';
  // import { loadIonicPWAElements } from '$lib/utils/ionicUtils.cjs';
  // import { BRIGHT_ENTITY, CRESCENT_MOON_ENTITY } from '$lib/constants/entities';

  import website from '$lib/config/website';
  // const { githubRepo } = website;
  const { siteLinks, siteNav } = website;
  // import GithubLogo from '$lib/images/github.svelte';
  // import svelte_logo from '$lib/images/svelte-logo.svg';

  import type { LayoutData } from './$types';
  import type { LayoutContext, SiteLink } from '$lib/types';

  let { data, children } = $props<{ data: LayoutData; children: Snippet }>();

  let siteLinksLoaded = $state<SiteLink[]>([]);

  onMount(async () => {
    /* DISABLED (see root +layout.svelte)
    await loadIonicPWAElements(window);
    */
    const mypath = import.meta.url;
    siteLinksLoaded = await getSiteLinksComponents(siteLinks, mypath);
    console.log('DEBUG: siteLinksLoaded=%o', siteLinksLoaded);
  });

  settings({
    components: {
      AppLayout: {
        classes: {
          aside: 'border-r',
          nav: 'bg-surface-300 py-2'
        }
      },
      AppBar: {
        classes:
          'bg-primary text-primary-content shadow-md [text-shadow:1px_1px_2px_theme(colors.primary-700)]'
      },
      NavItem: {
        classes: {
          root: 'text-sm text-surface-content/70 pl-6 py-2 hover:bg-surface-100/70 relative',
          active:
            'text-primary bg-surface-100 font-medium before:absolute before:bg-primary before:rounded-full before:w-1 before:h-2/3 before:left-[6px] shadow z-10'
        }
      }
    },
    themes: {
      light: ['light', 'emerald', 'hamlindigo-light'],
      dark: ['dark', 'forest', 'hamlindigo-dark']
    }
  });

  let ssrPathname = $state<string>(data?.ssrPathname ?? '');

  // Use context to make ssrPathname available to child components
  setContext<LayoutContext>('layout', {
    get: () => {
      console.log(`getContext(layout) ssrPathname=${ssrPathname}`);
      return { ssrPathname };
    }
  });

  /* DISABLED
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

<ThemeInit />

<!-- DISABLED
<Favicon {pngFavicons} {svgFavicon} {icoFavicon} {touchFavicons} />
-->

<!-- <div class="app"> -->
<!-- <Header --corner-right-width="8em">
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
                return;
              }}
              aria-label="Dark mode {data.isDarkMode ? 'on' : 'off'}"
            />
            {data.isDarkMode ? CRESCENT_MOON_ENTITY : BRIGHT_ENTITY}
          </label>
        {/snippet}
      </DarkMode>
    {/snippet}
  </Header> -->

<AppLayout areas="'header header' 'aside main'">
  <svelte:fragment slot="nav">
    <!-- Nav menu -->
    {#each siteNav as item}
      <NavItem text={item.title} currentUrl={$page.url} path={item.href} />
    {/each}
  </svelte:fragment>

  <!-- <AppBar title="Example"> -->
  <AppBar title={['Example', 'Page', 'Section']} class="bg-primary text-primary-content">
    <!-- <div slot="title">
        <ListItem title="Example" subheading="Page" />
      </div> -->

    <div slot="actions">
      <!-- App actions -->
      {#each siteLinksLoaded as link}
        <a href={link.href}>
          {#if link?.imp}
            <svelte:component this={link?.imp} />
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
      {/each}

      <!-- <Button icon={mdiRefresh} class="p-2 hover:bg-surface-100/10" /> -->
      <ThemeSelect lightThemes={['light']} darkThemes={['dark']} />
      <ThemeSwitch />
    </div>
  </AppBar>

  <main class="isolate">
    {@render children()}
  </main>
</AppLayout>

<!-- DISABLED
<Offline />
-->

<!-- </div> -->

<style lang="scss">
  /* Placeholder for styles */
</style>
