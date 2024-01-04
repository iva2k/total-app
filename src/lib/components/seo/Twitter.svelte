<script lang="ts">
  import type { ImageResource } from '$lib/types';

  export let article = false;
  export let author: string;
  export let twitterUsername: string | undefined;
  export let image: ImageResource;
  export let timeToRead = 0;

  // When there is an equivalent og tag present, Twitter takes that.
  // If OG is not used, or Twitter tags should be different, set doOgOverride = true
  export let doOgOverride = false;

  // The following tags will be added only if doOgOverride=true:
  export let metadescription = '';
  export let pageTitle = '';
  export let url = '';
</script>

<svelte:head>
  <meta name="twitter:card" content="summary_large_image" />
  {#if doOgOverride}
    {#if pageTitle}
      <meta name="twitter:title" content={pageTitle} />
    {/if}
    {#if metadescription}
      <meta name="twitter:description" content={metadescription} />
    {/if}
    {#if url}
      <meta name="twitter:url" content={url} />
    {/if}
  {/if}
  {#if image}
    <meta name="twitter:image" content={image.url} />
    {#if image.alt}
      <meta name="twitter:image:alt" content={image.alt} />
    {/if}
  {/if}
  {#if twitterUsername}
    <meta name="twitter:creator" content={`@${twitterUsername}`} />
    <meta name="twitter:site" content={`@${twitterUsername}`} />
  {/if}
  {#if author}
    <meta name="twitter:label1" content="Written by" />
    <meta name="twitter:data1" content={author} />
  {/if}
  {#if article && timeToRead > 0}
    <meta name="twitter:label2" content="Est. reading time" />
    <meta name="twitter:data2" content={timeToRead !== 1 ? `${timeToRead} minutes` : '1 minute'} />
  {/if}
</svelte:head>
