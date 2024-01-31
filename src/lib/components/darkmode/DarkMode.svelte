<script lang="ts">
  // For class ColorSchemeManager to resolve properties:
  /// <reference lib="es2020" />

  import { browser } from '$app/environment';

  export let isDarkMode = false;

  const STORAGE_KEY = 'ag-color-scheme';

  class ColorSchemeManager {
    // Note: If this throws an error, make sure lib/target in tsconfig.json is set to not "esnext", but either to "es2021" or "es2020".
    // @see related <https://github.com/sveltejs/svelte/issues/6900>
    // For ESLint ParseError issue filed: @see <https://github.com/sveltejs/eslint-plugin-svelte3/issues/137>
    // TODO: (when issue is fixed) Revert lib/target to "esnext" in tsconfig.json - <https://github.com/sveltejs/svelte/issues/6900>
    w: Window | undefined;
    d: Document | undefined;
    // w = undefined;
    // d = undefined;
    private constructor(_window: Window, _document: Document) {
      this.w = _window;
      this.d = _document;
      this.setColorScheme(this.getSavedOrDefaultColorScheme());
    }

    static getInstance(_window: Window, _document: Document) {
      const w = _window as unknown as { colorSchemeManager: ColorSchemeManager | undefined };
      if (w && _document) {
        if (!w.colorSchemeManager) {
          w.colorSchemeManager = new ColorSchemeManager(_window, _document);
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
        // For TailwindCSS darkMode: 'class'
        if (colorScheme == 'dark') this.d.firstElementChild?.classList.add('dark');
        else this.d.firstElementChild?.classList.remove('dark');
      }
    }
  }

  import { onMount } from 'svelte';

  let colorSchemeManager: ColorSchemeManager | undefined;
  let isMounted = false; // Hide theme controls until fully mounted.
  onMount(async () => {
    colorSchemeManager = ColorSchemeManager.getInstance(window, document);
    const setTheme = colorSchemeManager?.getSavedOrDefaultColorScheme();
    isDarkMode = setTheme === 'dark';
    colorSchemeManager?.setColorScheme(setTheme);
    isMounted = true;
  });

  const onToggleDarkMode = () => {
    // Toggle current color mode
    const setTheme = colorSchemeManager?.getCurrentColorScheme() === 'dark' ? 'light' : 'dark';
    isDarkMode = setTheme === 'dark';
    colorSchemeManager?.setColorScheme(setTheme);
    // Update the store (only from user choice)
    colorSchemeManager?.setStoredColorScheme(setTheme);
  };

  // Pass data to the slot
  let data = { onToggle: onToggleDarkMode };
</script>

<svelte:head>
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
          document.firstElementChild?.setAttribute('color-scheme', colorScheme);
          // For TailwindCSS darkMode: 'class'
          if (colorScheme == 'dark') document.firstElementChild?.classList.add('dark');
          else document.firstElementChild?.classList.remove('dark');
        }
      }
      setColorScheme(getSavedOrDefaultColorScheme());
    }
  </script>
</svelte:head>

{#if isMounted}
  <slot {data}>
    <!-- Slot Fallback -->
    <!-- <Input id="c2" type="switch" label={isDarkMode ? '🔆' : '🌙'} checked={isDarkMode} on:change={onToggleDarkMode} /> -->
    <label>
      {isDarkMode ? '🔆' : '🌙'}
      <input id="c3" type="checkbox" checked={isDarkMode} on:change={onToggleDarkMode} />
    </label>
  </slot>
{/if}
