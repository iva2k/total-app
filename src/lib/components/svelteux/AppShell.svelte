<script lang="ts">
  import { onMount, setContext, type Snippet } from 'svelte';

  import { page } from '$app/stores';
  page; // TODO: (when issue fixed) Replace a hacky patch to fix <https://github.com/sveltejs/eslint-plugin-svelte/issues/652>

  import {
    settings,
    AppBar,
    AppLayout,
    Breadcrumb,
    Button,
    Icon,
    ListItem,
    MenuButton,
    type MenuOption,
    NavItem,
    ThemeInit,
    ThemeSelect,
    ThemeSwitch,
    Tooltip,
    lgScreen
  } from 'svelte-ux';
  import { isActive } from 'svelte-ux/utils/routing';
  import { mdiDotsGrid, mdiDotsVertical } from '@mdi/js';
  //   import { faUser } from '@fortawesome/free-solid-svg-icons';

  import './styles.css';

  import website from '$lib/config/website';
  const { siteLinks, websiteUrl, siteUrl, siteShortTitle, siteTitle } = website;

  import type { SiteLink } from '$lib/types';
  import { loadSiteLinks, prepSiteLinks } from '$lib/config/configUtils';

  // let title_default = siteTitle;
  const title_default = [siteShortTitle, 'Svelte UX'];
  const themes_default = {
    light: ['light', 'emerald', 'hamlindigo-light'],
    dark: ['dark', 'forest', 'hamlindigo-dark']
  };
  let {
    title = title_default,
    themes = themes_default,
    children
  } = $props<{
    title?: string[] | string;
    themes?: {
      light?: string[];
      dark?: string[];
    };
    children: Snippet;
  }>();

  let brandLink = $state<SiteLink>(prepSiteLinks(siteLinks, 'brand', 1, true, true, true)?.[0]);
  let footerLinks = $state<SiteLink[]>(prepSiteLinks(siteLinks, 'footer', 1, true, true, true));

  const headerLinksIni = prepSiteLinks(siteLinks, 'header', 2, true, true, true);
  let headerLinks = $state<SiteLink[]>(headerLinksIni);
  let sidebarLinks = $state<SiteLink[]>([
    ...headerLinksIni, // Show header links in the sidebar
    ...prepSiteLinks(siteLinks, 'sidebar', 2, true, true, true)
  ]);

  onMount(async () => {
    const mypath = import.meta.url;
    await Promise.all([
      ...loadSiteLinks([brandLink], mypath),
      ...loadSiteLinks(headerLinks, mypath),
      ...loadSiteLinks(footerLinks, mypath),
      ...loadSiteLinks(sidebarLinks, mypath)
    ]);
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
    themes
  });

  type MenuEvent = CustomEvent<{
    value: string;
    option: MenuOption;
  }>;
  function onMenuSelected(e: MenuEvent, links: SiteLink[]) {
    const value = e?.detail?.value;
    if (value) {
      const link = links.filter((l) => l.href === value)?.[0];
      if (link) {
        window.open(link?.href || '', link.target || '_self');
      }
    }
  }
</script>

<ThemeInit />

<!-- <div class="app"> -->

<!-- <AppLayout areas="'header header' 'aside main'"> -->
<AppLayout>
  <svelte:fragment slot="nav">
    <!-- Nav menu -->
    {#each sidebarLinks as link}
      <NavItem text={link.title} currentUrl={$page.url} path={link.href} />
    {/each}
  </svelte:fragment>

  <!-- <AppBar title="Example"> -->
  <AppBar {title} class="bg-primary text-primary-content">
    <div slot="title" class="ml-0 inline-flex text-lg font-medium">
      <!-- Emulate AppBar default title slot, with added Branding / Logo Button -->
      <!-- <ListItem title="Example" subheading="Page" /> -->
      {#if brandLink}
        <Button
          icon={brandLink.img_icon ?? brandLink.img_html ?? brandLink.img_src}
          href={brandLink.href ?? siteUrl ?? websiteUrl}
          class="mr-2 p-3"
        ></Button>
      {/if}
      {#if typeof title === 'string' || typeof title === 'number'}
        {title}
      {:else}
        <Breadcrumb items={title} class="flex-nowrap gap-2">
          <span slot="item" class="text-nowrap last:truncate" let:item>{item}</span>
        </Breadcrumb>
      {/if}
    </div>

    <!-- <div slot="title">
        <ListItem title="Example" subheading="Page" />
      </div> -->

    <div slot="actions" class="flex gap-0">
      <!-- App actions main sections on large screen -->
      {#if $lgScreen}
        {#each headerLinks as link, i}
          <Button
            class={isActive($page.url, link.href ?? '')
              ? '[--bg-color:theme(colors.surface-content/20%)]'
              : ''}
            href={link.href}
          >
            {link.title}
          </Button>
        {/each}
      {:else}
        <!-- App actions main sections Menu on small screen -->
        <MenuButton
          icon={mdiDotsGrid}
          menuIcon={null}
          iconOnly={true}
          options={headerLinks.map((l) => ({
            label: l?.title,
            value: l?.href,
            icon: l?.img_icon ?? l?.img_html ?? l?.img_src
          }))}
          on:change={(e: MenuEvent) => onMenuSelected(e, headerLinks)}
        >
          <span slot="selection" class="hidden"></span>
        </MenuButton>
      {/if}

      <!-- App actions on large screen-->
      {#if $lgScreen}
        {#each footerLinks as link}
          <Tooltip
            title={link?.prefix + ' ' + link?.title + ' ' + link?.suffix}
            placement="left"
            offset={2}
          >
            <!-- Hand-craft Button, span, Icon to use our custom component/svg -->
            <Button href={link?.href} class="p-2" target="_blank">
              <span>
                {#if link?.img_icon}
                  <Icon data={link?.img_icon} />
                {:else if link?.img_component}
                  <Icon>
                    <svelte:component this={link?.img_component} />
                    <!-- class="Icon inline-block flex-shrink-0 fill-current pointer-events-none" -->
                  </Icon>
                {:else if link?.img_html}
                  <Icon>
                    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                    {@html link?.img_html}
                  </Icon>
                {:else if link?.img_src}
                  <Icon>
                    <img
                      src={link.img_src}
                      alt={link?.img_alt ?? ''}
                      aria-hidden="true"
                      role="presentation"
                    />
                  </Icon>
                {/if}
              </span>
            </Button>
          </Tooltip>
        {/each}
      {/if}

      <ThemeSelect lightThemes={['light']} darkThemes={['dark']} />
      <div class="inline-flex h-auto items-center">
        <!-- Fixer div for ThemeSwitch to properly center vertically -->
        <ThemeSwitch />
      </div>
      {#if !$lgScreen}
        <!-- App actions Menu on small screen -->
        <MenuButton
          icon={mdiDotsVertical}
          menuIcon={null}
          iconOnly={true}
          options={footerLinks.map((l) => ({
            label: l?.title,
            value: l?.href,
            icon: l?.img_icon ?? l?.img_html ?? l?.img_src
          }))}
          on:change={(e: MenuEvent) => onMenuSelected(e, footerLinks)}
        >
          <span slot="selection" class="hidden"></span>
        </MenuButton>
      {/if}
    </div>
  </AppBar>

  {@render children()}
</AppLayout>

<!-- </div> -->

<style lang="scss">
  /* Placeholder for styles */
</style>
