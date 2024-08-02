<script lang="ts">
  import { onMount, type Snippet } from 'svelte';
  import logo from '$lib/images/logo.svg';
  import website from '$lib/config/website';
  import { loadSiteLinks, prepSiteLinks } from '$lib/config/configUtils';
  import type { SiteLink } from '$lib/types';
  const { siteLinks } = website;

  let {
    pathname = '/',
    leftCorner,
    rightCorner
  } = $props<{
    pathname: string;
    leftCorner?: Snippet;
    rightCorner?: Snippet;
  }>();
  let path1st = $derived('/' + (pathname ?? '').split('/')[1]);

  let brandLink: SiteLink = $state<SiteLink>(
    prepSiteLinks(
      siteLinks,
      'brand',
      1,
      /* nodeFilter */ true,
      /* flatten */ true,
      /* prune */ false // Allow brand without a link
    )?.[0]
  );
  let headerLinks: SiteLink[] = $state<SiteLink[]>(
    prepSiteLinks(siteLinks, 'header', 2, true, /* flatten */ true, /* prune */ true)
  );

  onMount(async () => {
    /* DISABLED (see root +layout.svelte)
    await loadIonicPWAElements(window);
    */
    const mypath = import.meta.url;
    // [brandLink, ... headerLinks] =
    await Promise.all([
      ...loadSiteLinks([brandLink], mypath),
      ...loadSiteLinks(headerLinks, mypath)
    ]);
    console.log('DEBUG: headerLinks=%o', headerLinks);
  });
</script>

<header>
  <div class="corner corner-left">
    {#if leftCorner}
      {@render leftCorner()}
    {:else if brandLink}
      <!-- {brandLink.prefix ?? ''} -->
      <a href={brandLink.href} target={brandLink.target ?? '_self'}>
        {#if brandLink.img_component}
          <svelte:component this={brandLink.img_component} />
        {:else if brandLink.img_html}
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html brandLink.img_html}
        {:else if brandLink.img_src}
          <img
            src={brandLink.img_src}
            alt={brandLink.img_alt ?? ''}
            aria-hidden="true"
            role="presentation"
          />
        {/if}
        <!-- {#if brandLink.title}
          <span>{brandLink.title}</span>
        {/if} -->
      </a>
      <!-- {brandLink.suffix ?? ''} -->
    {/if}
  </div>

  <nav>
    <svg viewBox="0 0 2 3" aria-hidden="true">
      <path d="M0,0 L1,2 C1.5,3 1.5,3 2,3 L2,0 Z" />
    </svg>
    <ul>
      {#each headerLinks.filter((l) => l?.href) as link}
        <li aria-current={path1st === link.href ? 'page' : undefined}>
          <a href={link.href} target={brandLink.target ?? '_self'}>{link.title}</a>
        </li>
      {/each}
    </ul>
    <svg viewBox="0 0 2 3" aria-hidden="true">
      <path d="M0,0 L0,3 C0.5,3 0.5,3 1,2 L2,0 Z" />
    </svg>
  </nav>

  <div class="corner corner-right">
    {#if rightCorner}
      {@render rightCorner()}
    {/if}
  </div>
</header>

<style lang="scss">
  header {
    display: flex;
    justify-content: space-between;
  }

  .corner-left {
    width: var(--corner-left-width, '3em');
    height: 3em;
  }
  .corner-right {
    width: var(--corner-right-width, '3em');
    height: 3em;
  }

  .corner a,
  .corner :global(a) {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }

  .corner img,
  .corner :global(img) {
    width: 2em;
    height: 2em;
    object-fit: contain;
  }

  nav {
    display: flex;
    justify-content: center;
    --background: var(--color-bg-2); /* rgba(255, 255, 255, 0.7); */
  }

  svg {
    width: 2em;
    height: 3em;
    display: block;
  }

  path {
    fill: var(--background);
  }

  ul {
    position: relative;
    padding: 0;
    margin: 0;
    height: 3em;
    display: flex;
    justify-content: center;
    align-items: center;
    list-style: none;
    background: var(--background);
    background-size: contain;
  }

  li {
    position: relative;
    height: 100%;
  }

  li[aria-current='page']::before {
    --size: 6px;
    content: '';
    width: 0;
    height: 0;
    position: absolute;
    top: 0;
    left: calc(50% - var(--size));
    border: var(--size) solid transparent;
    border-top: var(--size) solid var(--color-theme-1);
  }

  nav a {
    display: flex;
    height: 100%;
    align-items: center;
    padding: 0 0.5rem;
    color: var(--color-text);
    font-weight: 700;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    text-decoration: none;
    transition: color 0.2s linear;
  }

  a:hover,
  a:focus,
  .corner :global(a:hover),
  .corner :global(a:focus) {
    color: var(--color-theme-1);
  }
</style>
