<script lang="ts">
  import { type Snippet } from 'svelte';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  page; // TODO: (when issue fixed) Replace a hacky patch to fix <https://github.com/sveltejs/eslint-plugin-svelte/issues/652>
  import PureHeader from './PureHeader.svelte';

  let { rightCorner }: { rightCorner: Snippet } = $props();
  import { useState } from '$lib/utils/state.svelte';
  let ssrPathname = $derived(useState<string>('ssrPathname')?.value ?? '');
  let pathname = $derived(browser ? ($page.url?.pathname ?? '') : ssrPathname);
</script>

<div>
  <PureHeader {pathname} {rightCorner}></PureHeader>
</div>
