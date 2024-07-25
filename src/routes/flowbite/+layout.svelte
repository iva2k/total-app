<script lang="ts">
  import './styles.css';

  //   import { onMount, type Snippet } from 'svelte';

  //   import { page } from '$app/stores';
  //   page;

  import NavbarLayout from './NavbarLayout.svelte';
  import ResponsiveSidebarLayout from './ResponsiveSidebarLayout.svelte';

  //   let { children } = $props<{ children: Snippet }>();
</script>

<NavbarLayout>
  <ResponsiveSidebarLayout>
    <slot />

    <!--
    <div class="mx-auto flex w-full px-4">
      <main class="mx-auto w-full lg:ml-72">
        {@render children()}
      </main>
    </div>
    -->
  </ResponsiveSidebarLayout>
</NavbarLayout>

<style>
</style>
