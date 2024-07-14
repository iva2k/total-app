<script lang="ts">
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import PureHeader from './PureHeader.svelte';
  $: pathname = browser ? ($page.url.pathname ?? '') : '';
</script>

<div>
  <PureHeader {pathname}><slot /></PureHeader>
</div>
