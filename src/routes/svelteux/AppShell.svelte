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
    NavItem,
    ThemeInit,
    ThemeSelect,
    ThemeSwitch,
    Tooltip,
    lgScreen
  } from 'svelte-ux';
  import { isActive } from 'svelte-ux/utils/routing';
  import { mdiArrowTopRight, mdiDotsVertical, mdiGithub, mdiTwitter, mdiRefresh } from '@mdi/js';
  //   import { faUser } from '@fortawesome/free-solid-svg-icons';
  import logo from '$lib/images/logo.svg?raw';

  import './styles.css';

  import website from '$lib/config/website';
  const { siteLinks, siteNav, websiteUrlBase } = website;

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
  // let title = 'Example';
  let title = ['Total App', 'Svelte UX', 'Section'];
</script>

<ThemeInit />

<!-- <div class="app"> -->

<!-- <AppLayout areas="'header header' 'aside main'"> -->
<AppLayout>
  <svelte:fragment slot="nav">
    <!-- Nav menu -->
    {#each siteNav as item}
      <NavItem text={item.title} currentUrl={$page.url} path={item.href} />
    {/each}
  </svelte:fragment>

  <!-- <AppBar title="Example"> -->
  <AppBar {title} class="bg-primary text-primary-content">
    <div slot="title" class="ml-0 inline-flex text-lg font-medium">
      <!-- <ListItem title="Example" subheading="Page" /> -->
      <Button icon={logo} href={websiteUrlBase} class="mr-2 p-3"></Button>
      {#if typeof title === 'string' || typeof title === 'number'}
        {title}
      {:else}
        <Breadcrumb items={title} class="inline-flex gap-2" />
      {/if}
    </div>

    <!-- <div slot="title">
        <ListItem title="Example" subheading="Page" />
      </div> -->

    <div slot="actions" class="flex gap-0">
      <!-- App actions main sections-->
      {#each siteNav as item, i}
        <Button
          variant1={isActive($page.url, item.href) ? 'fill-light' : undefined}
          class={isActive($page.url, item.href)
            ? '[--bg-color:theme(colors.surface-content/20%)]'
            : ''}
          href={item.href}
        >
          {item.title}
        </Button>
      {/each}

      <!-- App actions on large screen-->
      {#if $lgScreen}
        {#each siteLinksLoaded as link}
          <Tooltip
            title={link?.prefix + ' ' + link?.title + ' ' + link?.suffix}
            placement="left"
            offset={2}
          >
            <!-- Hand-craft Button, span, Icon to use our custom component/svg -->
            <Button href={link.href} class="p-2" target="_blank">
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
      <ThemeSwitch />
      {#if !$lgScreen}
        <!-- App actions Menu on small screen -->
        <MenuButton
          icon={mdiDotsVertical}
          menuIcon={null}
          iconOnly={true}
          options={siteLinksLoaded.map((l) => ({
            label: l?.title,
            value: l?.href,
            icon: l?.img_icon ?? l?.img_html ?? l?.img_src
          }))}
          onchange={(e) => {
            e?.detail?.value && window.open(e.detail.value || '', '_blank');
          }}
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
