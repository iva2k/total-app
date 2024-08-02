<script lang="ts">
  // TODO: (now) Redesign to use: // Per Svelte's documentation: A common pattern is to return SEO-related data from page load functions, then use it (as $page.data) in a <svelte:head> in your root layout. https://kit.svelte.dev/docs/load#$page-data

  import {
    ogSquareImageSrc,
    ogImageSrc,
    twitterImageSrc,
    featuredImageSrc,
    altDescription
  } from '$lib/assets/home/index';

  import type { ImageResource } from '$lib/types';
  import website from '$lib/config/website';
  import { VERTICAL_LINE_ENTITY } from '$lib/constants/entities';
  import OpenGraph from './OpenGraph.svelte';
  import SchemaOrg from './SchemaOrg.svelte';
  import Twitter from './Twitter.svelte';
  import { page } from '$app/stores';
  page; // TODO: (when issue fixed) Replace a hacky patch to fix <https://github.com/sveltejs/eslint-plugin-svelte/issues/652>

  import type { OpenGraphProps } from './common';

  const {
    author,
    entity,
    facebookAuthorPageName,
    facebookPageName,
    ogLanguage,
    siteLanguage,
    siteShortTitle,
    siteTitle,
    siteUrl: siteUrlConfig,
    isNetlify,
    isVercel,
    githubPage,
    linkedinProfile,
    telegramUsername,
    tiktokUsername,
    twitterUsername,
    googleSiteVerificationNetlify,
    googleSiteVerificationVercel
  } = website;

  const facebookAuthorPage = `https://www.facebook.com/${facebookAuthorPageName}`;
  const facebookPage = `https://www.facebook.com/${facebookPageName}`;

  // siteUrlConfig can be empty if `website` pulls from a missing or misconfigured .env,
  // causing all sorts of troubles, including failing build (prerender stage crashing with "/undefined/").
  // Protect ourselves:
  let siteUrl;
  if ($page.url?.origin === 'http://sveltekit-prerender') {
    // We are in prerender on the server
    siteUrl = siteUrlConfig;
  } else {
    siteUrl = siteUrlConfig || $page.url?.origin || '/';
  }

  // Mandatory properties
  export let pageTitle: string;
  export let pageCaption: string;
  export let slug: string | false = false;

  // Optional properties
  export let useTwitter: boolean | undefined = undefined;
  export let useOpenGraph: boolean | undefined = undefined;
  export let useSchemaOrg: boolean | undefined = undefined;

  export let article = false;
  export let breadcrumbs: { name: string; slug: string }[] = [];
  export let entityMeta: {
    url: string;
    faviconWidth: number;
    faviconHeight: number;
    caption?: string;
  } | null = null;
  export let lastUpdated = '';
  export let datePublished = '';
  export let timeToRead = 0;

  // imported props with fallback defaults
  export let featuredImage: ImageResource = {
    url: featuredImageSrc,
    alt: altDescription,
    width: 672,
    height: 448,
    caption: 'Home page'
  };
  export let ogImage: ImageResource = {
    url: ogImageSrc,
    alt: altDescription
  };
  export let ogSquareImage: ImageResource = {
    url: ogSquareImageSrc,
    alt: altDescription
  };
  export let twitterImage: ImageResource = {
    url: twitterImageSrc,
    alt: altDescription
  };

  // const pageTitleVeryExtended = `${siteTitle} ${VERTICAL_LINE_ENTITY} ${pageTitle}`;
  const pageTitleExtended = `${siteShortTitle} ${VERTICAL_LINE_ENTITY} ${pageTitle}`;

  // canonicalUrl tells search engine the "true" url where the page authoritatively reside.
  // If we cannot determine it, better not set it:
  const canonicalUrl = siteUrl ? (slug !== false ? `${siteUrl}/${slug}` : false) : false;
  // For other meta data canonicalUrlMust should provide something:
  const canonicalUrlMust = siteUrl ? (slug !== false ? `${siteUrl}/${slug}` : siteUrl) : '/';

  // Autodetect which SEO blocks to insert
  if (useOpenGraph === undefined) {
    useOpenGraph = !!article;
  }
  if (useTwitter === undefined) {
    useTwitter = !!article;
  }
  if (useSchemaOrg === undefined) {
    useSchemaOrg = useTwitter || !!entityMeta || !!datePublished || !!breadcrumbs;
  }

  const openGraphProps = {
    image: ogImage,
    squareImage: ogSquareImage,
    metadescription: pageCaption,
    ogLanguage,
    pageTitle: pageTitleExtended,
    siteTitle,
    url: canonicalUrlMust,
    ...(article ? { article, datePublished, lastUpdated, facebookPage, facebookAuthorPage } : {})
  } as OpenGraphProps;

  const schemaOrgProps = {
    article,
    author,
    breadcrumbs,
    datePublished,
    entity,
    lastUpdated,
    entityMeta,
    featuredImage,
    metadescription: pageCaption,
    siteLanguage,
    siteTitle,
    siteTitleAlt: siteShortTitle,
    siteUrl,
    title: pageTitleExtended,
    url: canonicalUrlMust,
    facebookPage,
    githubPage,
    linkedinProfile,
    telegramUsername,
    tiktokUsername,
    twitterUsername
  };

  const twitterProps = {
    article,
    author,
    twitterUsername,
    image: twitterImage,
    timeToRead,
    doOgOverride: false
  };

  // console.log('DEBUG: <SEO> origin=%o, $page.url.origin=%o, siteUrlConfig=%o, siteUrl=%o, $page.url.pathname=%o', origin, $page.url?.origin, siteUrlConfig, siteUrl, $page.url?.pathname);
  // console.log('DEBUG: <SEO> $page.url.origin=%o, siteUrlConfig=%o, siteUrl=%o, $page.url.pathname=%o', $page.url?.origin, siteUrlConfig, siteUrl, $page.url?.pathname);
  console.log(
    'DEBUG: <SEO> pageTitle=%o, pageTitleExtended=%o, pageCaption=%o, canonicalUrl=%o, canonicalUrlMust=%o, useOpenGraph=%o, useTwitter=%o, useSchemaOrg=%o',
    pageTitle,
    pageTitleExtended,
    pageCaption,
    canonicalUrl,
    canonicalUrlMust,
    useOpenGraph,
    useTwitter,
    useSchemaOrg
  );
</script>

<svelte:head>
  <title>{pageTitleExtended}</title>
  <meta name="description" content={pageCaption} />
  <meta
    name="robots"
    content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
  />
  {#if canonicalUrl}
    <link rel="canonical" href={canonicalUrl} />
  {/if}

  {#if isNetlify && googleSiteVerificationNetlify}
    <meta name="google-site-verification" content={googleSiteVerificationNetlify} />
  {/if}
  {#if isVercel && googleSiteVerificationVercel}
    <meta name="google-site-verification" content={googleSiteVerificationVercel} />
  {/if}
</svelte:head>

{#if useTwitter}
  <Twitter {...twitterProps} />
{/if}

{#if useOpenGraph}
  <OpenGraph {...openGraphProps} />
{/if}

{#if useSchemaOrg}
  <SchemaOrg {...schemaOrgProps} />
{/if}
