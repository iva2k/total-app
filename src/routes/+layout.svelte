<script lang="ts">
  import { onMount } from 'svelte';
  // import { defineCustomElements } from '@ionic/pwa-elements/loader';

  import Favicon from '$lib/components/favicon/Favicon.svelte';
  import Offline from '$lib/components/offline/Offline.svelte';
  import DarkMode from '$lib/components/darkmode/DarkMode.svelte';
  import Header from '$lib/components/header/Header.svelte';
  import './styles.css';
  import { loadIonicPWAElements } from '$lib/utils.cjs';
  import { BRIGHT_ENTITY, CRESCENT_MOON_ENTITY } from '$lib/constants/entities';

  import website from '$lib/config/website';
  const { githubRepo } = website;
  import GithubLogo from '$lib/images/github.svelte';
  import svelte_logo from '$lib/images/svelte-logo.svg';

  onMount(async () => {
    // await defineCustomElements(window);
    await loadIonicPWAElements(window);
  });

  let isDarkMode: boolean;

  // Favicon params:
  const pngFavicons = [
    { sizes: '32x32', href: '/favicon-32x32.png', imgSize: 32 },
    { sizes: '16x16', href: '/favicon-16x16.png', imgSize: 16 },
    { sizes: '48x48', href: '/favicon-48x48.png', imgSize: 48 },
    { sizes: '192x192', href: '/icon-192x192.png', imgSize: 192 } // For Android Devices
  ];
  const svgFavicon = undefined; // TODO: '/favicon.svg';
  const icoFavicon = undefined; // TODO: '/favicon.ico';

  const touchFavicons = [
    { sizes: '167x167', href: '/apple-icon-167x167.png', imgSize: 167 }, // For iPad
    { sizes: '180x180', href: '/apple-icon-180x180.png', imgSize: 180 } // For iPhone
  ];
</script>

<div class="app">
  <Favicon {pngFavicons} {svgFavicon} {icoFavicon} {touchFavicons} />

  <Header --corner-right-width="8em">
    <DarkMode bind:isDarkMode htmlDarkClass="dark">
      <svelte:fragment let:data>
        <label>
          {isDarkMode ? BRIGHT_ENTITY : CRESCENT_MOON_ENTITY}
          <input id="cb1" type="checkbox" checked={isDarkMode} on:change={data.onToggle} />
        </label>
      </svelte:fragment>
    </DarkMode>
  </Header>

  <main>
    <slot />
  </main>

  <Offline />

  <footer>
    <p>
      visit
      <a href={githubRepo}>
        <GithubLogo />
        <span>App GitHub Repo</span>
      </a>
      for details | visit
      <a href="https://kit.svelte.dev">
        <img src={svelte_logo} alt="SvelteKit" aria-hidden="true" role="presentation" />
        <span>kit.svelte.dev</span>
      </a>
      to learn SvelteKit
    </p>
  </footer>
</div>

<style lang="scss">
  .app {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  main {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 1rem;
    width: 100%;
    max-width: 64rem;
    margin: 0 auto;
    box-sizing: border-box;
  }

  footer {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 12px;
  }

  footer a {
    display: inline-block; /* Place link and image inline */
    text-decoration: none; /* Remove default underline for links */
    font-weight: bold;
  }
  footer a span {
    margin-top: 10px; /* Adjust the margin as needed */
  }

  footer a :global(img),
  footer a :global(svg) {
    vertical-align: middle; /* Aligns image vertically with the text */
    width: 2em;
    height: 3em;
    --fill_color: var(--color-text);
  }

  @media (min-width: 480px) {
    footer {
      padding: 12px 0;
    }
  }
</style>
