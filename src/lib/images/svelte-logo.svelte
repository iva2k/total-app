<script lang="ts">
  //   import Svg from './svelte-logo.svg?component';
  import Svg from './svelte-logo.svg';
  const alt = 'SvelteKit';
</script>

<img src={Svg} {alt} aria-hidden="true" role="presentation" />
