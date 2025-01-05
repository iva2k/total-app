<script lang="ts">
  import type { Session } from '@auth/core/types';
  import { type Snippet } from 'svelte';
  import { browser } from '$app/environment';

  import { page } from '$app/stores';
  page; // TODO: (when issue fixed) Replace a hacky patch to fix <https://github.com/sveltejs/eslint-plugin-svelte/issues/652>
  import PureAppShell from './PureAppShell.svelte';
  import { useState } from '$lib/utils/state.svelte';

  // let title_default = siteTitle;
  // let title_default = siteShortTitle;
  let title_default = undefined;
  const themes_default = {
    light: ['light', 'emerald', 'hamlindigo-light'],
    dark: ['dark', 'forest', 'hamlindigo-dark']
  };
  let {
    session,
    title = title_default,
    themes = themes_default,
    onSignout,
    children
  }: {
    session?: Session;
    title?: string[] | string;
    themes?: {
      light?: string[];
      dark?: string[];
    };
    onSignout: () => void;
    children: Snippet;
  } = $props();

  const trimRightSlash = (input: string) => (input.endsWith('/') ? input.slice(0, -1) : input);

  let ssrPathname = $derived(useState<string>('ssrPathname')?.value ?? '');
  let pathname = $derived(trimRightSlash(browser ? ($page.url?.pathname ?? '') : ssrPathname));
</script>

<div>
  <PureAppShell {pathname} {session} {title} {themes} {onSignout} {children}></PureAppShell>
</div>
