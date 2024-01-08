<script lang="ts">
  // eslint-disable-next-line import/no-unresolved
  import { pwaInfo } from 'virtual:pwa-info';
  import { onMount } from 'svelte';
  import type { ComponentType, SvelteComponent } from 'svelte';

  import website from '$lib/config/website';
  const { themeColor } = website;

  // replaced dynamically
  // const date = '__DATE__';
  // const enableSwDev = '__SW_DEV__';

  let ReloadPrompt: ComponentType<SvelteComponent> | undefined;
  onMount(async () => {
    pwaInfo &&
      (ReloadPrompt = (await import('$lib/components/reloadprompt/ReloadPrompt.svelte')).default);
  });

  $: webManifestLink = pwaInfo ? pwaInfo.webManifest.linkTag : '';
</script>

<svelte:head>
  <meta name="msapplication-TileColor" content={themeColor} />
  <meta name="theme-color" content={themeColor} />
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html webManifestLink}
</svelte:head>

{#if ReloadPrompt}
  <svelte:component this={ReloadPrompt} />
{/if}
