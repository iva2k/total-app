<script lang="ts">
  import { type Snippet } from 'svelte';

  //   import { page } from '$app/stores';
  //   page;

  import NavbarLayout from '$lib/components/flowbite/NavbarLayout.svelte';
  import ResponsiveSidebarLayout from '$lib/components/flowbite/ResponsiveSidebarLayout.svelte';

  let { children } = $props<{ children: Snippet }>();
</script>

<NavbarLayout>
  {#snippet content()}
    <ResponsiveSidebarLayout>
      {#snippet content()}
        <div class="mx-auto flex w-full px-4">
          <main class="mx-auto w-full lg:ml-72">
            {@render children()}
          </main>
        </div>
      {/snippet}
    </ResponsiveSidebarLayout>
  {/snippet}
</NavbarLayout>
