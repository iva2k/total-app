<script lang="ts">
  import type { ImageResource } from '$lib/types';
  export let article = false;
  export let datePublished = '';
  export let lastUpdated = '';
  export let facebookAuthorPage = '';
  export let facebookPage = '';
  export let image: ImageResource;
  export let squareImage: ImageResource;
  export let metadescription: string;
  export let ogLanguage: string;
  export let pageTitle: string;
  export let siteTitle: string;
  export let url: string;
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
