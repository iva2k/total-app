<script lang="ts">
  import SEO from '$lib/components/seo/SEO.svelte';
  import website from '$lib/config/website';
  const { author, siteUrl } = website;
  const pageTitle = 'Home';
  const pageCaption = 'Home page';

  import {
    ogSquareImageSrc,
    ogImageSrc,
    twitterImageSrc,
    featuredImageSrc,
    altDescription
  } from '$lib/assets/home/index';

  import Counter from '$lib/components/counter/Counter.svelte';
  import welcome from '$lib/images/svelte-welcome.webp';
  import welcome_fallback from '$lib/images/svelte-welcome.png';
  const welcomeSize = { width: 2048, height: 495 };

  const breadcrumbs = [
    {
      name: pageTitle,
      slug: ''
    }
  ];
  // let pageCaption = description;

  const featuredImageAlt = altDescription;
  const featuredImage = {
    url: featuredImageSrc,
    alt: featuredImageAlt,
    width: 672,
    height: 448,
    caption: pageCaption
  };
  const ogImage = {
    url: ogImageSrc,
    alt: featuredImageAlt
  };
  const ogSquareImage = {
    url: ogSquareImageSrc,
    alt: featuredImageAlt
  };
  const twitterImage = {
    url: twitterImageSrc,
    alt: featuredImageAlt
  };

  const entityMeta = {
    url: `${siteUrl}/`,
    faviconWidth: 512,
    faviconHeight: 512,
    caption: author
  };

  const seoProps = {
    pageTitle,
    pageCaption,
    slug: '',
    entityMeta,
    datePublished: '2022-12-09T16:06:55.000Z', // ISO8601 (new Date()).toISOString()
    lastUpdated: '2022-12-09T16:06:55.000Z', // ISO8601 (new Date()).toISOString()
    breadcrumbs,

    // Change default images:
    featuredImage,
    ogImage,
    ogSquareImage,
    twitterImage,

    // since no `article: true`, we have to explicitly turn on meta objects:
    useOpenGraph: true,
    useTwitter: true,
    useSchemaOrg: true
  };
</script>

<SEO {...seoProps} />

<section>
  <h1>
    <span class="welcome">
      <picture>
        <source
          width={welcomeSize.width}
          height={welcomeSize.height}
          srcset={welcome}
          type="image/webp"
        />
        <img
          loading="lazy"
          decoding="async"
          width={welcomeSize.width}
          height={welcomeSize.height}
          data-src={welcome_fallback}
          src=""
          alt="Welcome"
        />
      </picture>
    </span>

    to your new<br />SvelteKit app
  </h1>

  <h2>
    try editing <strong>src/routes/+page.svelte</strong>
  </h2>

  <Counter />
</section>

<style lang="scss">
  section {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    flex: 0.6;
  }

  h1 {
    width: 100%;
  }

  .welcome {
    display: block;
    position: relative;
    width: 100%;
    height: 0;
    padding: 0 0 calc(100% * 495 / 2048) 0;
  }

  .welcome img {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    display: block;
  }
</style>
