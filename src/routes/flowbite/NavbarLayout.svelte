<script lang="ts">
  import { page } from '$app/stores';
  import { onMount, setContext } from 'svelte';
  import { writable, type Writable } from 'svelte/store';
  import { DarkMode, Navbar, NavBrand, NavHamburger, NavLi, NavUl, Tooltip } from 'flowbite-svelte';

  import website from '$lib/config/website';
  import { getSiteLinksComponents } from '$lib/config/configUtils';
  const { siteLinks, siteNav } = website;

  //   import DocBadge from '../utils/DocBadge.svelte';
  //   import Discord from '../utils/icons/Discord.svelte';
  //   import GitHub from '../utils/icons/GitHub.svelte';
  //   import YouTube from '../utils/icons/YouTube.svelte';
  import ToolbarLink from './ToolbarLink.svelte';
  //   import AlgoliaSearch from '../utils/AlgoliaSearch.svelte';

  let isHomePage: boolean;
  $: isHomePage = $page.route.id === '/';
  const version = '0.0.0'; // TODO: (when needed) Implement: version = __VERSION__;
  $: activeUrl = $page.url.pathname;
  let logo = '/favicon.svg';
  let divClass = 'w-full ms-auto lg:block lg:w-auto order-1 lg:order-none';
  let ulClass =
    'flex flex-col py-3 my-4 lg:flex-row lg:my-0 text-sm font-medium text-gray-900 dark:text-gray-300 gap-4';

  const drawerHiddenStore: Writable<boolean> = writable<boolean>(true);
  setContext('drawer', drawerHiddenStore);

  setContext('testC', 'test for textContext');

  const toggleDrawer = () => {
    drawerHiddenStore.update((state) => !state);
  };

  import { type SiteLink } from '$lib/types';
  // let siteLinksLoaded = $state<SiteLink[]>([]);
  let siteLinksLoaded: SiteLink[] = [];
  onMount(async () => {
    // Workaround until https://github.com/sveltejs/kit/issues/2664 is fixed
    if (typeof window !== 'undefined' && window.location.hash) {
      const deepLinkedElement = document.getElementById(window.location.hash.substring(1));

      if (deepLinkedElement) {
        window.setTimeout(() => deepLinkedElement.scrollIntoView(), 100);
      }
    }

    const mypath = import.meta.url;
    siteLinksLoaded = await getSiteLinksComponents(siteLinks, mypath);
    console.log('DEBUG: siteLinksLoaded=%o', siteLinksLoaded);
  });
</script>

<header
  class="sticky top-0 z-40 mx-auto w-full flex-none border-b border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-800"
>
  <Navbar
    color="default"
    fluid
    class="py-1.5 {isHomePage ? 'mx-auto max-w-7xl lg:px-0' : ''}"
    let:toggle
  >
    <span hidden={$page.route.id === '/'}>
      <NavHamburger onClick={toggleDrawer} class="m-0 me-3 md:block lg:hidden" />
    </span>
    <NavBrand href="/">
      <img src={logo} class="me-3 h-8" alt="Flowbite Svelte Logo" />
      <span
        class="self-center whitespace-nowrap text-2xl font-semibold text-gray-900 dark:text-white"
      >
        Flowbite Svelte
      </span>
    </NavBrand>

    <!-- {#if !isHomePage}
      <AlgoliaSearch />
    {:else}
      <div id="home">
        <AlgoliaSearch />
      </div>
    {/if} -->

    <NavUl
      {divClass}
      {ulClass}
      {activeUrl}
      onclick={() => setTimeout(toggle, 1)}
      nonActiveClass="md:!ps-3 md:!py-2 lg:!ps-0 text-gray-700 hover:bg-gray-100 lg:hover:bg-transparent lg:border-0 lg:hover:text-primary-700 dark:text-gray-400 lg:dark:text-white lg:dark:hover:text-primary-700 dark:hover:bg-gray-700 dark:hover:text-white lg:dark:hover:bg-transparent"
      activeClass="md:!ps-3 md:!py-2 lg:!ps-0 text-white bg-primary-700 lg:bg-transparent lg:text-primary-700 lg:dark:text-primary-700 dark:bg-primary-600 lg:dark:bg-transparent cursor-default"
    >
      {#each siteNav as page}
        <NavLi class="lg:mb-0 lg:px-2" href={page.href}>{page.title}</NavLi>
      {/each}
    </NavUl>

    <div class="ms-auto flex items-center">
      {#each siteLinksLoaded as link, i}
        <ToolbarLink
          class="hidden hover:text-gray-900 focus:ring-0 dark:hover:text-white sm:inline-block"
          name={link.title}
          href={link.href}
        >
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
        </ToolbarLink>

        <span>
          {link?.prefix ?? ''}
          <a href={link.href}>
            {#if link?.title}
              <span>{link.title}</span>
            {/if}
          </a>
          {link?.suffix ?? ''}
        </span>
      {/each}

      <!-- <ToolbarLink
        class="hidden hover:text-gray-900 focus:ring-0 dark:hover:text-white sm:inline-block"
        name="View on GitHub"
        href="https://github.com/themesberg/flowbite-svelte"
      >
        <GitHub />
      </ToolbarLink>
      <ToolbarLink
        class="hidden hover:text-gray-900 focus:ring-0 dark:hover:text-white xl:inline-block"
        name="Join community on Discord"
        href="https://discord.gg/4eeurUVvTy"
      >
        <Discord />
      </ToolbarLink>
      <ToolbarLink
        class="hidden hover:text-gray-900 focus:ring-0 dark:hover:text-white xl:inline-block"
        name="Subscribe to YouTube channel"
        href="https://www.youtube.com/channel/UC_Ms4V2kYDsh7F_CSsHyQ6A"
      >
        <YouTube />
      </ToolbarLink> -->
      <DarkMode size="lg" class="inline-block hover:text-gray-900 dark:hover:text-white" />
      <Tooltip class="dark:bg-gray-900" placement="bottom-end">Toggle dark mode</Tooltip>
    </div>
    <!-- <a href="https://www.npmjs.com/package/flowbite-svelte" class="hidden sm:block">
      <DocBadge
        large
        class="ms-2 hover:bg-primary-600 hover:text-white dark:hover:bg-primary-800 dark:hover:text-white xl:ms-6"
      >
        v{version}
      </DocBadge>
    </a> -->

    <NavHamburger
      on:click={toggle}
      class="m-0 ms-3 md:block lg:hidden {isHomePage ? '' : 'hidden'}"
    />
  </Navbar>
</header>

<div class="w-full dark:bg-gray-900 lg:flex">
  <slot />
</div>
