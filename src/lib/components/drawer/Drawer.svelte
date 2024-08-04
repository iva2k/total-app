<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';

  import { focusTrap } from '$lib/actions/FocusTrap/focusTrap';

  export let open = false;
  export let duration = 0.2;
  export let placement = 'left';
  export let size: string | null = null;

  let mounted = false;
  const dispatch = createEventDispatcher();

  // TODO: (when needed) Convert to Svelte5 runes and snippets
  $: style = `--duration: ${duration}s; --size: ${size};`;

  function scrollLock(open: boolean) {
    if (mounted) {
      const body = document.querySelector('body');
      if (body) {
        body.style.overflow = open ? 'hidden' : 'auto';
      }
    }
  }

  $: scrollLock(open);

  function handleClickAway() {
    dispatch('clickAway');
  }
  function onKeydownWindow(e: KeyboardEvent): void {
    if (!open) return;
    if (e.code === 'Escape') dispatch('clickAway');
  }
  onMount(() => {
    mounted = true;
    scrollLock(open);
  });
</script>

<svelte:window on:keydown={onKeydownWindow} />

<aside class="drawer" class:open {style}>
  <div
    class="overlay"
    on:click={handleClickAway}
    role="button"
    tabindex="0"
    on:keydown
    on:keyup
    on:keypress
    use:focusTrap={true}
  ></div>
  <div class="panel {placement}" class:size>
    <slot>(No items)</slot>
  </div>
</aside>

<style lang="scss">
  /** For open / close we can't use `display: none / block` - it will break
    * animations on all elements, not just ones doing the `transition`.
    * So we use `visibility: hidden / visible`, and set transition to 0 on it.
    * We need `visibility: none` so drawer elements won't steal clicks from other elements.
    */
  .drawer {
    visibility: hidden;
    position: fixed;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    z-index: -1;
    transition:
      visibility 0s,
      z-index var(--duration) step-end;
  }

  .drawer.open {
    visibility: visible;
    z-index: 99;
    transition:
      visibility 0s,
      z-index var(--duration) step-start;
  }

  .overlay {
    visibility: hidden;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(100, 100, 100, 0.5);
    opacity: 0;
    z-index: 2;
    transition:
      visibility 0s,
      opacity var(--duration) ease;
  }

  .drawer.open .overlay {
    visibility: visible;
    opacity: 1;
  }

  .panel {
    position: fixed;
    width: 100%;
    height: 100%;
    background: white;
    z-index: 3;
    transition: transform var(--duration) ease;
    overflow: auto;
  }

  .panel.left {
    left: 0;
    transform: translate(-100%, 0);
  }

  .panel.right {
    right: 0;
    transform: translate(100%, 0);
  }

  .panel.top {
    top: 0;
    transform: translate(0, -100%);
  }

  .panel.bottom {
    bottom: 0;
    transform: translate(0, 100%);
  }

  .panel.left.size,
  .panel.right.size {
    max-width: var(--size);
  }

  .panel.top.size,
  .panel.bottom.size {
    max-height: var(--size);
  }

  .drawer.open .panel {
    transform: translate(0, 0);
  }
</style>
