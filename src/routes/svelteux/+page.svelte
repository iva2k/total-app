<script lang="ts">
  import { Button } from 'svelte-ux';
  import { showToast } from '$lib/services/toastService';

  let clickCounter = $state(0);
  function onClick(_e: MouseEvent) {
    clickCounter += 1;
    const styles = ['info', 'success', 'warning', 'error'];
    const style = styles[clickCounter % styles.length];
    showToast(`Hello world! (${style})`, style);
  }
</script>

<div>
  <p>Here comes the button:</p>
  <Button onclick={onClick}>Click Here</Button>
  {#if clickCounter > 0}
    <p>Clicked {clickCounter} times.</p>
  {/if}
</div>
