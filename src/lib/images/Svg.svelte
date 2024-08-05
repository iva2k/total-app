<script lang="ts">
  import { onMount } from 'svelte';
  //   import Svg from './svelte-logo.svg?component';
  let { file, alt }: { file: string; alt?: string } = $props();
  let Svg = $state<string>();
  onMount(async () => {
    Svg = (await import(/* @vite-ignore */ file)).default;
  });
</script>

<img src={Svg ?? ''} {alt} aria-hidden="true" role="presentation" />
