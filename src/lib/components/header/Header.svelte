<script lang="ts">
  import { getContext, type Snippet } from 'svelte';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import PureHeader from './PureHeader.svelte';
  import type { LayoutContext } from '$lib/types';

  let { content } = $props<{ content: Snippet }>();
  const { get: getLayout } = getContext<LayoutContext>('layout');

  // $: pathname = browser ? ($page.url.pathname ?? '') : getLayout.ssrPathname;
  let pathname = $derived(browser ? ($page.url.pathname ?? '') : getLayout().ssrPathname);
</script>

<div>
  <PureHeader {pathname}>
    {@render content()}
  </PureHeader>
</div>
