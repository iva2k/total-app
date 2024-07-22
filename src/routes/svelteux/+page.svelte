<script lang="ts">
  import { Button } from 'svelte-ux';

  let clickCounter = $state(0);
  function onClick(e: MouseEvent) {
    clickCounter += 1;
  }
</script>

<div>
  <p>Here comes the button:</p>
  <Button onclick={onClick}>Click Here</Button>
  {#if clickCounter > 0}
    <p>Clicked {clickCounter} times.</p>
  {/if}
</div>
