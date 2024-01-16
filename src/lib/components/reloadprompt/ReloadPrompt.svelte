<script lang="ts">
  // eslint-disable-next-line import/no-unresolved
  import { useRegisterSW } from 'virtual:pwa-register/svelte';

  // replaced dynamically
  const buildDate = '__DATE__';
  // replaced dynamically: we need to use `JSON.parse` to allow compare to reloadSW === 'true'
  // if used with literal it will be removed, since it is evaluated at build time by sveltekit
  const reloadSW = JSON.parse('__RELOAD_SW__');
  const intervalMS = JSON.parse('__UPDATE_CHECK_PERIOD_MS__');
  /* console.log(
    'DEBUG ReloadPrompt.svelte buildDate=%o reloadSW=%o intervalMS=%o',
    buildDate,
    reloadSW,
    intervalMS
  ); /* */

  const { offlineReady, needRefresh, updateServiceWorker } = useRegisterSW({
    onRegistered(r) {
      if (reloadSW === 'true') {
        r &&
          setInterval(() => {
            console.log('Checking for sw update');
            r.update();
          }, intervalMS);
      } else {
        console.log(`SW Registered: ${r}`);
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onRegisterError(error: any) {
      console.log('SW registration error', error);
    }
  });
  const close = () => {
    offlineReady.set(false);
    needRefresh.set(false);
  };
  $: toast = $offlineReady || $needRefresh;
</script>

{#if toast}
  <div class="pwa-toast" role="alert">
    <div class="message">
      {#if $offlineReady}
        <span> App ready to work offline </span>
      {:else}
        <span> New app version available, click on "Reload" button to update. </span>
      {/if}
    </div>
    {#if $needRefresh}
      <button on:click={() => updateServiceWorker(true)}> Reload </button>
      <button on:click={close}> Postpone </button>
    {:else}
      <button on:click={close}> Got It </button>
    {/if}
  </div>
{/if}

<div class="pwa-date">
  {buildDate}
</div>

<style lang="scss">
  .pwa-date {
    visibility: hidden;
  }
  .pwa-toast {
    position: fixed;
    right: 0;
    bottom: 0;
    margin: 16px;
    padding: 12px;
    border: 1px solid #8885;
    border-radius: 4px;
    z-index: 2;
    text-align: left;
    box-shadow: 3px 4px 5px 0 #8885;
    background-color: var(--color-bg-2);
    color: var(--color-text);
  }
  .pwa-toast .message {
    margin-bottom: 8px;
  }
  .pwa-toast button {
    border: 1px solid #8885;
    outline: none;
    margin-right: 5px;
    border-radius: 2px;
    padding: 3px 10px;
  }
</style>
