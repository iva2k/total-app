<script lang="ts">
  import { badge } from './badge.js';

  let {
    pngFavicons = [],
    svgFavicon,
    icoFavicon,
    touchFavicons = [],
    badgeCount = 0,
    badgeBackground = '#FF0000', // Default red
    badgeColor = '#FFFFFF' // Default white
  }: {
    pngFavicons?: { sizes: string; href: string; imgSize: number }[];
    svgFavicon?: string;
    icoFavicon?: string;
    touchFavicons?: { sizes: string; href: string; imgSize: number }[];
    badgeCount?: number;
    badgeBackground?: string;
    badgeColor?: string;
  } = $props();
</script>

<svelte:head>
  <!-- Favicon mess -->
  {#if pngFavicons && pngFavicons.length > 0}
    {#each pngFavicons as pngFavicon}
      <link
        use:badge={{
          imgSize: pngFavicon.imgSize,
          count: badgeCount,
          background: badgeBackground,
          color: badgeColor
        }}
        rel="icon"
        type="image/png"
        sizes={pngFavicon.sizes}
        href={pngFavicon.href}
      />
    {/each}
  {/if}

  {#if svgFavicon}
    <link rel="icon" type="image/svg+xml" sizes="any" href={svgFavicon} />
  {/if}

  {#if icoFavicon}
    <link rel="shortcut icon" type="image/x-icon" href={icoFavicon} />
  {/if}

  <!-- <link rel="shortcut icon" type="image/svg" href="%sveltekit.assets%/favicon.svg" /> -->
  {#if touchFavicons && touchFavicons.length > 0}
    {#each touchFavicons as touchFavicon}
      <link rel="apple-touch-icon" sizes={touchFavicon.sizes} href={touchFavicon.href} />
    {/each}
  {/if}

  <!-- shut off IE11 from looking for a file /browserconfig.xml -->
  <meta name="msapplication-config" content="none" />

  <!-- Pre-Safari@12-- >
  <link rel="mask-icon" href="%sveltekit.assets%/favicon.svg" color="#FFFFFF"> 
  -->
</svelte:head>
