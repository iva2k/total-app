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

  import './styles.css';

  import website from '$lib/config/website';
  const { siteLinks, siteNav } = website;

  import type { SiteLink } from '$lib/types';
  import { getSiteLinksComponents } from '$lib/config/configUtils';

  let { children } = $props<{ children: Snippet }>();

  let siteLinksLoaded = $state<SiteLink[]>([]);

  onMount(async () => {
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
</script>

<ThemeInit />

<!-- <div class="app"> -->

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
      {/each}

      <Button icon={mdiRefresh} class="p-2 hover:bg-surface-100/10" />
      <ThemeSelect lightThemes={['light']} darkThemes={['dark']} />
      <ThemeSwitch />
    </div>
  </AppBar>

  {@render children()}
</AppLayout>

<!-- </div> -->

<style lang="scss">
  /* Placeholder for styles */
</style>
