<script lang="ts">
  export let pngFavicons: { sizes: string; href: string; imgSize: number }[] | undefined = [];
  export let svgFavicon: string | undefined;
  export let icoFavicon: string | undefined;
  export let touchFavicons: { sizes: string; href: string; imgSize: number }[] | undefined = [];

  import { badge } from './badge.js';
  export let badgeCount = 0;
  export let badgeBackground = '#FF0000'; // Default red
  export let badgeColor = '#FFFFFF'; // Default white
</script>

<svelte:head>
  <!-- Favicon mess -->
  {#if pngFavicons}
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
  {#if touchFavicons}
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
