<script lang="ts">
  import { ToolbarButton, Tooltip } from 'flowbite-svelte';

  export let name: string;
</script>

<ToolbarButton {name} size="lg" target="_blank" rel="noreferrer" {...$$restProps}>
  <slot />
</ToolbarButton>
<Tooltip class="dark:bg-gray-900" placement="bottom">{name}</Tooltip>
