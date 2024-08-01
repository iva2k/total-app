<script lang="ts">
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  page; // TODO: (when issue fixed) Replace a hacky patch to fix <https://github.com/sveltejs/eslint-plugin-svelte/issues/652>
  import { useState } from '$lib/utils/state.svelte';
  let ssrPathname = $derived(useState<string>('ssrPathname')?.value ?? '');
  let pathname = $derived(browser ? ($page.url?.pathname ?? '') : ssrPathname);
  let error = $derived((browser && $page?.error) || { message: '(checking error...)' });
  let status = $derived((browser && $page?.status) || '___');
  let title = $derived(`${status}: ${error.message}`);

  // let nav = $derived(browser ? navigator : null);
  // When we're pre-rendering this page on server, we know isNavOnline=true since the pre-rendered page gets to the browser.
  // Except when it is in PWS offline cache. // TODO: (when needed) Figure out how to change SSR for PWA caching vs. SSR for direct display
  let isNavOnline = $derived(!browser || ((navigator && navigator?.onLine) ?? false));
  let isOnline = $derived(isNavOnline && status !== 500);

  function onRetry() {
    console.log('DEBUG: onRetry()');
    // TODO: (now) Retry $page.url.href
  }
</script>

<svelte:head>
  <title>{title}</title>
</svelte:head>

<h1>{title}</h1>

<p>Page <strong>{pathname}</strong> {error.message}.</p>

{#if !isOnline}
  <p>No Internet connection found. Requested feature requires Internet connection.</p>
  <p>Please connect to the Internet.</p>

  <div>
    <button onclick={onRetry}>Retry</button>
  </div>
{/if}

{#if true}
  <p>Navigator online: {isNavOnline}</p>
{/if}

{#if true}
  <p>This is `src/routes/+error.svelte` file.</p>
{/if}
