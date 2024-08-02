<script lang="ts">
  import type { TwitterProps } from './common';
  let {
    article = false,
    author,
    twitterUsername,
    image,
    timeToRead = 0,

    // When there is an equivalent og tag present, Twitter takes that.
    // If OG is not used, or Twitter tags should be different, set doOgOverride = true
    doOgOverride = false,
    ...rest

    // The following tags will be added only if doOgOverride=true:
    // metadescription = '',
    // pageTitle = '',
    // url = ''
  }: TwitterProps = $props();
  // This is silly, but optional props (for doOgOverride=true) need some gymnastics:
  let { metadescription = '', pageTitle = '', url = '' } = { ...rest };
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
