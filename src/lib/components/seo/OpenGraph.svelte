<script lang="ts">
  import type { OpenGraphProps } from './common';
  let {
    article = false,
    // datePublished = '',
    // lastUpdated = '',
    // facebookAuthorPage = '',
    // facebookPage = '',
    image,
    squareImage,
    metadescription,
    ogLanguage,
    pageTitle,
    siteTitle,
    url,
    ...rest
  }: OpenGraphProps = $props();
  // This is silly, but optional props (for article=true) need some gymnastics:
  let {
    datePublished = '',
    lastUpdated = '',
    facebookAuthorPage = '',
    facebookPage = ''
  } = { ...rest };
</script>

<svelte:head>
  {#if siteTitle}
    <meta property="og:site_name" content={siteTitle} />
  {/if}
  {#if ogLanguage}
    <meta property="og:locale" content={ogLanguage} />
  {/if}
  {#if url}
    <meta property="og:url" content={url} />
  {/if}
  <meta property="og:type" content={article ? 'article' : 'website'} />
  {#if pageTitle}
    <meta property="og:title" content={pageTitle} />
  {/if}
  {#if metadescription}
    <meta property="og:description" content={metadescription} />
  {/if}
  {#if image}
    <meta property="og:image" content={image.url} />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="627" />
    {#if image.alt}
      <meta property="og:image:alt" content={image.alt} />
    {/if}
  {/if}
  {#if squareImage}
    <meta property="og:image" content={squareImage.url} />
    <meta property="og:image:width" content="400" />
    <meta property="og:image:height" content="400" />
    {#if squareImage.alt}
      <meta property="og:image:alt" content={squareImage.alt} />
    {/if}
  {/if}
  {#if article}
    {#if facebookPage}
      <meta property="article:publisher" content={facebookPage} />
    {/if}
    {#if facebookAuthorPage}
      <meta property="article:author" content={facebookAuthorPage} />
    {/if}
    {#if datePublished}
      <meta property="article:published_time" content={datePublished} />
    {/if}
    {#if lastUpdated}
      <meta property="article:modified_time" content={lastUpdated} />
    {/if}
  {/if}
</svelte:head>
