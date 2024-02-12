<script lang="ts">
  import { page } from '$app/stores';
  import PureHeader from './PureHeader.svelte';
</script>

<div>
  <!-- TODO: (when fixed) Remove eslint-disable -->
  <!-- eslint-disable-next-line svelte/valid-compile -->
  <PureHeader pathname={$page.url.pathname}><slot /></PureHeader>
</div>
