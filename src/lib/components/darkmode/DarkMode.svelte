<script lang="ts">
  // For class ColorSchemeManager to resolve properties:
  /// <reference lib="es2020" />

  import { onMount, type Snippet } from 'svelte';
  import { browser } from '$app/environment';

  let {
    htmlDarkClass,
    content
  }: {
    htmlDarkClass: string | undefined;
    content: Snippet<[typeof data]> | undefined;
  } = $props();

  const STORAGE_KEY = 'ag-color-scheme';

  class ColorSchemeManager {
    w: Window | undefined;
    d: Document | undefined;
    htmlDarkClass: string | undefined;
    // w = undefined;
    // d = undefined;
    private constructor(_window: Window, _document: Document, _htmlDarkClass: string | undefined) {
      this.w = _window;
      this.d = _document;
      this.htmlDarkClass = _htmlDarkClass;
      this.setColorScheme(this.getSavedOrDefaultColorScheme());
    }

    static getInstance(_window: Window, _document: Document, _htmlDarkClass: string | undefined) {
      const w = _window as unknown as { colorSchemeManager: ColorSchemeManager | undefined };
      if (w && _document) {
        if (!w.colorSchemeManager) {
          w.colorSchemeManager = new ColorSchemeManager(_window, _document, _htmlDarkClass);
        }
        return w.colorSchemeManager;
      }
    }

    getSavedOrDefaultColorScheme() {
      // First checks localStorage then system preferences
      return (
        (browser && localStorage.getItem(STORAGE_KEY)) ||
        (this.w?.matchMedia('(prefers-color-scheme: dark)')?.matches ? 'dark' : 'light')
      );
    }

    setStoredColorScheme(colorScheme: string | undefined) {
      if (colorScheme && browser) {
        localStorage.setItem(STORAGE_KEY, colorScheme);
      }
    }

    getCurrentColorScheme() {
      if (this.d) {
        return this.d.firstElementChild?.getAttribute('color-scheme');
      }
    }

    setColorScheme(colorScheme: string | undefined) {
      if (colorScheme && this.d) {
        this.d.firstElementChild?.setAttribute('color-scheme', colorScheme);
        if (this.htmlDarkClass) {
          if (colorScheme == 'dark') this.d.firstElementChild?.classList.add(this.htmlDarkClass);
          else this.d.firstElementChild?.classList.remove(this.htmlDarkClass);
        }
      }
    }
  }

  // data passed to the snippet
  let data = $state({
    isDarkMode: false,
    onChange: () => {
      // Current color mode change event, passed through data so snippet can use it
      const setTheme = data.isDarkMode ? 'dark' : 'light';
      colorSchemeManager?.setColorScheme(setTheme);
      // Update the store (only from user choice)
      colorSchemeManager?.setStoredColorScheme(setTheme);
    }
  });

  let colorSchemeManager: ColorSchemeManager | undefined;
  let isMounted = $state(false); // Hide theme controls until fully mounted.
  onMount(async () => {
    colorSchemeManager = ColorSchemeManager.getInstance(window, document, htmlDarkClass);
    const setTheme = colorSchemeManager?.getSavedOrDefaultColorScheme();
    data.isDarkMode = setTheme === 'dark';
    colorSchemeManager?.setColorScheme(setTheme);
    isMounted = true;
  });
</script>

<svelte:head>
  <meta name="htmlDarkClass" content={htmlDarkClass} />
  <script lang="ts">
    // To avoid "Flash of White", we start theme loading as soon as document head using <svelte:head>
    // TODO: (when needed) For even better UX, implement cookie-based store and ssr / server-side rendering with light/dark mode.

    if (document) {
      // Only run this on the client, NOT in SSR mode.
      // Unfortunately we can't reuse ColorSchemeManager here (it's inaccessible).
      // So we replicate 2 necessary methods here.
      const STORAGE_KEY = 'ag-color-scheme';
      function getSavedOrDefaultColorScheme() {
        // First checks localStorage then system preferences
        return (
          localStorage.getItem(STORAGE_KEY) ||
          (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        );
      }
      function setColorScheme(colorScheme: string | undefined) {
        if (colorScheme && document) {
          const htmlDarkClass = document
            .querySelector('meta[name=htmlDarkClass]')
            ?.getAttribute('content'); // Work around Svelte not passing variables into <svelte:head><script>.
          document.firstElementChild?.setAttribute('color-scheme', colorScheme);
          if (htmlDarkClass) {
            if (colorScheme == 'dark') document.firstElementChild?.classList.add(htmlDarkClass);
            else document.firstElementChild?.classList.remove(htmlDarkClass);
          }
        }
      }
      setColorScheme(getSavedOrDefaultColorScheme());
    }
  </script>
</svelte:head>

{#if isMounted}
  {#if content}
    {@render content(data)}
  {:else}
    <label>
      <!-- Snippet Fallback -->
      {data.isDarkMode ? '🔆' : '🌙'}
      <!-- <Input id="c2" type="switch" label={data.isDarkMode ? '🔆' : '🌙'} checked={data.isDarkMode} onchange={onChange} /> -->
      <input id="c3" type="checkbox" bind:checked={data.isDarkMode} onchange={data.onChange} />
    </label>
  {/if}
{/if}
