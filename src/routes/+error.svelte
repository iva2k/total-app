<script lang="ts">
  import { page } from '$app/stores';
  page; // TODO: (when issue fixed) Replace a hacky patch to fix <https://github.com/sveltejs/eslint-plugin-svelte/issues/652>

  const { message } = $page.error || { message: 'Oops, $page.error is null' };
  const title = `${$page.status}: ${message}`;

  let nav;
  try {
    nav = navigator;
  } catch (e) {
    console.log();
  }
  const isNavOnline = nav && nav.onLine;
  const isOnline = isNavOnline && $page?.status !== 500;

  function onRetry() {
    console.log('DEBUG: onRetry()');
    // TODO: (now) Retry $page.url.href
  }
</script>

<svelte:head>
  <title>{title}</title>
</svelte:head>

<h1>{title}</h1>

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
