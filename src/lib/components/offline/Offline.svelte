<script lang="ts">
  import { pwaInfo } from 'virtual:pwa-info';
  // Svelte4, 5 pre next.143: import { onMount, type ComponentType, type SvelteComponent } from 'svelte';
  import { onMount, type Component } from 'svelte';

  import website from '$lib/config/website';
  const { themeColor } = website;

  // replaced dynamically
  // const date = '__DATE__';
  // const enableSwDev = '__SW_DEV__';

  // let ReloadPrompt = $state<ComponentType<SvelteComponent> | undefined>(undefined);
  let ReloadPrompt = $state<Component | undefined>(undefined);
  onMount(async () => {
    if (pwaInfo) {
      ReloadPrompt = (await import('$lib/components/reloadprompt/ReloadPrompt.svelte')).default;
    }
  });

  let webManifestLink = $derived(pwaInfo ? pwaInfo.webManifest.linkTag : '');
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
