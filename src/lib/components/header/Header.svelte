<script lang="ts">
  import { getContext, type Snippet } from 'svelte';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  page; // TODO: (when issue fixed) Replace a hacky patch to fix <https://github.com/sveltejs/eslint-plugin-svelte/issues/652>
  import PureHeader from './PureHeader.svelte';
  import type { LayoutContext } from '$lib/types';

  let { content } = $props<{ content: Snippet }>();
  const { get: getLayout } = getContext<LayoutContext>('layout');

  let pathname = $derived(browser ? ($page.url.pathname ?? '') : getLayout().ssrPathname);
</script>

<div>
  <PureHeader {pathname}>
    {@render content()}
  </PureHeader>
</div>
