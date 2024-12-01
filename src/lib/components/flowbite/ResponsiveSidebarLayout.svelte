<script lang="ts">
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  page; // TODO: (when issue fixed) Replace a hacky patch to fix <https://github.com/sveltejs/eslint-plugin-svelte/issues/652>
  import { afterNavigate } from '$app/navigation';
  import {
    Sidebar,
    SidebarGroup,
    SidebarItem,
    SidebarWrapper,
    SidebarDropdownWrapper
  } from 'flowbite-svelte';
  import { onMount, type Snippet } from 'svelte';
  // import type { Writable } from 'svelte/store';
  import { ChevronDownOutline, ChevronUpOutline } from 'flowbite-svelte-icons';

  import { loadSiteLinks, prepSiteLinks } from '$lib/config/configUtils';
  import website from '$lib/config/website';
  const { siteLinks } = website;

  let { content } = $props<{ content: Snippet }>();
  // export let data;
  // console.log('posts: ', data);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const posts: Record<string, any[]> = {}; // data.posts || {};

  let _drawerHidden = useState<boolean>('drawerHidden');

  const closeDrawer = () => {
    _drawerHidden.value = true;
  };

  const names_mapping: Record<string, string> = {
    pages: 'Getting Started'
  };

  const fileDir = (path: string) => path.split('/').slice(0, -1).pop() ?? '';
  const trimRightSlash = (input: string) => (input.endsWith('/') ? input.slice(0, -1) : input);

  let ssrPathname = $derived(useState<string>('ssrPathname')?.value ?? '');
  let pathname = $derived(trimRightSlash(browser ? ($page.url?.pathname ?? '') : ssrPathname));
  let activeMainSidebar = $state<string>();

  import { type SiteLink } from '$lib/types';
  import { useState } from '$lib/utils/state.svelte';
  let headerLinks: SiteLink[] = $state<SiteLink[]>(
    prepSiteLinks(siteLinks, 'header', 2, true, /* flatten */ true, /* prune */ true)
  );

  onMount(async () => {
    const mypath = import.meta.url;
    await Promise.all(loadSiteLinks(headerLinks, mypath));
    // console.log('DEBUG: headerLinks=%o', headerLinks);
  });

  afterNavigate((navigation) => {
    // this fixes https://github.com/themesberg/flowbite-svelte/issues/364
    document.getElementById('svelte')?.scrollTo({ top: 0 });
    closeDrawer();

    activeMainSidebar = trimRightSlash(navigation.to?.url.pathname ?? '');

    const key = fileDir(activeMainSidebar);
    for (const k in dropdowns) dropdowns[k] = false;
    dropdowns[key] = true;
  });

  let spanClass = '';
  let spanClassHeaderLinks = '';
  // let spanClassHeaderLinks = 'w-full text-sm font-semibold tracking-wide uppercase hover:text-primary-700 dark:hover:text-primary-600 text-gray-900 dark:text-white';
  let nonActiveClass =
    'transition-colors duration-200 relative flex items-center flex-wrap font-medium hover:text-gray-900 hover:cursor-pointer text-gray-500 dark:text-gray-400 dark:hover:text-white';
  let activeClass =
    'relative flex items-center flex-wrap font-medium cursor-default text-primary-700 dark:text-primary-700';

  let dropdowns = Object.fromEntries(Object.keys(posts).map((x) => [x, false]));
</script>

<Sidebar
  class={_drawerHidden.value ? 'hidden' : undefined}
  {nonActiveClass}
  {activeClass}
  activeUrl={pathname}
  asideClass="fixed inset-0 z-30 flex-none h-full w-64 lg:static lg:h-auto border-e border-gray-200 dark:border-gray-600 lg:overflow-y-visible lg:pt-0 lg:block bg-white dark:bg-gray-900"
>
  <h4 id="sidebar-label" class="sr-only">Browse docs</h4>
  <SidebarWrapper
    divClass="overflow-y-auto px-4 pt-20 lg:pt-0 h-full scrolling-touch max-w-2xs lg:h-[calc(100vh-8rem)] lg:block dark:bg-gray-900 lg:me-0 lg:sticky top-20"
  >
    <nav class="text-base font-normal lg:text-sm">
      <SidebarGroup ulClass="list-unstyled fw-normal small mb-4">
        {#each Object.entries(posts) as [key, values] (key)}
          <SidebarDropdownWrapper
            bind:isOpen={dropdowns[key]}
            label={names_mapping[key] ?? key}
            ulClass="space-y-2.5"
            btnClass="flex items-center justify-between w-full my-4 text-sm font-semibold tracking-wide uppercase hover:text-primary-700 dark:hover:text-primary-600"
            spanClass=""
            class={dropdowns[key]
              ? 'text-primary-700 dark:text-primary-700'
              : 'text-gray-900 dark:text-white'}
          >
            <ChevronDownOutline slot="arrowdown" class="h-6 w-6 text-gray-800 dark:text-white" />
            <ChevronUpOutline slot="arrowup" class="h-6 w-6 text-gray-800 dark:text-white" />
            {#each values as { meta, path }}
              {@const href = key === 'icons' ? `/${key}${path}` : `/docs/${key}${path}`}
              {#if meta}
                <SidebarItem label={meta.component_title} {href} {spanClass} />
              {/if}
            {/each}
          </SidebarDropdownWrapper>
        {/each}

        {#each headerLinks as link}
          <SidebarItem label={link.title} href={link.href} spanClass={spanClassHeaderLinks} />
        {/each}
      </SidebarGroup>
    </nav>
  </SidebarWrapper>
</Sidebar>

<div
  hidden={_drawerHidden.value}
  class="fixed inset-0 z-20 bg-gray-900/50 dark:bg-gray-900/60"
  onclick={closeDrawer}
  onkeydown={closeDrawer}
  role="presentation"
></div>

<main class="w-full min-w-0 flex-auto lg:static lg:max-h-full lg:overflow-visible">
  {@render content()}
</main>
